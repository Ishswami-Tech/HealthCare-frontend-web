"use client";

import { Bell, Check, Clock, Loader2, Pill as PillIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBox, Pill, Surface, TBD_SURFACE } from "@/components/tbd";
import { cn } from "@/lib/utils";
import type { TransformedAppointment } from "./doctor-dashboard.logic";

export interface OpenVideoVisit {
  appointment: TransformedAppointment;
  /** When the visit window closes and the visit expires if it is still open. */
  expiresAtMs: number;
}

interface DoctorDashboardOpenVisitsCardProps {
  visits: OpenVideoVisit[];
  nowMs: number;
  onRejoin: (appointmentId: string) => void;
  onOpenPrescription: (appointment: TransformedAppointment) => void;
  onCompleteAppointment: (appointmentId: string) => void | Promise<void>;
  isCompletePending: boolean;
}

const CLOSING_SOON_MS = 30 * 60_000;

const closeTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});

function formatTimeLeft(remainingMs: number): string {
  const totalMinutes = Math.max(1, Math.ceil(remainingMs / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes} min left`;
  }
  return minutes === 0 ? `${hours} h left` : `${hours} h ${minutes} min left`;
}

/**
 * "Complete this visit": video visits the doctor started and has not completed.
 * A video visit is completed only by its doctor and expires when its window closes,
 * so these stay at the top of the dashboard until they are completed.
 */
export function DoctorDashboardOpenVisitsCard({
  visits,
  nowMs,
  onRejoin,
  onOpenPrescription,
  onCompleteAppointment,
  isCompletePending,
}: DoctorDashboardOpenVisitsCardProps) {
  if (visits.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Complete this visit"
      data-testid="open-video-visits"
      className={cn(TBD_SURFACE, "flex flex-col gap-3.5 border-l-4 border-l-[#047857] px-[22px] py-[18px] dark:border-l-emerald-500")}
    >
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <Check className="size-5 shrink-0 text-brand" strokeWidth={2.6} aria-hidden="true" />
        <h2 className="m-0 text-lg font-extrabold text-ink">Complete this visit</h2>
        <Pill tone="green">{visits.length} open</Pill>
        <span className="hidden flex-1 lg:block" />
        <p className="m-0 w-full text-[13px] text-ink-muted lg:w-auto">
          Only you can complete a video visit. If it is still open at its closing time, it expires.
        </p>
      </div>

      {visits.map(({ appointment, expiresAtMs }) => {
        const remainingMs = expiresAtMs - nowMs;
        const closingSoon = remainingMs <= CLOSING_SOON_MS;

        return (
          <div
            key={appointment.id}
            className="flex flex-col gap-3.5 rounded-2xl border border-hair bg-[#f8fafc] px-4 py-3.5 dark:bg-white/5 lg:flex-row lg:items-center"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3.5">
              <IconBox icon={Video} tone="video" size={46} className="!rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
                <span className="truncate text-base font-extrabold text-ink">{appointment.patientName}</span>
                <span className="flex flex-wrap items-center gap-2 text-[13px] text-ink-soft">
                  Video visit · {appointment.timeLabel}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
                      closingSoon
                        ? "bg-[#ffe4e6] text-[#be123c] dark:bg-rose-500/15 dark:text-rose-300"
                        : "bg-[#d1fae5] text-[#065f46] dark:bg-emerald-500/15 dark:text-emerald-300",
                    )}
                    suppressHydrationWarning
                  >
                    <Clock className="size-[13px]" strokeWidth={2.4} aria-hidden="true" />
                    Closes at {closeTimeFormatter.format(new Date(expiresAtMs))} · {formatTimeLeft(remainingMs)}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
              <Button
                size="md"
                variant="video"
                className="rounded-[14px] border border-[#c7d2fe] dark:border-indigo-800"
                onClick={() => onRejoin(appointment.id)}
              >
                <Video aria-hidden="true" />
                Rejoin call
              </Button>
              <Button size="md" variant="outline" onClick={() => onOpenPrescription(appointment)}>
                <PillIcon aria-hidden="true" />
                Prescribe
              </Button>
              <Button
                size="md"
                disabled={isCompletePending}
                onClick={() => onCompleteAppointment(appointment.id)}
              >
                {isCompletePending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
                Complete visit
              </Button>
            </div>
          </div>
        );
      })}
    </section>
  );
}

/**
 * Right rail note for an open video visit: the same message the doctor gets as a reminder
 * (the server sends it 45 minutes after the visit time and again 30 minutes before closing).
 */
export function DoctorDashboardOpenVisitReminder({ visits }: { visits: OpenVideoVisit[] }) {
  if (visits.length === 0) {
    return null;
  }

  return (
    <Surface as="section" className="gap-3 p-[18px]" aria-label="Reminder">
      <span className="text-[11px] font-extrabold uppercase tracking-[1px] text-ink-muted">Reminder</span>
      {visits.map(({ appointment, expiresAtMs }) => (
        <div
          key={appointment.id}
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-line p-3.5 shadow-[0_10px_24px_rgba(15,27,45,0.10)] dark:shadow-none"
        >
          <IconBox icon={Bell} tone="mint" size={36} />
          <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <span className="text-sm font-extrabold text-ink">Complete this visit</span>
            <span className="text-[13px] leading-normal text-ink-soft" suppressHydrationWarning>
              Your video visit with {appointment.patientName} is still open. Complete it before{" "}
              {closeTimeFormatter.format(new Date(expiresAtMs))}, or it will expire.
            </span>
          </span>
        </div>
      ))}
      <span className="text-xs leading-normal text-ink-muted">
        You get this reminder 45 minutes after the visit time, and again 30 minutes before it closes.
      </span>
    </Surface>
  );
}
