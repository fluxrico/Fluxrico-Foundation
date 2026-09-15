import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { ArrowRight, Check, MailQuestion, MailWarning } from 'lucide-react';
import { AuthLayout, AuthHeading } from '@/components/auth/auth-layout';
import { AuthField, AuthInput } from '@/components/auth/auth-fields';
import { AuthNotice } from '@/components/auth/auth-notice';
import { AuthStatusBadge } from '@/components/auth/auth-status-badge';
import { validateEmail } from '@/components/auth/validation';
import { resendVerification, verifyEmail, ApiError } from '@workspace/api-client-react';

type Phase =
  | { kind: 'verifying' }
  | { kind: 'verified' }
  | { kind: 'invalid' }
  | { kind: 'pending'; email: string | null; delivered: boolean | null }
  | { kind: 'resend-form'; email: string; notice: string | null; delivered: boolean | null };

/**
 * /verify — two experiences in one route:
 *
 * 1. Token verification: opened from the emailed link (?token=...). The token
 *    is consumed server-side; success signs the user in? No — verification
 *    confirms the address only. The user continues to sign in.
 * 2. Pending state (?pending=1, or after sign-up): explains what happens
 *    next and offers an honest resend with rate limiting.
 */
export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get('token');

  const [phase, setPhase] = useState<Phase>(() =>
    token ? { kind: 'verifying' } : { kind: 'pending', email: null, delivered: null },
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    verifyEmail({ token })
      .then((result) => {
        if (cancelled) return;
        if (result.user.emailVerified) setPhase({ kind: 'verified' });
      })
      .catch(() => {
        if (cancelled) return;
        setPhase({ kind: 'invalid' });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onResend = useCallback(
    async (email: string) => {
      try {
        const result = await resendVerification({ email });
        setPhase({ kind: 'pending', email, delivered: result.emailDelivered });
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 429) {
          setPhase({
            kind: 'resend-form',
            email,
            notice: 'You have requested several emails recently. Please wait a few minutes.',
            delivered: null,
          });
        } else {
          // Response never reveals account existence; treat all outcomes the same.
          setPhase({ kind: 'pending', email, delivered: null });
        }
      }
    },
    [],
  );

  let content: ReactNode;

  if (phase.kind === 'verifying') {
    content = (
      <div className="auth-card fluxrico-rise p-6 text-center sm:p-8" role="status" data-testid="verify-progress">
        <AuthStatusBadge tone="purple">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[hsl(var(--landing-purple)/0.3)] border-t-[hsl(var(--landing-purple))]" />
        </AuthStatusBadge>
        <h1 className="mt-5 text-[1.5rem] font-extrabold leading-[1.1] tracking-[-0.04em] text-[hsl(var(--landing-ink))]">
          Verifying your email…
        </h1>
        <p className="auth-hint mx-auto mt-3 max-w-[23rem] text-sm leading-6">
          One moment while we confirm your verification link.
        </p>
      </div>
    );
  } else if (phase.kind === 'verified') {
    content = (
      <div className="auth-card fluxrico-rise p-6 text-center sm:p-8" role="status" data-testid="verify-success">
        <AuthStatusBadge tone="success">
          <Check size={21} strokeWidth={2.4} aria-hidden="true" />
        </AuthStatusBadge>
        <h1 className="mt-5 text-[1.5rem] font-extrabold leading-[1.1] tracking-[-0.04em] text-[hsl(var(--landing-ink))]">
          Email verified.
        </h1>
        <p className="auth-hint mx-auto mt-3 max-w-[23rem] text-sm leading-6">
          Your workspace is unlocked. Sign in to shape your direction and take your next move.
        </p>
        <button
          type="button"
          onClick={() => navigate('/signin', { replace: true })}
          className="auth-btn fluxrico-focus mt-7"
          data-testid="verify-link-signin"
        >
          Continue to Fluxrico
        </button>
      </div>
    );
  } else if (phase.kind === 'invalid') {
    content = (
      <div className="auth-card fluxrico-rise p-6 text-center sm:p-8" role="alert" data-testid="verify-invalid">
        <AuthStatusBadge tone="error">
          <MailWarning size={21} strokeWidth={2} aria-hidden="true" />
        </AuthStatusBadge>
        <h1 className="mt-5 text-[1.5rem] font-extrabold leading-[1.1] tracking-[-0.04em] text-[hsl(var(--landing-ink))]">
          This verification link has expired.
        </h1>
        <p className="auth-hint mx-auto mt-3 max-w-[23rem] text-sm leading-6">
          Links work once and expire after 24 hours. Enter your email and we'll check whether a fresh link can be sent.
        </p>
        <ResendForm initialEmail="" onSubmit={onResend} />
      </div>
    );
  } else if (phase.kind === 'resend-form') {
    content = (
      <div className="auth-card fluxrico-rise p-6 sm:p-8" data-testid="verify-resend-form">
        <h1 className="text-center text-[1.5rem] font-extrabold leading-[1.1] tracking-[-0.04em] text-[hsl(var(--landing-ink))]">
          Resend verification email
        </h1>
        {phase.notice ? (
          <div className="mt-4">
            <AuthNotice tone="info">{phase.notice}</AuthNotice>
          </div>
        ) : null}
        <div className="mt-5">
          <ResendForm initialEmail={phase.email} onSubmit={onResend} />
        </div>
        <p className="mt-5 text-center">
          <Link
            href="/signin"
            className="fluxrico-focus text-sm font-semibold text-[hsl(var(--landing-body))] underline-offset-4 hover:text-[hsl(var(--landing-ink))] hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    );
  } else {
    const delivered = phase.delivered;
    content = (
      <>
        <AuthHeading label="ALMOST THERE" title="Check your email to verify your account.">
          We created your account. A verification link{delivered === false ? ' will be sent' : ' is on its way'} to
          your inbox — it works once and expires in 24 hours.
        </AuthHeading>

        <div className="auth-card fluxrico-rise fluxrico-rise-delay-1 mt-8 p-6 sm:p-8" data-testid="verify-pending">
          {delivered === false ? (
            <AuthNotice tone="info">
              Email delivery is not configured in this environment yet, so no message has been sent. The link will
              arrive once transactional email is enabled.
            </AuthNotice>
          ) : (
            <div className="text-center">
              <AuthStatusBadge tone="purple">
                <MailQuestion size={21} strokeWidth={2} aria-hidden="true" />
              </AuthStatusBadge>
              <p className="auth-hint mx-auto mt-4 max-w-[22rem] text-sm leading-6">
                Open the email from Fluxrico and select <span className="font-bold">Verify email</span>. Didn't arrive?
                Check spam, then request a fresh link below.
              </p>
            </div>
          )}

          <div className="mt-6 border-t border-[hsl(var(--landing-line))] pt-5">
            <ResendForm initialEmail="" onSubmit={onResend} compact />
          </div>

          <p className="mt-5 text-center">
            <Link
              href="/signin"
              className="fluxrico-focus text-sm font-semibold text-[hsl(var(--landing-body))] underline-offset-4 hover:text-[hsl(var(--landing-ink))] hover:underline"
              data-testid="verify-link-signin-2"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </>
    );
  }

  return <AuthLayout>{content}</AuthLayout>;
}

function ResendForm({
  initialEmail,
  onSubmit,
  compact = false,
}: {
  initialEmail: string;
  onSubmit: (email: string) => Promise<void>;
  compact?: boolean;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextError = validateEmail(email);
    setError(nextError);
    if (nextError) return;
    setPending(true);
    try {
      await onSubmit(email.trim().toLowerCase());
    } finally {
      setPending(false);
    }
  };

  if (compact) {
    return (
      <form onSubmit={submit} noValidate className="space-y-3" aria-label="Resend verification email">
        <AuthField label="Email" htmlFor="verify-resend-email" error={error}>
          <AuthInput
            id="verify-resend-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            invalid={Boolean(error)}
            describedBy={error ? 'verify-resend-email-error' : undefined}
            data-testid="verify-input-email"
          />
        </AuthField>
        <button type="submit" className="auth-btn fluxrico-focus" disabled={pending} aria-busy={pending} data-testid="verify-button-resend">
          {pending ? (
            <span aria-live="polite">Sending…</span>
          ) : (
            <>
              Resend verification email
              <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
            </>
          )}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mt-6 space-y-4 border-t border-[hsl(var(--landing-line))] pt-5" aria-label="Resend verification email">
      <AuthField label="Email" htmlFor="verify-resend-email-2" error={error}>
        <AuthInput
          id="verify-resend-email-2"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          invalid={Boolean(error)}
          describedBy={error ? 'verify-resend-email-2-error' : undefined}
          data-testid="verify-input-email-2"
        />
      </AuthField>
      <button type="submit" className="auth-btn fluxrico-focus" disabled={pending} aria-busy={pending} data-testid="verify-button-resend-2">
        {pending ? <span aria-live="polite">Sending…</span> : 'Resend verification email'}
      </button>
    </form>
  );
}
