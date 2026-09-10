import { NavigatorOption } from '@/components/navigator-option';
import { NAVIGATOR_STEP_LABELS } from '@/components/navigator-progress';

type NavigatorQuestionProps = {
  /** Zero-based step position, used for the quiet "01 — Goal" kicker. */
  step?: number;
  question: string;
  options: string[];
  selected?: string;
  onSelect: (value: string) => void;
};

/**
 * One focused question: a numbered kicker, a large quiet headline, a short
 * supporting explanation, then the answer options. Nothing else competes.
 */
export function NavigatorQuestion({ step, question, options, selected, onSelect }: NavigatorQuestionProps) {
  const stepLabel = step !== undefined ? NAVIGATOR_STEP_LABELS[step - 1]?.toLowerCase() : undefined;
  const kicker = step !== undefined ? `Step ${String(step).padStart(2, '0')} — ${stepLabel ?? 'a little context'}` : 'A little context';

  return (
    <section className="navigator-question" aria-labelledby="navigator-question-title">
      <div className="max-w-[45rem]">
        <p className="text-[0.63rem] font-bold uppercase tracking-[0.2em] text-[#6258D0]">{kicker}</p>
        <h1
          id="navigator-question-title"
          className="mt-6 text-[2.5rem] font-extrabold leading-[1.04] tracking-[-0.065em] text-[#202155] sm:text-[4.1rem]"
        >
          {question}
        </h1>
        <p className="mt-5 max-w-[31rem] text-[0.98rem] leading-7 text-[#76789A]">
          Choose the answer that feels closest — there is room to change direction later.
        </p>
      </div>
      <div className="mt-10 grid gap-3" role="radiogroup" aria-labelledby="navigator-question-title">
        {options.map((option, index) => (
          <NavigatorOption
            key={option}
            value={option}
            selected={selected === option}
            onSelect={onSelect}
            index={index}
            marked={selected !== undefined}
          />
        ))}
      </div>
    </section>
  );
}
