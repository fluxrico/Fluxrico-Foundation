import { useMemo } from 'react';
import {
  JOURNEY,
  ROADMAP_STAGES,
  buildNavigatorResult,
  currentStandingStage,
  getStageIndex,
  getStageNextMove,
  isNavigatorComplete,
  journeyProgress,
  type JourneyActivity,
  type JourneyStatus,
  type NavigatorResultData,
  type NextMoveBrief,
  type RoadmapStageInfo,
  type RoadmapStageName,
} from '@/lib/journey';
import { useNavigatorState } from '@/components/navigator-state';
import { useWorkspaceState } from '@/lib/workspace-state';

// One coherent view of the user's journey. When Navigator answers exist they
// personalize the journey; otherwise the base journey applies. Every surface
// (Dashboard, Roadmap, Profile) reads from here so there is exactly one source
// of truth for stage, completion, progress, and the current next move.
export type JourneyView = {
  profile: typeof JOURNEY.profile;
  status: JourneyStatus;
  goal: string;
  currentStage: RoadmapStageName;
  currentStageInfo: RoadmapStageInfo;
  /** The current stage's full next-move brief (title, action, why, how, done). */
  nextMoveBrief: NextMoveBrief | null;
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

    // The standing stage's own next move is the one honest move to show once
    // the journey stands on it. The Navigator's suggested move still applies
    // while the journey stands on the stage Navigator placed the user on;
    // real completions advance the standing stage past that placement.
    const navigatorPlacement = navigatorResult?.currentStage ?? JOURNEY.currentStage;
    const advancedPastPlacement = getStageIndex(currentStage) > getStageIndex(navigatorPlacement);

    // When the journey has advanced, the standing stage's own next move is
    // the honest one; otherwise the Navigator's suggested move applies.
    const nextMove = !advancedPastPlacement && navigatorResult ? navigatorResult.nextMove : currentStageInfo.nextMove;

    return {
      profile: JOURNEY.profile,
      status: JOURNEY.status,
      goal: JOURNEY.goal,
      currentStage,
      currentStageInfo,
      // The brief always comes from the standing stage's shared definition —
      // the same object Dashboard and Roadmap would read directly.
      nextMoveBrief: getStageNextMove(currentStage),
      nextMove,
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
