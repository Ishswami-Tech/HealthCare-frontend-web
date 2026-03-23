"use client";

import { useMemo, useState } from "react";
import { ProtectedComponent } from "@/components/rbac/ProtectedComponent";
import { Permission } from "@/types/rbac.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PaymentButton } from "@/components/payments/PaymentButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Video,
  Download,
  Clock,
  Calendar,
  User,
  Users,
  BarChart3,
  Activity,
  Search,
  Play,
  Square,
  Loader2,
  CalendarClock,
  XCircle,
  Ban,
} from "lucide-react";
import { showSuccessToast, showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useVideoAppointments,
  useJoinVideoAppointment,
  useEndVideoAppointment,
  useRescheduleVideoAppointment,
  useCancelVideoAppointment,
  useRejectVideoProposal,
  type VideoAppointment,
} from "@/hooks/query/useVideoAppointments";
import { useAppointmentServices, useMyAppointments } from "@/hooks/query/useAppointments";
import { useClinics } from "@/hooks/query/useClinics";
import { useRBAC } from "@/hooks/utils/useRBAC";
import { VideoAppointmentRoom } from "./VideoAppointmentRoom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getAppointmentDateTimeValue,
  getAppointmentDoctorName,
  formatDateInIST,
  formatTimeInIST,
  isVideoAppointmentPaymentCompleted,
} from "@/lib/utils/appointmentUtils";

// ─── Module-scope pure helpers (DRY, no re-creation on render) ───────────────

/** Maps user role strings to the three values the backend accepts */
function getRoleString(role?: string): 'doctor' | 'patient' | 'admin' {
  if (!role) return 'patient';
  const r = role.toUpperCase();
  if (r === 'DOCTOR') return 'doctor';
  if (r === 'CLINIC_ADMIN' || r === 'SUPER_ADMIN' || r === 'ADMIN') return 'admin';
  return 'patient';
}

/** Safely unwraps appointments from any backend response shape */
function extractAppointments(data: unknown): VideoAppointment[] {
  if (!data || typeof data !== 'object') return [];
  const d = data as Record<string, unknown>;
  if (Array.isArray(d.appointments)) return d.appointments as VideoAppointment[];
  if (Array.isArray(d.data)) return d.data as VideoAppointment[];
  if (Array.isArray(data)) return data as VideoAppointment[];
  return [];
}

/** Single-pass statistics from the filtered list */
interface AppointmentStats {
  total: number;
  active: number;
  scheduled: number;
  completed: number;
  cancelled: number;
}

function computeStats(appointments: VideoAppointment[]): AppointmentStats {
  return appointments.reduce<AppointmentStats>(
    (acc, apt) => {
      acc.total += 1;
      if (apt.status === 'in-progress') acc.active += 1;
      else if (apt.status === 'scheduled') acc.scheduled += 1;
      else if (apt.status === 'completed') acc.completed += 1;
      else if (apt.status === 'cancelled') acc.cancelled += 1;
      return acc;
    },
    { total: 0, active: 0, scheduled: 0, completed: 0, cancelled: 0 }
  );
}

export function isJoinableVideoAppointment(appointment: VideoAppointment): boolean {
  const normalizedStatus = String(appointment.status || "").toLowerCase();
  if (normalizedStatus !== "scheduled" && normalizedStatus !== "in-progress") {
    return false;
  }

  const paymentCompleted = (appointment as any).paymentCompleted;
  return paymentCompleted !== false;
}

export function getVideoPaymentAmount(
  appointment: VideoAppointment,
  appointmentServices: unknown[] = []
): number {
  const matchingService = (appointmentServices as any[]).find(
    (service) =>
      service?.treatmentType &&
      service.treatmentType === (appointment as any).treatmentType
  );

  const candidateValues = [
    (appointment as any).videoConsultationFee,
    (appointment as any).consultationFee,
    (appointment as any).amount,
    (appointment as any).price,
    (appointment as any).fee,
    (appointment as any).service?.videoConsultationFee,
    (appointment as any).service?.consultationFee,
    (appointment as any).service?.amount,
    (appointment as any).service?.price,
    (appointment as any).service?.fee,
    (appointment as any).billing?.amount,
    (appointment as any).payment?.amount,
    (appointment as any).invoice?.amount,
    matchingService?.videoConsultationFee,
    matchingService?.consultationFee,
    matchingService?.amount,
    matchingService?.price,
    matchingService?.fee,
  ];

  for (const value of candidateValues) {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue) && numericValue > 0) {
      return numericValue;
    }
  }

  return 0;
}

