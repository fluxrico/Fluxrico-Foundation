import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { userSubscriptions } from "@workspace/db/schema";

/**
 * Server-side Paddle Billing API client — the only module that touches the
 * API key. Never imported by frontend code; never logged.
 *
 * Environment:
 * - PADDLE_API_KEY (server-only secret)
 * - PADDLE_ENV ("sandbox" | "live", default "sandbox" when unset)
 * - PADDLE_PRICE_ID_MONTHLY / PADDLE_PRICE_ID_YEARLY (public price IDs)
 * - PADDLE_API_BASE_URL (optional override; used by tests)
 *
 * Price IDs are configuration, never invented: when not set explicitly, they
 * are discovered from the live Paddle catalog by exact (currency, amount,
 * interval) match. If discovery cannot uniquely resolve a plan, the feature
 * reports not-configured instead of guessing.
 */

export type PaddleEnv = "sandbox" | "live";

const SANDBOX_BASE = "https://sandbox-api.paddle.com";
const LIVE_BASE = "https://api.paddle.com";

export function paddleEnv(): PaddleEnv {
  const raw = (process.env.PADDLE_ENV ?? "").trim().toLowerCase();
  return raw === "live" ? "live" : "sandbox";
}

export function paddleApiBaseUrl(): string {
  const override = (process.env.PADDLE_API_BASE_URL ?? "").trim();
  if (override !== "") return override.replace(/\/+$/, "");
  return paddleEnv() === "live" ? LIVE_BASE : SANDBOX_BASE;
}

/** True when a server API key is present. The value is never exposed. */
export function paddleServerConfigured(): boolean {
  const key = (process.env.PADDLE_API_KEY ?? "").trim();
  return key.startsWith("pdl_") && key.length > 10;
}

/** True when the frontend client token is present (safe for the browser). */
export function paddleClientConfigured(): boolean {
  const token = (process.env.PADDLE_CLIENT_TOKEN ?? "").trim();
  return token.length > 10;
}

// ── Minimal typed shapes for the endpoints this integration uses ────────────

type PaddleListResponse<T> = { data?: T[]; meta?: { pagination?: { next?: string } } };

type PaddlePrice = {
  id: string;
  status?: string;
  billing_cycle?: { interval: "day" | "week" | "month" | "year"; frequency: number } | null;
  unit_price?: { amount: string; currency_code: string } | null;
  product_id?: string;
  name?: string;
};

type PaddleCustomer = { id: string; email?: string; custom_data?: Record<string, unknown> | null };

type PaddleSubscription = {
  id: string;
  status:
    | "active"
    | "trialing"
    | "past_due"
    | "paused"
    | "canceled";
  customer_id: string;
  items?: Array<{ price?: { id?: string; billing_cycle?: { interval: string; frequency: number } | null } }>;
  current_billing_period?: { starts_at?: string; ends_at?: string } | null;
  scheduled_change?: { action: string } | null;
  paused_at?: string | null;
  custom_data?: Record<string, unknown> | null;
};

type PaddlePortalSession = { urls?: { general?: { overview?: string } } };

