import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type NavigatorAnswers = {
  goal?: string;
  current?: string;
  strength?: string;
  path?: string;
};

type NavigatorStateValue = {
  answers: NavigatorAnswers;
  setAnswer: (key: keyof NavigatorAnswers, value: string) => void;
  clearAnswers: () => void;
};

const NavigatorStateContext = createContext<NavigatorStateValue | null>(null);

export function NavigatorStateProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<NavigatorAnswers>({});
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

export function useNavigatorState() {
  const value = useContext(NavigatorStateContext);
  if (!value) {
    throw new Error('useNavigatorState must be used inside NavigatorStateProvider');
  }
  return value;
}