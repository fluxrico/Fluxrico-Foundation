import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

type AuthSubmitProps = {
  pending: boolean;
  pendingLabel: string;
  children: ReactNode;
};

/** Primary auth action with a disabled/loading state. */
export function AuthSubmit({ pending, pendingLabel, children }: AuthSubmitProps) {
  return (
    <button type="submit" className="auth-btn fluxrico-focus" disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <Loader2 size={15} strokeWidth={2.2} className="animate-spin" aria-hidden="true" />
          <span aria-live="polite">{pendingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function AuthField({
  label,
  htmlFor,
  error,
  children,
  action,
}: {
  label: string;
  htmlFor: string;
  error?: string | null;
  children: ReactNode;
  /** Small action rendered in the label row (e.g. Forgot password). */
  action?: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[hsl(var(--landing-muted))]">
          {label}
        </label>
        {action}
      </div>
      <div className="mt-2">{children}</div>
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-xs font-medium text-[hsl(0 68% 48%)]">
          {error}
        </p>
      ) : null}
      {/* Reserve error space so layout never jumps between states. */}
      {!error ? <p aria-hidden="true" className="mt-1.5 h-0 text-xs" /> : null}
    </div>
  );
}

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
  describedBy?: string;
};

export function AuthInput({ invalid, describedBy, className, ...props }: AuthInputProps) {
  return (
    <input
      className="auth-input"
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      {...props}
    />
  );
}

type PasswordInputProps = Omit<AuthInputProps, 'type'> & { testId?: string };

/** Password input with a visibility control; toggle is a labelled button. */
export function PasswordInput({ testId, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <AuthInput type={visible ? 'text' : 'password'} className="pr-12" {...props} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-[0.85rem] text-[hsl(var(--landing-muted))] transition-colors hover:text-[hsl(var(--landing-ink))]"
        data-testid={testId ? `${testId}-toggle` : undefined}
      >
        {visible ? <EyeOff size={16} strokeWidth={1.9} aria-hidden="true" /> : <Eye size={16} strokeWidth={1.9} aria-hidden="true" />}
      </button>
    </div>
  );
}

/** Small helper so each page's ids stay unique without sprinkling useId everywhere. */
export function useAuthFieldId(prefix: string): string {
  return useId() + '-' + prefix;
}
