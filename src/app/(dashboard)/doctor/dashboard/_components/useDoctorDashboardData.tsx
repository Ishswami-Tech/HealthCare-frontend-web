"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import { useAppointments, useCompleteAppointment, useStartAppointment, hasAppointmentsLoadedForSession } from "@/hooks/query/useAppointments";
import { useQueue } from "@/hooks/query/useQueue";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { useCurrentTimestamp } from "@/hooks/utils/useClientDate";
import {
  formatDateInIST,
  getAppointmentDateTimeValue,
  getAppointmentPatientName,
  shouldShowAppointmentOnDoctorDashboard,
} from "@/lib/utils/appointmentUtils";
import { buildVideoSessionRoute } from "@/lib/utils/video-session-route";
import { extractQueueEntries, hasQueuePatientIdentity } from "@/lib/queue/queue-adapter";
import type { AppointmentWithRelations } from "@/types/appointment.types";
import type { CanonicalQueueEntry } from "@/types/queue.types";
import { Activity } from "lucide-react";
import {
  buildDoctorDashboardStats,
  buildDoctorQueueSections,
  doctorDashboardReducer,
  getDisplayDoctorName,
  initialDoctorDashboardState,
  mapDoctorAppointmentToTimelineItem,
  type DoctorQueueSection,
  type TransformedAppointment,
} from "./doctor-dashboard.logic";

const DOCTOR_DASHBOARD_META = (
  <Badge
    variant="outline"
    className="rounded-full border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"
  >
    <Activity className="mr-1 inline-block size-3" />
    Active Shift
  </Badge>
);

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

  const isConsultInProgress = currentConsultStatus === "IN_PROGRESS" || Boolean(currentConsultStartedAtMs);

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

  const stats = useMemo(
    () => buildDoctorDashboardStats(appointmentsArray, appointmentTimeline, liveQueueEntries),
    [appointmentTimeline, appointmentsArray, liveQueueEntries]
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
    dispatch({ type: "setConsultSummary", value: "" });
    dispatch({
      type: "updatePrescriptionModal",
      value: (current) => ({
        ...current,
        skipMedicineSelected: false,
      }),
    });
    await refetchAppointments();
  }, [completeAppointmentMutation, consultSummary, currentInPersonConsult, refetchAppointments]);

  const handleCompleteAppointment = useCallback(
    async (appointmentId: string) => {
      await completeAppointmentMutation.mutateAsync({
        id: appointmentId,
        data: {},
      });
    },
    [completeAppointmentMutation]
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

  return {
    appointmentsArray,
    appointmentsError,
    appointmentTimeline,
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
    onConsultSummaryChange: (value: string) => dispatch({ type: "setConsultSummary", value }),
    onSelectQueueLane: handleSelectQueueLane,
    onToggleSkipMedicine: handleToggleSkipMedicine,
    onJoinVideoSession: (appointmentId: string) => push(buildVideoSessionRoute(appointmentId)),
    onOpenEhr: (patientId: string) => push(`/doctor/patients/${patientId}`),
    onNavigateAppointments: () => push("/doctor/appointments"),
    onNavigatePatients: () => push("/doctor/patients"),
    onOpenQueue: () => push("/queue"),
    onClosePrescriptionModal: () =>
      dispatch({
        type: "updatePrescriptionModal",
        value: (current) => ({
          ...current,
          isOpen: false,
        }),
      }),
    meta: DOCTOR_DASHBOARD_META,
    userId: user?.id || "",
    hasAppointmentsLoadedForSession: hasAppointmentsLoadedForSession(),
  };
}
