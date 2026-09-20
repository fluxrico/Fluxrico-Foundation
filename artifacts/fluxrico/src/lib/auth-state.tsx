import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, login as apiLogin, logout as apiLogout, me, register as apiRegister } from '@workspace/api-client-react';
import type { AuthUser } from '@workspace/api-client-react';

export type { AuthUser };

type SignUpInput = { name: string; email: string; password: string };
type SignUpResult = { ok: true; emailDelivered: boolean } | { ok: false; error: SignUpError };

export type SignUpError = 'email-taken' | 'invalid' | 'network' | 'unknown';

/**
 * Real authentication state, backed by the session-cookie API.
 *
 * The public interface (user, isAuthenticated, signUp, signIn, signOut) is
 * unchanged from the preview phase, so existing pages keep working. The
 * source of truth is the server session: on startup the provider checks
 * /api/auth/me and restores the user only when a valid session exists.
 * Nothing auth-related is persisted to localStorage — the HTTP-only cookie
 * carries the session, and the browser attaches it automatically.
 *
 * `status` exists so protected routes can distinguish "checking the session"
 * from "signed out" and avoid redirecting a returning user mid-check.
 */
export type AuthStatus = 'checking' | 'signed-out' | 'authenticated';

type AuthStateValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  status: AuthStatus;
  signUp: (input: SignUpInput) => Promise<SignUpResult>;
  signIn: (input: { email: string; password: string }) => Promise<{ ok: boolean; error?: SignInError }>;
  signOut: () => Promise<void>;
  /** Re-reads /api/auth/me after server-side account changes (name, etc.). */
  refreshUser: () => Promise<void>;
  /** Applies a known user object after a successful in-place update. */
  setUser: (user: AuthUser | null) => void;
};

export type SignInError = 'invalid-credentials' | 'email-not-verified' | 'network' | 'unknown';

const AuthStateContext = createContext<AuthStateValue | null>(null);

function signUpErrorFrom(error: unknown): SignUpError {
  if (error instanceof ApiError) {
    if (error.status === 409) return 'email-taken';
    if (error.status === 400) return 'invalid';
    if (error.status >= 500) return 'unknown';
    return 'invalid';
  }
  if (error instanceof TypeError) return 'network';
  return 'unknown';
}

function signInErrorFrom(error: unknown): SignInError {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'invalid-credentials';
    if (error.status === 403) return 'email-not-verified';
    if (error.status === 429) return 'unknown';
    if (error.status >= 500) return 'unknown';
    return 'invalid-credentials';
  }
  if (error instanceof TypeError) return 'network';
  return 'unknown';
}

/**
 * Clears session-specific client state on sign-out. Session-scoped providers
 * (Navigator answers, notifications, settings, library) unmount with the
 * guarded workspace tree; this covers the persisted bits that would otherwise
 * leak into a different account's session. The theme is a device preference
 * and intentionally survives.
 */
function clearSessionScopedClientState(): void {
  try {
    const theme = window.localStorage.getItem('fluxrico.theme');
    window.localStorage.clear();
    if (theme) window.localStorage.setItem('fluxrico.theme', theme);
  } catch {
    // Storage can be unavailable (private mode); nothing to clear then.
  }
}

export function AuthStateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('checking');

  // Restore the session on startup. A 401 is the normal signed-out case —
  // not an error worth surfacing.
  useEffect(() => {
    let cancelled = false;
    me()
      .then((response) => {
        if (cancelled) return;
        setUser(response.user);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setStatus('signed-out');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signUp = useCallback(async (input: SignUpInput): Promise<SignUpResult> => {
    try {
      const result = await apiRegister({
        name: input.name,
        email: input.email,
        password: input.password,
      });
      // Registration does not authenticate: the account exists but the email
      // is unverified, so no session is created yet. The user state stays
      // null; the pending-verification screen takes over from here.
      setUser(null);
      return { ok: true, emailDelivered: result.emailDelivered };
    } catch (error) {
      return { ok: false, error: signUpErrorFrom(error) };
    }
  }, []);

  const signIn = useCallback(async (input: { email: string; password: string }) => {
    try {
      const result = await apiLogin({ email: input.email, password: input.password });
      setUser(result.user);
      setStatus('authenticated');
      return { ok: true };
    } catch (error) {
      setUser(null);
      setStatus('signed-out');
      return { ok: false, error: signInErrorFrom(error) };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      // The server destroys the session row and clears the cookie.
      await apiLogout();
    } catch {
      // Signed-out is the destination state either way; never block the UI.
    }
    clearSessionScopedClientState();
    setUser(null);
    setStatus('signed-out');
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await me();
      setUser(response.user);
      setStatus('authenticated');
    } catch {
      // Session gone or transient failure: reflect signed-out rather than a
      // stale identity. The guard redirects on the next render.
      setUser(null);
      setStatus('signed-out');
    }
  }, []);

  const value = useMemo<AuthStateValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      status,
      signUp,
      signIn,
      signOut,
      refreshUser,
      setUser,
    }),
    [user, status, signUp, signIn, signOut, refreshUser],
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
