import { type ReactNode } from 'react';
import type { NavigatorAnswers } from '@/lib/journey';
import { NavigatorStateProvider, useNavigatorState } from '@/components/navigator-state';
import { WorkspaceStateProvider, type WorkspaceHydration } from '@/lib/workspace-state';import { SubscriptionStateProvider } from '@/lib/subscription-state';
import { RequireAuth } from '@/components/require-auth';
import { useJourneyHydration } from '@/hooks/use-journey-hydration';

/**
 * The authenticated workspace shell: auth guard, server-loaded journey
 * hydration, and the shared state providers.
 *
 * Hydration is loaded exactly once here and passed down to both the
 * Navigator answers and the workspace state, which seed from the same
 * payload. While the journey is loading, the workspace providers mount with
 * `null` hydration and remount once it arrives (both providers key off the
 * hydration transition), so state seeds exactly once and the single shared
 * state system remains the only one.
 *
 * A load failure degrades honestly: the workspace starts from defaults and
 * saves forward — nothing is fabricated and nothing is lost that was already
 * persisted under a working session.
 */
function WorkspaceProviders({ children }: { children: ReactNode }) {
  const { hydration, status } = useJourneyHydration();

  const answers = (hydration?.navigatorAnswers ?? null) as NavigatorAnswers | null;
  const hasPayload = hydration !== null;

  return (
    <RequireAuth>
      <SubscriptionStateProvider>
        <NavigatorStateProvider hydration={hasPayload ? answers : null}>
          <WorkspaceStateBridge hydration={hasPayload ? (hydration as WorkspaceHydration) : null}>
            {status === 'loading' ? null : children}
          </WorkspaceStateBridge>
        </NavigatorStateProvider>
      </SubscriptionStateProvider>
    </RequireAuth>
  );
}

/**
 * Reads the live shared navigator state and passes it into the workspace
 * provider, so every server save persists the user's current answers.
 */
function WorkspaceStateBridge({
  children,
  hydration,
}: {
  children: ReactNode;
  hydration: WorkspaceHydration | null;
}) {
  const { answers } = useNavigatorState();
  return (
    <WorkspaceStateProvider hydration={hydration} navigatorAnswers={answers}>
      {children}
    </WorkspaceStateProvider>
  );
}

export default WorkspaceProviders;
