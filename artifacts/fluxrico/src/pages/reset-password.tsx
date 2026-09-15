import { useState, type FormEvent } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { ArrowLeft, Check } from 'lucide-react';
import { AuthLayout, AuthHeading } from '@/components/auth/auth-layout';
import { AuthField, AuthSubmit, PasswordInput } from '@/components/auth/auth-fields';
import { AuthNotice } from '@/components/auth/auth-notice';
import { AuthStatusBadge } from '@/components/auth/auth-status-badge';
import { validatePassword, validatePasswordConfirmation } from '@/components/auth/validation';
import { resetPassword, ApiError } from '@workspace/api-client-react';

type Errors = { password?: string | null; confirm?: string | null };

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [reset, setReset] = useState(false);

  const missingToken = token.length === 0;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Errors = {
      password: validatePassword(password),
      confirm: validatePasswordConfirmation(password, confirm),
    };
    setErrors(nextErrors);
    setFormError(null);
    if (nextErrors.password || nextErrors.confirm) return;

    setPending(true);
    try {
      await resetPassword({ token, password });
      setReset(true);
    } catch (requestError) {
      setFormError(
        requestError instanceof ApiError && requestError.status === 400
          ? 'This reset link is invalid or has expired. Request a fresh one below.'
          : 'We could not update your password. Please try again.',
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthLayout>
      {reset ? (
        <div className="auth-card p-6 text-center sm:p-8" role="status" data-testid="reset-success">
          <AuthStatusBadge tone="success">
            <Check size={21} strokeWidth={2.4} aria-hidden="true" />
          </AuthStatusBadge>
          <h1 className="mt-5 text-[1.5rem] font-extrabold leading-[1.1] tracking-[-0.04em] text-[hsl(var(--landing-ink))]">
            Your new password is ready.
          </h1>
          <p className="auth-hint mx-auto mt-3 max-w-[23rem] text-sm leading-6">
            All previous sessions were signed out. Sign in with your new password to continue your journey.
          </p>
          <Link href="/signin" className="auth-btn fluxrico-focus mt-7" data-testid="reset-link-signin">
            Return to sign in
          </Link>
        </div>
      ) : (
        <>
          <AuthHeading label="ACCOUNT RECOVERY" title="Choose a new password.">
            Pick something strong — at least 8 characters. Your other sessions will be signed out.
          </AuthHeading>

          {missingToken ? (
            <div className="auth-card mt-8 space-y-5 p-6 sm:p-8">
              <AuthNotice tone="error">
                This page needs a valid reset link. Check your email for the newest message, or request a fresh one.
              </AuthNotice>
              <Link href="/forgot-password" className="auth-btn fluxrico-focus" data-testid="reset-link-request">
                Request a new link
              </Link>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              noValidate
              className="auth-card fluxrico-rise fluxrico-rise-delay-1 mt-8 space-y-5 p-6 sm:p-8"
              aria-labelledby="reset-title"
            >
              <h2 id="reset-title" className="sr-only">
                Set a new password
              </h2>

              {formError ? (
                <AuthNotice tone="error">
                  {formError}
                  <Link
                    href="/forgot-password"
                    className="ml-1 font-bold underline underline-offset-2"
                    data-testid="reset-link-re-request"
                  >
                    Request a new link
                  </Link>
                </AuthNotice>
              ) : null}

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

              <AuthSubmit pending={pending} pendingLabel="Updating password…">
                Reset password
              </AuthSubmit>
            </form>
          )}

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
