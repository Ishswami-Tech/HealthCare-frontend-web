"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Textarea } from "@/components/ui/textarea";
import {
  formatDateInIST,
  getAppointmentPatientName,
  getReceptionistAppointmentDateLabel,
  getReceptionistAppointmentTimeLabel,
} from "@/lib/utils/appointmentUtils";
import type { AppointmentWithRelations } from "@/types/appointment.types";
import { AlertCircle, CheckCircle, Clock, Loader2, Pill, Play } from "lucide-react";
import type { PrescriptionModalState } from "./doctor-dashboard.logic";

interface DoctorDashboardConsultationCardProps {
  currentInPersonConsult: AppointmentWithRelations | null;
  doctorDisplayName: string;
  consultSummary: string;
  consultElapsedLabel: string;
  currentConsultStartedAtMs: number | null;
  consultationState: {
    isConsultInProgress: boolean;
    canStartConsultation: boolean;
  };
  actionState: {
    isStartPending: boolean;
    isCompletePending: boolean;
  };
  prescriptionModal: PrescriptionModalState;
  onConsultSummaryChange: (value: string) => void;
  onStartConsultation: () => void;
  onOpenPrescriptionForConsult: () => void;
  onToggleSkipMedicine: () => void;
  onCompleteWithoutMedicine: () => void;
}

export function DoctorDashboardConsultationCard({
  currentInPersonConsult,
  doctorDisplayName,
  consultSummary,
  consultElapsedLabel,
  currentConsultStartedAtMs,
  consultationState,
  actionState,
  prescriptionModal,
  onConsultSummaryChange,
  onStartConsultation,
  onOpenPrescriptionForConsult,
  onToggleSkipMedicine,
  onCompleteWithoutMedicine,
}: DoctorDashboardConsultationCardProps) {
  // COMMENTED: In-person consultation disabled while only video appointments are supported.
  // Uncomment the JSX below to re-enable the in-person consultation card.
  return null;
  /*
  return (
    <Card className="overflow-hidden border-l-2 border-l-emerald-500 shadow-sm">
      <CardHeader className="border-b border-border bg-muted/40 px-4 py-3 dark:bg-muted/20">
        <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
          <Clock className="size-4 text-emerald-600" />
          In-Person Consultation
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-4 p-4">
        {currentInPersonConsult ? (
          <>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-col gap-y-2">
                <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                >
                    {consultationState.isConsultInProgress ? "In progress" : "Ready to start"}
                  </Badge>
                  <Badge variant="outline" className="border-border bg-background text-foreground">
                    {currentInPersonConsult.type}
                  </Badge>
                  <Badge variant="outline" className="border-border bg-background text-foreground">
                    {doctorDisplayName}
                  </Badge>
                </div>
                <div className="text-xl font-semibold text-foreground">
                  {getAppointmentPatientName(currentInPersonConsult)}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{getReceptionistAppointmentDateLabel(currentInPersonConsult as unknown as Record<string, unknown>)}</span>
                  <span>·</span>
                  <span>{getReceptionistAppointmentTimeLabel(currentInPersonConsult as unknown as Record<string, unknown>)}</span>
                  <span>·</span>
                  <span>Session {currentInPersonConsult.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span suppressHydrationWarning>
                    Checked in: {currentInPersonConsult.checkedInAt ? formatDateInIST(new Date(currentInPersonConsult.checkedInAt), {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    }) : "Not yet"}
                  </span>
                  {currentConsultStartedAtMs && (
                    <span suppressHydrationWarning>
                      Started: {formatDateInIST(new Date(currentConsultStartedAtMs), {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex w-full min-w-0 flex-col gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100 sm:min-w-[180px]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                  Consultation timer
                </div>
                <div className="text-3xl font-bold leading-none">
                  {consultationState.isConsultInProgress ? consultElapsedLabel : "0:00"}
                </div>
                <div className="text-xs text-emerald-700/80 dark:text-emerald-200/80">
                  {consultationState.isConsultInProgress ? "Live consult duration" : "Timer starts after consultation begins"}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-y-2">
              <label htmlFor="consultation-summary" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Consultation summary
              </label>
              <Textarea
                id="consultation-summary"
                value={consultSummary}
                onChange={(event) => onConsultSummaryChange(event.target.value)}
                placeholder="Symptoms, exam findings, diagnosis, and treatment summary"
                className="min-h-[96px]"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
              <Button
                onClick={onStartConsultation}
                disabled={!consultationState.canStartConsultation || actionState.isStartPending}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
              >
                {actionState.isStartPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Play className="mr-2 size-4" />}
                Start Consultation
              </Button>
              <Button
                variant="outline"
                onClick={onOpenPrescriptionForConsult}
                disabled={!currentInPersonConsult || !consultationState.isConsultInProgress || prescriptionModal.isOpen}
                className="w-full sm:w-auto"
              >
                <Pill className="mr-2 size-4" />
                Add Prescription
              </Button>
              <Button
                variant={prescriptionModal.skipMedicineSelected ? "default" : "outline"}
                onClick={onToggleSkipMedicine}
                disabled={!currentInPersonConsult || !consultationState.isConsultInProgress}
                className={`w-full sm:w-auto ${prescriptionModal.skipMedicineSelected ? "bg-amber-600 text-white hover:bg-amber-700" : ""}`}
              >
                <AlertCircle className="mr-2 size-4" />
                Skip Medicine
              </Button>
              <Button
                variant="outline"
                onClick={onCompleteWithoutMedicine}
                  disabled={
                    !currentInPersonConsult ||
                    !consultationState.isConsultInProgress ||
                    !prescriptionModal.skipMedicineSelected ||
                    actionState.isCompletePending
                  }
                className="w-full sm:w-auto"
              >
                {actionState.isCompletePending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle className="mr-2 size-4" />}
                Complete Appointment
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground dark:bg-muted/20">
              {prescriptionModal.skipMedicineSelected
                ? "Medicine will be skipped and the consult will be completed with the recorded summary."
                : consultationState.isConsultInProgress
                  ? "Provide a prescription or mark this consult as medicine-skipped before completion."
                  : "Check the patient in and start the consultation to activate the timer."}
            </div>
          </>
        ) : (
          <Empty className="!p-2.5 md:!p-3 gap-1.5">
            <EmptyContent className="gap-1.5">
              <EmptyMedia className="mb-0">
                <Clock className="size-4" />
              </EmptyMedia>
              <EmptyTitle className="text-sm font-semibold leading-tight">
                No checked-in in-person patient is ready right now.
              </EmptyTitle>
              <EmptyDescription className="text-[11px] leading-snug">
                Reception will move a patient here once check-in is completed and the consult is ready to begin.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
  */
}
