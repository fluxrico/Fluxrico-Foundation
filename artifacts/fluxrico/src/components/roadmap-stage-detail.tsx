import type { ReactNode } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Compass, ListChecks, Lightbulb, CircleDot } from 'lucide-react';
import { Link } from 'wouter';
import {
  ROADMAP_STAGE_GUIDES,
  ROADMAP_STAGES,
  getStageIndex,
  type RoadmapStageInfo,
  type RoadmapStageName,
} from '@/lib/journey';

type RoadmapStageDetailProps = {
  currentStage: RoadmapStageName;
  activeStage: RoadmapStageName;
  /** Stages completed through real work — shared source, not index-derived. */
  completedStages: readonly RoadmapStageName[];
};

/** One small labeled block inside the stage detail. */
function DetailBlock({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Compass;
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#6861C8]">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#F0EEFF]">
          <Icon size={13} strokeWidth={1.9} />
        </span>
        {label}
      </div>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

/**
 * The stage detail panel: GOAL → WHAT TO FIGURE OUT → TASKS → GUIDANCE →
 * DEFINITION OF DONE → NEXT MOVE. Roadmap is an action system, so every
 * section is concrete and specific to the selected stage.
 */
export function RoadmapStageDetail({ currentStage, activeStage, completedStages }: RoadmapStageDetailProps) {
  const stageIndex = getStageIndex(activeStage);
  const stage: RoadmapStageInfo = ROADMAP_STAGES[stageIndex];
  const guide = ROADMAP_STAGE_GUIDES[stageIndex];
  // A stage is complete only through real completed work, never by position;
  // the current stage is still highlighted even when it is not yet complete.
  const isCompleted = completedStages.includes(activeStage);
  const state =
    isCompleted ? 'complete' : stageIndex === getStageIndex(currentStage) ? 'current' : 'upcoming';
  const prevStage = stageIndex > 0 ? ROADMAP_STAGES[stageIndex - 1] : null;
  const nextStage = stageIndex < ROADMAP_STAGES.length - 1 ? ROADMAP_STAGES[stageIndex + 1] : null;

  return (
    <section
      className="rounded-[1.65rem] border border-[#DCDDED] bg-white p-6 shadow-[0_14px_36px_rgba(44,42,123,0.055)] sm:p-8"
      aria-labelledby="stage-detail-title"
      data-testid="card-roadmap-stage-detail"
    >
      {/* Header: stage identity, state, and focus areas */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.56rem] font-bold uppercase tracking-[0.12em] ${
                state === 'current'
                  ? 'bg-[#E0F9FC] text-[#168BA5]'
                  : state === 'complete'
                    ? 'bg-[#EDEBFC] text-[#6A5BE2]'
                    : 'bg-[#F1F1F8] text-[#8A8CAD]'
              }`}
              data-testid="text-stage-state"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${state === 'current' ? 'bg-[#16C6EA]' : state === 'complete' ? 'bg-[#6A5BE2]' : 'bg-[#C3C5D6]'}`} aria-hidden="true" />
              {state === 'current' ? 'Current stage' : state === 'complete' ? 'Completed' : 'Upcoming'}
            </span>
            <span className="font-mono text-[0.62rem] font-bold text-[#9597AF]">{stage.number} / 06</span>
          </div>
          <h2 id="stage-detail-title" className="mt-3 text-[2rem] font-extrabold leading-none tracking-[-0.06em] text-[#202155] sm:text-[2.4rem]">
            {stage.name}
          </h2>
          <p className="mt-2.5 max-w-[30rem] text-sm leading-6 text-[#727596]">{stage.description}</p>
        </div>
        <div className="flex flex-wrap max-w-full gap-1.5" aria-label="Stage focus">
          {guide.focus.map((item) => (
            <span key={item} className="rounded-full border border-[#E0E1F0] bg-[#FAFAFE] px-2.5 py-1 text-[0.58rem] font-semibold text-[#66698B]">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-7 grid gap-7 border-t border-[#ECECF1] pt-7 lg:grid-cols-2 lg:gap-x-8">
        <DetailBlock icon={Compass} label="The goal">
          <p className="text-sm font-semibold leading-6 text-[#343568]">{guide.goal}</p>
        </DetailBlock>

        <DetailBlock icon={CircleDot} label="What you need to figure out">
          <ul className="space-y-2">
            {guide.figureOut.map((question) => (
              <li key={question} className="flex gap-2.5 text-sm leading-6 text-[#565980]">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6256DB]" aria-hidden="true" />
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </DetailBlock>

        <DetailBlock icon={ListChecks} label="Tasks">
          <ol className="space-y-2">
            {guide.tasks.map((task, index) => (
              <li key={task} className="flex gap-3 text-sm leading-6 text-[#565980]">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#F0EEFF] font-mono text-[0.6rem] font-bold text-[#5D53C2]">
                  {index + 1}
                </span>
                <span>{task}</span>
              </li>
            ))}
          </ol>
        </DetailBlock>

        <DetailBlock icon={Lightbulb} label="Guidance">
          <p className="rounded-xl bg-[#F8F8FD] p-4 text-sm leading-6 text-[#565980]">{guide.guidance}</p>
          <div className="mt-4 rounded-xl border border-[#E4E9F6] bg-[#F7FAFE] p-4">
            <p className="flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#3D7EA6]">
              <CheckCircle2 size={14} strokeWidth={2} />
              Definition of done
            </p>
            <p className="mt-2 text-sm leading-6 text-[#45658A]">{guide.done}</p>
          </div>
        </DetailBlock>
      </div>

      {/* Prev / next navigation between stages */}
      <div className="mt-8 flex items-center justify-between gap-3 border-t border-[#ECECF1] pt-5">
        {prevStage ? (
          <Link
            href={`/roadmap?stage=${prevStage.name}`}
            className="fluxrico-focus inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D4D5E8] bg-white px-4 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#5B56B5] transition-colors hover:border-[#8E88E1]"
            data-testid="link-stage-prev"
          >
            <ChevronLeft size={14} strokeWidth={2} />
            {prevStage.name}
          </Link>
        ) : (
          <span />
        )}
        {nextStage ? (
          <Link
            href={`/roadmap?stage=${nextStage.name}`}
            className="fluxrico-focus inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D4D5E8] bg-white px-4 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#5B56B5] transition-colors hover:border-[#8E88E1]"
            data-testid="link-stage-next"
          >
            {nextStage.name}
            <ChevronRight size={14} strokeWidth={2} />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </section>
  );
}
