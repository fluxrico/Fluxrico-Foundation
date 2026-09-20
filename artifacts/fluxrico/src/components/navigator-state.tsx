import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { NavigatorAnswers } from '@/lib/journey';

export type { NavigatorAnswers };

type NavigatorStateValue = {
  answers: NavigatorAnswers;
  setAnswer: (key: keyof NavigatorAnswers, value: string) => void;
  clearAnswers: () => void;
};

const NavigatorStateContext = createContext<NavigatorStateValue | null>(null);

function NavigatorStateProviderInner({
  children,
  hydration,
}: {
  children: ReactNode;
  hydration: NavigatorAnswers | null;
}) {
  const [answers, setAnswers] = useState<NavigatorAnswers>(() => hydration ?? {});
  const value = useMemo(
    () => ({
      answers,
      setAnswer: (key: keyof NavigatorAnswers, value: string) => {
        setAnswers((current) => ({ ...current, [key]: value }));
      },
      clearAnswers: () => setAnswers({}),
    }),
    [answers],
  );

  return <NavigatorStateContext.Provider value={value}>{children}</NavigatorStateContext.Provider>;
}

/**
 * Public provider. `hydration` seeds the saved Navigator answers for the
 * signed-in user (null before the journey payload arrives or when none were
 * saved). The inner provider remounts on hydration transition so answers
 * seed exactly once — the answers stay in this one state system and are
 * persisted as part of the workspace journey snapshot.
 */
export function NavigatorStateProvider({
  children,
  hydration = null,
}: {
  children: ReactNode;
  hydration?: NavigatorAnswers | null;
}) {
  const key = hydration === null ? 'pending' : 'ready';
  return (
    <NavigatorStateProviderInner key={key} hydration={hydration}>
      {children}
    </NavigatorStateProviderInner>
  );
}

export function useNavigatorState() {
  const value = useContext(NavigatorStateContext);
  if (!value) {
    throw new Error('useNavigatorState must be used inside NavigatorStateProvider');
  }
  return value;
}
