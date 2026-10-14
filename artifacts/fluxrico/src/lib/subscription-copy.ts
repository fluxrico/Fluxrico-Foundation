import type { Subscription } from '@workspace/api-client-react';

/**
 * Pure subscription copy helpers — the one shared vocabulary for every surface
 * that presents subscription state (navigation, profile, settings, dashboard,
 * pro). Everything reads the server-provided Subscription shape; no surface
 * computes Pro access or trial remaining time locally, and nothing here ever
 * fabricates a state the server did not report.
 */

/**
 * True only when a real paid subscription exists but access has genuinely
 * ended. The server maps an expired *trial* and an ended *paid* subscription
 * to the same state ("expired") and distinguishes them only through the plan
 * payload (present with status "canceled" for ended paid access; null for a
 * trial that simply ran out). This is the single place that discriminator
 * lives, so every surface reads and words it the same way.
 */
export function isPaidSubscriptionEnded(subscription: Subscription | null): boolean {
  return subscription?.state === 'expired' && subscription.plan?.status === 'canceled';
}

/**
 * Compact lifecycle label for badges and status strips. Neutral surfaces
 * (not loaded, load failure) receive null and render no badge — never a
 * guessed state.
 */
export function subscriptionStateLabel(subscription: Subscription | null): string | null {
  if (!subscription) return null;
  if (subscription.state === 'pro') return 'Pro active';
  if (subscription.state === 'trialing') return 'Free trial';
  return isPaidSubscriptionEnded(subscription) ? 'Subscription ended' : 'Trial ended';
}

/** Human plan wording from the server-provided plan interval. */
export function planIntervalLabel(subscription: Subscription): 'annual' | 'monthly' {
  return subscription.plan?.interval === 'yearly' ? 'annual' : 'monthly';
}

/** Trial sentence built strictly from server-provided day counts. */
export function trialRemainingCopy(subscription: Subscription): string {
  const days = subscription.trialDaysRemaining;
  return `Free trial — ${days} ${days === 1 ? 'day' : 'days'} remaining of ${subscription.trialLengthDays}.`;
}
