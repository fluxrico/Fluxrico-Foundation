import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
// Bare workspace specifiers (@workspace/db, @workspace/api-zod) resolve via
// package exports that point at .ts sources — unresolvable in Vercel's classic
// Node runtime, where traced .ts files are transpiled and renamed to .js.
// Extensionless relative specifiers resolve in every mode: TypeScript
// (bundler), esbuild, and the Vercel runtime (extensionless file fallback).
import { db } from "../../../../lib/db/src/index.js";
import { billingWebhookEvents, userSubscriptions, type UserSubscription } from "../../../../lib/db/src/schema/index.js";
import { fetchSubscription, paddleServerConfigured } from "./paddle.js";
import { ensureSubscriptionRow } from "./subscription.js";

/**
 * Billing event core — Paddle → Fluxrico subscription state.
 *
 * Security model:
 * - Every webhook is authenticated with Paddle's official signature scheme:
 *   HMAC-SHA256 over `ts:<timestamp>;h1:<signed payload>` with the webhook
 *   secret as key, against the raw request body. Paddle's timestamp window
 *   (5s default tolerance) is enforced here against replay.
 * - The body is only ever parsed after the signature check passes.
 * - Events are applied idempotently via the billing_webhook_events ledger:
 *   the unique (provider, event_id) insert is the processing gate.
 * - Subscription objects can carry a mismatched customer; we verify against
 *   Paddle (when the server key allows it) or trust only the signature-
 *   verified payload, never any client claim.
 *
 * User ↔ customer link: Paddle passes a signed-in Fluxrico user id through
 * checkout `custom_data` ({ "fluxricoUserId": <uuid> }); every webhook echoes
 * that id, so a verified purchase is always attached to the right user. When
 * the user already has a linked customer, purchases are constrained to that
 * customer server-side.
 */

const PROVIDER = "paddle";

// ── Signature verification (official Paddle scheme) ─────────────────────────

/**
 * Verify a Paddle webhook signature against the raw body.
 * Paddle signs `ts:<timestamp>;h1:<body sha256 hex>` with the notification
 * webhook secret. Also enforces Paddle's default 5-second replay window.
 */
