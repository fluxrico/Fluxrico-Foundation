import { ArrowRight, Play } from 'lucide-react';
import { Link } from 'wouter';
import { HeroPreview } from '@/components/landing/hero-preview';
import { cn } from '@/lib/utils';

const CHAIN = ['Clarity', 'Direction', 'Next move', 'Progress'] as const;

export function LandingHero() {
  return (
    <section className="landing-hero" aria-labelledby="landing-hero-title">
      <div className="landing-shell relative z-10 flex flex-col gap-12 pb-28 pt-14 sm:pt-20 lg:flex-row lg:items-center lg:gap-14 lg:pb-36 lg:pt-24">
        <div className="max-w-[36rem] flex-1">
          <div className="fluxrico-rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#B9BEDE] backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#28BDE5] opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#18B9E1]" />
            </span>
            The guided path from idea to income
          </div>

          <h1
            id="landing-hero-title"
            className="fluxrico-rise fluxrico-rise-delay-1 mt-7 text-[2.6rem] font-extrabold leading-[1.03] tracking-[-0.06em] text-white sm:text-[3.9rem] lg:text-[4.15rem]"
          >
            Turn what you know into something people pay for.
          </h1>

          <p className="fluxrico-rise fluxrico-rise-delay-2 mt-6 max-w-[30rem] text-[1.02rem] leading-7 text-[hsl(235_25%_78%)] sm:text-[1.1rem] sm:leading-8">
            Fluxrico helps you turn an idea, skill, or knowledge into a clear digital product — one useful step at a time.
          </p>

          <div className="fluxrico-rise fluxrico-rise-delay-3 mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Link href="/navigator" className="landing-btn landing-btn-light group" data-testid="landing-hero-cta-primary">
              Start building free
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                <ArrowRight size={14} strokeWidth={2.2} />
              </span>
            </Link>
            <a
              href="#how-it-works"
              className="landing-btn border border-white/20 bg-white/[0.06] text-white backdrop-blur-sm hover:-translate-y-0.5 hover:bg-white/[0.1]"
              data-testid="landing-hero-cta-secondary"
            >
              <Play size={13} strokeWidth={2.2} aria-hidden="true" />
              See how it works
            </a>
          </div>

          {/* Clarity → Direction → Next move → Progress */}
          <ol className="fluxrico-rise fluxrico-rise-delay-3 mt-10 flex flex-wrap items-center gap-x-2.5 gap-y-2" aria-label="The Fluxrico flow">
            {CHAIN.map((item, index) => (
              <li key={item} className="flex items-center gap-2.5">
                {index > 0 && <span className="h-3 w-px bg-white/25" aria-hidden="true" />}
                <span
                  className={cn(
                    'text-[0.62rem] font-bold uppercase tracking-[0.16em]',
                    index === CHAIN.length - 1 ? 'text-[#5CD8F3]' : 'text-[#9FA5CE]',
                  )}
                >
                  {item}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Product preview — intentionally capped so mobile never balloons */}
        <div className="w-full max-w-[30rem] flex-1 self-center sm:max-w-[34rem] lg:max-w-none">
          <HeroPreview />
        </div>
      </div>
      <div className="landing-hero-fade" />
    </section>
  );
}
