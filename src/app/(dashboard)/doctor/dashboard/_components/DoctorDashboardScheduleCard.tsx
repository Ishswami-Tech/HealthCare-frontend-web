"use client";

import Link from "next/link";
import { CalendarDays, Check, ChevronRight, Clock, HousePlus, Loader2, Pill as PillIcon, Play, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CellTitle,
  EmptyBlock,
  FilterChips,
  GridHead,
  GridRow,
  Pill,
  Surface,
  statusLabel,
  statusTone,
} from "@/components/tbd";
import type { DoctorAppointmentFilter, DoctorTodayRow, TransformedAppointment } from "./doctor-dashboard.logic";

interface DoctorDashboardScheduleCardProps {
  /** Today's rows after the filter chip is applied. */
  rows: DoctorTodayRow[];
  filter: DoctorAppointmentFilter;
  counts: { all: number; confirmed: number; completed: number };
  /** The visit shown in the "Now consulting" card (it is completed there, not in its row). */
  activeConsultId: string | null;
  isLoading: boolean;
  isStartPending: boolean;
  isCompletePending: boolean;
  onFilterChange: (filter: DoctorAppointmentFilter) => void;
  onJoinVideoSession: (appointmentId: string) => void;
  onStartAppointment: (appointmentId: string, doctorId: string) => void | Promise<void>;
  onOpenPrescription: (appointment: TransformedAppointment) => void;
  onOpenEhr: (patientId: string) => void;
  onCompleteAppointment: (appointmentId: string) => void | Promise<void>;
}

const COLUMNS = "1.3fr 1fr 96px 232px";

function VisitIcon({ isVideo }: { isVideo: boolean }) {
  return (
    <span
      className={`flex size-[38px] shrink-0 items-center justify-center rounded-full ${
        isVideo
          ? "bg-[#eef2ff] text-[#4f46e5] dark:bg-indigo-500/15 dark:text-indigo-300"
          : "bg-[#ecfdf5] text-[#059669] dark:bg-emerald-500/15 dark:text-emerald-300"
      }`}
      aria-hidden="true"
    >
      {isVideo ? <Video className="size-[17px]" strokeWidth={2.2} /> : <HousePlus className="size-[17px]" strokeWidth={2.2} />}
    </span>
  );
}

/** "Today's Appointments": the day's visits with the one action each row allows. */
export function DoctorDashboardScheduleCard({
  rows,
  filter,
  counts,
  activeConsultId,
  isLoading,
  isStartPending,
  isCompletePending,
  onFilterChange,
  onJoinVideoSession,
  onStartAppointment,
  onOpenPrescription,
  onOpenEhr,
  onCompleteAppointment,
}: DoctorDashboardScheduleCardProps) {
  return (
    <Surface as="section" flush aria-label="Today's appointments">
      <div className="flex flex-wrap items-center gap-3 border-b border-hair px-5 py-4">
        <h2 className="m-0 flex-1 whitespace-nowrap text-base font-bold text-ink">Today&apos;s Appointments</h2>
        <FilterChips<DoctorAppointmentFilter>
          ariaLabel="Filter today's appointments"
          value={filter}
          onChange={onFilterChange}
          options={[
            { value: "ALL", label: "All", count: counts.all },
            { value: "CONFIRMED", label: "Confirmed", count: counts.confirmed },
            { value: "COMPLETED", label: "Completed", count: counts.completed },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col" aria-busy="true" aria-label="Loading appointments">
          {[0, 1, 2].map((item) => (
            <div key={item} className="flex items-center gap-3 border-b border-hair px-5 py-3.5 last:border-b-0">
              <Skeleton className="size-[38px] rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyBlock
          icon={CalendarDays}
          title={counts.all === 0 ? "Your schedule is clear for today." : "No appointments match this filter."}
          description={
            counts.all === 0
              ? "New bookings for today show here as soon as they are confirmed."
              : "Choose All to see every appointment of the day."
          }
        />
      ) : (
        <div role="table" aria-label="Today's appointments">
          <GridHead columns={COLUMNS} labels={["Patient", "Time", "Status", "Actions"]} />
          {rows.map(({ appointment, hint, action }) => (
            <GridRow key={appointment.id} columns={COLUMNS} className="lg:min-h-16">
              <CellTitle
                left={<VisitIcon isVideo={appointment.isVideo} />}
                title={appointment.patientName}
                description={`${appointment.isVideo ? "Video call" : "In-clinic"} · ${appointment.duration}`}
              />

              <div className="flex flex-col gap-[3px]">
                <span className="text-sm font-bold text-ink">{appointment.timeLabel}</span>
                {hint ? (
                  <span
                    className={`inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold ${
                      hint.tone === "ok" ? "text-brand" : "text-ink-muted"
                    }`}
                  >
                    {hint.tone === "ok" ? (
                      <Check className="size-3 shrink-0" strokeWidth={2.6} aria-hidden="true" />
                    ) : (
                      <Clock className="size-3 shrink-0" strokeWidth={2.4} aria-hidden="true" />
                    )}
                    {hint.text}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-row flex-wrap items-start gap-1 lg:flex-col">
                <Pill tone={statusTone(appointment.statusEnum)}>{statusLabel(appointment.statusEnum)}</Pill>
                {appointment.priority === "URGENT" ? <Pill tone="rose">Urgent</Pill> : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {action === "JOIN" ? (
                  <Button variant="action" onClick={() => onJoinVideoSession(appointment.id)}>
                    <Play aria-hidden="true" />
                    Join Session
                  </Button>
                ) : null}
                {action === "START" || action === "START_LOCKED" ? (
                  <Button
                    disabled={action === "START_LOCKED" || isStartPending}
                    title={action === "START_LOCKED" ? "The patient is not checked in yet" : undefined}
                    onClick={() => onStartAppointment(appointment.id, appointment.doctorId)}
                  >
                    {isStartPending && action === "START" ? (
                      <Loader2 className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Play aria-hidden="true" />
                    )}
                    Start
                  </Button>
                ) : null}
                {action === "PRESCRIBE" ? (
                  <Button variant="soft" onClick={() => onOpenPrescription(appointment)}>
                    <PillIcon aria-hidden="true" />
                    Prescribe
                  </Button>
                ) : null}
                {action === "COMPLETE" || (action === "PRESCRIBE" && appointment.id !== activeConsultId) ? (
                  <Button disabled={isCompletePending} onClick={() => onCompleteAppointment(appointment.id)}>
                    {isCompletePending ? (
                      <Loader2 className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Check aria-hidden="true" />
                    )}
                    Complete
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  aria-label={`Open health record of ${appointment.patientName}`}
                  onClick={() => onOpenEhr(appointment.patientId)}
                >
                  EHR
                </Button>
              </div>
            </GridRow>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-hair px-5 py-3 text-[13px] text-ink-muted">
        <span>
          {counts.all} {counts.all === 1 ? "appointment" : "appointments"} today
        </span>
        <Link
          href="/doctor/appointments"
          className="inline-flex items-center gap-1 rounded-md text-[13px] font-bold text-brand hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          All appointments
          <ChevronRight className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
        </Link>
      </div>
    </Surface>
  );
}
