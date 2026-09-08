import { AppShell, PageHeader } from '@/components/app-shell';
import { Switch } from '@/components/ui/switch';
import { useWorkspaceState } from '@/lib/workspace-state';
import type { WorkspaceSettings } from '@/lib/workspace-state';

type BooleanSettingKey = {
  [K in keyof WorkspaceSettings]: WorkspaceSettings[K] extends boolean ? K : never;
}[keyof WorkspaceSettings];

type ToggleRow = {
  key: BooleanSettingKey;
  label: string;
  description: string;
};

const JOURNEY_TOGGLES: ToggleRow[] = [
  { key: 'emailDigest', label: 'Weekly email digest', description: 'A short summary of your journey, once a week.' },
  { key: 'productUpdates', label: 'Product updates', description: 'Notes when a new Fluxrico phase ships.' },
  { key: 'journeyReminders', label: 'Journey reminders', description: 'A gentle nudge when your next move has been waiting.' },
];

const WORKSPACE_TOGGLES: ToggleRow[] = [
  { key: 'compactMode', label: 'Compact workspace', description: 'Tighten card spacing across your workspace.' },
  { key: 'reducedMotion', label: 'Reduced motion', description: 'Let your system’s motion preference lead the interface.' },
];

function SettingsToggle({ row }: { row: ToggleRow }) {
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

export default function Settings() {
  const { settings, updateSettings } = useWorkspaceState();

  return (
    <AppShell>
      <div className="mx-auto max-w-[860px]">
        <PageHeader
          eyebrow="Settings / your preferences"
          title="Keep Fluxrico quiet and yours."
          description="A few preferences for how the workspace presents itself and when it speaks up."
        />

        <section className="mt-8 rounded-[1.65rem] border border-[#DADBF0] bg-white p-6 shadow-[0_8px_28px_rgba(44,42,123,0.04)] sm:p-8" aria-labelledby="settings-account-title" data-testid="card-settings-account">
          <h2 id="settings-account-title" className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-[#6258D0]">Account</h2>
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
          <p className="mt-4 text-xs leading-5 text-[#888AA4]">Details are stored locally in this preview and are not sent anywhere.</p>
        </section>

        <section className="mt-5 rounded-[1.65rem] border border-[#DADBF0] bg-white p-6 shadow-[0_8px_28px_rgba(44,42,123,0.04)] sm:p-8" aria-labelledby="settings-notifications-title" data-testid="card-settings-notifications">
          <h2 id="settings-notifications-title" className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-[#6258D0]">Notifications</h2>
          <div className="mt-5 divide-y divide-[#ECECF1]">
            {JOURNEY_TOGGLES.map((row) => <SettingsToggle key={row.key} row={row} />)}
          </div>
        </section>

        <section className="mt-5 rounded-[1.65rem] border border-[#DADBF0] bg-white p-6 shadow-[0_8px_28px_rgba(44,42,123,0.04)] sm:p-8" aria-labelledby="settings-workspace-title" data-testid="card-settings-workspace">
          <h2 id="settings-workspace-title" className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-[#6258D0]">Workspace</h2>
          <div className="mt-5 divide-y divide-[#ECECF1]">
            {WORKSPACE_TOGGLES.map((row) => <SettingsToggle key={row.key} row={row} />)}
          </div>
        </section>

        <p className="mt-8 border-t border-[#DDDEEC] pt-5 text-xs leading-5 text-[#888AA4]">
          Signed in as {settings.displayName} · {settings.email}. Account management arrives in a later phase.
        </p>
      </div>
    </AppShell>
  );
}
