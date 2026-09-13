import { ArrowRight, Check, Flag, LockKeyhole } from 'lucide-react';
import { Link } from 'wouter';
import {
  ROADMAP_STAGES,
  describeCompletedStages,
  getStageIndex,
  type RoadmapStageName,
} from '@/lib/journey';

type RoadmapProgressProps = {
  currentStage: RoadmapStageName;
  /** Stages completed through real work — shared source, not index-derived. */
  completedStages: readonly RoadmapStageName[];
  /** Honest completion percent from the shared journeyProgress calculation. */
  progressPercent: number;
  /** The current stage's next move — progress points at the action. */
  nextMove: string;
};

/**
 * Level-2 progress card — the one place that answers all four progress
 * questions from the shared sources: where am I (stage rail), how much is
 * done (honest percent + count), what have I accomplished (real completed
 * stages), and what's next (the standing stage's next move). No new state,
 * no second progress calculation — everything arrives via props from
 * useJourney. Completed / current / upcoming remain visually distinct, and
 * stages link into the existing Roadmap `?stage=` deep-linking.
 */
export function RoadmapProgress({ currentStage, completedStages, progressPercent, nextMove }: RoadmapProgressProps) {
  const currentIndex = getStageIndex(currentStage);
  const completed = new Set(completedStages);
  const completedCount = completed.size;
  const journeyComplete = completedCount === ROADMAP_STAGES.length;
  const milestoneIndex = journeyComplete ? ROADMAP_STAGES.length - 1 : Math.max(0, getStageIndex(currentStage));

  return (
    <section className="rounded-[1.65rem] border border-[#DADBF0] bg-white p-6 shadow-[0_8px_28px_rgba(44,42,123,0.04)] sm:p-7" aria-labelledby="roadmap-title" data-testid="card-roadmap-progress">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#6861C8]">Journey progress</p>
          <h2 id="roadmap-title" className="mt-2 text-xl font-extrabold tracking-[-0.045em] text-[#25265A]">Your progress.</h2>
        </div>
        <Link
          href="/roadmap"
          className="fluxrico-focus inline-flex min-h-9 items-center rounded-full px-3 text-[0.63rem] font-bold uppercase tracking-[0.13em] text-[#5D56C9] hover:bg-[#F2F1FF]"
          data-testid="button-view-full-roadmap"
        >
          View full roadmap
        </Link>
      </div>

      {/* Percent + count: the honest measure, straight from journeyProgress. */}
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-end gap-3">
          <p className="text-4xl font-extrabold leading-none tracking-[-0.055em] text-[#28295D]" data-testid="text-roadmap-progress-percent">
            {progressPercent}%
          </p>
          <p className="pb-1 text-sm font-semibold text-[#4F48C5]">
            {journeyComplete ? 'Journey complete' : `${completedCount} of ${ROADMAP_STAGES.length} stages`}
          </p>
        </div>
        <p className="pb-1 text-[0.66rem] font-bold uppercase tracking-[0.12em] text-[#8B8DDA]">
          Current stage: {currentStage}
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ECECF6]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#16C5E9] to-[#6857E8] transition-[width] duration-500"
          style={{ width: `${progressPercent}%` }}
          data-testid="progress-roadmap-journey"
        />
      </div>

      {/* Stage rail: completed filled, current highlighted, upcoming locked. */}
      <ol className="mt-8 grid grid-cols-2 gap-y-7 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-2 lg:gap-y-0" aria-label="Fluxrico roadmap">
        {ROADMAP_STAGES.map((stage, index) => {
          const isCompleted = completed.has(stage.name);
          const state = isCompleted ? 'complete' : index === currentIndex ? 'current' : 'upcoming';
          return (
            <li key={stage.name} className="relative flex items-start gap-3 lg:block" data-testid={`stage-${stage.name.toLowerCase()}`}>
              {index < ROADMAP_STAGES.length - 1 && <span className={`absolute left-[1.05rem] top-8 hidden h-px w-[calc(100%-0.5rem)] lg:block ${isCompleted ? 'bg-[#6A5BE2]' : 'bg-[#E5E5F1]'}`} aria-hidden="true" />}
              <span className={`relative z-10 flex h-[2.1rem] w-[2.1rem] shrink-0 items-center justify-center rounded-full border text-xs font-extrabold ${
                state === 'complete' ? 'border-[#6A5BE2] bg-[#6A5BE2] text-white' : state === 'current' ? 'border-[#16C5E9] bg-[#E0F9FC] text-[#168BA5] shadow-[0_0_0_5px_#F1FCFD]' : 'border-[#D8D9E9] bg-[#FAFAFD] text-[#9B9DB5]'
              }`}>
                {isCompleted ? <Check size={14} strokeWidth={2.5} /> : state === 'upcoming' ? <LockKeyhole size={12} strokeWidth={1.8} /> : stage.number}
              </span>
              <div className="pt-1 lg:mt-3 lg:pt-0">
                <Link
                  href={`/roadmap?stage=${stage.name}`}
                  className="fluxrico-focus block rounded text-sm font-bold transition-colors hover:underline"
                  data-testid={`stage-link-${stage.name.toLowerCase()}`}
                >
                  <span className={state === 'current' ? 'text-[#4E46C0]' : isCompleted ? 'text-[#343568]' : 'text-[#888BA8]'}>
                    <span className="mr-1 text-[0.6rem] font-bold tracking-[0.12em] opacity-70">{stage.number} —</span>
                    {stage.name}
                  </span>
                </Link>
                <p className="mt-1 text-[0.66rem] leading-4 text-[#9A9CB3]">{stage.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Milestones: the completed stages themselves are the milestones. */}
      <div className="mt-7 border-t border-[#ECECF1] pt-5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#F0EEFF]" aria-hidden="true">
            <Flag size={13} strokeWidth={1.9} />
          </span>
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-[#8587A3]">What you've accomplished</p>
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#343568]" data-testid="text-roadmap-accomplished">
          {describeCompletedStages(completedStages)}
          {!journeyComplete && ` Now in ${currentStage}, stage ${milestoneIndex + 1} of ${ROADMAP_STAGES.length}.`}
        </p>
        {completedCount > 0 ? (
          <ul className="mt-3.5 flex flex-wrap gap-1.5" aria-label="Completed stages">
            {ROADMAP_STAGES.filter((stage) => completed.has(stage.name)).map((stage) => (
              <li key={stage.name}>
                <Link
                  href={`/roadmap?stage=${stage.name}`}
                  className="fluxrico-focus inline-flex min-h-7 items-center gap-1.5 rounded-full border border-[#E4E4F4] bg-[#FAFAFE] px-2.5 text-[0.62rem] font-bold tracking-[-0.01em] text-[#343568] hover:border-[#B4ABF0]"
                  data-testid={`milestone-${stage.name.toLowerCase()}`}
                >
                  <Check size={12} strokeWidth={2.5} className="text-[#6A5BE2]" aria-hidden="true" />
                  {stage.name} completed
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3.5 text-xs leading-5 text-[#8587A3]">
            Completing Navigator marks Start as your first milestone.
          </p>
        )}
      </div>

      {/* What's next: progress always ends pointing at the one live move. */}
      <div className="mt-6 rounded-[1.35rem] border border-[#E4E4F4] bg-[#FAFAFE] p-4 sm:p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-[#6256DB]">What's next</p>
            <p className="mt-1.5 max-w-[24rem] truncate text-sm font-bold leading-6 text-[#25265A]" title={nextMove}>
              {journeyComplete ? 'The full path is behind you — pick any stage to revisit it.' : nextMove}
            </p>
          </div>
          <Link
            href={journeyComplete ? '/roadmap' : `/roadmap?stage=${currentStage}`}
            className="fluxrico-focus inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#EBE9FF] px-4 text-[0.62rem] font-bold uppercase tracking-[0.13em] text-[#5147C2] hover:bg-white"
            data-testid="button-progress-next-move"
          >
            {journeyComplete ? 'Open roadmap' : 'Open next move'}
            <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
