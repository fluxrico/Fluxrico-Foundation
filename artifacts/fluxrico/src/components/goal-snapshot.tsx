import { ArrowUpRight, Target } from 'lucide-react';

export function GoalSnapshot({ onEdit }: { onEdit: () => void }) {
  return (
    <section className="dashboard-card-lift rounded-[1.65rem] border border-[#DADBF0] bg-[#F1F2FD] p-6 sm:p-7" aria-labelledby="goal-title" data-testid="card-goal-snapshot">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#6861C8]">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/80"><Target size={15} strokeWidth={1.8} /></span>
          GOAL SNAPSHOT
        </div>
        <button type="button" onClick={onEdit} className="fluxrico-focus rounded-md p-1 text-[#7779A1] hover:text-[#4E46C0]" aria-label="Edit goal snapshot" data-testid="button-edit-goal">
          <ArrowUpRight size={17} strokeWidth={1.8} />
        </button>
      </div>
      <h2 id="goal-title" className="mt-7 max-w-[19rem] text-[1.55rem] font-extrabold leading-[1.08] tracking-[-0.055em] text-[#28295D]">Build and launch a digital product</h2>
      <div className="mt-8 flex items-end justify-between gap-3">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#8587A3]">STATUS</p>
          <p className="mt-1 text-xl font-extrabold tracking-[-0.04em] text-[#4F48C5]">In progress</p>
        </div>
        <div className="text-right">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#8587A3]">PROGRESS</p>
          <p className="mt-1 text-sm font-bold text-[#8587A3]">2 of 6 stages</p>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/80"><div className="h-full w-[33.333%] rounded-full bg-[#6857E8]" /></div>
    </section>
  );
}