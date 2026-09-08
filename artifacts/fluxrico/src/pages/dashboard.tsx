import { ArrowRight, Check, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { AppShell } from '@/components/app-shell';
import { CurrentStageCard } from '@/components/current-stage-card';
import { NewUserDashboard } from '@/components/new-user-dashboard';
import { NextMoveCard } from '@/components/next-move-card';
import { GoalSnapshot } from '@/components/goal-snapshot';
import { RecentActivity } from '@/components/recent-activity';
import { RoadmapProgress } from '@/components/roadmap-progress';
import { useJourney } from '@/hooks/use-journey';
import { useWorkspaceState } from '@/lib/workspace-state';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const journey = useJourney();
  const { settings } = useWorkspaceState();
  // A user without Navigator answers sees the new-user state; completing
  // Navigator personalizes the dashboard for the rest of the session.
  const newUser = !journey.hasNavigatorData;
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
  }, []);

  const announce = (message: string) => {
    setNotice(message);
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 4200);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px]">
        {notice && (
          <div className="fluxrico-rise mb-6 flex items-start gap-3 rounded-xl border border-[#C9D9F0] bg-[#F0F8FF] px-4 py-3 text-sm text-[#38567B]" role="status" aria-live="polite" data-testid="status-dashboard-notice">
            <Check size={17} className="mt-0.5 shrink-0 text-[#178EAD]" strokeWidth={2.2} />
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} className="fluxrico-focus ml-auto rounded p-0.5 text-[#7183A2] hover:text-[#38567B]" aria-label="Dismiss notice" data-testid="button-dismiss-dashboard-notice"><X size={15} /></button>
          </div>
        )}
        {newUser ? (
          <NewUserDashboard onStartNavigator={() => setLocation('/navigator')} />
        ) : (
          <>
            <div className="fluxrico-rise flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <p className="text-[0.67rem] font-bold uppercase tracking-[0.21em] text-[#6258D0]">Your journey is getting clearer.</p>
                <h2 className="mt-3 max-w-[41rem] text-[2.7rem] font-extrabold leading-[0.98] tracking-[-0.075em] text-[#202155] sm:text-[4.15rem]">Let&apos;s turn your idea into your next useful step.</h2>
                <p className="mt-5 max-w-[33rem] text-base leading-7 text-[#737696]">You are in {journey.currentStage}. Keep the next move small, specific, and useful.</p>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-[#D9DAEC] bg-white px-3 py-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#777A99] lg:flex"><span className="h-2 w-2 rounded-full bg-[#16C6EA]" />In progress</div>
            </div>
            <div className="mt-10 grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
              <CurrentStageCard
                stage={journey.currentStageInfo}
                stageIndex={journey.stageIndex}
                stageTotal={journey.stageTotal}
                progressPercent={journey.stagePercent}
                navigatorComplete={journey.hasNavigatorData}
                onContinue={() => setLocation(`/roadmap?stage=${encodeURIComponent(journey.currentStage)}`)}
              />
              <NextMoveCard
                move={journey.nextMove}
                stageName={journey.currentStage}
                stageNumber={journey.currentStageInfo.number}
                hint={journey.currentStageInfo.why}
                onStart={() => announce(`Your next move is ready: ${journey.nextMove.charAt(0).toLowerCase()}${journey.nextMove.slice(1)}`)}
                onViewRoadmap={() => setLocation(`/roadmap?stage=${encodeURIComponent(journey.currentStage)}`)}
              />
            </div>
            <div className="mt-5" id="roadmap"><RoadmapProgress currentStage={journey.currentStage} /></div>
            <div className="mt-5 grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
              <GoalSnapshot
                goal={journey.goal}
                status={journey.status}
                stageIndex={journey.stageIndex}
                stageTotal={journey.stageTotal}
                onEdit={() => setLocation('/profile')}
              />
              <RecentActivity activity={journey.recentActivity} onViewAll={() => setLocation('/notifications')} />
            </div>
            {!settings.compactMode && (
              <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-2xl border border-dashed border-[#D5D6E8] bg-[#FAFAFE] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                <div><p className="text-sm font-bold text-[#343568]">Need a little room to think?</p><p className="mt-1 text-xs text-[#8587A3]">Your library will keep notes, prompts, and useful pieces together.</p></div>
                <button type="button" onClick={() => setLocation('/library')} className="fluxrico-focus inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D4D5E8] bg-white px-4 text-[0.64rem] font-bold uppercase tracking-[0.13em] text-[#5B56B5] hover:border-[#8E88E1]" data-testid="button-open-library">Open library <ArrowRight size={14} /></button>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
