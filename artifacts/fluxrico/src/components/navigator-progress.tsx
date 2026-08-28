type NavigatorProgressProps = {
  step: number;
  total?: number;
};

export function NavigatorProgress({ step, total = 4 }: NavigatorProgressProps) {
  const progress = `${String(step).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

  return (
    <div className="navigator-progress" data-testid="navigator-progress">
      <div className="flex items-center justify-between gap-4">
        <span className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-[#6264A0]">Navigator</span>
        <span className="font-mono text-[0.68rem] font-semibold tracking-[0.12em] text-[#74769A]" data-testid="text-navigator-step">
          {progress}
        </span>
      </div>
      <div className="mt-3 flex gap-1.5" aria-label={`Step ${step} of ${total}`}>
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${index < step ? 'bg-[#6256DB]' : 'bg-[#DCDDF0]'}`}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}