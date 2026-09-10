import { ArrowRight, CircleArrowOutUpRight } from 'lucide-react';

type NextMoveCardProps = {
  move: string;
  stageName: string;
  stageNumber: string;
  hint?: string;
  onStart: () => void;
  onViewRoadmap?: () => void;
};

/**
 * The dashboard's primary element: the single actionable next step.
 * Visually dominant on purpose — everything else on the page stays quieter.
 */
export function NextMoveCard({ move, stageName, stageNumber, hint, onStart, onViewRoadmap }: NextMoveCardProps) {
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
          Your next move
        </div>
        <span className="rounded-full border border-white/15 px-3 py-1.5 text-[0.58rem] font-bold uppercase tracking-[0.15em] text-[#B9BCE1]">
          {stageName} / {stageNumber}
        </span>
      </div>

      <p className="relative mt-7 max-w-[27rem] text-[1.45rem] font-extrabold leading-[1.12] tracking-[-0.045em] text-[#FCFCFF]">
        {move}
      </p>
      {hint && (
        <p className="relative mt-4 max-w-[27rem] text-sm leading-6 text-[#C2C4E1]">
          <span className="font-semibold text-[#D9DBF2]">Why this matters — </span>
          {hint}
        </p>
      )}

      <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onStart}
          className="fluxrico-focus group inline-flex min-h-12 items-center justify-center gap-4 rounded-full bg-[#F4F3FF] px-5 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#302B79] transition-transform hover:-translate-y-0.5 hover:bg-white"
          data-testid="button-start-next-move"
        >
          Continue
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DCD9FF] transition-transform group-hover:translate-x-0.5">
            <ArrowRight size={15} strokeWidth={2.2} />
          </span>
        </button>
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
      <p className="relative mt-5 text-[0.68rem] font-medium text-[#9398C5]">Small, specific, and useful — one step is enough for today.</p>
    </section>
  );
}
