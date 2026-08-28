import { NavigatorOption } from '@/components/navigator-option';

type NavigatorQuestionProps = {
  question: string;
  options: string[];
  selected?: string;
  onSelect: (value: string) => void;
};

export function NavigatorQuestion({ question, options, selected, onSelect }: NavigatorQuestionProps) {
  return (
    <section className="navigator-question" aria-labelledby="navigator-question-title">
      <div className="max-w-[45rem]">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#6258D0]">A little context</p>
        <h1 id="navigator-question-title" className="mt-5 text-[2.55rem] font-extrabold leading-[1.02] tracking-[-0.07em] text-[#202155] sm:text-[4.45rem]">
          {question}
        </h1>
        <p className="mt-5 max-w-[31rem] text-[0.98rem] leading-7 text-[#747696]">Choose the answer that feels closest. There is room to change direction later.</p>
      </div>
      <div className="mt-9 grid gap-3" role="radiogroup" aria-labelledby="navigator-question-title">
        {options.map((option, index) => (
          <NavigatorOption key={option} value={option} selected={selected === option} onSelect={onSelect} index={index} />
        ))}
      </div>
    </section>
  );
}