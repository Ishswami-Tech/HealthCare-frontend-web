"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CreditCard, Plus, RefreshCw } from "lucide-react";
import { useWebSocketStatus } from "@/app/providers/WebSocketProvider";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { PaymentButton } from "@/components/payments/PaymentButton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useAppointments,
  useCancelAppointment,
  useDoctorAvailability,
  useMyAppointments,
  useRejectVideoProposal,
  useRescheduleAppointment,
} from "@/hooks/query/useAppointments";
import { showErrorToast, showInfoToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { useCurrentTimestamp } from "@/hooks/utils/useClientDate";
import {
  formatISODateInIST,
  formatTimeInIST,
  getAppointmentDateTimeValue,
  getAppointmentPaymentAmount,
  getVideoAppointmentJoinBlockedReason,
  isVideoAppointmentJoinable,
  normalizePatientAppointment,
} from "@/lib/utils/appointmentUtils";
import { extractAvailabilitySlots, groupSlotsByPeriod } from "@/lib/utils/availabilitySlots";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { buildVideoSessionRoute } from "@/lib/utils/video-session-route";
import { Role } from "@/types/auth.types";
import { buildSlotPeriods } from "./booking/slotDisplay";
import { AppointmentManagerView } from "./manager/AppointmentManagerView";
import { CancelVisitDialog, DeclineSlotsDialog, RescheduleDialog } from "./manager/ManagerDialogs";
import {
  dedupeAppointments,
  extractAppointmentList,
  getEffectiveAppointmentId,
  isPatientViewer,
  toManagerVisit,
  type Row,
} from "./manager/managerData";
import { PAY_CARD_CLASS, PAY_ROW_CLASS } from "./manager/payButton";
import { useAppointmentsRefresh } from "./manager/useAppointmentsRefresh";
import type { ManagerDateRange, ManagerPayRenderer, ManagerTab, ManagerVisitActions } from "./manager/types";

interface AppointmentManagerProps {
  filterType?: "VIDEO_CALL" | "IN_PERSON";
  defaultConsultationMode?: "VIDEO" | "IN_PERSON";
  isAdminView?: boolean;
  clinicId?: string;
  patientId?: string;
  hideBookButton?: boolean;
  autoOpenBookDialog?: boolean;
  appointmentsData?: unknown;
  isAppointmentsPending?: boolean;
  /**
   * Optional separate flag for background-refetch spinner control. Use this
   * instead of OR-ing `isFetching` into `isAppointmentsPending`, because
   * `placeholderData: keepPreviousData` keeps the list visible across
   * refetches and we don't want to flash a skeleton on every focus/reconnect.
   */
  isAppointmentsFetching?: boolean;
  onRefreshAppointments?: () => Promise<unknown> | unknown;
  /** The error of the page's own appointments query, when the page passes `appointmentsData`. */
  appointmentsError?: unknown;
  /**
   * Opens the page's own booking dialog. With it the empty states show "Book appointment"
   * even when `hideBookButton` hides the manager's own title row.
   */
  onBookAppointment?: () => void;
  /** The tab the list opens on (a deep link such as `?tab=past`). Default: upcoming. */
  initialTab?: ManagerTab | undefined;
}

/** HH:mm for the reschedule time field, from the visit's own time. */
function rescheduleTimeValue(appointment: Row): string {
  const raw = typeof appointment.time === "string" ? appointment.time.trim() : "";
  if (/^\d{2}:\d{2}/.test(raw)) return raw.slice(0, 5);
  const dateTime = getAppointmentDateTimeValue(appointment);
  if (!dateTime) return raw;
  // Some engines write midnight as "24:xx" in 24-hour time; a time field needs "00:xx".
  return formatTimeInIST(dateTime, { hour: "2-digit", minute: "2-digit", hour12: false }).replace(/^24:/, "00:");
}

/**
 * Data and actions for the appointments list. The layout lives in `./manager/`
 * (`AppointmentManagerView` and its parts), which only draws what it is given.
 */
export default function AppointmentManager({
  filterType,
  isAdminView = false,
  clinicId: propClinicId,
  patientId: propPatientId,
  hideBookButton = false,
  autoOpenBookDialog = false,
  appointmentsData: externalAppointmentsData,
  isAppointmentsPending: externalAppointmentsPending,
  isAppointmentsFetching: externalAppointmentsFetching,
  onRefreshAppointments,
  appointmentsError: externalAppointmentsError,
  onBookAppointment,
  initialTab,
}: AppointmentManagerProps = {}) {
  const { session } = useAuth();
  const user = session?.user;
  const hasShownRealtimeToastRef = useRef(false);
  const currentTimestamp = useCurrentTimestamp();
  const rescheduleMinDate = useMemo(() => {
    if (!currentTimestamp) return null;
    const today = new Date(currentTimestamp);
    today.setHours(0, 0, 0, 0);
    return today;
  }, [currentTimestamp]);
  const checkInRoute = useMemo(() => {
    const userRole = String(user?.role || "").toUpperCase().replace(/\s+/g, "_");
    if (userRole === Role.RECEPTIONIST) {
      return "/receptionist/check-in";
    }
    if (userRole === Role.CLINIC_LOCATION_HEAD) {
      return "/clinic-location-head/check-in";
    }
    return "/patient/check-in";
  }, [user?.role]);
  // Staff lists (reception, clinic) lead with the patient's name and show the numbers.
  const staffView = isAdminView || !isPatientViewer(user?.role, isAdminView);

  // A slow clock, so "Starts in 25 minutes" and the join window stay true while the page is open.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // Real-time WebSocket integration
  const { isConnected, isRealTimeEnabled } = useWebSocketStatus();

  // Book-appointment dialog state (separate from the reschedule dialog, so a cancelled
  // visit sends people to the main booking flow with the doctor and mode already chosen).
  const [isBookDialogOpen, setIsBookDialogOpen] = useState(false);
  const [bookPrefill, setBookPrefill] = useState<{
    doctorId?: string;
    consultationMode?: "IN_PERSON" | "VIDEO";
  } | null>(null);
  const [dateFilter, setDateFilter] = useState<ManagerDateRange>({ start: "", end: "" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<"reschedule" | "cancel" | "decline" | null>(null);
  const [rescheduleData, setRescheduleData] = useState<{ date: string; time: string }>({ date: "", time: "" });
  const [rejectReason, setRejectReason] = useState("");

  // ─── Data fetching ───────────────────────────────────────────────────────

  // Choose the hook by view. Filters carry only the keys that are set
  // (exactOptionalPropertyTypes).
  const adminFilters = useMemo(() => {
    if (!isAdminView) return undefined;
    return {
      clinicId: propClinicId || "",
      ...(propPatientId ? { patientId: propPatientId } : {}),
      ...(filterType ? { type: filterType } : {}),
      ...(dateFilter.start ? { startDate: dateFilter.start } : {}),
      ...(dateFilter.end ? { endDate: dateFilter.end } : {}),
    };
  }, [isAdminView, propClinicId, propPatientId, filterType, dateFilter.start, dateFilter.end]);

  const personalFilters = useMemo(() => {
    if (isAdminView) return undefined;
    const filters = {
      ...(propClinicId ? { clinicId: propClinicId } : {}),
      ...(dateFilter.start ? { startDate: dateFilter.start } : {}),
      ...(dateFilter.end ? { endDate: dateFilter.end } : {}),
    };
    return Object.keys(filters).length > 0 ? filters : undefined;
  }, [isAdminView, dateFilter.start, dateFilter.end, propClinicId]);

  const isPatient = isPatientViewer(user?.role, isAdminView);
  // Staff with isAdminView=false still need the clinic list — never my-appointments (403).
  const staffListFilters = useMemo(() => {
    if (isAdminView || isPatient) return undefined;
    return {
      clinicId: propClinicId || "",
      ...(propPatientId ? { patientId: propPatientId } : {}),
      ...(filterType ? { type: filterType } : {}),
      ...(dateFilter.start ? { startDate: dateFilter.start } : {}),
      ...(dateFilter.end ? { endDate: dateFilter.end } : {}),
    };
  }, [
    isAdminView,
    isPatient,
    propClinicId,
    propPatientId,
    filterType,
    dateFilter.start,
    dateFilter.end,
  ]);
  const adminAppointments = useAppointments(adminFilters ?? staffListFilters, {
    enabled: isAdminView || Boolean(staffListFilters),
  });
  // my-appointments is patient-only on the backend; never call it for staff roles.
  const myPersonalAppointments = useMyAppointments(personalFilters, {
    enabled: !isAdminView && isPatient,
  });
  const activeQuery = isAdminView || !isPatient ? adminAppointments : myPersonalAppointments;

  const { mutate: cancelAppointment, isPending: cancellingAppointment } = useCancelAppointment();
  const { mutate: rescheduleAppointment, isPending: reschedulingAppointment } = useRescheduleAppointment();
  const { mutate: rejectVideoProposal, isPending: rejectingProposal } = useRejectVideoProposal();

  const usesExternalData = externalAppointmentsData !== undefined;
  const appointmentsFetching =
    externalAppointmentsFetching ?? externalAppointmentsPending ?? activeQuery.isFetching;
  const isAppointmentsLoading = externalAppointmentsPending ?? activeQuery.isPending;
  const refetch = activeQuery.refetch;
  const rawData: unknown = usesExternalData ? externalAppointmentsData : activeQuery.data;
  const loadError = usesExternalData ? externalAppointmentsError : activeQuery.error;
  const errorMessage = loadError
    ? sanitizeErrorMessage(loadError) || "Please check your connection and try again."
    : null;

  // Patient lists come from /appointments/my-appointments and admin lists are fetched by
  // clinic and patient, so both are already scoped by the server: no client-side filtering
  // by patient here.
  const appointments = useMemo((): Row[] => {
    const deduped = dedupeAppointments(extractAppointmentList(rawData));
    return filterType
      ? deduped.filter((appointment) => normalizePatientAppointment(appointment).type === filterType)
      : deduped;
  }, [rawData, filterType]);

  const appointmentsById = useMemo(() => {
    const map = new Map<string, Row>();
    for (const appointment of appointments) {
      const id = getEffectiveAppointmentId(appointment);
      if (id && !map.has(id)) map.set(id, appointment);
    }
    return map;
  }, [appointments]);

  const visits = useMemo(
    () =>
      Array.from(appointmentsById.values()).map((appointment) =>
        toManagerVisit(appointment, { now: now ?? Date.now(), viewerRole: user?.role, staffView })
      ),
    [appointmentsById, now, user?.role, staffView]
  );
  const selectedVisit = useMemo(
    () => (selectedId ? (visits.find((visit) => visit.id === selectedId) ?? null) : null),
    [selectedId, visits]
  );

  // The open times of the chosen day, for the visit's own doctor, location and type (video or in-person).
  const rescheduleAppointmentRow = selectedId ? appointmentsById.get(selectedId) : undefined;
  const rescheduleDoctorId = String(rescheduleAppointmentRow?.doctorId ?? "");
  const rescheduleClinicId = String(rescheduleAppointmentRow?.clinicId ?? propClinicId ?? (user as { clinicId?: string } | undefined)?.clinicId ?? "");
  const rescheduleLocationId = String(rescheduleAppointmentRow?.locationId ?? "");
  const rescheduleIsVideo = selectedVisit?.kind === "video";
  const canLoadRescheduleSlots = Boolean(rescheduleDoctorId && rescheduleClinicId);
  const {
    data: rescheduleAvailability,
    isPending: rescheduleSlotsPending,
    error: rescheduleSlotsError,
  } = useDoctorAvailability(
    rescheduleClinicId,
    rescheduleDoctorId,
    rescheduleData.date,
    rescheduleIsVideo ? undefined : rescheduleLocationId || undefined,
    rescheduleIsVideo ? "VIDEO_CALL" : "IN_PERSON",
    { enabled: openDialog === "reschedule" && canLoadRescheduleSlots && Boolean(rescheduleData.date) },
  );
  const reschedulePeriods = useMemo(
    () =>
      canLoadRescheduleSlots
        ? buildSlotPeriods(groupSlotsByPeriod(extractAvailabilitySlots(rescheduleAvailability)), [], 0)
        : undefined,
    [canLoadRescheduleSlots, rescheduleAvailability]
  );

  const { isRefreshing: isRefreshingAppointments, refresh: handleRefreshAppointments } = useAppointmentsRefresh({
    isConnected,
    onRefreshAppointments,
    refetch,
  });
  const isRefreshInProgress = Boolean(appointmentsFetching) || isRefreshingAppointments;

  // ─── Actions ─────────────────────────────────────────────────────────────

  const closeDialog = useCallback(() => setOpenDialog(null), []);

  const handleCancelAppointment = useCallback(() => {
    if (!selectedId) return;
    cancelAppointment({ id: selectedId, reason: "Cancelled via appointment manager" }, {
      onSuccess: () => {
        showSuccessToast("Appointment cancelled", { id: TOAST_IDS.APPOINTMENT.DELETE, description: "Your appointment has been cancelled." });
        setOpenDialog(null);
      },
      onError: (error: Error) => showErrorToast(sanitizeErrorMessage(error) || "Failed to cancel", { id: TOAST_IDS.APPOINTMENT.DELETE }),
    });
  }, [cancelAppointment, selectedId]);

  // Opens the main booking dialog (not the reschedule dialog) with the closed visit's
  // doctor and mode already chosen.
  const handleBookAgain = useCallback((visitId: string) => {
    const appointment = appointmentsById.get(visitId);
    if (!appointment) return;
    const doctorId = [appointment.doctorId, appointment.appointmentDoctorId].find(
      (value): value is string => typeof value === "string" && value.length > 0
    );
    const mode = normalizePatientAppointment(appointment).isOnline ? "VIDEO" : "IN_PERSON";
    setBookPrefill({ ...(doctorId ? { doctorId } : {}), consultationMode: mode });
    setIsBookDialogOpen(true);
  }, [appointmentsById]);

  const handleOpenReschedule = useCallback((visitId: string) => {
    const appointment = appointmentsById.get(visitId);
    if (!appointment) return;
    const dateTime = getAppointmentDateTimeValue(appointment);
    const rawDate = typeof appointment.date === "string" ? appointment.date : "";
    setSelectedId(visitId);
    setRescheduleData({
      date: dateTime ? formatISODateInIST(dateTime) : rawDate ? formatISODateInIST(rawDate) : "",
      // With a doctor to look up, the new time is picked from the open slots; otherwise it is typed.
      time: appointment.doctorId ? "" : rescheduleTimeValue(appointment),
    });
    setOpenDialog("reschedule");
  }, [appointmentsById]);

  const handleRescheduleSubmit = () => {
    if (!selectedId) return;
    rescheduleAppointment({ id: selectedId, data: { date: rescheduleData.date, time: rescheduleData.time } }, {
      onSuccess: () => {
        showSuccessToast("Appointment rescheduled", { id: TOAST_IDS.APPOINTMENT.UPDATE, description: "Your appointment has been rescheduled." });
        setOpenDialog(null);
      },
      onError: (error: Error) => showErrorToast(sanitizeErrorMessage(error) || "Failed to reschedule", { id: TOAST_IDS.APPOINTMENT.UPDATE }),
    });
  };

  const handleRejectProposal = () => {
    if (!selectedId) return;
    rejectVideoProposal({ id: selectedId, reason: rejectReason }, {
      onSuccess: () => {
        showSuccessToast("Proposal rejected", { id: TOAST_IDS.APPOINTMENT.UPDATE });
        setOpenDialog(null);
        setRejectReason("");
        setSelectedId(null);
      },
      onError: (error: Error) => showErrorToast(sanitizeErrorMessage(error) || "Failed to reject", { id: TOAST_IDS.APPOINTMENT.UPDATE }),
    });
  };

  const handleJoinVideo = useCallback(async (visitId: string) => {
    try {
      const appointment = appointmentsById.get(visitId);
      const appointmentId = getEffectiveAppointmentId(appointment);
      if (!appointment || !appointmentId) {
        showErrorToast("Missing appointment details for this video session.", {
          id: TOAST_IDS.VIDEO.ERROR,
        });
        return;
      }

      let latestAppointment: Row = appointment;
      if (!isVideoAppointmentJoinable(latestAppointment)) {
        const refreshedQuery = await refetch();
        latestAppointment =
          extractAppointmentList(refreshedQuery?.data).find(
            (item) => getEffectiveAppointmentId(item) === appointmentId
          ) || appointment;
      }

      if (!isVideoAppointmentJoinable(latestAppointment)) {
        showErrorToast(getVideoAppointmentJoinBlockedReason(latestAppointment), {
          id: TOAST_IDS.VIDEO.ERROR,
        });
        return;
      }

      window.location.href = buildVideoSessionRoute(appointmentId);
    } catch (error: unknown) {
      showErrorToast(
        error instanceof Error ? error.message : "Failed to join video",
        { id: TOAST_IDS.VIDEO.ERROR }
      );
    }
  }, [appointmentsById, refetch]);

  useEffect(() => {
    if (isRealTimeEnabled && isConnected && !hasShownRealtimeToastRef.current) {
      hasShownRealtimeToastRef.current = true;
      showInfoToast("Live updates active", { id: TOAST_IDS.GLOBAL.INFO, description: "Appointments update in real-time", duration: 2000 });
    }

    if (!isConnected) {
      hasShownRealtimeToastRef.current = false;
    }
  }, [isRealTimeEnabled, isConnected]);

  const actions = useMemo<ManagerVisitActions>(
    () => ({
      onJoin: (visitId) => void handleJoinVideo(visitId),
      onReschedule: handleOpenReschedule,
      onCancel: (visitId) => {
        setSelectedId(visitId);
        setOpenDialog("cancel");
      },
      onBookAgain: handleBookAgain,
      onDeclineSlots: (visitId) => {
        setSelectedId(visitId);
        setRejectReason("");
        setOpenDialog("decline");
      },
      // Refresh once the deadline hits, so the list shows the now-cancelled visit.
      onPaymentWindowExpired: () => void handleRefreshAppointments(),
    }),
    [handleJoinVideo, handleOpenReschedule, handleBookAgain, handleRefreshAppointments]
  );

  // Paying keeps using the shared payment button; it is only dressed in amber here.
  const renderPay: ManagerPayRenderer = (visit, intent) => {
    const appointment = appointmentsById.get(visit.id);
    if (!appointment) return null;
    return (
      <PaymentButton
        appointmentId={visit.id}
        amount={getAppointmentPaymentAmount(appointment)}
        appointmentType="VIDEO_CALL"
        description={`Video consultation with ${visit.doctorName || "doctor"}`}
        className={intent === "pay" ? PAY_CARD_CLASS : PAY_ROW_CLASS}
      >
        {intent === "pay" ? <CreditCard aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
        {intent === "pay" ? "Pay now" : "Retry payment"}
      </PaymentButton>
    );
  };

  const bookAction = onBookAppointment ? (
    <Button variant="action" size="md" onClick={onBookAppointment}>
      <Plus aria-hidden="true" />
      Book appointment
    </Button>
  ) : !hideBookButton ? (
    <Button
      variant="action"
      size="md"
      onClick={() => {
        setBookPrefill(null);
        setIsBookDialogOpen(true);
      }}
    >
      <Plus aria-hidden="true" />
      Book appointment
    </Button>
  ) : undefined;

  return (
    <>
      <AppointmentManagerView
        visits={visits}
        now={now}
        isLoading={Boolean(isAppointmentsLoading)}
        errorMessage={errorMessage}
        isRefreshing={isRefreshInProgress}
        onRefresh={() => void handleRefreshAppointments()}
        live={isRealTimeEnabled ? (isConnected ? "on" : "connecting") : null}
        staffView={staffView}
        dateRange={dateFilter}
        onDateRangeChange={setDateFilter}
        actions={actions}
        renderPay={renderPay}
        checkInHref={checkInRoute}
        cancelling={cancellingAppointment}
        rescheduling={reschedulingAppointment}
        heading={
          hideBookButton
            ? undefined
            : {
                title: "Appointments",
                action: (
                  <BookAppointmentDialog
                    defaultOpen={autoOpenBookDialog}
                    {...(propClinicId ? { clinicId: propClinicId } : {})}
                    {...(propPatientId ? { initialPatientId: propPatientId } : {})}
                    trigger={
                      <Button variant="action" size="md">
                        <Plus aria-hidden="true" />
                        Book appointment
                      </Button>
                    }
                  />
                ),
              }
        }
        bookAction={bookAction}
        initialTab={initialTab}
      />

      <RescheduleDialog
        open={openDialog === "reschedule"}
        onOpenChange={(open) => (open ? setOpenDialog("reschedule") : closeDialog())}
        visit={selectedVisit}
        date={rescheduleData.date}
        time={rescheduleData.time}
        onDateChange={(date) => setRescheduleData({ date, time: "" })}
        onTimeChange={(time) => setRescheduleData((previous) => ({ ...previous, time }))}
        minDate={rescheduleMinDate}
        slotPeriods={reschedulePeriods}
        slotsLoading={rescheduleSlotsPending && Boolean(rescheduleData.date)}
        slotsError={rescheduleSlotsError instanceof Error ? sanitizeErrorMessage(rescheduleSlotsError) : null}
        submitting={reschedulingAppointment}
        onSubmit={handleRescheduleSubmit}
      />

      <CancelVisitDialog
        open={openDialog === "cancel"}
        onOpenChange={(open) => (open ? setOpenDialog("cancel") : closeDialog())}
        visit={selectedVisit}
        submitting={cancellingAppointment}
        onConfirm={handleCancelAppointment}
      />

      <DeclineSlotsDialog
        open={openDialog === "decline"}
        onOpenChange={(open) => (open ? setOpenDialog("decline") : closeDialog())}
        visit={selectedVisit}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        submitting={rejectingProposal}
        onSubmit={handleRejectProposal}
      />

      {/* Main booking dialog (controlled): opened by "Book again" on a closed visit, so
          people get the full booking flow with the doctor already chosen. */}
      <BookAppointmentDialog
        hideTrigger
        open={isBookDialogOpen}
        onOpenChange={setIsBookDialogOpen}
        {...(bookPrefill?.doctorId ? { initialDoctorId: bookPrefill.doctorId } : {})}
        {...(bookPrefill?.consultationMode
          ? { initialConsultationMode: bookPrefill.consultationMode }
          : {})}
        {...(propClinicId ? { clinicId: propClinicId } : {})}
        {...(propPatientId ? { initialPatientId: propPatientId } : {})}
        onBooked={() => {
          setIsBookDialogOpen(false);
          setBookPrefill(null);
        }}
      />
    </>
  );
}
