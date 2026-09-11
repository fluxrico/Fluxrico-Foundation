import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Compass,
  Feather,
  Library as LibraryIcon,
  Route as RouteIcon,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';
import { Link } from 'wouter';
import { AppShell, PageHeader } from '@/components/app-shell';
import { Switch } from '@/components/ui/switch';
import { useWorkspaceState } from '@/lib/workspace-state';
import type { NotificationCategory, NotificationItem } from '@/lib/workspace-state';

// ── Filter vocabulary ─────────────────────────────────────────────────────────
// Mirrors NotificationCategory, so every category is filterable. 'Product'
// items stay visible under All but have no dedicated filter — the approved
// filter set is the journey-facing one.

type FilterKey = 'all' | NotificationCategory;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'Journey', label: 'Journey' },
  { key: 'Roadmap', label: 'Roadmap' },
  { key: 'Guidance', label: 'Guidance' },
  { key: 'Library', label: 'Library' },
];

// ── Category presentation ─────────────────────────────────────────────────────
// Aligned with the Library kind badges — the same colors mean the same thing
// across the workspace.

const CATEGORY_META: Record<NotificationCategory, { icon: typeof Compass; badge: string }> = {
  Journey: { icon: Compass, badge: 'bg-[#F0EFFF] text-[#6256DB]' },
  Roadmap: { icon: RouteIcon, badge: 'bg-[#E4F9FC] text-[#159BB5]' },
  Guidance: { icon: Feather, badge: 'bg-[#FDF3E7] text-[#B0651F]' },
  Library: { icon: LibraryIcon, badge: 'bg-[#F1F2FD] text-[#4E46C0]' },
  Product: { icon: Sparkles, badge: 'bg-[#F1F2FD] text-[#4E46C0]' },
};

const QUIET_BUTTON =
  'fluxrico-focus inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D4D5E8] bg-white px-4 text-[0.64rem] font-bold uppercase tracking-[0.13em] text-[#5B56B5] transition-colors hover:border-[#8E88E1] disabled:cursor-not-allowed disabled:opacity-50';

// ── Notification row ──────────────────────────────────────────────────────────
// Each row answers three questions: what happened (title), why it matters
// (detail), and what you can do (quick action). Unread rows carry a dot and
// stronger weight; important rows carry a violet rail and a badge.

