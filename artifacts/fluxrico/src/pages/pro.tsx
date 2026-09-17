import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { AppShell, PageHeader } from '@/components/app-shell';
import { useSubscriptionState } from '@/lib/subscription-state';
import { useAuthState } from '@/lib/auth-state';
import { getBillingConfig } from '@workspace/api-client-react';
import type { BillingConfigResponse } from '@workspace/api-client-react';
import { openCheckout } from '@/lib/paddle-checkout';

/**
 * Fluxrico Pro — pricing & upgrade surface with real Paddle checkout.
 *
 * The plan cards keep the Phase 1 presentation; the CTAs now open Paddle's
 * overlay checkout with the real price IDs served by GET /api/billing/config.
 * Nothing is assumed to have succeeded: after the overlay closes the page
 * re-syncs the server-derived subscription state (the webhook may still be in
 * flight, shown honestly as "confirming"). When Paddle is not configured yet,
 * the CTAs stay disabled with an honest reason — never a fake success.
 *
 * Positioning: "Free helps you find your direction." / "Pro helps you turn
 * that direction into progress."
 */

const PLANS = {
  monthly: { price: '€9.99', period: '/ month', note: 'Billed monthly. Cancel anytime.' },
  annual: { price: '€79.99', period: '/ year', note: 'Billed annually — two months free vs monthly.' },
} as const;

/** Capabilities shipped with Pro at launch, and what is still coming. */
const PRO_CAPABILITIES = [
  'Continuous next moves',
  'Deeper guidance',
  'Personalized roadmap',
  'Advanced progress',
  'Unlimited library',
  'Journey history',
  'Insights',
] as const;

const COMING_CAPABILITIES = ['Future Pro tools'] as const;

const CONFIG_REASON_COPY: Record<string, string> = {
  client_token_missing: 'Billing setup is in progress — the Paddle client token is not configured yet.',
  api_key_missing: 'Billing setup is in progress — the Paddle API key is not configured yet.',
  price_monthly_unresolved: 'Billing setup is in progress — the monthly plan could not be matched in Paddle yet.',
  price_yearly_unresolved: 'Billing setup is in progress — the annual plan could not be matched in Paddle yet.',
  unknown: 'Billing setup is in progress. Please try again shortly.',
};

type CheckoutPhase = 'idle' | 'opening' | 'confirming' | 'updated' | 'closed' | 'error';

