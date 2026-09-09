import { Compass, Route, Target } from 'lucide-react';
import { Link } from 'wouter';
import { ROADMAP_STAGES } from '@/lib/journey';
import { Reveal } from '@/components/landing/reveal';
import { PreviewChrome } from '@/components/landing/preview-chrome';
import { cn } from '@/lib/utils';

const FRICTIONS = [
  {
    icon: Compass,
    title: 'Too many choices',
    body: 'Courses, tools, platforms, advice — every option promises to be the one. Choosing becomes the work.',
  },
  {
    icon: Target,
    title: 'No clear next step',
    body: 'You know where you want to go. You do not know what to do on Tuesday morning.',
  },
  {
    icon: Route,
    title: 'Structure is missing',
    body: 'Effort without sequence stalls. What is missing is not information — it is order.',
  },
] as const;

/**
 * Section 2 — The problem, and Section 3 — The Fluxrico journey
 * (IDEA → CLARITY → VALIDATION → BUILD → LAUNCH → GROW).
 */
export function LandingProblemJourney() {
  return (
    <>
      <section id="problem" className="landing-shell scroll-mt-24 py-20 sm:py-24 lg:py-28" aria-labelledby="landing-problem-title">
        <Reveal>
          <div className="max-w-[46rem]">
            <p className="landing-kicker">
              <span className="landing-kicker-dot" aria-hidden="true" />
              The problem
            </p>
            <h2
              id="landing-problem-title"
              className="mt-5 text-[2.1rem] font-extrabold leading-[1.06] tracking-[-0.055em] text-[hsl(var(--landing-ink))] sm:text-[3rem]"
            >
              Having an idea is easy. Knowing what to do next is the hard part.
            </h2>
            <p className="mt-5 max-w-[34rem] text-[1rem] leading-7 text-[hsl(var(--landing-body))] sm:text-[1.08rem] sm:leading-8">
              Most ideas do not fail in public — they stall quietly, between enthusiasm and execution. Fluxrico exists for that space.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:mt-14 md:grid-cols-3">
          {FRICTIONS.map(({ icon: Icon, title, body }, index) => (
            <Reveal key={title} delay={index * 90} className="h-full">
              <article className="h-full rounded-2xl border border-[hsl(var(--landing-line))] bg-[hsl(var(--landing-surface))] p-6 shadow-[0_10px_30px_hsl(var(--landing-shadow-color)/0.05)] sm:p-7">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--landing-purple-soft))] text-[hsl(var(--landing-purple))]">
                  <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-bold tracking-[-0.03em] text-[hsl(var(--landing-ink))]">{title}</h3>
                <p className="mt-2.5 text-sm leading-6 text-[hsl(var(--landing-body))]">{body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 border-y border-[hsl(var(--landing-line))] bg-[hsl(var(--landing-surface-2))] py-20 sm:py-24 lg:py-28" aria-labelledby="landing-journey-title">
        <div className="landing-shell">
          <Reveal>
            <div className="max-w-[46rem]">
              <p className="landing-kicker">
                <span className="landing-kicker-dot" aria-hidden="true" />
                Introducing Fluxrico
              </p>
              <h2
                id="landing-journey-title"
                className="mt-5 text-[2.1rem] font-extrabold leading-[1.06] tracking-[-0.055em] text-[hsl(var(--landing-ink))] sm:text-[3rem]"
              >
                One journey, six stages, zero guesswork.
              </h2>
              <p className="mt-5 max-w-[34rem] text-[1rem] leading-7 text-[hsl(var(--landing-body))] sm:text-[1.08rem] sm:leading-8">
                Fluxrico turns uncertainty into a structured journey — the same stages every real product passes through, arranged so you always know what comes next.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 sm:mt-14">
            {/* Desktop: connected rail. Mobile: stacked cards. */}
            <div className="relative hidden lg:block">
              <div
                className="absolute left-0 right-0 top-[2.1rem] h-px bg-gradient-to-r from-[hsl(var(--landing-cyan))] via-[hsl(var(--landing-purple))] to-[hsl(266_76%_66%)] opacity-40"
                aria-hidden="true"
              />
              <ol className="relative grid grid-cols-6 gap-4" aria-label="The Fluxrico journey">
                {ROADMAP_STAGES.map((stage, index) => (
                  <li key={stage.name} className="flex flex-col">
                    <span
                      className={cn(
                        'flex h-[2.1rem] w-[2.1rem] items-center justify-center rounded-full border text-[0.62rem] font-extrabold',
                        index < 2
                          ? 'border-transparent bg-[hsl(var(--landing-purple-deep))] text-[hsl(var(--landing-primary-contrast))]'
                          : 'border-[hsl(var(--landing-line))] bg-[hsl(var(--landing-surface))] text-[hsl(var(--landing-muted))]',
                      )}
                    >
                      {stage.number}
                    </span>
                    <h3 className="mt-4 text-base font-bold tracking-[-0.02em] text-[hsl(var(--landing-ink))]">
                      {stage.name === 'Start' ? 'Idea' : stage.name === 'Shape' ? 'Clarity' : stage.name === 'Move' ? 'Validation' : stage.name}
                    </h3>
                    <p className="mt-1.5 text-[0.8rem] leading-5 text-[hsl(var(--landing-body))]">{stage.description}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid gap-3 lg:hidden" role="list" aria-label="The Fluxrico journey">
              {ROADMAP_STAGES.map((stage, index) => (
                <Reveal key={stage.name} delay={index * 60}>
                  <div role="listitem" className="flex items-start gap-4 rounded-2xl border border-[hsl(var(--landing-line))] bg-[hsl(var(--landing-surface))] p-4 sm:p-5">
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[0.66rem] font-extrabold',
                        index < 2
                          ? 'border-transparent bg-[hsl(var(--landing-purple-deep))] text-[hsl(var(--landing-primary-contrast))]'
                          : 'border-[hsl(var(--landing-line))] text-[hsl(var(--landing-muted))]',
                      )}
                    >
                      {stage.number}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold tracking-[-0.02em] text-[hsl(var(--landing-ink))]">
                        {stage.name === 'Start' ? 'Idea' : stage.name === 'Shape' ? 'Clarity' : stage.name === 'Move' ? 'Validation' : stage.name}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[hsl(var(--landing-body))]">{stage.description}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/** Section 4 — Navigator marketing preview. */
export function LandingNavigator() {
  const answered = 'Define who this idea is for.';
  return (
    <section id="product" className="landing-shell scroll-mt-24 py-20 sm:py-24 lg:py-28" aria-labelledby="landing-navigator-title">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <Reveal>
          <div>
            <p className="landing-kicker">
              <span className="landing-kicker-dot" aria-hidden="true" />
              The Navigator
            </p>
            <h2
              id="landing-navigator-title"
              className="mt-5 text-[2.1rem] font-extrabold leading-[1.06] tracking-[-0.055em] text-[hsl(var(--landing-ink))] sm:text-[3rem]"
            >
              Get personalized direction, instantly.
            </h2>
            <p className="mt-5 max-w-[30rem] text-[1rem] leading-7 text-[hsl(var(--landing-body))] sm:text-[1.08rem] sm:leading-8">
              Answer a few focused questions. Fluxrico shapes them into a direction using deterministic product logic — no randomness, no guessing games. You leave with a next move you can actually take.
            </p>
            <ol className="mt-8 space-y-4" aria-label="How the Navigator works">
              {[
                'Answer a few focused questions',
                'Fluxrico analyzes the answers with deterministic product logic',
                'Receive a personalized direction',
              ].map((step, index) => (
                <li key={step} className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--landing-purple-soft))] text-[0.66rem] font-extrabold text-[hsl(var(--landing-purple))]">
                    {index + 1}
                  </span>
                  <span className="text-[0.95rem] font-semibold leading-6 text-[hsl(var(--landing-ink))]">{step}</span>
                </li>
              ))}
            </ol>
            <Link href="/navigator" className="landing-btn landing-btn-primary group mt-9" data-testid="landing-navigator-cta">
              Try the Navigator
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <PreviewChrome
            title="fluxrico.app/navigator"
            tone="light"
            footer="Step 03 of 04 · About two minutes"
            meta={
              <span className="rounded-full bg-[hsl(var(--landing-purple-soft))] px-2.5 py-1 text-[0.56rem] font-bold uppercase tracking-[0.14em] text-[hsl(var(--landing-purple))]">
                Live preview
              </span>
            }
          >
            <div className="p-5 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-[#6264A0]">Navigator</span>
                <span className="font-mono text-[0.62rem] font-semibold tracking-[0.12em] text-[hsl(var(--landing-muted))]">03 / 04</span>
              </div>
              <div className="mt-3 flex gap-1.5" aria-hidden="true">
                <span className="h-1 flex-1 rounded-full bg-[#6256DB]" />
                <span className="h-1 flex-1 rounded-full bg-[#6256DB]" />
                <span className="h-1 flex-1 rounded-full bg-[#6256DB]" />
                <span className="h-1 flex-1 rounded-full bg-[hsl(235_30%_90%)]" />
              </div>
              <p className="mt-6 text-xl font-extrabold tracking-[-0.04em] text-[#202155] sm:text-2xl">What do you have most?</p>
              <div className="mt-5 space-y-2.5" aria-hidden="true">
                {[
                  { label: 'Knowledge', selected: true },
                  { label: 'Creativity', selected: false },
                  { label: 'Audience', selected: false },
                  { label: 'Technical skills', selected: false },
                ].map(({ label, selected }) => (
                  <div
                    key={label}
                    className={cn(
                      'flex min-h-[3.4rem] items-center justify-between gap-3 rounded-2xl border px-4 py-3',
                      selected ? 'border-[#6256DB] bg-[#F0EFFF]' : 'border-[hsl(var(--landing-line))] bg-[hsl(var(--landing-canvas))]',
                    )}
                  >
                    <span className={cn('text-[0.92rem] font-semibold', selected ? 'text-[#302974]' : 'text-[#37396B]')}>{label}</span>
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full border text-[0.66rem] font-bold',
                        selected ? 'border-[#6256DB] bg-[#6256DB] text-white' : 'border-[hsl(var(--landing-line))] text-transparent',
                      )}
                    >
                      ✓
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-[hsl(var(--landing-purple-soft))] p-4">
                <p className="text-[0.56rem] font-bold uppercase tracking-[0.16em] text-[hsl(var(--landing-purple))]">Early signal</p>
                <p className="mt-1 text-[0.8rem] leading-5 text-[hsl(var(--landing-body))]">
                  One more answer and your direction is ready — starting with “{answered.toLowerCase()}”
                </p>
              </div>
            </div>
          </PreviewChrome>
        </Reveal>
      </div>
    </section>
  );
}
