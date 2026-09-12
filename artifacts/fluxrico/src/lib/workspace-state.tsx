import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ROADMAP_STAGE_GUIDES,
  getStageIndex,
  type JourneyActivity,
  type RoadmapStageName,
} from '@/lib/journey';

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
  /** Starter notification shipped with the preview — not a real user event. */
  sample?: boolean;
};

// Guidance copy reads from the shared stage guide so the notification and the
// Roadmap can never drift apart. No journey definitions are duplicated here.
const shapeGuide = ROADMAP_STAGE_GUIDES[getStageIndex('Shape')];

// Starter notifications: they show the shape of the feed for a first visit and
// are marked `sample: true` so the UI can label them as examples. Real events
// recorded in this session are never marked sample.
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
    sample: true,
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
    sample: true,
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
    sample: true,
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
    sample: true,
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
    sample: true,
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
    sample: true,
  },
];

// ── Real session journey events ──────────────────────────────────────────────
// The workspace is session-local, so activity is recorded here as the user
// actually acts. One event per meaningful action, keyed so the same action can
// never append twice (React re-renders, StrictMode double-invocations, and
// repeated clicks all land on the same key and are ignored after the first).

/** The existing workspace actions that are meaningful enough to record. */
export type JourneyActivityEventKey =
  | 'navigator-completed'
  | 'journey-started'
  | 'next-move-started'
  | 'library-piece-added'
  | 'library-piece-saved';

/**
 * Stage completion: the only real stage-completion action in the product is
 * completing Navigator, which is exactly what the START guide defines as
 * done — one starting point identified and written down. Mapping that event
 * to 'Start' here keeps completion honest and event-based; reaching a stage
 * never completes it, and no synthetic completion events are invented.
 */
const STAGE_COMPLETION_BY_EVENT: Partial<Record<JourneyActivityEventKey, RoadmapStageName>> = {
  'navigator-completed': 'Start',
};

/** A real event recorded this session, with the moment it happened. */
type SessionJourneyEvent = {
  key: JourneyActivityEventKey;
  stamp: string;
};

/**
 * One definition per event: what Recent Activity shows (the activity fields)
 * and what the matching notification says, when the event genuinely deserves
 * one (the notification fields). Both read from this single source so the
 * Dashboard and the Notifications feed can never tell different stories.
 */
type JourneyActivityEvent = {
  activity: {
    id: string;
    label: string;
    detail: string;
  };
  notification?: {
    category: NotificationCategory;
    title: string;
    detail: string;
    important?: boolean;
    href?: string;
    actionLabel?: string;
  };
};

const SESSION_JOURNEY_EVENTS: Record<JourneyActivityEventKey, JourneyActivityEvent> = {
  'navigator-completed': {
    activity: {
      id: 'event-navigator-completed',
      label: 'Navigator completed',
      detail: 'Your answers are in — your direction is ready to shape.',
    },
    notification: {
      category: 'Journey',
      title: 'Navigator completed',
      detail: 'Your first direction is ready to shape — your roadmap now reflects it.',
      important: true,
      href: '/roadmap?stage=Shape',
      actionLabel: 'Open your roadmap',
    },
  },
  'journey-started': {
    activity: {
      id: 'event-journey-started',
      label: 'Journey started',
      detail: 'You entered the workspace and picked up your direction.',
    },
  },
  'next-move-started': {
    activity: {
      id: 'event-next-move-started',
      label: 'Next move started',
      detail: 'You opened your current next move in the roadmap.',
    },
    notification: {
      category: 'Roadmap',
      title: 'Next move opened',
      detail: 'You started your current next move. Continue in the roadmap whenever you are ready.',
      href: '/roadmap',
      actionLabel: 'Continue in roadmap',
    },
  },
  'library-piece-added': {
    activity: {
      id: 'event-library-piece-added',
      label: 'Piece added to Library',
      detail: 'A new piece now lives in your library.',
    },
    notification: {
      category: 'Library',
      title: 'New piece in your library',
      detail: 'Your piece was saved to the Library for this session — keep the pieces that matter most starred.',
      href: '/library',
      actionLabel: 'Open library',
    },
  },
  'library-piece-saved': {
    activity: {
      id: 'event-library-piece-saved',
      label: 'Piece saved',
      detail: 'A library piece was marked as important and collected under Saved.',
    },
  },
};

/** "Today, 14:32"-style human timestamp for events recorded this session. */
function nowStamp(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `Today, ${hours}:${minutes}`;
}

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

// The two presentation toggles persist locally, so the workspace keeps its
// density and motion choices across reloads. They stay part of the existing
// WorkspaceSettings store — no second settings system.
const PRESENTATION_STORAGE_KEY = 'fluxrico.settings.presentation';

function readStoredPresentation(): Partial<WorkspaceSettings> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PRESENTATION_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const source = parsed as Record<string, unknown>;
    const patch: Partial<WorkspaceSettings> = {};
    for (const key of ['compactMode', 'reducedMotion'] as const) {
      if (typeof source[key] === 'boolean') patch[key] = source[key];
    }
    return patch;
  } catch {
    return {};
  }
}

function persistPresentation(settings: WorkspaceSettings) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      PRESENTATION_STORAGE_KEY,
      JSON.stringify({ compactMode: settings.compactMode, reducedMotion: settings.reducedMotion }),
    );
  } catch {
    // Storage can be unavailable (private mode); the setting still applies for this session.
  }
}

