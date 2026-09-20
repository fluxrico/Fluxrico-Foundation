import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  BellRing,
  Database,
  Download,
  KeyRound,
  LogOut,
  Monitor,
  Moon,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  SunMoon,
  Trash2,
  UserRound,
} from 'lucide-react';
import {
  changePassword,
  deleteAccount,
  exportAccountData,
  listSessions,
  revokeOtherSessions,
  updateAccount,
  ApiError,
} from '@workspace/api-client-react';
import type { SessionInfo, AccountExport } from '@workspace/api-client-react';
import type { LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { AppShell, PageHeader } from '@/components/app-shell';
import { Switch } from '@/components/ui/switch';
import { useLandingTheme } from '@/components/landing/theme';
import type { ThemePreference } from '@/components/landing/theme';
import { useAuthState } from '@/lib/auth-state';
import { useSubscriptionState } from '@/lib/subscription-state';
import { useWorkspaceState } from '@/lib/workspace-state';
import type { WorkspaceSettings } from '@/lib/workspace-state';
import { createBillingPortalSession } from '@workspace/api-client-react';

// ── Settings vocabulary ──────────────────────────────────────────────────────
// Settings answers one question: how do I want Fluxrico to work? Profile (who
// am I) and Notifications (what moved) stay where they are — this page only
// reads and writes the shared sources of truth: WorkspaceSettings, the landing
// theme store, and auth state. Nothing journey-related is redefined here.

type BooleanSettingKey = {
  [K in keyof WorkspaceSettings]: WorkspaceSettings[K] extends boolean ? K : never;
}[keyof WorkspaceSettings];

type ToggleRow = {
  key: BooleanSettingKey;
  label: string;
  description: string;
};

// Same three preferences and copy as the Notifications page — one shared
// state, so both surfaces always agree.
const NOTIFICATION_TOGGLES: ToggleRow[] = [
  { key: 'emailDigest', label: 'Weekly email digest', description: 'A short summary of your journey, once a week.' },
  { key: 'productUpdates', label: 'Product updates', description: 'Notes when a new Fluxrico phase ships.' },
  { key: 'journeyReminders', label: 'Journey reminders', description: 'A gentle nudge when your next move has been waiting.' },
];

const PREFERENCE_TOGGLES: ToggleRow[] = [
  { key: 'compactMode', label: 'Compact workspace', description: 'Tighten card spacing across your workspace.' },
  { key: 'reducedMotion', label: 'Reduced motion', description: 'Calms animations and movement across your workspace.' },
];

const APPEARANCE_OPTIONS: { value: ThemePreference; label: string; detail: string; icon: LucideIcon }[] = [
  { value: 'system', label: 'Automatic', detail: 'Follows your device setting.', icon: Monitor },
  { value: 'light', label: 'Light', detail: 'Bright, daytime surface.', icon: Sun },
  { value: 'dark', label: 'Dark', detail: 'Low light, evening surface.', icon: Moon },
];

type SectionId = 'account' | 'appearance' | 'notifications' | 'preferences' | 'privacy' | 'security' | 'account-actions';

const SECTIONS: { id: SectionId; label: string; icon: LucideIcon }[] = [
  { id: 'account', label: 'Account', icon: UserRound },
  { id: 'appearance', label: 'Appearance', icon: SunMoon },
  { id: 'notifications', label: 'Notifications', icon: BellRing },
  { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
  { id: 'privacy', label: 'Privacy & data', icon: Database },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'account-actions', label: 'Account actions', icon: LogOut },
];

const SECTION_IDS = SECTIONS.map((section) => section.id);

function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && typeof error.data === 'object' && error.data != null) {
    const message = (error.data as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return fallback;
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const QUIET_BUTTON =
  'fluxrico-focus inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D4D5E8] bg-white px-4 text-[0.64rem] font-bold uppercase tracking-[0.13em] text-[#5B56B5] transition-colors hover:border-[#8E88E1]';

// ── Shared pieces ────────────────────────────────────────────────────────────

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

/** One refined panel per settings group — quiet border, minimal shadow. */
function SettingsSection({
  id,
  icon: Icon,
  title,
  description,
  children,
}: {
  id: SectionId;
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-[10.5rem] rounded-[1.65rem] border border-[#DADBF0] bg-white p-6 shadow-[0_8px_28px_rgba(44,42,123,0.04)] sm:p-8 lg:scroll-mt-[7rem]"
      aria-labelledby={`settings-${id}-title`}
      data-testid={`settings-section-${id}`}
    >
      <div className="flex items-start gap-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0EEFF] text-[#6861C8]">
          <Icon size={17} strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <h2 id={`settings-${id}-title`} className="text-lg font-extrabold tracking-[-0.03em] text-[#25265A]">
            {title}
          </h2>
          <p className="mt-1 max-w-[34rem] text-xs leading-5 text-[#8587A3]">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** A single preference row backed by the shared WorkspaceSettings state. */
function ToggleRowView({ row }: { row: ToggleRow }) {
  const { settings, updateSettings } = useWorkspaceState();
  const checked = settings[row.key];

  return (
    <div className="flex items-start justify-between gap-5 py-4 first:pt-0 last:pb-0" data-testid={`setting-${row.key}`}>
      <div className="min-w-0">
        <p className="text-sm font-bold text-[#343568]">{row.label}</p>
        <p className="mt-1 text-xs leading-5 text-[#8587A3]">{row.description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={(value) => updateSettings({ [row.key]: value })}
        aria-label={row.label}
        data-testid={`switch-${row.key}`}
      />
    </div>
  );
}

/** Tracks which settings section is in view so the section nav stays honest. */
function useActiveSection(ids: SectionId[]): SectionId {
  const [active, setActive] = useState<SectionId>(ids[0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id as SectionId);
        }
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    for (const id of ids) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

function scrollToSection(id: SectionId) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Appearance ───────────────────────────────────────────────────────────────
// Reads and writes the existing shared theme store (the same one the landing
// header and auth pages use) — no second theme system, no new state.

function AppearanceSelector() {
  const { preference, setPreference } = useLandingTheme();

  return (
    <div>
      <div role="radiogroup" aria-label="Appearance" className="grid gap-3 sm:grid-cols-3">
        {APPEARANCE_OPTIONS.map(({ value, label, detail, icon: Icon }) => {
          const selected = preference === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setPreference(value)}
              className={`fluxrico-focus relative rounded-2xl border p-4 text-left transition-colors ${
                selected
                  ? 'border-[#8E88E1] bg-[#F7F6FF] shadow-[0_8px_20px_rgba(78,70,192,0.08)]'
                  : 'border-[#DADBEA] bg-white hover:border-[#B9B7E8]'
              }`}
              data-testid={`button-settings-appearance-${value}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    selected ? 'bg-[#EBE9FF] text-[#5147C2]' : 'bg-[#F1F2FD] text-[#737696]'
                  }`}
                >
                  <Icon size={15} strokeWidth={1.8} />
                </span>
                {selected && (
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-[#5147C2]"
                    aria-hidden="true"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                )}
              </div>
              <p className={`mt-3 text-sm font-extrabold ${selected ? 'text-[#343568]' : 'text-[#4B4D76]'}`}>{label}</p>
              <p className="mt-0.5 text-xs leading-5 text-[#8587A3]">{detail}</p>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-xs leading-5 text-[#888AA4]">
        Automatic follows your device. Your choice applies across Fluxrico — landing, sign-in, and your workspace.
      </p>
    </div>
  );
}

// ── Account self-service ───────────────────────────────────────────────────
// Thin clients over the real /api/account endpoints — server-validated,
// session-aware, no local fakes.

const FIELD_CLASS =
  'fluxrico-focus mt-2 w-full rounded-xl border border-[#DADBEA] bg-[#FAFAFE] px-4 py-3 text-sm font-semibold text-[#25265A] outline-none transition-colors placeholder:text-[#A0A2B7] focus:border-[#AAA5E5] focus:bg-white';

/** Display name: edits locally, saves to the server account record. */
function NameField({ name, email, onSaved }: { name: string; email: string; onSaved: (name: string) => void }) {
  const [draft, setDraft] = useState(name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const dirty = draft.trim() !== name && draft.trim().length >= 2;

  useEffect(() => {
    setDraft(name);
  }, [name]);

  const save = async () => {
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      await updateAccount({ name: draft.trim() });
      onSaved(draft.trim());
      setSaved(true);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save your name. Try again in a moment.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#8587A3]">Display name</span>
          <input
            type="text"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setSaved(false);
            }}
            maxLength={120}
            className={FIELD_CLASS}
            data-testid="input-settings-name"
          />
        </label>
        <label className="block">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#8587A3]">Email</span>
          <input
            type="email"
            value={email}
            readOnly
            disabled
            className={`${FIELD_CLASS} cursor-not-allowed opacity-70`}
            aria-describedby="settings-email-readonly"
            data-testid="input-settings-email"
          />
        </label>
      </div>
      <p id="settings-email-readonly" className="mt-2 text-xs leading-5 text-[#888AA4]">
        Your email is your sign-in identity and cannot be changed here yet.
      </p>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || busy}
          className={`${QUIET_BUTTON} ${!dirty || busy ? 'opacity-50' : ''}`}
          data-testid="button-settings-save-name"
        >
          {busy ? 'Saving…' : 'Save name'}
        </button>
        {saved && (
          <span className="text-xs font-bold text-[#3F8A67]" role="status" data-testid="settings-name-saved">
            Saved
          </span>
        )}
        {error && (
          <span className="text-xs leading-5 text-[#A05B2E]" role="alert">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}

/** Password change: server verifies the current password and rotates it. */
function PasswordChangeCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const valid =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword;

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setDone(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not change your password. Check your current password and try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#ECECF3] bg-[#FAFAFE] p-5">
      <div className="flex items-center gap-2.5">
        <KeyRound size={15} strokeWidth={1.8} className="text-[#6258D0]" aria-hidden="true" />
        <p className="text-sm font-bold text-[#343568]">Change password</p>
      </div>
      <p className="mt-1 text-xs leading-5 text-[#8587A3]">
        Changing your password signs out every other session.
      </p>
      {done ? (
        <p className="mt-4 text-sm font-bold text-[#3F8A67]" role="status" data-testid="settings-password-done">
          Password changed. Other sessions were signed out.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#8587A3]">Current password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              className={FIELD_CLASS}
              data-testid="input-settings-current-password"
            />
          </label>
          <label className="block">
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#8587A3]">New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              className={FIELD_CLASS}
              data-testid="input-settings-new-password"
            />
          </label>
          <label className="block">
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#8587A3]">Repeat new password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              className={FIELD_CLASS}
              data-testid="input-settings-confirm-password"
            />
          </label>
        </div>
      )}
      {!done && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!valid || busy}
            className={`${QUIET_BUTTON} ${!valid || busy ? 'opacity-50' : ''}`}
            data-testid="button-settings-change-password"
          >
            {busy ? 'Updating…' : 'Update password'}
          </button>
          {newPassword.length > 0 && newPassword.length < 8 && (
            <span className="text-xs text-[#A05B2E]">At least 8 characters.</span>
          )}
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <span className="text-xs text-[#A05B2E]">Passwords don’t match.</span>
          )}
          {error && (
            <span className="text-xs leading-5 text-[#A05B2E]" role="alert">
              {error}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/** Active sessions list — read from the server, with revoke-others. */
function SessionsCard() {
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revoked, setRevoked] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await listSessions();
      setSessions(result.sessions);
    } catch {
      setError('Could not load your sessions.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const revokeOthers = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await revokeOtherSessions();
      setRevoked(result.revoked);
      await load();
    } catch {
      setError('Could not sign out other sessions. Try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="rounded-2xl border border-[#ECECF3] bg-[#FAFAFE] p-5">
      <p className="text-sm font-bold text-[#343568]">Active sessions</p>
      <p className="mt-1 text-xs leading-5 text-[#8587A3]">
        Each signed-in browser gets its own session. Signing out elsewhere revokes those sessions on the server.
      </p>
      {error && (
        <p className="mt-3 text-xs leading-5 text-[#A05B2E]" role="alert">
          {error}
        </p>
      )}
      {sessions == null ? (
        <p className="mt-4 text-xs text-[#8587A3]">Loading sessions…</p>
      ) : (
        <ul className="mt-4 space-y-2.5" data-testid="settings-session-list">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex flex-col gap-1 rounded-xl border border-[#ECECF3] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#343568]">
                  {session.current ? 'This browser' : 'Another session'}
                  {session.current && (
                    <span className="ml-2 rounded-full bg-[#EBF7F1] px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-[#3F8A67]">
                      Active
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-[#8587A3]">
                  Started {formatDate(session.createdAt)} · expires {formatDate(session.expiresAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void revokeOthers()}
          disabled={busy || (sessions?.filter((s) => !s.current).length ?? 0) === 0}
          className={`${QUIET_BUTTON} ${busy ? 'opacity-60' : ''}`}
          data-testid="button-settings-revoke-sessions"
        >
          {busy ? 'Signing out…' : 'Sign out other sessions'}
        </button>
        {revoked != null && revoked > 0 && (
          <span className="text-xs font-bold text-[#3F8A67]" role="status">
            {revoked} {revoked === 1 ? 'session' : 'sessions'} signed out
          </span>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Settings() {
  const { settings, updateSettings } = useWorkspaceState();
  const { user, signOut, refreshUser } = useAuthState();
  const { subscription, status: subscriptionStatus, refresh } = useSubscriptionState();
  const [, navigate] = useLocation();
  const activeSection = useActiveSection(SECTION_IDS);
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [exportData, setExportData] = useState<AccountExport | null>(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Identity follows the signed-in user when one exists, then the workspace's
  // own settings — the same precedence Profile reads.
  const displayName = user?.name ?? settings.displayName;
  const email = user?.email ?? settings.email;

  const runExport = async () => {
    setExportError(null);
    setExportBusy(true);
    try {
      const data = await exportAccountData();
      setExportData(data);
    } catch {
      setExportError('Could not prepare your export. Try again in a moment.');
    } finally {
      setExportBusy(false);
    }
  };

  const runDelete = async () => {
    setDeleteError(null);
    setDeleteBusy(true);
    try {
      await deleteAccount();
      // Auth state will resolve to signed-out; send the user somewhere honest.
      navigate('/');
    } catch (err) {
      setDeleteError(apiErrorMessage(err, 'Could not delete your account. Try again in a moment.'));
      setDeleteBusy(false);
    }
  };

  const handleSignOut = async () => {
    // Destroys the server session and clears the cookie, then the guard
    // redirects; explicit navigation keeps the destination deterministic.
    await signOut();
    navigate('/signin');
  };

  // Real Paddle customer portal: the server creates the session for the
  // signed-in user's linked billing customer; nothing is faked client-side.
  const openBillingPortal = async () => {
    setPortalError(null);
    setPortalBusy(true);
    try {
      const result = await createBillingPortalSession();
      window.open(result.url, '_blank', 'noopener');
      await refresh();
    } catch {
      setPortalError(
        'Billing portal is unavailable right now. If you just subscribed, try again in a moment.',
      );
    } finally {
      setPortalBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1000px]">
        <PageHeader
          eyebrow="Settings / your preferences"
          title="How you want Fluxrico to work."
          description="Appearance, notifications, and preferences — set once, saved to your account."
        />

        <div className="fluxrico-rise mt-8 lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-10">
          {/* Section rail (desktop) — quick, quiet navigation between groups. */}
          <aside className="hidden lg:block" aria-label="Settings sections">
            <nav className="sticky top-[7.5rem] space-y-1">
              {SECTIONS.map(({ id, label, icon: Icon }) => {
                const active = activeSection === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => scrollToSection(id)}
                    aria-current={active ? 'true' : undefined}
                    className={`fluxrico-focus flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                      active
                        ? 'border-[#DADBF0] bg-white text-[#27285C] shadow-[0_6px_18px_rgba(44,42,123,0.05)]'
                        : 'border-transparent text-[#737696] hover:bg-white/60 hover:text-[#27285C]'
                    }`}
                    data-testid={`settings-nav-${id}`}
                  >
                    <Icon
                      size={15}
                      strokeWidth={1.8}
                      className={active ? 'text-[#6258D0]' : 'text-[#9A9CB3]'}
                      aria-hidden="true"
                    />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="min-w-0">
            {/* Section chips (mobile) — the same navigation, stacked horizontally. */}
            <nav
              className="sticky top-[5.4rem] z-10 -mx-5 mb-5 overflow-x-auto border-b border-[#E4E5F0] bg-[#F6F7FF]/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:hidden"
              aria-label="Settings sections"
            >
              <div className="flex w-max gap-2">
                {SECTIONS.map(({ id, label }) => {
                  const active = activeSection === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => scrollToSection(id)}
                      aria-current={active ? 'true' : undefined}
                      className={`fluxrico-focus inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-3.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] transition-colors ${
                        active
                          ? 'border-[#6256DB] bg-[#F0EFFF] text-[#5147C2]'
                          : 'border-[#DADBEA] bg-white text-[#5B56B5] hover:border-[#8E88E1]'
                      }`}
                      data-testid={`settings-nav-${id}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="space-y-5">
              {/* 1. Account — concise identity overview plus where editing lives. */}
              <SettingsSection
                id="account"
                icon={UserRound}
                title="Account"
                description="Who you are in this workspace. The journey itself lives in your profile."
              >
                <div className="flex flex-col gap-4 rounded-2xl border border-[#ECECF3] bg-[#FAFAFE] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D9F5FA] text-sm font-extrabold text-[#267A8D]"
                      data-testid="settings-avatar"
                    >
                      {initialsOf(displayName)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-[#25265A]" data-testid="settings-identity-name">
                        {displayName}
                      </p>
                      <p className="truncate text-xs text-[#737696]" data-testid="settings-identity-email">
                        {email}
                      </p>
                    </div>
                  </div>
                  <Link href="/profile" className={`${QUIET_BUTTON} shrink-0 justify-center`} data-testid="link-settings-profile">
                    Open profile
                  </Link>
                </div>

                {user && (
                  <div className="mt-5">
                    <NameField
                      name={user.name}
                      email={user.email}
                      onSaved={(name) => {
                        void refreshUser();
                        updateSettings({ displayName: name });
                      }}
                    />
                  </div>
                )}

                {/* Pro / trial status — mirrors the server-derived subscription state. */}
                {subscriptionStatus === 'ready' && subscription && (
                  <div
                    className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#ECECF3] bg-[#FAFAFE] p-4 sm:flex-row sm:items-center sm:justify-between"
                    data-testid="settings-pro-status"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#343568]">Fluxrico Pro</p>
                      <p className="mt-1 text-xs leading-5 text-[#8587A3]">
                        {subscription.state === 'pro' &&
                          `Active — ${subscription.plan?.interval === 'yearly' ? 'annual' : 'monthly'} plan.${
                            subscription.plan?.cancelAtPeriodEnd
                              ? ' Renews off — access continues until the current period ends.'
                              : ''
                          } Manage billing with Paddle anytime.`}
                        {subscription.state === 'trialing' &&
                          `Free trial — ${subscription.trialDaysRemaining} ${subscription.trialDaysRemaining === 1 ? 'day' : 'days'} remaining of ${subscription.trialLengthDays}.`}
                        {subscription.state === 'expired' &&
                          'Trial ended — your journey data is intact. Pro keeps your full workspace going.'}
                      </p>
                    </div>
                    {subscription.state !== 'pro' ? (
                      <Link
                        href="/pro"
                        className={`${QUIET_BUTTON} shrink-0 justify-center`}
                        data-testid="link-settings-upgrade"
                      >
                        {subscription.state === 'expired' ? 'See Pro' : 'Upgrade to Pro'}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void openBillingPortal()}
                        disabled={portalBusy}
                        className={`${QUIET_BUTTON} shrink-0 justify-center ${portalBusy ? 'opacity-60' : ''}`}
                        data-testid="button-settings-manage-billing"
                      >
                        {portalBusy ? 'Opening…' : 'Manage billing'}
                      </button>
                    )}
                    {portalError != null && (
                      <p className="text-xs leading-5 text-[#A05B2E]" role="alert" data-testid="settings-portal-error">
                        {portalError}
                      </p>
                    )}
                  </div>
                )}
              </SettingsSection>

              {/* 2. Appearance — the existing shared theme preference. */}
              <SettingsSection
                id="appearance"
                icon={SunMoon}
                title="Appearance"
                description="Choose how bright Fluxrico should feel. The default stays Automatic."
              >
                <AppearanceSelector />
              </SettingsSection>

              {/* 3. Notifications — the same shared state the feed reads. */}
              <SettingsSection
                id="notifications"
                icon={BellRing}
                title="Notifications"
                description="When Fluxrico is allowed to speak up. The same preferences live in your notifications feed."
              >
                <div className="divide-y divide-[#ECECF1]">
                  {NOTIFICATION_TOGGLES.map((row) => (
                    <ToggleRowView key={row.key} row={row} />
                  ))}
                </div>
              </SettingsSection>

              {/* 4. Preferences — intentionally small; only what already exists. */}
              <SettingsSection
                id="preferences"
                icon={SlidersHorizontal}
                title="Preferences"
                description="A few workspace-level choices that shape how the product presents itself."
              >
                <div className="divide-y divide-[#ECECF1]">
                  {PREFERENCE_TOGGLES.map((row) => (
                    <ToggleRowView key={row.key} row={row} />
                  ))}
                </div>
              </SettingsSection>

              {/* 5. Privacy & data — accurate about the real architecture. */}
              <SettingsSection
                id="privacy"
                icon={Database}
                title="Privacy & data"
                description="What Fluxrico stores and why, stated plainly."
              >
                <div className="rounded-2xl border border-[#ECECF3] bg-[#FAFAFE] p-5">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-[#5147C2]">What we store</p>
                  <ul className="mt-3 space-y-2.5">
                    {[
                      'Your account — name, email, and a salted hash of your password — lives on Fluxrico servers.',
                      'Your journey, navigator answers, roadmap progress, library, and preferences sync to your account so they survive sign-outs and follow you across devices.',
                      'Your current password is never readable — not by us, not by anyone.',
                      'Payments are handled by Paddle; card details never touch Fluxrico servers.',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-[#565980]">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B84E8]" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-[#ECECF3] bg-[#FAFAFE] p-5 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#343568]">Export your data</p>
                    <p className="mt-1 text-xs leading-5 text-[#8587A3]">
                      Download everything tied to your account — profile, journey, library, subscription state — as a JSON file.
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-1.5">
                    <button
                      type="button"
                      onClick={() => void runExport()}
                      disabled={exportBusy}
                      className={`${QUIET_BUTTON} ${exportBusy ? 'opacity-60' : ''}`}
                      data-testid="button-settings-export"
                    >
                      <Download size={14} strokeWidth={1.8} /> {exportBusy ? 'Preparing…' : 'Download export'}
                    </button>
                    {exportError && (
                      <span className="text-xs leading-5 text-[#A05B2E]" role="alert">
                        {exportError}
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-4 text-xs leading-5 text-[#888AA4]">
                  The full details — what we collect, why, and your rights — are in the{' '}
                  <Link href="/privacy" className="font-bold text-[#5147C2] underline decoration-[#C9C5F0] underline-offset-2 hover:decoration-[#5147C2]">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </SettingsSection>

              {/* 6. Security — describes the real protections and gives real controls. */}
              <SettingsSection
                id="security"
                icon={ShieldCheck}
                title="Security"
                description="How your account is protected, and what you can do from here."
              >
                <PasswordChangeCard />
                <div className="mt-5">
                  <SessionsCard />
                </div>
                <p className="mt-4 text-xs leading-5 text-[#888AA4]">
                  Sessions expire on their own after 7 days, and signing out anywhere revokes that session on the server.
                </p>
              </SettingsSection>

              {/* 7. Account actions — sign out and, with real friction, delete. */}
              <SettingsSection
                id="account-actions"
                icon={LogOut}
                title="Account actions"
                description="End your session — or, permanently, your account."
              >
                <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#ECECF3] bg-[#FAFAFE] p-5 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#343568]">Sign out of Fluxrico</p>
                    <p className="mt-1 text-xs leading-5 text-[#8587A3]">
                      Signed in as {displayName} · {email}. Your journey is saved on the server and will be here when you return.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="fluxrico-focus inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-[#E3E4F2] bg-white px-4 text-[0.64rem] font-bold uppercase tracking-[0.13em] text-[#7A6464] transition-colors hover:border-[#C98B8B] hover:text-[#A05B5B]"
                    data-testid="button-settings-signout"
                  >
                    <LogOut size={14} strokeWidth={1.8} /> Sign out
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-dashed border-[#E0C9C9] bg-white p-5">
                  <div className="flex items-center gap-2.5">
                    <Trash2 size={15} strokeWidth={1.8} className="text-[#A05B5B]" aria-hidden="true" />
                    <p className="text-sm font-bold text-[#5C4A4A]">Delete account</p>
                  </div>
                  <p className="mt-1 max-w-[38rem] text-xs leading-5 text-[#8B7A7A]">
                    Permanently removes your account, journey, library, sessions, and any active Pro subscription link. This
                    cannot be undone. Type DELETE to confirm.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <input
                      type="text"
                      value={confirmDelete}
                      onChange={(event) => setConfirmDelete(event.target.value)}
                      placeholder="Type DELETE"
                      className="fluxrico-focus w-44 rounded-xl border border-[#E0C9C9] bg-[#FAFAFE] px-4 py-2.5 text-sm font-semibold text-[#25265A] outline-none transition-colors placeholder:text-[#B3A5A5] focus:border-[#C98B8B] focus:bg-white"
                      data-testid="input-settings-delete-confirm"
                    />
                    <button
                      type="button"
                      onClick={() => void runDelete()}
                      disabled={confirmDelete !== 'DELETE' || deleteBusy}
                      className={`fluxrico-focus inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#D9A5A5] bg-white px-4 text-[0.64rem] font-bold uppercase tracking-[0.13em] text-[#A05B5B] transition-colors hover:border-[#C98B8B] hover:bg-[#FBF3F3] ${
                        confirmDelete !== 'DELETE' || deleteBusy ? 'opacity-50' : ''
                      }`}
                      data-testid="button-settings-delete-account"
                    >
                      {deleteBusy ? 'Deleting…' : 'Delete my account'}
                    </button>
                    {deleteError && (
                      <span className="text-xs leading-5 text-[#A05B2E]" role="alert">
                        {deleteError}
                      </span>
                    )}
                  </div>
                </div>
              </SettingsSection>
            </div>

            <p className="mt-8 border-t border-[#DDDEEC] pt-5 text-xs leading-5 text-[#888AA4]">
              Preferences apply instantly and are saved to your account. Fluxrico keeps settings few on purpose.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
