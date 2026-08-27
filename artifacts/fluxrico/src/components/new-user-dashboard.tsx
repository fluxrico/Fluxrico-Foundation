import { ArrowRight, Compass, Layers3, Sparkles } from 'lucide-react';

type NewUserDashboardProps = {
  onStartNavigator: () => void;
};

export function NewUserDashboard({ onStartNavigator }: NewUserDashboardProps) {
  return (
    <div className="dashboard-grid-fade relative overflow-hidden rounded-[2rem] border border-[#DCDDF0] bg-[#F8F8FD] px-6 py-10 shadow-[0_12px_34px_rgba(44,42,123,0.045)] sm:px-10 sm:py-14 lg:px-16 lg:py-20" data-testid="state-new-user">
      <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#E5E1FF]" aria-hidden="true" />
      <div className="relative mx-auto max-w-[44rem] text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#211F61] text-[#6CE0F4] shadow-[0_10px_22px_rgba(35,31,104,0.18)]"><Sparkles size={23} strokeWidth={1.6} /></div>
        <p className="mt-8 text-[0.65rem] font-bold uppercase tracking-[0.21em] text-[#655BD0]">A place to begin</p>
        <h2 className="mt-4 text-[2.7rem] font-extrabold leading-[0.98] tracking-[-0.075em] text-[#202155] sm:text-[4.5rem]">Let&apos;s find your direction.</h2>
        <p className="mx-auto mt-6 max-w-[32rem] text-base leading-7 text-[#6E7192]">Answer a few questions and Fluxrico will help you identify your next useful step.</p>
        <button type="button" onClick={onStartNavigator} className="fluxrico-focus group mt-8 inline-flex min-h-13 items-center gap-4 rounded-full bg-[#211F61] px-6 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-white shadow-[0_12px_25px_rgba(33,31,97,0.18)] transition-transform hover:-translate-y-0.5 hover:bg-[#343087]" data-testid="button-start-navigator">
          Start Navigator
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4F48AA] transition-transform group-hover:translate-x-0.5"><ArrowRight size={16} strokeWidth={2.2} /></span>
        </button>
      </div>
      <div className="relative mx-auto mt-14 grid max-w-[50rem] gap-3 border-t border-[#DADBEA] pt-8 sm:grid-cols-3">
        <div className="flex gap-3 sm:block"><Compass size={18} className="mt-0.5 shrink-0 text-[#635AD0]" strokeWidth={1.8} /><div className="sm:mt-4"><p className="text-sm font-bold text-[#343568]">Find your thread</p><p className="mt-1 text-xs leading-5 text-[#8587A3]">Start where the idea has energy.</p></div></div>
        <div className="flex gap-3 sm:block"><Layers3 size={18} className="mt-0.5 shrink-0 text-[#635AD0]" strokeWidth={1.8} /><div className="sm:mt-4"><p className="text-sm font-bold text-[#343568]">Give it shape</p><p className="mt-1 text-xs leading-5 text-[#8587A3]">Make the useful part visible.</p></div></div>
        <div className="flex gap-3 sm:block"><ArrowRight size={18} className="mt-0.5 shrink-0 text-[#15B9DB]" strokeWidth={1.8} /><div className="sm:mt-4"><p className="text-sm font-bold text-[#343568]">Choose what is next</p><p className="mt-1 text-xs leading-5 text-[#8587A3]">One move is enough for today.</p></div></div>
      </div>
    </div>
  );
}