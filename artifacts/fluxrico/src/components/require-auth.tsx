import type { ReactNode } from 'react';
import { Redirect, useLocation } from 'wouter';
import { useAuthState } from '@/lib/auth-state';

/**
 * Workspace route guard. Signed-out users are redirected to /signin with
 * their intended path preserved (?returnTo=...) so sign-in can return them.
 *
 * While the startup session check is still running (status 'checking'), the
 * guard renders a quiet placeholder instead of redirecting — a signed-in user
 * reloading /dashboard must not be bounced to /signin before /api/auth/me
 * answers.
 *
 * The frontend guard is UX only: every workspace API call resolves identity
 * from the server session, so a forged client state grants nothing.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuthState();
  const [location] = useLocation();

  if (status === 'checking') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F6F7FF]" role="status" aria-label="Checking your session">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#DADBF0] border-t-[#6258D0]" />
      </div>
    );
  }

  if (status !== 'authenticated') {
    const returnTo = location.startsWith('/') ? location : '/dashboard';
    return <Redirect to={`/signin?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  return <>{children}</>;
}

/** Builds the destination a signed-in user should land on after auth. */
export function safeReturnTo(returnTo: string | null | undefined): string {
  if (!returnTo) return '/dashboard';
  // Only allow internal paths — never an off-site redirect.
  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) return '/dashboard';
  return returnTo;
}
