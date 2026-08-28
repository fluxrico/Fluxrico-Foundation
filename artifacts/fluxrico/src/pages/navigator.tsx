import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { NavigatorQuestion } from '@/components/navigator-question';
import { NavigatorShell } from '@/components/navigator-shell';
import { useNavigatorState } from '@/components/navigator-state';

const steps = [
  { key: 'goal', question: 'What are you trying to achieve?', options: ['Start a digital product', 'Build an audience', 'Monetize a skill', 'Turn an idea into income', 'I’m not sure yet'] },
  { key: 'current', question: 'Where are you right now?', options: ['I only have an idea', 'I have a skill', 'I have an audience', 'I already have something to sell', 'I’m already making some income'] },
  { key: 'strength', question: 'What do you have most?', options: ['Knowledge', 'Creativity', 'Audience', 'Technical skills', 'Time', 'I’m still figuring it out'] },
  { key: 'path', question: 'What kind of path sounds most useful?', options: ['Create a digital product', 'Build content', 'Offer a service', 'Build a simple business', 'Explore options first'] },
] as const;

export default function Navigator() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { answers, setAnswer } = useNavigatorState();
  const current = steps[step - 1];
  const selected = answers[current.key];

  const continueFlow = () => {
    if (!selected) return;
    if (step === steps.length) {
      setLocation('/navigator/result');
    } else {
      setStep((value) => value + 1);
    }
  };

  const goBack = () => {
    if (step > 1) setStep((value) => value - 1);
  };

  const skip = () => {
    if (step < steps.length) setStep((value) => value + 1);
  };

  return (
    <NavigatorShell step={step}>
      <div className="mx-auto max-w-[49rem]">
        <div className="fluxrico-rise mt-12 sm:mt-16">
          <NavigatorQuestion
            question={current.question}
            options={[...current.options]}
            selected={selected}
            onSelect={(value) => setAnswer(current.key, value)}
          />
        </div>
        <div className="mt-9 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {step > 1 ? (
              <button type="button" onClick={goBack} className="fluxrico-focus inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[0.66rem] font-bold uppercase tracking-[0.15em] text-[#6B6D8D] transition-colors hover:bg-white hover:text-[#343568]" data-testid="button-navigator-back">
                <ArrowLeft size={15} strokeWidth={1.8} /> Back
              </button>
            ) : (
              <span className="hidden text-xs text-[#999BB1] sm:block">One answer is enough to begin.</span>
            )}
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            {step > 1 && (
              <button type="button" onClick={skip} className="fluxrico-focus min-h-11 rounded-full px-3 text-[0.66rem] font-bold uppercase tracking-[0.15em] text-[#747696] underline decoration-[#C7C8DB] underline-offset-4 transition-colors hover:text-[#3E3C88]" data-testid="button-navigator-skip">
                Skip for now
              </button>
            )}
            <button type="button" onClick={continueFlow} disabled={!selected} className="fluxrico-focus group inline-flex min-h-13 items-center justify-center gap-4 rounded-full bg-[#211F61] px-6 text-[0.7rem] font-bold uppercase tracking-[0.17em] text-white shadow-[0_13px_28px_rgba(33,31,97,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#35318A] disabled:cursor-not-allowed disabled:bg-[#BFC0D3] disabled:shadow-none" data-testid="button-navigator-continue">
              {step === steps.length ? 'See my direction' : 'Continue'}
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#4F48AA] transition-transform group-hover:translate-x-0.5"><ArrowRight size={15} strokeWidth={2} /></span>
            </button>
          </div>
        </div>
      </div>
    </NavigatorShell>
  );
}