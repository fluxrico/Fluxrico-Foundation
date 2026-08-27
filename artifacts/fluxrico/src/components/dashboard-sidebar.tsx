import { Compass, Home, Library, Menu, Settings2, Sparkles, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { FluxricoMark } from '@/components/fluxrico-mark';

type DashboardSidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
  onPreviewNewUser: () => void;
};

const navigation = [
  { label: 'Home', href: '/dashboard', icon: Home, active: true },
  { label: 'Navigator', href: '#navigator', icon: Compass, active: false },
  { label: 'Library', href: '#library', icon: Library, active: false },
];

export function DashboardSidebar({ mobileOpen, onClose, onPreviewNewUser }: DashboardSidebarProps) {
  const [location] = useLocation();

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close dashboard navigation"
          className="fixed inset-0 z-30 bg-[#161746]/35 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
          data-testid="button-close-sidebar-overlay"
        />
      )}
      <aside
        className={`dashboard-sidebar-scroll fixed inset-y-0 left-0 z-40 flex w-[18rem] flex-col overflow-y-auto bg-[#211F61] px-5 py-6 text-[#F4F3FF] shadow-[12px_0_45px_rgba(37,34,115,0.11)] transition-transform duration-300 lg:static lg:z-auto lg:w-[17rem] lg:translate-x-0 lg:shadow-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Dashboard navigation"
      >
        <div className="flex items-center justify-between">
          <Link href="/dashboard" onClick={onClose} className="fluxrico-focus rounded-lg" data-testid="link-dashboard-logo">
            <FluxricoMark inverted />
          </Link>
          <button
            type="button"
            className="fluxrico-focus flex h-10 w-10 items-center justify-center rounded-full text-[#C3C6E8] hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close dashboard navigation"
            onClick={onClose}
            data-testid="button-close-sidebar"
          >
            <X size={19} strokeWidth={1.8} />
          </button>
        </div>

        <div className="mt-12">
          <p className="px-3 text-[0.61rem] font-bold uppercase tracking-[0.2em] text-[#969BCB]">Your workspace</p>
          <nav className="mt-3 space-y-1" aria-label="Workspace">
            {navigation.map(({ label, href, icon: Icon, active }) => (
              <Link
                key={label}
                href={href}
                onClick={onClose}
                className={`fluxrico-focus group flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${
                  active && location === '/dashboard'
                    ? 'bg-white/12 text-white shadow-[inset_3px_0_0_#16C7EC]'
                    : 'text-[#B8BCE0] hover:bg-white/[0.07] hover:text-white'
                }`}
                data-testid={`link-dashboard-${label.toLowerCase()}`}
              >
                <Icon size={18} strokeWidth={1.8} className={active && location === '/dashboard' ? 'text-[#5CD8F3]' : 'text-[#969BCB]'} />
                <span>{label}</span>
                {!active && <span className="ml-auto text-[0.56rem] font-bold uppercase tracking-[0.12em] text-[#8186B9]">Soon</span>}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto pt-12">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5146B8] text-[#D7D6FF]">
                <Sparkles size={15} strokeWidth={1.8} />
              </span>
              <span className="text-[0.58rem] font-bold uppercase tracking-[0.17em] text-[#86DFF3]">Preview</span>
            </div>
            <p className="mt-4 text-sm font-semibold leading-5 text-[#F1F0FF]">A quieter way to keep moving.</p>
            <p className="mt-2 text-xs leading-5 text-[#AEB2D7]">Your dashboard holds the thread between the idea and the next useful step.</p>
            <button
              type="button"
              onClick={onPreviewNewUser}
              className="fluxrico-focus mt-4 inline-flex min-h-10 items-center rounded-lg border border-white/15 px-3 text-[0.63rem] font-bold uppercase tracking-[0.13em] text-[#D6D8F5] transition-colors hover:border-[#62D9F3] hover:text-white"
              data-testid="button-preview-new-user"
            >
              Preview new-user state
            </button>
          </div>
          <Link
            href="#settings"
            onClick={onClose}
            className="fluxrico-focus mt-4 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-[#B8BCE0] hover:bg-white/[0.07] hover:text-white"
            data-testid="link-dashboard-settings"
          >
            <Settings2 size={18} strokeWidth={1.8} />
            Settings <span className="ml-auto text-[0.56rem] font-bold uppercase tracking-[0.12em] text-[#8186B9]">Soon</span>
          </Link>
        </div>
        <div className="mt-5 border-t border-white/10 pt-5">
          <p className="px-3 text-[0.58rem] font-bold uppercase tracking-[0.17em] text-[#8085BA]">Fluxrico / 02</p>
        </div>
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick, open }: { onClick: () => void; open: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? 'Close dashboard navigation' : 'Open dashboard navigation'}
      aria-expanded={open}
      className="fluxrico-focus flex h-11 w-11 items-center justify-center rounded-full border border-[#D7D9EA] bg-white text-[#343568] shadow-sm lg:hidden"
      data-testid="button-open-dashboard-navigation"
    >
      {open ? <X size={19} strokeWidth={1.8} /> : <Menu size={19} strokeWidth={1.8} />}
    </button>
  );
}