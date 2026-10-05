"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Button } from "@/components/ui/button";
import { Note } from "@/components/tbd";
import { DoctorAppointmentsSummary } from "./DoctorAppointmentsSummary";
import { DoctorAppointmentsTable } from "./DoctorAppointmentsTable";
import {
  DoctorAppointmentsDetailsDialog,
  type DoctorAppointmentDetailsTab,
} from "./DoctorAppointmentsDetailsDialog";
import type {
  DoctorAppointmentDateFilter,
  DoctorAppointmentViewFilter,
  TransformedAppointment,
} from "../page";

interface Props {
  isLoadingAppointments: boolean;
  /** The first load failed and there is nothing to show. */
  appointmentsLoadFailed?: boolean;
  retryLoadAppointments?: () => void;
  todayLabel: string;
  clinicId?: string | undefined;
  userId?: string | undefined;
  searchTerm: string;
  appointmentViewFilter: DoctorAppointmentViewFilter;
  dateFilter: DoctorAppointmentDateFilter;
  dateFrom: string;
  dateTo: string;
  appointments: TransformedAppointment[];
  filteredAppointments: TransformedAppointment[];
  activeAppointmentsCount: number;
  inProgressAppointmentsCount: number;
  confirmedAppointmentsCount: number;
  completedAppointmentsCount: number;
  cancelledAppointmentsCount: number;
  expiredAppointmentsCount: number;
  noShowAppointmentsCount: number;
  totalAppointmentsCount: number;
  selectedAppointment: TransformedAppointment | null;
  selectedAppointmentIsClosed: boolean;
  diagnosis: string;
  prescription: string;
  consultationNotes: string;
  setSearchTerm: (value: string) => void;
  setAppointmentViewFilter: (value: DoctorAppointmentViewFilter) => void;
  setDateFilter: (value: DoctorAppointmentDateFilter) => void;
  setDateRange: (from: string, to: string) => void;
  setSelectedAppointment: (value: TransformedAppointment | null) => void;
  setDiagnosis: (value: string) => void;
  setPrescription: (value: string) => void;
  setConsultationNotes: (value: string) => void;
  completeAppointmentPending: boolean;
  updateAppointmentPending: boolean;
  startAppointmentPending?: boolean;
  openAppointmentDetails: (appointment: TransformedAppointment) => void;
  saveConsultationDraft: (appointmentId: string) => Promise<void>;
  completeConsultation: (appointmentId: string, data?: { diagnosis?: string; prescription?: string; notes?: string }) => Promise<void>;
  /** "Complete" on a table row: completes that visit with its own notes. */
  completeAppointmentFromRow: (appointment: TransformedAppointment) => Promise<void>;
  startConsultation: (appointmentId: string, doctorId: string, options?: { openVideoAfterStart?: boolean }) => Promise<void>;
  bulkCompleteSelected: (appointmentIds: string[]) => Promise<{ completed: number; failed: number } | undefined>;
  bulkCompletePending: boolean;
  /** Design preview only: replaces the live connection tag in the banner. */
  connectionSlot?: ReactNode;
  /** Design preview only: the tab the details dialog opens on. */
  initialDetailsTab?: DoctorAppointmentDetailsTab;
  /** Design preview only: rows that start selected. */
  initialSelectedIds?: string[];
}

