"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useStartAppointment, useCompleteAppointment, useUpdateAppointment, useBulkCompleteAppointments } from "@/hooks/query/useAppointments";
import { useRealTimeAppointments, useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { showInfoToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { useCurrentTimestamp } from "@/hooks/utils/useClientDate";
const DoctorAppointmentsContent = dynamic(
  () => import("./_components/DoctorAppointmentsContent").then((module) => module.DoctorAppointmentsContent),
  {
    ssr: false,
    loading: () => <DashboardPageSkeleton />,
  }
);
import {
  getAppointmentViewState,
  getAppointmentPatientName,
  getAppointmentDateTimeValue,
  formatDateInIST,
  formatTimeInIST,
  getReceptionistAppointmentDateLabel,
  getReceptionistAppointmentTimeLabel,
  getAppointmentPaymentDisplayState,
  getVideoSessionDecision,
  VIDEO_JOIN_EARLY_WINDOW_MINUTES,
} from "@/lib/utils/appointmentUtils";
import { formatDateKeyInIST } from "@/lib/utils/date-time";
import { buildVideoSessionRoute } from "@/lib/utils/video-session-route";
import { getDisplayAppointmentDuration } from "@/lib/utils/appointmentUtils";
import type { AppointmentStatus } from "@/types/appointment.types";

// Appointment status constants - must match backend enum values
const APPOINTMENT_STATUS = {
  ALL: 'ALL',
  IN_PROGRESS: 'IN_PROGRESS',
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
  EXPIRED: 'EXPIRED',
} as const;

export type DoctorAppointmentViewFilter =
  | typeof APPOINTMENT_STATUS.ALL
  | "ACTIVE"
  | typeof APPOINTMENT_STATUS.IN_PROGRESS
  | typeof APPOINTMENT_STATUS.SCHEDULED
  | typeof APPOINTMENT_STATUS.CONFIRMED
  | typeof APPOINTMENT_STATUS.COMPLETED
  | typeof APPOINTMENT_STATUS.CANCELLED
  | typeof APPOINTMENT_STATUS.NO_SHOW
  | typeof APPOINTMENT_STATUS.EXPIRED;

/** Date scope for the doctor appointments list. */
export type DoctorAppointmentDateFilter =
  | "ALL"
  | "TODAY"
  | "TOMORROW"
  | "THIS_WEEK"
  | "CUSTOM";

function getDoctorAppointmentBucket(status: string): DoctorAppointmentViewFilter {
  switch (status) {
    case APPOINTMENT_STATUS.COMPLETED:
      return APPOINTMENT_STATUS.COMPLETED;
    case APPOINTMENT_STATUS.CANCELLED:
      return APPOINTMENT_STATUS.CANCELLED;
    case APPOINTMENT_STATUS.NO_SHOW:
      return APPOINTMENT_STATUS.NO_SHOW;
    case APPOINTMENT_STATUS.EXPIRED:
      return APPOINTMENT_STATUS.EXPIRED;
    case APPOINTMENT_STATUS.IN_PROGRESS:
      return APPOINTMENT_STATUS.IN_PROGRESS;
    case APPOINTMENT_STATUS.CONFIRMED:
      return APPOINTMENT_STATUS.CONFIRMED;
    case APPOINTMENT_STATUS.SCHEDULED:
    default:
      return "ACTIVE";
  }
}

function matchesDoctorAppointmentViewFilter(
  appointmentStatus: string,
  viewFilter: DoctorAppointmentViewFilter
): boolean {
  // "All statuses" hides expired slots (they swamp the list); pick "Expired" to see them.
  if (viewFilter === APPOINTMENT_STATUS.ALL) return appointmentStatus !== APPOINTMENT_STATUS.EXPIRED;
  if (viewFilter === "ACTIVE") {
    return ["ACTIVE", APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.IN_PROGRESS].includes(
      getDoctorAppointmentBucket(appointmentStatus)
    );
  }

  return getDoctorAppointmentBucket(appointmentStatus) === viewFilter;
}

function shiftIstDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return dateKey;
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return `${String(utc.getUTCFullYear()).padStart(4, "0")}-${String(utc.getUTCMonth() + 1).padStart(2, "0")}-${String(utc.getUTCDate()).padStart(2, "0")}`;
}

/** Monday–Sunday week that contains `dateKey` (IST calendar date). */
function getIstWeekRange(dateKey: string): { start: string; end: string } {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) {
    return { start: dateKey, end: dateKey };
  }
  const probe = new Date(Date.UTC(year, month - 1, day));
  // 0=Sun … 6=Sat → Monday-start offset
  const weekday = probe.getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const start = shiftIstDateKey(dateKey, mondayOffset);
  return { start, end: shiftIstDateKey(start, 6) };
}

