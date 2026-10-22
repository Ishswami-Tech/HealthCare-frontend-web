"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Plus, RefreshCw } from "lucide-react";
import { useWebSocketStatus } from "@/app/providers/WebSocketProvider";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { PaymentButton } from "@/components/payments/PaymentButton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import { useAddDoctorReview } from "@/hooks/query/useDoctors";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import {
  useAppointments,
  useCancelAppointment,
  useMyAppointments,
  useRejectVideoProposal,
} from "@/hooks/query/useAppointments";
import { showErrorToast, showInfoToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { useCurrentTimestamp } from "@/hooks/utils/useClientDate";
import { useLanguage } from "@/lib/i18n/context";
import {
  getAppointmentPaymentAmount,
  getVideoAppointmentJoinBlockedReason,
  isVideoAppointmentJoinable,
  normalizePatientAppointment,
} from "@/lib/utils/appointmentUtils";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { buildVideoSessionRoute } from "@/lib/utils/video-session-route";
import { Role } from "@/types/auth.types";
import { AppointmentManagerView } from "./manager/AppointmentManagerView";
import { CancelVisitDialog, DeclineSlotsDialog, RateVisitDialog } from "./manager/ManagerDialogs";
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

/** The one full-page reschedule screen (ReschedulePanel) of the viewer's portal. */
function rescheduleHref(role: string | undefined, visitId: string): string {
  const id = encodeURIComponent(visitId);
  return String(role || "").toUpperCase() === Role.RECEPTIONIST
    ? `/receptionist/appointments/${id}/reschedule`
    : `/patient/appointments/${id}/reschedule`;
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
  const currentClinicId = useCurrentClinicId();
  const router = useRouter();
  const user = session?.user;
  const hasShownRealtimeToastRef = useRef(false);
  const currentTimestamp = useCurrentTimestamp();
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
  const { language } = useLanguage();

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
  const [openDialog, setOpenDialog] = useState<"cancel" | "decline" | "rate" | null>(null);
  const [rateData, setRateData] = useState<{ rating: number; comment: string; error: string | null }>({
    rating: 0,
    comment: "",
    error: null,
  });
  // Visits rated in this session (the list does not say which visits already have a review).
  const [ratedIds, setRatedIds] = useState<ReadonlySet<string>>(() => new Set());
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
      Array.from(appointmentsById.values()).map((appointment) => {
        const visit = toManagerVisit(appointment, { now: now ?? Date.now(), viewerRole: user?.role, staffView, locale: language });
        return ratedIds.has(visit.id) ? { ...visit, canRate: false } : visit;
      }),
    [appointmentsById, now, user?.role, staffView, ratedIds, language]
  );
  const selectedVisit = useMemo(
    () => (selectedId ? (visits.find((visit) => visit.id === selectedId) ?? null) : null),
    [selectedId, visits]
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
        // The page may own the list query: refresh it so the visit leaves Upcoming right away.
        void (onRefreshAppointments ? onRefreshAppointments() : refetch());
      },
      onError: (error: Error) => showErrorToast(sanitizeErrorMessage(error) || "Failed to cancel", { id: TOAST_IDS.APPOINTMENT.DELETE }),
    });
  }, [cancelAppointment, selectedId, onRefreshAppointments, refetch]);

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

  // Rescheduling is one full page (ReschedulePanel) for every portal, not a dialog.
  const handleOpenReschedule = useCallback(
    (visitId: string) => router.push(rescheduleHref(user?.role, visitId)),
    [router, user?.role]
  );

  const { mutate: addReview, isPending: ratingVisit } = useAddDoctorReview();

  const handleRateSubmit = () => {
    if (!selectedId || !selectedVisit?.rateDoctorId || rateData.rating < 1) return;
    const visitId = selectedId;
    addReview(
      {
        doctorId: selectedVisit.rateDoctorId,
        reviewData: {
          appointmentId: visitId,
          rating: rateData.rating,
          ...(rateData.comment.trim() ? { comment: rateData.comment.trim() } : {}),
        },
      },
      {
        onSuccess: () => {
          setRatedIds((previous) => new Set(previous).add(visitId));
          setOpenDialog(null);
        },
        onError: (error: Error) => {
          const message = sanitizeErrorMessage(error) || "Your rating was not saved.";
          // The backend allows one review per visit.
          if (/already/i.test(message)) setRatedIds((previous) => new Set(previous).add(visitId));
          setRateData((previous) => ({ ...previous, error: message }));
        },
      }
    );
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
      onRate: (visitId) => {
        setSelectedId(visitId);
        setRateData({ rating: 0, comment: "", error: null });
        setOpenDialog("rate");
      },
      onDeclineSlots: (visitId) => {
        setSelectedId(visitId);
        setRejectReason("");
        setOpenDialog("decline");
      },
      // Once the deadline hits: tick the clock so the card turns Expired (and loses Pay now) right
      // away instead of on the next 30 s tick, then refresh to pick up the backend's EXPIRED row.
      onPaymentWindowExpired: () => {
        setNow(Date.now());
        void handleRefreshAppointments();
      },
    }),
    [handleJoinVideo, handleOpenReschedule, handleBookAgain, handleRefreshAppointments]
  );

  // Paying keeps using the shared payment button; it is only dressed in amber here.
  const renderPay: ManagerPayRenderer = (visit, intent) => {
    const appointment = appointmentsById.get(visit.id);
    if (!appointment) return null;
    // The payment is verified against the visit's own clinic; fall back to the page / signed-in clinic.
    const paymentClinicId =
      (appointment as { clinicId?: string | null }).clinicId || propClinicId || currentClinicId || undefined;
    return (
      <PaymentButton
        appointmentId={visit.id}
        {...(paymentClinicId ? { clinicId: paymentClinicId } : {})}
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
        rescheduling={false}
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

      <RateVisitDialog
        open={openDialog === "rate"}
        onOpenChange={(open) => (open ? setOpenDialog("rate") : closeDialog())}
        visit={selectedVisit}
        rating={rateData.rating}
        comment={rateData.comment}
        onRatingChange={(rating) => setRateData((previous) => ({ ...previous, rating, error: null }))}
        onCommentChange={(comment) => setRateData((previous) => ({ ...previous, comment }))}
        error={rateData.error}
        submitting={ratingVisit}
        onSubmit={handleRateSubmit}
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
