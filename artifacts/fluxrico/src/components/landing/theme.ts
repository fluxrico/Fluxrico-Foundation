import { useCallback, useSyncExternalStore } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'fluxrico.theme';

const PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

function isThemePreference(value: string | null): value is ThemePreference {
  return value !== null && (PREFERENCES as readonly string[]).includes(value);
}

function readStoredPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== 'system') return preference;
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

// Module-level store so every consumer of useLandingTheme shares one state —
// the toggle in the header and the root class on the page stay in sync.
let preference: ThemePreference = typeof window === 'undefined' ? 'system' : readStoredPreference();
let resolved: ResolvedTheme = typeof window === 'undefined' ? 'light' : resolveTheme(preference);

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Track OS scheme changes only while the preference is "system".
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (media) => {
    if (preference === 'system') {
      resolved = media.matches ? 'dark' : 'light';
      emit();
    }
  });
}

/**
 * Theme for the landing page only. The resolved class is applied to the
 * landing root element — never to <html> — so the internal product pages
 * keep their authored light presentation regardless of this preference.
 */
export function useLandingTheme() {
  const currentPreference = useSyncExternalStore(subscribe, () => preference);
  const currentResolved = useSyncExternalStore(subscribe, () => resolved);

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the theme still applies for this session.
    }
    preference = next;
    resolved = resolveTheme(next);
    emit();
  }, []);

  return { preference: currentPreference, resolved: currentResolved, setPreference };
}