function matchesDoctorAppointmentDateFilter(
  appointmentDateKey: string,
  dateFilter: DoctorAppointmentDateFilter,
  dateFrom: string,
  dateTo: string,
  todayKey: string,
): boolean {
  if (dateFilter === "ALL") return true;
  if (!appointmentDateKey) return false;
  if (dateFilter === "TODAY") return appointmentDateKey === todayKey;
  if (dateFilter === "TOMORROW") return appointmentDateKey === shiftIstDateKey(todayKey, 1);
  if (dateFilter === "THIS_WEEK") {
    const { start, end } = getIstWeekRange(todayKey);
    return appointmentDateKey >= start && appointmentDateKey <= end;
  }
  if (dateFilter === "CUSTOM") {
    if (!dateFrom && !dateTo) return true;
    if (dateFrom && appointmentDateKey < dateFrom) return false;
    if (dateTo && appointmentDateKey > dateTo) return false;
    return true;
  }
  return true;
}

// Interface for the transformed appointment object
export interface TransformedAppointment {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  patientAge: number | null;
  patientGender: string;
  time: string;
  status: AppointmentStatus;
  type: string;
  /** True for a video visit (`VIDEO_CALL`). */
  isVideo: boolean;
  /**
   * The doctor may open the video room now: the visit is confirmed (or scheduled and paid)
   * and `getVideoSessionDecision` says the join window is open.
   */
  canJoinVideo: boolean;
  /** A confirmed video visit whose join window has not opened yet. */
  joinOpensLater: boolean;
  /**
   * The join window of a video visit has opened (scheduled start minus the early-join
   * allowance). False when the row has no usable schedule, so a confirmed video visit without a
   * time never offers Complete; the backend applies the same gate and fails closed.
   */
  joinWindowOpen: boolean;
  duration: string;
  appointmentDate: string;
  /** YYYY-MM-DD in IST — used by the date filter. */
  appointmentDateKey: string;
  startTime?: string;
  createdAt?: string;
  patientPhone: string;
  patientEmail: string;
  chiefComplaint: string;
  medicalHistory: string[] | string;
  allergies: string[] | string;
  currentMedications: string[] | string;
  vitalSigns: {
    bp?: string;
    pulse?: string;
    temperature?: string;
    weight?: string;
  } | null;
  checkedInAt: string | null;
  queuePosition: number | null;
  diagnosis?: string;
  prescription?: string;
  treatmentPlan?: string;
  metadata?: Record<string, unknown>;
}

interface ConsultationDraftState {
  diagnosis?: string;
  prescription?: string;
  notes?: string;
  treatmentPlan?: string;
  savedAt?: string;
  savedBy?: string | null;
}

type DoctorAppointmentsState = {
  searchTerm: string;
  appointmentViewFilter: DoctorAppointmentViewFilter;
  dateFilter: DoctorAppointmentDateFilter;
  /** Inclusive YYYY-MM-DD range when dateFilter is CUSTOM. */
  dateFrom: string;
  dateTo: string;
  selectedAppointment: TransformedAppointment | null;
  /** The visit the diagnosis / notes / prescription fields below were loaded for. */
  draftAppointmentId: string | null;
  consultationNotes: string;
  prescription: string;
  diagnosis: string;
};

