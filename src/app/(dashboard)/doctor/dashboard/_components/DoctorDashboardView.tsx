"use client";

import { CircleAlert } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Note } from "@/components/tbd";
import { VIDEO_JOIN_EARLY_WINDOW_MINUTES } from "@/lib/utils/appointmentUtils";
import { DoctorDashboardConsultationCard, DoctorDashboardNextPatientCard } from "./DoctorDashboardConsultationCard";
import {
  DoctorDashboardOpenVisitReminder,
  DoctorDashboardOpenVisitsCard,
  type OpenVideoVisit,
} from "./DoctorDashboardOpenVisitsCard";
import { DoctorDashboardQueueCard } from "./DoctorDashboardQueueCard";
import { DoctorDashboardScheduleCard } from "./DoctorDashboardScheduleCard";
import { DoctorDashboardSentBanner } from "./DoctorDashboardSentBanner";
import { DoctorDashboardSidebar } from "./DoctorDashboardSidebar";
import { DoctorDashboardSummaryCard, type DoctorDashboardCounts } from "./DoctorDashboardSummaryCard";
import type {
  CompletedVisitSummary,
  DoctorAppointmentFilter,
  DoctorNextPatient,
  DoctorQueueLine,
  DoctorTodayRow,
  TransformedAppointment,
} from "./doctor-dashboard.logic";

export interface DoctorDashboardViewProps {
  dateLabel: string;
  doctorName: string;
  counts: DoctorDashboardCounts;

  /** The visit that was just completed, with what was really saved. */
  completedVisit: CompletedVisitSummary | null;

  openVideoVisits: OpenVideoVisit[];
  nowMs: number;

  /** The in-clinic consultation that is running now; null shows the "Next patient" card. */
  consult: {
    appointment: TransformedAppointment;
    elapsedLabel: string;
    notes: string;
    confirmSkipMedicine: boolean;
  } | null;
  nextPatient: DoctorNextPatient | null;

  rows: DoctorTodayRow[];
  filter: DoctorAppointmentFilter;
  filterCounts: { all: number; confirmed: number; completed: number };
  isLoadingAppointments: boolean;

  queueLines: DoctorQueueLine[];

  isStartPending: boolean;
  isCompletePending: boolean;
  isPrescriptionOpen: boolean;

  onFilterChange: (filter: DoctorAppointmentFilter) => void;
  onStartConsultation: () => void;
  onStartAppointment: (appointmentId: string, doctorId: string) => void | Promise<void>;
  onJoinVideoSession: (appointmentId: string) => void;
  onOpenPrescription: (appointment: TransformedAppointment) => void;
  onOpenPrescriptionForConsult: () => void;
  onOpenEhr: (patientId: string) => void;
  onCompleteAppointment: (appointmentId: string) => void | Promise<void>;
  onConsultNotesChange: (value: string) => void;
  onToggleSkipMedicine: () => void;
  onCancelSkipMedicine: () => void;
  onCompleteWithoutMedicine: () => void;
}

/** The doctor dashboard layout. Props only: the data hooks live in `DoctorDashboardContent`. */
export function DoctorDashboardView(props: DoctorDashboardViewProps) {
  return (
    <DashboardPageShell>
      <DoctorDashboardSummaryCard dateLabel={props.dateLabel} doctorName={props.doctorName} counts={props.counts} />

      <DoctorDashboardSentBanner visit={props.completedVisit} />

      <DoctorDashboardOpenVisitsCard
        visits={props.openVideoVisits}
        nowMs={props.nowMs}
        onRejoin={props.onJoinVideoSession}
        onOpenPrescription={props.onOpenPrescription}
        onCompleteAppointment={props.onCompleteAppointment}
        isCompletePending={props.isCompletePending}
      />

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          {props.consult ? (
            <DoctorDashboardConsultationCard
              appointment={props.consult.appointment}
              consultElapsedLabel={props.consult.elapsedLabel}
              consultSummary={props.consult.notes}
              confirmSkipMedicine={props.consult.confirmSkipMedicine}
              isCompletePending={props.isCompletePending}
              isPrescriptionOpen={props.isPrescriptionOpen}
              onConsultSummaryChange={props.onConsultNotesChange}
              onOpenPrescriptionForConsult={props.onOpenPrescriptionForConsult}
              onToggleSkipMedicine={props.onToggleSkipMedicine}
              onCancelSkipMedicine={props.onCancelSkipMedicine}
              onCompleteWithoutMedicine={props.onCompleteWithoutMedicine}
            />
          ) : (
            <DoctorDashboardNextPatientCard
              nextPatient={props.nextPatient}
              isStartPending={props.isStartPending}
              onStartConsultation={props.onStartConsultation}
              onJoinVideoSession={props.onJoinVideoSession}
            />
          )}

          <DoctorDashboardScheduleCard
            rows={props.rows}
            filter={props.filter}
            counts={props.filterCounts}
            activeConsultId={props.consult?.appointment.id ?? null}
            isLoading={props.isLoadingAppointments}
            isStartPending={props.isStartPending}
            isCompletePending={props.isCompletePending}
            onFilterChange={props.onFilterChange}
            onJoinVideoSession={props.onJoinVideoSession}
            onStartAppointment={props.onStartAppointment}
            onOpenPrescription={props.onOpenPrescription}
            onOpenEhr={props.onOpenEhr}
            onCompleteAppointment={props.onCompleteAppointment}
          />

          <Note tone="amber" icon={CircleAlert}>
            Consultation starts only after the patient is checked in. Video join opens{" "}
            {VIDEO_JOIN_EARLY_WINDOW_MINUTES} minutes before the slot and stays locked until payment is confirmed.
            Medicine packing and dispatch are handled by the medicine desk after the prescription is saved.
          </Note>
        </div>

        <aside className="flex min-w-0 flex-col gap-5" aria-label="Queue and tools">
          <DoctorDashboardQueueCard lines={props.queueLines} />
          <DoctorDashboardSidebar />
          <DoctorDashboardOpenVisitReminder visits={props.openVideoVisits} />
        </aside>
      </div>
    </DashboardPageShell>
  );
}
