"use client";

import { useCallback, useMemo, useReducer } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useStartAppointment, useCompleteAppointment, useUpdateAppointment } from "@/hooks/query/useAppointments";
import { useRealTimeAppointments, useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { showInfoToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { useCurrentTimestamp } from "@/hooks/utils/useClientDate";
import { DoctorAppointmentsContent } from "./_components/DoctorAppointmentsContent";
import {
  getAppointmentViewState,
  getAppointmentPatientName,
  getAppointmentDateTimeValue,
  formatDateInIST,
  formatTimeInIST,
  getReceptionistAppointmentDateLabel,
  getReceptionistAppointmentTimeLabel,
} from "@/lib/utils/appointmentUtils";
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
  if (viewFilter === APPOINTMENT_STATUS.ALL) return true;
  if (viewFilter === "ACTIVE") {
    return ["ACTIVE", APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.IN_PROGRESS].includes(
      getDoctorAppointmentBucket(appointmentStatus)
    );
  }

  return getDoctorAppointmentBucket(appointmentStatus) === viewFilter;
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
  duration: string;
  appointmentDate: string;
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
  selectedAppointment: TransformedAppointment | null;
  consultationNotes: string;
  prescription: string;
  diagnosis: string;
};

type DoctorAppointmentsAction =
  | { type: "setSearchTerm"; value: string }
  | { type: "setAppointmentViewFilter"; value: DoctorAppointmentViewFilter }
  | { type: "setSelectedAppointment"; value: TransformedAppointment | null }
  | { type: "setConsultationNotes"; value: string }
  | { type: "setPrescription"; value: string }
  | { type: "setDiagnosis"; value: string }
  | { type: "resetConsultationDraft" };

const initialDoctorAppointmentsState: DoctorAppointmentsState = {
  searchTerm: "",
  appointmentViewFilter: APPOINTMENT_STATUS.ALL,
  selectedAppointment: null,
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
    case "setSelectedAppointment":
      return { ...state, selectedAppointment: action.value };
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

const WORKFLOW_ACTION_BUTTON_CLASS = "h-9 rounded-xl px-3 gap-2";
const WORKFLOW_ICON_BUTTON_CLASS = "size-9 rounded-xl";
const WORKFLOW_PANEL_CLASS = "rounded-2xl border border-border bg-muted/20 p-4";

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
      selectedAppointment,
      consultationNotes,
      prescription,
      diagnosis,
    },
    dispatch,
  ] = useReducer(doctorAppointmentsReducer, initialDoctorAppointmentsState);

  const setSearchTerm = (value: string) => {
    dispatch({ type: "setSearchTerm", value });
  };

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

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync();

  // Mutations for appointment actions
  const startAppointmentMutation = useStartAppointment();
  const completeAppointmentMutation = useCompleteAppointment();
  const updateAppointmentMutation = useUpdateAppointment();

  // Transform appointments data
  const appointments = useMemo(() => {
    const apps = extractAppointments(appointmentsData);

    return apps
      .map((app: any): TransformedAppointment => {
        const displayDuration = getDisplayAppointmentDuration(app);
        const viewState = getAppointmentViewState(app);
        const appointmentDateTime = getAppointmentDateTimeValue(app);

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
          duration: typeof displayDuration === "number" ? `${displayDuration} min` : "30 min",
          appointmentDate: appointmentDateTime
            ? formatDateInIST(appointmentDateTime, { weekday: "short", day: "2-digit", month: "short" })
            : getReceptionistAppointmentDateLabel(app as Record<string, unknown>),
          startTime: app.startTime || "",
          createdAt: app.createdAt || app.updatedAt || "",
          patientPhone: app.patient?.phone || "",
          patientEmail: app.patient?.email || "",
          chiefComplaint: app.chiefComplaint || app.reason || "Not specified",
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
  }, [appointmentsData]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((app: TransformedAppointment) => {
      const matchesSearch =
        !searchTerm ||
        app.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.chiefComplaint?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = matchesDoctorAppointmentViewFilter(app.status, appointmentViewFilter);

      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, appointmentViewFilter]);

  const completedAppointmentsCount = useMemo(
    () => appointments.filter((a: TransformedAppointment) => a.status === APPOINTMENT_STATUS.COMPLETED).length,
    [appointments]
  );

  const activeAppointmentsCount = useMemo(
    () => appointments.filter((a: TransformedAppointment) => matchesDoctorAppointmentViewFilter(a.status, "ACTIVE")).length,
    [appointments]
  );

  const cancelledAppointmentsCount = useMemo(
    () => appointments.filter((a: TransformedAppointment) => a.status === APPOINTMENT_STATUS.CANCELLED).length,
    [appointments]
  );

  const expiredAppointmentsCount = useMemo(
    () => appointments.filter((a: TransformedAppointment) => a.status === APPOINTMENT_STATUS.EXPIRED).length,
    [appointments]
  );

  const noShowAppointmentsCount = useMemo(
    () => appointments.filter((a: TransformedAppointment) => a.status === APPOINTMENT_STATUS.NO_SHOW).length,
    [appointments]
  );

  const totalAppointmentsCount = appointments.length;
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

  const openAppointmentDetails = (appointment: TransformedAppointment) => {
    setSelectedAppointment(appointment);

    const draft = readConsultationDraftMetadata(appointment.metadata);
    setDiagnosis(draft?.diagnosis ?? appointment.diagnosis ?? "");
    setPrescription(draft?.prescription ?? appointment.prescription ?? "");
    setConsultationNotes(draft?.notes ?? "");
  };

  return (
    <DoctorAppointmentsContent
      isLoadingAppointments={isLoadingAppointments}
      todayLabel={todayLabel}
      clinicId={clinicId}
      userId={user?.id}
      searchTerm={searchTerm}
      appointmentViewFilter={appointmentViewFilter}
      appointments={appointments}
      filteredAppointments={filteredAppointments}
      activeAppointmentsCount={activeAppointmentsCount}
        inProgressAppointmentsCount={appointments.filter((a: TransformedAppointment) => a.status === APPOINTMENT_STATUS.IN_PROGRESS).length}
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
      setSelectedAppointment={setSelectedAppointment}
      setDiagnosis={setDiagnosis}
      setPrescription={setPrescription}
      setConsultationNotes={setConsultationNotes}
      completeAppointmentPending={completeAppointmentMutation.isPending}
      updateAppointmentPending={updateAppointmentMutation.isPending}
      openAppointmentDetails={openAppointmentDetails}
      saveConsultationDraft={saveConsultationDraft}
      completeConsultation={completeConsultation}
      startConsultation={startConsultation}
    />
  );
}





