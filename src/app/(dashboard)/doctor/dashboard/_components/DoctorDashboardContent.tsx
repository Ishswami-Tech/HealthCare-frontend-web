"use client";

import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyBlock, Surface } from "@/components/tbd";
import { QuickPrescriptionModal } from "@/components/doctor/QuickPrescriptionModal";
import { DoctorDashboardView } from "./DoctorDashboardView";
import { useDoctorDashboardData } from "./useDoctorDashboardData";

export default function DoctorDashboardContent() {
  const data = useDoctorDashboardData();

  if (data.appointmentsError && data.appointmentsArray.length === 0) {
    return (
      <Surface flush className="mx-auto mt-10 w-full max-w-xl" role="alert">
        <EmptyBlock
          icon={CircleAlert}
          title="We could not load your appointments"
          description="Please check your connection and try again."
          action={
            <Button size="md" variant="outline" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          }
        />
      </Surface>
    );
  }

  const isLoadingAppointments =
    data.isAppointmentsPending && data.appointmentsArray.length === 0 && !data.hasAppointmentsLoadedForSession;
  const modalAppointment = data.prescriptionAppointment;
  const isModalForConsult = Boolean(modalAppointment && modalAppointment.id === data.activeConsult?.id);

  return (
    <>
      <DoctorDashboardView
        dateLabel={data.dashboardTodayLabel}
        doctorName={data.displayDoctorName}
        counts={{
          today: data.appointmentCounts.all,
          confirmed: data.appointmentCounts.confirmed,
          inQueue: data.queueLines.length,
          completed: data.appointmentCounts.completed,
        }}
        completedVisit={data.lastCompletedVisit}
        openVideoVisits={data.openVideoVisits}
        nowMs={data.nowMs}
        consult={
          data.isConsultInProgress && data.activeConsult
            ? {
                appointment: data.activeConsult,
                elapsedLabel: data.consultElapsedLabel,
                notes: data.consultSummary,
                confirmSkipMedicine: data.prescriptionModal.skipMedicineSelected,
              }
            : null
        }
        nextPatient={data.nextPatient}
        rows={data.filteredTodayRows}
        filter={data.appointmentFilter}
        filterCounts={data.appointmentCounts}
        isLoadingAppointments={isLoadingAppointments}
        queueLines={data.queueLines}
        isStartPending={data.isStartPending}
        isCompletePending={data.isCompletePending}
        isPrescriptionOpen={data.prescriptionModal.isOpen}
        onFilterChange={data.onAppointmentFilterChange}
        onStartConsultation={data.onStartConsultation}
        onStartAppointment={data.onStartAppointment}
        onJoinVideoSession={data.onJoinVideoSession}
        onOpenPrescription={data.onOpenPrescription}
        onOpenPrescriptionForConsult={data.onOpenPrescriptionForConsult}
        onOpenEhr={data.onOpenEhr}
        onCompleteAppointment={data.onCompleteAppointment}
        onConsultNotesChange={data.onConsultSummaryChange}
        onToggleSkipMedicine={data.onToggleSkipMedicine}
        onCancelSkipMedicine={data.onCancelSkipMedicine}
        onCompleteWithoutMedicine={data.onCompleteWithoutMedicine}
      />

      <QuickPrescriptionModal
        isOpen={data.prescriptionModal.isOpen}
        onClose={data.onClosePrescriptionModal}
        appointmentId={data.prescriptionModal.activeAppointmentId || ""}
        patientId={data.prescriptionModal.activePatient?.id || ""}
        patientName={data.prescriptionModal.activePatient?.name || ""}
        doctorId={data.doctorEntityId}
        patientSummary={modalAppointment?.patientMeta || ""}
        visitLabel={
          modalAppointment
            ? `${modalAppointment.isVideo ? "Video call" : "In-clinic"} · ${modalAppointment.timeLabel}`
            : ""
        }
        visitStatus={modalAppointment?.statusEnum || ""}
        consultationNotes={isModalForConsult ? data.consultSummary : ""}
        onSaved={data.onPrescriptionSaved}
      />
    </>
  );
}
