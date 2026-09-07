import { Check, LockKeyhole } from 'lucide-react';

export type RoadmapStageName = 'Start' | 'Shape' | 'Move' | 'Build' | 'Launch' | 'Grow';

export type RoadmapStageInfo = {
  number: string;
  name: RoadmapStageName;
  detail: string;
  description: string;
  nextMove: string;
};

export const ROADMAP_STAGES: RoadmapStageInfo[] = [
  { number: '01', name: 'Start', detail: 'Raw idea', description: "Turn what's in your head into a few clear words you can act on.", nextMove: 'Write your idea down in one clear sentence.' },
  { number: '02', name: 'Shape', detail: 'Clear angle', description: 'Turn your raw idea into a clear direction.', nextMove: 'Define who this idea is for.' },
  { number: '03', name: 'Move', detail: 'Next useful step', description: 'Take the next useful step toward something real.', nextMove: 'Define the specific problem your product should solve.' },
  { number: '04', name: 'Build', detail: 'Create the offer', description: 'Create the offer your direction points toward.', nextMove: 'Create the first version of your offer.' },
  { number: '05', name: 'Launch', detail: 'Put it into the world', description: 'Put your work into the world.', nextMove: 'Share your work with the first people who might want it.' },
  { number: '06', name: 'Grow', detail: 'Improve and scale', description: "Improve and scale what's working.", nextMove: "Look at what's working, and do more of it." },
];

export function getStageIndex(name: RoadmapStageName): number {
  return ROADMAP_STAGES.findIndex((stage) => stage.name === name);
}

type RoadmapStageCardsProps = {
  currentStage: RoadmapStageName;
};

export function RoadmapStageCards({ currentStage }: RoadmapStageCardsProps) {
  const currentIndex = getStageIndex(currentStage);

  return (
    <section aria-labelledby="roadmap-stages-title" data-testid="section-roadmap-stages">
      <div className="flex items-end justify-between gap-4">
        <h2 id="roadmap-stages-title" className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-[#6258D0]">The full path</h2>
        <p className="text-xs font-medium text-[#8587A3]">One stage at a time</p>
      </div>
      <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Fluxrico roadmap stages">
        {ROADMAP_STAGES.map((stage, index) => {
          const state = index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming';
          return (
            <li
              key={stage.name}
              className={`dashboard-card-lift relative rounded-[1.4rem] border p-5 ${
                state === 'current' ? 'border-[#6256DB] bg-[#F0EFFF] shadow-[0_10px_28px_rgba(74,66,196,0.08)]' : state === 'complete' ? 'border-[#DADBF0] bg-white' : 'border-[#E4E4EF] bg-[#FAFAFE]'
              }`}
              data-testid={`roadmap-full-stage-${stage.name.toLowerCase()}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-extrabold ${
                    state === 'complete' ? 'border-[#6A5BE2] bg-[#6A5BE2] text-white' : state === 'current' ? 'border-[#16C5E9] bg-[#E0F9FC] text-[#168BA5] shadow-[0_0_0_5px_#F1FCFD]' : 'border-[#D8D9E9] bg-white text-[#9B9DB5]'
                  }`}
                >
                  {state === 'complete' ? <Check size={15} strokeWidth={2.5} /> : state === 'upcoming' ? <LockKeyhole size={13} strokeWidth={1.8} /> : stage.number}
                </span>
                {state === 'current' && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#CFCCF6] bg-white px-2.5 py-1 text-[0.56rem] font-bold uppercase tracking-[0.12em] text-[#6256DB]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#16C6EA]" />Current
                  </span>
                )}
              </div>
              <p className={`mt-4 text-lg font-extrabold tracking-[-0.03em] ${state === 'current' ? 'text-[#342D83]' : state === 'complete' ? 'text-[#25265A]' : 'text-[#888BA8]'}`}>
                <span className="mr-1.5 text-[0.62rem] font-bold tracking-[0.12em] opacity-70">{stage.number} —</span>{stage.name}
              </p>
              <p className={`mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] ${state === 'upcoming' ? 'text-[#A0A2B7]' : 'text-[#6861C8]'}`}>{stage.detail}</p>
              <p className="mt-3 text-sm leading-6 text-[#747696]">{stage.description}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
