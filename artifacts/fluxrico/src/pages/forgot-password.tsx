import { useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Check } from 'lucide-react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthField, AuthInput, AuthSubmit } from '@/components/auth/auth-fields';
import { validateEmail } from '@/components/auth/validation';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [received, setReceived] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextError = validateEmail(email);
    setError(nextError);
    if (nextError) return;

    // Frontend-only phase: nothing is sent anywhere. The success state is
    // worded honestly — email delivery arrives with backend authentication.
    setPending(true);
    window.setTimeout(() => setReceived(true), 650);
  };

  return (
    <AuthLayout hint="When real authentication is connected, this request will email you a secure reset link.">
      {received ? (
        <div className="fluxrico-rise auth-card p-6 text-center sm:p-8" role="status" data-testid="forgot-success">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--landing-purple-soft))]">
            <Check size={22} strokeWidth={2.4} className="text-[hsl(var(--landing-purple))]" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-[1.5rem] font-extrabold leading-[1.1] tracking-[-0.04em] text-[hsl(var(--landing-ink))]">
            Password reset request received.
          </h1>
          <p className="auth-hint mx-auto mt-3 max-w-[23rem] text-sm leading-6">
            In this preview nothing was sent. Email delivery will be connected when backend authentication is implemented.
          </p>
          <Link
            href="/signin"
            className="auth-btn fluxrico-focus mt-7"
            data-testid="forgot-link-signin"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="fluxrico-rise text-center">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[hsl(var(--landing-purple))]">Fluxrico</p>
            <h1 className="mt-3 text-[1.85rem] font-extrabold leading-[1.08] tracking-[-0.045em] text-[hsl(var(--landing-ink))]">
              Reset your password
            </h1>
            <p className="auth-hint mx-auto mt-3 max-w-[24rem] text-sm leading-6">
              Enter the email on your account and request a password reset.
            </p>
          </div>

          <form onSubmit={onSubmit} noValidate className="auth-card mt-8 space-y-5 p-6 sm:p-8" aria-labelledby="forgot-title">
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

            <AuthSubmit pending={pending} pendingLabel="Sending request…">Request reset</AuthSubmit>
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
