import { Check, LockKeyhole } from 'lucide-react';
import { Link } from 'wouter';
import { ROADMAP_STAGES, getStageIndex } from '@/lib/journey';
import type { RoadmapStageName } from '@/lib/journey';

type RoadmapProgressProps = {
  currentStage: RoadmapStageName;
};

/**
 * Level-2 journey progress: all six real stages, current one highlighted,
 * completed filled, upcoming locked. Stages link into the existing Roadmap
 * page's `?stage=` deep-linking rather than adding a new navigation system.
 */
export function RoadmapProgress({ currentStage }: RoadmapProgressProps) {
  const currentIndex = getStageIndex(currentStage);

  return (
    <section className="rounded-[1.65rem] border border-[#DADBF0] bg-white p-6 shadow-[0_8px_28px_rgba(44,42,123,0.04)] sm:p-7" aria-labelledby="roadmap-title" data-testid="card-roadmap-progress">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#6861C8]">Journey progress</p>
          <h2 id="roadmap-title" className="mt-2 text-xl font-extrabold tracking-[-0.045em] text-[#25265A]">Your place on the path.</h2>
        </div>
        <Link
          href="/roadmap"
          className="fluxrico-focus inline-flex min-h-9 items-center rounded-full px-3 text-[0.63rem] font-bold uppercase tracking-[0.13em] text-[#5D56C9] hover:bg-[#F2F1FF]"
          data-testid="button-view-full-roadmap"
        >
          View full roadmap
        </Link>
      </div>
      <ol className="mt-8 grid grid-cols-2 gap-y-7 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-2 lg:gap-y-0" aria-label="Fluxrico roadmap">
        {ROADMAP_STAGES.map((stage, index) => {
          const state = index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming';
          return (
            <li key={stage.name} className="relative flex items-start gap-3 lg:block" data-testid={`stage-${stage.name.toLowerCase()}`}>
              {index < ROADMAP_STAGES.length - 1 && <span className={`absolute left-[1.05rem] top-8 hidden h-px w-[calc(100%-0.5rem)] lg:block ${state === 'complete' ? 'bg-[#6A5BE2]' : 'bg-[#E5E5F1]'}`} aria-hidden="true" />}
              <span className={`relative z-10 flex h-[2.1rem] w-[2.1rem] shrink-0 items-center justify-center rounded-full border text-xs font-extrabold ${
                state === 'complete' ? 'border-[#6A5BE2] bg-[#6A5BE2] text-white' : state === 'current' ? 'border-[#16C5E9] bg-[#E0F9FC] text-[#168BA5] shadow-[0_0_0_5px_#F1FCFD]' : 'border-[#D8D9E9] bg-[#FAFAFD] text-[#9B9DB5]'
              }`}>
                {state === 'complete' ? <Check size={14} strokeWidth={2.5} /> : state === 'upcoming' ? <LockKeyhole size={12} strokeWidth={1.8} /> : stage.number}
              </span>
              <div className="pt-1 lg:mt-3 lg:pt-0">
                <Link
                  href={`/roadmap?stage=${stage.name}`}
                  className="fluxrico-focus block rounded text-sm font-bold transition-colors hover:underline"
                  data-testid={`stage-link-${stage.name.toLowerCase()}`}
                >
                  <span className={state === 'current' ? 'text-[#4E46C0]' : state === 'complete' ? 'text-[#343568]' : 'text-[#888BA8]'}>
                    <span className="mr-1 text-[0.6rem] font-bold tracking-[0.12em] opacity-70">{stage.number} —</span>
                    {stage.name}
                  </span>
                </Link>
                <p className="mt-1 text-[0.66rem] leading-4 text-[#9A9CB3]">{stage.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
