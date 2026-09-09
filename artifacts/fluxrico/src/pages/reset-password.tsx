import { useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Check } from 'lucide-react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthField, AuthSubmit, PasswordInput } from '@/components/auth/auth-fields';
import { validatePassword, validatePasswordConfirmation } from '@/components/auth/validation';

type Errors = { password?: string | null; confirm?: string | null };

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const [reset, setReset] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Errors = {
      password: validatePassword(password),
      confirm: validatePasswordConfirmation(password, confirm),
    };
    setErrors(nextErrors);
    if (nextErrors.password || nextErrors.confirm) return;

    // Frontend-only phase: the UI completes honestly; no server is contacted
    // and no claim is made that a backend password changed.
    setPending(true);
    window.setTimeout(() => setReset(true), 650);
  };

  return (
    <AuthLayout hint="A real reset flow will verify a secure, single-use link before accepting a new password.">
      {reset ? (
        <div className="fluxrico-rise auth-card p-6 text-center sm:p-8" role="status" data-testid="reset-success">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--landing-purple-soft))]">
            <Check size={22} strokeWidth={2.4} className="text-[hsl(var(--landing-purple))]" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-[1.5rem] font-extrabold leading-[1.1] tracking-[-0.04em] text-[hsl(var(--landing-ink))]">
            Your new password is ready.
          </h1>
          <p className="auth-hint mx-auto mt-3 max-w-[23rem] text-sm leading-6">
            In this preview the reset completes locally. Sign in to continue your journey.
          </p>
          <Link href="/signin" className="auth-btn fluxrico-focus mt-7" data-testid="reset-link-signin">
            Return to sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="fluxrico-rise text-center">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[hsl(var(--landing-purple))]">Fluxrico</p>
            <h1 className="mt-3 text-[1.85rem] font-extrabold leading-[1.08] tracking-[-0.045em] text-[hsl(var(--landing-ink))]">
              Choose a new password
            </h1>
            <p className="auth-hint mx-auto mt-3 max-w-[24rem] text-sm leading-6">
              Pick something strong — at least 8 characters.
            </p>
          </div>

          <form onSubmit={onSubmit} noValidate className="auth-card mt-8 space-y-5 p-6 sm:p-8" aria-labelledby="reset-title">
            <h2 id="reset-title" className="sr-only">
              Set a new password
            </h2>

            <AuthField label="New password" htmlFor="reset-password" error={errors.password}>
              <PasswordInput
                id="reset-password"
                name="new-password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                invalid={Boolean(errors.password)}
                describedBy={errors.password ? 'reset-password-error' : undefined}
                data-testid="reset-input-password"
              />
            </AuthField>

            <AuthField label="Confirm new password" htmlFor="reset-confirm" error={errors.confirm}>
              <PasswordInput
                id="reset-confirm"
                name="confirm-new-password"
                autoComplete="new-password"
                placeholder="Repeat your new password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                invalid={Boolean(errors.confirm)}
                describedBy={errors.confirm ? 'reset-confirm-error' : undefined}
                data-testid="reset-input-confirm"
              />
            </AuthField>

            <AuthSubmit pending={pending} pendingLabel="Updating password…">Reset password</AuthSubmit>
          </form>

          <p className="mt-6 text-center">
            <Link
              href="/signin"
              className="fluxrico-focus inline-flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--landing-body))] underline-offset-4 hover:text-[hsl(var(--landing-ink))] hover:underline"
              data-testid="reset-link-back"
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