type DoctorAppointmentsAction =
  | { type: "setSearchTerm"; value: string }
  | { type: "setAppointmentViewFilter"; value: DoctorAppointmentViewFilter }
  | { type: "setDateFilter"; value: DoctorAppointmentDateFilter }
  | { type: "setDateRange"; from: string; to: string }
  | { type: "setSelectedAppointment"; value: TransformedAppointment | null }
  | { type: "setDraftAppointmentId"; value: string | null }
  | { type: "setConsultationNotes"; value: string }
  | { type: "setPrescription"; value: string }
  | { type: "setDiagnosis"; value: string }
  | { type: "resetConsultationDraft" };

const initialDoctorAppointmentsState: DoctorAppointmentsState = {
  searchTerm: "",
  appointmentViewFilter: APPOINTMENT_STATUS.ALL,
  dateFilter: "ALL",
  dateFrom: "",
  dateTo: "",
  selectedAppointment: null,
  draftAppointmentId: null,
  consultationNotes: "",
  prescription: "",
  diagnosis: "",
};

function doctorAppointmentsReducer(
  state: DoctorAppointmentsState,
  action: DoctorAppointmentsAction
): DoctorAppointmentsState {
  switch (action.type) {
    case "setSearchTerm":
      return { ...state, searchTerm: action.value };
    case "setAppointmentViewFilter":
      return { ...state, appointmentViewFilter: action.value };
    case "setDateFilter":
      return {
        ...state,
        dateFilter: action.value,
        dateFrom: action.value === "CUSTOM" ? state.dateFrom : "",
        dateTo: action.value === "CUSTOM" ? state.dateTo : "",
      };
    case "setDateRange":
      return {
        ...state,
        dateFrom: action.from,
        dateTo: action.to,
        dateFilter: action.from || action.to ? "CUSTOM" : state.dateFilter,
      };
    case "setSelectedAppointment":
      return { ...state, selectedAppointment: action.value };
    case "setDraftAppointmentId":
      return { ...state, draftAppointmentId: action.value };
    case "setConsultationNotes":
      return { ...state, consultationNotes: action.value };
    case "setPrescription":
      return { ...state, prescription: action.value };
    case "setDiagnosis":
      return { ...state, diagnosis: action.value };
    case "resetConsultationDraft":
      return {
        ...state,
        selectedAppointment: null,
        draftAppointmentId: null,
        consultationNotes: "",
        prescription: "",
        diagnosis: "",
      };
    default:
      return state;
  }
}

function readConsultationDraftMetadata(metadata: unknown): ConsultationDraftState | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const record = metadata as Record<string, unknown>;
  const draft = record.consultationDraft;

  if (!draft || typeof draft !== "object" || Array.isArray(draft)) {
    return null;
  }

  const draftRecord = draft as Record<string, unknown>;
  const draftState: ConsultationDraftState = {};

  if (typeof draftRecord.diagnosis === "string") draftState.diagnosis = draftRecord.diagnosis;
  if (typeof draftRecord.prescription === "string") draftState.prescription = draftRecord.prescription;
  if (typeof draftRecord.notes === "string") draftState.notes = draftRecord.notes;
  if (typeof draftRecord.treatmentPlan === "string") draftState.treatmentPlan = draftRecord.treatmentPlan;
  if (typeof draftRecord.savedAt === "string") draftState.savedAt = draftRecord.savedAt;
  if (typeof draftRecord.savedBy === "string") draftState.savedBy = draftRecord.savedBy;

  return draftState;
}

function extractAppointments(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["appointments", "data", "items", "records"]) {
      const candidate = record[key];
      if (Array.isArray(candidate)) return candidate;
      if (candidate && typeof candidate === "object") {
        const nested = candidate as Record<string, unknown>;
        if (Array.isArray(nested.appointments)) return nested.appointments as any[];
        if (Array.isArray(nested.data)) return nested.data as any[];
      }
    }
  }
  return [];
}

