import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ROADMAP_STAGE_GUIDES, getStageIndex } from '@/lib/journey';

// ── Notifications ────────────────────────────────────────────────────────────
// Notifications exist only for meaningful journey events. Each item answers
// three questions: what happened (title), why it matters (detail), and what
// you can do next (quick action via href + actionLabel).

export type NotificationCategory = 'Journey' | 'Roadmap' | 'Guidance' | 'Library' | 'Product';

export type NotificationItem = {
  id: string;
  category: NotificationCategory;
  title: string;
  detail: string;
  timestamp: string; // human-readable, frontend-only
  read: boolean;
  /** Journey-critical moments are visually prioritized in the feed. */
  important?: boolean;
  /** Where the quick action leads, when this notification has one. */
  href?: string;
  /** Label for the quick action; rendered only alongside href. */
  actionLabel?: string;
};

// Guidance copy reads from the shared stage guide so the notification and the
// Roadmap can never drift apart. No journey definitions are duplicated here.
const shapeGuide = ROADMAP_STAGE_GUIDES[getStageIndex('Shape')];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    category: 'Journey',
    title: 'Navigator completed',
    detail: 'Your first direction is ready to shape — Shape is now your current stage, and your roadmap reflects it.',
    timestamp: 'Today, 9:12',
    read: false,
    important: true,
    href: '/roadmap?stage=Shape',
    actionLabel: 'Open your roadmap',
  },
  {
    id: 'n2',
    category: 'Roadmap',
    title: 'A new next move is waiting',
    detail: 'Define who this idea is for — about ten minutes of focused work that makes every later decision easier.',
    timestamp: 'Today, 8:40',
    read: false,
    href: '/roadmap?stage=Shape',
    actionLabel: 'Open Shape',
  },
  {
    id: 'n6',
    category: 'Guidance',
    title: 'Guidance for Shape is ready',
    detail: shapeGuide.guidance,
    timestamp: 'Yesterday',
    read: false,
    href: '/roadmap?stage=Shape',
    actionLabel: 'Read the guidance',
  },
  {
    id: 'n3',
    category: 'Library',
    title: 'Your library has room to grow',
    detail: 'Save ideas, notes, and prompts so they stop living in your head — pieces you keep become pieces you can use.',
    timestamp: 'Yesterday',
    read: false,
    href: '/library',
    actionLabel: 'Open library',
  },
  {
    id: 'n5',
    category: 'Roadmap',
    title: 'Roadmap updated',
    detail: 'Your path now reflects the direction from Navigator — six stages, one clear next move.',
    timestamp: 'Mon, 8 Apr',
    read: true,
    href: '/roadmap',
    actionLabel: 'View roadmap',
  },
  {
    id: 'n4',
    category: 'Product',
    title: 'Welcome to the Fluxrico preview',
    detail: 'You are seeing the product take shape, one phase at a time. Navigator is the best place to begin.',
    timestamp: 'Mon, 8 Apr',
    read: true,
    href: '/navigator',
    actionLabel: 'Take Navigator',
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
