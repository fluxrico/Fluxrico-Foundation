import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { FluxricoMark } from '@/components/fluxrico-mark';
import { ThemeToggle } from '@/components/landing/theme-toggle';
import { useLandingTheme } from '@/components/landing/theme';
import { cn } from '@/lib/utils';

const JOURNEY = [
  { title: 'Clarity', sub: 'Answer the Navigator and see your idea clearly.', state: 'done' },
  { title: 'Direction', sub: 'Get the one direction that fits you best.', state: 'done' },
  { title: 'Next move', sub: 'Always know the next useful step.', state: 'current' },
  { title: 'Progress', sub: 'Watch small wins compound into momentum.', state: 'next' },
] as const;

/**
 * Premium two-zone shell for the auth pages. Desktop pairs a calm Fluxrico
 * brand experience (statement + journey visualization) with a focused auth
 * panel; mobile collapses to a compact brand strip above the form. Light and
 * dark resolve through the shared landing theme store onto the auth root.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  const { resolved } = useLandingTheme();

  return (
    <div className={cn('auth-root overflow-x-hidden', resolved === 'dark' && 'dark')}>
      {/* Ambient lighting: two fixed glows, no animation. The faint grid and
          journey line live in CSS so they layer cleanly behind everything. */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-[62%] top-[-26rem] h-[44rem] w-[56rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(252_92%_62%/0.14),transparent)] blur-3xl" />
        <div className="absolute bottom-[-24rem] left-[-16rem] h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(closest-side,hsl(190_90%_45%/0.09),transparent)] blur-3xl" />
      </div>

      <header className="auth-shell relative z-20 flex items-center justify-between py-5 sm:py-6">
        <Link href="/" className="fluxrico-focus rounded-lg" aria-label="Fluxrico home" data-testid="auth-link-home">
          <FluxricoMark />
        </Link>
        <ThemeToggle tone="surface" />
      </header>

      <main className="auth-shell relative z-10 flex flex-1 flex-col justify-center pb-12 pt-2 sm:pb-16">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_minmax(0,26.5rem)] lg:gap-16 xl:gap-24">
          {/* ── Brand experience (desktop) ─────────────────────────────── */}
          <section className="auth-brand relative" aria-hidden="true">
            {/* One flowing journey line, woven into the environment. */}
            <svg
              className="pointer-events-none absolute -top-24 left-24 h-[26rem] w-[36rem] opacity-[0.5]"
              viewBox="0 0 560 400"
              fill="none"
            >
              <defs>
                <linearGradient id="auth-journey-flow" x1="0" y1="400" x2="560" y2="0" gradientUnits="userSpaceOnUse">
                  <stop stopColor="hsl(var(--landing-cyan))" stopOpacity="0.05" />
                  <stop offset="0.55" stopColor="hsl(var(--landing-purple))" stopOpacity="0.3" />
                  <stop offset="1" stopColor="hsl(var(--landing-purple))" stopOpacity="0.08" />
                </linearGradient>
              </defs>
              <path
                d="M-20 372C96 340 128 236 232 210C336 184 372 128 444 96C492 75 528 44 560 -8"
                stroke="url(#auth-journey-flow)"
                strokeWidth="1.4"
                strokeDasharray="5 7"
                className="fluxrico-dash"
                strokeLinecap="round"
              />
              <circle cx="232" cy="210" r="3" fill="hsl(var(--landing-purple))" opacity="0.35" />
              <circle cx="444" cy="96" r="2.4" fill="hsl(var(--landing-cyan))" opacity="0.3" />
            </svg>

            <div className="relative max-w-[34rem]">
              <span className="auth-chip fluxrico-rise">Your journey starts here</span>
              <h2 className="fluxrico-rise fluxrico-rise-delay-1 mt-6 text-4xl font-extrabold leading-[1.04] tracking-[-0.045em] text-[hsl(var(--landing-ink))] xl:text-[3.4rem]">
                Turn clarity into{' '}
                <span className="bg-gradient-to-r from-[hsl(var(--landing-cyan))] to-[hsl(var(--landing-purple))] bg-clip-text text-transparent">
                  progress.
                </span>
              </h2>
              <p className="auth-hint fluxrico-rise fluxrico-rise-delay-2 mt-5 max-w-[30rem] text-[0.95rem] leading-7">
                Fluxrico turns what you know into one clear direction — then keeps you moving with the next useful
                step, week after week.
              </p>

              <ol className="mt-10 space-y-1.5">
                {JOURNEY.map((step, index) => (
                  <li
                    key={step.title}
                    data-state={step.state}
                    className={cn('auth-journey-node fluxrico-rise', index === 1 && 'fluxrico-rise-delay-1', index === 2 && 'fluxrico-rise-delay-2', index === 3 && 'fluxrico-rise-delay-3')}
                  >
                    <span className="auth-journey-dot text-[0.6rem] font-bold">
                      {step.state === 'done' ? '✓' : index + 1}
                    </span>
                    <span className="pb-1.5">
                      <span className="auth-journey-title block uppercase tracking-[0.14em] text-[0.7rem]">{step.title}</span>
                      <span className="auth-journey-sub block">{step.sub}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ── Auth experience ────────────────────────────────────────── */}
          <div className="w-full">
            {/* Compact journey strip — mobile carrier of the same idea. */}
            <ol className="auth-journey-strip mb-7 justify-center lg:hidden" aria-hidden="true">
              {JOURNEY.map((step, index) => (
                <li key={step.title} data-state={step.state} className="fluxrico-rise" style={{ animationDelay: `${index * 70}ms` }}>
                  <span className="auth-journey-strip-dot" />
                  <span className="auth-journey-strip-label">{step.title}</span>
                  {index < JOURNEY.length - 1 ? <span className="auth-journey-strip-sep" /> : null}
                </li>
              ))}
            </ol>
            <div className="mx-auto w-full max-w-[26.5rem]">{children}</div>
          </div>
        </div>
      </main>

      <footer className="auth-shell relative z-10 pb-7">
        <p className="text-center text-[0.68rem] leading-5 text-[hsl(var(--landing-muted))]">
          © {new Date().getFullYear()} Fluxrico · The path from idea to income, one clear move at a time.
        </p>
      </footer>
    </div>
  );
}

/** Auth page header: contextual chip, headline, supporting copy. */
export function AuthHeading({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="fluxrico-rise">
      <p className="auth-chip">{label}</p>
      <h1 className="mt-4 text-[1.9rem] font-extrabold leading-[1.08] tracking-[-0.045em] text-[hsl(var(--landing-ink))]">
        {title}
      </h1>
      {children ? <p className="auth-hint mt-3 text-sm leading-6">{children}</p> : null}
    </div>
  );
}
