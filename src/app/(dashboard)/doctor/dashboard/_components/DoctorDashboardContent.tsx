"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { QuickPrescriptionModal } from "@/components/doctor/QuickPrescriptionModal";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { DoctorDashboardSummaryCard } from "./DoctorDashboardSummaryCard";
import { DoctorDashboardConsultationCard } from "./DoctorDashboardConsultationCard";
import { DoctorDashboardQueueCard } from "./DoctorDashboardQueueCard";
import { DoctorDashboardScheduleCard } from "./DoctorDashboardScheduleCard";
import { DoctorDashboardSidebar } from "./DoctorDashboardSidebar";
import { useDoctorDashboardData } from "./useDoctorDashboardData";
import { Video, Users } from "lucide-react";

export default function DoctorDashboardContent() {
  const data = useDoctorDashboardData();

  if (data.isAppointmentsPending && data.appointmentsArray.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          <p className="font-medium text-emerald-700">Loading your clinical workspace…</p>
        </div>
      </div>
    );
  }

  if (data.appointmentsError && data.appointmentsArray.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertCircle className="size-8" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-foreground">Workspace Connection Issue</h3>
        <p className="mb-6 max-w-sm text-muted-foreground">
          We could not load your appointments. Please check your connection and try again.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Refresh Workspace
        </Button>
      </div>
    );
  }

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Doctor Dashboard"
        title={`Welcome, Dr. ${data.displayDoctorName}`}
        description={`Today is ${data.dashboardTodayLabel || "today"}. Manage checked-in patients, video visits, and prescriptions from one workspace.`}
        meta={data.meta}
        actions={[
          {
            label: "Appointments",
            href: "/doctor/appointments",
            icon: <Video className="size-4" />,
          },
          {
            label: "Patient Directory",
            href: "/doctor/patients",
            icon: <Users className="size-4" />,
          },
        ]}
      />

      <DoctorDashboardSummaryCard dashboardTodayLabel={data.dashboardTodayLabel} stats={data.stats} />

      <DoctorDashboardConsultationCard
        currentInPersonConsult={data.currentInPersonConsult}
        doctorDisplayName={data.displayDoctorName}
        consultSummary={data.consultSummary}
        consultElapsedLabel={data.consultElapsedLabel}
        currentConsultStartedAtMs={data.currentConsultStartedAtMs}
        consultationState={{
          isConsultInProgress: data.isConsultInProgress,
          canStartConsultation: data.canStartConsultation,
        }}
        actionState={{
          isStartPending: data.isStartPending,
          isCompletePending: data.isCompletePending,
        }}
        prescriptionModal={data.prescriptionModal}
        onConsultSummaryChange={data.onConsultSummaryChange}
        onStartConsultation={data.onStartConsultation}
        onOpenPrescriptionForConsult={data.onOpenPrescriptionForConsult}
        onToggleSkipMedicine={data.onToggleSkipMedicine}
        onCompleteWithoutMedicine={data.onCompleteWithoutMedicine}
      />

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-4">
        <div className="flex flex-col gap-y-4 lg:col-span-3">
          <DoctorDashboardQueueCard
            doctorQueueSections={data.doctorQueueSections}
            resolvedActiveDoctorQueueLane={data.resolvedActiveDoctorQueueLane}
            activeDoctorQueueSection={data.activeDoctorQueueSection}
            selectedDoctorQueueItems={data.selectedDoctorQueueItems}
            highlightedQueuePatient={data.highlightedQueuePatient}
            onSelectQueueLane={data.onSelectQueueLane}
            onViewQueue={data.onOpenQueue}
          />

          <DoctorDashboardScheduleCard
            appointments={data.appointmentTimeline}
            onJoinVideoSession={data.onJoinVideoSession}
            onStartConsultationForAppointment={data.onStartConsultation}
            onOpenPrescription={data.onOpenPrescription}
            onOpenEhr={data.onOpenEhr}
            onCompleteAppointment={data.onCompleteAppointment}
            isStartPending={data.isStartPending}
            isCompletePending={data.isCompletePending}
          />
        </div>

        <DoctorDashboardSidebar
          onNavigateAppointments={data.onNavigateAppointments}
          onNavigatePatients={data.onNavigatePatients}
        />
      </div>

      <QuickPrescriptionModal
        isOpen={data.prescriptionModal.isOpen}
        onClose={data.onClosePrescriptionModal}
        appointmentId={data.prescriptionModal.activeAppointmentId || ""}
        patientId={data.prescriptionModal.activePatient?.id || ""}
        patientName={data.prescriptionModal.activePatient?.name || ""}
        doctorId={data.userId}
      />
    </DashboardPageShell>
  );
}
