import { LiveTag, MiniStat, PageHero } from "@/components/tbd";

export interface DoctorDashboardCounts {
  today: number;
  confirmed: number;
  inQueue: number;
  completed: number;
}

interface DoctorDashboardSummaryCardProps {
  /** "Saturday, 3 October" */
  dateLabel: string;
  doctorName: string;
  counts: DoctorDashboardCounts;
}

const TILE = "w-full min-w-0 rounded-[14px] bg-white sm:w-28";

/** Page banner: the date, the welcome line, the shift tag and the four numbers of the day. */
export function DoctorDashboardSummaryCard({ dateLabel, doctorName, counts }: DoctorDashboardSummaryCardProps) {
  return (
    <PageHero
      eyebrow={<span suppressHydrationWarning>{dateLabel || "Today"}</span>}
      title={`Welcome, Dr. ${doctorName}`}
      badge={<LiveTag>Active shift</LiveTag>}
      className="p-[22px] [&>div]:z-[1] [&>div]:items-center"
    >
      <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto" aria-label="Today in numbers">
        <MiniStat
          className={TILE}
          value={counts.today}
          label={<span className="font-bold text-[#1d4ed8] dark:text-blue-300">Today</span>}
        />
        <MiniStat
          className={TILE}
          value={counts.confirmed}
          label={<span className="font-bold text-brand">Confirmed</span>}
        />
        <MiniStat
          className={TILE}
          value={counts.inQueue}
          label={<span className="font-bold text-[#b45309] dark:text-amber-300">In queue</span>}
        />
        <MiniStat
          className={TILE}
          value={counts.completed}
          label={<span className="font-bold text-[#334155] dark:text-slate-300">Completed</span>}
        />
      </div>
    </PageHero>
  );
}
