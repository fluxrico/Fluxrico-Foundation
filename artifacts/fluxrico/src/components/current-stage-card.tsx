import { ArrowRight, Check, Compass } from 'lucide-react';

export function CurrentStageCard({ onContinue }: { onContinue: () => void }) {
  return (
    <section className="dashboard-card-lift relative overflow-hidden rounded-[1.65rem] border border-[#DADBF0] bg-white p-6 shadow-[0_8px_28px_rgba(44,42,123,0.045)] sm:p-7" aria-labelledby="current-stage-title" data-testid="card-current-stage">
      <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#E8E5FF]" aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#6861C8]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F0EEFF]"><Compass size={15} strokeWidth={1.8} /></span>
            CURRENT STAGE
          </div>
          <h2 id="current-stage-title" className="mt-7 text-[2.65rem] font-extrabold leading-none tracking-[-0.075em] text-[#202155]">Shape</h2>
          <p className="mt-3 max-w-[22rem] text-sm leading-6 text-[#727596]">Turn your raw idea into a clear direction.</p>
        </div>
        <span className="relative mt-1 rounded-full bg-[#F0EEFF] px-3 py-1.5 text-[0.58rem] font-bold uppercase tracking-[0.15em] text-[#6258D0]">02 / 06</span>
      </div>
      <div className="relative mt-8">
        <div className="flex items-center justify-between text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#8385A1]"><span>Stage progress</span><span className="text-[#6258D0]">2 of 6</span></div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ECECF6]"><div className="h-full w-[32%] rounded-full bg-gradient-to-r from-[#16C5E9] to-[#6857E8]" /></div>
      </div>
      <div className="relative mt-7 flex items-center gap-2 border-t border-[#ECECF1] pt-5 text-xs font-semibold text-[#686B8D]">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E2F8FC] text-[#1399B3]"><Check size={12} strokeWidth={2.5} /></span>
        Navigator complete
        <button type="button" onClick={onContinue} className="fluxrico-focus ml-auto inline-flex min-h-10 items-center gap-2 rounded-full bg-[#EBE9FF] px-4 text-[0.63rem] font-bold uppercase tracking-[0.13em] text-[#5147C2] hover:bg-[#E1DEFF]" data-testid="button-continue-stage">
          Continue <ArrowRight size={14} strokeWidth={2.2} />
        </button>
      </div>
    </section>
  );
}