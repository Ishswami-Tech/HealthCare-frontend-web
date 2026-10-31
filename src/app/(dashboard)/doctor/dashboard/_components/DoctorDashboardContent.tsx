"use client";

import { LoadErrorAlert } from "@/components/patient/LoadErrorAlert";
import { SlowLoadNotice } from "@/components/common/SlowLoadNotice";
import { QuickPrescriptionModal } from "@/components/doctor/QuickPrescriptionModal";
import { DoctorDashboardView } from "./DoctorDashboardView";
import { useDoctorDashboardData } from "./useDoctorDashboardData";

export default function DoctorDashboardContent() {
  const data = useDoctorDashboardData();

  if (data.appointmentsError && data.appointmentsArray.length === 0) {
    return (
      <LoadErrorAlert
        className="mx-auto mt-10 w-full max-w-xl"
        title="We could not load your appointments"
        detail="Please check your connection and try again."
        onRetry={() => void data.refetchAppointments()}
      />
    );
  }

  const isLoadingAppointments =
    data.isAppointmentsPending && data.appointmentsArray.length === 0 && !data.hasAppointmentsLoadedForSession;
  const modalAppointment = data.prescriptionAppointment;
  const isModalForConsult = Boolean(modalAppointment && modalAppointment.id === data.activeConsult?.id);

  return (
    <>
      <SlowLoadNotice
        loading={isLoadingAppointments}
        onRetry={() => void data.refetchAppointments()}
        className="mb-4"
      />
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
        followUpLines={data.followUpLines}
        isStartPending={data.isStartPending}
        isCompletePending={data.isCompletePending}
        isPrescriptionOpen={data.prescriptionModal.isOpen}
        onFilterChange={data.onAppointmentFilterChange}
        onStartConsultation={data.onStartConsultation}
        onStartAppointment={data.onStartAppointment}
        onJoinVideoSession={data.onJoinVideoSession}
        onOpenPrescription={data.onOpenPrescription}
        onOpenPrescriptionForConsult={data.onOpenPrescriptionForConsult}
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
