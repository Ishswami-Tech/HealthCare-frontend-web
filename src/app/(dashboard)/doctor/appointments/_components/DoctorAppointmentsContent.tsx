"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Button } from "@/components/ui/button";
import { Note } from "@/components/tbd";
import { CancelVisitDialog, RescheduleDialog } from "@/components/appointments/manager/ManagerDialogs";
import { buildSlotPeriods } from "@/components/appointments/booking/slotDisplay";
import {
  useCancelAppointment,
  useDoctorAvailability,
  useRescheduleAppointment,
} from "@/hooks/query/useAppointments";
import { extractAvailabilitySlots, groupSlotsByPeriod } from "@/lib/utils/availabilitySlots";
import { DoctorAppointmentsSummary } from "./DoctorAppointmentsSummary";
import { DoctorAppointmentsTable, canCompleteConfirmedVideoVisit } from "./DoctorAppointmentsTable";
import {
  DoctorAppointmentsDetailsDialog,
  type DoctorAppointmentDetailsTab,
} from "./DoctorAppointmentsDetailsDialog";
import { rescheduleHint } from "./appointmentPolicy";
import { getVisitTypeLabel } from "./appointmentLabels";
import type {
  DoctorAppointmentDateFilter,
  DoctorAppointmentViewFilter,
  TransformedAppointment,
} from "../page";

/** The move or cancel dialog that is open, and the visit it is about. */
interface VisitAction {
  kind: "reschedule" | "cancel";
  appointment: TransformedAppointment;
}

interface Props {
  isLoadingAppointments: boolean;
  /** The first load failed and there is nothing to show. */
  appointmentsLoadFailed?: boolean;
  retryLoadAppointments?: () => void;
  /** Reloads the doctor's list now (after a move or cancel, which the hooks only mark stale). */
  refreshAppointments?: () => void;
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
  /** Checks a patient in for today's in-clinic visit. Rows offer "Check in" only when it is set. */
  checkInPatient?: (appointmentId: string) => Promise<void>;
  checkInPending?: boolean;
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
    refreshAppointments,
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
    checkInPatient,
    checkInPending = false,
    bulkCompleteSelected,
    bulkCompletePending,
    connectionSlot,
    initialDetailsTab = "patient-info",
    initialSelectedIds,
  } = props;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(initialSelectedIds ?? []));
  const [detailsTab, setDetailsTab] = useState<DoctorAppointmentDetailsTab>(initialDetailsTab);

  // Same rule as the row toggle in the table: a visit in progress, or a confirmed video
  // visit whose join window is open, can be completed in bulk.
  const selectableIds = useMemo(
    () =>
      new Set(
        filteredAppointments
          .filter((app) => app.status === "IN_PROGRESS" || canCompleteConfirmedVideoVisit(app))
          .map((app) => app.id)
      ),
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

  // ── Move / cancel a visit ──────────────────────────────────────────────
  const [visitAction, setVisitAction] = useState<VisitAction | null>(null);
  const [rescheduleData, setRescheduleData] = useState<{ date: string; time: string; reason: string }>({
    date: "",
    time: "",
    reason: "",
  });
  const rescheduleMutation = useRescheduleAppointment();
  const cancelMutation = useCancelAppointment();

  const actionVisit = visitAction?.appointment ?? null;
  const rescheduleOpen = visitAction?.kind === "reschedule";
  // The open times of the chosen day for this visit's doctor, location and type (video or in-person).
  const canLoadSlots = Boolean(clinicId && actionVisit?.doctorId);
  const slotsQuery = useDoctorAvailability(
    clinicId ?? "",
    actionVisit?.doctorId ?? "",
    rescheduleData.date,
    actionVisit && !actionVisit.isVideo && actionVisit.locationId ? actionVisit.locationId : undefined,
    actionVisit?.isVideo ? "VIDEO_CALL" : "IN_PERSON",
    { enabled: rescheduleOpen && canLoadSlots && Boolean(rescheduleData.date) },
  );
  const slotPeriods = useMemo(
    () => (canLoadSlots ? buildSlotPeriods(groupSlotsByPeriod(extractAvailabilitySlots(slotsQuery.data)), [], 0) : undefined),
    [canLoadSlots, slotsQuery.data],
  );
  // Days before today cannot be picked (this component never renders on the server).
  const rescheduleMinDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);
  const visitLine = actionVisit
    ? {
        title: actionVisit.patientName,
        whenLabel: `${getVisitTypeLabel(actionVisit.type)} · ${actionVisit.appointmentDate} · ${actionVisit.time}`,
        rescheduleHint: rescheduleHint(actionVisit.rescheduleCount),
      }
    : null;

  const openReschedule = (appointment: TransformedAppointment) => {
    if (!appointment.canReschedule) return;
    setRescheduleData({ date: appointment.appointmentDateKey, time: "", reason: "" });
    setVisitAction({ kind: "reschedule", appointment });
  };
  const openCancel = (appointment: TransformedAppointment) => {
    if (!appointment.canCancel) return;
    setVisitAction({ kind: "cancel", appointment });
  };
  // Closes the action dialog and the details dialog (the visit shown there is out of date now) and
  // reloads the list: the mutation hooks mark the appointment queries stale without refetching.
  const finishVisitAction = () => {
    setVisitAction(null);
    setSelectedAppointment(null);
    refreshAppointments?.();
  };
  const submitReschedule = () => {
    if (!actionVisit || !rescheduleData.date || !rescheduleData.time) return;
    const reason = rescheduleData.reason.trim();
    rescheduleMutation.mutate(
      {
        id: actionVisit.id,
        data: { date: rescheduleData.date, time: rescheduleData.time, ...(reason ? { reason } : {}) },
      },
      { onSuccess: finishVisitAction },
    );
  };
  const submitCancel = () => {
    if (!actionVisit) return;
    cancelMutation.mutate({ id: actionVisit.id }, { onSuccess: finishVisitAction });
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
          {...(checkInPatient
            ? { onCheckIn: (appointment: TransformedAppointment) => checkInPatient(appointment.id) }
            : {})}
          checkInPending={checkInPending}
          onComplete={completeAppointmentFromRow}
          onReschedule={openReschedule}
          onCancel={openCancel}
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
        onReschedule={openReschedule}
        onCancel={openCancel}
      />

      <RescheduleDialog
        open={rescheduleOpen}
        onOpenChange={(open) => !open && setVisitAction(null)}
        visit={visitLine}
        date={rescheduleData.date}
        time={rescheduleData.time}
        onDateChange={(date) => setRescheduleData((previous) => ({ ...previous, date, time: "" }))}
        onTimeChange={(time) => setRescheduleData((previous) => ({ ...previous, time }))}
        minDate={rescheduleMinDate}
        slotPeriods={slotPeriods}
        slotsLoading={slotsQuery.isPending}
        slotsError={slotsQuery.error ? "The open times could not be loaded. Try another date." : null}
        reason={rescheduleData.reason}
        onReasonChange={(reason) => setRescheduleData((previous) => ({ ...previous, reason }))}
        submitting={rescheduleMutation.isPending}
        onSubmit={submitReschedule}
      />
      <CancelVisitDialog
        open={visitAction?.kind === "cancel"}
        onOpenChange={(open) => !open && setVisitAction(null)}
        visit={visitLine}
        submitting={cancelMutation.isPending}
        onConfirm={submitCancel}
      />
    </DashboardPageShell>
  );
}