export function verifyPaddleSignature(rawBody: string, signatureHeader: string | undefined, secret: string | undefined, now: Date = new Date()): boolean {
  if (!signatureHeader || !secret) return false;
  const parts = signatureHeader.split(";").map((p) => p.trim());
  let ts: string | null = null;
  let h1: string | null = null;
  for (const part of parts) {
    if (part.startsWith("ts=")) ts = part.slice(3);
    if (part.startsWith("h1=")) h1 = part.slice(3);
  }
  if (ts == null || h1 == null || ts === "" || h1 === "") return false;

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return false;
  // Paddle's default tolerance is 5 seconds; allow a small scheduling slack.
  if (Math.abs(now.getTime() / 1000 - tsNum) > 5) return false;

  const expected = crypto.createHmac("sha256", secret).update(`ts:${ts};h1:${crypto.createHash("sha256").update(rawBody).digest("hex")}`).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(h1, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function paddleWebhookConfigured(): boolean {
  const secret = (process.env.PADDLE_WEBHOOK_SECRET ?? "").trim();
  return secret.length > 10;
}

// ── Event application ────────────────────────────────────────────────────────

export type WebhookEvent = {
  eventId: string;
  eventType: string;
  occurredAt?: string;
  data?: unknown;
};

/** Paddle notifications are JSON with snake_case top-level fields. */
type RawWebhookEvent = {
  event_id?: unknown;
  event_type?: unknown;
  occurred_at?: unknown;
  data?: unknown;
};

/** Map a Paddle subscription status to the local lifecycle vocabulary. */
function localStatusFor(paddleStatus: PaddleSubscriptionStatusLike): "active" | "canceled" | null {
  switch (paddleStatus) {
    case "active":
    case "trialing":
    case "past_due":
      // Paddle's "trialing" is Paddle-side trial logic (not used here) and
      // "past_due" still counts as an in-period attempt to pay; keep access
      // and let Paddle's own dunning decide when the period truly ends.
      return "active";
    case "paused":
      // A paused subscription retains its period end; access continues to the
      // end of the current paid period, then lapses naturally.
      return "active";
    case "canceled":
      return "canceled";
    default:
      return null;
  }
}

type PaddleSubscriptionStatusLike = "active" | "trialing" | "past_due" | "paused" | "canceled";

/**
 * Where the subscription state in a call to applySubscriptionEvent came
 * from — selects whether staleness guards apply. "fetched" means the state
 * was read live from Paddle's API (current provider truth, applied as-is);
 * "payload" means the state was reconstructed from a signature-verified
 * webhook payload, which may be an old, out-of-order redelivery.
 */
export type EventSource = "fetched" | "payload";

/**
 * Parse an event's occurred_at strictly into a Date. Returns null for
 * missing or unparseable values, so an invalid timestamp is never treated
 * as proof of freshness anywhere downstream (it can only ever *reject* a
 * suspect event, never grant it acceptance — see applySubscriptionEvent).
 */
export function parseOccurredAt(occurredAt: string | null | undefined): Date | null {
  if (typeof occurredAt !== "string" || occurredAt.length === 0) return null;
  const t = Date.parse(occurredAt);
  return Number.isFinite(t) ? new Date(t) : null;
}

type SubscriptionLike = {
  id: string;
  status: PaddleSubscriptionStatusLike;
  customer_id: string;
  items?: Array<{ price?: { id?: string; billing_cycle?: { interval: string; frequency: number } | null } }>;
  current_billing_period?: { starts_at?: string; ends_at?: string } | null;
  custom_data?: Record<string, unknown> | null;
};

/** Pull the Fluxrico user id from the payload's custom_data (written by us). */
function userIdFromCustomData(data: Record<string, unknown> | null | undefined): string | null {
  const raw = data?.["fluxricoUserId"];
  if (typeof raw !== "string" || raw.length === 0) return null;
  return raw;
}

function billingIntervalFromPrice(price: { billing_cycle?: { interval: string; frequency: number } | null } | undefined): "monthly" | "yearly" | null {
  const cycle = price?.billing_cycle;
  if (!cycle || cycle.frequency !== 1) return null;
  if (cycle.interval === "month") return "monthly";
  if (cycle.interval === "year") return "yearly";
  return null;
}

/**
 * Apply a verified subscription event to the owning user's row.
 * Returns the affected userId, or null when the event carries no usable
 * user link (nothing to do; never fabricates state).
 */
export async function applySubscriptionEvent(
  sub: SubscriptionLike,
  source: EventSource = "fetched",
  occurredAt: string | null = null,
): Promise<string | null> {
  const userId = userIdFromCustomData(sub.custom_data);
  if (userId == null) return null;

  // Ensure the row exists. The webhook can legitimately be the first write
  // for an account (purchase without a prior resolved trial row): the trial
  // fields are provisioned with zero duration, since the user paid directly
  // and has no trial left to spend. Existing rows keep their trial values.
  const row = await ensureSubscriptionRow(userId, new Date(), 0);
  if (row == null) return null;

  const price = sub.items?.[0]?.price;
  const interval = billingIntervalFromPrice(price);
  const localStatus = localStatusFor(sub.status);

  const periodStart = sub.current_billing_period?.starts_at != null ? new Date(sub.current_billing_period.starts_at) : null;
  const periodEnd = sub.current_billing_period?.ends_at != null ? new Date(sub.current_billing_period.ends_at) : null;

  const updates: Partial<UserSubscription> = {};

  if (localStatus != null) updates.status = localStatus;
  if (interval != null) updates.billingInterval = interval;
  if (periodStart != null) updates.currentPeriodStart = periodStart;
  if (periodEnd != null) updates.currentPeriodEnd = periodEnd;

  updates.billingCustomerId = sub.customer_id;
  updates.billingSubscriptionId = sub.id;
  if (price?.id != null) updates.billingPriceId = price.id;

  // Cancel-at-period-end semantics: the flag records intent; access itself
  // is derived at read time from status + currentPeriodEnd (paidAccessActive
  // keeps access until the period ends). Never revoke access eagerly.
  const canceledWithFuturePeriod =
    sub.status === "canceled" && periodEnd != null && periodEnd.getTime() > Date.now();
  updates.cancelAtPeriodEnd = canceledWithFuturePeriod;

  // Evidence gate: refresh the freshness anchor (updatedAt) only when this
  // verified event carries subscription-status or billing-period evidence
  // that actually differs from the stored row. Routine re-deliveries that
  // carry no new state (e.g. subscription.updated echoing billing-detail or
  // scheduled-change metadata) previously stamped updatedAt on every hit,
  // repeatedly extending the fallback grace window. The comparison here is
  // strictly against the row's stored paid-state fields from the signature-
  // verified payload; updatedAt/occurredAt are never treated as evidence of
  // payment.
  //
  // ── Staleness guards (payload path only) ─────────────────────────────────
  //
  // "fetched" state is Paddle's current truth (read live from the Paddle API
  // for this exact subscription id moments ago) and always applies. "payload"
  // state was reconstructed from a single signed event that may be an old,
  // out-of-order redelivery. Rather than trusting timestamps as proof of
  // freshness, guards here use monotone invariants that hold for Paddle
  // Billing subscriptions regardless of delivery order:
  //
  //  a) A Paddle Billing subscription whose status is "canceled" can never
  //     resume to active/past_due/paused/trialing under the same sub_ id
  //     ("You can't resume a canceled subscription"). So a payload-path
  //     active-status event against a row canceled under the SAME id is
  //     necessarily stale — drop it. A resubscription is a NEW sub_ id and
  //     is handled by (c). The same holds for a row with a recorded
  //     cancel-at-period-end intent (cancelAtPeriodEnd = true): that intent
  //     can only be legitimately reversed when confirmed by Paddle's
  //     current state (the "fetched" path), so a payload alone may not
  //     clear the flag. Period maturity still clears it: a canceled-status
  //     payload with a past/absent period end does not map to non-canceled
  //     status and is untouched by this guard.
  //  b) A real renewal moves current_billing_period forward. A payload
  //     whose period ends strictly earlier than the stored one is stale —
  //     drop it.
  //  c) A different subscription id is never proof of payment, freshness,
  //     or authority to replace the row (requirement 3). When the payload
  //     id differs from the stored one, fail closed for the mutation
  //     unless the row has no subscription yet (status "none") — the only
  //     case where a differing id is legitimately the FIRST ever id for
  //     the user (provisioning via subscription.created). Legitimate
  //     resubscription under a new id therefore needs either the fetched
  //     path (always applied) or a single crossing of this "none" state;
  //     when it cannot be established that the new id is the user's real
  //     current subscription, no write happens (fail closed).
  const payloadSource = source === "payload";
  const sameSub = row.billingSubscriptionId == null || row.billingSubscriptionId === sub.id;
  const rowCanceled = row.status === "canceled";
  const rowPeriodEnd = row.currentPeriodEnd?.getTime() ?? null;

  // (c) differing id on the payload path + a row that already had a
  // subscription: cannot establish legitimacy of the replacement → no
  // mutation. (The fetched path is unaffected; resubscription via the API
  // read still applies normally.)
  if (payloadSource && !sameSub && row.status !== "none") return userId;

  // (a) stale reactivation of a canceled row under the same id — and,
  // payload path only, a same-id non-canceled event that would wipe a
  // recorded cancelAtPeriodEnd intent. Fetched current Paddle state (which
  // never reaches this guard) still legitimately reflects a reversal.
  if (
    payloadSource &&
    sameSub &&
    localStatus != null &&
    localStatus !== "canceled" &&
    (rowCanceled || row.cancelAtPeriodEnd === true)
  )
    return userId;

  // (b) stale period rollback: payload ends strictly before stored end.
  if (
    payloadSource &&
    sameSub &&
    rowPeriodEnd != null &&
    periodEnd != null &&
    periodEnd.getTime() < rowPeriodEnd
  )
    return userId;

  // Sanity: occurredAt, when supplied, must parse — an invalid or missing
  // timestamp is simply not usable for ordering (never treated as proof of
  // freshness); the guards above do not depend on it. Validating it here
  // keeps the dead value honest: if future ordering logic uses it, the
  // contract is already enforced.
  if (occurredAt != null && parseOccurredAt(occurredAt) == null) return userId;

  const hasNewEvidence =
    (localStatus != null && localStatus !== row.status) ||
    (interval != null && interval !== row.billingInterval) ||
    (periodStart != null && (row.currentPeriodStart?.getTime() ?? null) !== periodStart.getTime()) ||
    (periodEnd != null && (row.currentPeriodEnd?.getTime() ?? null) !== periodEnd.getTime()) ||
    canceledWithFuturePeriod !== row.cancelAtPeriodEnd;

  if (!hasNewEvidence) return userId;

  updates.updatedAt = new Date();

  await db.update(userSubscriptions).set(updates).where(eq(userSubscriptions.userId, userId));
  return userId;
}

// ── Webhook entry point: verify → gate → route → apply ─────────────────────

/**
 * Process one raw webhook delivery end-to-end.
 *
 * Returns { ok: true, duplicate?: true } for accepted deliveries (processed
 * now or previously) and { ok: false, status } for rejections. Never throws:
 * provider retries are the recovery mechanism for transient failures.
 */
export async function handlePaddleWebhook(
  rawBody: string,
  signatureHeader: string | undefined,
  fetchSubscriptionById: typeof fetchSubscription = fetchSubscription,
): Promise<{ ok: true; duplicate?: boolean } | { ok: false; status: 400 | 500 }> {
  const secret = (process.env.PADDLE_WEBHOOK_SECRET ?? "").trim();
  if (!paddleWebhookConfigured() || !verifyPaddleSignature(rawBody, signatureHeader, secret)) {
    return { ok: false, status: 400 };
  }

  let event: WebhookEvent;
  try {
    const raw = JSON.parse(rawBody) as RawWebhookEvent;
    if (typeof raw.event_id !== "string" || typeof raw.event_type !== "string") {
      return { ok: false, status: 400 };
    }
    event = {
      eventId: raw.event_id,
      eventType: raw.event_type,
      occurredAt: typeof raw.occurred_at === "string" ? raw.occurred_at : undefined,
      data: raw.data,
    };
  } catch {
    return { ok: false, status: 400 };
  }

  // Idempotency gate: the unique (provider, event_id) insert claims this
  // delivery. A conflict means we already processed it — acknowledge without
  // reprocessing. The gate row is deleted on failure so Paddle's retry can
  // find it unprocessed.
  let claimed = false;
  try {
    const inserted = await db
      .insert(billingWebhookEvents)
      .values({ provider: PROVIDER, eventId: event.eventId, eventType: event.eventType })
      .onConflictDoNothing({ target: [billingWebhookEvents.provider, billingWebhookEvents.eventId] })
      .returning({ id: billingWebhookEvents.id });
    if (inserted.length === 0) return { ok: true, duplicate: true };
    claimed = true;
  } catch {
    return { ok: false, status: 500 };
  }

  try {
    await routePaddleEvent(event, fetchSubscriptionById);
    await db
      .update(billingWebhookEvents)
      .set({ processedAt: new Date() })
      .where(and(eq(billingWebhookEvents.provider, PROVIDER), eq(billingWebhookEvents.eventId, event.eventId)));
    return { ok: true };
  } catch {
    // Undo the gate so a redelivery is processed again; report failure so
    // Paddle retries with backoff.
    await db
      .delete(billingWebhookEvents)
      .where(and(eq(billingWebhookEvents.provider, PROVIDER), eq(billingWebhookEvents.eventId, event.eventId)));
    return { ok: false, status: 500 };
  }
}

/** Route one verified event to the state-changing handler. */
async function routePaddleEvent(event: WebhookEvent, fetchSubscriptionById: typeof fetchSubscription): Promise<void> {
  const data = event.data as
    | { id?: string; subscription_id?: string; custom_data?: Record<string, unknown> | null }
    | undefined;

  switch (event.eventType) {
    case "subscription.created":
    case "subscription.updated":
    case "subscription.canceled":
    case "subscription.paused":
    case "subscription.resumed":
    case "subscription.past_due":
    case "subscription.trialing":
      if (data?.id == null) return;
      // Prefer live verification against the Paddle API when the server key
      // is configured — the payload is already signature-trusted, but the
      // API read also heals out-of-order webhook delivery and is applied as
      // current provider truth ("fetched", no staleness guards needed).
      const sub = paddleServerConfigured() ? await fetchSubscriptionById(data.id) : null;
      if (sub != null) {
        await applySubscriptionEvent(sub, "fetched");
        return;
      }
      // No API access (or lookup failed): apply the signature-verified
      // payload directly — it is authenticated, just not double-checked, and
      // may be stale, so the payload staleness guards apply ("payload").
      if (data?.id != null && typeof data === "object") {
        await applySubscriptionEvent(
          {
            id: data.id,
            status: (event.data as SubscriptionLike).status,
            customer_id: (event.data as SubscriptionLike).customer_id,
            items: (event.data as SubscriptionLike).items,
            current_billing_period: (event.data as SubscriptionLike).current_billing_period,
            custom_data: (event.data as SubscriptionLike).custom_data,
          },
          "payload",
          event.occurredAt ?? null,
        );
      }
      return;

    case "transaction.completed":
      // Can arrive before subscription.created: provision by fetching the
      // subscription the transaction belongs to. When no key is configured,
      // the subscription.created webhook still provisions on its own.
      if (paddleServerConfigured() && typeof data?.subscription_id === "string") {
        const sub = await fetchSubscriptionById(data.subscription_id);
        // Fetch-based: this is current provider truth — applies as-is.
        if (sub != null) await applySubscriptionEvent(sub, "fetched");
      }
      return;

    default:
      // Recognized but not state-changing for Fluxrico (adjustments, reports,
      // payment method updates, …). Acknowledged as processed.
      return;
  }
}
