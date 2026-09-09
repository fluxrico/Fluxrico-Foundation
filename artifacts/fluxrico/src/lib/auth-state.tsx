import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type AuthUser = {
  name: string;
  email: string;
};

type AuthStateValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  signUp: (input: { name: string; email: string }) => void;
  signIn: (input: { email: string }) => void;
  signOut: () => void;
};

const AuthStateContext = createContext<AuthStateValue | null>(null);

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  const words = local.replace(/[._-]+/g, ' ').trim().split(' ').filter(Boolean);
  if (words.length === 0) return 'Maker';
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

/**
 * Frontend-only authentication state. It exists so the auth UX and route
 * structure are complete; a real provider can replace the three methods
 * below without touching the pages. Nothing leaves the browser and nothing
 * is persisted — consistent with the rest of the preview phase.
 */
export function AuthStateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const signUp = useCallback((input: { name: string; email: string }) => {
    setUser({ name: input.name.trim(), email: input.email.trim() });
  }, []);

  const signIn = useCallback((input: { email: string }) => {
    const email = input.email.trim().toLowerCase();
    setUser((current) => {
      if (current && current.email.toLowerCase() === email) return current;
      return { name: nameFromEmail(email), email };
    });
  }, []);

  const signOut = useCallback(() => setUser(null), []);

  const value = useMemo<AuthStateValue>(
    () => ({ user, isAuthenticated: user !== null, signUp, signIn, signOut }),
    [user, signUp, signIn, signOut],
  );

  return <AuthStateContext.Provider value={value}>{children}</AuthStateContext.Provider>;
}

export function useAuthState(): AuthStateValue {
  const value = useContext(AuthStateContext);
  if (!value) {
    throw new Error('useAuthState must be used inside AuthStateProvider');
  }
  return value;
}
