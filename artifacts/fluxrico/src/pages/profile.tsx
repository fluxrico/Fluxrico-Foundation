import { Compass, Pencil, Target } from 'lucide-react';
import { Link } from 'wouter';
import { AppShell, PageHeader } from '@/components/app-shell';
import { useJourney } from '@/hooks/use-journey';

export default function Profile() {
  const journey = useJourney();

  return (
    <AppShell>
      <div className="mx-auto max-w-[1120px]">
        <PageHeader
          eyebrow="Profile / who is building"
          title="You, in the shape of a journey."
          description="A small portrait of where you are, what you are building toward, and what has moved recently."
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

        <div className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="dashboard-card-lift rounded-[1.65rem] border border-[#DADBF0] bg-white p-6 shadow-[0_8px_28px_rgba(44,42,123,0.045)] sm:p-8" aria-labelledby="profile-card-title" data-testid="card-profile-identity">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D9F5FA] text-lg font-extrabold tracking-[-0.02em] text-[#267A8D]">
                {journey.profile.initials}
              </span>
              <div>
                <h2 id="profile-card-title" className="text-2xl font-extrabold tracking-[-0.045em] text-[#202155]">{journey.profile.name}</h2>
                <p className="mt-1 text-sm font-semibold text-[#747696]">{journey.profile.title}</p>
              </div>
            </div>
            <div className="mt-7 grid gap-4 border-t border-[#ECECF1] pt-6 sm:grid-cols-2">
              <div>
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#8587A3]">CURRENT STAGE</p>
                <p className="mt-1.5 text-sm font-bold text-[#343568]">{journey.currentStage}</p>
              </div>
              <div>
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#8587A3]">PROGRESS</p>
                <p className="mt-1.5 text-sm font-bold text-[#343568]">{journey.stageIndex + 1} of {journey.stageTotal} stages</p>
              </div>
              <div>
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#8587A3]">NAVIGATOR</p>
                <p className="mt-1.5 text-sm font-bold text-[#343568]">{journey.hasNavigatorData ? 'Complete' : 'Not yet taken'}</p>
              </div>
              <div>
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#8587A3]">STATUS</p>
                <p className="mt-1.5 text-sm font-bold text-[#343568]">In progress</p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.65rem] bg-[#211F61] p-6 text-white shadow-[0_15px_35px_rgba(38,34,121,0.16)] sm:p-8" aria-labelledby="profile-direction-title" data-testid="card-profile-direction">
            <div className="flex items-center gap-2 text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#8DDEF0]">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4D47A8]"><Compass size={15} strokeWidth={1.8} /></span>
              DIRECTION
            </div>
            <h2 id="profile-direction-title" className="mt-6 max-w-[26rem] text-[1.7rem] font-extrabold leading-[1.12] tracking-[-0.05em] text-[#F7F6FF]">
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
        </div>

        <section className="mt-5 rounded-[1.65rem] border border-[#DADBF0] bg-[#F1F2FD] p-6 sm:p-7" aria-labelledby="profile-goal-title" data-testid="card-profile-goal">
          <div className="flex items-center gap-2 text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#6861C8]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/80"><Target size={15} strokeWidth={1.8} /></span>
            GOAL
          </div>
          <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="text-xl font-extrabold tracking-[-0.04em] text-[#28295D]">{journey.goal}</h2>
            <p className="text-sm font-semibold text-[#4F48C5]">{journey.stageIndex + 1} of {journey.stageTotal} stages · {journey.stagePercent}%</p>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/80">
            <div className="h-full rounded-full bg-[#6857E8] transition-[width] duration-500" style={{ width: `${journey.stagePercent}%` }} />
          </div>
        </section>

        <section className="mt-5 rounded-[1.65rem] border border-[#DADBF0] bg-white p-6 shadow-[0_8px_28px_rgba(44,42,123,0.04)] sm:p-7" aria-labelledby="profile-activity-title" data-testid="card-profile-activity">
          <h2 id="profile-activity-title" className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-[#6258D0]">Recent moments</h2>
          <ul className="mt-4 divide-y divide-[#ECECF3]">
            {journey.recentActivity.map((item) => (
              <li key={item.id} className="flex flex-col gap-1 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-bold text-[#3A3B6C]">{item.label}</p>
                <p className="text-xs text-[#8587A3]">{item.detail} · {item.date}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
