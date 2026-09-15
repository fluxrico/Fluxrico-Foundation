import { useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Check, Mail } from 'lucide-react';
import { AuthLayout, AuthHeading } from '@/components/auth/auth-layout';
import { AuthField, AuthInput, AuthSubmit } from '@/components/auth/auth-fields';
import { AuthNotice } from '@/components/auth/auth-notice';
import { AuthStatusBadge } from '@/components/auth/auth-status-badge';
import { validateEmail } from '@/components/auth/validation';
import { forgotPassword, ApiError } from '@workspace/api-client-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [received, setReceived] = useState(false);
  const [formError, setFormError] = useState<boolean>(false);
  // Honest delivery state straight from the API: false means no provider is
  // configured yet, so the UI must not claim an email was sent.
  const [delivered, setDelivered] = useState<boolean | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextError = validateEmail(email);
    setError(nextError);
    if (nextError) return;

    setPending(true);
    try {
      const result = await forgotPassword({ email });
      setDelivered(result.emailDelivered);
      setReceived(true);
    } catch (requestError) {
      // 429 is the only client-relevant failure; every other outcome stays
      // deliberately indistinguishable from success (no account enumeration).
      setFormError(requestError instanceof ApiError && requestError.status === 429);
      setReceived(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthLayout>
      {received ? (
        <div className="auth-card fluxrico-rise p-6 text-center sm:p-8" role="status" data-testid="forgot-success">
          <AuthStatusBadge tone="purple">
            {delivered ? (
              <Mail size={21} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Check size={21} strokeWidth={2.4} aria-hidden="true" />
            )}
          </AuthStatusBadge>
          <h1 className="mt-5 text-[1.5rem] font-extrabold leading-[1.1] tracking-[-0.04em] text-[hsl(var(--landing-ink))]">
            Request received.
          </h1>
          {delivered ? (
            <p className="auth-hint mx-auto mt-3 max-w-[23rem] text-sm leading-6">
              If an account exists for <span className="font-bold">{email.trim()}</span>, a reset link is on its way.
              The link expires in 24 hours and works once.
            </p>
          ) : (
            <p className="auth-hint mx-auto mt-3 max-w-[23rem] text-sm leading-6">
              Your request was accepted. Email delivery is not configured yet, so no message has been sent — the reset
              link will arrive once transactional email is enabled.
            </p>
          )}
          {formError ? (
            <div className="mt-4">
              <AuthNotice tone="info">You've requested several resets recently. Please wait a few minutes.</AuthNotice>
            </div>
          ) : null}
          <Link href="/signin" className="auth-btn fluxrico-focus mt-7" data-testid="forgot-link-signin">
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <AuthHeading label="ACCOUNT RECOVERY" title="Reset your password.">
            Enter the email on your account and we'll check it against our records.
          </AuthHeading>

          <form onSubmit={onSubmit} noValidate className="auth-card fluxrico-rise fluxrico-rise-delay-1 mt-8 space-y-5 p-6 sm:p-8" aria-labelledby="forgot-title">
            <h2 id="forgot-title" className="sr-only">
              Request a password reset
            </h2>

            <AuthField label="Email" htmlFor="forgot-email" error={error}>
              <AuthInput
                id="forgot-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                invalid={Boolean(error)}
                describedBy={error ? 'forgot-email-error' : undefined}
                data-testid="forgot-input-email"
              />
            </AuthField>

            <AuthSubmit pending={pending} pendingLabel="Sending request…">
              Request reset
            </AuthSubmit>
          </form>

          <p className="mt-6 text-center">
            <Link
              href="/signin"
              className="fluxrico-focus inline-flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--landing-body))] underline-offset-4 hover:text-[hsl(var(--landing-ink))] hover:underline"
              data-testid="forgot-link-back"
            >
              <ArrowLeft size={14} strokeWidth={2.1} aria-hidden="true" />
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
