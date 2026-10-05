"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import { useCurrentDoctorEntityId } from "@/hooks/query/useDoctors";
import { useAppointments, useCompleteAppointment, useStartAppointment, hasAppointmentsLoadedForSession } from "@/hooks/query/useAppointments";
import { useQueue } from "@/hooks/query/useQueue";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { useCurrentTimestamp } from "@/hooks/utils/useClientDate";
import {
  formatDateInIST,
  getAppointmentDateTimeValue,
  getAppointmentPatientName,
  getVideoSessionDecision,
  shouldShowAppointmentOnDoctorDashboard,
  VIDEO_JOIN_LATE_WINDOW_MINUTES,
} from "@/lib/utils/appointmentUtils";
import { buildVideoSessionRoute } from "@/lib/utils/video-session-route";
import { extractQueueEntries, hasQueuePatientIdentity } from "@/lib/queue/queue-adapter";
import type { AppointmentWithRelations } from "@/types/appointment.types";
import type { CanonicalQueueEntry } from "@/types/queue.types";
import {
  buildDoctorDashboardStats,
  buildDoctorQueueLines,
  buildDoctorQueueSections,
  buildDoctorTodayRow,
  doctorDashboardReducer,
  getDisplayDoctorName,
  initialDoctorDashboardState,
  mapDoctorAppointmentToTimelineItem,
  pickDoctorNextPatient,
  type CompletedVisitSummary,
  type DoctorAppointmentFilter,
  type DoctorQueueSection,
  type DoctorTodayRow,
  type DoctorVideoJoinState,
  type TransformedAppointment,
} from "./doctor-dashboard.logic";

/** How often the video join state of today's visits is worked out again. */
const JOIN_STATE_REFRESH_MS = 30_000;

