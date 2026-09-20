import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { AuthLayout, AuthHeading } from '@/components/auth/auth-layout';
import { AuthField, AuthInput, AuthSubmit, PasswordInput } from '@/components/auth/auth-fields';
import { AuthNotice } from '@/components/auth/auth-notice';
import { validateEmail, validateName, validatePassword, validatePasswordConfirmation } from '@/components/auth/validation';
import { useAuthState } from '@/lib/auth-state';

type Errors = {
  name?: string | null;
  email?: string | null;
  password?: string | null;
  confirm?: string | null;
};

export default function SignUp() {
  const [, navigate] = useLocation();
  const { signUp } = useAuthState();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Errors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: validatePasswordConfirmation(password, confirm),
    };
    if (!acceptedTerms) nextErrors.confirm ??= null;
    setErrors(nextErrors);
    setFormError(null);
    if (!acceptedTerms) {
      setFormError('Please acknowledge the terms to continue.');
      return;
    }
    if (nextErrors.name || nextErrors.email || nextErrors.password || nextErrors.confirm) return;

    setPending(true);
    const result = await signUp({ name, email, password });
    setPending(false);

    if (!result.ok) {
      if (result.error === 'email-taken') {
        setFormError('An account with this email already exists. Try signing in instead.');
        setErrors({ email: ' ' }); // Marks the field without duplicating the copy.
      } else if (result.error === 'network') {
        setFormError('We could not reach Fluxrico. Check your connection and try again.');
      } else {
        setFormError('We could not create your account. Check your details and try again.');
      }
      return;
    }

    // Real account exists now, email unverified — the pending screen takes
    // over. The Navigator still waits until after verified sign-in.
    navigate('/verify?pending=1', { replace: true });
  };

  return (
    <AuthLayout>
      <AuthHeading label="YOUR JOURNEY STARTS HERE" title="Create your Fluxrico account.">
        Start turning what you know into a clear direction.
      </AuthHeading>

      <form onSubmit={onSubmit} noValidate className="auth-card fluxrico-rise fluxrico-rise-delay-1 mt-8 space-y-5 p-6 sm:p-8" aria-labelledby="signup-title">
        <h2 id="signup-title" className="sr-only">
          Create your Fluxrico account
        </h2>

        {formError ? <AuthNotice tone="error">{formError}</AuthNotice> : null}

        <AuthField label="Name" htmlFor="signup-name" error={errors.name}>
          <AuthInput
            id="signup-name"
            name="name"
            autoComplete="name"
            placeholder="Maya Rodriguez"
            value={name}
            onChange={(event) => setName(event.target.value)}
            invalid={Boolean(errors.name?.trim())}
            describedBy={errors.name?.trim() ? 'signup-name-error' : undefined}
            data-testid="signup-input-name"
          />
        </AuthField>

        <AuthField label="Email" htmlFor="signup-email" error={errors.email?.trim() || null}>
          <AuthInput
            id="signup-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            invalid={Boolean(errors.email?.trim())}
            describedBy={errors.email?.trim() ? 'signup-email-error' : undefined}
            data-testid="signup-input-email"
          />
        </AuthField>

        <AuthField label="Password" htmlFor="signup-password" error={errors.password}>
          <PasswordInput
            id="signup-password"
            name="new-password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            invalid={Boolean(errors.password)}
            describedBy={errors.password ? 'signup-password-error' : undefined}
            data-testid="signup-input-password"
          />
        </AuthField>

        <AuthField label="Confirm password" htmlFor="signup-confirm" error={errors.confirm}>
          <PasswordInput
            id="signup-confirm"
            name="confirm-new-password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            invalid={Boolean(errors.confirm)}
            describedBy={errors.confirm ? 'signup-confirm-error' : undefined}
            data-testid="signup-input-confirm"
          />
        </AuthField>

        <label className="flex cursor-pointer items-start gap-2.5" data-testid="signup-terms">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            className="fluxrico-focus mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--landing-purple))]"
          />
          <span className="text-xs leading-5 text-[hsl(var(--landing-body))]">
            I agree to Fluxrico's{' '}
            <Link
              href="/terms"
              className="font-semibold text-[hsl(var(--landing-purple))] underline-offset-2 hover:underline"
              data-testid="signup-link-terms"
            >
              terms
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="font-semibold text-[hsl(var(--landing-purple))] underline-offset-2 hover:underline"
              data-testid="signup-link-privacy"
            >
              privacy practices
            </Link>
            .
          </span>
        </label>

        <AuthSubmit pending={pending} pendingLabel="Creating your account…">
          Create account
          <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
        </AuthSubmit>

        <p className="text-center text-xs leading-5 text-[hsl(var(--landing-muted))]">
          We'll email you a verification link before your workspace opens.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-[hsl(var(--landing-body))]">
        Already have an account?{' '}
        <Link
          href="/signin"
          className="fluxrico-focus font-bold text-[hsl(var(--landing-purple))] underline-offset-4 hover:underline"
          data-testid="signup-link-signin"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
