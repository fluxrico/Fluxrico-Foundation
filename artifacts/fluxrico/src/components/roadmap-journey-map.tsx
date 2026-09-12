import { Check, Flag, LockKeyhole } from 'lucide-react';
import { Link } from 'wouter';
import { ROADMAP_STAGES, getStageIndex } from '@/lib/journey';
import type { RoadmapStageName } from '@/lib/journey';

type RoadmapJourneyMapProps = {
  currentStage: RoadmapStageName;
  activeStage: RoadmapStageName;
  /** Stages completed through real work — shared source, not index-derived. */
  completedStages: readonly RoadmapStageName[];
};

/**
 * Level-2 journey map: the six stages with clear completed / current /
 * upcoming states. The current stage gets the strongest visual emphasis.
 * Every stage deep-links with `?stage=`; selection updates the detail panel
 * without leaving the page.
 */
export function RoadmapJourneyMap({ currentStage, activeStage, completedStages }: RoadmapJourneyMapProps) {
  const currentIndex = getStageIndex(currentStage);
  const activeIndex = getStageIndex(activeStage);
  const completed = new Set(completedStages);

  return (
    <section aria-labelledby="journey-map-heading" data-testid="section-roadmap-journey-map">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 id="journey-map-heading" className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-[#6258D0]">
            The journey map
          </h2>
          <p className="mt-1.5 text-xs font-medium text-[#8587A3]">Six stages, one clear next move at a time.</p>
        </div>
        <div className="flex items-center gap-4 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#8587A3]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#6A5BE2]" aria-hidden="true" /> Completed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#16C6EA]" aria-hidden="true" /> Current
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#D8D9E9]" aria-hidden="true" /> Upcoming
          </span>
        </div>
      </div>

      <ol className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Fluxrico roadmap stages">
        {ROADMAP_STAGES.map((stage, index) => {
          const isCompleted = completed.has(stage.name);
          const state = isCompleted ? 'complete' : index === currentIndex ? 'current' : 'upcoming';
          const selected = index === activeIndex;

          return (
            <li key={stage.name} className="dashboard-card-lift" data-testid={`journey-stage-${stage.name.toLowerCase()}`}>
              <Link
                href={`/roadmap?stage=${stage.name}`}
                aria-current={selected ? 'true' : undefined}
                className={`fluxrico-focus flex h-full min-h-[8.6rem] flex-col rounded-[1.25rem] border p-4 transition-colors ${
                  state === 'current'
                    ? 'border-[#6256DB] bg-gradient-to-b from-[#F1EFFF] to-[#ECE9FF] shadow-[0_14px_32px_rgba(74,66,196,0.12)]'
                    : state === 'complete'
                      ? selected
                        ? 'border-[#AAA5E5] bg-white shadow-[0_10px_24px_rgba(44,42,123,0.07)]'
                        : 'border-[#DADBF0] bg-white'
                      : selected
                        ? 'border-[#B9B5EC] bg-white shadow-[0_10px_24px_rgba(44,42,123,0.06)]'
                        : 'border-[#E4E4EF] bg-[#FAFAFE]'
                }`}
                data-testid={`journey-stage-link-${stage.name.toLowerCase()}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[0.68rem] font-extrabold ${
                      state === 'complete'
                        ? 'border-[#6A5BE2] bg-[#6A5BE2] text-white'
                        : state === 'current'
                          ? 'border-[#16C5E9] bg-[#E0F9FC] text-[#168BA5] shadow-[0_0_0_4px_#F1FCFD]'
                          : 'border-[#D8D9E9] bg-white text-[#9B9DB5]'
                    }`}
                    aria-hidden="true"
                  >
                    {isCompleted ? <Check size={14} strokeWidth={2.5} /> : state === 'upcoming' ? <LockKeyhole size={12} strokeWidth={1.8} /> : stage.number}
                  </span>
                  {state === 'current' && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#CFCCF6] bg-white px-2 py-0.5 text-[0.54rem] font-bold uppercase tracking-[0.12em] text-[#6256DB]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#16C6EA]" aria-hidden="true" />
                      Current
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-[0.54rem] font-bold uppercase tracking-[0.12em] text-[#6A5BE2]">Done</span>
                  )}
                </div>

                <p className={`mt-4 text-[1.05rem] font-extrabold leading-none tracking-[-0.035em] ${state === 'current' || state === 'complete' ? 'text-[#25265A]' : 'text-[#7B7E9C]'}`}>
                  <span className="mr-1 font-mono text-[0.6rem] font-bold tracking-[0.1em] opacity-70">{stage.number}</span>
                  {stage.name}
                </p>
                <p className={`mt-1.5 flex-1 text-[0.66rem] font-semibold uppercase tracking-[0.07em] ${state === 'upcoming' ? 'text-[#A0A2B7]' : 'text-[#6861C8]'}`}>
                  {stage.detail}
                </p>

                <span
                  className={`mt-3 inline-flex min-h-6 items-center gap-1 text-[0.58rem] font-bold uppercase tracking-[0.12em] ${
                    selected ? 'text-[#5147C2]' : 'text-[#A0A2B7]'
                  }`}
                >
                  {selected ? <Flag size={11} strokeWidth={2.2} /> : <span className="h-1 w-4 rounded-full bg-current opacity-50" aria-hidden="true" />}
                  {selected ? 'Viewing' : 'View stage'}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
