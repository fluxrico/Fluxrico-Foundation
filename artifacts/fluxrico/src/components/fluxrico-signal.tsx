export function FluxricoSignal() {
  return (
    <div className="relative isolate h-[23rem] overflow-hidden rounded-[2rem] border border-white/10 bg-[#17184B] shadow-[0_24px_70px_rgba(31,26,107,0.2)] sm:h-[27rem] lg:h-[31rem]" aria-label="A visual path from idea to income">
      <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#703BE5]/30 blur-3xl" />
      <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-[#00B8E7]/20 blur-3xl" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute left-6 top-6 flex items-center gap-2 text-[0.63rem] font-semibold uppercase tracking-[0.2em] text-[#B9BEDE] sm:left-8 sm:top-8">
        <span className="h-1.5 w-1.5 rounded-full bg-[#15C8EF] shadow-[0_0_0_4px_rgba(21,200,239,0.12)]" />
        A path with shape
      </div>

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 540 496" fill="none" aria-hidden="true" preserveAspectRatio="none">
        <path d="M-10 378C83 401 81 165 176 202C270 238 273 386 345 324C407 272 403 106 564 114" stroke="url(#signal-gradient)" strokeWidth="2.5" strokeDasharray="8 9" className="fluxrico-dash opacity-90" />
        <path d="M-10 378C83 401 81 165 176 202C270 238 273 386 345 324C407 272 403 106 564 114" stroke="url(#signal-gradient)" strokeWidth="1" opacity=".28" />
        <defs>
          <linearGradient id="signal-gradient" x1="8" y1="381" x2="533" y2="106" gradientUnits="userSpaceOnUse">
            <stop stopColor="#09C7EE" />
            <stop offset=".52" stopColor="#5165FF" />
            <stop offset="1" stopColor="#B56CFF" />
          </linearGradient>
        </defs>
      </svg>

      <div className="fluxrico-drift absolute left-[10%] top-[62%]">
        <div className="rounded-xl border border-white/15 bg-[#252765]/85 px-3.5 py-2.5 shadow-lg backdrop-blur-md">
          <p className="text-[0.58rem] font-semibold uppercase tracking-[0.17em] text-[#9FA7D7]">01 / start</p>
          <p className="mt-1 text-sm font-semibold text-white">the raw idea</p>
        </div>
      </div>
      <div className="fluxrico-drift-slow absolute left-[37%] top-[38%]">
        <div className="rounded-xl border border-white/15 bg-[#252765]/85 px-3.5 py-2.5 shadow-lg backdrop-blur-md">
          <p className="text-[0.58rem] font-semibold uppercase tracking-[0.17em] text-[#9FA7D7]">02 / shape</p>
          <p className="mt-1 text-sm font-semibold text-white">the clear angle</p>
        </div>
      </div>
      <div className="fluxrico-drift absolute right-[8%] top-[14%]">
        <div className="rounded-xl border border-[#9D84FF]/40 bg-[#5745AC]/80 px-3.5 py-2.5 shadow-lg backdrop-blur-md">
          <p className="text-[0.58rem] font-semibold uppercase tracking-[0.17em] text-[#D9D3FF]">03 / move</p>
          <p className="mt-1 text-sm font-semibold text-white">the next useful step</p>
        </div>
      </div>
      <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between border-t border-white/10 pt-4 sm:bottom-7 sm:left-8 sm:right-8 sm:pt-5">
        <p className="max-w-[13rem] text-xs leading-5 text-[#AFB4D7]">Less noise. More signal. A place to make the next move visible.</p>
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[#14C6EC]">Fluxrico / 01</span>
      </div>
    </div>
  );
}