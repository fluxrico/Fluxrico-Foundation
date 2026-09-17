import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { userSubscriptions, type UserSubscription } from "@workspace/db/schema";

/**
 * Subscription access model — server-side source of truth.
 *
 * States (derived, never client-settable):
 * - "trialing": registered, inside the 3-day trial window, no paid access.
 * - "pro": paid access active (subscription active, or canceled with access
 *   running to the end of the paid period).
 * - "expired": trial over and no paid access. The account, journey, profile,
 *   and settings remain fully intact — only Pro capabilities are blocked.
 *
 * Access checks always re-derive from the database row + current server time
 * on every request. There is no client flag, no cached boolean, no trust in
 * request data anywhere in this file.
 */

export const TRIAL_DAYS = 3;
const TRIAL_DURATION_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;

export type SubscriptionState = "trialing" | "pro" | "expired";

export type SubscriptionAccess = {
  state: SubscriptionState;
  /** Whether Pro-gated capabilities are currently allowed. == state === "pro" */
  hasProAccess: boolean;
  /** Whole days left in the trial; 0 on the final day / when expired. */
  trialDaysRemaining: number;
  trialStartedAt: string;
  trialEndsAt: string;
  /** Present only when a real subscription exists. */
  plan: { interval: "monthly" | "yearly"; status: string; cancelAtPeriodEnd: boolean } | null;
  /** Present only when state === "expired": when the trial ended. */
  trialEndedAgoMs?: number;
};

/** The paid state grants Pro access when active, or canceled-but-in-period. */
function paidAccessActive(sub: UserSubscription, now: Date): boolean {
  if (sub.status === "active") return true;
  if (sub.status === "canceled") {
    // Cancel-at-period-end: keep access until the paid period actually ends.
    return sub.currentPeriodEnd != null && sub.currentPeriodEnd.getTime() > now.getTime();
  }
  return false;
}

/** Pure derivation from a subscription row + a timestamp — trivially testable. */
export function deriveSubscriptionState(sub: UserSubscription, now: Date = new Date()): SubscriptionAccess {
  const pro = paidAccessActive(sub, now);
  const trialing = !pro && now.getTime() < sub.trialEndsAt.getTime();

  const state: SubscriptionState = pro ? "pro" : trialing ? "trialing" : "expired";
  const daysRemaining = trialing
    ? Math.max(0, Math.floor((sub.trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
    : 0;

  return {
    state,
    hasProAccess: pro,
    trialDaysRemaining: daysRemaining,
    trialStartedAt: sub.trialStartedAt.toISOString(),
    trialEndsAt: sub.trialEndsAt.toISOString(),
    plan:
      sub.status !== "none" && sub.billingInterval != null
        ? {
            interval: sub.billingInterval as "monthly" | "yearly",
            status: sub.status,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          }
        : null,
    trialEndedAgoMs:
      state === "expired" ? Math.max(0, now.getTime() - sub.trialEndsAt.getTime()) : undefined,
  };
}

/** Start the 3-day trial at registration time. Called by the register route. */
export async function provisionTrialForNewUser(userId: string, now: Date = new Date()): Promise<void> {
  await db.insert(userSubscriptions).values({
    userId,
    trialStartedAt: now,
    trialEndsAt: new Date(now.getTime() + TRIAL_DURATION_MS),
  });
}

/**
 * Resolve the subscription for an existing user, lazily backfilling pre-Phase-1
 * accounts: their trial simply starts at first resolution, so nobody's account
 * is invalidated and no journey data is touched. Safe under concurrency —
 * a duplicate insert races to the primary key and re-reads instead.
 */
export async function resolveSubscription(userId: string, now: Date = new Date()): Promise<SubscriptionAccess> {
  let [row] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, userId)).limit(1);

  if (!row) {
    const inserted = await db
      .insert(userSubscriptions)
      .values({
        userId,
        trialStartedAt: now,
        trialEndsAt: new Date(now.getTime() + TRIAL_DURATION_MS),
      })
      .onConflictDoNothing({ target: userSubscriptions.userId })
      .returning();
    row = inserted[0] ?? (await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, userId)).limit(1))[0];
  }

  if (!row) {
    // The user row exists but resolution failed; fail closed to expired so
    // access is never granted on an unresolved state.
    return {
      state: "expired",
      hasProAccess: false,
      trialDaysRemaining: 0,
      trialStartedAt: now.toISOString(),
      trialEndsAt: now.toISOString(),
      plan: null,
    };
  }

  return deriveSubscriptionState(row, now);
}

export type { UserSubscription };
