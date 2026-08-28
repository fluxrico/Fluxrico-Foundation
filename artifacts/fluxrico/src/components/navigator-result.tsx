import { ArrowRight, Check, Pencil, Sparkles } from 'lucide-react';

export type NavigatorResultData = {
  direction: string;
  signal: string;
  confidence: string;
  confidenceExplanation: string;
  reasons: string[];
  nextMove: string;
  currentStage: string;
};

type MatchScoreProps = {
  value: string;
};

export function MatchScore({ value }: MatchScoreProps) {
  return (
    <div className="navigator-score flex items-center gap-3" data-testid="text-match-score">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border-[5px] border-[#70D6E9] bg-[#29266D] text-[0.7rem] font-extrabold tracking-[-0.03em] text-white">
        {value}
      </div>
      <div>
        <p className="text-[0.63rem] font-bold uppercase tracking-[0.17em] text-[#8587AD]">Directional signal</p>
        <p className="mt-1 text-sm font-semibold text-[#454778]">Not a prediction</p>
      </div>
    </div>
  );
}

export function ConfidenceBadge({ label, explanation }: { label: string; explanation: string }) {
  return (
    <div className="rounded-2xl border border-[#D4E5E7] bg-[#F0FBFB] px-4 py-3" data-testid="status-confidence">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C7EFF1] text-[#167D8D]"><Check size={12} strokeWidth={3} /></span>
        <span className="text-[0.64rem] font-bold uppercase tracking-[0.15em] text-[#217887]">{label}</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-[#527C83]">{explanation}</p>
    </div>
  );
}

export function WhyThisMatch({ reasons }: { reasons: string[] }) {
  return (
    <section className="border-t border-[#DDDEEC] pt-7" aria-labelledby="why-match-title">
      <div className="flex items-center justify-between gap-4">
        <h2 id="why-match-title" className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-[#6258D0]">Why this match</h2>
        <span className="font-mono text-[0.66rem] text-[#9597AF]">01 — 03</span>
      </div>
      <ul className="mt-5 space-y-4">
        {reasons.map((reason, index) => (
          <li key={reason} className="flex gap-3 text-sm leading-6 text-[#5D6082]" data-testid={`text-match-reason-${index + 1}`}>
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6256DB]" aria-hidden="true" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NextMoveCard({ move, onStart }: { move: string; onStart: () => void }) {
  return (
    <section className="rounded-[1.6rem] bg-[#211F61] p-6 text-white shadow-[0_22px_50px_rgba(39,35,120,0.15)] sm:p-8" aria-labelledby="next-move-title">
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4D47A8] text-[#BFEAF3]"><Sparkles size={17} strokeWidth={1.8} /></span>
        <span className="rounded-full border border-white/15 px-3 py-1.5 text-[0.59rem] font-bold uppercase tracking-[0.16em] text-[#BDEAF3]">Recommended</span>
      </div>
      <p className="mt-7 text-[0.63rem] font-bold uppercase tracking-[0.2em] text-[#85DDED]">The next useful step</p>
      <h2 id="next-move-title" className="mt-3 max-w-[27rem] text-[1.65rem] font-extrabold leading-[1.08] tracking-[-0.055em] text-[#F7F6FF]">{move}</h2>
      <button type="button" onClick={onStart} className="fluxrico-focus mt-7 inline-flex min-h-11 items-center gap-3 rounded-full bg-[#F1F2FF] px-5 text-[0.66rem] font-bold uppercase tracking-[0.15em] text-[#29266D] transition-transform hover:-translate-y-0.5" data-testid="button-start-next-move">
        Start next move <ArrowRight size={15} strokeWidth={2} />
      </button>
    </section>
  );
}

type RoadmapPreviewProps = {
  currentStage: string;
};

export function RoadmapPreview({ currentStage }: RoadmapPreviewProps) {
  const stages = ['Start', 'Shape', 'Move', 'Build', 'Launch', 'Grow'];

  return (
    <section id="roadmap-preview" className="rounded-[1.6rem] border border-[#DCDDED] bg-white/70 p-6 sm:p-8" aria-labelledby="roadmap-preview-title">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[0.63rem] font-bold uppercase tracking-[0.2em] text-[#6258D0]">A simple view of the path</p>
          <h2 id="roadmap-preview-title" className="mt-2 text-2xl font-extrabold tracking-[-0.055em] text-[#282961]">Your roadmap preview</h2>
        </div>
        <span className="text-xs text-[#8587A3]">Current stage: {currentStage}</span>
      </div>
      <ol className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {stages.map((stage, index) => {
          const active = stage === currentStage;
          return (
            <li key={stage} className={`relative rounded-xl border px-3 py-3 ${active ? 'border-[#6256DB] bg-[#F0EFFF]' : 'border-[#E4E4EF] bg-[#FAFAFE]'}`} data-testid={`roadmap-stage-${index + 1}`}>
              <span className={`font-mono text-[0.62rem] font-bold ${active ? 'text-[#6256DB]' : 'text-[#A0A2B7]'}`}>{String(index + 1).padStart(2, '0')}</span>
              <p className={`mt-2 text-sm font-bold ${active ? 'text-[#342D83]' : 'text-[#66698B]'}`}>{stage}</p>
              {active && <span className="mt-2 inline-flex items-center gap-1 text-[0.56rem] font-bold uppercase tracking-[0.12em] text-[#6256DB]"><span className="h-1.5 w-1.5 rounded-full bg-[#16C6EA]" />Current</span>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function EditAnswersButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="fluxrico-focus inline-flex items-center gap-2 rounded-full px-3 py-2 text-[0.64rem] font-bold uppercase tracking-[0.15em] text-[#65678B] transition-colors hover:bg-white hover:text-[#383777]" data-testid="button-edit-answers">
      <Pencil size={14} strokeWidth={1.8} /> Edit answers
    </button>
  );
}