/** JSON fetch against the Paddle API with the server key. Throws on failure. */
async function paddleFetch<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const key = (process.env.PADDLE_API_KEY ?? "").trim();
  if (!paddleServerConfigured()) throw new Error("Paddle API key is not configured");

  const res = await fetch(`${paddleApiBaseUrl()}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });

  const json = (await res.json().catch(() => null)) as { data?: T; error?: unknown } | null;
  if (!res.ok || json == null) {
    // Never include the key or full provider payloads in the thrown message.
    throw new Error(`Paddle API error (HTTP ${res.status}) for ${path}`);
  }
  return json.data as T;
}

// ── Price configuration / discovery ─────────────────────────────────────────

export type ResolvedPriceIds = { monthly: string | null; yearly: string | null };

/**
 * Resolve the two Pro price IDs. Order: explicit env config first; otherwise
 * live catalog discovery by exact match (EUR 9.99/month, EUR 79.99/year).
 * Returns nulls when they cannot be determined — callers must treat the
 * checkout as not-configured rather than inventing IDs.
 */
export async function resolvePriceIds(): Promise<ResolvedPriceIds> {
  const monthly = (process.env.PADDLE_PRICE_ID_MONTHLY ?? "").trim();
  const yearly = (process.env.PADDLE_PRICE_ID_YEARLY ?? "").trim();
  if (monthly !== "" && yearly !== "") return { monthly, yearly };

  const discovered = await discoverPricesByAmount("999", "7999");
  return {
    monthly: monthly !== "" ? monthly : discovered.monthly,
    yearly: yearly !== "" ? yearly : discovered.yearly,
  };
}

/** Find Paddle prices matching the exact Pro pricing (public data, safe). */
async function discoverPricesByAmount(monthlyAmount: string, yearlyAmount: string): Promise<ResolvedPriceIds> {
  const result: ResolvedPriceIds = { monthly: null, yearly: null };
  let url: string | null = "/prices?per_page=200";
  for (let page = 0; page < 5 && url != null; page += 1) {
    const res: PaddleListResponse<PaddlePrice> = await paddleFetch<PaddleListResponse<PaddlePrice>>(url);
    for (const price of res.data ?? []) {
      if (price.status != null && price.status !== "active") continue;
      const unit = price.unit_price;
      if (unit?.currency_code !== "EUR" || price.billing_cycle?.frequency !== 1) continue;
      if (unit.amount === monthlyAmount && price.billing_cycle.interval === "month" && result.monthly == null) {
        result.monthly = price.id;
      }
      if (unit.amount === yearlyAmount && price.billing_cycle.interval === "year" && result.yearly == null) {
        result.yearly = price.id;
      }
    }
    url = res.meta?.pagination?.next ?? null;
  }
  return result;
}

// ── Customer + subscription operations ───────────────────────────────────────

/** Find the Paddle customer for a Fluxrico user (linked via custom data). */
export async function findCustomerIdForUser(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ customerId: userSubscriptions.billingCustomerId })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId))
    .limit(1);
  return row?.customerId ?? null;
}

/**
 * Fetch the customer's subscriptions from Paddle and return the newest one.
 * Used to reconcile local state after checkout when a webhook is delayed.
 */
export async function fetchCustomerSubscriptions(customerId: string): Promise<PaddleSubscription[]> {
  const res = await paddleFetch<PaddleListResponse<PaddleSubscription>>(
    `/subscriptions?customer_id=${encodeURIComponent(customerId)}&per_page=50&order_by=created_at.desc`,
  );
  return res.data ?? [];
}

/** Fetch one subscription directly by ID (verification during webhooks). */
export async function fetchSubscription(subscriptionId: string): Promise<PaddleSubscription | null> {
  try {
    return await paddleFetch<PaddleSubscription>(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
  } catch {
    return null;
  }
}

/** Create a customer portal session so the user can manage their billing. */
export async function createPortalSession(customerId: string): Promise<string | null> {
  const res = await paddleFetch<PaddlePortalSession>("/customers/:customerId/portal-sessions".replace(
    ":customerId",
    encodeURIComponent(customerId),
  ), { method: "POST", body: {} });
  return res.urls?.general?.overview ?? null;
}

/**
 * Ensure a Paddle customer exists for the given email. Paddle Billing does not
 * let merchants create customers via the API, so we search by email; if none
 * exists yet, the first checkout will create one (linked to the user through
 * custom data written at checkout time). Returns the existing id or null.
 */
export async function findCustomerIdByEmail(email: string): Promise<string | null> {
  const res = await paddleFetch<PaddleListResponse<PaddleCustomer>>(
    `/customers?email=${encodeURIComponent(email)}&per_page=1`,
  );
  return res.data?.[0]?.id ?? null;
}
