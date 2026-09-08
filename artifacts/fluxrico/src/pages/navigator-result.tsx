import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { ConfidenceBadge, EditAnswersButton, MatchScore, ResultNextMoveCard, RoadmapPreview, WhyThisMatch } from '@/components/navigator-result';
import { NavigatorShell } from '@/components/navigator-shell';
import { useNavigatorState } from '@/components/navigator-state';
import { buildNavigatorResult } from '@/lib/journey';

export default function NavigatorResult() {
  const [, setLocation] = useLocation();
  const { answers } = useNavigatorState();
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | null>(null);
  const result = buildNavigatorResult(answers);

  useEffect(() => () => {
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
  }, []);

  const announce = (message: string) => {
    setNotice(message);
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 4200);
  };

  return (
    <NavigatorShell>
      <div className="mx-auto max-w-[1120px]">
        <div className="fluxrico-rise mt-12 flex flex-col justify-between gap-5 sm:mt-16 sm:flex-row sm:items-start">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.21em] text-[#6258D0]">Navigator / a useful signal</p>
            <h1 className="mt-5 max-w-[47rem] text-[3rem] font-extrabold leading-[0.96] tracking-[-0.08em] text-[#202155] sm:text-[5.4rem]">Your direction</h1>
          </div>
          <EditAnswersButton onClick={() => setLocation('/navigator')} />
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.04fr_0.96fr]">
          <section className="rounded-[1.8rem] border border-[#DCDDED] bg-white/80 p-6 shadow-[0_18px_40px_rgba(45,42,120,0.06)] sm:p-9" aria-labelledby="direction-title">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[0.63rem] font-bold uppercase tracking-[0.2em] text-[#6258D0]">The signal points here</p>
                <h2 id="direction-title" className="mt-5 max-w-[34rem] text-[2rem] font-extrabold leading-[1.03] tracking-[-0.06em] text-[#292960] sm:text-[3.15rem]">{result.direction}</h2>
              </div>
              <MatchScore value={result.signal} />
            </div>
            <p className="mt-7 max-w-[35rem] text-sm leading-6 text-[#777998]">This is a directional signal from the answers you gave, not a prediction or a fixed recommendation. Use it to choose the next useful question.</p>
            <div className="mt-7 max-w-[24rem]"><ConfidenceBadge label={result.confidence} explanation={result.confidenceExplanation} /></div>
          </section>
          <WhyThisMatch reasons={result.reasons} />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <ResultNextMoveCard move={result.nextMove} onStart={() => announce('Your next move is noted locally. Tools for this step are still taking shape.')} />
          <RoadmapPreview currentStage={result.currentStage} />
        </div>

        {notice && (
          <div className="fluxrico-rise mt-5 flex items-start gap-3 rounded-xl border border-[#C9D9F0] bg-[#F0F8FF] px-4 py-3 text-sm text-[#38567B]" role="status" aria-live="polite" data-testid="status-navigator-notice">
            <Check size={17} className="mt-0.5 shrink-0 text-[#178EAD]" strokeWidth={2.2} />
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} className="fluxrico-focus ml-auto rounded p-0.5 text-[#7183A2] underline underline-offset-2 hover:text-[#38567B]" data-testid="button-dismiss-navigator-notice">Dismiss</button>
          </div>
        )}

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-[#DDDEEC] pt-5 sm:flex-row sm:items-center">
          <p className="max-w-[33rem] text-xs leading-5 text-[#888AA4]">Navigator gives you a place to begin. The roadmap will stay simple until the next move is clear.</p>
          <button type="button" onClick={() => setLocation(`/roadmap?stage=${encodeURIComponent(result.currentStage)}`)} className="fluxrico-focus inline-flex min-h-11 items-center rounded-full border border-[#D4D5E8] bg-white px-5 text-[0.66rem] font-bold uppercase tracking-[0.15em] text-[#5753A5] transition-colors hover:border-[#8E88E1]" data-testid="button-view-roadmap">
            View roadmap
          </button>
        </div>
      </div>
    </NavigatorShell>
  );
}
