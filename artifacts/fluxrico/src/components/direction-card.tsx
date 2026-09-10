import { ArrowUpRight, Compass } from 'lucide-react';
import { Link } from 'wouter';

type DirectionCardProps = {
  /** Navigator-derived direction, or null before Navigator is completed. */
  direction: string | null;
  onViewDirection: () => void;
};

/**
 * Level-3 summary of what Navigator discovered. Full reasoning stays on
 * /navigator/result — this is the quiet reminder of where things point.
 */
export function DirectionCard({ direction, onViewDirection }: DirectionCardProps) {
  const hasDirection = direction !== null && direction.trim().length > 0;

  return (
    <section
      className="rounded-[1.65rem] border border-[#DADBF0] bg-[#FAFAFE] p-6 shadow-[0_8px_28px_rgba(44,42,123,0.035)] sm:p-7"
      aria-labelledby="direction-title"
      data-testid="card-direction"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#6861C8]">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/80">
            <Compass size={15} strokeWidth={1.8} />
          </span>
          Your direction
        </div>
        <Link
          href="/navigator/result"
          onClick={onViewDirection}
          className="fluxrico-focus rounded-md p-1 text-[#7779A1] hover:text-[#4E46C0]"
          aria-label="View your full direction"
          data-testid="link-view-direction"
        >
          <ArrowUpRight size={17} strokeWidth={1.8} />
        </Link>
      </div>

      {hasDirection ? (
        <p className="mt-7 max-w-[19rem] text-[1.3rem] font-extrabold leading-[1.14] tracking-[-0.05em] text-[#28295D]">{direction}</p>
      ) : (
        <div className="mt-7" data-testid="state-direction-empty">
          <p className="text-[1.05rem] font-bold leading-snug text-[#4A4C7A]">No direction yet.</p>
          <p className="mt-2 max-w-[19rem] text-xs leading-5 text-[#8587A3]">A few focused questions will point you somewhere useful.</p>
          <Link
            href="/navigator"
            className="fluxrico-focus mt-4 inline-flex min-h-10 items-center rounded-full bg-[#EBE9FF] px-4 text-[0.63rem] font-bold uppercase tracking-[0.13em] text-[#5147C2] hover:bg-[#E1DEFF]"
            data-testid="button-start-navigator-from-direction"
          >
            Set your direction
          </Link>
        </div>
      )}
    </section>
  );
}