/** How often the video join window is checked again while the page stays open. */
const JOIN_WINDOW_RECHECK_MS = 30_000;

export default function DoctorAppointments() {
  const { push } = useRouter();
  const { session } = useAuth();
  const user = session?.user;
  const { clinicId } = useClinicContext();
  const currentTimestamp = useCurrentTimestamp();
  const todayLabel = useMemo(() => {
    if (!currentTimestamp) {
      return "";
    }

    return formatDateInIST(new Date(currentTimestamp), {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [currentTimestamp]);
  const [
    {
      searchTerm,
      appointmentViewFilter,
      dateFilter,
      dateFrom,
      dateTo,
      selectedAppointment,
      draftAppointmentId,
      consultationNotes,
      prescription,
      diagnosis,
    },
    dispatch,
  ] = useReducer(doctorAppointmentsReducer, initialDoctorAppointmentsState);

  const setSearchTerm = (value: string) => {
    dispatch({ type: "setSearchTerm", value });
  };

  const setDateFilter = (value: DoctorAppointmentDateFilter) => {
    dispatch({ type: "setDateFilter", value });
  };

  const setDateRange = (from: string, to: string) => {
    dispatch({ type: "setDateRange", from, to });
  };

  // Links such as the dashboard's "Missed Appointments" open a specific view
  // (`?view=NO_SHOW`). Read once after mount so server and first paint agree.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("view");
    if (!wanted) return;
    const valid: DoctorAppointmentViewFilter[] = [
      APPOINTMENT_STATUS.ALL,
      "ACTIVE",
      APPOINTMENT_STATUS.CONFIRMED,
      APPOINTMENT_STATUS.COMPLETED,
      APPOINTMENT_STATUS.CANCELLED,
      APPOINTMENT_STATUS.EXPIRED,
      APPOINTMENT_STATUS.NO_SHOW,
    ];
    const match = valid.find((v) => v === wanted);
    if (match) dispatch({ type: "setAppointmentViewFilter", value: match });
  }, []);

  const setAppointmentViewFilter = (value: DoctorAppointmentViewFilter) => {
    dispatch({ type: "setAppointmentViewFilter", value });
  };

  const setSelectedAppointment = (value: TransformedAppointment | null) => {
    dispatch({ type: "setSelectedAppointment", value });
  };

  const setConsultationNotes = (value: string) => {
    dispatch({ type: "setConsultationNotes", value });
  };

  const setPrescription = (value: string) => {
    dispatch({ type: "setPrescription", value });
  };

  const setDiagnosis = (value: string) => {
    dispatch({ type: "setDiagnosis", value });
  };
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

  // Fetch real appointment data
  const realTimeAppointments = useRealTimeAppointments({
    doctorId: user?.id || undefined,
    startDate: historyStartDate,
    endDate: futureEndDate,
    limit: 500,
  } as any);

  const appointmentsData = realTimeAppointments.data;
  const isLoadingAppointments = realTimeAppointments.isFetching && !realTimeAppointments.data;
  const appointmentsLoadFailed =
    Boolean(realTimeAppointments.error) && !realTimeAppointments.data && !realTimeAppointments.isFetching;
  const refetchAppointments = realTimeAppointments.refetch;
  const retryLoadAppointments = useCallback(() => {
    void refetchAppointments();
  }, [refetchAppointments]);

  // The video join window opens 15 minutes before the slot, so the Join button has to
  // appear while the page is open. Re-evaluate the rows on a slow clock.
  const [joinClock, setJoinClock] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setJoinClock((tick) => tick + 1), JOIN_WINDOW_RECHECK_MS);
    return () => window.clearInterval(timer);
  }, []);

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync();

  // Mutations for appointment actions
  const startAppointmentMutation = useStartAppointment();
  const completeAppointmentMutation = useCompleteAppointment();
  const updateAppointmentMutation = useUpdateAppointment();
  const bulkCompleteMutation = useBulkCompleteAppointments();

  // Transform appointments data
  const appointments = useMemo(() => {
    const apps = extractAppointments(appointmentsData);

    return apps
      .map((app: any): TransformedAppointment => {
        const displayDuration = getDisplayAppointmentDuration(app);
        const viewState = getAppointmentViewState(app);
        const appointmentDateTime = getAppointmentDateTimeValue(app);
        const normalizedStatus = String(viewState.normalizedStatus || "").toUpperCase();
        const rawType = String(app.type || app.appointmentType || "").toUpperCase();
        const isVideo = rawType === "VIDEO_CALL";
        // Same rule as the dashboard schedule card: confirmed, or scheduled and paid, and
        // the join window is open.
        const canJoinVideo =
          isVideo &&
          (normalizedStatus === APPOINTMENT_STATUS.CONFIRMED ||
            (normalizedStatus === APPOINTMENT_STATUS.SCHEDULED &&
              getAppointmentPaymentDisplayState(app).paymentCompleted)) &&
          getVideoSessionDecision(app).canJoin;
        const joinOpensAtMs = appointmentDateTime
          ? appointmentDateTime.getTime() - VIDEO_JOIN_EARLY_WINDOW_MINUTES * 60_000
          : null;
        const joinOpensLater =
          isVideo &&
          !canJoinVideo &&
          normalizedStatus === APPOINTMENT_STATUS.CONFIRMED &&
          joinOpensAtMs !== null &&
          Date.now() < joinOpensAtMs;
        const joinWindowOpen = isVideo && joinOpensAtMs !== null && Date.now() >= joinOpensAtMs;

        return {
          id: app.id,
          appointmentId: app.id,
          patientId: app.patientId || app.patient?.id || app.patient?.userId || "",
          doctorId: app.doctorId || app.doctor?.id || app.doctor?.userId || "",
          patientName:
            getAppointmentPatientName(app) ||
            app.patient?.name ||
            `${app.patient?.firstName || ""} ${app.patient?.lastName || ""}`.trim() ||
            "Unknown Patient",
          patientAge: app.patient?.age || (app.patient?.dateOfBirth ? Math.floor((new Date().getTime() - new Date(app.patient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)) : null),
          patientGender: app.patient?.gender || "Unknown",
          time: appointmentDateTime
            ? formatTimeInIST(appointmentDateTime, { hour: "2-digit", minute: "2-digit", hour12: true })
            : getReceptionistAppointmentTimeLabel(app as Record<string, unknown>),
          status: viewState.normalizedStatus as AppointmentStatus,
          type: app.type || app.appointmentType || "Consultation",
          isVideo,
          canJoinVideo,
          joinOpensLater,
          joinWindowOpen,
          duration: typeof displayDuration === "number" ? `${displayDuration} min` : "30 min",
          appointmentDate: appointmentDateTime
            ? formatDateInIST(appointmentDateTime, { weekday: "short", day: "2-digit", month: "short" })
            : getReceptionistAppointmentDateLabel(app as Record<string, unknown>),
          appointmentDateKey: appointmentDateTime
            ? formatDateKeyInIST(appointmentDateTime)
            : app.startTime
              ? formatDateKeyInIST(app.startTime)
              : "",
          startTime: app.startTime || "",
          createdAt: app.createdAt || app.updatedAt || "",
          patientPhone: app.patient?.phone || "",
          patientEmail: app.patient?.email || "",
          chiefComplaint: app.chiefComplaint || app.reason || "",
          medicalHistory: app.patient?.medicalHistory || [],
          allergies: app.patient?.allergies || [],
          currentMedications: app.patient?.currentMedications || [],
          vitalSigns: app.vitalSigns || null,
          checkedInAt: app.checkedInAt ? formatTimeInIST(app.checkedInAt) : null,
          queuePosition: app.queuePosition || null,
          diagnosis: typeof app.diagnosis === "string" ? app.diagnosis : "",
          prescription: typeof app.prescription === "string" ? app.prescription : "",
          treatmentPlan: typeof app.treatmentPlan === "string" ? app.treatmentPlan : "",
          metadata:
            app.metadata && typeof app.metadata === "object" && !Array.isArray(app.metadata)
              ? (app.metadata as Record<string, unknown>)
              : {},
        };
      })
      .sort((left: TransformedAppointment, right: TransformedAppointment) => {
        const leftTime = new Date(left.startTime || left.createdAt || 0).getTime();
        const rightTime = new Date(right.startTime || right.createdAt || 0).getTime();
        return rightTime - leftTime;
      });
    // joinClock only forces the join window to be checked again.
  }, [appointmentsData, joinClock]);

  const todayDateKey = useMemo(
    () => formatDateKeyInIST(currentTimestamp ? new Date(currentTimestamp) : new Date()),
    [currentTimestamp],
  );

  // Status counts follow the selected date scope so chips stay honest.
  const dateScopedAppointments = useMemo(() => {
    return appointments.filter((app: TransformedAppointment) =>
      matchesDoctorAppointmentDateFilter(
        app.appointmentDateKey,
        dateFilter,
        dateFrom,
        dateTo,
        todayDateKey,
      ),
    );
  }, [appointments, dateFilter, dateFrom, dateTo, todayDateKey]);

  const filteredAppointments = useMemo(() => {
    return dateScopedAppointments.filter((app: TransformedAppointment) => {
      const matchesSearch =
        !searchTerm ||
        app.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.chiefComplaint?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = matchesDoctorAppointmentViewFilter(app.status, appointmentViewFilter);

      return matchesSearch && matchesStatus;
    });
  }, [dateScopedAppointments, searchTerm, appointmentViewFilter]);

  const completedAppointmentsCount = useMemo(
    () => dateScopedAppointments.filter((a: TransformedAppointment) => a.status === APPOINTMENT_STATUS.COMPLETED).length,
    [dateScopedAppointments]
  );

  const activeAppointmentsCount = useMemo(
    () => dateScopedAppointments.filter((a: TransformedAppointment) => matchesDoctorAppointmentViewFilter(a.status, "ACTIVE")).length,
    [dateScopedAppointments]
  );

  const confirmedAppointmentsCount = useMemo(
    () => dateScopedAppointments.filter((a: TransformedAppointment) => matchesDoctorAppointmentViewFilter(a.status, APPOINTMENT_STATUS.CONFIRMED)).length,
    [dateScopedAppointments]
  );

  const cancelledAppointmentsCount = useMemo(
    () => dateScopedAppointments.filter((a: TransformedAppointment) => a.status === APPOINTMENT_STATUS.CANCELLED).length,
    [dateScopedAppointments]
  );

  const expiredAppointmentsCount = useMemo(
    () => dateScopedAppointments.filter((a: TransformedAppointment) => a.status === APPOINTMENT_STATUS.EXPIRED).length,
    [dateScopedAppointments]
  );

  const noShowAppointmentsCount = useMemo(
    () => dateScopedAppointments.filter((a: TransformedAppointment) => a.status === APPOINTMENT_STATUS.NO_SHOW).length,
    [dateScopedAppointments]
  );

  const inProgressAppointmentsCount = useMemo(
    () => dateScopedAppointments.filter((a: TransformedAppointment) => a.status === APPOINTMENT_STATUS.IN_PROGRESS).length,
    [dateScopedAppointments]
  );

  const totalAppointmentsCount = dateScopedAppointments.length - expiredAppointmentsCount;
  const selectedAppointmentIsClosed = selectedAppointment
    ? ["COMPLETED", "CANCELLED", "NO_SHOW", "EXPIRED"].includes(String(selectedAppointment.status))
    : false;

  const completeConsultation = useCallback(
    async (
      appointmentId: string,
      data?: {
        diagnosis?: string;
        prescription?: string;
        notes?: string;
      }
    ) => {
      try {
        const completionData = {
          ...(data?.diagnosis ? { diagnosis: data.diagnosis } : {}),
          ...(data?.prescription ? { prescription: data.prescription } : {}),
          ...(data?.notes ? { notes: data.notes } : {}),
          ...(data?.prescription ? { treatmentPlan: data.prescription } : {}),
        };

        await completeAppointmentMutation.mutateAsync({
          id: appointmentId,
          data: completionData,
        });
        dispatch({ type: "resetConsultationDraft" });
      } catch (error: unknown) {
        console.error("Failed to complete consultation", {
          appointmentId,
          error,
        });
      }
    },
    [completeAppointmentMutation]
  );

  const startConsultation = useCallback(
    async (
      appointmentId: string,
      doctorId: string,
      options?: { openVideoAfterStart?: boolean }
    ) => {
      try {
        await startAppointmentMutation.mutateAsync({
          appointmentId,
          doctorId,
        });
        if (options?.openVideoAfterStart) {
          push(buildVideoSessionRoute(appointmentId));
        }
      } catch (error: unknown) {
        console.error("Failed to start consultation", {
          appointmentId,
          doctorId,
          error,
        });
      }
    },
    [push, startAppointmentMutation]
  );

  const saveConsultationDraft = async (appointmentId: string) => {
    const trimmedDiagnosis = diagnosis.trim();
    const trimmedPrescription = prescription.trim();
    const trimmedNotes = consultationNotes.trim();
    const trimmedTreatmentPlan = trimmedPrescription;

    if (!trimmedDiagnosis && !trimmedPrescription && !trimmedNotes) {
      showInfoToast("Enter diagnosis, notes, or prescription before saving a draft", {
        id: TOAST_IDS.GLOBAL.INFO,
      });
      return;
    }

    try {
      const draftPayload = {
        ...(trimmedDiagnosis ? { diagnosis: trimmedDiagnosis } : {}),
        ...(trimmedPrescription ? { prescription: trimmedPrescription } : {}),
        ...(trimmedTreatmentPlan ? { treatmentPlan: trimmedTreatmentPlan } : {}),
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
      };

      const draftMetadata: Record<string, unknown> = {
        consultationDraft: {
          ...(trimmedDiagnosis ? { diagnosis: trimmedDiagnosis } : {}),
          ...(trimmedPrescription ? { prescription: trimmedPrescription } : {}),
          ...(trimmedTreatmentPlan ? { treatmentPlan: trimmedTreatmentPlan } : {}),
          ...(trimmedNotes ? { notes: trimmedNotes } : {}),
          savedAt: new Date().toISOString(),
          savedBy: user?.id || null,
        },
      };

      await updateAppointmentMutation.mutateAsync({
        id: appointmentId,
        data: {
          ...draftPayload,
          metadata: draftMetadata,
        },
      });

      dispatch({
        type: "setSelectedAppointment",
        value:
          selectedAppointment && selectedAppointment.id === appointmentId
            ? {
                ...selectedAppointment,
                diagnosis: trimmedDiagnosis,
                prescription: trimmedPrescription,
                treatmentPlan: trimmedTreatmentPlan,
                metadata: {
                  ...(selectedAppointment.metadata || {}),
                  consultationDraft: {
                    ...(trimmedDiagnosis ? { diagnosis: trimmedDiagnosis } : {}),
                    ...(trimmedPrescription ? { prescription: trimmedPrescription } : {}),
                    ...(trimmedTreatmentPlan ? { treatmentPlan: trimmedTreatmentPlan } : {}),
                    ...(trimmedNotes ? { notes: trimmedNotes } : {}),
                    savedAt: new Date().toISOString(),
                    savedBy: user?.id || null,
                  },
                },
              }
            : selectedAppointment,
      });
    } catch (error: unknown) {
      void error;
    }
  };

  const bulkCompleteSelected = useCallback(
    async (appointmentIds: string[]): Promise<{ completed: number; failed: number } | undefined> => {
      try {
        return await bulkCompleteMutation.mutateAsync({
          appointmentIds,
          ...(user?.id ? { doctorId: user.id } : {}),
        });
      } catch (error: unknown) {
        console.error("Failed to bulk complete appointments", { appointmentIds, error });
        return undefined;
      }
    },
    [bulkCompleteMutation, user?.id]
  );

  // "Complete" on a table row. The diagnosis / notes / prescription fields belong to the
  // visit that was last opened in the details dialog, so they are sent only when they were
  // loaded for this same visit. Any other row is completed with its own saved draft, never
  // with another patient's notes.
  const completeAppointmentFromRow = (appointment: TransformedAppointment) => {
    if (draftAppointmentId === appointment.id) {
      return completeConsultation(appointment.id, { diagnosis, prescription, notes: consultationNotes });
    }

    const draft = readConsultationDraftMetadata(appointment.metadata);
    return completeConsultation(appointment.id, {
      diagnosis: draft?.diagnosis ?? appointment.diagnosis ?? "",
      prescription: draft?.prescription ?? appointment.prescription ?? "",
      notes: draft?.notes ?? "",
    });
  };

  const openAppointmentDetails = (appointment: TransformedAppointment) => {
    setSelectedAppointment(appointment);
    dispatch({ type: "setDraftAppointmentId", value: appointment.id });

    const draft = readConsultationDraftMetadata(appointment.metadata);
    setDiagnosis(draft?.diagnosis ?? appointment.diagnosis ?? "");
    setPrescription(draft?.prescription ?? appointment.prescription ?? "");
    setConsultationNotes(draft?.notes ?? "");
  };

  return (
    <DoctorAppointmentsContent
      isLoadingAppointments={isLoadingAppointments}
      appointmentsLoadFailed={appointmentsLoadFailed}
      retryLoadAppointments={retryLoadAppointments}
      todayLabel={todayLabel}
      clinicId={clinicId}
      userId={user?.id}
      searchTerm={searchTerm}
      appointmentViewFilter={appointmentViewFilter}
      dateFilter={dateFilter}
      dateFrom={dateFrom}
      dateTo={dateTo}
      appointments={appointments}
      filteredAppointments={filteredAppointments}
      activeAppointmentsCount={activeAppointmentsCount}
      inProgressAppointmentsCount={inProgressAppointmentsCount}
      confirmedAppointmentsCount={confirmedAppointmentsCount}
      completedAppointmentsCount={completedAppointmentsCount}
      cancelledAppointmentsCount={cancelledAppointmentsCount}
      expiredAppointmentsCount={expiredAppointmentsCount}
      noShowAppointmentsCount={noShowAppointmentsCount}
      totalAppointmentsCount={totalAppointmentsCount}
      selectedAppointment={selectedAppointment}
      selectedAppointmentIsClosed={selectedAppointmentIsClosed}
      diagnosis={diagnosis}
      prescription={prescription}
      consultationNotes={consultationNotes}
      setSearchTerm={setSearchTerm}
      setAppointmentViewFilter={setAppointmentViewFilter}
      setDateFilter={setDateFilter}
      setDateRange={setDateRange}
      setSelectedAppointment={setSelectedAppointment}
      setDiagnosis={setDiagnosis}
      setPrescription={setPrescription}
      setConsultationNotes={setConsultationNotes}
      completeAppointmentPending={completeAppointmentMutation.isPending}
      updateAppointmentPending={updateAppointmentMutation.isPending}
      openAppointmentDetails={openAppointmentDetails}
      saveConsultationDraft={saveConsultationDraft}
      completeConsultation={completeConsultation}
      completeAppointmentFromRow={completeAppointmentFromRow}
      startConsultation={startConsultation}
      startAppointmentPending={startAppointmentMutation.isPending}
      bulkCompleteSelected={bulkCompleteSelected}
      bulkCompletePending={bulkCompleteMutation.isPending}
    />
  );
}
