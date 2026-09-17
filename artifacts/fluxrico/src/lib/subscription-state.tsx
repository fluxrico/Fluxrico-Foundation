import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getSubscription } from '@workspace/api-client-react';
import type { Subscription } from '@workspace/api-client-react';
import { useAuthState } from '@/lib/auth-state';

export type { Subscription };

export type SubscriptionStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Shared subscription access state — the frontend's one subscription source.
 *
 * The server is the source of truth for access; this provider only mirrors
 * what GET /api/subscription reports (state, days remaining, plan). No
 * component derives Pro access locally, so no client flag can grant Pro.
 * The workspace unmounts on sign-out, resetting this state per session.
 */
type SubscriptionStateValue = {
  subscription: Subscription | null;
  status: SubscriptionStatus;
  refresh: () => Promise<void>;
  /** Convenience derived flags, always mirroring the server response. */
  isPro: boolean;
  isTrialing: boolean;
  isExpired: boolean;
  trialDaysRemaining: number;
};

const SubscriptionStateContext = createContext<SubscriptionStateValue | null>(null);

export function SubscriptionStateProvider({ children }: { children: ReactNode }) {
  const { status: authStatus } = useAuthState();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus>('idle');

  const refresh = useCallback(async () => {
    if (authStatus !== 'authenticated') {
      setSubscription(null);
      setStatus('idle');
      return;
    }
    setStatus('loading');
    try {
      const response = await getSubscription();
      setSubscription(response.subscription);
      setStatus('ready');
    } catch {
      // A transient failure must not fabricate access state; leave null and
      // let consumers render their neutral handling.
      setSubscription(null);
      setStatus('error');
    }
  }, [authStatus]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<SubscriptionStateValue>(
    () => ({
      subscription,
      status,
      refresh,
      isPro: subscription?.state === 'pro',
      isTrialing: subscription?.state === 'trialing',
      isExpired: subscription?.state === 'expired',
      trialDaysRemaining: subscription?.trialDaysRemaining ?? 0,
    }),
    [subscription, status, refresh],
  );

  return <SubscriptionStateContext.Provider value={value}>{children}</SubscriptionStateContext.Provider>;
}

export function useSubscriptionState(): SubscriptionStateValue {
  const value = useContext(SubscriptionStateContext);
  if (!value) {
    throw new Error('useSubscriptionState must be used inside SubscriptionStateProvider');
  }
  return value;
}
