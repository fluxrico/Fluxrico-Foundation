import { Check } from 'lucide-react';

type NavigatorOptionProps = {
  value: string;
  selected: boolean;
  onSelect: (value: string) => void;
  index: number;
};

export function NavigatorOption({ value, selected, onSelect, index }: NavigatorOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(value)}
      className={`navigator-option fluxrico-focus group flex min-h-[4.65rem] w-full items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition-all duration-200 sm:min-h-[5.1rem] sm:px-6 ${
        selected
          ? 'border-[#6256DB] bg-[#F0EFFF] shadow-[0_10px_25px_rgba(84,74,199,0.1)]'
          : 'border-[#DCDDED] bg-white/75 hover:-translate-y-0.5 hover:border-[#AAA5E5] hover:bg-white hover:shadow-[0_10px_25px_rgba(45,42,120,0.06)]'
      }`}
      data-testid={`option-navigator-${index + 1}`}
    >
      <span className={`text-[0.98rem] font-semibold tracking-[-0.02em] ${selected ? 'text-[#302974]' : 'text-[#37396B]'}`}>{value}</span>
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
          selected ? 'border-[#6256DB] bg-[#6256DB] text-white' : 'border-[#C9CBE0] text-transparent group-hover:border-[#9691D8]'
        }`}
        aria-hidden="true"
      >
        <Check size={14} strokeWidth={2.5} />
      </span>
    </button>
  );
}