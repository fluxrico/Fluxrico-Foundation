import { ArrowRight, Check, Eye, ListChecks, Route, Sparkles, Target } from 'lucide-react';
import { Link } from 'wouter';
import { ROADMAP_STAGES } from '@/lib/journey';
import { Reveal } from '@/components/landing/reveal';
import { PreviewChrome } from '@/components/landing/preview-chrome';

const PREVIEW_NAV = [
  { label: 'Next Move', icon: Target, detail: 'Define who this idea is for.' },
  { label: 'Current Stage', icon: Route, detail: 'Shape · stage 02 of 06' },
  { label: 'Progress', icon: Check, detail: '1 stage complete · 33%' },
  { label: 'Recent Activity', icon: Eye, detail: 'Navigator completed · today' },
  { label: 'Goal Snapshot', icon: ListChecks, detail: 'Build and launch a digital product' },
  { label: 'Guidance', icon: Sparkles, detail: 'Keep the next move small and useful.' },
] as const;

/**
 * Section 5 — Roadmap, Section 6 — Dashboard preview, Section 7 — philosophy,
 * Section 8 — final CTA. These use the real Fluxrico stage terminology.
 */
export function LandingRoadmapProduct() {
  return (
    <>
      <section id="roadmap" className="scroll-mt-24 border-y border-[hsl(var(--landing-line))] bg-[hsl(var(--landing-surface-2))] py-20 sm:py-24 lg:py-28" aria-labelledby="landing-roadmap-title">
        <div className="landing-shell">
          <Reveal>
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-[40rem]">
                <p className="landing-kicker">
                  <span className="landing-kicker-dot" aria-hidden="true" />
                  The Fluxrico roadmap
                </p>
                <h2
                  id="landing-roadmap-title"
                  className="mt-5 text-[2.1rem] font-extrabold leading-[1.06] tracking-[-0.055em] text-[hsl(var(--landing-ink))] sm:text-[3rem]"
                >
                  Six stages. One structured journey.
                </h2>
                <p className="mt-5 max-w-[32rem] text-[1rem] leading-7 text-[hsl(var(--landing-body))] sm:text-[1.08rem] sm:leading-8">
                  Fluxrico turns uncertainty into a structured journey. Each stage has one job, one clear next move, and a reason it comes before the one after it.
                </p>
              </div>
              <Link href="/roadmap" className="landing-btn landing-btn-ghost shrink-0 self-start lg:self-auto" data-testid="landing-roadmap-cta">
                View full roadmap →
              </Link>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:mt-14" role="list" aria-label="The six Fluxrico stages">
            {ROADMAP_STAGES.map((stage, index) => (
              <Reveal key={stage.name} delay={index * 70} className="h-full">
                <div role="listitem" className="h-full rounded-2xl border border-[hsl(var(--landing-line))] bg-[hsl(var(--landing-surface))] p-6">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-[0.72rem] font-bold tracking-[0.1em] text-[hsl(var(--landing-purple))]">{stage.number}</span>
                    <span className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-[hsl(var(--landing-muted))]">{stage.detail}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-extrabold tracking-[-0.04em] text-[hsl(var(--landing-ink))]">{stage.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-[hsl(var(--landing-body))]">{stage.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="preview" className="landing-shell scroll-mt-24 py-20 sm:py-24 lg:py-28" aria-labelledby="landing-preview-title">
        <Reveal>
          <div className="mx-auto max-w-[46rem] text-center">
            <p className="landing-kicker justify-center">
              <span className="landing-kicker-dot" aria-hidden="true" />
              Inside the workspace
            </p>
            <h2
              id="landing-preview-title"
              className="mt-5 text-[2.1rem] font-extrabold leading-[1.06] tracking-[-0.055em] text-[hsl(var(--landing-ink))] sm:text-[3rem]"
            >
              A dashboard that always shows the next move.
            </h2>
            <p className="mx-auto mt-5 max-w-[34rem] text-[1rem] leading-7 text-[hsl(var(--landing-body))] sm:text-[1.08rem] sm:leading-8">
              Everything on your desk, in one calm view — next move, current stage, progress, and the thread of what you have already done.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mx-auto mt-12 max-w-[62rem] sm:mt-14">
            <PreviewChrome
              title="fluxrico.app/dashboard"
              tone="dark"
              meta={<span className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-[hsl(236_26%_70%)]">Maya R. · in progress</span>}
            >
              <div className="grid gap-0 sm:grid-cols-[1.5fr_1fr]">
                {/* Left: the familiar dashboard cards, miniaturized */}
                <div className="space-y-3 p-4 sm:p-5">
                  <div className="rounded-xl bg-[#211F61] p-4 ring-1 ring-white/[0.07]">
                    <div className="flex items-center justify-between text-[0.54rem] font-bold uppercase tracking-[0.16em] text-[#8DDEF0]">
                      <span>The next useful step</span>
                      <span className="rounded-full border border-white/15 px-2 py-0.5 text-[0.5rem] text-[#B9BCE1]">Shape · 02</span>
                    </div>
                    <p className="mt-2.5 text-[0.95rem] font-bold leading-snug text-white">Define who this idea is for.</p>
                    <div className="mt-3 flex items-center gap-2 text-[0.6rem] font-semibold text-[#AEB2D7]">
                      <span className="rounded-full bg-[#F4F3FF] px-2.5 py-1 text-[0.52rem] font-bold uppercase tracking-[0.12em] text-[#302B79]">Start</span>
                      <span>About 10 minutes</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between text-[0.54rem] font-bold uppercase tracking-[0.16em] text-[#8DDEF0]">
                      <span>Stage progress</span>
                      <span className="text-[#B9BCE1]">2 of 6</span>
                    </div>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#16C5E9] to-[#6857E8]" />
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[0.6rem] font-semibold text-[#AEB2D7]">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#4D47A8] text-[0.5rem] font-bold text-[#BFEAF3]">✓</span>
                      Navigator complete
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.04] p-4">
                    <p className="text-[0.54rem] font-bold uppercase tracking-[0.16em] text-[#8DDEF0]">Recent activity</p>
                    <ul className="mt-2.5 space-y-2 text-[0.66rem] font-semibold text-[#C9CCE9]">
                      <li className="flex items-center justify-between gap-3"><span>Navigator completed</span><span className="text-[#7E82B3]">Today</span></li>
                      <li className="flex items-center justify-between gap-3"><span>Direction saved</span><span className="text-[#7E82B3]">Yesterday</span></li>
                      <li className="flex items-center justify-between gap-3"><span>Roadmap updated</span><span className="text-[#7E82B3]">Mon, 8 Apr</span></li>
                    </ul>
                  </div>
                </div>

                {/* Right: what the workspace keeps on your desk */}
                <div className="border-t border-white/[0.07] p-4 sm:border-l sm:border-t-0 sm:p-5">
                  <p className="text-[0.54rem] font-bold uppercase tracking-[0.18em] text-[#969BCB]">On your desk</p>
                  <ul className="mt-3 space-y-2">
                    {PREVIEW_NAV.map(({ label, icon: Icon, detail }) => (
                      <li key={label} className="flex items-start gap-2.5 rounded-lg px-2 py-2">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.07] text-[#5CD8F3]">
                          <Icon size={12} strokeWidth={1.9} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[0.68rem] font-bold text-white">{label}</p>
                          <p className="mt-0.5 truncate text-[0.6rem] text-[#8B90C0]">{detail}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </PreviewChrome>
          </div>
        </Reveal>
      </section>

      {/* Section 7 — philosophy: calm, spacious, single message */}
      <section className="border-y border-[hsl(var(--landing-line))] bg-[hsl(var(--landing-surface-2))] py-20 sm:py-24 lg:py-32" aria-labelledby="landing-philosophy-title">
        <div className="landing-shell">
          <Reveal>
            <div className="mx-auto max-w-[52rem] text-center">
              <p className="landing-kicker justify-center">
                <span className="landing-kicker-dot" aria-hidden="true" />
                The Fluxrico philosophy
              </p>
              <h2
                id="landing-philosophy-title"
                className="mt-6 text-[2.1rem] font-extrabold leading-[1.08] tracking-[-0.055em] text-[hsl(var(--landing-ink))] sm:text-[3.2rem]"
              >
                You don&apos;t need more information. You need the right next move.
              </h2>
              <div className="mx-auto mt-8 grid max-w-[46rem] gap-x-8 gap-y-4 text-left sm:grid-cols-2">
                {[
                  'Reduce confusion — one stage at a time.',
                  'Focus attention — a single next move, never a backlog.',
                  'Give useful direction — steps with a reason behind them.',
                  'Help you move forward — momentum over motion.',
                ].map((item) => (
                  <p key={item} className="flex items-start gap-3 text-[0.95rem] leading-6 text-[hsl(var(--landing-body))]">
                    <Check size={16} strokeWidth={2.4} className="mt-0.5 shrink-0 text-[hsl(var(--landing-cyan))]" aria-hidden="true" />
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Section 8 — final CTA */}
      <section className="landing-shell py-20 sm:py-24 lg:py-28" aria-labelledby="landing-final-title" id="pricing">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-[#211F61] px-6 py-14 text-center sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#6C4BE8]/40 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-[#04B9E7]/20 blur-3xl" aria-hidden="true" />
            <div className="relative mx-auto max-w-[40rem]">
              <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-[#85DDED]">Begin today</p>
              <h2
                id="landing-final-title"
                className="mt-5 text-[2.2rem] font-extrabold leading-[1.06] tracking-[-0.055em] text-[#F8F8FF] sm:text-[3.2rem]"
              >
                Your next useful step might be the one you haven&apos;t taken yet.
              </h2>
              <p className="mx-auto mt-5 max-w-[30rem] text-[1rem] leading-7 text-[#C2C4E1]">
                Start with a few questions. Leave with a direction, a stage, and a next move — free while Fluxrico is in preview.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/navigator" className="landing-btn landing-btn-light group" data-testid="landing-final-cta">
                  Start your journey
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
                <span className="text-[0.72rem] font-semibold text-[#9FA5CE]">Free during preview · no card required</span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

/** Landing footer. */
export function LandingFooter() {
  const year = new Date().getFullYear();

  const columns = [
    {
      heading: 'Product',
      links: [
        { label: 'How it works', href: '#how-it-works' },
        { label: 'Roadmap', href: '#roadmap' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Sign in', href: '/dashboard' },
      ],
    },
  ];

  return (
    <footer className="border-t border-[hsl(var(--landing-line))] bg-[hsl(var(--landing-canvas))]">
      <div className="landing-shell flex flex-col gap-10 py-12 sm:py-14 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-[22rem]">
          <FluxricoMarkFooter />
          <p className="mt-4 text-sm leading-6 text-[hsl(var(--landing-body))]">
            The calm, structured path from what you know to something people pay for.
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-8 sm:gap-14" aria-label="Footer">
          {columns.map((column) => (
            <div key={column.heading}>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[hsl(var(--landing-muted))]">{column.heading}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith('#') ? (
                      <a href={href} className="text-sm font-semibold text-[hsl(var(--landing-ink))] opacity-80 transition-opacity hover:opacity-100">
                        {label}
                      </a>
                    ) : (
                      <Link href={href} className="text-sm font-semibold text-[hsl(var(--landing-ink))] opacity-80 transition-opacity hover:opacity-100">
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[hsl(var(--landing-muted))]">Workspace</p>
            <ul className="mt-4 space-y-2.5">
              {[
                { label: 'Help & support', href: '/settings' },
                { label: 'Privacy', href: '/settings' },
                { label: 'Terms', href: '/settings' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm font-semibold text-[hsl(var(--landing-ink))] opacity-80 transition-opacity hover:opacity-100">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
      <div className="border-t border-[hsl(var(--landing-line))]">
        <div className="landing-shell flex flex-col items-start justify-between gap-2 py-5 text-[0.7rem] text-[hsl(var(--landing-muted))] sm:flex-row sm:items-center">
          <p>© {year} Fluxrico. All rights reserved.</p>
          <p className="font-semibold uppercase tracking-[0.16em]">From idea to income</p>
        </div>
      </div>
    </footer>
  );
}

/** Footer brand lockup: light-mark variant that adapts to theme. */
function FluxricoMarkFooter() {
  return (
    <span className="inline-flex items-center">
      <FluxricoMarkLightAware />
    </span>
  );
}

function FluxricoMarkLightAware() {
  return (
    <span className="flex items-center">
      <MarkSvg />
      <span className="ml-2.5 flex flex-col leading-none">
        <span
          className="text-[1.36rem] font-extrabold tracking-[-0.065em] text-[hsl(var(--landing-ink))]"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Fluxrico
        </span>
        <span className="mt-1 text-[0.5rem] font-semibold uppercase tracking-[0.26em] text-[hsl(var(--landing-muted))]">
          From idea to income
        </span>
      </span>
    </span>
  );
}

function MarkSvg() {
  return (
    <svg className="h-10 w-[42px]" viewBox="0 0 48 48" fill="none" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="footer-mark-gradient" x1="4" y1="31" x2="43" y2="14" gradientUnits="userSpaceOnUse">
          <stop stopColor="#04B7E8" />
          <stop offset="0.48" stopColor="#2459F4" />
          <stop offset="1" stopColor="#813CE9" />
        </linearGradient>
      </defs>
      <path d="M8.1 30.6c-4.8-5.6-.8-14 6.1-14 3.3 0 5.8 1.4 8.2 3.2l4.6 3.4c2.5 1.8 4.5 2.8 6.8 2.8 3.2 0 5.6-2.1 5.6-5.1 0-3.1-2.6-5.3-5.9-5.3-2.4 0-4.3 1-6.8 2.9l-3.7 2.8" stroke="url(#footer-mark-gradient)" strokeWidth="6" strokeLinecap="round" />
      <path d="M39.5 17.4c4.8 5.6.8 14-6.1 14-3.3 0-5.8-1.4-8.2-3.2l-4.6-3.4c-2.5-1.8-4.5-2.8-6.8-2.8-3.2 0-5.6 2.1-5.6 5.1 0 3.1 2.6 5.3 5.9 5.3 2.4 0 4.3-1 6.8-2.9l3.7-2.8" stroke="url(#footer-mark-gradient)" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
