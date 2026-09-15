import { useState, type FormEvent } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { AuthLayout, AuthHeading } from '@/components/auth/auth-layout';
import { AuthField, AuthSubmit, PasswordInput, AuthInput } from '@/components/auth/auth-fields';
import { AuthNotice } from '@/components/auth/auth-notice';
import { validateEmail } from '@/components/auth/validation';
import { useAuthState } from '@/lib/auth-state';
import { safeReturnTo } from '@/components/require-auth';

const SIGN_IN_ERRORS: Record<string, string> = {
  'invalid-credentials': 'Invalid email or password.',
  'email-not-verified': 'Your email is not verified yet. Check your inbox for the verification link.',
  network: 'We could not reach Fluxrico. Check your connection and try again.',
  unknown: 'We could not sign you in right now. Please try again.',
};

export default function SignIn() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { signIn, user } = useAuthState();
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }

    setError(null);
    setPending(true);
    const result = await signIn({ email, password });
    setPending(false);

    if (!result.ok) {
      setError(SIGN_IN_ERRORS[result.error ?? 'unknown'] ?? SIGN_IN_ERRORS.unknown);
      return;
    }

    // Return the user to the route they were bounced from, defaulting to the
    // workspace home. `session?` marks a redirect after session expiry.
    const returnTo = safeReturnTo(new URLSearchParams(search).get('returnTo'));
    navigate(returnTo, { replace: true });
  };

  return (
    <AuthLayout>
      <AuthHeading label="FLUXRICO WORKSPACE" title="Welcome back.">
        Pick up where you left off — your current stage and next move are waiting.
      </AuthHeading>

      <form onSubmit={onSubmit} noValidate className="auth-card fluxrico-rise fluxrico-rise-delay-1 mt-8 space-y-5 p-6 sm:p-8" aria-labelledby="signin-title">
        <h2 id="signin-title" className="sr-only">
          Sign in to Fluxrico
        </h2>

        {new URLSearchParams(search).get('session') === 'expired' ? (
          <AuthNotice tone="info">Your session has expired. Please sign in again.</AuthNotice>
        ) : null}

        {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}

        <AuthField label="Email" htmlFor="signin-email">
          <AuthInput
            id="signin-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            invalid={false}
            data-testid="signin-input-email"
          />
        </AuthField>

        <AuthField
          label="Password"
          htmlFor="signin-password"
          action={
            <Link
              href="/forgot-password"
              className="fluxrico-focus rounded text-xs font-semibold text-[hsl(var(--landing-purple))] underline-offset-4 hover:underline"
              data-testid="signin-link-forgot"
            >
              Forgot password?
            </Link>
          }
        >
          <PasswordInput
            id="signin-password"
            name="current-password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            data-testid="signin-input-password"
          />
        </AuthField>

        <AuthSubmit pending={pending} pendingLabel="Signing you in…">
          Sign in
          <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
        </AuthSubmit>
      </form>

      <p className="mt-6 text-center text-sm text-[hsl(var(--landing-body))]">
        Don't have an account?{' '}
        <Link
          href="/signup"
          className="fluxrico-focus font-bold text-[hsl(var(--landing-purple))] underline-offset-4 hover:underline"
          data-testid="signin-link-signup"
        >
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
