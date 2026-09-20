import { useEffect, useState } from 'react';
import { getJourney } from '@workspace/api-client-react';
import type { WorkspaceHydration } from '@/lib/workspace-state';

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
        setHydration(
          payload && typeof payload === 'object'
            ? (payload as unknown as WorkspaceHydration)
            : null,
        );
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
