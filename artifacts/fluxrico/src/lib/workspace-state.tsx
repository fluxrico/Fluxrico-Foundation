import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  LIBRARY_ENTRIES,
  type JourneyActivity,
  type LibraryEntry,
  type NavigatorAnswers,
  type RoadmapStageName,
} from '@/lib/journey';
import { saveJourney } from '@workspace/api-client-react';
import type { JourneySaveRequest } from '@workspace/api-client-react';

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

// Starter notifications: they show the shape of the feed for a first visit and
// are marked `sample: true` so the UI can label them as examples. Real events
// are derived from the event log and are never marked sample.
const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
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
    detail: 'Stage-specific guidance is waiting on your roadmap.',
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

// ── Real journey events ──────────────────────────────────────────────────────
// The workspace records one event per meaningful action, keyed so the same
// action can never append twice (React re-renders, StrictMode double-
// invocations, and repeated clicks all land on the same key and are ignored
// after the first). The event log is part of the persisted journey payload,
// so the record of what happened survives refreshes and sign-outs.

/** The workspace actions that are meaningful enough to record. */
export type JourneyActivityEventKey =
  | 'navigator-completed'
  | 'journey-started'
  | 'next-move-started'
  | 'stage-completed'
  | 'library-piece-added'
  | 'library-piece-saved';

/**
 * Stage completion: events map to the stage their real work finished.
 * 'navigator-completed' is what the START guide defines as done — one
 * starting point identified and written down. 'stage-completed' carries the
 * finished stage from the Roadmap's explicit user action. Reaching a stage
 * never completes it, and no synthetic completion events are invented.
 */
const STAGE_COMPLETION_BY_EVENT: Partial<Record<JourneyActivityEventKey, RoadmapStageName>> = {
  'navigator-completed': 'Start',
};

