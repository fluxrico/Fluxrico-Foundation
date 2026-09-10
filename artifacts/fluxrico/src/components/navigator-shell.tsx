import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { FluxricoMark } from '@/components/fluxrico-mark';
import { NavigatorProgress } from '@/components/navigator-progress';
import { useAuthState } from '@/lib/auth-state';

type NavigatorShellProps = {
  /** When set, the shell renders the step indicator above the content. */
  step?: number;
  children: ReactNode;
};

/**
 * The Navigator journey surface — deliberately separate from the dashboard:
 * no app sidebar, no workspace navigation, just the brand, a quiet progress
 * indicator, and one focused question or the result at a time.
 */
export function NavigatorShell({ step, children }: NavigatorShellProps) {
  const { isAuthenticated } = useAuthState();

  return (
    <div className="navigator-shell fluxrico-grain flex min-h-[100dvh] flex-col overflow-x-hidden bg-[#F6F7FF] text-[#191A4D]">
      <header className="mx-auto flex w-full max-w-[1240px] items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <Link href="/" className="fluxrico-focus rounded-lg" aria-label="Fluxrico home" data-testid="link-navigator-home">
          <FluxricoMark />
        </Link>
        <Link
          href={isAuthenticated ? '/dashboard' : '/'}
          className="fluxrico-focus inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#7A7D9C] transition-colors hover:bg-white hover:text-[#343568]"
          data-testid="link-navigator-dashboard"
        >
          <ArrowLeft size={13} strokeWidth={1.9} />
          Exit
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col px-5 pb-20 pt-8 sm:px-8 sm:pb-24 sm:pt-10 lg:px-10 lg:pt-12">
        {step !== undefined && (
          <div className="mx-auto w-full max-w-[49rem]">
            <NavigatorProgress step={step} />
          </div>
        )}
        <div className="flex flex-1 flex-col pt-8 sm:pt-10">{children}</div>
      </main>

      <footer className="mx-auto w-full max-w-[1240px] px-5 pb-7 sm:px-8 lg:px-10">
        <p className="text-center text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#A6A8C3]">
          Fluxrico Navigator — discover your direction
        </p>
      </footer>
    </div>
  );
}
