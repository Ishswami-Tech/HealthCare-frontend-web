"use client";

import Link from "next/link";
import { CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CellTitle, EmptyBlock, GridHead, GridRow, InitialsAvatar, LoadError, Pill, SkeletonRows, VisitTypeChip } from "@/components/tbd";
import type { TransformedAppointment } from "@/app/(dashboard)/doctor/dashboard/_components/doctor-dashboard.logic";
import { appointmentStage, canPrepareDraft, STAGE_LABELS } from "./assistant-day.logic";
import { ASSISTANT_ROUTES } from "./assistant-routes";

const COLUMNS = "minmax(200px,1.5fr) 150px 150px minmax(220px,1.2fr)";

/**
 * Appointment rows as the assistant works them: where the patient is (checked in, with the
 * doctor), and what the assistant may do (open the EHR, prepare a draft, follow the visit).
 * No start / complete / call: only the doctor runs a visit. No amounts.
 */
export function AssistantAppointmentsTable({
  appointments,
  loading,
  error,
  onRetry,
  emptyTitle = "No appointments",
  emptyDescription = "Nothing is booked for this day.",
}: {
  appointments: readonly TransformedAppointment[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (error) return <LoadError title="Appointments could not be loaded" onRetry={onRetry} />;
  if (loading) return <SkeletonRows rows={4} />;
  if (appointments.length === 0) return <EmptyBlock icon={CalendarX} title={emptyTitle} description={emptyDescription} />;

  return (
    <div role="table" aria-label="Appointments">
      <GridHead columns={COLUMNS} labels={["Patient", "Time", "Status", ""]} />
      {appointments.map((appointment) => {
        const stage = appointmentStage(appointment);
        const meta = STAGE_LABELS[stage];
        return (
          <GridRow key={appointment.id} columns={COLUMNS}>
            <CellTitle
              left={<InitialsAvatar name={appointment.patientName} size={36} />}
              title={appointment.patientName || "Patient"}
              description={[appointment.patientMeta, appointment.reason].filter(Boolean).join(" · ")}
            />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-ink">{appointment.timeLabel}</span>
              <span className="text-xs text-ink-muted">{appointment.scheduleState === "TODAY" ? "Today" : appointment.dateLabel}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Pill tone={meta.tone}>{meta.label}</Pill>
              {stage !== "VIDEO" ? <VisitTypeChip type={appointment.isVideo ? "VIDEO_CALL" : "IN_PERSON"} /> : null}
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {canPrepareDraft(stage) && appointment.patientId ? (
                <Button asChild size="compact">
                  <Link href={ASSISTANT_ROUTES.prescribe({ patientId: appointment.patientId, appointmentId: appointment.id })}>Rx draft</Link>
                </Button>
              ) : null}
              {!appointment.isVideo && stage !== "CLOSED" ? (
                <Button asChild size="compact" variant="outline">
                  <Link href={ASSISTANT_ROUTES.visit(appointment.id)}>Visit</Link>
                </Button>
              ) : null}
              {appointment.patientId ? (
                <Button asChild size="compact" variant="outline">
                  <Link href={ASSISTANT_ROUTES.patient(appointment.patientId)}>EHR</Link>
                </Button>
              ) : null}
            </div>
          </GridRow>
        );
      })}
    </div>
  );
}