export function DoctorAppointmentsContent(props: Props) {
  const {
    isLoadingAppointments,
    appointmentsLoadFailed = false,
    retryLoadAppointments,
    todayLabel,
    clinicId,
    userId,
    searchTerm,
    appointmentViewFilter,
    dateFilter,
    dateFrom,
    dateTo,
    filteredAppointments,
    activeAppointmentsCount,
    inProgressAppointmentsCount,
    confirmedAppointmentsCount,
    completedAppointmentsCount,
    cancelledAppointmentsCount,
    expiredAppointmentsCount,
    noShowAppointmentsCount,
    totalAppointmentsCount,
    selectedAppointment,
    selectedAppointmentIsClosed,
    diagnosis,
    prescription,
    consultationNotes,
    setSearchTerm,
    setAppointmentViewFilter,
    setDateFilter,
    setDateRange,
    setSelectedAppointment,
    setDiagnosis,
    setPrescription,
    setConsultationNotes,
    completeAppointmentPending,
    updateAppointmentPending,
    startAppointmentPending = false,
    openAppointmentDetails,
    saveConsultationDraft,
    completeConsultation,
    completeAppointmentFromRow,
    startConsultation,
    bulkCompleteSelected,
    bulkCompletePending,
    connectionSlot,
    initialDetailsTab = "patient-info",
    initialSelectedIds,
  } = props;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(initialSelectedIds ?? []));
  const [detailsTab, setDetailsTab] = useState<DoctorAppointmentDetailsTab>(initialDetailsTab);

  const selectableIds = useMemo(
    () => new Set(filteredAppointments.filter((app) => app.status === "IN_PROGRESS").map((app) => app.id)),
    [filteredAppointments]
  );
  const selectedSelectableIds = useMemo(
    () => [...selectedIds].filter((id) => selectableIds.has(id)),
    [selectedIds, selectableIds]
  );

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleBulkComplete = async () => {
    if (selectedSelectableIds.length === 0) return;
    const result = await bulkCompleteSelected(selectedSelectableIds);
    // Only clear the selection when every selected appointment actually
    // completed. On partial failure, leave selectedIds as-is — the failed
    // ones are still IN_PROGRESS, so selectedSelectableIds naturally narrows
    // down to just them once the appointment list refetches, letting the
    // doctor see and retry exactly what didn't go through.
    if (!result || result.failed === 0) {
      setSelectedIds(new Set());
    }
  };

  // The eye opens the dialog on "Patient Info"; "Prescribe" opens it on "Prescription".
  const openDetails = (appointment: TransformedAppointment, tab: DoctorAppointmentDetailsTab = "patient-info") => {
    setDetailsTab(tab);
    openAppointmentDetails(appointment);
  };

  return (
    <DashboardPageShell>
      <DoctorAppointmentsSummary
        todayLabel={todayLabel}
        clinicId={clinicId}
        userId={userId}
        searchTerm={searchTerm}
        appointmentViewFilter={appointmentViewFilter}
        dateFilter={dateFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        activeAppointmentsCount={activeAppointmentsCount}
        inProgressAppointmentsCount={inProgressAppointmentsCount}
        confirmedAppointmentsCount={confirmedAppointmentsCount}
        completedAppointmentsCount={completedAppointmentsCount}
        cancelledAppointmentsCount={cancelledAppointmentsCount}
        expiredAppointmentsCount={expiredAppointmentsCount}
        noShowAppointmentsCount={noShowAppointmentsCount}
        totalAppointmentsCount={totalAppointmentsCount}
        setSearchTerm={setSearchTerm}
        setAppointmentViewFilter={setAppointmentViewFilter}
        setDateFilter={setDateFilter}
        setDateRange={setDateRange}
        loading={isLoadingAppointments}
        connectionSlot={connectionSlot}
      />

      {appointmentsLoadFailed ? (
        <Note tone="rose" icon={AlertCircle}>
          <div className="flex flex-wrap items-center justify-between gap-3" role="alert">
            <span>
              <b className="font-bold">Appointments could not be loaded.</b> Check your connection and try again.
            </span>
            {retryLoadAppointments ? (
              <Button variant="outline" onClick={retryLoadAppointments}>
                <RefreshCw />
                Try again
              </Button>
            ) : null}
          </div>
        </Note>
      ) : (
        <DoctorAppointmentsTable
          appointments={filteredAppointments}
          appointmentViewFilter={appointmentViewFilter}
          resetKey={`${appointmentViewFilter}|${dateFilter}|${dateFrom}|${dateTo}|${searchTerm}`}
          clinicId={clinicId}
          loading={isLoadingAppointments}
          selectedIds={selectedIds}
          selectedCount={selectedSelectableIds.length}
          onToggleSelected={toggleSelected}
          onClearSelection={() => setSelectedIds(new Set())}
          onBulkComplete={handleBulkComplete}
          bulkCompletePending={bulkCompletePending}
          startAppointmentPending={startAppointmentPending}
          completeAppointmentPending={completeAppointmentPending}
          onOpenDetails={openDetails}
          onStart={(appointment) => startConsultation(appointment.id, appointment.doctorId)}
          onComplete={completeAppointmentFromRow}
        />
      )}

      <DoctorAppointmentsDetailsDialog
        selectedAppointment={selectedAppointment}
        selectedAppointmentIsClosed={selectedAppointmentIsClosed}
        initialTab={detailsTab}
        diagnosis={diagnosis}
        prescription={prescription}
        consultationNotes={consultationNotes}
        updateAppointmentPending={updateAppointmentPending}
        completeAppointmentPending={completeAppointmentPending}
        setSelectedAppointment={setSelectedAppointment}
        setDiagnosis={setDiagnosis}
        setPrescription={setPrescription}
        setConsultationNotes={setConsultationNotes}
        saveConsultationDraft={saveConsultationDraft}
        completeConsultation={completeConsultation}
      />
    </DashboardPageShell>
  );
}