function NotificationRow({ item }: { item: NotificationItem }) {
  const { markNotificationRead } = useWorkspaceState();
  const meta = CATEGORY_META[item.category];
  const Icon = meta.icon;
  const unread = !item.read;

  return (
    <li
      className={`dashboard-card-lift flex items-start gap-4 rounded-2xl border p-4 sm:p-5 ${
        item.important ? 'border-l-4 border-l-[#6857E8] ' : ''
      }${
        unread
          ? 'border-[#D5D4F0] bg-white shadow-[0_8px_28px_rgba(44,42,123,0.05)]'
          : 'border-[#E4E4EF] bg-[#FAFAFE]'
      }`}
      data-testid={`notification-${item.id}`}
    >
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.badge}`}
        aria-hidden="true"
      >
        <Icon size={16} strokeWidth={1.8} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <p className={`flex min-w-0 items-center gap-2 text-sm ${unread ? 'font-extrabold text-[#25265A]' : 'font-semibold text-[#4B4D76]'}`}>
            <span className="truncate">{item.title}</span>
            {item.sample && (
              <span className="shrink-0 rounded-full border border-[#E0E1F0] bg-[#FAFAFE] px-2 py-0.5 text-[0.54rem] font-bold uppercase tracking-[0.12em] text-[#8A8CAD]">
                Sample
              </span>
            )}
          </p>
          <div className="flex shrink-0 items-center gap-2.5">
            {item.important && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F0EFFF] px-2 py-0.5 text-[0.54rem] font-bold uppercase tracking-[0.12em] text-[#5147C2]">
                <Target size={11} strokeWidth={2.2} aria-hidden="true" /> Important
              </span>
            )}
            {unread && (
              <span className="flex items-center gap-1.5 text-[0.56rem] font-bold uppercase tracking-[0.14em] text-[#6857E8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6857E8]" aria-hidden="true" /> New
              </span>
            )}
            <time className="text-[0.64rem] font-medium text-[#9A9CB3]">{item.timestamp}</time>
          </div>
        </div>
        <p className="mt-1 text-xs leading-5 text-[#8587A3]">{item.detail}</p>
        {item.href && item.actionLabel && (
          <Link
            href={item.href}
            onClick={() => markNotificationRead(item.id)}
            className="fluxrico-focus mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#EBE9FF] px-3 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[#5147C2] transition-colors hover:bg-[#E1DEFF]"
            data-testid={`button-notification-action-${item.id}`}
          >
            {item.actionLabel}
            <ArrowUpRight size={13} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        )}
      </div>

      {unread && (
        <button
          type="button"
          onClick={() => markNotificationRead(item.id)}
          aria-label={`Mark "${item.title}" as read`}
          className="fluxrico-focus mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#D4D5E8] bg-white text-[#5B56B5] transition-colors hover:border-[#8E88E1] sm:mt-0"
          data-testid={`button-notification-read-${item.id}`}
        >
          <Check size={16} strokeWidth={2.2} />
        </button>
      )}
    </li>
  );
}

// ── Summary panel ─────────────────────────────────────────────────────────────
// Useful signal, not vanity numbers: what is unread, what is important, and
// how much of the feed belongs to the journey itself.

function SummaryPanel() {
  const { notifications, unreadCount, markAllNotificationsRead, clearNotifications } = useWorkspaceState();

  const stats = useMemo(() => {
    const important = notifications.filter((item) => item.important).length;
    const journeyFacing = notifications.filter((item) => item.category !== 'Product').length;
    return { important, journeyFacing };
  }, [notifications]);

  return (
    <section
      className="fluxrico-rise fluxrico-rise-delay-1 mt-8 rounded-[1.65rem] border border-[#DADBF0] bg-white p-6 shadow-[0_8px_28px_rgba(44,42,123,0.04)] sm:p-7"
      aria-labelledby="notifications-summary-title"
      data-testid="card-notifications-summary"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#6861C8]">At a glance</p>
          <h2 id="notifications-summary-title" className="mt-2 text-xl font-extrabold tracking-[-0.045em] text-[#25265A]">
            Your signal, summarized
          </h2>
        </div>
        <BellRing size={20} strokeWidth={1.6} className="mt-1 shrink-0 text-[#B4B1E4]" aria-hidden="true" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-[#FAFAFE] p-4">
          <p className="text-3xl font-extrabold tracking-[-0.05em] text-[#25265A]">{unreadCount}</p>
          <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#8587A3]">Unread</p>
        </div>
        <div className="rounded-2xl bg-[#FAFAFE] p-4">
          <p className="text-3xl font-extrabold tracking-[-0.05em] text-[#25265A]">{stats.important}</p>
          <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#8587A3]">Important</p>
        </div>
        <div className="rounded-2xl bg-[#FAFAFE] p-4">
          <p className="text-3xl font-extrabold tracking-[-0.05em] text-[#25265A]">{stats.journeyFacing}</p>
          <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#8587A3]">Journey events</p>
        </div>
        <div className="rounded-2xl bg-[#FAFAFE] p-4">
          <p className="text-3xl font-extrabold tracking-[-0.05em] text-[#25265A]">{notifications.length}</p>
          <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#8587A3]">Total</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#ECECF1] pt-5">
        <button
          type="button"
          onClick={markAllNotificationsRead}
          disabled={unreadCount === 0}
          className={QUIET_BUTTON}
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
        <p className="ml-auto text-xs font-semibold text-[#9A9CB3]">
          {unreadCount > 0 ? `${unreadCount} of ${notifications.length} unread` : 'All caught up'}
        </p>
      </div>
    </section>
  );
}

// ── Preferences ───────────────────────────────────────────────────────────────
// Reads and writes the same notification settings as /settings — one shared
// source of truth, no duplicated state.

const PREFERENCE_ROWS = [
  {
    key: 'emailDigest' as const,
    label: 'Weekly email digest',
    description: 'A short summary of your journey, once a week.',
  },
  {
    key: 'productUpdates' as const,
    label: 'Product updates',
    description: 'Notes when a new Fluxrico phase ships.',
  },
  {
    key: 'journeyReminders' as const,
    label: 'Journey reminders',
    description: 'A gentle nudge when your next move has been waiting.',
  },
];

function PreferencesSection() {
  const { settings, updateSettings } = useWorkspaceState();

  return (
    <section
      className="mt-10 rounded-[1.65rem] border border-[#DADBF0] bg-white p-6 shadow-[0_8px_28px_rgba(44,42,123,0.04)] sm:p-7"
      aria-labelledby="notifications-preferences-title"
      data-testid="card-notifications-preferences"
    >
      <p className="text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#6861C8]">Preferences</p>
      <h2 id="notifications-preferences-title" className="mt-2 text-xl font-extrabold tracking-[-0.045em] text-[#25265A]">
        How Fluxrico reaches you
      </h2>
      <div className="mt-4 divide-y divide-[#ECECF1]">
        {PREFERENCE_ROWS.map((row) => (
          <div
            key={row.key}
            className="flex items-start justify-between gap-5 py-4 first:pt-0 last:pb-0"
            data-testid={`notification-pref-${row.key}`}
          >
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#343568]">{row.label}</p>
              <p className="mt-1 text-xs leading-5 text-[#8587A3]">{row.description}</p>
            </div>
            <Switch
              checked={settings[row.key]}
              onCheckedChange={(value) => updateSettings({ [row.key]: value })}
              aria-label={row.label}
              data-testid={`switch-${row.key}`}
            />
          </div>
        ))}
      </div>
      <p className="mt-5 border-t border-[#ECECF1] pt-4 text-xs leading-5 text-[#9A9CB3]">
        The same preferences live in Settings — changing them here changes them everywhere.
      </p>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Notifications() {
  const { notifications, unreadCount } = useWorkspaceState();
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? notifications : notifications.filter((item) => item.category === filter)),
    [filter, notifications],
  );

  const counts = useMemo(() => {
    const map = {} as Record<FilterKey, number>;
    for (const item of FILTERS) {
      map[item.key] =
        item.key === 'all'
          ? notifications.length
          : notifications.filter((notification) => notification.category === item.key).length;
    }
    return map;
  }, [notifications]);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1120px]">
        <PageHeader
          eyebrow="Notifications / your thread"
          title="Everything that moved, in one calm list."
          description="Moments from your journey, roadmap, guidance, and library — kept quiet until you look."
        />

        <SummaryPanel />

        <div className="fluxrico-rise fluxrico-rise-delay-2 mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter notifications">
          {FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                aria-pressed={active}
                className={`fluxrico-focus inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[0.66rem] font-bold uppercase tracking-[0.13em] transition-colors ${
                  active
                    ? 'border-[#6256DB] bg-[#F0EFFF] text-[#5147C2]'
                    : 'border-[#DADBEA] bg-white text-[#5B56B5] hover:border-[#8E88E1]'
                }`}
                data-testid={`tab-notifications-${item.key.toLowerCase()}`}
              >
                {item.label}
                <span className={`font-mono text-[0.6rem] ${active ? 'text-[#6258D0]' : 'text-[#A0A2B7]'}`}>
                  {counts[item.key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="fluxrico-rise fluxrico-rise-delay-2 mt-6">
          {filtered.length === 0 ? (
            <div
              className="rounded-[1.8rem] border border-dashed border-[#D5D6E8] bg-[#FAFAFE] px-6 py-14 text-center"
              data-testid="state-notifications-empty"
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#8B8DAB] shadow-sm">
                <Bell size={20} strokeWidth={1.6} />
              </span>
              <h2 className="mt-5 text-xl font-extrabold tracking-[-0.04em] text-[#25265A]">All quiet.</h2>
              <p className="mx-auto mt-2 max-w-[24rem] text-sm leading-6 text-[#8587A3]">
                Nothing needs your attention here. New moments will gather as you keep moving.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((item) => (
                <NotificationRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </div>

        <PreferencesSection />

        <div className="mt-8 flex items-center justify-between border-t border-[#DDDEEC] pt-5">
          <p className="text-xs leading-5 text-[#888AA4]">
            {unreadCount > 0
              ? `${unreadCount} unread of ${notifications.length}. Notifications are part of the journey — nothing here is noise.`
              : 'You are all caught up.'}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
