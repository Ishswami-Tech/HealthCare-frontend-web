import Link from "next/link";
import { ArrowRight, CalendarCheck2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-utils";
import { cn } from "@/lib/utils";
import { EmptyBlock, Surface } from "@/components/tbd";
import type { DoctorFollowUpLine } from "./doctor-dashboard.logic";

interface DoctorDashboardFollowUpsCardProps {
  /** The doctor's own upcoming review visits, soonest first (up to 5). */
  lines: DoctorFollowUpLine[];
}

/**
 * Right rail "Follow-ups": upcoming review visits booked from an earlier visit's "Book
 * follow-up" step. Read only here; "View all" opens the full list on Appointments.
 */
export function DoctorDashboardFollowUpsCard({ lines }: DoctorDashboardFollowUpsCardProps) {
  return (
    <Surface as="section" className="gap-2.5 p-[18px]" aria-label="Follow-ups">
      <h2 className="m-0 text-base font-bold text-ink">Follow-ups</h2>
      <p className="m-0 text-[13px] font-medium text-ink-muted">
        Upcoming review visits booked from an earlier visit.
      </p>

      {lines.length === 0 ? (
        <EmptyBlock
          icon={CalendarCheck2}
          title="No follow-ups booked"
          description="They show here once booked from a visit's 'Book follow-up' step."
          className="px-2 py-6"
        />
      ) : (
        <ol className="m-0 flex list-none flex-col p-0">
          {lines.map((line) => (
            <li key={line.key} className="flex items-center gap-3 border-b border-hair py-[11px] last:border-b-0">
              <span className="flex min-w-0 flex-1 flex-col gap-px">
                <span className="truncate text-sm font-bold text-ink">{line.patientName}</span>
                <span className="truncate text-xs text-ink-muted">{line.dateLabel}</span>
              </span>
              {line.timeLabel ? (
                <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-ink-soft">
                  {line.timeLabel}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      <Link
        href="/doctor/appointments?isFollowUp=true"
        className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full px-3.5")}
      >
        View all
        <ArrowRight aria-hidden="true" />
      </Link>
    </Surface>
  );
}
