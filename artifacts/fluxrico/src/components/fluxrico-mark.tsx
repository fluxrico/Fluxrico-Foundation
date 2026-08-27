type FluxricoMarkProps = {
  compact?: boolean;
  inverted?: boolean;
  className?: string;
};

export function FluxricoMark({
  compact = false,
  inverted = false,
  className = '',
}: FluxricoMarkProps) {
  const wordColor = inverted ? '#F7F7FF' : '#191A4D';
  const subColor = inverted ? '#B9BEDE' : '#686B8D';

  return (
    <div className={`inline-flex items-center ${className}`} aria-label="Fluxrico">
      <svg
        className={compact ? 'h-9 w-9' : 'h-10 w-[42px]'}
        viewBox="0 0 48 48"
        fill="none"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="fluxrico-mark-gradient" x1="4" y1="31" x2="43" y2="14" gradientUnits="userSpaceOnUse">
            <stop stopColor="#04B7E8" />
            <stop offset="0.48" stopColor="#2459F4" />
            <stop offset="1" stopColor="#813CE9" />
          </linearGradient>
        </defs>
        <path
          d="M8.1 30.6c-4.8-5.6-.8-14 6.1-14 3.3 0 5.8 1.4 8.2 3.2l4.6 3.4c2.5 1.8 4.5 2.8 6.8 2.8 3.2 0 5.6-2.1 5.6-5.1 0-3.1-2.6-5.3-5.9-5.3-2.4 0-4.3 1-6.8 2.9l-3.7 2.8"
          stroke="url(#fluxrico-mark-gradient)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M39.5 17.4c4.8 5.6.8 14-6.1 14-3.3 0-5.8-1.4-8.2-3.2l-4.6-3.4c-2.5-1.8-4.5-2.8-6.8-2.8-3.2 0-5.6 2.1-5.6 5.1 0 3.1 2.6 5.3 5.9 5.3 2.4 0 4.3-1 6.8-2.9l3.7-2.8"
          stroke="url(#fluxrico-mark-gradient)"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>
      {!compact && (
        <span className="ml-2.5 flex flex-col leading-none">
          <span
            className="text-[1.36rem] font-extrabold tracking-[-0.065em]"
            style={{ color: wordColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Fluxrico
          </span>
          <span
            className="mt-1 text-[0.5rem] font-semibold uppercase tracking-[0.26em]"
            style={{ color: subColor }}
          >
            From idea to income
          </span>
        </span>
      )}
    </div>
  );
}