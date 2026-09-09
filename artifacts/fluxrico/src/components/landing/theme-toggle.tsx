import { Monitor, Moon, Sun } from 'lucide-react';
import { useLandingTheme } from '@/components/landing/theme';
import { cn } from '@/lib/utils';

const OPTIONS = [
  { value: 'light', label: 'Light theme', icon: Sun },
  { value: 'system', label: 'System theme', icon: Monitor },
  { value: 'dark', label: 'Dark theme', icon: Moon },
] as const;

type ThemeToggleProps = {
  className?: string;
  /** "overlay" sits on the dark hero before scroll; "surface" on page background. */
  tone?: 'surface' | 'overlay';
};

export function ThemeToggle({ className, tone = 'surface' }: ThemeToggleProps) {
  const { preference, setPreference } = useLandingTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border p-1 transition-colors',
        tone === 'overlay'
          ? 'border-white/15 bg-white/10 backdrop-blur-sm'
          : 'border-[hsl(var(--landing-line))] bg-[hsl(var(--landing-surface))]/70',
        className,
      )}
      data-testid="landing-theme-toggle"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setPreference(value)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
              active
                ? tone === 'overlay'
                  ? 'bg-white text-[#27256C]'
                  : 'bg-[hsl(var(--landing-purple-deep))] text-[hsl(var(--landing-primary-contrast))]'
                : tone === 'overlay'
                  ? 'text-white/60 hover:text-white'
                  : 'text-[hsl(var(--landing-muted))] hover:text-[hsl(var(--landing-ink))]',
            )}
            data-testid={`landing-theme-${value}`}
          >
            <Icon size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
