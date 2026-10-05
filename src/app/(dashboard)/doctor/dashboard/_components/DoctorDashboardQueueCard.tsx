import Link from "next/link";
import { ArrowRight, Clock, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-utils";
import { cn } from "@/lib/utils";
import { EmptyBlock, LiveTag, Pill, Surface } from "@/components/tbd";
import type { DoctorQueueLine } from "./doctor-dashboard.logic";

interface DoctorDashboardQueueCardProps {
  /** In-clinic, checked-in patients in the order they will be seen. */
  lines: DoctorQueueLine[];
}

const STATUS_PILL: Record<DoctorQueueLine["status"], { tone: "blue" | "green" | "amber"; label: string }> = {
  IN_PROGRESS: { tone: "blue", label: "In progress" },
  CHECKED_IN: { tone: "green", label: "Checked in" },
  QUEUED: { tone: "amber", label: "Queued" },
};

/** Right rail "Live Queue": read only, the queue itself is worked from the Queue page. */
export function DoctorDashboardQueueCard({ lines }: DoctorDashboardQueueCardProps) {
  return (
    <Surface as="section" className="gap-2.5 p-[18px]" aria-label="Live queue">
      <div className="flex items-center gap-2.5">
        <h2 className="m-0 flex-1 text-base font-bold text-ink">Live Queue</h2>
        <LiveTag>Live</LiveTag>
      </div>
      <p className="m-0 text-[13px] font-medium text-ink-muted">
        Checked-in patients, in the order they will be seen.
      </p>

      {lines.length === 0 ? (
        <EmptyBlock
          icon={Users}
          title="No one is waiting"
          description="Patients show here after they check in at the clinic."
          className="px-2 py-6"
        />
      ) : (
        <ol className="m-0 flex list-none flex-col p-0">
          {lines.map((line) => {
            const pill = STATUS_PILL[line.status];
            return (
              <li key={line.key} className="flex items-center gap-3 border-b border-hair py-[11px] last:border-b-0">
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-well text-xs font-extrabold text-ink-soft"
                  aria-label={`Position ${line.position}`}
                >
                  {line.position}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-px">
                  <span className="truncate text-sm font-bold text-ink">{line.patientName}</span>
                  <span className="truncate text-xs text-ink-muted">{line.label}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <Pill tone={pill.tone}>{pill.label}</Pill>
                  {line.status === "IN_PROGRESS" ? (
                    <span className="text-xs text-ink-muted">Now</span>
                  ) : line.waitMinutes !== null ? (
                    <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-ink-soft">
                      <Clock className="size-3" strokeWidth={2.4} aria-hidden="true" />
                      {line.waitMinutes} min
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <Link href="/queue" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full px-3.5")}>
        Open queue
        <ArrowRight aria-hidden="true" />
      </Link>
    </Surface>
  );
}
