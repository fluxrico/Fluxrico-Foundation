import {
  ArrowRight,
  Check,
  Compass,
  Footprints,
  Library,
  Map as MapIcon,
  Pencil,
  Route as RouteIcon,
  Signpost,
  Sparkles,
  Target,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { AppShell, PageHeader } from '@/components/app-shell';
import { useJourney } from '@/hooks/use-journey';
import { ROADMAP_STAGES, ROADMAP_STAGE_GUIDES, getStageIndex } from '@/lib/journey';
import type { JourneyActivity, RoadmapStageName } from '@/lib/journey';
import { useAuthState } from '@/lib/auth-state';
import { useWorkspaceState } from '@/lib/workspace-state';

// ── Profile vocabulary ───────────────────────────────────────────────────────
// Every fact on this page reads from the shared journey sources — useJourney,
// ROADMAP_STAGES/GUIDES, workspace state, and auth state. Nothing journey-
// related is redefined here, and no editing lives on this page (that is
// Settings). Profile answers: who am I, what am I working toward, where am I.

type ProfileTab = 'overview' | 'journey' | 'activity';

const TABS: { key: ProfileTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'journey', label: 'Journey' },
  { key: 'activity', label: 'Activity' },
];

const STATUS_LABEL: Record<string, string> = {
  exploring: 'Exploring',
  'in-progress': 'In progress',
  growing: 'Growing',
};

const CATEGORY_ICON: Record<string, typeof Compass> = {
  Journey: Compass,
  Roadmap: RouteIcon,
  Guidance: Sparkles,
  Library: Library,
  Product: Footprints,
};

// ── Shared small pieces ──────────────────────────────────────────────────────

function CardLabel({ icon: Icon, children }: { icon: typeof Compass; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#6861C8]">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F0EEFF]">
        <Icon size={15} strokeWidth={1.8} />
      </span>
      {children}
    </div>
  );
}