export default function Pro() {
  const { user } = useAuthState();
  const { subscription, status, refresh, isPro } = useSubscriptionState();

  const [config, setConfig] = useState<BillingConfigResponse['billing'] | null>(null);
  const [configStatus, setConfigStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [checkoutPhase, setCheckoutPhase] = useState<CheckoutPhase>('idle');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const confirmTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const loadConfig = useCallback(async () => {
    setConfigStatus('loading');
    try {
      const response = await getBillingConfig();
      setConfig(response.billing);
      setConfigStatus('ready');
    } catch {
      // Honest failure: no config means no checkout; the page still renders.
      setConfig(null);
      setConfigStatus('error');
    }
  }, []);

  // Returning from anywhere re-syncs the server state so the page reflects
  // reality, never a stale cache.
  useEffect(() => {
    void refresh();
    void loadConfig();
  }, [refresh, loadConfig]);

  // Clear any pending confirmation timers on unmount.
  useEffect(() => {
    const timers = confirmTimers;
    return () => {
      for (const timer of timers.current) clearTimeout(timer);
      timers.current = [];
    };
  }, []);

  const startCheckout = async (plan: 'monthly' | 'annual') => {
    if (!config || !config.checkoutAvailable || config.clientToken == null) return;
    const priceId = plan === 'monthly' ? config.prices.monthly : config.prices.yearly;
    if (priceId == null || user == null) return;

    setCheckoutError(null);
    setCheckoutPhase('opening');
    try {
      const result = await openCheckout({
        environment: config.environment,
        clientToken: config.clientToken,
        priceId,
        customerEmail: user.email,
        fluxricoUserId: user.id,
      });

      if (result.status === 'completed') {
        // Payment accepted by Paddle; the webhook may still be in flight.
        // Confirm by re-reading the server state — never fabricate Pro here.
        setCheckoutPhase('confirming');
        const attempts = [1500, 3500, 6500, 10000];
        for (const delay of attempts) {
          confirmTimers.current.push(
            setTimeout(async () => {
              await refresh();
              if (latestStateRef.current === 'pro') setCheckoutPhase('updated');
            }, delay),
          );
        }
        confirmTimers.current.push(
          setTimeout(() => {
            setCheckoutPhase((phase) => (phase === 'confirming' ? 'error' : phase));
            setCheckoutError(
              'Your payment was received. Subscription confirmation is taking longer than expected — this page updates automatically once it completes. You can also check back in Settings.',
            );
          }, attempts[attempts.length - 1] + 1000),
        );
      } else {
        // User closed the overlay without paying; nothing happened.
        setCheckoutPhase('closed');
      }
    } catch {
      setCheckoutPhase('error');
      setCheckoutError('Checkout could not be opened. Please check your connection and try again.');
    }
  };

  // Confirmation timers close over this ref, updated on every render, so
  // they always read the latest server-derived state without stale closures.
  const latestStateRef = useRef<string | null>(subscription?.state ?? null);
  latestStateRef.current = subscription?.state ?? null;

  const firstName = (user?.name ?? '').trim().split(/\s+/)[0] || 'there';

  const stateCopy: Record<
    string,
    { eyebrow: string; title: string; description: string }
  > = {
    trialing: {
      eyebrow: `Fluxrico Pro · ${subscription?.trialDaysRemaining ?? 0} ${
        (subscription?.trialDaysRemaining ?? 0) === 1 ? 'day' : 'days'
      } of trial left`,
      title: 'Turn your direction into progress.',
      description:
        'Free helps you find your direction. Pro helps you turn that direction into progress — continuous next moves, deeper guidance, and a roadmap that adapts as you do.',
    },
    expired: {
      eyebrow: 'Your Fluxrico trial has ended',
      title: 'Your journey stays. Pro takes it further.',
      description:
        'Everything you built — direction, roadmap, library, history — is exactly where you left it. Pro unlocks the advanced tools that keep it moving forward.',
    },
    pro: {
      eyebrow: 'Fluxrico Pro · Active',
      title: 'Pro is active on your account.',
      description: 'Every Pro capability below is included in your plan. Thank you for building with us.',
    },
    // signed-out / error / not-yet-loaded: neutral, honest framing
    neutral: {
      eyebrow: 'Fluxrico Pro',
      title: 'Turn your direction into progress.',
      description:
        'Free helps you find your direction. Pro helps you turn that direction into progress.',
    },
  };

  const key = isPro ? 'pro' : subscription?.state === 'expired' ? 'expired' : subscription?.state === 'trialing' ? 'trialing' : 'neutral';
  const copy = stateCopy[key] ?? stateCopy.neutral;
  const alreadyPro = isPro;
  const checkoutBusy = checkoutPhase === 'opening' || checkoutPhase === 'confirming';

  const planButton = (plan: 'monthly' | 'annual', label: string, classes: string, testId: string) => {
    const disabled =
      alreadyPro ||
      checkoutBusy ||
      configStatus !== 'ready' ||
      !config?.checkoutAvailable ||
      (plan === 'monthly' ? config?.prices.monthly : config?.prices.yearly) == null;
    const reason =
      configStatus === 'error'
        ? 'Billing configuration could not be loaded. Please refresh and try again.'
        : configStatus === 'ready' && config != null && !config.checkoutAvailable
          ? (CONFIG_REASON_COPY[config.reason ?? 'unknown'] ?? CONFIG_REASON_COPY.unknown)
          : null;

    return (
      <>
        <button
          type="button"
          disabled={disabled}
          onClick={() => void startCheckout(plan)}
          className={`${classes} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
          data-testid={testId}
        >
          {checkoutPhase === 'opening' && !alreadyPro ? (
            <>
              <Loader2 size={14} className="mr-2 animate-spin" aria-hidden="true" /> Opening checkout…
            </>
          ) : alreadyPro ? (
            'Included in your plan'
          ) : (
            label
          )}
        </button>
        <p className="mt-3 text-xs leading-5 text-[#888AA4]">
          {reason ?? 'Secure checkout by Paddle. Cancel anytime from Settings.'}
        </p>
      </>
    );
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1000px]">
        <PageHeader
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
        />

        {/* Checkout feedback strip — every state is honest, none fakes success. */}
        {checkoutPhase === 'confirming' && (
          <div
            className="mt-6 flex items-center gap-3 rounded-2xl border border-[#DADBF0] bg-white px-5 py-3.5 text-xs font-semibold text-[#565980]"
            role="status"
            data-testid="pro-checkout-confirming"
          >
            <Loader2 size={15} className="animate-spin text-[#4C37EB]" aria-hidden="true" />
            Payment received — confirming your subscription. This page updates automatically.
          </div>
        )}
        {checkoutPhase === 'updated' && (
          <div
            className="mt-6 flex items-center gap-3 rounded-2xl border border-[#CBE9D6] bg-[#EFFAF3] px-5 py-3.5 text-xs font-semibold text-[#1F7A4D]"
            role="status"
            data-testid="pro-checkout-updated"
          >
            <Check size={15} strokeWidth={2.4} aria-hidden="true" />
            You're subscribed — Pro is active on your account.
          </div>
        )}
        {checkoutPhase === 'error' && checkoutError != null && (
          <div
            className="mt-6 flex items-start gap-3 rounded-2xl border border-[#F0DAD2] bg-[#FDF6F2] px-5 py-3.5 text-xs font-semibold text-[#A05B2E]"
            role="alert"
            data-testid="pro-checkout-error"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            {checkoutError}
          </div>
        )}

        {/* State strip: mirrors the server-derived state, never a client flag. */}
        {status === 'ready' && subscription && (
          <div
            className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-[#DADBF0] bg-white px-5 py-3.5 text-xs font-semibold text-[#565980]"
            data-testid="pro-state-strip"
          >
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] ${
                subscription.state === 'pro'
                  ? 'bg-[#E4F9EF] text-[#1F7A4D]'
                  : subscription.state === 'trialing'
                    ? 'bg-[#F0EFFF] text-[#5147C2]'
                    : 'bg-[#FDF1EC] text-[#A05B2E]'
              }`}
              data-testid="pro-state-badge"
            >
              {subscription.state === 'pro' ? 'Pro active' : subscription.state === 'trialing' ? 'Free trial' : 'Trial ended'}
            </span>
            {subscription.state === 'trialing' &&
              `${subscription.trialDaysRemaining} ${subscription.trialDaysRemaining === 1 ? 'day' : 'days'} remaining in your 3-day trial.`}
            {subscription.state === 'expired' &&
              'Your journey data is safe. Pro is required for the advanced capabilities below.'}
            {subscription.state === 'pro' &&
              subscription.plan &&
              `Plan: ${subscription.plan.interval === 'yearly' ? 'Annual' : 'Monthly'}${subscription.plan.cancelAtPeriodEnd ? ' · renews off at period end' : ''}.`}
          </div>
        )}

        {/* Plans */}
        <div className="fluxrico-rise mt-8 grid gap-5 md:grid-cols-2">
          {/* Monthly */}
          <section
            className="rounded-[1.65rem] border border-[#DADBF0] bg-white p-7 shadow-[0_8px_28px_rgba(44,42,123,0.035)]"
            data-testid="plan-monthly"
          >
            <p className="text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#6861C8]">Monthly</p>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-[2.6rem] font-extrabold leading-none tracking-[-0.04em] text-[#25265A]">€9.99</span>
              <span className="text-sm font-semibold text-[#8587A3]">/ month</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#8587A3]">Billed monthly. Cancel anytime.</p>
            <div className="mt-6">
              {planButton(
                'monthly',
                'Start monthly',
                'fluxrico-focus inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#4C37EB] bg-white px-5 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#4C37EB] transition-colors hover:bg-[#F5F4FF] sm:w-auto sm:px-8',
                'button-pro-monthly',
              )}
            </div>
          </section>

          {/* Annual — recommended */}
          <section
            className="relative rounded-[1.65rem] border-2 border-[#4C37EB] bg-white p-7 shadow-[0_12px_34px_rgba(76,55,235,0.10)]"
            data-testid="plan-annual"
          >
            <span
              className="absolute -top-3 left-6 rounded-full bg-[#4C37EB] px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-white"
              data-testid="badge-plan-recommended"
            >
              Recommended · Best value
            </span>
            <p className="text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#4C37EB]">Annual</p>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-[2.6rem] font-extrabold leading-none tracking-[-0.04em] text-[#25265A]">€79.99</span>
              <span className="text-sm font-semibold text-[#8587A3]">/ year</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#8587A3]">
              Billed annually — two months free vs monthly.
            </p>
            <div className="mt-6">
              {planButton(
                'annual',
                'Go annual',
                'fluxrico-focus inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#4C37EB] px-5 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#3F2CC9] sm:w-auto sm:px-8',
                'button-pro-annual',
              )}
            </div>
          </section>
        </div>

        {/* Capabilities: shipped vs coming, stated plainly. */}
        <section className="fluxrico-rise fluxrico-rise-delay-1 mt-8 rounded-[1.65rem] border border-[#DADBF0] bg-white p-7 shadow-[0_8px_28px_rgba(44,42,123,0.035)]" data-testid="pro-capabilities">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0EEFF] text-[#6861C8]">
              <Sparkles size={17} strokeWidth={1.8} />
            </span>
            <h2 className="text-lg font-extrabold tracking-[-0.03em] text-[#25265A]">What Pro includes</h2>
          </div>

          <div className="mt-5 grid gap-x-10 gap-y-3 sm:grid-cols-2">
            {PRO_CAPABILITIES.map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-sm leading-6 text-[#565980]">
                <Check size={16} strokeWidth={2.4} className="mt-1 shrink-0 text-[#4C37EB]" aria-hidden="true" />
                {item}
              </div>
              ))}
          </div>

          <div className="mt-6 border-t border-[#ECECF1] pt-5">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-[#8587A3]">Coming later</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {COMING_CAPABILITIES.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full bg-[#F1F2FD] px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-[#8B8DDA]"
                >
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-[#888AA4]">
              The foundation ships first; the deeper Pro tools build on it phase by phase.
            </p>
          </div>
        </section>

        <p className="mt-6 border-t border-[#DDDEEC] pt-5 text-xs leading-5 text-[#888AA4]">
          Prices include VAT where applicable. Trial converts only after you choose a plan — nothing is charged
          automatically.
        </p>
      </div>
    </AppShell>
  );
}
