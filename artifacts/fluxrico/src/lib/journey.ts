// Single source of truth for Fluxrico journey state.
// This is a frontend-only product: everything here is deterministic local
// state. Do not duplicate these values in route components — import from here.

export type RoadmapStageName = 'Start' | 'Shape' | 'Move' | 'Build' | 'Launch' | 'Grow';

export type RoadmapStageInfo = {
  number: string;
  name: RoadmapStageName;
  detail: string;
  description: string;
  why: string;
  nextMove: string;
};

/** The six Fluxrico stages, in order. */
export const ROADMAP_STAGES: readonly RoadmapStageInfo[] = [
  {
    number: '01',
    name: 'Start',
    detail: 'Raw idea',
    description: "Turn what's in your head into a few clear words you can act on.",
    why: 'A written idea survives busy weeks; an unwritten one fades.',
    nextMove: 'Write your idea down in one clear sentence.',
  },
  {
    number: '02',
    name: 'Shape',
    detail: 'Clear angle',
    description: 'Turn your raw idea into a clear direction.',
    why: 'A clear direction makes every later decision easier, not harder.',
    nextMove: 'Define who this idea is for.',
  },
  {
    number: '03',
    name: 'Move',
    detail: 'Next useful step',
    description: 'Take the next useful step toward something real.',
    why: 'One small real step beats a plan that never touches ground.',
    nextMove: 'Define the specific problem your product should solve.',
  },
  {
    number: '04',
    name: 'Build',
    detail: 'Create the offer',
    description: 'Create the offer your direction points toward.',
    why: 'An offer is the moment your idea becomes useful to someone else.',
    nextMove: 'Create the first version of your offer.',
  },
  {
    number: '05',
    name: 'Launch',
    detail: 'Put it into the world',
    description: 'Put your work into the world.',
    why: 'Real feedback only exists on the other side of sharing.',
    nextMove: 'Share your work with the first people who might want it.',
  },
  {
    number: '06',
    name: 'Grow',
    detail: 'Improve and scale',
    description: "Improve and scale what's working.",
    why: 'Small improvements compound faster than occasional reinventions.',
    nextMove: "Look at what's working, and do more of it.",
  },
] as const;

export function getStageIndex(name: RoadmapStageName): number {
  return ROADMAP_STAGES.findIndex((stage) => stage.name === name);
}

export function isValidStageName(value: string | null | undefined): value is RoadmapStageName {
  return !!value && ROADMAP_STAGES.some((stage) => stage.name.toLowerCase() === value.toLowerCase());
}

/** Read a `?stage=` query string, falling back to the journey's current stage. */
export function stageFromSearch(search: string, fallback: RoadmapStageName = 'Shape'): RoadmapStageName {
  const requested = new URLSearchParams(search).get('stage');
  return isValidStageName(requested) ? requested : fallback;
}

export type JourneyStatus = 'exploring' | 'in-progress' | 'growing';

export type UserProfile = {
  name: string;
  initials: string;
  title: string;
  currentGoal: string;
};

export type JourneyActivity = {
  id: string;
  label: string;
  date: string;
  detail: string;
};

export type Journey = {
  profile: UserProfile;
  status: JourneyStatus;
  currentStage: RoadmapStageName;
  goal: string;
  goalProgress: number; // 0..100
  completedStages: RoadmapStageName[];
  recentActivity: JourneyActivity[];
};

/**
 * The demo journey. In a real backend this would come from the user record;
 * for now it is the one coherent frontend-only state every surface reads.
 */
export const JOURNEY: Journey = {
  profile: {
    name: 'Maya R.',
    initials: 'MR',
    title: 'Independent maker',
    currentGoal: 'Build and launch a digital product',
  },
  status: 'in-progress',
  currentStage: 'Shape',
  goal: 'Build and launch a digital product',
  goalProgress: 33,
  completedStages: ['Start'],
  recentActivity: [
    {
      id: 'navigator',
      label: 'Navigator completed',
      date: 'Today',
      detail: 'Your first direction is ready to shape.',
    },
    {
      id: 'direction',
      label: 'Direction saved',
      date: 'Yesterday',
      detail: 'A useful thread to carry forward.',
    },
    {
      id: 'roadmap',
      label: 'Roadmap updated',
      date: 'Mon, 8 Apr',
      detail: 'Shape is your current stage.',
    },
  ],
};

