import { useMemo } from 'react';
import {
  JOURNEY,
  ROADMAP_STAGES,
  buildNavigatorResult,
  currentStandingStage,
  getStageIndex,
  isNavigatorComplete,
  journeyProgress,
  type JourneyActivity,
  type JourneyStatus,
  type NavigatorResultData,
  type RoadmapStageInfo,
  type RoadmapStageName,
} from '@/lib/journey';
import { useNavigatorState } from '@/components/navigator-state';
import { useWorkspaceState } from '@/lib/workspace-state';

// One coherent view of the user's journey. When Navigator answers exist they
// personalize the journey; otherwise the base journey applies. Every surface
// (Dashboard, Roadmap, Profile, Navigator result) reads from here so there is
// exactly one source of truth for stage, completion, and progress.
export type JourneyView = {
  profile: typeof JOURNEY.profile;
  status: JourneyStatus;
  goal: string;
  currentStage: RoadmapStageName;
  currentStageInfo: RoadmapStageInfo;
  nextMove: string;
  direction: string | null;
  stageIndex: number;
  stageTotal: number;
  /** Honest completion percent: real completed stages / total, from journeyProgress. */
  progressPercent: number;
  /** Stages completed through real work — the single completion source. */
  completedStages: RoadmapStageName[];
  recentActivity: JourneyActivity[];
  hasNavigatorData: boolean;
  navigatorResult: NavigatorResultData | null;
};

export function useJourney(): JourneyView {
  const { answers } = useNavigatorState();
  const { realActivity, hasRealActivity, completedStages } = useWorkspaceState();

  return useMemo(() => {
    // Navigator is complete only when every required question has an answer;
    // partial answers must not flip Dashboard/Profile into "completed" state.
    const hasNavigatorData = isNavigatorComplete(answers);
    const navigatorResult = hasNavigatorData ? buildNavigatorResult(answers) : null;

    // The standing stage honors the Navigator's placement as a floor and
    // advances only through real completions — one shared rule so Dashboard,
    // Roadmap, and Profile can never disagree about where the journey stands.
    const currentStage = currentStandingStage(
      completedStages,
      navigatorResult?.currentStage ?? JOURNEY.currentStage,
    );
    const stageIndex = getStageIndex(currentStage);
    const currentStageInfo = ROADMAP_STAGES[stageIndex];

    // The one progress calculation in the workspace: only stages completed
    // through real work count. Being on a stage contributes nothing — a user
    // standing on Stage 01 with nothing completed is at 0%, not 17%.
    const progress = journeyProgress(completedStages);

    // Real events recorded this session lead the feed; the sample entries
    // (marked sample: true) follow as clearly-labeled examples, and only until
    // the user's own history exists.
    const recentActivity = hasRealActivity ? [...realActivity, ...JOURNEY.recentActivity] : JOURNEY.recentActivity;

    // The Navigator's suggested move describes its own stage's first action;
    // once the journey has advanced past that stage through real completions,
    // the standing stage's own next move is the honest one to show.
    const navigatorPlacement = navigatorResult?.currentStage ?? JOURNEY.currentStage;
    const advancedPastPlacement = getStageIndex(currentStage) > getStageIndex(navigatorPlacement);

    return {
      profile: JOURNEY.profile,
      status: JOURNEY.status,
      goal: JOURNEY.goal,
      currentStage,
      currentStageInfo,
      nextMove: !advancedPastPlacement && navigatorResult ? navigatorResult.nextMove : currentStageInfo.nextMove,
      direction: navigatorResult?.direction ?? null,
      stageIndex,
      stageTotal: progress.total,
      progressPercent: progress.percent,
      completedStages,
      recentActivity,
      hasNavigatorData,
      navigatorResult,
    };
  }, [answers, realActivity, hasRealActivity, completedStages]);
}
