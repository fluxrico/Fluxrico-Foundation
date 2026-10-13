import { useEffect, useState } from 'react';
import { getJourney } from '@workspace/api-client-react';
import { sanitizeSessionJourneyEvents, type WorkspaceHydration } from '@/lib/workspace-state';

export type HydrationStatus = 'loading' | 'ready' | 'unavailable';

/**
 * Loads the persisted journey payload for the signed-in user.
 *
 * Returns `null` data while loading and after a load failure: the workspace
 * then starts from defaults and simply saves its state going forward — the
 * product keeps working either way, with no fabricated content.
 */
export function useJourneyHydration(): { hydration: WorkspaceHydration | null; status: HydrationStatus } {
  const [hydration, setHydration] = useState<WorkspaceHydration | null>(null);
  const [status, setStatus] = useState<HydrationStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    getJourney()
      .then((response) => {
        if (cancelled) return;
        const payload = response.journey;
        if (!(payload && typeof payload === 'object')) {
          setHydration(null);
          setStatus('ready');
          return;
        }
        // Trust boundary: the server stores the journey payload without
        // read-side validation. Casts are not validation — the persisted
        // events (the slice that renderers map unconditionally) are
        // sanitized here so malformed or legacy entries cannot throw
        // during render.
        setHydration({
          ...(payload as Record<string, unknown>),
          events: sanitizeSessionJourneyEvents((payload as { events?: unknown }).events),
        } as unknown as WorkspaceHydration);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setHydration(null);
        setStatus('unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { hydration, status };
}
