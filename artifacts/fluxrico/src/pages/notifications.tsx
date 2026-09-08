import { Bell, CheckCheck, Trash2, X } from 'lucide-react';
import { AppShell, PageHeader } from '@/components/app-shell';
import { useWorkspaceState } from '@/lib/workspace-state';
import type { NotificationCategory } from '@/lib/workspace-state';

const CATEGORY_STYLE: Record<NotificationCategory, string> = {
  Journey: 'bg-[#F0EFFF] text-[#6256DB]',
  Roadmap: 'bg-[#E4F9FC] text-[#159BB5]',
  Library: 'bg-[#FDF3E7] text-[#B0651F]',
  Product: 'bg-[#F1F2FD] text-[#4E46C0]',
};

export default function Notifications() {
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  } = useWorkspaceState();

  return (
    <AppShell>
      <div className="mx-auto max-w-[1120px]">
        <PageHeader
          eyebrow="Notifications / your thread"
          title="Everything that moved, in one calm list."
          description="Moments from your journey, roadmap, and library — kept quiet until you look."
          actions={
            <>
              <button
                type="button"
                onClick={markAllNotificationsRead}
                disabled={unreadCount === 0}
                className="fluxrico-focus inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D4D5E8] bg-white px-4 text-[0.64rem] font-bold uppercase tracking-[0.13em] text-[#5B56B5] transition-colors hover:border-[#8E88E1] disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="button-notifications-mark-all"
              >
                <CheckCheck size={15} strokeWidth={2} /> Mark all read
              </button>
              <button
                type="button"
                onClick={clearNotifications}
                disabled={notifications.length === 0}
                className="fluxrico-focus inline-flex min-h-10 items-center gap-2 rounded-full border border-[#E7D9D9] bg-white px-4 text-[0.64rem] font-bold uppercase tracking-[0.13em] text-[#A05B5B] transition-colors hover:border-[#C98B8B] disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="button-notifications-clear"
              >
                <Trash2 size={15} strokeWidth={2} /> Clear
              </button>
            </>
          }
        />

        {notifications.length === 0 ? (
          <div className="mt-10 rounded-[1.8rem] border border-dashed border-[#D5D6E8] bg-[#FAFAFE] px-6 py-14 text-center" data-testid="state-notifications-empty">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#8B8DAB] shadow-sm"><Bell size={20} strokeWidth={1.6} /></span>
            <h2 className="mt-5 text-xl font-extrabold tracking-[-0.04em] text-[#25265A]">All quiet.</h2>
            <p className="mx-auto mt-2 max-w-[24rem] text-sm leading-6 text-[#8587A3]">Nothing needs your attention. New moments will gather here as you keep moving.</p>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {notifications.map((item) => (
              <li
                key={item.id}
                className={`dashboard-card-lift flex items-start gap-4 rounded-2xl border p-4 sm:p-5 ${
                  item.read ? 'border-[#E4E4EF] bg-[#FAFAFE]' : 'border-[#D5D4F0] bg-white shadow-[0_8px_28px_rgba(44,42,123,0.05)]'
                }`}
                data-testid={`notification-${item.id}`}
              >
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[0.56rem] font-extrabold uppercase tracking-[0.08em] ${CATEGORY_STYLE[item.category]}`}>
                  {item.category.slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center sm:gap-3">
                    <p className={`text-sm ${item.read ? 'font-semibold text-[#4B4D76]' : 'font-bold text-[#25265A]'}`}>{item.title}</p>
                    <time className="text-[0.64rem] font-medium text-[#9A9CB3]">{item.timestamp}</time>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#8587A3]">{item.detail}</p>
                </div>
                {!item.read && (
                  <button
                    type="button"
                    onClick={() => markNotificationRead(item.id)}
                    className="fluxrico-focus shrink-0 rounded-full border border-[#D4D5E8] bg-white px-3 py-1.5 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-[#5B56B5] transition-colors hover:border-[#8E88E1]"
                    aria-label={`Mark "${item.title}" as read`}
                    data-testid={`button-notification-read-${item.id}`}
                  >
                    Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-[#DDDEEC] pt-5">
          <p className="text-xs leading-5 text-[#888AA4]">{unreadCount > 0 ? `${unreadCount} unread of ${notifications.length}.` : 'You are all caught up.'}</p>
        </div>
      </div>
    </AppShell>
  );
}
