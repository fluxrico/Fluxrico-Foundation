/** Short labels for the four Navigator steps, shared with the question kicker. */
export const NAVIGATOR_STEP_LABELS = ['Goal', 'Now', 'Strength', 'Path'] as const;

type NavigatorProgressProps = {
  step: number;
  total?: number;
};

/**
 * The Navigator step track: quiet numbered nodes connected by hairlines, so
 * the user can read current, completed, and remaining steps at a glance.
 */
export function NavigatorProgress({ step, total = 4 }: NavigatorProgressProps) {
  const progress = `${String(step).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

  return (
    <div className="navigator-progress" data-testid="navigator-progress">
      <div className="flex items-center justify-between gap-4">
        <span className="text-[0.63rem] font-bold uppercase tracking-[0.2em] text-[#6B63B8]">Navigator</span>
        <span className="font-mono text-[0.66rem] font-semibold tracking-[0.14em] text-[#8A8CAD]" data-testid="text-navigator-step">
          {progress}
        </span>
      </div>
      <ol className="mt-5 flex items-start" aria-label={`Step ${step} of ${total}`}>
        {Array.from({ length: total }, (_, index) => {
          const position = index + 1;
          const state: 'done' | 'current' | 'todo' = position < step ? 'done' : position === step ? 'current' : 'todo';
          return (
            <li
              key={position}
              className="flex min-w-0 flex-1 items-start last:flex-none"
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <div className="flex w-12 flex-col items-center gap-2 sm:w-14">
                <span
                  className={`navigator-progress-node flex h-8 w-8 items-center justify-center rounded-full border font-mono text-[0.6rem] font-bold tracking-[0.04em] transition-all duration-300 ${
                    state === 'done'
                      ? 'border-[#C9C4F0] bg-[#EDEBFD] text-[#5D53C2]'
                      : state === 'current'
                        ? 'border-[#5D53C2] bg-white text-[#3D3486]'
                        : 'border-[#DEDFEF] bg-white text-[#B4B6CE]'
                  }`}
                  aria-hidden="true"
                >
                  {String(position).padStart(2, '0')}
                </span>
                <span
                  className={`whitespace-nowrap text-[0.53rem] font-bold uppercase tracking-[0.12em] transition-colors duration-300 ${
                    state === 'done'
                      ? 'text-[#8F87D6]'
                      : state === 'current'
                        ? 'text-[#4A43A3]'
                        : 'text-[#B9BBD3]'
                  }`}
                >
                  {NAVIGATOR_STEP_LABELS[index]}
                </span>
              </div>
              {position < total && (
                <span className="mx-1.5 mt-[0.95rem] min-w-4 flex-1" aria-hidden="true">
                  <span
                    className={`block h-px w-full rounded-full transition-colors duration-500 ${
                      position < step ? 'bg-[#B9B2EE]' : 'bg-[#DEDFEF]'
                    }`}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
