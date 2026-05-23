"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useStartAppointment, useCompleteAppointment, useUpdateAppointment } from "@/hooks/query/useAppointments";
import { ConnectionStatusIndicator as WebSocketStatusIndicator } from "@/components/common/StatusIndicator";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { useRealTimeAppointments, useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { showInfoToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { useCurrentTimestamp } from "@/hooks/utils/useClientDate";
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
import {
  getDisplayAppointmentDuration,
} from "@/lib/utils/appointmentUtils";
import {
  Calendar,
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Video,
  Phone,
  MessageSquare,
  Search,
  Eye,
  XCircle,
  Loader2,
} from "lucide-react";
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
} as const;

type DoctorAppointmentViewFilter =
  | typeof APPOINTMENT_STATUS.ALL
  | "ACTIVE"
  | typeof APPOINTMENT_STATUS.IN_PROGRESS
  | typeof APPOINTMENT_STATUS.SCHEDULED
  | typeof APPOINTMENT_STATUS.CONFIRMED
  | typeof APPOINTMENT_STATUS.COMPLETED
  | typeof APPOINTMENT_STATUS.CANCELLED
  | typeof APPOINTMENT_STATUS.NO_SHOW;

const DOCTOR_APPOINTMENT_VIEW_FILTERS: Array<{
  value: DoctorAppointmentViewFilter;
  label: string;
}> = [
  { value: APPOINTMENT_STATUS.ALL, label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: APPOINTMENT_STATUS.COMPLETED, label: "Completed" },
  { value: APPOINTMENT_STATUS.CANCELLED, label: "Cancelled" },
  { value: APPOINTMENT_STATUS.NO_SHOW, label: "No Show" },
];

function getDoctorAppointmentBucket(status: string): DoctorAppointmentViewFilter {
  switch (status) {
    case APPOINTMENT_STATUS.COMPLETED:
      return APPOINTMENT_STATUS.COMPLETED;
    case APPOINTMENT_STATUS.CANCELLED:
      return APPOINTMENT_STATUS.CANCELLED;
    case APPOINTMENT_STATUS.NO_SHOW:
      return APPOINTMENT_STATUS.NO_SHOW;
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
interface TransformedAppointment {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'RESCHEDULED':
      case 'ON_HOLD':
      case 'AWAITING_SLOT_CONFIRMATION':
        return 'bg-amber-100 text-amber-800';
      case APPOINTMENT_STATUS.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
      case APPOINTMENT_STATUS.CONFIRMED: return 'bg-green-100 text-green-800';
      case APPOINTMENT_STATUS.SCHEDULED: return 'bg-gray-100 text-gray-800';
      case APPOINTMENT_STATUS.COMPLETED: return 'bg-purple-100 text-purple-800';
      case APPOINTMENT_STATUS.CANCELLED:
        return 'bg-rose-100 text-rose-800';
      case APPOINTMENT_STATUS.NO_SHOW:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pending',
      RESCHEDULED: 'Rescheduled',
      ON_HOLD: 'On Hold',
      AWAITING_SLOT_CONFIRMATION: 'Awaiting Slot',
      [APPOINTMENT_STATUS.IN_PROGRESS]: 'In Progress',
      [APPOINTMENT_STATUS.SCHEDULED]: 'Scheduled',
      [APPOINTMENT_STATUS.CONFIRMED]: 'Confirmed',
      [APPOINTMENT_STATUS.COMPLETED]: 'Completed',
      [APPOINTMENT_STATUS.CANCELLED]: 'Cancelled',
      [APPOINTMENT_STATUS.NO_SHOW]: 'No Show',
    };
    return labels[status] || status;
  };

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

  const noShowAppointmentsCount = useMemo(
    () => appointments.filter((a: TransformedAppointment) => a.status === APPOINTMENT_STATUS.NO_SHOW).length,
    [appointments]
  );

  const totalAppointmentsCount = appointments.length;
  const selectedAppointmentIsClosed = selectedAppointment
    ? ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(String(selectedAppointment.status))
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

  const appointmentColumns = useMemo<ColumnDef<TransformedAppointment>[]>(
    () => [
      {
        accessorKey: "patientName",
        header: "Patient",
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="min-w-0">
              <div className="font-medium text-foreground">{app.patientName}</div>
              <div className="text-xs text-muted-foreground">
                {app.patientAge ? `${app.patientAge} years` : "Age not set"}
                {app.patientGender ? `  ${app.patientGender}` : "  Unknown"}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="gap-y-1">
              <div className="text-sm font-medium text-foreground">{app.type}</div>
              <div className="text-xs text-muted-foreground">
                {app.appointmentDate}  {app.time}  {app.duration}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const app = row.original;
          return <Badge className={getStatusColor(app.status)}>{getStatusLabel(app.status)}</Badge>;
        },
      },
      {
        accessorKey: "chiefComplaint",
        header: "Details",
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="min-w-0 gap-y-1">
              <div className="text-sm text-foreground line-clamp-1">{app.chiefComplaint}</div>
              <div className="text-xs text-muted-foreground">
                {app.patientPhone || app.patientEmail || "Not available"}
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="flex items-center justify-center gap-2 whitespace-nowrap">
              <Button
                variant="outline"
                size="sm"
                className={WORKFLOW_ICON_BUTTON_CLASS}
                onClick={() => openAppointmentDetails(app)}
                aria-label={`View details for ${app.patientName}`}
              >
                <Eye className="size-4" />
              </Button>
              {app.status === APPOINTMENT_STATUS.CONFIRMED && app.type === "VIDEO_CALL" && (
                <Button
                  size="sm"
                  className={WORKFLOW_ACTION_BUTTON_CLASS}
                  onClick={() => push(buildVideoSessionRoute(app.id))}
                >
                  <Play className="mr-1 size-4" />
                  Join Session
                </Button>
              )}
              {app.status === APPOINTMENT_STATUS.CONFIRMED && app.type !== "VIDEO_CALL" && (
                <Button
                  size="sm"
                  className={WORKFLOW_ACTION_BUTTON_CLASS}
                  onClick={() => startConsultation(app.id, app.doctorId)}
                >
                  <Play className="mr-1 size-4" />
                  Start
                </Button>
              )}
              {app.status === APPOINTMENT_STATUS.IN_PROGRESS && app.type === "VIDEO_CALL" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className={WORKFLOW_ACTION_BUTTON_CLASS}
                    onClick={() => push(buildVideoSessionRoute(app.id))}
                  >
                    <Video className="mr-1 size-4" />
                    Open video
                  </Button>
                  <Button
                    size="sm"
                    className={WORKFLOW_ACTION_BUTTON_CLASS}
                    onClick={() =>
                      completeConsultation(app.id, {
                        diagnosis,
                        prescription,
                        notes: consultationNotes,
                      })
                    }
                    disabled={completeAppointmentMutation.isPending}
                  >
                    <CheckCircle className="mr-1 size-4" />
                    Complete
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [
      completeAppointmentMutation.isPending,
      completeConsultation,
      consultationNotes,
      diagnosis,
      prescription,
      push,
      startConsultation,
    ]
  );

  async function startConsultation(
    appointmentId: string,
    doctorId: string,
    options?: { openVideoAfterStart?: boolean }
  ) {
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
  }

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
    <>
      {isLoadingAppointments ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="size-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <DashboardPageShell>
          <DashboardPageHeader
            eyebrow="Doctor Appointments"
            title="My Appointments"
            description={`Today is ${todayLabel || "today"}. Review active visits and appointment history, including completed, cancelled, and no-show records.`}
            actionsSlot={
              <div className="flex flex-wrap items-center gap-3">
                <BookAppointmentDialog
                  {...(clinicId ? { clinicId } : {})}
                  {...(user?.id ? { initialDoctorId: user.id } : {})}
                  trigger={
                    <Button className="rounded-xl border-0 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500/30">
                      <Calendar className="mr-2 size-4" />
                      Book Appointment
                    </Button>
                  }
                />
                <WebSocketStatusIndicator />
              </div>
            }
          />

          {/* Stats Overview */}
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
            <DashboardMetricCard
              label="Active"
              value={activeAppointmentsCount}
              icon={<Clock className="size-3.5 text-slate-600" />}
              accentClassName="border-l-slate-400"
              valueClassName="text-sm font-semibold text-slate-600 sm:text-base"
              compact
            />
            <DashboardMetricCard
              label="In Progress"
              value={appointments.filter((a: TransformedAppointment) => a.status === APPOINTMENT_STATUS.IN_PROGRESS).length}
              icon={<Play className="size-3.5 text-blue-600" />}
              accentClassName="border-l-blue-400"
              valueClassName="text-sm font-semibold text-blue-600 sm:text-base"
              compact
            />
            <DashboardMetricCard
              label="Completed"
              value={completedAppointmentsCount}
              icon={<CheckCircle className="size-3.5 text-purple-600" />}
              accentClassName="border-l-purple-400"
              valueClassName="text-sm font-semibold text-purple-600 sm:text-base"
              compact
            />
            <DashboardMetricCard
              label="Cancelled"
              value={cancelledAppointmentsCount}
              icon={<XCircle className="size-3.5 text-rose-600" />}
              accentClassName="border-l-rose-400"
              valueClassName="text-sm font-semibold text-rose-600 sm:text-base"
              compact
            />
            <DashboardMetricCard
              label="No Show"
              value={noShowAppointmentsCount}
              icon={<AlertCircle className="size-3.5 text-orange-600" />}
              accentClassName="border-l-orange-400"
              valueClassName="text-sm font-semibold text-orange-600 sm:text-base"
              compact
            />
            <DashboardMetricCard
              label="Total"
              value={totalAppointmentsCount}
              icon={<Calendar className="size-3.5 text-violet-600" />}
              accentClassName="border-l-violet-400"
              valueClassName="text-sm font-semibold text-violet-600 sm:text-base"
              compact
            />
          </div>

          {/* Search and Filters */}
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader className="px-4 pb-3 pt-4">
              <CardTitle className="text-base font-semibold">Filter Appointments</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="gap-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    placeholder="Search by patient name, appointment type, or complaint..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {DOCTOR_APPOINTMENT_VIEW_FILTERS.map((filter) => {
                    const count =
                      filter.value === APPOINTMENT_STATUS.ALL
                        ? totalAppointmentsCount
                        : filter.value === "ACTIVE"
                          ? activeAppointmentsCount
                          : filter.value === APPOINTMENT_STATUS.COMPLETED
                            ? completedAppointmentsCount
                            : filter.value === APPOINTMENT_STATUS.CANCELLED
                              ? cancelledAppointmentsCount
                              : noShowAppointmentsCount;

                    return (
                      <Button
                        key={filter.value}
                        variant={appointmentViewFilter === filter.value ? "default" : "outline"}
                        className="h-10 rounded-xl px-4"
                        onClick={() => setAppointmentViewFilter(filter.value)}
                      >
                        <span className="mr-2">{filter.label}</span>
                        <span className="rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-semibold leading-none text-foreground">
                          {count}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <DataTable
            columns={appointmentColumns}
            data={filteredAppointments}
            emptyMessage="No appointments match this view"
            pageSize={10}
          />

          <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
            <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto p-0">
              {selectedAppointment && (
                <div className="gap-y-4 p-5 sm:p-6">
                  <DialogHeader className="gap-y-2 border-b border-border pb-4">
                    <DialogTitle className="flex flex-col gap-1 text-left sm:flex-row sm:items-center sm:justify-between">
                      <span>Patient Details: {selectedAppointment.patientName}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {selectedAppointment.type}  {selectedAppointment.time}
                      </span>
                    </DialogTitle>
                  </DialogHeader>

                  <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-border/60 bg-background p-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Status</p>
                      <Badge className={`mt-1 ${getStatusColor(selectedAppointment.status)}`}>{getStatusLabel(selectedAppointment.status)}</Badge>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background p-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Visit Type</p>
                      <p className="mt-1 text-sm text-foreground">{selectedAppointment.type}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background p-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Contact</p>
                      <p className="mt-1 text-sm text-foreground">{selectedAppointment.patientPhone || selectedAppointment.patientEmail || "Not available"}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background p-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Queue</p>
                      <p className="mt-1 text-sm text-foreground">{selectedAppointment.queuePosition ?? "-"}</p>
                    </div>
                  </div>

                  <Tabs defaultValue="patient-info" className="gap-y-4">
                    <TabsList className="grid h-11 w-full grid-cols-3 rounded-xl bg-muted p-1">
                      <TabsTrigger value="patient-info">Patient Info</TabsTrigger>
                      <TabsTrigger value="consultation" disabled={selectedAppointmentIsClosed}>Consultation</TabsTrigger>
                      <TabsTrigger value="prescription" disabled={selectedAppointmentIsClosed}>Prescription</TabsTrigger>
                    </TabsList>

                    <TabsContent value="patient-info">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="gap-y-4">
                          <div>
                            <h4 className="mb-2 font-semibold">Contact Information</h4>
                            <div className="gap-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Phone className="size-4" />
                                <span>{selectedAppointment.patientPhone || "Not available"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MessageSquare className="size-4" />
                                <span>{selectedAppointment.patientEmail || "Not available"}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="mb-2 font-semibold">Chief Complaint</h4>
                            <p className="text-sm text-muted-foreground">{selectedAppointment.chiefComplaint}</p>
                          </div>

                          <div>
                            <h4 className="mb-2 font-semibold">Medical History</h4>
                            <p className="text-sm text-muted-foreground">
                              {Array.isArray(selectedAppointment.medicalHistory)
                                ? selectedAppointment.medicalHistory.join(", ") || "None"
                                : selectedAppointment.medicalHistory || "None"}
                            </p>
                          </div>
                        </div>

                        <div className="gap-y-4">
                          {selectedAppointment.vitalSigns && (
                            <div>
                              <h4 className="mb-2 font-semibold">Vital Signs</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>BP: {selectedAppointment.vitalSigns.bp ?? "-"}</div>
                                <div>Pulse: {selectedAppointment.vitalSigns.pulse ?? "-"}</div>
                                <div>Temp: {selectedAppointment.vitalSigns.temperature ?? "-"}</div>
                                <div>Weight: {selectedAppointment.vitalSigns.weight ?? "-"}</div>
                              </div>
                            </div>
                          )}

                          <div>
                            <h4 className="mb-2 font-semibold">Allergies</h4>
                            <p className="text-sm text-muted-foreground">
                              {Array.isArray(selectedAppointment.allergies)
                                ? selectedAppointment.allergies.join(", ") || "None"
                                : selectedAppointment.allergies || "None"}
                            </p>
                          </div>

                          <div>
                            <h4 className="mb-2 font-semibold">Current Medications</h4>
                            <p className="text-sm text-muted-foreground">
                              {Array.isArray(selectedAppointment.currentMedications)
                                ? selectedAppointment.currentMedications.join(", ") || "None"
                                : selectedAppointment.currentMedications || "None"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="consultation">
                      {selectedAppointmentIsClosed ? (
                        <div className="mb-4 rounded-xl border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
                          This appointment is closed. Consultation fields are read-only for completed, cancelled, and no-show visits.
                        </div>
                      ) : null}
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className={WORKFLOW_PANEL_CLASS}>
                          <label htmlFor="diagnosis" className="mb-2 block text-sm font-medium">
                            Diagnosis
                          </label>
                          <Input
                            id="diagnosis"
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                            placeholder="Enter diagnosis..."
                            disabled={selectedAppointmentIsClosed}
                          />
                        </div>

                        <div className={WORKFLOW_PANEL_CLASS}>
                          <label htmlFor="consultationNotes" className="mb-2 block text-sm font-medium">
                            Consultation Notes
                          </label>
                          <Textarea
                            id="consultationNotes"
                            value={consultationNotes}
                            onChange={(e) => setConsultationNotes(e.target.value)}
                            placeholder="Enter detailed consultation notes..."
                            rows={6}
                            disabled={selectedAppointmentIsClosed}
                          />
                        </div>

                        <Button
                          className="h-10 w-full rounded-xl lg:col-span-2"
                          onClick={() => {
                            if (selectedAppointment) {
                              saveConsultationDraft(selectedAppointment.id);
                            }
                          }}
                          disabled={updateAppointmentMutation.isPending || selectedAppointmentIsClosed}
                        >
                          {updateAppointmentMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 size-4 animate-spin" />
                              Saving draft…
                            </>
                          ) : selectedAppointmentIsClosed ? (
                            "Read only"
                          ) : (
                            <>
                              <FileText className="mr-2 size-4" />
                              Save Draft
                            </>
                          )}
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="prescription">
                      {selectedAppointmentIsClosed ? (
                        <div className="mb-4 rounded-xl border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
                          Prescription editing is disabled for closed appointments.
                        </div>
                      ) : null}
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className={WORKFLOW_PANEL_CLASS}>
                          <label htmlFor="prescription" className="mb-2 block text-sm font-medium">
                            Prescription & Treatment Plan
                          </label>
                          <Textarea
                            id="prescription"
                            value={prescription}
                            onChange={(e) => setPrescription(e.target.value)}
                            placeholder="Enter medications, dosage, and treatment instructions..."
                            rows={8}
                            disabled={selectedAppointmentIsClosed}
                          />
                        </div>

                        <div className={WORKFLOW_PANEL_CLASS}>
                          <div className="gap-y-2">
                            <p className="text-sm font-medium text-foreground">Workflow actions</p>
                            <p className="text-sm text-muted-foreground">
                              Save a draft first if you want to preserve interim notes before finalizing the prescription.
                            </p>
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <Button
                            variant="outline"
                            className="h-10 w-full rounded-xl"
                            onClick={() => selectedAppointment && saveConsultationDraft(selectedAppointment.id)}
                            disabled={updateAppointmentMutation.isPending || selectedAppointmentIsClosed}
                          >
                            {updateAppointmentMutation.isPending ? "Saving…" : selectedAppointmentIsClosed ? "Read only" : "Save as Draft"}
                          </Button>
                          <Button
                            className="h-10 w-full rounded-xl"
                            onClick={() => {
                              if (selectedAppointment) {
                                completeConsultation(selectedAppointment.id, {
                                  diagnosis,
                                  prescription,
                                  notes: consultationNotes,
                                });
                              }
                            }}
                            disabled={completeAppointmentMutation.isPending || selectedAppointmentIsClosed}
                          >
                            {completeAppointmentMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Saving…
                              </>
                            ) : selectedAppointmentIsClosed ? (
                              "Read only"
                            ) : (
                              <>
                                <CheckCircle className="mr-2 size-4" />
                                Generate Prescription
                              </>
                            )}
                          </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </DialogContent>
          </Dialog>

        </DashboardPageShell>
      )}
    </>
  );
}