const INITIAL_PRESENTATION = readStoredPresentation();

// ── Context ──────────────────────────────────────────────────────────────────

type WorkspaceStateValue = {
  notifications: NotificationItem[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  settings: WorkspaceSettings;
  updateSettings: (patch: Partial<WorkspaceSettings>) => void;
  /** Real activity recorded this session, newest first — never sample. */
  realActivity: JourneyActivity[];
  /** True once the user has generated at least one real event this session. */
  hasRealActivity: boolean;
  /**
   * Stages completed through real work this session — the single source of
   * truth for progress. Empty until a real stage-completion event exists.
   */
  completedStages: RoadmapStageName[];
  /** Convenience wrappers so call sites stay declarative. */
  recordNavigatorCompleted: () => void;
  recordJourneyStarted: () => void;
  recordNextMoveStarted: () => void;
  recordLibraryPieceAdded: () => void;
  recordLibraryPieceSaved: () => void;
};

const WorkspaceStateContext = createContext<WorkspaceStateValue | null>(null);

export function WorkspaceStateProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [settings, setSettings] = useState<WorkspaceSettings>({
    ...INITIAL_SETTINGS,
    ...INITIAL_PRESENTATION,
  });
  const [sessionEvents, setSessionEvents] = useState<SessionJourneyEvent[]>([]);
  // Mirrors sessionEvents for the idempotency guard, so recording never
  // depends on render timing and state updaters stay pure.
  const sessionEventsRef = useRef<SessionJourneyEvent[]>([]);

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
    setSettings((current) => {
      const next = { ...current, ...patch };
      persistPresentation(next);
      return next;
    });
  }, []);

  // Appends a real (non-sample) notification and keeps the feed bounded. The
  // newest notification leads, matching how the starter feed is ordered.
  const appendNotification = useCallback(
    (notification: NonNullable<JourneyActivityEvent['notification']>, eventId: string) => {
      setNotifications((current) => {
        const next = [
          {
            id: `event-${eventId}`,
            timestamp: nowStamp(),
            read: false,
            ...notification,
          },
          ...current,
        ];
        // Bound the feed so one long session cannot turn into noise.
        return next.length > 60 ? next.slice(0, 60) : next;
      });
    },
    [],
  );

  // The recorder: idempotent by event key. The same action can only exist
  // once per session, no matter how often the handler fires. State updaters
  // stay pure — the guard runs against the ref before any setState.
  const recordJourneyEvent = useCallback(
    (key: JourneyActivityEventKey) => {
      if (sessionEventsRef.current.some((item) => item.key === key)) return;
      const next = [...sessionEventsRef.current, { key, stamp: nowStamp() }];
      sessionEventsRef.current = next;
      setSessionEvents(next);
      const event = SESSION_JOURNEY_EVENTS[key];
      if (event.notification) appendNotification(event.notification, key);
    },
    [appendNotification],
  );

  // The real, user-generated counterpart to JOURNEY.recentActivity: same
  // JourneyActivity shape, newest first, so the Dashboard can merge the two
  // lists without any transformation of its own.
  const realActivity = useMemo<JourneyActivity[]>(
    () =>
      [...sessionEvents]
        .reverse()
        .map(({ key, stamp }) => {
          const { activity } = SESSION_JOURNEY_EVENTS[key];
          return { ...activity, date: stamp };
        }),
    [sessionEvents],
  );

  // The single source of truth for stage completion: every real event this
  // session is mapped through STAGE_COMPLETION_BY_EVENT, and a stage appears
  // only when that real work actually happened. Derived state, no second
  // store to keep in sync, and navigation can never complete a stage.
  const completedStages = useMemo<RoadmapStageName[]>(
    () =>
      [...new Set(
        sessionEvents
          .map(({ key }) => STAGE_COMPLETION_BY_EVENT[key])
          .filter((stage): stage is RoadmapStageName => stage !== undefined),
      )],
    [sessionEvents],
  );

  const recordNavigatorCompleted = useCallback(
    () => recordJourneyEvent('navigator-completed'),
    [recordJourneyEvent],
  );
  const recordJourneyStarted = useCallback(
    () => recordJourneyEvent('journey-started'),
    [recordJourneyEvent],
  );
  const recordNextMoveStarted = useCallback(
    () => recordJourneyEvent('next-move-started'),
    [recordJourneyEvent],
  );
  const recordLibraryPieceAdded = useCallback(
    () => recordJourneyEvent('library-piece-added'),
    [recordJourneyEvent],
  );
  const recordLibraryPieceSaved = useCallback(
    () => recordJourneyEvent('library-piece-saved'),
    [recordJourneyEvent],
  );

  const value = useMemo<WorkspaceStateValue>(
    () => ({
      notifications,
      unreadCount: notifications.filter((item) => !item.read).length,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      settings,
      updateSettings,
      realActivity,
      hasRealActivity: sessionEvents.length > 0,
      completedStages,
      recordNavigatorCompleted,
      recordJourneyStarted,
      recordNextMoveStarted,
      recordLibraryPieceAdded,
      recordLibraryPieceSaved,
    }),
    [
      notifications,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      settings,
      updateSettings,
      sessionEvents,
      realActivity,
      completedStages,
      recordNavigatorCompleted,
      recordJourneyStarted,
      recordNextMoveStarted,
      recordLibraryPieceAdded,
      recordLibraryPieceSaved,
    ],
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
