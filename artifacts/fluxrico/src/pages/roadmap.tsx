import { Check, Map as MapIcon, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearch } from 'wouter';
import { AppShell } from '@/components/app-shell';
import { NextMoveCard } from '@/components/next-move-card';
import { RoadmapJourneyMap } from '@/components/roadmap-journey-map';
import { RoadmapStageDetail } from '@/components/roadmap-stage-detail';
import { useJourney } from '@/hooks/use-journey';
import { ROADMAP_STAGES, getStageIndex, stageFromSearch } from '@/lib/journey';

export default function Roadmap() {
  const search = useSearch();
  const journey = useJourney();
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
  }, []);

  const announce = (message: string) => {
    setNotice(message);
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 4200);
  };

  // ?stage= deep link wins; otherwise the journey's current stage opens.
  const currentStage = stageFromSearch(search, journey.currentStage);
  const stageIndex = getStageIndex(currentStage);
  const stageInfo = ROADMAP_STAGES[stageIndex];
  const isCurrentStage = currentStage === journey.currentStage;

  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px]">
        <div className="fluxrico-rise flex flex-col justify-between gap-5 sm:flex-row sm:items-start lg:items-end">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.21em] text-[#6258D0]">Roadmap / your complete journey map</p>
            <h1 className="mt-3 max-w-[42rem] text-[2.7rem] font-extrabold leading-[0.98] tracking-[-0.075em] text-[#202155] sm:text-[4.2rem]">Your Roadmap</h1>
            <p className="mt-4 max-w-[34rem] text-base leading-7 text-[#737696]">Your journey from starting point to growth. Six stages, each one telling you where you are, what to do, and how to know you are done.</p>
          </div>
          <Link
            href="/dashboard"
            className="fluxrico-focus inline-flex min-h-11 shrink-0 items-center rounded-full border border-[#D4D5E8] bg-white px-5 text-[0.66rem] font-bold uppercase tracking-[0.15em] text-[#5753A5] transition-colors hover:border-[#8E88E1]"
            data-testid="link-roadmap-dashboard"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Level 1 — the journey map: all six stages, current one emphasized. */}
        <div className="fluxrico-rise fluxrico-rise-delay-1 mt-9">
          <RoadmapJourneyMap currentStage={journey.currentStage} activeStage={currentStage} />
        </div>

        {/* Level 2 — the selected stage beside its next move. */}
        <div className="fluxrico-rise fluxrico-rise-delay-2 mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <RoadmapStageDetail currentStage={journey.currentStage} activeStage={currentStage} />

          <div className="flex flex-col gap-5">
            <NextMoveCard
              move={stageInfo.nextMove}
              stageName={stageInfo.name}
              stageNumber={stageInfo.number}
              hint={stageInfo.why}
              onStart={() => announce('Your next move is noted locally. Tools for this step are still taking shape.')}
            />

            <section
              className="rounded-[1.65rem] border border-[#DADBF0] bg-white p-6 shadow-[0_8px_28px_rgba(44,42,123,0.04)]"
              aria-labelledby="roadmap-progress-title"
              data-testid="card-roadmap-progress"
            >
              <div className="flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#6861C8]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F0EEFF]"><MapIcon size={14} strokeWidth={1.9} /></span>
                Journey progress
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-[#343568]">
                {isCurrentStage
                  ? `You are in ${journey.currentStage}.`
                  : `Viewing ${currentStage}. Your current stage is ${journey.currentStage}.`}
              </p>
              <div className="mt-4">
                <div className="flex items-center justify-between text-[0.62rem] font-bold uppercase tracking-[0.13em] text-[#8385A1]">
                  <span>Stages</span>
                  <span className="text-[#6258D0]">{stageIndex + 1} of {ROADMAP_STAGES.length}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ECECF6]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#16C5E9] to-[#6857E8] transition-[width] duration-500" style={{ width: `${((stageIndex + 1) / ROADMAP_STAGES.length) * 100}%` }} />
                </div>
              </div>
              <p className="mt-4 border-t border-[#ECECF1] pt-4 text-xs leading-5 text-[#8587A3]">
                {journey.completedStages.length > 0
                  ? `${journey.completedStages.length} stage${journey.completedStages.length === 1 ? '' : 's'} completed so far.`
                  : 'No stages completed yet — every journey starts at 01.'}
              </p>
            </section>
          </div>
        </div>

        {notice && (
          <div className="fluxrico-rise mt-5 flex items-start gap-3 rounded-xl border border-[#C9D9F0] bg-[#F0F8FF] px-4 py-3 text-sm text-[#38567B]" role="status" aria-live="polite" data-testid="status-roadmap-notice">
            <Check size={17} className="mt-0.5 shrink-0 text-[#178EAD]" strokeWidth={2.2} />
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} className="fluxrico-focus ml-auto rounded p-0.5 text-[#7183A2] hover:text-[#38567B]" aria-label="Dismiss notice" data-testid="button-dismiss-roadmap-notice"><X size={15} /></button>
          </div>
        )}

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-[#DDDEEC] pt-5 sm:flex-row sm:items-center">
          <p className="max-w-[36rem] text-xs leading-5 text-[#888AA4]">This roadmap reflects where Navigator pointed you. Stages open in place, so you can always see the whole path and the next useful step together.</p>
          <Link href="/dashboard" className="fluxrico-focus inline-flex min-h-11 items-center rounded-full bg-[#211F61] px-5 text-[0.66rem] font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#35318A]" data-testid="link-roadmap-dashboard-footer">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
