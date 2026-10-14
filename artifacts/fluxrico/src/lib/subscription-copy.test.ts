import { describe, expect, it } from 'vitest';
import {
  isPaidSubscriptionEnded,
  planIntervalLabel,
  subscriptionStateLabel,
  trialRemainingCopy,
} from './subscription-copy';
import type { Subscription } from '@workspace/api-client-react';

/** The generated TypeScript type declares `plan` non-nullable, but the
 * runtime API omits/nulls it for any account without a real paid plan —
 * so trial fixtures deliberately carry null and the tests cast like the
 * server responds. */
function fixture(overrides: Partial<Record<keyof Subscription, unknown>>): Subscription {
  const base = {
    state: 'trialing' as const,
    hasProAccess: false,
    trialDaysRemaining: 2,
    trialStartedAt: '2026-10-12T00:00:00.000Z',
    trialEndsAt: '2026-10-15T00:00:00.000Z',
    trialLengthDays: 3,
    plan: null,
    trialEndedAgoMs: null,
  };
  return { ...base, ...overrides } as unknown as Subscription;
}

describe('isPaidSubscriptionEnded', () => {
  it('is false for a trialing account', () => {
    expect(isPaidSubscriptionEnded(fixture({ state: 'trialing', plan: null }))).toBe(false);
  });

  it('is false for an active paid subscription', () => {
    const plan = { interval: 'monthly' as const, status: 'active' as const, cancelAtPeriodEnd: false };
    expect(isPaidSubscriptionEnded(fixture({ state: 'pro', hasProAccess: true, plan }))).toBe(false);
  });

  it('is false when a trial expires with no plan (expired free trial)', () => {
    expect(
      isPaidSubscriptionEnded(fixture({ state: 'expired', trialDaysRemaining: 0, plan: null, trialEndedAgoMs: 0 })),
    ).toBe(false);
  });

  it('is true when a paid subscription exists but access has ended (canceled plan)', () => {
    const plan = { interval: 'yearly' as const, status: 'canceled' as const, cancelAtPeriodEnd: false };
    expect(
      isPaidSubscriptionEnded(fixture({ state: 'expired', trialDaysRemaining: 0, plan, trialEndedAgoMs: 0 })),
    ).toBe(true);
  });

  it('is false for null (nothing is known yet)', () => {
    expect(isPaidSubscriptionEnded(null)).toBe(false);
  });
});

describe('subscriptionStateLabel', () => {
  it('returns null when no data exists', () => {
    expect(subscriptionStateLabel(null)).toBeNull();
  });

  it('labels a trialing account', () => {
    expect(subscriptionStateLabel(fixture({ state: 'trialing' }))).toBe('Free trial');
  });

  it('labels an active paid subscription', () => {
    const plan = { interval: 'monthly' as const, status: 'active' as const, cancelAtPeriodEnd: false };
    expect(subscriptionStateLabel(fixture({ state: 'pro', hasProAccess: true, plan }))).toBe('Pro active');
  });

  it('labels an expired free trial distinctly from an ended paid subscription', () => {
    expect(subscriptionStateLabel(fixture({ state: 'expired', trialDaysRemaining: 0, plan: null }))).toBe(
      'Trial ended',
    );
    const plan = { interval: 'yearly' as const, status: 'canceled' as const, cancelAtPeriodEnd: false };
    expect(subscriptionStateLabel(fixture({ state: 'expired', trialDaysRemaining: 0, plan }))).toBe(
      'Subscription ended',
    );
  });
});

describe('planIntervalLabel and trialRemainingCopy', () => {
  it('maps yearly intervals to the annual label', () => {
    const plan = { interval: 'yearly' as const, status: 'active' as const, cancelAtPeriodEnd: false };
    expect(planIntervalLabel(fixture({ state: 'pro', plan }))).toBe('annual');
  });

  it('defaults to monthly when interval is not yearly', () => {
    expect(planIntervalLabel(fixture({ state: 'trialing' }))).toBe('monthly');
  });

  it('uses solely server-provided day counts, keeping pluralization honest', () => {
    expect(trialRemainingCopy(fixture({ trialDaysRemaining: 1 }))).toBe('Free trial — 1 day remaining of 3.');
    expect(trialRemainingCopy(fixture({ trialDaysRemaining: 2, trialLengthDays: 3 }))).toBe(
      'Free trial — 2 days remaining of 3.',
    );
  });
});
