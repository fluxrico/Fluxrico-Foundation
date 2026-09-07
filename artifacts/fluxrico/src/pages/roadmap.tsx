import { Check, Compass, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { NextMoveCard } from '@/components/navigator-result';
import { NavigatorShell } from '@/components/navigator-shell';
import { ROADMAP_STAGES, RoadmapStageCards, getStageIndex } from '@/components/roadmap-stage-cards';
import type { RoadmapStageName } from '@/components/roadmap-stage-cards';

const STAGE_NAMES = ROADMAP_STAGES.map((stage) => stage.name);

function resolveStageFromSearch(search: string): RoadmapStageName {
  const params = new URLSearchParams(search);
  const requested = params.get('stage');
  const match = STAGE_NAMES.find((name) => name.toLowerCase() === requested?.toLowerCase());
  return match ?? 'Shape';
}

export default function Roadmap() {
  const currentStage = resolveStageFromSearch(typeof window !== 'undefined' ? window.location.search : '');
  const currentIndex = getStageIndex(currentStage);
  const stageInfo = ROADMAP_STAGES[currentIndex];
  const progressPercent = ((currentIndex + 1) / ROADMAP_STAGES.length) * 100;
  const [notice, setNotice] = useState<string | null>(null);

  const announce = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4200);
  };

  return (
    <NavigatorShell>
      <div className="mx-auto max-w-[1120px]">
        <div className="fluxrico-rise mt-12 flex flex-col justify-between gap-5 sm:mt-16 sm:flex-row sm:items-start">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.21em] text-[#6258D0]">Roadmap / the full path</p>
            <h1 className="mt-5 max-w-[42rem] text-[2.7rem] font-extrabold leading-[0.98] tracking-[-0.075em] text-[#202155] sm:text-[4.2rem]">Your path, one stage at a time.</h1>
            <p className="mt-5 max-w-[33rem] text-base leading-7 text-[#737696]">Six calm stages between an unfinished idea and a working, growing thing. No pressure to move fast — just a clear next step.</p>
          </div>
          <Link
            href="/dashboard"
            className="fluxrico-focus inline-flex min-h-11 shrink-0 items-center rounded-full border border-[#D4D5E8] bg-white px-5 text-[0.66rem] font-bold uppercase tracking-[0.15em] text-[#5753A5] transition-colors hover:border-[#8E88E1]"
            data-testid="link-roadmap-dashboard"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.04fr_0.96fr]">
          <section className="rounded-[1.8rem] border border-[#DCDDED] bg-white/80 p-6 shadow-[0_18px_40px_rgba(45,42,120,0.06)] sm:p-9" aria-labelledby="roadmap-current-stage-title" data-testid="card-roadmap-current-stage">
            <div className="flex items-start justify-between gap-5">
              <div className="flex items-center gap-2 text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#6861C8]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F0EEFF]"><Compass size={15} strokeWidth={1.8} /></span>
                CURRENT STAGE
              </div>
              <span className="rounded-full bg-[#F0EEFF] px-3 py-1.5 text-[0.58rem] font-bold uppercase tracking-[0.15em] text-[#6258D0]">{stageInfo.number} / {String(ROADMAP_STAGES.length).padStart(2, '0')}</span>
            </div>
            <h2 id="roadmap-current-stage-title" className="mt-6 text-[2.65rem] font-extrabold leading-none tracking-[-0.075em] text-[#202155]">{stageInfo.name}</h2>
            <p className="mt-3 max-w-[26rem] text-sm leading-6 text-[#727596]">{stageInfo.description}</p>
            <div className="mt-8">
              <div className="flex items-center justify-between text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#8385A1]"><span>Roadmap progress</span><span className="text-[#6258D0]">{currentIndex + 1} of {ROADMAP_STAGES.length} stages</span></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ECECF6]"><div className="h-full rounded-full bg-gradient-to-r from-[#16C5E9] to-[#6857E8]" style={{ width: `${progressPercent}%` }} /></div>
            </div>
          </section>
          <NextMoveCard move={stageInfo.nextMove} onStart={() => announce('Your next move is noted locally. Tools for this step are still taking shape.')} />
        </div>

        {notice && (
          <div className="fluxrico-rise mt-5 flex items-start gap-3 rounded-xl border border-[#C9D9F0] bg-[#F0F8FF] px-4 py-3 text-sm text-[#38567B]" role="status" aria-live="polite" data-testid="status-roadmap-notice">
            <Check size={17} className="mt-0.5 shrink-0 text-[#178EAD]" strokeWidth={2.2} />
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} className="fluxrico-focus ml-auto rounded p-0.5 text-[#7183A2] hover:text-[#38567B]" aria-label="Dismiss notice" data-testid="button-dismiss-roadmap-notice"><X size={15} /></button>
          </div>
        )}

        <div className="mt-10">
          <RoadmapStageCards currentStage={currentStage} />
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-[#DDDEEC] pt-5 sm:flex-row sm:items-center">
          <p className="max-w-[33rem] text-xs leading-5 text-[#888AA4]">This roadmap reflects where Navigator pointed you. It stays simple until your next move is clear.</p>
          <Link href="/dashboard" className="fluxrico-focus inline-flex min-h-11 items-center rounded-full bg-[#211F61] px-5 text-[0.66rem] font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#35318A]" data-testid="link-roadmap-dashboard-footer">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </NavigatorShell>
  );
}
