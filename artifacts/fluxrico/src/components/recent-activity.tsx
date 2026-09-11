import { ArrowUpRight, PenLine } from 'lucide-react';
import type { JourneyActivity } from '@/lib/journey';

type RecentActivityProps = {
  activity: JourneyActivity[];
  onViewAll: () => void;
};

export function RecentActivity({ activity, onViewAll }: RecentActivityProps) {
  return (
    <section className="rounded-[1.65rem] border border-[#DADBF0] bg-white p-6 shadow-[0_8px_28px_rgba(44,42,123,0.04)] sm:p-7" aria-labelledby="activity-title" data-testid="card-recent-activity">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#6861C8]">The thread</p>
          <h2 id="activity-title" className="mt-2 text-xl font-extrabold tracking-[-0.045em] text-[#25265A]">Recent activity</h2>
        </div>
        <button type="button" onClick={onViewAll} className="fluxrico-focus rounded-md px-2 py-1 text-[0.63rem] font-bold uppercase tracking-[0.13em] text-[#5D56C9] hover:bg-[#F2F1FF]" data-testid="button-view-all-activity">View all</button>
      </div>
      <ul className="mt-6 divide-y divide-[#ECECF3]">
        {activity.map((item, index) => (
          <li key={item.id} className="flex gap-3 py-4 first:pt-0 last:pb-0" data-testid={`activity-${item.id}`}>
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${index === 0 ? 'bg-[#E4F9FC] text-[#159BB5]' : 'bg-[#F2F1FF] text-[#7068D0]'}`}>
              {index === 0 ? <PenLine size={15} strokeWidth={1.8} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col justify-between gap-1 sm:flex-row sm:gap-3">
                <p className="flex min-w-0 items-center gap-2 text-sm font-bold text-[#3A3B6C]">
                  <span className="truncate">{item.label}</span>
                  {item.sample && (
                    <span className="shrink-0 rounded-full border border-[#E0E1F0] bg-[#FAFAFE] px-2 py-0.5 text-[0.54rem] font-bold uppercase tracking-[0.12em] text-[#8A8CAD]">
                      Sample
                    </span>
                  )}
                </p>
                <time className="text-[0.64rem] font-medium text-[#9A9CB3]">{item.date}</time>
              </div>
              <p className="mt-1 text-xs leading-5 text-[#8587A3]">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
