import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthField, AuthInput, AuthSubmit, PasswordInput } from '@/components/auth/auth-fields';
import { validateEmail, validateName, validatePassword } from '@/components/auth/validation';
import { useAuthState } from '@/lib/auth-state';

type Errors = { name?: string | null; email?: string | null; password?: string | null };

export default function SignUp() {
  const [, navigate] = useLocation();
  const { signUp } = useAuthState();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Errors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.email || nextErrors.password) return;

    // Frontend-only phase: local state now, a real provider behind the same
    // call later. New users continue into the Navigator, never the dashboard.
    setPending(true);
    window.setTimeout(() => {
      signUp({ name, email });
      navigate('/navigator', { replace: true });
    }, 650);
  };

  return (
    <AuthLayout hint="Your answers stay in this browser for now. The full journey — idea, clarity, direction — begins the moment you take the first step.">
      <div className="fluxrico-rise text-center">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[hsl(var(--landing-purple))]">Fluxrico</p>
        <h1 className="mt-3 text-[1.85rem] font-extrabold leading-[1.08] tracking-[-0.045em] text-[hsl(var(--landing-ink))]">
          Create your workspace
        </h1>
        <p className="auth-hint mx-auto mt-3 max-w-[24rem] text-sm leading-6">
          Start with a clear direction and turn your next useful step into progress.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="auth-card mt-8 space-y-5 p-6 sm:p-8" aria-labelledby="signup-title">
        <h2 id="signup-title" className="sr-only">
          Create your Fluxrico account
        </h2>

        <AuthField label="Full name" htmlFor="signup-name" error={errors.name}>
          <AuthInput
            id="signup-name"
            name="name"
            autoComplete="name"
            placeholder="Maya Rodriguez"
            value={name}
            onChange={(event) => setName(event.target.value)}
            invalid={Boolean(errors.name)}
            describedBy={errors.name ? 'signup-name-error' : undefined}
            data-testid="signup-input-name"
          />
        </AuthField>

        <AuthField label="Email" htmlFor="signup-email" error={errors.email}>
          <AuthInput
            id="signup-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            invalid={Boolean(errors.email)}
            describedBy={errors.email ? 'signup-email-error' : undefined}
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

        <AuthSubmit pending={pending} pendingLabel="Creating your workspace…">
          Create account
          <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
        </AuthSubmit>

        <p className="text-center text-xs leading-5 text-[hsl(var(--landing-muted))]">
          By creating an account you agree to Fluxrico's terms and privacy practices.
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
