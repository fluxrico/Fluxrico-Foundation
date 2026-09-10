import { Check } from 'lucide-react';

type NavigatorOptionProps = {
  value: string;
  selected: boolean;
  onSelect: (value: string) => void;
  index: number;
  /** True once any answer exists on the step — quietens unselected hover lift. */
  marked?: boolean;
};

/**
 * A single answer card. Resting state is calm paper; the selected state is
 * unmistakable — indigo edge, tinted field, and a solid check token — while
 * staying quiet enough not to shout.
 */
export function NavigatorOption({ value, selected, onSelect, index, marked = false }: NavigatorOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(value)}
      className={`navigator-option fluxrico-focus group flex min-h-[4.65rem] w-full items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition-all duration-200 sm:min-h-[5.1rem] sm:px-6 ${
        selected
          ? 'border-[#5D53C2] bg-[#F1EFFE] shadow-[0_10px_26px_rgba(84,74,199,0.11)]'
          : `border-[#DEDEF0] bg-white/80 hover:border-[#B7B2E6] hover:bg-white hover:shadow-[0_10px_25px_rgba(45,42,120,0.055)] ${marked ? '' : 'hover:-translate-y-0.5'}`
      }`}
      data-testid={`option-navigator-${index + 1}`}
    >
      <span className={`flex items-center gap-4 ${selected ? 'text-[#302974]' : 'text-[#37396B]'}`}>
        <span
          className={`hidden font-mono text-[0.6rem] font-bold tracking-[0.08em] transition-colors sm:block ${
            selected ? 'text-[#7A70CF]' : 'text-[#B4B6CE] group-hover:text-[#8B8FD8]'
          }`}
          aria-hidden="true"
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="text-[0.98rem] font-semibold tracking-[-0.02em]">{value}</span>
      </span>
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
          selected
            ? 'scale-100 border-[#5D53C2] bg-[#5D53C2] text-white'
            : 'scale-95 border-[#CDCFE2] text-transparent group-hover:scale-100 group-hover:border-[#A5A0DC]'
        }`}
        aria-hidden="true"
      >
        <Check size={14} strokeWidth={2.5} />
      </span>
    </button>
  );
}
