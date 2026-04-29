"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import type { VideoAppointment } from "@/hooks/query/useVideoAppointments";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useStartAppointment, useCompleteAppointment } from "@/hooks/query/useAppointments";
import { ConnectionStatusIndicator as WebSocketStatusIndicator } from "@/components/common/StatusIndicator";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { useRealTimeAppointments, useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { showSuccessToast, showErrorToast, showInfoToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import {
  getAppointmentViewState,
  getAppointmentDateTimeValue,
  formatDateInIST,
  formatTimeInIST,
  formatISODateInIST,
  getReceptionistAppointmentDateLabel,
  getReceptionistAppointmentTimeLabel,
  shouldShowAppointmentOnDoctorDashboard,
} from "@/lib/utils/appointmentUtils";
import { buildVideoSessionRoute } from "@/lib/utils/video-session-route";
import {
  getAppointmentPaymentDisplayState,
  getDisplayAppointmentDuration,
} from "@/lib/utils/appointmentUtils";
import {
  Calendar,
  Play,
  CheckCircle,
  Clock,
  FileText,
  Video,
  Phone,
  MessageSquare,
  Search,
  Eye,
  Loader2
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
  paymentStatus: string;
  paymentCompleted: boolean;
  paymentPending: boolean;
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

const getPaymentBadgeClasses = (paymentStatus: string) => {
  switch (paymentStatus) {
    case "PAID":
      return "bg-emerald-100 text-emerald-800";
    case "PENDING":
    case "OVERDUE":
      return "bg-amber-100 text-amber-800";
    case "FAILED":
    case "VOID":
    case "UNCOLLECTIBLE":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function DoctorAppointments() {
  const router = useRouter();
  const { session } = useAuth();
  const user = session?.user;
  const { clinicId } = useClinicContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | string>(APPOINTMENT_STATUS.ALL);
  const [selectedAppointment, setSelectedAppointment] = useState<TransformedAppointment | null>(null);
  const [consultationNotes, setConsultationNotes] = useState("");
  const [prescription, setPrescription] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
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
    ...(statusFilter !== APPOINTMENT_STATUS.ALL ? { status: statusFilter } : {}),
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

  // Transform appointments data
  const appointments = useMemo(() => {
    const apps = extractAppointments(appointmentsData);
    const visibleApps = apps.filter(shouldShowAppointmentOnDoctorDashboard);

    return visibleApps
      .map((app: any): TransformedAppointment => {
        const displayDuration = getDisplayAppointmentDuration(app);
        const paymentDisplay = getAppointmentPaymentDisplayState(app);
        const viewState = getAppointmentViewState(app);
        const appointmentDateTime = getAppointmentDateTimeValue(app);

        return {
          id: app.id,
          appointmentId: app.id,
          patientId: app.patientId || app.patient?.id || app.patient?.userId || "",
          doctorId: app.doctorId || app.doctor?.id || app.doctor?.userId || "",
          patientName: app.patient?.name || `${app.patient?.firstName || ""} ${app.patient?.lastName || ""}`.trim() || "Unknown Patient",
          patientAge: app.patient?.age || (app.patient?.dateOfBirth ? Math.floor((new Date().getTime() - new Date(app.patient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)) : null),
          patientGender: app.patient?.gender || "Unknown",
          time: appointmentDateTime
            ? formatTimeInIST(appointmentDateTime, { hour: "2-digit", minute: "2-digit", hour12: true })
            : getReceptionistAppointmentTimeLabel(app as Record<string, unknown>),
          status: (viewState.isVideo && !viewState.paymentCompleted ? "SCHEDULED" : viewState.normalizedStatus) as AppointmentStatus,
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
          paymentStatus: paymentDisplay.paymentStatus,
          paymentCompleted: paymentDisplay.paymentCompleted,
          paymentPending: paymentDisplay.paymentPending,
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

      const matchesStatus = statusFilter === APPOINTMENT_STATUS.ALL || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case APPOINTMENT_STATUS.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
      case APPOINTMENT_STATUS.CONFIRMED: return 'bg-green-100 text-green-800';
      case APPOINTMENT_STATUS.SCHEDULED: return 'bg-gray-100 text-gray-800';
      case APPOINTMENT_STATUS.COMPLETED: return 'bg-purple-100 text-purple-800';
      case APPOINTMENT_STATUS.CANCELLED:
      case APPOINTMENT_STATUS.NO_SHOW:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      [APPOINTMENT_STATUS.IN_PROGRESS]: 'In Progress',
      [APPOINTMENT_STATUS.SCHEDULED]: 'Scheduled',
      [APPOINTMENT_STATUS.CONFIRMED]: 'Confirmed',
      [APPOINTMENT_STATUS.COMPLETED]: 'Completed',
      [APPOINTMENT_STATUS.CANCELLED]: 'Cancelled',
      [APPOINTMENT_STATUS.NO_SHOW]: 'No Show',
    };
    return labels[status] || status;
  };

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
                {app.patientGender ? ` â€¢ ${app.patientGender}` : ""}
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
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">{app.type}</div>
              <div className="text-xs text-muted-foreground">
                {app.time} â€¢ {app.duration}
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
        accessorKey: "paymentStatus",
        header: "Video Payment",
        cell: ({ row }) => {
          const app = row.original;
          return app.type === "VIDEO_CALL" ? (
            <Badge className={getPaymentBadgeClasses(app.paymentCompleted ? "PAID" : app.paymentStatus)}>
              {app.paymentCompleted ? "Payment verified" : "Payment pending"}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">Not applicable</span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedAppointment(app)}>
                <Eye className="w-4 h-4" />
              </Button>
              {app.status === APPOINTMENT_STATUS.CONFIRMED && app.checkedInAt && (
              <Button
                size="sm"
                onClick={() => startConsultation(app.id, app.type === "VIDEO_CALL" ? { openVideoAfterStart: true } : undefined)}
                disabled={startAppointmentMutation.isPending || (app.type === "VIDEO_CALL" && !app.paymentCompleted)}
                title={app.type === "VIDEO_CALL" && !app.paymentCompleted ? "Video request is waiting for payment" : undefined}
              >
                  <Play className="mr-1 h-4 w-4" />
                  {app.type === "VIDEO_CALL" ? "Start video" : "Start"}
                </Button>
              )}
              {app.status === APPOINTMENT_STATUS.CONFIRMED && !app.checkedInAt && (
                <Button size="sm" variant="outline" disabled title="Patient must be checked in before consultation can start">
                  <Play className="mr-1 h-4 w-4" />
                  Waiting check-in
                </Button>
              )}
              {app.status === APPOINTMENT_STATUS.IN_PROGRESS && (
                <>
                  {app.type === "VIDEO_CALL" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(buildVideoSessionRoute(app.id))}
                      disabled={!app.paymentCompleted}
                    >
                      <Video className="mr-1 h-4 w-4" />
                      Open video
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    onClick={() =>
                      completeConsultation(app.id, {
                        diagnosis,
                        prescription,
                        notes: consultationNotes,
                      })
                    }
                    disabled={completeAppointmentMutation.isPending}
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Complete
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [completeAppointmentMutation.isPending, consultationNotes, diagnosis, prescription, startAppointmentMutation.isPending, user?.id]
  );

  const startConsultation = async (appointmentId: string, options?: { openVideoAfterStart?: boolean }) => {
    try {
      await startAppointmentMutation.mutateAsync(appointmentId);
      showSuccessToast("Consultation started successfully", {
        id: TOAST_IDS.GLOBAL.SUCCESS,
      });
      if (options?.openVideoAfterStart) {
        router.push(buildVideoSessionRoute(appointmentId));
      }
    } catch (error: unknown) {
      showErrorToast(error instanceof Error ? error.message : "Failed to start consultation", {
        id: TOAST_IDS.GLOBAL.ERROR,
      });
    }
  };

  const completeConsultation = async (appointmentId: string, data?: {
    diagnosis?: string;
    prescription?: string;
    notes?: string;
  }) => {
    try {
      await completeAppointmentMutation.mutateAsync({
        id: appointmentId,
        data: data || {},
      });
      showSuccessToast("Consultation completed successfully", {
        id: TOAST_IDS.GLOBAL.SUCCESS,
      });
      setDiagnosis("");
      setPrescription("");
      setConsultationNotes("");
      setSelectedAppointment(null);
    } catch (error: unknown) {
      showErrorToast(error instanceof Error ? error.message : "Failed to complete consultation", {
        id: TOAST_IDS.GLOBAL.ERROR,
      });
    }
  };

  return (
    <>
      {isLoadingAppointments ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <DashboardPageShell>
          <DashboardPageHeader
            eyebrow="Doctor Appointments"
            title="My Appointments"
            description={`Today is ${formatDateInIST(new Date(), {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}. Review every scheduled, video, in-person, completed, and cancelled appointment in one place.`}
            actionsSlot={
              <div className="flex flex-wrap items-center gap-3">
                <BookAppointmentDialog
                  {...(clinicId ? { clinicId } : {})}
                  {...(user?.id ? { initialDoctorId: user.id } : {})}
                  trigger={
                    <Button className="rounded-xl border-0 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500/30">
                      <Calendar className="mr-2 h-4 w-4" />
                      Book Appointment
                    </Button>
                  }
                />
                <WebSocketStatusIndicator />
              </div>
            }
          />

          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            <Card className="border-l-4 border-l-emerald-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {appointments.filter((a: TransformedAppointment) => a.status === APPOINTMENT_STATUS.CONFIRMED).length}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Play className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {appointments.filter((a: TransformedAppointment) => a.status === APPOINTMENT_STATUS.IN_PROGRESS).length}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                <Clock className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">
                  {appointments.filter((a: TransformedAppointment) => a.status === APPOINTMENT_STATUS.SCHEDULED || a.status === APPOINTMENT_STATUS.CONFIRMED).length}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-violet-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Today</CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {
                    appointments.filter((a: TransformedAppointment) =>
                      a.appointmentDate === formatISODateInIST(new Date())
                    ).length
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search by patient name or appointment type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <DataTable
            columns={appointmentColumns}
            data={filteredAppointments}
            emptyMessage="No appointments found"
            pageSize={10}
          />

          <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
            <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
              {selectedAppointment && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <span>Patient Details: {selectedAppointment.patientName}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {selectedAppointment.type} â€¢ {selectedAppointment.time}
                      </span>
                    </DialogTitle>
                  </DialogHeader>

                  <div className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
                      <Badge className={getStatusColor(selectedAppointment.status)}>{getStatusLabel(selectedAppointment.status)}</Badge>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Video Payment</p>
                      <Badge className={getPaymentBadgeClasses(selectedAppointment.paymentCompleted ? "PAID" : selectedAppointment.paymentStatus)}>
                        {selectedAppointment.paymentCompleted ? "Payment verified" : "Payment pending"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contact</p>
                      <p className="text-sm text-foreground">{selectedAppointment.patientPhone || selectedAppointment.patientEmail || "Not available"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Queue</p>
                      <p className="text-sm text-foreground">{selectedAppointment.queuePosition ?? "â€”"}</p>
                    </div>
                  </div>

                  <Tabs defaultValue="patient-info" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="patient-info">Patient Info</TabsTrigger>
                      <TabsTrigger value="consultation">Consultation</TabsTrigger>
                      <TabsTrigger value="prescription">Prescription</TabsTrigger>
                    </TabsList>

                    <TabsContent value="patient-info">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                          <div>
                            <h4 className="mb-2 font-semibold">Contact Information</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{selectedAppointment.patientPhone || "Not available"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
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

                        <div className="space-y-4">
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
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="diagnosis" className="mb-2 block text-sm font-medium">
                            Diagnosis
                          </label>
                          <Input
                            id="diagnosis"
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                            placeholder="Enter diagnosis..."
                          />
                        </div>

                        <div>
                          <label htmlFor="consultationNotes" className="mb-2 block text-sm font-medium">
                            Consultation Notes
                          </label>
                          <Textarea
                            id="consultationNotes"
                            value={consultationNotes}
                            onChange={(e) => setConsultationNotes(e.target.value)}
                            placeholder="Enter detailed consultation notes..."
                            rows={6}
                          />
                        </div>

                        <Button
                          className="w-full"
                          onClick={() => {
                            if (selectedAppointment) {
                              completeConsultation(selectedAppointment.id, {
                                diagnosis,
                                prescription,
                                notes: consultationNotes,
                              });
                            }
                          }}
                          disabled={completeAppointmentMutation.isPending}
                        >
                          {completeAppointmentMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <FileText className="mr-2 h-4 w-4" />
                              Save Consultation Notes
                            </>
                          )}
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="prescription">
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="prescription" className="mb-2 block text-sm font-medium">
                            Prescription & Treatment Plan
                          </label>
                          <Textarea
                            id="prescription"
                            value={prescription}
                            onChange={(e) => setPrescription(e.target.value)}
                            placeholder="Enter medications, dosage, and treatment instructions..."
                            rows={8}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              showInfoToast("Prescription saved as draft", {
                                id: TOAST_IDS.GLOBAL.INFO,
                              });
                            }}
                          >
                            Save as Draft
                          </Button>
                          <Button
                            className="w-full"
                            onClick={() => {
                              if (selectedAppointment) {
                                completeConsultation(selectedAppointment.id, {
                                  diagnosis,
                                  prescription,
                                  notes: consultationNotes,
                                });
                              }
                            }}
                            disabled={completeAppointmentMutation.isPending}
                          >
                            {completeAppointmentMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Generate Prescription
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </DialogContent>
          </Dialog>

        </DashboardPageShell>
      )}
    </>
  );
}