interface VideoAppointmentsListProps {
  title?: string;
  description?: string;
  showStatistics?: boolean;
  showClinicFilter?: boolean;
  showJoinButton?: boolean;
  showEndButton?: boolean;
  showDownloadButton?: boolean;
  limit?: number;
  filters?: {
    doctorId?: string;
    patientId?: string;
    clinicId?: string;
  };
}

export function VideoAppointmentsList({
  title = "Video Consultations",
  description = "Manage and view video consultations",
  showStatistics = true,
  showClinicFilter = false,
  showJoinButton = false,
  showEndButton = false,
  showDownloadButton = true,
  limit = 100,
  filters = {},
}: VideoAppointmentsListProps) {
  const { session, user } = useAuth();
  const { hasPermission } = useRBAC();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterClinicId, setFilterClinicId] = useState("");
  const [selectedAppointment, setSelectedAppointment] =
    useState<VideoAppointment | null>(null);
  const [isVideoRoomOpen, setIsVideoRoomOpen] = useState(false);
  
  // Action states
  const [actionAppointment, setActionAppointment] = useState<VideoAppointment | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  
  // Form states
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [actionReason, setActionReason] = useState("");

  const userId = session?.user?.id || "";
  const isPatient = user?.role === "PATIENT";

  // Determine permissions
  const canJoin = hasPermission(Permission.JOIN_VIDEO_APPOINTMENTS);
  const canEnd = hasPermission(Permission.END_VIDEO_APPOINTMENTS);
  const canViewRecordings = hasPermission(Permission.VIEW_VIDEO_RECORDINGS);

  // Fetch video appointments
  const {
    data: appointmentsData,
    isPending: isLoading,
    refetch,
  } = useVideoAppointments({
    ...filters,
    ...(filterStatus ? { status: filterStatus } : {}),
    page: 1,
    limit,
  });
  const { data: myAppointmentsData, isPending: isLoadingMyAppointments } = useMyAppointments();
  const { data: appointmentServices = [] } = useAppointmentServices();

  // Fetch clinics for filtering (if needed)
  const { data: clinicsData } = useClinics();
  const clinics = (Array.isArray(clinicsData) ? clinicsData : (clinicsData as any)?.clinics) || [];

  // ── Data extraction (resilient to backend shape variations) ──────────────
  const historyAppointments = extractAppointments(appointmentsData);
  const patientAppointments = useMemo<VideoAppointment[]>(() => {
    const list = Array.isArray((myAppointmentsData as any)?.appointments)
      ? (myAppointmentsData as any).appointments
      : [];

    return list
      .filter((apt: any) => String(apt?.type || "").toUpperCase() === "VIDEO_CALL")
      .map((apt: any) => {
        const dateTime = getAppointmentDateTimeValue(apt);
        const startTime =
          (dateTime && !Number.isNaN(dateTime.getTime()) ? dateTime.toISOString() : undefined) ||
          apt?.appointmentDate ||
          apt?.startTime ||
          "";
        const normalizedStatus = String(apt?.status || "").toLowerCase().replace(/_/g, "-");

        return {
          id: apt?.id,
          appointmentId: apt?.id,
          roomName: getAppointmentDoctorName(apt),
          doctorId: apt?.doctorId || apt?.doctor?.id || "",
          patientId:
            apt?.patientId ||
            apt?.patient?.id ||
            apt?.patient?.userId ||
            apt?.patient?.user?.id ||
            "",
          startTime,
          endTime: startTime,
          status:
            normalizedStatus === "awaiting-slot-confirmation"
              ? "scheduled"
              : (normalizedStatus as VideoAppointment["status"]),
          sessionId: apt?.sessionId,
          recordingUrl: apt?.recordingUrl,
          notes: apt?.notes,
          treatmentType: apt?.treatmentType,
          createdAt: apt?.createdAt || apt?.updatedAt || startTime,
          updatedAt: apt?.updatedAt || apt?.createdAt || startTime,
          doctorName: getAppointmentDoctorName(apt),
          paymentCompleted: isVideoAppointmentPaymentCompleted(apt),
        } as VideoAppointment & {
          doctorName?: string;
          paymentCompleted?: boolean;
          treatmentType?: string;
        };
      });
  }, [myAppointmentsData]);
  const appointments = isPatient ? patientAppointments : historyAppointments;

  // Mutations
  const joinVideoAppointment = useJoinVideoAppointment();
  const endVideoAppointment = useEndVideoAppointment();
  const rescheduleAppointment = useRescheduleVideoAppointment();
  const cancelAppointment = useCancelVideoAppointment();
  const rejectProposal = useRejectVideoProposal();

  // ── Single filtered list ──────────────────────────────────────────────────
  const searchLower = searchTerm.toLowerCase();
  const filteredAppointments = appointments.filter((apt) => {
    const normalizedStatus = String(apt.status || "").toLowerCase();
    const matchesSearch =
      !searchTerm ||
      apt.appointmentId?.toLowerCase().includes(searchLower) ||
      apt.roomName?.toLowerCase().includes(searchLower) ||
      ((apt as any).doctorName || "").toLowerCase().includes(searchLower) ||
      apt.doctorId?.toLowerCase().includes(searchLower) ||
      apt.patientId?.toLowerCase().includes(searchLower);
    const matchesStatus =
      !filterStatus || filterStatus === "all" || normalizedStatus === filterStatus;
    const matchesClinic =
      !filterClinicId || filterClinicId === "all" || (apt as any).clinicId === filterClinicId;
    return matchesSearch && matchesStatus && matchesClinic;
  });

  // ── Single-pass statistics (O(n) not O(5n)) ───────────────────────────────
  const stats = computeStats(filteredAppointments);
  const { total: totalAppointments, active: activeAppointments,
          scheduled: scheduledAppointments,
          completed: completedAppointmentsCount,
          cancelled: cancelledAppointments } = stats;

  // Derived sub-lists for tabs
  const upcomingAppointments = filteredAppointments.filter((apt) => {
    const normalizedStatus = String(apt.status || "").toLowerCase();
    return normalizedStatus === "scheduled" || normalizedStatus === "in-progress";
  });
  const completedAppointments = filteredAppointments.filter(
    (apt) => String(apt.status || "").toLowerCase() === 'completed'
  );

  const handleJoinAppointment = async (appointment: VideoAppointment) => {
    if (!canJoin) {
      showErrorToast("You don't have permission to join video appointments", {
        id: TOAST_IDS.VIDEO.PERMISSION,
      });
      return;
    }

    try {
      const result = await joinVideoAppointment.mutateAsync({
        appointmentId: appointment.appointmentId,
        userId,
        role: getRoleString(user?.role),
      });

      if (result?.token) {
        setSelectedAppointment(appointment);
        setIsVideoRoomOpen(true);
        showSuccessToast("Joining video consultation...", {
          id: TOAST_IDS.VIDEO.JOIN,
        });
      }
    } catch (error) {
      showErrorToast(error, {
        id: TOAST_IDS.VIDEO.ERROR,
      });
    }
  };

  const handleEndAppointment = async (appointmentId: string) => {
    if (!canEnd) {
      showErrorToast("You don't have permission to end video appointments", {
        id: TOAST_IDS.VIDEO.PERMISSION,
      });
      return;
    }

    try {
      await endVideoAppointment.mutateAsync(appointmentId);
      showSuccessToast("Video appointment ended successfully", {
        id: TOAST_IDS.VIDEO.END,
      });
      refetch();
    } catch (error) {
      showErrorToast(error, {
        id: TOAST_IDS.VIDEO.ERROR,
      });
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!actionAppointment || !rescheduleDate || !rescheduleTime) return;
    
    try {
      await rescheduleAppointment.mutateAsync({
        appointmentId: actionAppointment.appointmentId,
        date: rescheduleDate,
        time: rescheduleTime,
        reason: actionReason || "Rescheduled by user"
      });
      setIsRescheduleOpen(false);
      resetActionState();
    } catch (error) {
       // Toast handled by hook
    }
  };

  const handleCancelSubmit = async () => {
    if (!actionAppointment) return;
    
    try {
      await cancelAppointment.mutateAsync({
        appointmentId: actionAppointment.appointmentId,
        reason: actionReason || "Cancelled by user"
      });
      setIsCancelOpen(false);
      resetActionState();
    } catch (error) {
      // Toast handled by hook
    }
  };

  const handleRejectSubmit = async () => {
    if (!actionAppointment) return;
    
    try {
      await rejectProposal.mutateAsync({
        appointmentId: actionAppointment.appointmentId,
        reason: actionReason || "Rejected by doctor"
      });
      setIsRejectOpen(false);
      resetActionState();
    } catch (error) {
      // Toast handled by hook
    }
  };

  const resetActionState = () => {
    setActionAppointment(null);
    setRescheduleDate("");
    setRescheduleTime("");
    setActionReason("");
  };

  const openReschedule = (apt: VideoAppointment) => {
    setActionAppointment(apt);
    setRescheduleDate(apt.startTime ? (new Date(apt.startTime).toISOString().split('T')[0] ?? '') : '');
    setIsRescheduleOpen(true);
  };

  const openCancel = (apt: VideoAppointment) => {
    setActionAppointment(apt);
    setIsCancelOpen(true);
  };

  const openReject = (apt: VideoAppointment) => {
    setActionAppointment(apt);
    setIsRejectOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      scheduled: { label: "Scheduled", variant: "outline" },
      "in-progress": { label: "In Progress", variant: "default" },
      completed: { label: "Completed", variant: "secondary" },
      cancelled: { label: "Cancelled", variant: "destructive" },
      proposed: { label: "Proposed", variant: "secondary" }, // Added proposed status
    };

    const config = statusConfig[status] || {
      label: status,
      variant: "outline",
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const AppointmentCard = ({
    appointment,
  }: {
    appointment: VideoAppointment;
  }) => (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Video className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">
                {(appointment as any).doctorName || appointment.roomName || `Room ${appointment.appointmentId}`}
              </h3>
              {getStatusBadge(appointment.status)}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {appointment.startTime
                      ? formatDateInIST(new Date(appointment.startTime), {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        })
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {appointment.startTime
                      ? formatTimeInIST(new Date(appointment.startTime), {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "N/A"}
                  </span>
                </div>
              {((appointment as any).doctorName || appointment.doctorId) && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>
                    Doctor: {(appointment as any).doctorName || `${appointment.doctorId.slice(0, 8)}...`}
                  </span>
                </div>
              )}
              {appointment.patientId && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Patient: {appointment.patientId.slice(0, 8)}...</span>
                </div>
              )}
              {(appointment as any).paymentCompleted === false && (
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span>Payment required before confirmation</span>
                </div>
              )}
              {appointment.recordingUrl && (
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>Recording Available</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap justify-end">
            {/* Action Buttons */}
            {appointment.status === 'scheduled' && (
              <>
                {(appointment as any).paymentCompleted === false &&
                  getVideoPaymentAmount(appointment, appointmentServices as any[]) > 0 && (
                  <PaymentButton
                    appointmentId={appointment.appointmentId}
                    amount={getVideoPaymentAmount(appointment, appointmentServices as any[])}
                    description="Video Consultation"
                    className="gap-1"
                    onSuccess={() => {
                      refetch();
                    }}
                  >
                    Pay INR {getVideoPaymentAmount(appointment, appointmentServices as any[]).toLocaleString("en-IN")}
                  </PaymentButton>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openReschedule(appointment)}
                  className="gap-1"
                >
                  <CalendarClock className="h-4 w-4" /> Reschedule
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => openCancel(appointment)}
                  className="gap-1"
                >
                  <XCircle className="h-4 w-4" /> Cancel
                </Button>
              </>
            )}

            {/* Reject Proposal (assuming status 'proposed' exists or logic determines it) */}
            {appointment.status === 'proposed' && (
               <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => openReject(appointment)}
                  className="gap-1"
               >
                  <Ban className="h-4 w-4" /> Reject Proposal
               </Button>
            )}

            {showJoinButton && canJoin && (
              <>
                {appointment.status === "scheduled" && isJoinableVideoAppointment(appointment) && (
                  <Button
                    onClick={() => handleJoinAppointment(appointment)}
                    size="sm"
                    className="gap-2"
                    disabled={joinVideoAppointment.isPending}
                  >
                    {joinVideoAppointment.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Join
                      </>
                    )}
                  </Button>
                )}
                {appointment.status === "in-progress" && isJoinableVideoAppointment(appointment) && (
                  <Button
                    onClick={() => handleJoinAppointment(appointment)}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    disabled={joinVideoAppointment.isPending}
                  >
                    {joinVideoAppointment.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <Video className="h-4 w-4" />
                        Rejoin
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
            {showEndButton && canEnd && appointment.status === "in-progress" && (
              <Button
                onClick={() => handleEndAppointment(appointment.appointmentId)}
                size="sm"
                variant="destructive"
                className="gap-2"
                disabled={endVideoAppointment.isPending}
              >
                {endVideoAppointment.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ending...
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4" />
                    End
                  </>
                )}
              </Button>
            )}
            {showDownloadButton &&
              canViewRecordings &&
              appointment.status === "completed" &&
              appointment.recordingUrl && (
                <Button
                  onClick={() => window.open(appointment.recordingUrl, "_blank")}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedComponent permission={Permission.VIEW_VIDEO_APPOINTMENTS}>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground mt-2">{description}</p>
          </div>
        </div>

        {/* Statistics Cards */}
        {showStatistics && (
          <div
            className={`grid grid-cols-1 gap-4 mb-6 ${
              showClinicFilter
                ? "md:grid-cols-5"
                : "md:grid-cols-4"
            }`}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAppointments}</div>
                <p className="text-xs text-muted-foreground">All consultations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeAppointments}</div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scheduledAppointments}</div>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedAppointmentsCount}</div>
                <p className="text-xs text-muted-foreground">Finished</p>
              </CardContent>
            </Card>
            {showClinicFilter && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{cancelledAppointments}</div>
                  <p className="text-xs text-muted-foreground">Cancelled</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by appointment ID, room name, doctor, or patient..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {showClinicFilter && clinics.length > 0 && (
                <Select value={filterClinicId} onValueChange={setFilterClinicId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clinics</SelectItem>
                    {clinics.map((clinic: { id: string; name: string }) => (
                      <SelectItem key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        {showJoinButton ? (
          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedAppointments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {isLoading || (isPatient && isLoadingMyAppointments) ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      Loading appointments...
                    </p>
                  </CardContent>
                </Card>
              ) : upcomingAppointments.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      No upcoming video appointments
                    </p>
                  </CardContent>
                </Card>
              ) : (
                upcomingAppointments.map((appointment: VideoAppointment) => (
                  <AppointmentCard
                    key={appointment.id || appointment.appointmentId}
                    appointment={appointment}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {isLoading || (isPatient && isLoadingMyAppointments) ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      Loading appointments...
                    </p>
                  </CardContent>
                </Card>
              ) : completedAppointments.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      No completed video appointments
                    </p>
                  </CardContent>
                </Card>
              ) : (
                completedAppointments.map((appointment: VideoAppointment) => (
                  <AppointmentCard
                    key={appointment.id || appointment.appointmentId}
                    appointment={appointment}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All ({totalAppointments})</TabsTrigger>
              <TabsTrigger value="active">
                Active ({activeAppointments})
              </TabsTrigger>
              <TabsTrigger value="scheduled">
                Scheduled ({scheduledAppointments})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedAppointmentsCount})
              </TabsTrigger>
              {showClinicFilter && (
                <TabsTrigger value="cancelled">
                  Cancelled ({cancelledAppointments})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      Loading appointments...
                    </p>
                  </CardContent>
                </Card>
              ) : filteredAppointments.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      No video appointments found
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredAppointments.map((appointment: VideoAppointment) => (
                  <AppointmentCard
                    key={appointment.id || appointment.appointmentId}
                    appointment={appointment}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {filteredAppointments
                .filter((apt: VideoAppointment) => apt.status === "in-progress")
                .map((appointment: VideoAppointment) => (
                  <AppointmentCard
                    key={appointment.id || appointment.appointmentId}
                    appointment={appointment}
                  />
                ))}
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-4">
              {filteredAppointments
                .filter((apt: VideoAppointment) => apt.status === "scheduled")
                .map((appointment: VideoAppointment) => (
                  <AppointmentCard
                    key={appointment.id || appointment.appointmentId}
                    appointment={appointment}
                  />
                ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {filteredAppointments
                .filter((apt: VideoAppointment) => apt.status === "completed")
                .map((appointment: VideoAppointment) => (
                  <AppointmentCard
                    key={appointment.id || appointment.appointmentId}
                    appointment={appointment}
                  />
                ))}
            </TabsContent>

            {showClinicFilter && (
              <TabsContent value="cancelled" className="space-y-4">
                {filteredAppointments
                  .filter((apt: VideoAppointment) => apt.status === "cancelled")
                  .map((appointment: VideoAppointment) => (
                    <AppointmentCard
                      key={appointment.id || appointment.appointmentId}
                      appointment={appointment}
                    />
                  ))}
              </TabsContent>
            )}
          </Tabs>
        )}

        {/* Video Room Dialog */}
        {selectedAppointment && (
          <Dialog open={isVideoRoomOpen} onOpenChange={setIsVideoRoomOpen}>
            <DialogContent className="max-w-7xl w-full h-[90vh] p-0">
              <DialogHeader className="sr-only">
                <DialogTitle>Video Consultation</DialogTitle>
                <DialogDescription>
                  Video consultation room for appointment{" "}
                  {selectedAppointment.appointmentId}
                </DialogDescription>
              </DialogHeader>
              <div className="h-full">
                <VideoAppointmentRoom
                  appointment={selectedAppointment}
                  onEndCall={() => {
                    if (canEnd) {
                      handleEndAppointment(selectedAppointment.appointmentId);
                    }
                  }}
                  onLeaveRoom={() => {
                    setIsVideoRoomOpen(false);
                    setSelectedAppointment(null);
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
        
        {/* Reschedule Dialog */}
        <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reschedule Appointment</DialogTitle>
              <DialogDescription>
                Select a new date and time for this appointment.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date <span className="text-xs text-muted-foreground">(min. 24h notice)</span></Label>
                  <Input 
                    type="date" 
                    value={rescheduleDate} 
                    min={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })()}
                    onChange={(e) => setRescheduleDate(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input 
                    type="time" 
                    value={rescheduleTime} 
                    onChange={(e) => setRescheduleTime(e.target.value)} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea 
                  placeholder="Reason for rescheduling..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRescheduleOpen(false)}>Cancel</Button>
              <Button onClick={handleRescheduleSubmit} disabled={rescheduleAppointment.isPending}>
                {rescheduleAppointment.isPending ? "Saving..." : "Reschedule"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Dialog */}
        <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Appointment</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this appointment? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Reason for Cancellation</Label>
                <Textarea 
                  placeholder="Please provide a reason..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCancelOpen(false)}>Back</Button>
              <Button variant="destructive" onClick={handleCancelSubmit} disabled={cancelAppointment.isPending}>
                {cancelAppointment.isPending ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

         {/* Reject Proposal Dialog */}
         <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Proposal</DialogTitle>
              <DialogDescription>
                Reject the proposed time slot for this appointment.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Reason for Rejection</Label>
                <Textarea 
                  placeholder="Please provide a reason..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleRejectSubmit} disabled={rejectProposal.isPending}>
                {rejectProposal.isPending ? "Rejecting..." : "Reject Proposal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </ProtectedComponent>
  );
}
