import { Bell, Compass, Home, Library, Route, Settings2, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGES = ['Start', 'Shape', 'Move', 'Build', 'Launch', 'Grow'] as const;

const NAV_ICONS = [Home, Compass, Route, Library, Bell, UserRound, Settings2];

/**
 * A calm, dark preview of the Fluxrico workspace used inside the hero. It
 * mirrors the real dashboard's structure — next move, current stage, stage
 * progress, and the six-stage path — using the same indigo/cyan language as
 * the product, without duplicating the full experience.
 */
export function HeroPreview() {
  return (
    <div
      aria-hidden="true"
      className="landing-hero-panel relative overflow-hidden p-3 sm:p-4"
    >
      {/* ambient glow, kept inside the panel */}
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#6C4BE8]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-[#04B9E7]/14 blur-3xl" />

      <div className="relative rounded-xl bg-[hsl(241_50%_11%)]/70 ring-1 ring-white/[0.06]">
        {/* workspace top bar */}
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <svg className="h-5 w-5" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <defs>
                <linearGradient id="hero-mark-gradient" x1="4" y1="31" x2="43" y2="14" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#04B7E8" />
                  <stop offset="0.48" stopColor="#2459F4" />
                  <stop offset="1" stopColor="#813CE9" />
                </linearGradient>
              </defs>
              <path d="M8.1 30.6c-4.8-5.6-.8-14 6.1-14 3.3 0 5.8 1.4 8.2 3.2l4.6 3.4c2.5 1.8 4.5 2.8 6.8 2.8 3.2 0 5.6-2.1 5.6-5.1 0-3.1-2.6-5.3-5.9-5.3-2.4 0-4.3 1-6.8 2.9l-3.7 2.8" stroke="url(#hero-mark-gradient)" strokeWidth="6" strokeLinecap="round" />
              <path d="M39.5 17.4c4.8 5.6.8 14-6.1 14-3.3 0-5.8-1.4-8.2-3.2l-4.6-3.4c-2.5-1.8-4.5-2.8-6.8-2.8-3.2 0-5.6 2.1-5.6 5.1 0 3.1 2.6 5.3 5.9 5.3 2.4 0 4.3-1 6.8-2.9l3.7-2.8" stroke="url(#hero-mark-gradient)" strokeWidth="6" strokeLinecap="round" />
            </svg>
            <span className="hidden text-[0.6rem] font-bold uppercase tracking-[0.2em] text-[#969BCB] sm:block">Workspace</span>
          </div>
          <div className="flex items-center gap-3">
            <Bell size={14} className="text-[#8B90C0]" />
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D9F5FA] text-[0.55rem] font-extrabold text-[#267A8D]">MR</span>
          </div>
        </div>

        <div className="flex">
          {/* sidebar rail — same navigation architecture as the product */}
          <div className="hidden w-12 flex-col items-center gap-1 border-r border-white/[0.07] py-3 sm:flex">
            {NAV_ICONS.map((Icon, index) => (
              <span
                key={index}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg',
                  index === 0 ? 'bg-white/10 text-[#5CD8F3]' : 'text-[#6E72A5]',
                )}
              >
                <Icon size={14} strokeWidth={1.8} />
              </span>
            ))}
          </div>

          {/* main canvas */}
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-[#8DDEF0]">Your next useful step</p>
                <p className="mt-1.5 text-sm font-bold leading-snug text-white sm:text-[0.95rem]">Define who this idea is for.</p>
              </div>
              <span className="rounded-full border border-white/15 px-2.5 py-1 text-[0.52rem] font-bold uppercase tracking-[0.14em] text-[#B9BCE1]">
                Shape · 02
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
              <div className="rounded-xl bg-[#211F61] p-3.5 ring-1 ring-white/[0.07]">
                <div className="flex items-center justify-between text-[0.52rem] font-bold uppercase tracking-[0.16em] text-[#8DDEF0]">
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
              <div className="rounded-xl bg-white/[0.05] p-3.5 ring-1 ring-white/[0.07]">
                <p className="text-[0.52rem] font-bold uppercase tracking-[0.16em] text-[#8DDEF0]">Directional signal</p>
                <div className="mt-2 flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#70D6E9] bg-[#29266D] text-[0.55rem] font-extrabold text-white">
                    84%
                  </span>
                  <p className="text-[0.6rem] leading-4 text-[#AEB2D7]">
                    Your answers point toward one direction.
                  </p>
                </div>
              </div>
            </div>

            {/* journey path */}
            <div className="relative mt-4 rounded-xl bg-white/[0.03] p-3.5 ring-1 ring-white/[0.06]">
              <svg className="absolute inset-x-3.5 top-[2.65rem] hidden h-3 w-[calc(100%-1.75rem)] sm:block" viewBox="0 0 100 10" preserveAspectRatio="none" fill="none">
                <defs>
                  <linearGradient id="hero-path-gradient" x1="0" y1="5" x2="100" y2="5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#09C7EE" />
                    <stop offset="0.5" stopColor="#5165FF" />
                    <stop offset="1" stopColor="#B56CFF" />
                  </linearGradient>
                </defs>
                <path d="M1 6C20 1 32 9 50 5C68 1 80 9 99 4" stroke="url(#hero-path-gradient)" strokeWidth="1" strokeDasharray="4 3" className="fluxrico-dash opacity-70" />
              </svg>
              <ol className="relative flex items-start justify-between gap-1">
                {STAGES.map((stage, index) => {
                  const state = index === 0 ? 'done' : index === 1 ? 'current' : 'next';
                  return (
                    <li key={stage} className="flex flex-col items-center gap-1.5 text-center">
                      <span
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full text-[0.5rem] font-bold',
                          state === 'done' && 'bg-[#6A5BE2] text-white',
                          state === 'current' && 'border border-[#16C5E9] bg-[#E0F9FC]/20 text-[#5CD8F3] shadow-[0_0_0_3px_rgba(22,197,233,0.14)]',
                          state === 'next' && 'border border-white/15 text-[#6E72A5]',
                        )}
                      >
                        {state === 'done' ? '✓' : index + 1}
                      </span>
                      <span className={cn('text-[0.52rem] font-bold sm:text-[0.56rem]', state === 'current' ? 'text-white' : 'text-[#6E72A5]')}>
                        {stage}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* floating confirmation chip */}
      <div className="fluxrico-drift absolute -right-2 top-16 hidden rounded-xl border border-[#9D84FF]/30 bg-[#5745AC]/85 px-3 py-2 shadow-lg backdrop-blur-md lg:block">
        <p className="text-[0.52rem] font-semibold uppercase tracking-[0.16em] text-[#D9D3FF]">Direction saved</p>
        <p className="mt-0.5 text-[0.68rem] font-semibold text-white">Your next move is ready</p>
      </div>

      <div className="fluxrico-drift-slow absolute -left-3 bottom-14 hidden rounded-xl border border-white/15 bg-[#252765]/90 px-3 py-2 shadow-lg backdrop-blur-md lg:block">
        <p className="text-[0.52rem] font-semibold uppercase tracking-[0.16em] text-[#9FA7D7]">Goal</p>
        <p className="mt-0.5 text-[0.68rem] font-semibold text-white">Build &amp; launch a product</p>
      </div>

    </div>
  );
}
