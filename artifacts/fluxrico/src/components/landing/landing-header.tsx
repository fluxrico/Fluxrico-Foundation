import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'wouter';
import { FluxricoMark } from '@/components/fluxrico-mark';
import { ThemeToggle } from '@/components/landing/theme-toggle';
import { cn } from '@/lib/utils';

const LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Roadmap', href: '#roadmap' },
  { label: 'Pricing', href: '#pricing' },
] as const;

/**
 * Landing header. Sits over the dark hero with translucent styling, then
 * settles onto the page surface once the visitor scrolls — in either theme.
 */
export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300',
        scrolled
          ? 'border-b border-[hsl(var(--landing-line))] bg-[hsl(var(--landing-canvas))]/85 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="landing-shell flex h-[4.5rem] items-center justify-between gap-4">
        <Link href="/" className="fluxrico-focus rounded-lg" data-testid="landing-link-home" aria-label="Fluxrico home">
          {scrolled ? (
            <FluxricoMark />
          ) : (
            <FluxricoMark inverted />
          )}
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Landing">
          {LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className={cn(
                'fluxrico-focus rounded-md text-[0.72rem] font-semibold uppercase tracking-[0.14em] transition-colors',
                scrolled ? 'text-[hsl(var(--landing-muted))] hover:text-[hsl(var(--landing-ink))]' : 'text-[hsl(var(--landing-panel-muted))] hover:text-white',
              )}
              data-testid={`landing-link-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <ThemeToggle tone={scrolled ? 'surface' : 'overlay'} />
          <Link
            href="/dashboard"
            className={cn(
              'fluxrico-focus hidden min-h-10 items-center rounded-full px-4 text-[0.7rem] font-semibold uppercase tracking-[0.12em] transition-colors sm:inline-flex',
              scrolled
                ? 'text-[hsl(var(--landing-muted))] hover:text-[hsl(var(--landing-ink))]'
                : 'text-[hsl(var(--landing-panel-muted))] hover:text-white',
            )}
            data-testid="landing-link-signin"
          >
            Sign in
          </Link>
          <Link
            href="/navigator"
            className={cn(
              'landing-btn landing-btn-sm hidden md:inline-flex',
              scrolled ? 'landing-btn-primary' : 'landing-btn-light',
            )}
            data-testid="landing-cta-header"
          >
            Start your journey →
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={open}
            className={cn(
              'fluxrico-focus flex h-11 w-11 items-center justify-center rounded-full border transition-colors md:hidden',
              scrolled
                ? 'border-[hsl(var(--landing-line))] text-[hsl(var(--landing-ink))]'
                : 'border-white/20 text-white',
            )}
            data-testid="landing-button-mobile-nav"
          >
            {open ? <X size={19} strokeWidth={1.8} /> : <Menu size={19} strokeWidth={1.8} />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="landing-shell relative z-40 flex flex-col gap-1 pb-4 md:hidden"
          aria-label="Landing mobile"
          data-testid="landing-mobile-nav"
        >
          <div className="rounded-2xl border border-[hsl(var(--landing-line))] bg-[hsl(var(--landing-surface))] p-2 shadow-[0_18px_45px_hsl(var(--landing-shadow-color)/0.14)]">
            {LINKS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="fluxrico-focus block rounded-xl px-4 py-3 text-sm font-semibold text-[hsl(var(--landing-body))] hover:bg-[hsl(var(--landing-surface-2))]"
                data-testid={`landing-mobile-link-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`}
              >
                {label}
              </a>
            ))}
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="fluxrico-focus block rounded-xl px-4 py-3 text-sm font-semibold text-[hsl(var(--landing-body))] hover:bg-[hsl(var(--landing-surface-2))]"
              data-testid="landing-mobile-link-signin"
            >
              Sign in
            </Link>
            <Link
              href="/navigator"
              onClick={() => setOpen(false)}
              className="landing-btn landing-btn-primary mt-1 w-full"
              data-testid="landing-mobile-cta"
            >
              Start your journey →
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