export function stageProgress(currentStage: RoadmapStageName): {
  index: number;
  total: number;
  percent: number;
  completed: RoadmapStageName[];
} {
  const index = getStageIndex(currentStage);
  const completed = ROADMAP_STAGES.slice(0, index).map((stage) => stage.name);
  return {
    index,
    total: ROADMAP_STAGES.length,
    percent: Math.round(((index + 1) / ROADMAP_STAGES.length) * 100),
    completed,
  };
}

// ── Navigator ────────────────────────────────────────────────────────────────

/** The four Navigator answers, keyed by step. */
export type NavigatorAnswers = {
  goal?: string;
  current?: string;
  strength?: string;
  path?: string;
};

export type NavigatorResultData = {
  direction: string;
  signal: string;
  confidence: 'High confidence' | 'Medium confidence' | 'Emerging confidence';
  confidenceExplanation: string;
  reasons: string[];
  nextMove: string;
  currentStage: RoadmapStageName;
};

/**
 * Deterministic Navigator result logic. Given the same answers it always
 * returns the same direction — no AI, no randomness, fully testable.
 */
export function buildNavigatorResult(answers: NavigatorAnswers): NavigatorResultData {
  const goal = answers.goal ?? 'Start a digital product';
  const current = answers.current;
  const strength = answers.strength;
  const path = answers.path;

  const productLed =
    goal === 'Start a digital product' ||
    goal === 'Turn an idea into income' ||
    path === 'Create a digital product';

  const audienceLed = goal === 'Build an audience' || path === 'Build content';

  const direction = productLed
    ? 'Build a digital product around your knowledge.'
    : audienceLed
      ? 'Build an audience around a useful point of view.'
      : 'Turn your strongest skill into a clear offer.';

  const hasIdea = current === 'I only have an idea' || !current;
  const hasSomething = current === 'I already have something to sell' || current === 'I’m already making some income';
  const currentStage: RoadmapStageName =
    goal === 'I’m not sure yet' || path === 'Explore options first'
      ? 'Start'
      : hasIdea
        ? 'Shape'
        : hasSomething
          ? 'Move'
          : 'Shape';

  const answeredCount = [answers.goal, answers.current, answers.strength, answers.path].filter(Boolean).length;

  const signal = productLed ? 84 : audienceLed ? 78 : 81;
  const adjustedSignal = Math.min(96, signal + (answeredCount - 2) * 2);

  const confidence: NavigatorResultData['confidence'] =
    answeredCount >= 4 ? 'High confidence' : answeredCount >= 3 ? 'Medium confidence' : 'Emerging confidence';

  const confidenceExplanation =
    answeredCount >= 4
      ? 'Your answers point consistently toward one direction.'
      : answeredCount === 3
        ? 'Your answers mostly agree; a couple were skipped.'
        : 'You skipped several questions, so this signal is broader than usual.';

  const reasons = [
    `You named “${goal.toLowerCase()}” as the outcome that matters most right now.`,
    strength
      ? `${strength} is already a useful signal for the kind of work you can make feel like yours.`
      : 'You are starting with enough clarity to choose one useful direction.',
    path
      ? `A path to “${path.toLowerCase()}” gives this next chapter a practical shape.`
      : 'A product-led path gives your idea somewhere concrete to go.',
  ];

  const nextMove = productLed
    ? 'Define the specific problem your product should solve.'
    : audienceLed
      ? 'Pick the one topic you could talk about for a year.'
      : 'Write down the clearest promise your work can make.';

  return {
    direction,
    signal: `${adjustedSignal}% Match`,
    confidence,
    confidenceExplanation,
    reasons,
    nextMove,
    currentStage,
  };
}

// ── Library ──────────────────────────────────────────────────────────────────

export type LibraryEntry = {
  id: string;
  kind: 'Idea' | 'Note' | 'Prompt';
  title: string;
  excerpt: string;
  date: string;
};

/** Frontend-only placeholder library entries. */
export const LIBRARY_ENTRIES: readonly LibraryEntry[] = [
  {
    id: 'lib-1',
    kind: 'Idea',
    title: 'A weekly planning ritual for makers',
    excerpt: 'One calm hour to decide the next move before the week decides it for you.',
    date: 'Today',
  },
  {
    id: 'lib-2',
    kind: 'Note',
    title: 'Who this is for, so far',
    excerpt: 'Thoughtful people with a skill and no clear offer yet — momentum matters more than scale.',
    date: 'Yesterday',
  },
  {
    id: 'lib-3',
    kind: 'Prompt',
    title: 'Describe the problem in one sentence',
    excerpt: 'If the sentence is hard to write, the idea is not clear enough yet.',
    date: 'Mon, 8 Apr',
  },
];
