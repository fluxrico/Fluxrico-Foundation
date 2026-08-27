import { ArrowRight, CircleArrowOutUpRight } from 'lucide-react';

export function NextMoveCard({ onStart, onViewRoadmap }: { onStart: () => void; onViewRoadmap: () => void }) {
  return (
    <section className="dashboard-card-lift relative overflow-hidden rounded-[1.65rem] bg-[#211F61] p-6 text-white shadow-[0_15px_35px_rgba(38,34,121,0.16)] sm:p-7" aria-labelledby="next-move-title" data-testid="card-next-move">
      <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#715BEB]/35 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[#04B9E7]/16 blur-3xl" aria-hidden="true" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2 text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#8DDEF0]">
          <CircleArrowOutUpRight size={17} strokeWidth={1.7} />
          NEXT MOVE
        </div>
        <span className="rounded-full border border-white/15 px-3 py-1.5 text-[0.58rem] font-bold uppercase tracking-[0.15em] text-[#B9BCE1]">Shape / 01</span>
      </div>
      <h2 id="next-move-title" className="relative mt-8 max-w-[23rem] text-[2.05rem] font-extrabold leading-[1.04] tracking-[-0.065em] text-[#FCFCFF]">The next useful step</h2>
      <p className="relative mt-3 max-w-[26rem] text-[1.35rem] font-bold leading-[1.15] tracking-[-0.04em] text-white">Define who this idea is for.</p>
      <p className="relative mt-4 max-w-[26rem] text-sm leading-6 text-[#C2C4E1]">The clearer the person, the easier it is to make something that feels made for them.</p>
      <button type="button" onClick={onStart} className="fluxrico-focus group relative mt-8 inline-flex min-h-12 items-center gap-4 rounded-full bg-[#F4F3FF] px-5 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#302B79] transition-transform hover:-translate-y-0.5 hover:bg-white" data-testid="button-start-next-move">
        Start next move
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DCD9FF] transition-transform group-hover:translate-x-0.5"><ArrowRight size={15} strokeWidth={2.2} /></span>
      </button>
      <div className="relative mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <p className="text-[0.68rem] font-medium text-[#9398C5]">Estimated effort · About 10 minutes</p>
        <button type="button" onClick={onViewRoadmap} className="fluxrico-focus inline-flex items-center gap-1 text-[0.68rem] font-bold uppercase tracking-[0.13em] text-[#A8EAF7] hover:text-white" data-testid="button-view-roadmap">View roadmap <ArrowRight size={13} /></button>
      </div>
    </section>
  );
}