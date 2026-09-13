import { useState } from 'react';
import {
  ArrowRight,
  CircleArrowOutUpRight,
  CircleCheck,
  ClipboardCheck,
  Flag,
  Map as MapIcon,
  Route as RouteIcon,
} from 'lucide-react';
import type { NextMoveBrief } from '@/lib/journey';

type NextMoveCardProps = {
  move: string;
  stageName: string;
  stageNumber: string;
  hint?: string;
  /** The stage's full next-move brief; the card falls back to the quiet hint when absent. */
  brief?: NextMoveBrief | null;
  /** Label for the primary action — reads Start until the move has been opened. */
  actionLabel?: string;
  onStart: () => void;
  onViewRoadmap?: () => void;
  /** True only when this stage is genuinely completed — the card then confirms instead of offering. */
  completed?: boolean;
  /** True when every stage of the journey is complete — the map is done. */
  journeyComplete?: boolean;
};

/** One labeled brief row inside the card. */
function BriefRow({ icon: Icon, label, children }: { icon: typeof MapIcon; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[0.6rem] font-bold uppercase tracking-[0.15em] text-[#A9E7F3]">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#35327F]">
          <Icon size={13} strokeWidth={1.9} />
        </span>
        {label}
      </div>
      <p className="mt-1.5 text-sm leading-6 text-[#D7D9EE]">{children}</p>
    </div>
  );
}

/**
 * The dashboard's primary element: the single actionable next step.
 * Visually dominant on purpose — everything else on the page stays quieter.
 * With a brief it answers WHAT / WHY / HOW / WHEN-DONE in place, with the
 * extra detail folded away so the card stays calm; without one it keeps the
 * previous single-line form. Completion is never offered here — only on the
 * stage experience, through the user's own confirmation.
 */
export function NextMoveCard({
  move,
  stageName,
  stageNumber,
  hint,
  brief,
  actionLabel,
  onStart,
  onViewRoadmap,
  completed = false,
  journeyComplete = false,
}: NextMoveCardProps) {
  // Progressive disclosure: title, action, and why stay visible; the How and
  // Definition of done fold away until the user asks for the full brief.
  const [showFullBrief, setShowFullBrief] = useState(false);
  const label = journeyComplete
    ? 'Journey complete'
    : completed
      ? 'Stage complete'
      : (actionLabel ?? 'Continue');
  const briefRows = brief
    ? [
        { icon: ClipboardCheck, label: 'How to do it', body: brief.how },
        { icon: CircleCheck, label: 'Definition of done', body: brief.done },
      ]
    : [];
  const hiddenRows = showFullBrief ? briefRows : [];

  return (
    <section
      className="relative overflow-hidden rounded-[1.65rem] bg-[#211F61] p-6 text-white shadow-[0_18px_44px_rgba(38,34,121,0.18)] sm:p-8"
      aria-labelledby="next-move-title"
      data-testid="card-next-move"
    >
      {/* Two quiet glows give the panel depth without turning it neon. */}
      <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#715BEB]/30 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[#04B9E7]/15 blur-3xl" aria-hidden="true" />

      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#8DDEF0]">
          <CircleArrowOutUpRight size={17} strokeWidth={1.7} />
          {journeyComplete ? 'Journey complete' : completed ? 'Stage completed' : 'Your next move'}
        </div>
        <span className="rounded-full border border-white/15 px-3 py-1.5 text-[0.58rem] font-bold uppercase tracking-[0.15em] text-[#B9BCE1]">
          {stageName} / {stageNumber}
        </span>
      </div>

      <p
        id="next-move-title"
        className="relative mt-7 max-w-[27rem] text-[1.45rem] font-extrabold leading-[1.12] tracking-[-0.045em] text-[#FCFCFF]"
      >
        {move}
      </p>
      {brief && !completed && !journeyComplete ? (
        // The full brief: the action first, then why it matters, then the
        // folded how/done rows. Two answers are always visible, two on demand.
        <div className="relative mt-6 border-t border-white/10 pt-5">
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-x-8">
            <BriefRow icon={CircleArrowOutUpRight} label="Action">
              {brief.action}
            </BriefRow>
            <BriefRow icon={Flag} label="Why it matters">
              {brief.why}
            </BriefRow>
          </div>
          {hiddenRows.length > 0 && (
            <div className="mt-4 grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-2 sm:gap-x-8">
              {hiddenRows.map((row) => (
                <BriefRow key={row.label} icon={row.icon} label={row.label}>
                  {row.body}
                </BriefRow>
              ))}
            </div>
          )}
          {briefRows.length > 0 && (
            <button
              type="button"
              onClick={() => setShowFullBrief((open) => !open)}
              aria-expanded={showFullBrief}
              className="fluxrico-focus mt-4 inline-flex min-h-8 items-center gap-1.5 rounded-full px-2 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#A8AEE1] transition-colors hover:text-white"
              data-testid="button-next-move-details"
            >
              {showFullBrief ? 'Hide details' : 'Show how and when it is done'}
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full bg-[#35327F] transition-transform ${showFullBrief ? 'rotate-180' : ''}`}
                aria-hidden="true"
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          )}
        </div>
      ) : (
        hint && (
          <p className="relative mt-4 max-w-[27rem] text-sm leading-6 text-[#C2C4E1]">
            <span className="font-semibold text-[#D9DBF2]">Why this matters — </span>
            {hint}
          </p>
        )
      )}

      <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        {completed || journeyComplete ? (
          <span
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#6CE0F4]/40 bg-[#F0F6FF]/10 px-5 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#A8EAF7]"
            data-testid="text-next-move-completed"
          >
            <CircleCheck size={16} strokeWidth={2} />
            {journeyComplete ? 'Every stage met its definition of done' : 'Marked complete from real work'}
          </span>
        ) : (
          <button
            type="button"
            onClick={onStart}
            className="fluxrico-focus group inline-flex min-h-12 items-center justify-center gap-4 rounded-full bg-[#F4F3FF] px-5 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#302B79] transition-transform hover:-translate-y-0.5 hover:bg-white"
            data-testid="button-start-next-move"
          >
            {label}
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DCD9FF] transition-transform group-hover:translate-x-0.5">
              <ArrowRight size={15} strokeWidth={2.2} />
            </span>
          </button>
        )}
        {onViewRoadmap && (
          <button
            type="button"
            onClick={onViewRoadmap}
            className="fluxrico-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-5 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#A8EAF7] transition-colors hover:border-white/40 hover:text-white"
            data-testid="button-view-roadmap"
          >
            View roadmap
          </button>
        )}
      </div>
      <p className="relative mt-5 text-[0.68rem] font-medium text-[#9398C5]">
        {journeyComplete
          ? 'The full path is behind you — the rhythm now belongs to you.'
          : completed
            ? 'This stage is done — its next stage is waiting with its own next move.'
            : 'Small, specific, and useful — one step is enough for today.'}
      </p>
    </section>
  );
}
