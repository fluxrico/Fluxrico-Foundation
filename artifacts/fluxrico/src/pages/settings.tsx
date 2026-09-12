import { useEffect, useState, type ReactNode } from 'react';
import {
  BellRing,
  Database,
  LogOut,
  Monitor,
  Moon,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  SunMoon,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { AppShell, PageHeader } from '@/components/app-shell';
import { Switch } from '@/components/ui/switch';
import { useLandingTheme } from '@/components/landing/theme';
import type { ThemePreference } from '@/components/landing/theme';
import { useAuthState } from '@/lib/auth-state';
import { useWorkspaceState } from '@/lib/workspace-state';
import type { WorkspaceSettings } from '@/lib/workspace-state';

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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Settings() {
  const { settings, updateSettings } = useWorkspaceState();
  const { user, signOut } = useAuthState();
  const [, navigate] = useLocation();
  const activeSection = useActiveSection(SECTION_IDS);

  // Identity follows the signed-in user when one exists, then the workspace's
  // own settings — the same precedence Profile reads.
  const displayName = user?.name ?? settings.displayName;
  const email = user?.email ?? settings.email;

  const handleSignOut = () => {
    signOut();
    navigate('/signin');
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1000px]">
        <PageHeader
          eyebrow="Settings / your preferences"
          title="How you want Fluxrico to work."
          description="Appearance, notifications, and preferences — set once, kept on this device."
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

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#8587A3]">Display name</span>
                    <input
                      type="text"
                      value={settings.displayName}
                      onChange={(event) => updateSettings({ displayName: event.target.value })}
                      className="fluxrico-focus mt-2 w-full rounded-xl border border-[#DADBEA] bg-[#FAFAFE] px-4 py-3 text-sm font-semibold text-[#25265A] outline-none transition-colors placeholder:text-[#A0A2B7] focus:border-[#AAA5E5] focus:bg-white"
                      data-testid="input-settings-name"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#8587A3]">Email</span>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(event) => updateSettings({ email: event.target.value })}
                      className="fluxrico-focus mt-2 w-full rounded-xl border border-[#DADBEA] bg-[#FAFAFE] px-4 py-3 text-sm font-semibold text-[#25265A] outline-none transition-colors placeholder:text-[#A0A2B7] focus:border-[#AAA5E5] focus:bg-white"
                      data-testid="input-settings-email"
                    />
                  </label>
                </div>
                <p className="mt-4 text-xs leading-5 text-[#888AA4]">
                  Details are stored locally in this preview and are not sent anywhere.
                </p>
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

              {/* 5. Privacy & data — honest about what exists today. */}
              <SettingsSection
                id="privacy"
                icon={Database}
                title="Privacy & data"
                description="What happens with your information in this phase, stated plainly."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#ECECF3] bg-[#FAFAFE] p-5">
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-[#5147C2]">Kept in this browser</p>
                    <ul className="mt-3 space-y-2.5">
                      {[
                        'Your name, email, and preferences stay on this device.',
                        'Journey, roadmap, and library content live in this session.',
                        'Nothing is sent to a server — there is no server connection yet.',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-[#565980]">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B84E8]" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-dashed border-[#D5D6E8] bg-white p-5">
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-[#8587A3]">Arrives with accounts</p>
                    <ul className="mt-3 space-y-2.5">
                      {[
                        'Export of your journey, roadmap, and library.',
                        'Account deletion with a real backend.',
                        'Sync across devices.',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-[#8587A3]">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C4C6DC]" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-5 text-[#888AA4]">
                  Because Fluxrico is frontend-only right now, data controls stop at honest limits rather than
                  pretending to do more.
                </p>
              </SettingsSection>

              {/* 6. Security — restrained and future-ready, nothing faked. */}
              <SettingsSection
                id="security"
                icon={ShieldCheck}
                title="Security"
                description="There is nothing to protect yet — and that is worth saying clearly."
              >
                <div className="rounded-2xl border border-[#ECECF3] bg-[#FAFAFE] p-5">
                  <p className="max-w-[38rem] text-sm leading-6 text-[#565980]">
                    This preview runs entirely in your browser. There are no server sessions, no stored passwords, and
                    no connected services — so there is no security surface to manage today.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#ECECF1] pt-4">
                    <span className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-[#8587A3]">Future-ready</span>
                    {['Password sign-in', 'Two-factor authentication', 'Session management'].map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center rounded-full bg-[#F1F2FD] px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-[#8B8DDA]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="mt-4 text-xs leading-5 text-[#888AA4]">
                  These arrive with real accounts — until then, no action is needed here.
                </p>
              </SettingsSection>

              {/* 7. Account actions — separated from preferences, restrained. */}
              <SettingsSection
                id="account-actions"
                icon={LogOut}
                title="Account actions"
                description="Ends your session and returns you to sign in. Nothing else is affected."
              >
                <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#ECECF3] bg-[#FAFAFE] p-5 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#343568]">Sign out of Fluxrico</p>
                    <p className="mt-1 text-xs leading-5 text-[#8587A3]">
                      Signed in as {displayName} · {email}. Account deletion and data tools arrive with real accounts.
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
              </SettingsSection>
            </div>

            <p className="mt-8 border-t border-[#DDDEEC] pt-5 text-xs leading-5 text-[#888AA4]">
              Preferences apply instantly and stay on this device. Fluxrico keeps settings few on purpose.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
