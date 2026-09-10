import { Feather } from 'lucide-react';

type GuidanceCardProps = {
  stageName: string;
};

/**
 * Level-4 guidance: one calm line of context, tied to the current stage.
 * Deliberately quiet — it must never compete with the Next Move panel.
 */
export function GuidanceCard({ stageName }: GuidanceCardProps) {
  return (
    <section
      className="flex items-start gap-3.5 rounded-2xl border border-dashed border-[#D5D6E8] bg-[#FAFAFE] px-5 py-4 sm:items-center"
      aria-labelledby="guidance-title"
      data-testid="card-guidance"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0EEFF] text-[#6861C8] sm:mt-0">
        <Feather size={15} strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <h2 id="guidance-title" className="text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#6861C8]">Guidance</h2>
        <p className="mt-1.5 max-w-[34rem] text-sm leading-6 text-[#565980]">
          You don&apos;t need to solve the entire journey today. In <span className="font-bold text-[#343568]">{stageName}</span>, focus on
          the next useful step — one move is enough to keep the direction alive.
        </p>
      </div>
    </section>
  );
}
