import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { FluxricoMark } from '@/components/fluxrico-mark';
import { NavigatorProgress } from '@/components/navigator-progress';

type NavigatorShellProps = {
  step?: number;
  children: ReactNode;
};

export function NavigatorShell({ step, children }: NavigatorShellProps) {
  return (
    <div className="navigator-shell fluxrico-grain min-h-[100dvh] overflow-x-hidden bg-[#F6F7FF] text-[#191A4D]">
      <header className="mx-auto flex min-h-[5.3rem] max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="fluxrico-focus rounded-lg" data-testid="link-navigator-home">
          <FluxricoMark />
        </Link>
        <Link href="/dashboard" className="fluxrico-focus hidden items-center gap-2 rounded-full px-3 py-2 text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#727596] transition-colors hover:bg-white hover:text-[#343568] sm:inline-flex" data-testid="link-navigator-dashboard">
          <ArrowLeft size={14} strokeWidth={1.8} />
          Dashboard
        </Link>
      </header>
      <main className="mx-auto max-w-[1240px] px-5 pb-12 pt-5 sm:px-8 sm:pb-16 sm:pt-8 lg:px-10 lg:pt-10">
        {step && (
          <div className="mx-auto max-w-[49rem]">
            <NavigatorProgress step={step} />
          </div>
        )}
        {children}
      </main>
    </div>
  );
}