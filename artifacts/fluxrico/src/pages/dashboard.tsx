import { useLocation } from 'wouter';
import { AppShell, PageHeader } from '@/components/app-shell';
import { CurrentStageCard } from '@/components/current-stage-card';
import { DirectionCard } from '@/components/direction-card';
import { GuidanceCard } from '@/components/guidance-card';
import { NewUserDashboard } from '@/components/new-user-dashboard';
import { NextMoveCard } from '@/components/next-move-card';
import { GoalSnapshot } from '@/components/goal-snapshot';
import { RecentActivity } from '@/components/recent-activity';
import { RoadmapProgress } from '@/components/roadmap-progress';
import { useJourney } from '@/hooks/use-journey';
import { useAuthState } from '@/lib/auth-state';
import { useWorkspaceState } from '@/lib/workspace-state';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const journey = useJourney();
  const { settings, recordNextMoveStarted } = useWorkspaceState();
  const { user } = useAuthState();
  // A user without Navigator answers sees the new-user state; completing
  // Navigator personalizes the dashboard for the rest of the session.
  const newUser = !journey.hasNavigatorData;
  const firstName = (user?.name ?? journey.profile.name).trim().split(/\s+/)[0];

  const openStage = () => {
    // Opening the current next move is a real, existing action — record it.
    recordNextMoveStarted();
    setLocation(`/roadmap?stage=${encodeURIComponent(journey.currentStage)}`);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px]">
        {newUser ? (
          <NewUserDashboard onStartNavigator={() => setLocation('/navigator')} />
        ) : (
          <>
            {/* Workspace header: who this workspace belongs to, in one line. */}
            <PageHeader
              eyebrow="Fluxrico workspace"
              title={`Good morning, ${firstName}.`}
              description={`You are in ${journey.currentStage}. Keep the next move small, specific, and useful.`}
            />

            {/* Level 1 — the action. */}
            <div className="fluxrico-rise mt-10">
              <NextMoveCard
                move={journey.nextMove}
                stageName={journey.currentStage}
                stageNumber={journey.currentStageInfo.number}
                hint={journey.currentStageInfo.why}
                onStart={openStage}
                onViewRoadmap={() => setLocation('/roadmap')}
              />
            </div>

            {/* Level 2 — where I am, and the path. */}
            <div className="mt-5 grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
              <CurrentStageCard
                stage={journey.currentStageInfo}
                stageIndex={journey.stageIndex}
                stageTotal={journey.stageTotal}
                progressPercent={journey.progressPercent}
                navigatorComplete={journey.hasNavigatorData}
                onContinue={openStage}
              />
              <div id="roadmap">
                <RoadmapProgress currentStage={journey.currentStage} completedStages={journey.completedStages} />
              </div>
            </div>

            {/* Level 3 — direction and goal. */}
            <div className="mt-5 grid gap-5 lg:grid-cols-[1.18fr_0.82fr]">
              <DirectionCard direction={journey.direction} onViewDirection={() => setLocation('/navigator/result')} />
              <GoalSnapshot
                goal={journey.goal}
                status={journey.status}
                stageIndex={journey.stageIndex}
                stageTotal={journey.stageTotal}
                progressPercent={journey.progressPercent}
                onEdit={() => setLocation('/profile')}
              />
            </div>

            {/* Level 4 — what changed, and a quiet nudge. */}
            <div className="mt-5 grid gap-5 lg:grid-cols-[1.18fr_0.82fr]">
              {/* journey.recentActivity already merges real session events ahead of samples. */}
              <RecentActivity activity={journey.recentActivity} onViewAll={() => setLocation('/notifications')} />
              <div className="flex flex-col gap-5">
                <GuidanceCard stageName={journey.currentStage} />
                {!settings.compactMode && (
                  <section className="rounded-[1.65rem] border border-[#DADBF0] bg-white p-6 shadow-[0_8px_28px_rgba(44,42,123,0.035)] sm:p-7" aria-labelledby="library-nudge-title" data-testid="card-library-nudge">
                    <h2 id="library-nudge-title" className="text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#6861C8]">Library</h2>
                    <p className="mt-3 text-sm font-bold leading-6 text-[#343568]">Need a little room to think?</p>
                    <p className="mt-1.5 text-xs leading-5 text-[#8587A3]">Your library keeps notes, prompts, and useful pieces together.</p>
                    <button
                      type="button"
                      onClick={() => setLocation('/library')}
                      className="fluxrico-focus mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D4D5E8] bg-white px-4 text-[0.64rem] font-bold uppercase tracking-[0.13em] text-[#5B56B5] hover:border-[#8E88E1]"
                      data-testid="button-open-library"
                    >
                      Open library
                    </button>
                  </section>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
