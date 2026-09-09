import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { FluxricoMark } from '@/components/fluxrico-mark';
import { ThemeToggle } from '@/components/landing/theme-toggle';
import { useLandingTheme } from '@/components/landing/theme';
import { cn } from '@/lib/utils';

/**
 * Standalone focused shell for the four auth pages — deliberately calmer than
 * the landing page: centered column, generous whitespace, no sidebar.
 */
export function AuthLayout({
  children,
  hint,
  wide = false,
}: {
  children: ReactNode;
  /** Optional subtle journey hint under the card. */
  hint?: ReactNode;
  /** Wider column for the two-field pages keeps line lengths comfortable. */
  wide?: boolean;
}) {
  const { resolved } = useLandingTheme();

  return (
    <div className={cn('auth-root overflow-x-hidden', resolved === 'dark' && 'dark')}>
      <header className="mx-auto flex w-full max-w-[75rem] items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="fluxrico-focus rounded-lg" aria-label="Fluxrico home" data-testid="auth-link-home">
          <FluxricoMark />
        </Link>
        <ThemeToggle tone="surface" />
      </header>

      <main className="mx-auto flex w-full max-w-[75rem] flex-1 flex-col items-center px-5 pb-12 pt-6 sm:px-8 sm:pt-10">
        <div className={cn('w-full', wide ? 'max-w-[26.5rem]' : 'max-w-[25rem]')}>{children}</div>
        {hint ? (
          <p className="mt-8 max-w-[30rem] text-center text-xs leading-5 text-[hsl(var(--landing-muted))]">{hint}</p>
        ) : null}
      </main>
    </div>
  );
}
