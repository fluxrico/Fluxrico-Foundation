import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

// ── Notifications ────────────────────────────────────────────────────────────

export type NotificationCategory = 'Journey' | 'Roadmap' | 'Library' | 'Product';

export type NotificationItem = {
  id: string;
  category: NotificationCategory;
  title: string;
  detail: string;
  timestamp: string; // human-readable, frontend-only
  read: boolean;
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    category: 'Journey',
    title: 'Navigator completed',
    detail: 'Your first direction is ready to shape. Shape is your current stage.',
    timestamp: 'Today, 9:12',
    read: false,
  },
  {
    id: 'n2',
    category: 'Roadmap',
    title: 'A new next move is waiting',
    detail: 'Define who this idea is for — about 10 minutes of focused work.',
    timestamp: 'Today, 8:40',
    read: false,
  },
  {
    id: 'n3',
    category: 'Library',
    title: 'Your library has room to grow',
    detail: 'Save ideas, notes, and prompts so they stop living in your head.',
    timestamp: 'Yesterday',
    read: false,
  },
  {
    id: 'n4',
    category: 'Product',
    title: 'Welcome to the Fluxrico preview',
    detail: 'You are seeing the product take shape, one phase at a time.',
    timestamp: 'Mon, 8 Apr',
    read: true,
  },
  {
    id: 'n5',
    category: 'Roadmap',
    title: 'Roadmap updated',
    detail: 'Your path now reflects the direction from Navigator.',
    timestamp: 'Mon, 8 Apr',
    read: true,
  },
];

// ── Settings ─────────────────────────────────────────────────────────────────

export type WorkspaceSettings = {
  displayName: string;
  email: string;
  emailDigest: boolean;
  productUpdates: boolean;
  journeyReminders: boolean;
  compactMode: boolean;
  reducedMotion: boolean;
};

const INITIAL_SETTINGS: WorkspaceSettings = {
  displayName: 'Maya R.',
  email: 'maya@fluxrico.app',
  emailDigest: true,
  productUpdates: true,
  journeyReminders: false,
  compactMode: false,
  reducedMotion: false,
};

// ── Context ──────────────────────────────────────────────────────────────────

type WorkspaceStateValue = {
  notifications: NotificationItem[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  settings: WorkspaceSettings;
  updateSettings: (patch: Partial<WorkspaceSettings>) => void;
};

const WorkspaceStateContext = createContext<WorkspaceStateValue | null>(null);

export function WorkspaceStateProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [settings, setSettings] = useState<WorkspaceSettings>(INITIAL_SETTINGS);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const updateSettings = useCallback((patch: Partial<WorkspaceSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const value = useMemo<WorkspaceStateValue>(
    () => ({
      notifications,
      unreadCount: notifications.filter((item) => !item.read).length,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      settings,
      updateSettings,
    }),
    [notifications, settings, markNotificationRead, markAllNotificationsRead, clearNotifications, updateSettings],
  );

  return <WorkspaceStateContext.Provider value={value}>{children}</WorkspaceStateContext.Provider>;
}

export function useWorkspaceState(): WorkspaceStateValue {
  const value = useContext(WorkspaceStateContext);
  if (!value) {
    throw new Error('useWorkspaceState must be used inside WorkspaceStateProvider');
  }
  return value;
}