/** A real journey event, with the moment it happened. */
export type SessionJourneyEvent = {
  key: JourneyActivityEventKey;
  stamp: string;
  /** The stage a 'stage-completed' event finished; absent on other events. */
  stage?: RoadmapStageName;
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
  'stage-completed': {
    activity: {
      id: 'event-stage-completed',
      label: 'Stage completed',
      detail: 'The stage definition of done was met — the next stage is waiting.',
    },
    notification: {
      category: 'Roadmap',
      title: 'Stage completed',
      detail: 'A stage met its definition of done — the next stage is waiting with its own next move.',
      href: '/roadmap',
      actionLabel: 'Open your roadmap',
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
      detail: 'Your piece was saved to the Library — keep the pieces that matter most starred.',
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

/** "Today, 14:32"-style human timestamp for events. */
function nowStamp(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `Today, ${hours}:${minutes}`;
}

/** Notification id for a stage-completion event (per stage, not global). */
function notificationIdForEvent(event: SessionJourneyEvent): string {
  return event.key === 'stage-completed' && event.stage ? `event-stage-${event.stage}` : `event-${event.key}`;
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

// The two presentation toggles also persist locally, so the workspace keeps
// its density and motion choices instantly across reloads. They remain part
// of the existing WorkspaceSettings store — no second settings system.
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

// ── Hydration payload ────────────────────────────────────────────────────────

export type WorkspaceHydration = {
  navigatorAnswers?: Record<string, string> | null;
  completedStages?: string[] | null;
  libraryEntries?: LibraryEntry[] | null;
  events?: SessionJourneyEvent[] | null;
  notificationReadIds?: string[] | null;
  clearedNotifications?: boolean | null;
  settings?: Partial<WorkspaceSettings> | null;
  hasStartedNextMove?: boolean | null;
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
  /** Real journey activity, newest first — never sample. */
  realActivity: JourneyActivity[];
  /** True once the user has generated at least one real event. */
  hasRealActivity: boolean;
  /**
   * Stages completed through real work — the single source of truth for
   * progress. Hydrated from the server and extended by real events.
   */
  completedStages: RoadmapStageName[];
  /**
   * Library pieces: the starter sample entries plus every piece the user
   * adds. The single source of truth for the Library page.
   */
  libraryEntries: LibraryEntry[];
  addLibraryEntry: (entry: LibraryEntry) => void;
  toggleLibraryEntrySaved: (id: string) => void;
  removeLibraryEntry: (id: string) => void;
  /** True once the current next move has been started. */
  hasStartedNextMove: boolean;
  /** Convenience wrappers so call sites stay declarative. */
  recordNavigatorCompleted: () => void;
  recordJourneyStarted: () => void;
  recordNextMoveStarted: () => void;
  /** Marks a roadmap stage genuinely completed through the user's action. */
  recordStageCompleted: (stage: RoadmapStageName) => void;
  /** True while the workspace snapshot is being saved to the server. */
  isSaving: boolean;
  /** Set when the latest save failed (never blocks the UI; retried on next change). */
  saveFailed: boolean;
};

const WorkspaceStateContext = createContext<WorkspaceStateValue | null>(null);

function WorkspaceStateProviderInner({
  children,
  hydration,
  navigatorAnswers: liveAnswers,
}: {
  children: ReactNode;
  hydration: WorkspaceHydration | null;
  /** The live Navigator answers from the single shared navigator state. */
  navigatorAnswers: NavigatorAnswers;
}) {
  // Whether hydration has been applied. When null, the workspace starts from
  // its defaults; when set, the saved payload seeds every slice of state.
  const [hydrated] = useState<boolean>(() => hydration !== null);

  // Real journey events, seeded from the persisted log.
  const [sessionEvents, setSessionEvents] = useState<SessionJourneyEvent[]>(() =>
    Array.isArray(hydration?.events) ? (hydration!.events as SessionJourneyEvent[]) : [],
  );
  const sessionEventsRef = useRef<SessionJourneyEvent[]>(sessionEvents);
  useEffect(() => {
    sessionEventsRef.current = sessionEvents;
  }, [sessionEvents]);

  // Read-state for starter notifications, restored from the saved payload.
  const hydratedReadIds = useMemo(() => new Set(hydration?.notificationReadIds ?? []), [hydration]);
  const clearedNotifications = hydration?.clearedNotifications === true;

  // Read-state changes (mark read / mark all read / clear) are tracked as
  // plain state and merged over the sample set + derived event notifications.
  const [extraReadIds, setExtraReadIds] = useState<Set<string>>(() => new Set());
  const [allRead, setAllRead] = useState(false);
  const [cleared, setCleared] = useState(clearedNotifications);
  void hydrated;

  const [settings, setSettings] = useState<WorkspaceSettings>(() => ({
    ...INITIAL_SETTINGS,
    ...INITIAL_PRESENTATION,
    ...(hydration?.settings ?? {}),
  }));

  // Library pieces, seeded from the saved list (falling back to the starter
  // samples before the first save).
  const [libraryEntries, setLibraryEntries] = useState<LibraryEntry[]>(() => {
    const saved = Array.isArray(hydration?.libraryEntries) ? hydration!.libraryEntries! : null;
    if (!saved || saved.length === 0) return [...LIBRARY_ENTRIES];
    return saved;
  });
  const libraryEntriesRef = useRef<LibraryEntry[]>(libraryEntries);
  useEffect(() => {
    libraryEntriesRef.current = libraryEntries;
  }, [libraryEntries]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  // Events already in the hydrated log were seen when they fired. Events
  // recorded after mount are new: they stay unread until marked.
  const hydratedEventCount = useRef(Array.isArray(hydration?.events) ? hydration!.events!.length : 0);

  // ── Derived notifications ──────────────────────────────────────────────────
  // One derivation, one order: real event notifications first (newest
  // first), then the starter samples (with their restored read state),
  // unless the user cleared the feed.

  const realNotifications = useMemo<NotificationItem[]>(() => {
    const out: NotificationItem[] = [];
    const total = sessionEvents.length;
    sessionEvents.forEach((event, index) => {
      const def = SESSION_JOURNEY_EVENTS[event.key];
      if (!def.notification) return;
      const id = notificationIdForEvent(event);
      out.push({
        id,
        timestamp: event.stamp,
        // Hydrated events were seen; events recorded after mount are new.
        read: index < hydratedEventCount.current || extraReadIds.has(id) || allRead,
        ...def.notification,
        ...(event.key === 'stage-completed' && event.stage
          ? {
              title: `${event.stage} completed`,
              detail: `You met ${event.stage}'s definition of done — the stage now counts as complete. The next stage is waiting with its own next move.`,
            }
          : {}),
      });
    });
    return out.reverse();
  }, [sessionEvents, extraReadIds, allRead]);

  const sampleNotifications = useMemo<NotificationItem[]>(
    () =>
      cleared
        ? []
        : SAMPLE_NOTIFICATIONS.map((item) => ({
            ...item,
            read: allRead || hydratedReadIds.has(item.id) || extraReadIds.has(item.id),
          })),
    [cleared, allRead, hydratedReadIds, extraReadIds],
  );

  const notifications = useMemo<NotificationItem[]>(
    () => [...realNotifications, ...sampleNotifications],
    [realNotifications, sampleNotifications],
  );

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const markNotificationRead = useCallback((id: string) => {
    setExtraReadIds((current) => new Set(current).add(id));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setAllRead(true);
  }, []);

  const clearNotifications = useCallback(() => {
    setCleared(true);
  }, []);

  const updateSettings = useCallback((patch: Partial<WorkspaceSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      persistPresentation(next);
      return next;
    });
  }, []);

  // The recorder: idempotent by event key. The same action can only exist
  // once, no matter how often the handler fires. State updaters stay pure —
  // the guard runs against the ref before any setState.
  const recordJourneyEvent = useCallback((key: JourneyActivityEventKey) => {
    if (sessionEventsRef.current.some((item) => item.key === key)) return;
    const next = [...sessionEventsRef.current, { key, stamp: nowStamp() }];
    sessionEventsRef.current = next;
    setSessionEvents(next);
  }, []);

  /**
   * Marks a roadmap stage as genuinely completed — the user's explicit
   * confirmation that the stage's definition of done (from the shared stage
   * guide) is met. A stage already completed by a real event is never
   * recorded twice.
   */
  const recordStageCompleted = useCallback((stage: RoadmapStageName) => {
    const alreadyCompleted = sessionEventsRef.current.some(
      (item) =>
        STAGE_COMPLETION_BY_EVENT[item.key] === stage || (item.key === 'stage-completed' && item.stage === stage),
    );
    if (alreadyCompleted) return;
    const next: SessionJourneyEvent[] = [
      ...sessionEventsRef.current,
      { key: 'stage-completed', stamp: nowStamp(), stage },
    ];
    sessionEventsRef.current = next;
    setSessionEvents(next);
  }, []);

  // The real, user-generated activity feed: same JourneyActivity shape,
  // newest first, so the Dashboard can merge it with the starter rows without
  // any transformation of its own.
  const realActivity = useMemo<JourneyActivity[]>(
    () =>
      [...sessionEvents]
        .reverse()
        .map(({ key, stamp, stage }) => {
          const { activity } = SESSION_JOURNEY_EVENTS[key];
          if (key === 'stage-completed' && stage) {
            return {
              id: `event-stage-completed-${stage.toLowerCase()}`,
              label: `${stage} completed`,
              detail: `You met ${stage}'s definition of done — the stage is complete.`,
              date: stamp,
            };
          }
          return { ...activity, date: stamp };
        }),
    [sessionEvents],
  );

  // The single source of truth for stage completion: every real event is
  // mapped through STAGE_COMPLETION_BY_EVENT. Hydrated events from earlier
  // sessions flow through the exact same mapping — there is no second
  // completion system.
  const completedStages = useMemo<RoadmapStageName[]>(() => {
    const stages = new Set<RoadmapStageName>();
    for (const { key, stage } of sessionEvents) {
      const mapped = STAGE_COMPLETION_BY_EVENT[key];
      if (mapped) stages.add(mapped);
      else if (key === 'stage-completed' && stage) stages.add(stage);
    }
    return [...stages];
  }, [sessionEvents]);

  const recordNavigatorCompleted = useCallback(() => recordJourneyEvent('navigator-completed'), [recordJourneyEvent]);
  const recordJourneyStarted = useCallback(() => recordJourneyEvent('journey-started'), [recordJourneyEvent]);
  const recordNextMoveStarted = useCallback(() => recordJourneyEvent('next-move-started'), [recordJourneyEvent]);

  // ── Library pieces ────────────────────────────────────────────────────────
  const addLibraryEntry = useCallback(
    (entry: LibraryEntry) => {
      const next = [entry, ...libraryEntriesRef.current];
      libraryEntriesRef.current = next;
      setLibraryEntries(next);
      recordJourneyEvent('library-piece-added');
    },
    [recordJourneyEvent],
  );

  const toggleLibraryEntrySaved = useCallback(
    (id: string) => {
      const wasSaved = libraryEntriesRef.current.find((item) => item.id === id)?.saved === true;
      if (!wasSaved) {
        recordJourneyEvent('library-piece-saved');
      }
      const next = libraryEntriesRef.current.map((item) =>
        item.id === id ? { ...item, saved: !item.saved } : item,
      );
      libraryEntriesRef.current = next;
      setLibraryEntries(next);
    },
    [recordJourneyEvent],
  );

  const removeLibraryEntry = useCallback((id: string) => {
    const next = libraryEntriesRef.current.filter((item) => item.id !== id);
    libraryEntriesRef.current = next;
    setLibraryEntries(next);
  }, []);

  // ── Server persistence ────────────────────────────────────────────────────
  // A debounced snapshot of the whole workspace state is saved to the server.
  // The state here stays the single system: the API stores exactly the
  // snapshot this provider derives, and hydration feeds it back in.

  const hasStartedNextMove = sessionEvents.some((item) => item.key === 'next-move-started');

  const buildSnapshot = useCallback((): JourneySaveRequest => {
    const sampleReadIds = sampleNotifications.filter((item) => item.sample && item.read).map((item) => item.id);
    return {
      navigatorAnswers: liveAnswers && Object.keys(liveAnswers).length > 0 ? liveAnswers : undefined,
      completedStages,
      libraryEntries: libraryEntries.map((entry) => ({
        id: entry.id,
        kind: entry.kind,
        title: entry.title,
        excerpt: entry.excerpt,
        date: entry.date,
        stage: entry.stage ?? null,
        saved: entry.saved ?? null,
        sample: entry.sample ?? null,
      })),
      events: sessionEvents.map((event) => ({
        key: event.key,
        stamp: event.stamp,
        stage: event.stage ?? null,
      })),
      notificationReadIds: sampleReadIds,
      clearedNotifications: cleared,
      settings: {
        displayName: settings.displayName,
        email: settings.email,
        emailDigest: settings.emailDigest,
        productUpdates: settings.productUpdates,
        journeyReminders: settings.journeyReminders,
        compactMode: settings.compactMode,
        reducedMotion: settings.reducedMotion,
      },
      hasStartedNextMove,
    };
  }, [
    sampleNotifications,
    liveAnswers,
    completedStages,
    libraryEntries,
    sessionEvents,
    settings,
    cleared,
    hasStartedNextMove,
  ]);

  const skipSave = useRef(hydrated);
  const saveTimer = useRef<number | null>(null);
  const savingRef = useRef(false);
  const pendingRef = useRef(false);

  const doSave = useCallback(async () => {
    if (savingRef.current) {
      pendingRef.current = true;
      return;
    }
    savingRef.current = true;
    setIsSaving(true);
    try {
      await saveJourney(buildSnapshot());
      setSaveFailed(false);
    } catch {
      // Honest failure: the workspace keeps working locally; the next change
      // retries the save. No fake success is recorded anywhere.
      setSaveFailed(true);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
      if (pendingRef.current) {
        pendingRef.current = false;
        void doSave();
      }
    }
  }, [buildSnapshot]);

  useEffect(() => {
    // Skip the mount-time effect: nothing changed yet — the first save fires
    // when real state changes after mount.
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = null;
      void doSave();
    }, 1200);
    return () => {
      if (saveTimer.current !== null) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [doSave]);

  const value = useMemo<WorkspaceStateValue>(
    () => ({
      notifications,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      settings,
      updateSettings,
      realActivity,
      hasRealActivity: sessionEvents.length > 0,
      hasStartedNextMove,
      completedStages,
      libraryEntries,
      addLibraryEntry,
      toggleLibraryEntrySaved,
      removeLibraryEntry,
      recordNavigatorCompleted,
      recordJourneyStarted,
      recordNextMoveStarted,
      recordStageCompleted,
      isSaving,
      saveFailed,
    }),
    [
      notifications,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      settings,
      updateSettings,
      sessionEvents.length,
      realActivity,
      hasStartedNextMove,
      completedStages,
      libraryEntries,
      addLibraryEntry,
      toggleLibraryEntrySaved,
      removeLibraryEntry,
      recordNavigatorCompleted,
      recordJourneyStarted,
      recordNextMoveStarted,
      recordStageCompleted,
      isSaving,
      saveFailed,
    ],
  );

  return <WorkspaceStateContext.Provider value={value}>{children}</WorkspaceStateContext.Provider>;
}

/**
 * Public provider. `hydration` is the journey payload loaded from the server
 * for the signed-in user (null before it arrives or when nothing is saved).
 * `navigatorAnswers` is the live shared navigator state, passed through so
 * saves always persist the user's current answers, not a stale copy.
 * The inner provider remounts when hydration transitions, so every slice of
 * state seeds exactly once from the same payload — one state system, one
 * hydration path.
 */
export function WorkspaceStateProvider({
  children,
  hydration = null,
  navigatorAnswers,
}: {
  children: ReactNode;
  hydration?: WorkspaceHydration | null;
  navigatorAnswers?: NavigatorAnswers;
}) {
  const key = hydration === null ? 'pending' : 'ready';
  return (
    <WorkspaceStateProviderInner
      key={key}
      hydration={hydration}
      navigatorAnswers={navigatorAnswers ?? {}}
    >
      {children}
    </WorkspaceStateProviderInner>
  );
}

export function useWorkspaceState(): WorkspaceStateValue {
  const value = useContext(WorkspaceStateContext);
  if (!value) {
    throw new Error('useWorkspaceState must be used inside WorkspaceStateProvider');
  }
  return value;
}