function ActivityRow({ item, index }: { item: JourneyActivity; index: number }) {
  return (
    <li className="flex gap-3.5 py-4 first:pt-0 last:pb-0" data-testid={`profile-activity-${item.id}`}>
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          index === 0 ? 'bg-[#E4F9FC] text-[#159BB5]' : 'bg-[#F0EEFF] text-[#7068D0]'
        }`}
        aria-hidden="true"
      >
        {index === 0 ? <Check size={15} strokeWidth={2.2} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col justify-between gap-1 sm:flex-row sm:gap-3">
          <p className="text-sm font-bold text-[#3A3B6C]">{item.label}</p>
          <time className="shrink-0 text-[0.64rem] font-medium text-[#9A9CB3]">{item.date}</time>
        </div>
        <p className="mt-1 text-xs leading-5 text-[#8587A3]">{item.detail}</p>
      </div>
    </li>
  );
}

// ── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const journey = useJourney();

  return (
    <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
      {/* Direction — where this journey is pointed right now. */}
      <section
        className="rounded-[1.65rem] bg-[#211F61] p-6 text-white shadow-[0_15px_35px_rgba(38,34,121,0.16)] sm:p-8"
        aria-labelledby="profile-direction-title"
        data-testid="card-profile-direction"
      >
        <div className="flex items-center gap-2 text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#8DDEF0]">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4D47A8]">
            <Compass size={15} strokeWidth={1.8} />
          </span>
          DIRECTION
        </div>
        <h2
          id="profile-direction-title"
          className="mt-6 max-w-[26rem] text-[1.7rem] font-extrabold leading-[1.12] tracking-[-0.05em] text-[#F7F6FF]"
        >
          {journey.direction ?? 'Your direction appears here once Navigator has a signal.'}
        </h2>
        <p className="mt-4 max-w-[26rem] text-sm leading-6 text-[#C2C4E1]">
          {journey.direction
            ? 'This is the working direction your dashboard and roadmap follow right now.'
            : 'Answer a few Navigator questions and a first direction will take shape.'}
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            href="/navigator"
            className="fluxrico-focus inline-flex min-h-10 items-center gap-2 rounded-full bg-[#F4F3FF] px-4 text-[0.64rem] font-bold uppercase tracking-[0.14em] text-[#302B79] transition-colors hover:bg-white"
            data-testid="button-profile-navigator"
          >
            {journey.hasNavigatorData ? 'Edit answers' : 'Take Navigator'}
          </Link>
          <Link
            href="/roadmap"
            className="fluxrico-focus inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-[0.64rem] font-bold uppercase tracking-[0.14em] text-[#D6D8F5] transition-colors hover:border-[#62D9F3] hover:text-white"
            data-testid="button-profile-roadmap"
          >
            View roadmap
          </Link>
        </div>
      </section>

      {/* Next move — the one action this stage is pointing at. */}
      <section
        className="dashboard-card-lift rounded-[1.65rem] border border-[#DADBF0] bg-white p-6 shadow-[0_8px_28px_rgba(44,42,123,0.045)] sm:p-8"
        aria-labelledby="profile-nextmove-title"
        data-testid="card-profile-next-move"
      >
        <CardLabel icon={Target}>THE NEXT MOVE</CardLabel>
        <h2 id="profile-nextmove-title" className="mt-6 text-[1.45rem] font-extrabold leading-[1.16] tracking-[-0.045em] text-[#202155]">
          {journey.nextMove}
        </h2>
        <p className="mt-3.5 text-sm leading-6 text-[#727596]">{journey.currentStageInfo.why}</p>
        <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-[#ECECF1] pt-5">
          <Link
            href={`/roadmap?stage=${journey.currentStage}`}
            className="fluxrico-focus inline-flex min-h-10 items-center gap-2 rounded-full bg-[#EBE9FF] px-4 text-[0.64rem] font-bold uppercase tracking-[0.13em] text-[#5147C2] transition-colors hover:bg-[#E1DEFF]"
            data-testid="link-profile-open-stage"
          >
            Open {journey.currentStage} <ArrowRight size={13} strokeWidth={2.2} />
          </Link>
          <span className="text-xs font-semibold text-[#9A9CB3]">
            Stage {journey.currentStageInfo.number} · {journey.stagePercent}% of the path
          </span>
        </div>
      </section>
    </div>
  );
}

// ── Journey tab ──────────────────────────────────────────────────────────────

function JourneyTab({ currentStage, stagePercent }: { currentStage: RoadmapStageName; stagePercent: number }) {
  const currentIndex = getStageIndex(currentStage);
  const guide = ROADMAP_STAGE_GUIDES[currentIndex];
  const currentInfo = ROADMAP_STAGES[currentIndex];

  return (
    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      {/* The six stages, in order — shared data, no new definitions. */}
      <section
        className="rounded-[1.65rem] border border-[#DADBF0] bg-white p-6 shadow-[0_8px_28px_rgba(44,42,123,0.04)] sm:p-7"
        aria-labelledby="profile-stages-title"
        data-testid="card-profile-stages"
      >
        <CardLabel icon={MapIcon}>THE PATH</CardLabel>
        <h2 id="profile-stages-title" className="mt-5 text-xl font-extrabold tracking-[-0.045em] text-[#25265A]">
          Six stages, one at a time.
        </h2>
        <ol className="mt-6 space-y-2.5">
          {ROADMAP_STAGES.map((stage, index) => {
            const state = index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming';
            return (
              <li key={stage.name} data-testid={`profile-stage-${stage.name.toLowerCase()}`}>
                <Link
                  href={`/roadmap?stage=${stage.name}`}
                  className={`fluxrico-focus flex items-center gap-4 rounded-2xl border px-4 py-3.5 transition-colors ${
                    state === 'current'
                      ? 'border-[#B9E9F2] bg-[#F4FCFD]'
                      : state === 'complete'
                        ? 'border-[#E4E4F4] bg-[#FAFAFE] hover:border-[#B4ABF0]'
                        : 'border-[#E9E9F4] bg-white hover:border-[#C7C9E5]'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[0.66rem] font-extrabold ${
                      state === 'complete'
                        ? 'bg-[#6A5BE2] text-white'
                        : state === 'current'
                          ? 'border border-[#16C5E9] bg-[#E0F9FC] text-[#168BA5] shadow-[0_0_0_4px_#F1FCFD]'
                          : 'border border-[#D8D9E9] bg-[#FAFAFD] text-[#9B9DB5]'
                    }`}
                    aria-hidden="true"
                  >
                    {state === 'complete' ? <Check size={15} strokeWidth={2.5} /> : stage.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-extrabold tracking-[-0.02em]">
                      <span className={state === 'current' ? 'text-[#4E46C0]' : state === 'complete' ? 'text-[#343568]' : 'text-[#888BA8]'}>
                        {stage.name}
                      </span>
                      {state === 'current' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#E0F9FC] px-2 py-0.5 text-[0.54rem] font-bold uppercase tracking-[0.12em] text-[#168BA5]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#16C6EA]" aria-hidden="true" /> Current
                        </span>
                      )}
                      {state === 'complete' && (
                        <span className="text-[0.56rem] font-bold uppercase tracking-[0.12em] text-[#8B8DDA]">Completed</span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[#9A9CB3]">{stage.detail}</span>
                  </span>
                  <ArrowRight
                    size={15}
                    strokeWidth={1.8}
                    className={`hidden shrink-0 sm:block ${state === 'current' ? 'text-[#16C5E9]' : 'text-[#C4C6DC]'}`}
                  />
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {/* The working brief for the current stage — straight from the shared guide. */}
      <div className="flex flex-col gap-5">
        <section
          className="rounded-[1.65rem] border border-[#DADBF0] bg-white p-6 shadow-[0_8px_28px_rgba(44,42,123,0.04)] sm:p-7"
          aria-labelledby="profile-brief-title"
          data-testid="card-profile-stage-brief"
        >
          <CardLabel icon={Signpost}>STAGE {currentInfo.number} BRIEF</CardLabel>
          <h2 id="profile-brief-title" className="mt-5 text-xl font-extrabold tracking-[-0.045em] text-[#25265A]">
            {currentInfo.name} — {currentInfo.detail}
          </h2>
          <p className="mt-2.5 text-sm leading-6 text-[#727596]">{guide.goal}</p>
          <ul className="mt-5 space-y-2.5">
            {guide.tasks.map((task) => (
              <li key={task} className="flex items-start gap-2.5 text-sm leading-6 text-[#565980]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B84E8]" aria-hidden="true" />
                {task}
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-[#ECECF1] pt-5">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-[#8587A3]">DONE MEANS</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#3A3B6C]">{guide.done}</p>
          </div>
          <Link
            href={`/roadmap?stage=${currentInfo.name}`}
            className="fluxrico-focus mt-6 inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D4D5E8] bg-white px-4 text-[0.64rem] font-bold uppercase tracking-[0.13em] text-[#5B56B5] transition-colors hover:border-[#8E88E1]"
            data-testid="link-profile-brief-roadmap"
          >
            Open {currentInfo.name} in Roadmap <ArrowRight size={13} strokeWidth={2.2} />
          </Link>
        </section>

        {/* Progress rail: where you are, honestly measured. */}
        <section
          className="rounded-[1.65rem] border border-[#DADBF0] bg-[#F1F2FD] p-6 sm:p-7"
          aria-labelledby="profile-rail-title"
          data-testid="card-profile-rail"
        >
          <CardLabel icon={Target}>PROGRESS</CardLabel>
          <div className="mt-5 flex items-end justify-between gap-3">
            <p className="text-3xl font-extrabold tracking-[-0.05em] text-[#28295D]">{stagePercent}%</p>
            <p className="pb-1 text-sm font-semibold text-[#4F48C5]">
              Stage {currentIndex + 1} of {ROADMAP_STAGES.length}
            </p>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/80">
            <div
              className="h-full rounded-full bg-[#6857E8] transition-[width] duration-500"
              style={{ width: `${stagePercent}%` }}
              data-testid="progress-profile-journey"
            />
          </div>
          <p className="mt-4 text-xs leading-5 text-[#727596]">
            {currentIndex === 0
              ? 'The path begins here — one small move starts it.'
              : `${currentIndex} stage${currentIndex === 1 ? '' : 's'} behind you. The next one starts with one small move.`}
          </p>
        </section>
      </div>
    </div>
  );
}

// ── Activity tab ─────────────────────────────────────────────────────────────

function ActivityTab({ activity }: { activity: JourneyActivity[] }) {
  const { notifications } = useWorkspaceState();

  return (
    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <section
        className="rounded-[1.65rem] border border-[#DADBF0] bg-white p-6 shadow-[0_8px_28px_rgba(44,42,123,0.04)] sm:p-7"
        aria-labelledby="profile-thread-title"
        data-testid="card-profile-thread"
      >
        <CardLabel icon={Footprints}>JOURNEY THREAD</CardLabel>
        <h2 id="profile-thread-title" className="mt-5 text-xl font-extrabold tracking-[-0.045em] text-[#25265A]">
          What has moved recently.
        </h2>
        <ul className="mt-5 divide-y divide-[#ECECF3]">
          {activity.map((item, index) => (
            <ActivityRow key={item.id} item={item} index={index} />
          ))}
        </ul>
      </section>

      <section
        className="rounded-[1.65rem] border border-[#DADBF0] bg-white p-6 shadow-[0_8px_28px_rgba(44,42,123,0.04)] sm:p-7"
        aria-labelledby="profile-signals-title"
        data-testid="card-profile-signals"
      >
        <CardLabel icon={Sparkles}>FROM THE WORKSPACE</CardLabel>
        <h2 id="profile-signals-title" className="mt-5 text-xl font-extrabold tracking-[-0.045em] text-[#25265A]">
          Recent workspace signals.
        </h2>
        <ul className="mt-5 divide-y divide-[#ECECF3]">
          {notifications.slice(0, 4).map((item) => {
            const Icon = CATEGORY_ICON[item.category] ?? Sparkles;
            return (
              <li key={item.id} className="flex gap-3.5 py-4 first:pt-0 last:pb-0" data-testid={`profile-signal-${item.id}`}>
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0EEFF] text-[#7068D0]">
                  <Icon size={14} strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col justify-between gap-1 sm:flex-row sm:gap-3">
                    <p className="text-sm font-bold text-[#3A3B6C]">{item.title}</p>
                    <time className="shrink-0 text-[0.64rem] font-medium text-[#9A9CB3]">{item.timestamp}</time>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#8587A3]">{item.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <Link
          href="/notifications"
          className="fluxrico-focus mt-4 inline-flex items-center gap-1.5 text-[0.64rem] font-bold uppercase tracking-[0.13em] text-[#5147C2] transition-colors hover:text-[#332E9E]"
          data-testid="link-profile-all-notifications"
        >
          Open notifications <ArrowRight size={13} strokeWidth={2.2} />
        </Link>
      </section>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Profile() {
  const journey = useJourney();
  const { user, signOut } = useAuthState();
  const { settings } = useWorkspaceState();
  const [tab, setTab] = useState<ProfileTab>('overview');
  const [, setLocation] = useLocation();

  // Identity follows the signed-in user when one exists, then the workspace's
  // own settings — the same precedence the rest of the workspace reads.
  const displayName = user?.name ?? settings.displayName ?? journey.profile.name;
  const email = user?.email ?? settings.email;

  const handleSignOut = () => {
    signOut();
    setLocation('/signin');
  };

  const guide = ROADMAP_STAGE_GUIDES[journey.stageIndex];

  return (
    <AppShell>
      <div className="mx-auto max-w-[1120px]">
        <PageHeader
          eyebrow="Profile / who is building"
          title="You, in the shape of a journey."
          description="A portrait of where you are, what you are building toward, and what has moved recently."
          actions={
            <Link
              href="/settings"
              className="fluxrico-focus inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D4D5E8] bg-white px-4 text-[0.64rem] font-bold uppercase tracking-[0.13em] text-[#5B56B5] transition-colors hover:border-[#8E88E1]"
              data-testid="link-profile-settings"
            >
              <Pencil size={14} strokeWidth={1.8} /> Edit in settings
            </Link>
          }
        />

        {/* 1. Profile header — identity plus one honest journey sentence. */}
        <section
          className="fluxrico-rise mt-8 rounded-[1.65rem] border border-[#DADBF0] bg-white p-6 shadow-[0_8px_28px_rgba(44,42,123,0.045)] sm:p-8"
          aria-labelledby="profile-identity-title"
          data-testid="card-profile-identity"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
            <span
              className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-2xl bg-[#D9F5FA] text-xl font-extrabold tracking-[-0.02em] text-[#267A8D]"
              data-testid="profile-avatar"
            >
              {journey.profile.initials}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h2 id="profile-identity-title" className="text-2xl font-extrabold tracking-[-0.045em] text-[#202155]">
                  {displayName}
                </h2>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#E0F9FC] px-2.5 py-1 text-[0.56rem] font-bold uppercase tracking-[0.13em] text-[#168BA5]"
                  data-testid="badge-profile-status"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#16C6EA]" aria-hidden="true" /> {STATUS_LABEL[journey.status]}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-[#747696]">{journey.profile.title}</p>
              <p className="mt-2 text-xs leading-5 text-[#8587A3]">
                Stage {journey.stageIndex + 1} of {journey.stageTotal} — {journey.currentStageInfo.description}
              </p>
            </div>
            <div className="flex gap-8 border-t border-[#ECECF1] pt-4 sm:ml-auto sm:flex-col sm:gap-1 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0 sm:text-right">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.15em] text-[#8587A3]">GOAL</p>
                <p className="mt-1 max-w-[16rem] text-sm font-bold leading-5 text-[#343568] sm:mt-1.5">{journey.goal}</p>
              </div>
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.15em] text-[#8587A3]">NAVIGATOR</p>
                <p className={`mt-1 text-sm font-bold sm:mt-1.5 ${journey.hasNavigatorData ? 'text-[#159BB5]' : 'text-[#8587A3]'}`}>
                  {journey.hasNavigatorData ? 'Complete' : 'Not yet taken'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Journey status — stage, goal, and progress in one calm strip. */}
        <section
          className="fluxrico-rise fluxrico-rise-delay-1 mt-5 rounded-[1.65rem] border border-[#DADBF0] bg-[#F1F2FD] p-6 sm:p-7"
          aria-labelledby="profile-status-title"
          data-testid="card-profile-journey-status"
        >
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#6861C8]">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/80">
                <Signpost size={15} strokeWidth={1.8} />
              </span>
              JOURNEY STATUS
            </div>
            <p className="text-sm font-semibold text-[#4F48C5]">
              {journey.stageIndex + 1} of {journey.stageTotal} stages · {journey.stagePercent}%
            </p>
          </div>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 sm:items-center">
            <div>
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-[#8587A3]">CURRENT STAGE</p>
              <p className="mt-1.5 text-xl font-extrabold tracking-[-0.04em] text-[#28295D]">
                <span className="mr-2 text-[0.66rem] font-bold tracking-[0.12em] text-[#8B8DDA]">{journey.currentStageInfo.number}</span>
                {journey.currentStage}
              </p>
            </div>
            <div className="sm:border-l sm:border-[#DDDDF0] sm:pl-6">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-[#8587A3]">CURRENT GOAL</p>
              <p className="mt-1.5 text-sm font-bold leading-6 text-[#3A3B6C]">{journey.goal}</p>
            </div>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/80">
            <div
              className="h-full rounded-full bg-[#6857E8] transition-[width] duration-500"
              style={{ width: `${journey.stagePercent}%` }}
              data-testid="progress-profile-status"
            />
          </div>
        </section>

        {/* 3. Tabs — one set, three views, no extra chrome. */}
        <div
          className="fluxrico-rise fluxrico-rise-delay-2 mt-8 flex gap-1.5 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Profile sections"
          data-testid="tablist-profile"
        >
          {TABS.map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.key)}
                className={`fluxrico-focus inline-flex min-h-11 shrink-0 items-center rounded-full px-5 text-[0.64rem] font-bold uppercase tracking-[0.13em] transition-colors ${
                  active ? 'bg-[#211F61] text-white' : 'bg-white text-[#5B56B5] hover:bg-[#F2F1FF]'
                }`}
                data-testid={`tab-profile-${item.key}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="fluxrico-rise fluxrico-rise-delay-2 mt-5">
          {tab === 'overview' && <OverviewTab />}
          {tab === 'journey' && <JourneyTab currentStage={journey.currentStage} stagePercent={journey.stagePercent} />}
          {tab === 'activity' && <ActivityTab activity={journey.recentActivity} />}
        </div>

        {/* 4. Journey panel — grounded motivation tied to the actual stage guide. */}
        <section
          className="fluxrico-rise fluxrico-rise-delay-3 mt-5 rounded-[1.65rem] bg-[#211F61] p-6 text-white shadow-[0_15px_35px_rgba(38,34,121,0.16)] sm:p-8"
          aria-labelledby="profile-motivation-title"
          data-testid="card-profile-motivation"
        >
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-[38rem]">
              <div className="flex items-center gap-2 text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#8DDEF0]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4D47A8]">
                  <Sparkles size={15} strokeWidth={1.8} />
                </span>
                WHY THIS STAGE MATTERS
              </div>
              <h2
                id="profile-motivation-title"
                className="mt-5 text-[1.45rem] font-extrabold leading-[1.18] tracking-[-0.045em] text-[#F7F6FF]"
              >
                {journey.currentStageInfo.why}
              </h2>
              <p className="mt-3.5 max-w-[34rem] text-sm leading-6 text-[#C2C4E1]">{guide.guidance}</p>
            </div>
            <div className="shrink-0 border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-[#969BCB]">
                STAGE {journey.currentStageInfo.number} OF {String(journey.stageTotal).padStart(2, '0')}
              </p>
              <p className="mt-2 max-w-[15rem] text-sm font-semibold leading-6 text-[#D6D8F5]">
                {journey.stageIndex === 0
                  ? 'You are standing on the first stage — the path only asks for one small move.'
                  : `${journey.stageIndex} of ${journey.stageTotal} stages behind you — momentum is doing its quiet work.`}
              </p>
              <Link
                href={`/roadmap?stage=${journey.currentStage}`}
                className="fluxrico-focus mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-[#F4F3FF] px-4 text-[0.64rem] font-bold uppercase tracking-[0.14em] text-[#302B79] transition-colors hover:bg-white"
                data-testid="button-profile-continue"
              >
                Continue the journey <ArrowRight size={13} strokeWidth={2.2} />
              </Link>
            </div>
          </div>
        </section>

        {/* 5. Account actions — restrained, clearly separated from journey content. */}
        <section className="mt-8 border-t border-[#DDDEEC] pt-6" aria-labelledby="profile-account-title" data-testid="card-profile-account">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 id="profile-account-title" className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-[#6258D0]">
                Account
              </h2>
              <p className="mt-2 text-sm text-[#747696]">
                Signed in as <span className="font-bold text-[#343568]">{displayName}</span>
                {email ? <span> · {email}</span> : null}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/settings"
                className="fluxrico-focus inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D4D5E8] bg-white px-4 text-[0.64rem] font-bold uppercase tracking-[0.13em] text-[#5B56B5] transition-colors hover:border-[#8E88E1]"
                data-testid="link-profile-account-settings"
              >
                <Pencil size={13} strokeWidth={1.8} /> Account settings
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="fluxrico-focus inline-flex min-h-10 items-center gap-2 rounded-full border border-[#E3E4F2] bg-white px-4 text-[0.64rem] font-bold uppercase tracking-[0.13em] text-[#7A6464] transition-colors hover:border-[#C98B8B] hover:text-[#A05B5B]"
                data-testid="button-profile-signout"
              >
                Sign out
              </button>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-[#9A9CB3]">
            Details live in this session for now — fuller account management arrives in a later phase.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
