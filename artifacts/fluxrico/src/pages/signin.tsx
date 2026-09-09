import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthField, AuthInput, AuthSubmit, PasswordInput } from '@/components/auth/auth-fields';
import { validateEmail, validatePassword } from '@/components/auth/validation';
import { useAuthState } from '@/lib/auth-state';

type Errors = { email?: string | null; password?: string | null };

export default function SignIn() {
  const [, navigate] = useLocation();
  const { signIn, user } = useAuthState();
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Errors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    // Frontend-only phase: restore the local user (or derive one from the
    // email) and continue the journey. No server is contacted.
    setPending(true);
    window.setTimeout(() => {
      signIn({ email });
      navigate('/dashboard', { replace: true });
    }, 650);
  };

  return (
    <AuthLayout hint="Pick up where you left off — your current stage and next move are waiting in the workspace.">
      <div className="fluxrico-rise text-center">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[hsl(var(--landing-purple))]">Fluxrico</p>
        <h1 className="mt-3 text-[1.85rem] font-extrabold leading-[1.08] tracking-[-0.045em] text-[hsl(var(--landing-ink))]">
          Welcome back
        </h1>
        <p className="auth-hint mx-auto mt-3 max-w-[24rem] text-sm leading-6">
          Continue your journey from where you left off.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="auth-card mt-8 space-y-5 p-6 sm:p-8" aria-labelledby="signin-title">
        <h2 id="signin-title" className="sr-only">
          Sign in to Fluxrico
        </h2>

        <AuthField
          label="Email"
          htmlFor="signin-email"
          error={errors.email}
        >
          <AuthInput
            id="signin-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            invalid={Boolean(errors.email)}
            describedBy={errors.email ? 'signin-email-error' : undefined}
            data-testid="signin-input-email"
          />
        </AuthField>

        <AuthField
          label="Password"
          htmlFor="signin-password"
          error={errors.password}
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
            invalid={Boolean(errors.password)}
            describedBy={errors.password ? 'signin-password-error' : undefined}
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
