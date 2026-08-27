import { Bell, ChevronDown, HelpCircle } from 'lucide-react';
import { MobileMenuButton } from '@/components/dashboard-sidebar';

type DashboardHeaderProps = {
  onOpenMenu: () => void;
  menuOpen: boolean;
  onReturnToProgress: () => void;
  newUser: boolean;
  onNotice: (message: string) => void;
};

export function DashboardHeader({ onOpenMenu, menuOpen, onReturnToProgress, newUser, onNotice }: DashboardHeaderProps) {
  return (
    <header className="flex min-h-[5.4rem] items-center justify-between gap-4 border-b border-[#E0E1ED] bg-[#F8F8FD]/80 px-5 sm:px-8 lg:px-10">
      <div className="flex items-center gap-3">
        <MobileMenuButton onClick={onOpenMenu} open={menuOpen} />
        <div>
          <p className="hidden text-[0.62rem] font-bold uppercase tracking-[0.19em] text-[#797C9A] sm:block">Your calm home base</p>
          <h1 className="mt-0.5 text-lg font-extrabold tracking-[-0.04em] text-[#202155] sm:text-xl">Good morning.</h1>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        {newUser ? (
          <button type="button" onClick={onReturnToProgress} className="fluxrico-focus hidden min-h-10 rounded-full border border-[#D2D3E6] bg-white px-4 text-[0.65rem] font-bold uppercase tracking-[0.13em] text-[#4E5180] hover:border-[#6857E8] hover:text-[#4A3AD2] sm:inline-flex sm:items-center" data-testid="button-return-in-progress">
            Return to preview
          </button>
        ) : (
          <span className="hidden items-center gap-2 text-xs font-medium text-[#777A99] sm:flex"><span className="h-2 w-2 rounded-full bg-[#16C6EA]" />Your journey is getting clearer.</span>
        )}
        <button type="button" onClick={() => onNotice('Guidance will meet you here when you need it.')} className="fluxrico-focus flex h-10 w-10 items-center justify-center rounded-full text-[#6B6E91] hover:bg-white hover:text-[#27285C]" aria-label="Help and guidance" data-testid="button-dashboard-help">
          <HelpCircle size={18} strokeWidth={1.8} />
        </button>
        <button type="button" onClick={() => onNotice('No new notes. You are all caught up.')} className="fluxrico-focus relative flex h-10 w-10 items-center justify-center rounded-full text-[#6B6E91] hover:bg-white hover:text-[#27285C]" aria-label="Notifications" data-testid="button-dashboard-notifications">
          <Bell size={18} strokeWidth={1.8} />
          <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-[#6754E9]" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => onNotice('Account settings are coming into focus.')} className="fluxrico-focus hidden items-center gap-2 rounded-full border border-[#DCDDEA] bg-white py-1.5 pl-1.5 pr-3 text-xs font-bold text-[#303263] sm:flex" aria-label="Open account menu" data-testid="button-dashboard-account">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D9F5FA] text-[0.62rem] font-extrabold text-[#267A8D]">MR</span>
          <ChevronDown size={14} strokeWidth={1.8} className="text-[#8C8FAB]" />
        </button>
      </div>
    </header>
  );
}