export function useDoctorDashboardData() {
  const { push } = useRouter();
  const { session } = useAuth();
  const user = session?.user;
  const displayDoctorName = useMemo(
    () => getDisplayDoctorName(user?.name || user?.firstName || null),
    [user?.firstName, user?.name]
  );
  const clinicId = useCurrentClinicId();
  const doctorId = user?.id;
  // Prescription.doctorId is a foreign key to the Doctor entity, not the User id.
  const { doctorId: doctorEntityId } = useCurrentDoctorEntityId(clinicId || "");
  const currentTimestamp = useCurrentTimestamp();
  const dashboardTodayLabel = useMemo(
    () =>
      currentTimestamp
        ? formatDateInIST(new Date(currentTimestamp), {
            weekday: "long",
            month: "long",
            day: "numeric",
          })
        : "",
    [currentTimestamp]
  );
  const today = useMemo(
    () => formatDateInIST(new Date(), { year: "numeric", month: "2-digit", day: "2-digit" }, "en-CA"),
    []
  );
  const historyStartDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return formatDateInIST(date, { year: "numeric", month: "2-digit", day: "2-digit" }, "en-CA");
  }, []);
  const futureEndDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 365);
    return formatDateInIST(date, { year: "numeric", month: "2-digit", day: "2-digit" }, "en-CA");
  }, []);
  const [
    {
      consultSummary,
      prescriptionModal,
      consultTick,
      consultStartOverrides,
      activeDoctorQueueLane,
      appointmentFilter,
      lastCompletedVisit,
    },
    dispatch,
  ] = useReducer(doctorDashboardReducer, initialDoctorDashboardState);

  useWebSocketQuerySync();

  const { data: appointments, isPending: isAppointmentsPending, error: appointmentsError, refetch: refetchAppointments } = useAppointments({
    ...(clinicId ? { clinicId } : {}),
    ...(doctorId ? { doctorId } : {}),
    startDate: historyStartDate,
    endDate: futureEndDate,
    limit: 500,
  });
  const { data: queueData } = useQueue(clinicId || undefined, {
    ...(doctorId ? { doctorId } : {}),
    enabled: !!clinicId,
  });
  const startAppointmentMutation = useStartAppointment();
  const completeAppointmentMutation = useCompleteAppointment();

  const appointmentsArray = useMemo(
    () => (Array.isArray(appointments) ? appointments : (appointments as any)?.appointments || []),
    [appointments]
  );

  const visibleAppointmentsArray = useMemo(
    () => appointmentsArray.filter((appointment: AppointmentWithRelations) => shouldShowAppointmentOnDoctorDashboard(appointment)),
    [appointmentsArray]
  );

  const liveQueueEntries = useMemo(
    () =>
      extractQueueEntries(queueData)
        .reduce<CanonicalQueueEntry[]>((acc, entry) => {
          if (!hasQueuePatientIdentity(entry)) {
            return acc;
          }

          if (["COMPLETED", "CANCELLED", "NO_SHOW", "EXPIRED"].includes(String(entry.status || "").toUpperCase())) {
            return acc;
          }

          acc.push(entry);
          return acc;
        }, [])
        .sort((a, b) => a.position - b.position),
    [queueData]
  );

  const doctorQueueSections = useMemo<DoctorQueueSection[]>(() => buildDoctorQueueSections(liveQueueEntries), [liveQueueEntries]);

  const resolvedActiveDoctorQueueLane = useMemo(() => {
    if (doctorQueueSections.length === 0) {
      return "";
    }

    return doctorQueueSections.some((section) => section.key === activeDoctorQueueLane)
      ? activeDoctorQueueLane
      : doctorQueueSections[0]?.key || "";
  }, [activeDoctorQueueLane, doctorQueueSections]);

  const activeDoctorQueueSection = useMemo(
    () => doctorQueueSections.find((section) => section.key === resolvedActiveDoctorQueueLane) ?? doctorQueueSections[0],
    [resolvedActiveDoctorQueueLane, doctorQueueSections]
  );

  const selectedDoctorQueueItems = activeDoctorQueueSection?.items ?? [];
  const highlightedQueuePatient = selectedDoctorQueueItems[0] ?? liveQueueEntries[0] ?? null;

  useEffect(() => {
    const timer = window.setInterval(() => {
      dispatch({ type: "setConsultTick", value: Date.now() });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [dispatch]);

  const currentInPersonConsult = useMemo(() => {
    const activeQueueAppointmentId = String((highlightedQueuePatient as any)?.appointmentId || "");
    return (
      visibleAppointmentsArray.find(
        (appointment: AppointmentWithRelations) =>
          appointment.doctorId === doctorId &&
          appointment.type === "IN_PERSON" &&
          String(appointment.status || "").toUpperCase() === "IN_PROGRESS"
      ) ||
      (activeQueueAppointmentId
        ? visibleAppointmentsArray.find((appointment: AppointmentWithRelations) => appointment.id === activeQueueAppointmentId)
        : null) ||
      visibleAppointmentsArray.find(
        (appointment: AppointmentWithRelations) =>
          appointment.doctorId === doctorId &&
          appointment.type === "IN_PERSON" &&
          !["COMPLETED", "CANCELLED", "NO_SHOW", "EXPIRED"].includes(String(appointment.status || "").toUpperCase()) &&
          Boolean(appointment.checkedInAt)
      ) ||
      null
    );
  }, [doctorId, highlightedQueuePatient, visibleAppointmentsArray]);

  const currentConsultStatus = String(currentInPersonConsult?.status || "").toUpperCase();
  const currentConsultStartOverride =
    currentInPersonConsult?.id ? consultStartOverrides[currentInPersonConsult.id] : undefined;
  const currentConsultStartedAtMs =
    currentInPersonConsult?.startedAt
      ? Date.parse(currentInPersonConsult.startedAt)
      : currentConsultStartOverride
        ? Date.parse(currentConsultStartOverride)
        : null;
  const consultElapsedLabel = useMemo(() => {
    if (!currentConsultStartedAtMs || Number.isNaN(currentConsultStartedAtMs)) {
      return "00:00";
    }

    const elapsedMs = Math.max(0, consultTick - currentConsultStartedAtMs);
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return hours > 0
      ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      : `${minutes}:${String(seconds).padStart(2, "0")}`;
  }, [consultTick, currentConsultStartedAtMs]);

  const canStartConsultation =
    Boolean(currentInPersonConsult) &&
    ["CONFIRMED", "SCHEDULED", "WAITING"].includes(currentConsultStatus) &&
    Boolean(currentInPersonConsult?.checkedInAt) &&
    !currentConsultStartedAtMs;

  // A visit that is already closed is never "in progress", even while the queue still lists it.
  const isConsultInProgress =
    !["COMPLETED", "CANCELLED", "NO_SHOW", "EXPIRED"].includes(currentConsultStatus) &&
    (currentConsultStatus === "IN_PROGRESS" || Boolean(currentConsultStartedAtMs));

  const appointmentTimeline = useMemo(
    () =>
      visibleAppointmentsArray
        .toSorted(
          (a: AppointmentWithRelations, b: AppointmentWithRelations) =>
            (getAppointmentDateTimeValue(a)?.getTime() ?? 0) - (getAppointmentDateTimeValue(b)?.getTime() ?? 0)
        )
        .map((apt: AppointmentWithRelations): TransformedAppointment => mapDoctorAppointmentToTimelineItem(apt, today)),
    [today, visibleAppointmentsArray]
  );

  // Video visits this doctor started and has not completed. Only the doctor can complete
  // them, and they expire when the visit window closes, so they are surfaced on their own.
  const openVideoVisits = useMemo(
    () =>
      appointmentTimeline
        .filter(
          (appointment: TransformedAppointment) =>
            appointment.isVideo && appointment.statusEnum === "IN_PROGRESS" && appointment.startAtMs !== null
        )
        .map((appointment: TransformedAppointment) => ({
          appointment,
          expiresAtMs: (appointment.startAtMs as number) + VIDEO_JOIN_LATE_WINDOW_MINUTES * 60_000,
        }))
        .filter((visit: { expiresAtMs: number }) => visit.expiresAtMs > consultTick),
    [appointmentTimeline, consultTick]
  );

  const stats = useMemo(
    () => buildDoctorDashboardStats(appointmentsArray, appointmentTimeline, liveQueueEntries),
    [appointmentTimeline, appointmentsArray, liveQueueEntries]
  );

  const timelineById = useMemo(
    () => new Map<string, TransformedAppointment>(appointmentTimeline.map((item: TransformedAppointment) => [item.id, item])),
    [appointmentTimeline]
  );

  // Today's visits only: the table, its filter chips and the banner tiles all count these rows.
  const todayTimeline = useMemo(
    () => appointmentTimeline.filter((item: TransformedAppointment) => item.scheduleState === "TODAY"),
    [appointmentTimeline]
  );

  // The join state depends on the clock, so it is worked out again every half minute from
  // the full appointment (which carries the backend's join and payment signals).
  const joinStateTick = Math.floor(consultTick / JOIN_STATE_REFRESH_MS);
  const videoJoinById = useMemo(() => {
    const todayVideoIds = new Set(
      todayTimeline.filter((item: TransformedAppointment) => item.isVideo).map((item: TransformedAppointment) => item.id)
    );
    const result = new Map<string, DoctorVideoJoinState>();
    visibleAppointmentsArray.forEach((appointment: AppointmentWithRelations) => {
      if (!todayVideoIds.has(appointment.id)) {
        return;
      }
      const decision = getVideoSessionDecision(appointment);
      result.set(appointment.id, {
        canJoin: decision.canJoin,
        paymentPending: !decision.canJoin && /payment/i.test(`${decision.label} ${decision.blockedReason ?? ""}`),
      });
    });
    return result;
  }, [joinStateTick, todayTimeline, visibleAppointmentsArray]);

  const todayRows = useMemo<DoctorTodayRow[]>(
    () =>
      todayTimeline.map((item: TransformedAppointment) =>
        buildDoctorTodayRow(
          lastCompletedVisit?.appointmentId === item.id && lastCompletedVisit.pharmacyMedicineCount > 0
            ? { ...item, sentToPharmacy: true }
            : item,
          videoJoinById.get(item.id) ?? null,
          joinStateTick * JOIN_STATE_REFRESH_MS
        )
      ),
    [joinStateTick, lastCompletedVisit, todayTimeline, videoJoinById]
  );

  const appointmentCounts = useMemo(
    () => ({
      all: todayRows.length,
      confirmed: todayRows.filter((row) => row.appointment.statusEnum === "CONFIRMED").length,
      completed: todayRows.filter((row) => row.appointment.statusEnum === "COMPLETED").length,
    }),
    [todayRows]
  );

  const filteredTodayRows = useMemo(
    () =>
      appointmentFilter === "ALL"
        ? todayRows
        : todayRows.filter((row) => row.appointment.statusEnum === appointmentFilter),
    [appointmentFilter, todayRows]
  );

  // Right rail: in-clinic, checked-in patients only (video visits never join the queue).
  const queueLines = useMemo(() => buildDoctorQueueLines(liveQueueEntries, timelineById), [liveQueueEntries, timelineById]);

  const activeConsult = useMemo<TransformedAppointment | null>(() => {
    if (!currentInPersonConsult) {
      return null;
    }
    return timelineById.get(currentInPersonConsult.id) ?? mapDoctorAppointmentToTimelineItem(currentInPersonConsult, today);
  }, [currentInPersonConsult, timelineById, today]);

  const nextPatient = useMemo(() => {
    const queuePosition =
      liveQueueEntries.find((entry) => entry.appointmentId === activeConsult?.id)?.position ?? null;
    return pickDoctorNextPatient(
      todayRows,
      canStartConsultation && activeConsult
        ? { appointment: activeConsult, queuePosition: queuePosition && queuePosition > 0 ? queuePosition : null }
        : null
    );
  }, [activeConsult, canStartConsultation, liveQueueEntries, todayRows]);

  const recordCompletedVisit = useCallback(
    (summary: Omit<CompletedVisitSummary, "completedAtMs" | "patientName"> & { patientName?: string }) => {
      dispatch({
        type: "setLastCompletedVisit",
        value: {
          ...summary,
          patientName: summary.patientName || timelineById.get(summary.appointmentId)?.patientName || "the patient",
          completedAtMs: Date.now(),
        },
      });
    },
    [timelineById]
  );

  const handleOpenPrescription = useCallback((apt: TransformedAppointment) => {
    dispatch({
      type: "setPrescriptionModal",
      value: {
        isOpen: true,
        activePatient: { id: apt.patientId, name: apt.patientName },
        activeAppointmentId: apt.id,
        skipMedicineSelected: false,
      },
    });
  }, []);

  const handleOpenPrescriptionForConsult = useCallback(() => {
    if (!currentInPersonConsult) {
      return;
    }

    dispatch({
      type: "setPrescriptionModal",
      value: {
        isOpen: true,
        activePatient: {
          id: currentInPersonConsult.patientId,
          name: getAppointmentPatientName(currentInPersonConsult),
        },
        activeAppointmentId: currentInPersonConsult.id,
        skipMedicineSelected: false,
      },
    });
  }, [currentInPersonConsult]);

  const startConsultationForAppointment = useCallback(
    async (appointmentId: string, doctorIdForAppointment: string, options?: { openVideoAfterStart?: boolean }) => {
      if (options?.openVideoAfterStart) {
        push(buildVideoSessionRoute(appointmentId));
        return;
      }

      const startedAt = new Date().toISOString();
      await startAppointmentMutation.mutateAsync({
        appointmentId,
        doctorId: doctorIdForAppointment,
      });
      dispatch({ type: "setLastCompletedVisit", value: null });
      dispatch({
        type: "setConsultStartOverrides",
        value: (prev) => ({
          ...prev,
          [appointmentId]: startedAt,
        }),
      });
      await refetchAppointments();
    },
    [push, refetchAppointments, startAppointmentMutation]
  );

  const handleStartConsultation = useCallback(async () => {
    if (!currentInPersonConsult) {
      return;
    }

    await startConsultationForAppointment(currentInPersonConsult.id, currentInPersonConsult.doctorId);
  }, [currentInPersonConsult, startConsultationForAppointment]);

  const handleCompleteWithoutMedicine = useCallback(async () => {
    if (!currentInPersonConsult) {
      return;
    }

    const summaryText = consultSummary.trim();
    await completeAppointmentMutation.mutateAsync({
      id: currentInPersonConsult.id,
      data: {
        notes: summaryText,
        treatmentPlan: summaryText,
        metadata: {
          medicineSkipped: true,
          prescriptionIssued: false,
          source: "doctor-dashboard",
          consultSummary: summaryText,
        },
      },
    });
    recordCompletedVisit({
      appointmentId: currentInPersonConsult.id,
      patientName: getAppointmentPatientName(currentInPersonConsult),
      pharmacyMedicineCount: 0,
      outsideMedicineCount: 0,
      prescriptionNumber: null,
      followUpDate: null,
    });
    dispatch({ type: "setConsultSummary", value: "" });
    dispatch({
      type: "updatePrescriptionModal",
      value: (current) => ({
        ...current,
        skipMedicineSelected: false,
      }),
    });
    await refetchAppointments();
  }, [completeAppointmentMutation, consultSummary, currentInPersonConsult, recordCompletedVisit, refetchAppointments]);

  const handleCompleteAppointment = useCallback(
    async (appointmentId: string) => {
      await completeAppointmentMutation.mutateAsync({
        id: appointmentId,
        data: {},
      });
      recordCompletedVisit({
        appointmentId,
        pharmacyMedicineCount: 0,
        outsideMedicineCount: 0,
        prescriptionNumber: null,
        followUpDate: null,
      });
    },
    [completeAppointmentMutation, recordCompletedVisit]
  );

  // The prescription dialog saved the medicines and completed the visit.
  const handlePrescriptionSaved = useCallback(
    async (result: {
      appointmentId?: string;
      appointmentCompleted: boolean;
      patientName: string;
      pharmacyMedicineCount: number;
      outsideMedicineCount: number;
      prescriptionNumber: string | null;
      followUpDate: string | null;
    }) => {
      if (!result.appointmentId || !result.appointmentCompleted) {
        return;
      }
      recordCompletedVisit({
        appointmentId: result.appointmentId,
        patientName: result.patientName,
        pharmacyMedicineCount: result.pharmacyMedicineCount,
        outsideMedicineCount: result.outsideMedicineCount,
        prescriptionNumber: result.prescriptionNumber,
        followUpDate: result.followUpDate,
      });
      dispatch({ type: "setConsultSummary", value: "" });
      await refetchAppointments();
    },
    [recordCompletedVisit, refetchAppointments]
  );

  const handleSelectQueueLane = useCallback(
    (lane: string) => {
      dispatch({ type: "setActiveDoctorQueueLane", value: lane });
    },
    []
  );

  const handleToggleSkipMedicine = useCallback(() => {
    dispatch({
      type: "updatePrescriptionModal",
      value: (current) => ({
        ...current,
        skipMedicineSelected: true,
      }),
    });
  }, []);

  const handleCancelSkipMedicine = useCallback(() => {
    dispatch({
      type: "updatePrescriptionModal",
      value: (current) => ({
        ...current,
        skipMedicineSelected: false,
      }),
    });
  }, []);

  // The visit the prescription dialog is open for (shown in its patient strip).
  const prescriptionAppointment = prescriptionModal.activeAppointmentId
    ? timelineById.get(prescriptionModal.activeAppointmentId) ?? null
    : null;

  return {
    appointmentsArray,
    appointmentsError,
    appointmentTimeline,
    openVideoVisits,
    nowMs: consultTick,
    canStartConsultation,
    consultElapsedLabel,
    consultSummary,
    currentConsultStartedAtMs,
    currentInPersonConsult,
    dashboardTodayLabel,
    displayDoctorName,
    doctorQueueSections,
    highlightedQueuePatient,
    isAppointmentsPending,
    isCompletePending: completeAppointmentMutation.isPending,
    isConsultInProgress,
    isStartPending: startAppointmentMutation.isPending,
    activeDoctorQueueSection,
    prescriptionModal,
    resolvedActiveDoctorQueueLane,
    selectedDoctorQueueItems,
    stats,
    onOpenPrescription: handleOpenPrescription,
    onOpenPrescriptionForConsult: handleOpenPrescriptionForConsult,
    onStartConsultation: handleStartConsultation,
    onCompleteWithoutMedicine: handleCompleteWithoutMedicine,
    onCompleteAppointment: handleCompleteAppointment,
    onPrescriptionSaved: handlePrescriptionSaved,
    onStartAppointment: startConsultationForAppointment,
    onAppointmentFilterChange: (value: DoctorAppointmentFilter) => dispatch({ type: "setAppointmentFilter", value }),
    activeConsult,
    appointmentCounts,
    appointmentFilter,
    filteredTodayRows,
    lastCompletedVisit,
    nextPatient,
    queueLines,
    todayRows,
    onConsultSummaryChange: (value: string) => dispatch({ type: "setConsultSummary", value }),
    onSelectQueueLane: handleSelectQueueLane,
    onToggleSkipMedicine: handleToggleSkipMedicine,
    onCancelSkipMedicine: handleCancelSkipMedicine,
    prescriptionAppointment,
    onJoinVideoSession: (appointmentId: string) => push(buildVideoSessionRoute(appointmentId)),
    onOpenEhr: (patientId: string) => push(`/doctor/patients/${patientId}`),
    onNavigateAppointments: () => push("/doctor/appointments"),
    onNavigatePatients: () => push("/doctor/patients"),
    onNavigateNoShow: () => push("/doctor/appointments?view=NO_SHOW"),
    onOpenQueue: () => push("/queue"),
    onClosePrescriptionModal: () =>
      dispatch({
        type: "updatePrescriptionModal",
        value: (current) => ({
          ...current,
          isOpen: false,
        }),
      }),
    userId: user?.id || "",
    doctorEntityId,
    hasAppointmentsLoadedForSession: hasAppointmentsLoadedForSession(),
  };
}
