import { useState, type ReactNode } from 'react';
import { Bell, Compass, Home, Library, Menu, Route, Settings2, UserRound, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { FluxricoMark } from '@/components/fluxrico-mark';
import { JOURNEY } from '@/lib/journey';
import { useAuthState } from '@/lib/auth-state';
import { useWorkspaceState } from '@/lib/workspace-state';

/** Derives two-letter avatar initials from a resolved display name. */
function initialsOf(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2);
  return letters.toUpperCase() || 'MA';
}

// One shared navigation architecture for every workspace route.
export const WORKSPACE_NAVIGATION = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Navigator', href: '/navigator', icon: Compass },
  { label: 'Roadmap', href: '/roadmap', icon: Route },
  { label: 'Library', href: '/library', icon: Library },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Profile', href: '/profile', icon: UserRound },
  { label: 'Settings', href: '/settings', icon: Settings2 },
] as const;

function isNavActive(currentPath: string, href: string): boolean {
  if (href === '/navigator') {
    return currentPath === '/navigator' || currentPath.startsWith('/navigator/');
  }
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

type WorkspaceSidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

function WorkspaceSidebar({ mobileOpen, onClose }: WorkspaceSidebarProps) {
  const [location] = useLocation();

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-[#161746]/35 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
          data-testid="button-close-sidebar-overlay"
        />
      )}
      <aside
        className={`dashboard-sidebar-scroll fixed inset-y-0 left-0 z-40 flex w-[18rem] flex-col overflow-y-auto bg-[#211F61] px-5 py-6 text-[#F4F3FF] shadow-[12px_0_45px_rgba(37,34,115,0.11)] transition-transform duration-300 lg:static lg:z-auto lg:w-[17rem] lg:translate-x-0 lg:shadow-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Workspace navigation"
      >
        <div className="flex items-center justify-between">
          <Link href="/dashboard" onClick={onClose} className="fluxrico-focus rounded-lg" data-testid="link-shell-logo">
            <FluxricoMark inverted />
          </Link>
          <button
            type="button"
            className="fluxrico-focus flex h-10 w-10 items-center justify-center rounded-full text-[#C3C6E8] hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
            onClick={onClose}
            data-testid="button-close-sidebar"
          >
            <X size={19} strokeWidth={1.8} />
          </button>
        </div>

        <div className="mt-10">
          <p className="px-3 text-[0.61rem] font-bold uppercase tracking-[0.2em] text-[#969BCB]">Your workspace</p>
          <nav className="mt-3 space-y-1" aria-label="Workspace">
            {WORKSPACE_NAVIGATION.map(({ label, href, icon: Icon }) => {
              const active = isNavActive(location, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className={`fluxrico-focus flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-white/12 text-white shadow-[inset_3px_0_0_#16C7EC]'
                      : 'text-[#B8BCE0] hover:bg-white/[0.07] hover:text-white'
                  }`}
                  data-testid={`link-nav-${label.toLowerCase()}`}
                >
                  <Icon size={18} strokeWidth={1.8} className={active ? 'text-[#5CD8F3]' : 'text-[#969BCB]'} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto pt-10">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="text-sm font-semibold leading-5 text-[#F1F0FF]">A quieter way to keep moving.</p>
            <p className="mt-2 text-xs leading-5 text-[#AEB2D7]">
              Your dashboard holds the thread between the idea and the next useful step.
            </p>
            <Link
              href="/roadmap"
              onClick={onClose}
              className="fluxrico-focus mt-4 inline-flex min-h-10 items-center rounded-lg border border-white/15 px-3 text-[0.63rem] font-bold uppercase tracking-[0.13em] text-[#D6D8F5] transition-colors hover:border-[#62D9F3] hover:text-white"
              data-testid="button-sidebar-view-roadmap"
            >
              View roadmap
            </Link>
          </div>
        </div>
        <div className="mt-5 border-t border-white/10 pt-5">
          <p className="px-3 text-[0.58rem] font-bold uppercase tracking-[0.17em] text-[#8085BA]">Fluxrico / 02</p>
        </div>
      </aside>
    </>
  );
}

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { unreadCount, settings } = useWorkspaceState();
  const [location] = useLocation();
  const { user } = useAuthState();
  const closeMobile = () => setMobileOpen(false);
  // Identity follows the signed-in user, then the workspace's own settings —
  // the same precedence the Profile and Settings pages read.
  const displayName = user?.name ?? settings.displayName ?? JOURNEY.profile.name;

  return (
    <div
      className={`dashboard-noise min-h-[100dvh] bg-[#F6F7FF] text-[#191A4D] ${settings.compactMode ? 'ws-compact' : ''} ${
        settings.reducedMotion ? 'ws-reduced' : ''
      }`}
      data-compact={settings.compactMode ? 'true' : undefined}
      data-reduced-motion={settings.reducedMotion ? 'true' : undefined}
    >
      <div className="flex min-h-[100dvh]">
        <WorkspaceSidebar mobileOpen={mobileOpen} onClose={closeMobile} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex min-h-[5.4rem] items-center justify-between gap-4 border-b border-[#E0E1ED] bg-[#F8F8FD]/90 px-5 backdrop-blur sm:px-8 lg:px-10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
                aria-expanded={mobileOpen}
                className="fluxrico-focus flex h-11 w-11 items-center justify-center rounded-full border border-[#D7D9EA] bg-white text-[#343568] shadow-sm lg:hidden"
                data-testid="button-open-navigation"
              >
                {mobileOpen ? <X size={19} strokeWidth={1.8} /> : <Menu size={19} strokeWidth={1.8} />}
              </button>
              <Link href="/dashboard" className="fluxrico-focus rounded-lg lg:hidden" aria-label="Fluxrico dashboard">
                <FluxricoMark compact />
              </Link>
              <p className="hidden text-[0.62rem] font-bold uppercase tracking-[0.19em] text-[#797C9A] lg:block">
                Fluxrico workspace
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/notifications"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                className={`fluxrico-focus relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  isNavActive(location, '/notifications') ? 'bg-white text-[#27285C]' : 'text-[#6B6E91] hover:bg-white hover:text-[#27285C]'
                }`}
                data-testid="link-header-notifications"
              >
                <Bell size={18} strokeWidth={1.8} />
                {unreadCount > 0 && (
                  <span
                    className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#6754E9] px-1 text-[0.55rem] font-bold leading-none text-white"
                    aria-hidden="true"
                  >
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                aria-label="Open profile"
                className="fluxrico-focus flex items-center gap-2 rounded-full border border-[#DCDDEA] bg-white py-1.5 pl-1.5 pr-3 text-xs font-bold text-[#303263] transition-colors hover:border-[#8E88E1]"
                data-testid="link-header-profile"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D9F5FA] text-[0.62rem] font-extrabold text-[#267A8D]">
                  {initialsOf(displayName)}
                </span>
                <span className="hidden sm:inline">{displayName}</span>
              </Link>
            </div>
          </header>
          <main className="flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12" id="main-content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

/** Consistent page header used across workspace routes. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="fluxrico-rise flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.21em] text-[#6258D0]">{eyebrow}</p>
        <h1 className="mt-3 max-w-[41rem] text-[2.35rem] font-extrabold leading-[0.99] tracking-[-0.07em] text-[#202155] sm:text-[3.6rem]">
          {title}
        </h1>
        {description && <p className="mt-4 max-w-[34rem] text-base leading-7 text-[#737696]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
