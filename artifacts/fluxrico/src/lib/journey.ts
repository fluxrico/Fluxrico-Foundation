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

/**
 * The actionable brief for each stage: what to achieve, what to figure out,
 * what to actually do, and how to know it is done. Roadmap is an ACTION
 * system — every stage answers GOAL → TASKS → GUIDANCE → DEFINITION OF DONE
 * → NEXT MOVE. Defined here so Dashboard, Roadmap, and any future surface
 * read one shared source alongside ROADMAP_STAGES.
 */
export type RoadmapStageGuide = {
  focus: string[];
  goal: string;
  figureOut: string[];
  tasks: string[];
  guidance: string;
  done: string;
};

/** Per-stage action brief, indexed by position in ROADMAP_STAGES. */
export const ROADMAP_STAGE_GUIDES: readonly RoadmapStageGuide[] = [
  {
    focus: ['Idea', 'Skill', 'Knowledge', 'Existing project', 'Goal', 'Initial direction'],
    goal: 'Understand what you have and where you want to go.',
    figureOut: [
      'What do you already have — an idea, a skill, an unfinished project?',
      'Which part of it has real energy when you imagine working on it?',
      'What outcome do you actually want: income, independence, momentum?',
      'What does a good next chapter look like in one sentence?',
    ],
    tasks: [
      'Write down every asset you already have — ideas, skills, projects, audiences.',
      'Circle the one thing you would still enjoy working on in six months.',
      'Write the one-sentence version of where you want to end up.',
      'Decide what you are NOT doing this chapter — park the rest.',
    ],
    guidance: 'Good progress here looks like honesty, not ambition. A small, true starting point beats a grand plan built on a vague idea.',
    done: 'You have clearly identified what you want to move forward with — one starting point, written down, that you can explain to someone else.',
  },
  {
    focus: ['Target user', 'Problem', 'Product idea', 'Value', 'First product shape'],
    goal: 'Turn the initial starting point into a clear direction.',
    figureOut: [
      'Who exactly is this for — one specific person you can describe?',
      'What problem does that person feel often enough to act on?',
      'What value does your version create that they cannot get today?',
      'What is the smallest product shape that could carry that value?',
    ],
    tasks: [
      'Write one sentence naming your target user as a real, specific person.',
      'Describe the problem in their words, not in product words.',
      'Draft your value proposition: “I help [who] solve [problem] with [value].”',
      'Sketch the first product shape — a page, a template, a service, an app.',
    ],
    guidance: 'Clarity compounds. The sharper “who” and “problem” get, the easier every later decision becomes — a specific version beats a safe, vague one.',
    done: 'Clear idea plus target user plus problem plus value proposition — written in a few sentences a stranger could understand and agree with.',
  },
  {
    focus: ['First useful action', 'Validation', 'Testing assumptions', 'Collecting feedback', 'Removing uncertainty'],
    goal: 'Turn clarity into real action.',
    figureOut: [
      'What is the riskiest assumption behind your direction?',
      'What is the smallest action that could prove or disprove it?',
      'Who can you talk to or show something to this week?',
      'What answer would tell you this direction needs to change?',
    ],
    tasks: [
      'Name your riskiest assumption and write how you would test it.',
      'Talk to two or three people who match your target user.',
      'Run one small test — a conversation, a landing page, a simple offer.',
      'Write down what you learned and what you would change.',
    ],
    guidance: 'Evidence beats opinion. If the step feels slightly uncomfortable — talking to real people, showing something unfinished — it is probably the right step.',
    done: 'You have taken a meaningful real-world step and learned from it: you can name what you tried, who you showed, and what changed in your thinking.',
  },
  {
    focus: ['Product structure', 'Core value', 'Minimum useful version', 'Creating', 'Improving'],
    goal: 'Create the first valuable version.',
    figureOut: [
      'What is the single core value your first version must deliver?',
      'What can be cut without losing that value?',
      'What structure fits: one page, one template, one service, one small app?',
      'How will you know the version is genuinely usable — not just finished?',
    ],
    tasks: [
      'Write the one-line promise your first version makes to its user.',
      'List everything the first version could include, then cut it to the core.',
      'Build the smallest version that actually delivers the core value.',
      'Use it yourself, end to end, and fix what breaks or confuses.',
    ],
    guidance: 'A minimum version is not a lesser product — it is a focused one. If everything in it exists to deliver one clear value, it is already useful.',
    done: 'A usable first version exists that delivers the intended core value — someone other than you can get value from it without you explaining it.',
  },
  {
    focus: ['Launch preparation', 'Positioning', 'Offer', 'Distribution', 'First users/customers', 'Feedback'],
    goal: 'Put the product into the world.',
    figureOut: [
      'How will you describe this so the right people instantly recognize it?',
      'Where do your first users already spend time?',
      'What is the offer — free, paid, early access — for this first launch?',
      'What feedback will tell you the launch is working?',
    ],
    tasks: [
      'Write the one-line positioning: what it is, who it is for, why it is different.',
      'Pick one or two distribution channels you can actually reach.',
      'Prepare a simple launch page or post with a clear call to action.',
      'Share it, then capture every piece of feedback in one place.',
    ],
    guidance: 'A launch is a conversation, not an announcement. Expect quiet at first — real-world response, even a small one, beats a perfect launch imagined alone.',
    done: 'The product is available to real users and receiving real-world response — you can point to people using it and something they said about it.',
  },
  {
    focus: ['Feedback', 'Improvement', 'Retention', 'Distribution', 'Revenue', 'Scaling'],
    goal: 'Improve what works and build sustainable progress.',
    figureOut: [
      'What do people actually use — and what do they quietly ignore?',
      'Where do users drop off, and what keeps the ones who stay?',
      'Which single improvement would compound: retention, distribution, or price?',
      'What would a repeatable growth loop look like for this product?',
    ],
    tasks: [
      'Review usage and feedback; note the strongest pattern you see.',
      'Improve the one thing users rely on most before adding anything new.',
      'Test one distribution idea and track whether it repeats.',
      'Write your growth loop: how one user leads to the next.',
    ],
    guidance: 'Growth is a rhythm, not an event. Improve from evidence, keep what works, and let small compounding wins replace occasional reinventions.',
    done: 'You have a repeatable path for improving and growing the product — a rhythm of shipping improvements and a channel that reliably brings people in.',
  },
] as const;

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
