"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, CircleCheck, Loader2, Pill as PillIcon, Play, Stethoscope, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyBlock, InitialsAvatar, Pill, Surface, statusLabel, statusTone } from "@/components/tbd";
import type { DoctorNextPatient, TransformedAppointment } from "./doctor-dashboard.logic";

const CARD = "border border-[#a7f3d0] dark:border-emerald-800";
const LINK =
  "inline-flex items-center gap-1 rounded-md text-[13px] font-bold text-brand hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40";

function CardStrip({ label, right }: { label: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#d1fae5] bg-[#ecfdf5] px-5 py-3 dark:border-emerald-900 dark:bg-emerald-950/30">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[1.1px] text-brand">
        <Stethoscope className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
        {label}
      </span>
      {right}
    </div>
  );
}

/** Avatar, status tags, name and the one-line summary of the visit. */
function PatientIdentity({
  appointment,
  statusPill,
  children,
}: {
  appointment: TransformedAppointment;
  statusPill: ReactNode;
  children?: ReactNode;
}) {
  const summary = [appointment.patientMeta, appointment.timeLabel, appointment.reason].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <InitialsAvatar name={appointment.patientName} size={52} />
        <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
          <div className="flex flex-wrap items-center gap-2">
            {statusPill}
            {appointment.isVideo ? <Pill tone="video">Video call</Pill> : <Pill tone="clinic">In-clinic</Pill>}
            {appointment.priority === "URGENT" ? <Pill tone="rose">Urgent</Pill> : null}
          </div>
          <span className="truncate text-xl font-extrabold leading-[1.15] tracking-[-0.3px] text-ink">
            {appointment.patientName}
          </span>
          {summary ? <span className="text-[13px] text-ink-soft">{summary}</span> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

interface DoctorDashboardNextPatientCardProps {
  nextPatient: DoctorNextPatient | null;
  isStartPending: boolean;
  onStartConsultation: () => void;
  onJoinVideoSession: (appointmentId: string) => void;
}

/** "Next patient": who is ready now and the one thing to do (start, or join the video visit). */
export function DoctorDashboardNextPatientCard({
  nextPatient,
  isStartPending,
  onStartConsultation,
  onJoinVideoSession,
}: DoctorDashboardNextPatientCardProps) {
  if (!nextPatient) {
    return (
      <Surface as="section" flush className={CARD} aria-label="Next patient">
        <CardStrip label="Next patient" />
        <EmptyBlock
          icon={Stethoscope}
          title="No patient is ready right now"
          description="A patient shows here after the front desk checks them in, or when a video visit can be joined."
          className="py-8"
        />
      </Surface>
    );
  }

  const { appointment, action, hint } = nextPatient;
  const checkedIn = !appointment.isVideo && Boolean(appointment.checkedInAt);

  return (
    <Surface as="section" flush className={CARD} aria-label="Next patient">
      <CardStrip label="Next patient" />
      <div className="flex flex-col gap-3.5 px-5 pb-5 pt-[18px]">
        <PatientIdentity
          appointment={appointment}
          statusPill={
            checkedIn ? (
              <Pill tone="green" dot>
                Checked in
              </Pill>
            ) : (
              <Pill tone={statusTone(appointment.statusEnum)} dot>
                {statusLabel(appointment.statusEnum)}
              </Pill>
            )
          }
        >
          {action === "JOIN" ? (
            <Button
              size="md"
              variant="action"
              className="w-full sm:w-auto"
              onClick={() => onJoinVideoSession(appointment.id)}
            >
              <Play aria-hidden="true" />
              Join Session
            </Button>
          ) : action === "START" || action === "WAIT_CHECK_IN" ? (
            <Button
              size="md"
              className="w-full sm:w-auto"
              disabled={action !== "START" || isStartPending}
              onClick={onStartConsultation}
            >
              {isStartPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Play aria-hidden="true" />}
              Start consultation
            </Button>
          ) : null}
        </PatientIdentity>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[13px] font-medium text-ink-muted">{hint}</span>
          <span className="flex-1" />
          <Link href={`/doctor/patients/${appointment.patientId}`} className={LINK}>
            View EHR
            <ChevronRight className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </Surface>
  );
}

interface DoctorDashboardConsultationCardProps {
  appointment: TransformedAppointment;
  consultElapsedLabel: string;
  consultSummary: string;
  /** True after the first click on "Complete without medicine": the next click completes. */
  confirmSkipMedicine: boolean;
  isCompletePending: boolean;
  isPrescriptionOpen: boolean;
  onConsultSummaryChange: (value: string) => void;
  onOpenPrescriptionForConsult: () => void;
  onToggleSkipMedicine: () => void;
  onCancelSkipMedicine: () => void;
  onCompleteWithoutMedicine: () => void;
}

/** "Now consulting": the running visit, its notes and the two ways to finish it. */
export function DoctorDashboardConsultationCard({
  appointment,
  consultElapsedLabel,
  consultSummary,
  confirmSkipMedicine,
  isCompletePending,
  isPrescriptionOpen,
  onConsultSummaryChange,
  onOpenPrescriptionForConsult,
  onToggleSkipMedicine,
  onCancelSkipMedicine,
  onCompleteWithoutMedicine,
}: DoctorDashboardConsultationCardProps) {
  return (
    <Surface as="section" flush className={CARD} aria-label="Now consulting">
      <CardStrip
        label="Now consulting"
        right={
          <span
            className="inline-flex items-center gap-1.5 text-[13px] font-extrabold tabular-nums text-brand-dark"
            aria-label={`Consultation time ${consultElapsedLabel}`}
            suppressHydrationWarning
          >
            <Timer className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
            {consultElapsedLabel}
          </span>
        }
      />
      <div className="flex flex-col gap-3.5 px-5 pb-5 pt-[18px]">
        <PatientIdentity
          appointment={appointment}
          statusPill={
            <Pill tone="blue" dot>
              In progress
            </Pill>
          }
        />

        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="consultation-notes" className="text-xs font-bold text-ink-soft">
            Consultation notes
          </label>
          <Textarea
            id="consultation-notes"
            value={consultSummary}
            maxLength={1000}
            onChange={(event) => onConsultSummaryChange(event.target.value)}
            placeholder="Symptoms, findings, diagnosis and advice"
            className="min-h-[96px] border-line"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="md"
            className="w-full sm:w-auto"
            disabled={isPrescriptionOpen}
            onClick={onOpenPrescriptionForConsult}
          >
            <PillIcon aria-hidden="true" />
            Prescribe medicines
          </Button>
          {confirmSkipMedicine ? (
            <>
              <Button
                size="md"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={isCompletePending}
                onClick={onCompleteWithoutMedicine}
              >
                {isCompletePending ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <CircleCheck aria-hidden="true" />
                )}
                Yes, complete without medicine
              </Button>
              <Button size="md" variant="ghost" disabled={isCompletePending} onClick={onCancelSkipMedicine}>
                Go back
              </Button>
            </>
          ) : (
            <Button size="md" variant="outline" className="w-full sm:w-auto" onClick={onToggleSkipMedicine}>
              <CircleCheck aria-hidden="true" />
              Complete without medicine
            </Button>
          )}
          <span className="hidden flex-1 sm:block" />
          <Link href={`/doctor/patients/${appointment.patientId}`} className={LINK}>
            Open case sheet
            <ChevronRight className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
          </Link>
        </div>
        {confirmSkipMedicine ? (
          <p className="m-0 text-[13px] text-ink-muted" role="status">
            This completes the visit with your notes. No medicine is sent to the pharmacy.
          </p>
        ) : null}
      </div>
    </Surface>
  );
}
