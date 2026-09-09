import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type PanelTone = 'light' | 'dark';

type PreviewChromeProps = {
  title: string;
  meta?: ReactNode;
  tone?: PanelTone;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * Shared browser-style frame for landing product previews. The dark tone
 * mirrors the Fluxrico dashboard's deep-indigo canvas; the light tone mirrors
 * the workspace pages, so previews read as the real product rather than a
 * separate marketing visual language. Purely decorative: aria-hidden.
 */
export function PreviewChrome({ title, meta, tone = 'dark', footer, className, children }: PreviewChromeProps) {
  const dark = tone === 'dark';

  return (
    <div
      aria-hidden="true"
      className={cn(
        'overflow-hidden rounded-2xl border shadow-[0_30px_80px_hsl(var(--landing-shadow-color)/0.16)] sm:rounded-[1.4rem]',
        dark ? 'border-[hsl(240_40%_24%)] bg-[hsl(241_50%_13%)]' : 'border-[hsl(var(--landing-line))] bg-[hsl(var(--landing-surface))]',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center gap-3 border-b px-4 py-3 sm:px-5',
          dark ? 'border-[hsl(240_34%_22%)] bg-[hsl(241_46%_11%)]' : 'border-[hsl(var(--landing-line))] bg-[hsl(var(--landing-surface-2))]',
        )}
      >
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]/80" />
        </span>
        <span
          className={cn(
            'truncate font-mono text-[0.62rem] font-semibold tracking-[0.08em]',
            dark ? 'text-[hsl(236_26%_76%)]' : 'text-[hsl(var(--landing-muted))]',
          )}
        >
          {title}
        </span>
        {meta && <span className="ml-auto hidden sm:block">{meta}</span>}
      </div>
      <div className={cn(dark ? 'text-[hsl(235_45%_97%)]' : 'text-[hsl(var(--landing-ink))]')}>{children}</div>
      {footer && (
        <div
          className={cn(
            'border-t px-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.16em] sm:px-5',
            dark ? 'border-[hsl(240_34%_22%)] text-[hsl(236_26%_70%)]' : 'border-[hsl(var(--landing-line))] text-[hsl(var(--landing-muted))]',
          )}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
