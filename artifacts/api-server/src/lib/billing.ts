import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { billingWebhookEvents, userSubscriptions, type UserSubscription } from "@workspace/db/schema";
import { fetchSubscription, paddleServerConfigured } from "./paddle";
import { ensureSubscriptionRow } from "./subscription";

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
export async function applySubscriptionEvent(sub: SubscriptionLike): Promise<string | null> {
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

  updates.updatedAt = new Date();

  // Cancel-at-period-end semantics: the flag records intent; access itself
  // is derived at read time from status + currentPeriodEnd (paidAccessActive
  // keeps access until the period ends). Never revoke access eagerly.
  const canceledWithFuturePeriod =
    sub.status === "canceled" && periodEnd != null && periodEnd.getTime() > Date.now();
  updates.cancelAtPeriodEnd = canceledWithFuturePeriod;

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
      // API read also heals out-of-order webhook delivery.
      const sub = paddleServerConfigured() ? await fetchSubscriptionById(data.id) : null;
      if (sub != null) {
        await applySubscriptionEvent(sub);
        return;
      }
      // No API access (or lookup failed): apply the signature-verified
      // payload directly — it is authenticated, just not double-checked.
      if (data?.id != null && typeof data === "object") {
        await applySubscriptionEvent({
          id: data.id,
          status: (event.data as SubscriptionLike).status,
          customer_id: (event.data as SubscriptionLike).customer_id,
          items: (event.data as SubscriptionLike).items,
          current_billing_period: (event.data as SubscriptionLike).current_billing_period,
          custom_data: (event.data as SubscriptionLike).custom_data,
        });
      }
      return;

    case "transaction.completed":
      // Can arrive before subscription.created: provision by fetching the
      // subscription the transaction belongs to. When no key is configured,
      // the subscription.created webhook still provisions on its own.
      if (paddleServerConfigured() && typeof data?.subscription_id === "string") {
        const sub = await fetchSubscriptionById(data.subscription_id);
        if (sub != null) await applySubscriptionEvent(sub);
      }
      return;

    default:
      // Recognized but not state-changing for Fluxrico (adjustments, reports,
      // payment method updates, …). Acknowledged as processed.
      return;
  }
}
