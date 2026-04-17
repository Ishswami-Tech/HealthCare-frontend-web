const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  scheduled:   { label: "Scheduled",   color: "text-blue-700 dark:text-blue-300",   dot: "bg-blue-500",   bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900" },
  confirmed:   { label: "Confirmed",   color: "text-green-700 dark:text-green-300", dot: "bg-green-500", bg: "bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900" },
  "in-progress": { label: "In Progress", color: "text-emerald-700 dark:text-emerald-300",dot: "bg-emerald-500",bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900" },
  completed:   { label: "Completed",   color: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400", bg: "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700" },
  cancelled:   { label: "Cancelled",   color: "text-red-700 dark:text-red-300",     dot: "bg-red-500",   bg: "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900" },
  proposed:    { label: "Proposed",    color: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500",  bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900" },
};
const DEFAULT_STATUS_CONFIG = {
  label: "Scheduled",
  color: "text-blue-700 dark:text-blue-300",
  dot: "bg-blue-500",
  bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900",
} as const;

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
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
  RefreshCw,
  Stethoscope,
  CreditCard,
  ChevronDown,
  Timer,
  Zap,
  CheckCircle,
  FileText,
  ArrowRight,
} from "lucide-react";
import { showSuccessToast, showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useVideoAppointments,
  useJoinVideoAppointment,
  useEndVideoAppointment,
  getVideoTokenRole,
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
  getAppointmentStatusBadgeLabel,
  getAppointmentDoctorName,
  formatDateInIST,
  formatTimeInIST,
  isVideoAppointmentPaymentCompleted,
} from "@/lib/utils/appointmentUtils";
import { ProposeVideoAppointmentDialog } from "@/components/appointments/ProposeVideoAppointmentDialog";
import { useClinicContext } from "@/hooks/query/useClinics";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { CalendarPlus, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Module-scope pure helpers ───────────────────────────────────────────────

function extractAppointments(data: unknown): VideoAppointment[] {
  if (!data || typeof data !== 'object') return [];
  const d = data as Record<string, unknown>;
  if (Array.isArray(d.appointments)) return d.appointments as VideoAppointment[];
  if (Array.isArray(d.data)) return d.data as VideoAppointment[];
  if (Array.isArray(data)) return data as VideoAppointment[];
  return [];
}

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

export function isJoinableVideoAppointment(appointment: VideoAppointment | any): boolean {
  const normalizedStatus = String(appointment.status || "").toLowerCase();
  const rawStatus = String(appointment.rawStatus || appointment.status || "").toLowerCase().replace(/_/g, "-");

  if (normalizedStatus !== "scheduled" && normalizedStatus !== "in-progress") {
    return false;
  }
  
  if (rawStatus === "awaiting-slot-confirmation") {
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
  const router = useRouter();
  const { hasPermission } = useRBAC();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("scheduled");
  const [filterClinicId, setFilterClinicId] = useState("");
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [selectedAppointment, setSelectedAppointment] = useState<VideoAppointment | null>(null);
  const [isVideoRoomOpen, setIsVideoRoomOpen] = useState(false);
  const searchParams = useSearchParams();
  const appointmentIdFromUrl = searchParams.get("appointmentId");
  
  const [actionAppointment, setActionAppointment] = useState<VideoAppointment | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [actionReason, setActionReason] = useState("");

  const userId = session?.user?.id || "";
  const isPatient = user?.role === "PATIENT";
  const role = getVideoTokenRole(user?.role);

  const canJoin = hasPermission(Permission.JOIN_VIDEO_APPOINTMENTS);
  const canEnd = hasPermission(Permission.END_VIDEO_APPOINTMENTS);
  const canViewRecordings = hasPermission(Permission.VIEW_VIDEO_RECORDINGS);

  const { data: appointmentsData, isPending: isLoading, refetch } = useVideoAppointments({
    ...filters,
    ...(filterStatus ? { status: filterStatus } : {}),
    page: 1,
    limit,
  });
  const { data: myAppointmentsData, isPending: isLoadingMyAppointments } = useMyAppointments();
  const { data: appointmentServices = [] } = useAppointmentServices();
  const { data: clinicsData } = useClinics();
  const clinics = (Array.isArray(clinicsData) ? clinicsData : (clinicsData as any)?.clinics) || [];

  const historyAppointments = extractAppointments(appointmentsData);
  const patientAppointments = useMemo<VideoAppointment[]>(() => {
    const list = Array.isArray((myAppointmentsData as any)?.appointments) ? (myAppointmentsData as any).appointments : [];
    return list.filter((apt: any) => String(apt?.type || "").toUpperCase() === "VIDEO_CALL").map((apt: any) => {
        const dateTime = getAppointmentDateTimeValue(apt);
        const startTime = (dateTime && !Number.isNaN(dateTime.getTime()) ? dateTime.toISOString() : undefined) || apt?.appointmentDate || apt?.startTime || "";
        const normalizedStatus = String(apt?.status || "").toLowerCase().replace(/_/g, "-");
        return {
          id: apt?.id,
          appointmentId: apt?.id,
          roomName: getAppointmentDoctorName(apt),
          doctorId: apt?.doctorId || apt?.doctor?.id || "",
          patientId: apt?.patientId || apt?.patient?.id || "",
          startTime,
          status: normalizedStatus === "awaiting-slot-confirmation" ? "scheduled" : normalizedStatus,
          rawStatus: apt?.status,
          sessionId: apt?.sessionId,
          recordingUrl: apt?.recordingUrl,
          notes: apt?.notes,
          treatmentType: apt?.treatmentType,
          createdAt: apt?.createdAt || apt?.updatedAt || startTime,
          doctorName: getAppointmentDoctorName(apt),
          paymentCompleted: isVideoAppointmentPaymentCompleted(apt),
        } as any;
    });
  }, [myAppointmentsData]);

  const appointments = isPatient ? patientAppointments : historyAppointments;

  const joinVideoAppointment = useJoinVideoAppointment();
  const endVideoAppointment = useEndVideoAppointment();
  const rescheduleAppointment = useRescheduleVideoAppointment();
  const cancelAppointment = useCancelVideoAppointment();
  const rejectProposal = useRejectVideoProposal();

  const searchLower = searchTerm.toLowerCase();
  const filteredAppointments = appointments.filter((apt) => {
    const normalizedStatus = String(apt.status || "").toLowerCase();
    const matchesSearch = !searchTerm || apt.appointmentId?.toLowerCase().includes(searchLower) || ((apt as any).doctorName || "").toLowerCase().includes(searchLower);
    const matchesStatus = !filterStatus || filterStatus === "all" || normalizedStatus === filterStatus;
    const aptDate = apt.startTime ? new Date(apt.startTime) : (apt.createdAt ? new Date(apt.createdAt) : null);
    const matchesStartDate = !dateFilter.start || (aptDate && aptDate >= new Date(dateFilter.start));
    const matchesEndDate = !dateFilter.end || (aptDate && aptDate <= new Date(dateFilter.end));
    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });

  const stats = computeStats(filteredAppointments);
  const { total: totalAppointments, active: activeAppointments, scheduled: scheduledAppointments, completed: completedAppointmentsCount, cancelled: cancelledAppointments } = stats;

  const handleJoinAppointment = async (appointment: VideoAppointment) => {
    if (!canJoin) {
      showErrorToast("No permission to join sessions.", { id: TOAST_IDS.VIDEO.PERMISSION });
      return;
    }
    try {
      const result = await joinVideoAppointment.mutateAsync({ 
        appointmentId: appointment.appointmentId || appointment.id || "", 
        userId, 
        role 
      });
      if (result?.token) {
        setSelectedAppointment(appointment);
        setIsVideoRoomOpen(true);
      }
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.VIDEO.ERROR });
    }
  };

  const handleEndAppointment = async (appointmentId: string) => {
    if (!canEnd) return;
    try {
      await endVideoAppointment.mutateAsync(appointmentId);
      refetch();
      showSuccessToast("Session ended", { id: TOAST_IDS.VIDEO.END });
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.VIDEO.ERROR });
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!actionAppointment || !rescheduleDate || !rescheduleTime) return;
    try {
      await rescheduleAppointment.mutateAsync({ appointmentId: actionAppointment.appointmentId, date: rescheduleDate, time: rescheduleTime, reason: actionReason || "User reschedule" });
      setIsRescheduleOpen(false);
      resetActionState();
    } catch (error) {}
  };

  const handleCancelSubmit = async () => {
    if (!actionAppointment) return;
    try {
      await cancelAppointment.mutateAsync({ appointmentId: actionAppointment.appointmentId, reason: actionReason || "User cancel" });
      setIsCancelOpen(false);
      resetActionState();
    } catch (error) {}
  };

  const handleRejectSubmit = async () => {
    if (!actionAppointment) return;
    try {
      await rejectProposal.mutateAsync({ appointmentId: actionAppointment.appointmentId, reason: actionReason || "Doctor reject" });
      setIsRejectOpen(false);
      resetActionState();
    } catch (error) {}
  };

  const resetActionState = () => { setActionAppointment(null); setRescheduleDate(""); setRescheduleTime(""); setActionReason(""); };
  const openReschedule = (apt: VideoAppointment) => {
    setActionAppointment(apt);
    const dateValue = apt.startTime
      ? new Date(apt.startTime).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
      : "";
    setRescheduleDate(dateValue);
    setIsRescheduleOpen(true);
  };
  const openCancel = (apt: VideoAppointment) => { setActionAppointment(apt); setIsCancelOpen(true); };
  const openReject = (apt: VideoAppointment) => { setActionAppointment(apt); setIsRejectOpen(true); };

  const parseDateValue = (v: string) => v ? new Date(`${v}T00:00:00`) : undefined;
  const toDateString = (d?: Date) => d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : "";
  const formatDateValue = (v: string, p: string) => { const d = parseDateValue(v); return d ? formatDateInIST(d, { day: "2-digit", month: "short", year: "numeric" }) : p; };

  const LocalStatCard = ({ label, value, icon, color }: any) => (
    <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 flex items-center gap-2 sm:gap-3 shadow-sm">
      <div className={cn("rounded-xl p-2 sm:p-2.5 shrink-0", color)}>
        {icon}
      </div>
      <div>
        <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-none mb-0.5">{value}</p>
        <p className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );

  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const AppointmentCard = ({ appointment }: { appointment: VideoAppointment }) => {
    const cfg: { label: string; color: string; dot: string; bg: string } =
      STATUS_CONFIG[appointment.status] ?? DEFAULT_STATUS_CONFIG;
    const statusLabel = getAppointmentStatusBadgeLabel({
      status: (appointment as any).rawStatus || appointment.status,
      type: "VIDEO_CALL",
      proposedSlots: (appointment as any).proposedSlots,
      confirmedSlotIndex: (appointment as any).confirmedSlotIndex,
    });
    const isExpanded = expandedCard === (appointment.id || appointment.appointmentId);
    const doctorName = (appointment as any).doctorName || `Consultation ${appointment.appointmentId || appointment.id}`;
    
    return (
      <div className={cn("rounded-2xl border transition-all duration-200", isExpanded ? "border-muted-foreground/20 bg-muted/20 shadow-sm" : "border-border bg-card hover:border-muted-foreground/20")}>
        <div className="p-3 sm:p-5 cursor-pointer" onClick={() => setExpandedCard(isExpanded ? null : (appointment.id || appointment.appointmentId))}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs sm:text-sm font-bold text-muted-foreground italic">
                {doctorName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm sm:text-base text-foreground leading-tight mb-0.5 truncate">{doctorName}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Video Consultation</span>
                  {(appointment as any).paymentCompleted === false && <span className="text-[8px] sm:text-[9px] text-red-600 font-bold uppercase tracking-widest px-1.5 sm:px-2 py-0.5 rounded-full bg-red-50 border border-red-100">Unpaid</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
               <div className="text-left sm:text-right">
                  <p className="text-xs sm:text-sm font-bold text-foreground leading-none">{appointment.startTime ? formatTimeInIST(new Date(appointment.startTime), { hour: "2-digit", minute: "2-digit", hour12: true }) : "—"}</p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{appointment.startTime ? formatDateInIST(new Date(appointment.startTime), { month: "short", day: "2-digit" }) : "—"}</p>
               </div>
               <div className="flex items-center gap-2">
                 <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider", cfg.bg, cfg.color)}>
                   <span className={cn("w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full", cfg.dot)} />
                   {statusLabel}
                 </span>
                 <ChevronDown className={cn("w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground transition-transform duration-300", isExpanded && "rotate-180")} />
               </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 sm:px-5 pb-4 sm:pb-5 overflow-hidden">
               <div className="pt-3 border-t border-border space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="md:col-span-2 space-y-2">
                      <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic font-serif">Diagnostic Context</span>
                      <p className="font-medium text-xs sm:text-sm text-foreground/80 leading-relaxed italic border-l-2 border-emerald-500 pl-4 sm:pl-6 bg-emerald-50/30 dark:bg-emerald-900/10 py-2 sm:py-3 rounded-r-2xl">
                        "{(appointment as any).chiefComplaint || "Routine video checkup and clinical review."}"
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Protocol Type</span>
                        <p className="font-bold text-foreground text-xs sm:text-sm uppercase">{(appointment as any).treatmentType || "Virtual Consultation"}</p>
                      </div>
                      <div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Authorization</span>
                        <p className="font-bold text-emerald-600 text-xs sm:text-sm uppercase tracking-tighter italic">{role} Access</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end pt-3 sm:pt-4 border-t border-border">
                    {appointment.status === 'scheduled' && (
                      <>
                        {(appointment as any).paymentCompleted === false && getVideoPaymentAmount(appointment, appointmentServices) > 0 && (
                          <PaymentButton appointmentId={appointment.appointmentId} amount={getVideoPaymentAmount(appointment, appointmentServices)} appointmentType="VIDEO_CALL" description="Video Consult" className="h-8 sm:h-9 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold" onSuccess={() => refetch()}>
                            Pay ₹{getVideoPaymentAmount(appointment, appointmentServices)}
                          </PaymentButton>
                        )}
                        {(appointment as any).paymentCompleted !== false &&
                          (
                            (appointment as any).rawStatus === 'AWAITING_SLOT_CONFIRMATION' ||
                            (
                              String((appointment as any).rawStatus || '').toUpperCase() === 'SCHEDULED' &&
                              (
                                (appointment as any).confirmedSlotIndex === null ||
                                (appointment as any).confirmedSlotIndex === undefined ||
                                Number.isNaN(Number((appointment as any).confirmedSlotIndex))
                              )
                            )
                          ) && (
                          <Button variant="outline" className="h-8 sm:h-9 px-3 sm:px-4 rounded-xl text-xs sm:text-sm border-amber-200 bg-amber-50 text-amber-700 pointer-events-none" disabled>
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                            Awaiting Doctor Confirmation
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => openReschedule(appointment)} className="h-8 sm:h-9 px-3 sm:px-4 rounded-xl text-xs sm:text-sm">Reschedule</Button>
                        <Button variant="ghost" size="sm" onClick={() => openCancel(appointment)} className="h-8 sm:h-9 px-3 sm:px-4 rounded-xl text-xs sm:text-sm text-destructive hover:text-destructive">Cancel</Button>
                      </>
                    )}
                    {showJoinButton && ["scheduled", "in-progress"].includes(appointment.status) && isJoinableVideoAppointment(appointment) && (
                      <Button size="sm" onClick={() => handleJoinAppointment(appointment)} className="h-8 sm:h-9 px-4 sm:px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold" disabled={joinVideoAppointment.isPending}>
                        {joinVideoAppointment.isPending ? "Joining..." : "Join Session"}
                      </Button>
                    )}
                    {showEndButton && appointment.status === "in-progress" && (
                      <Button size="sm" variant="destructive" onClick={() => handleEndAppointment(appointment.appointmentId || appointment.id || "")} className="h-8 sm:h-9 px-3 sm:px-4 rounded-xl text-xs sm:text-sm" disabled={endVideoAppointment.isPending}>
                        {endVideoAppointment.isPending ? "Ending..." : "End Session"}
                      </Button>
                    )}
                    {showDownloadButton && appointment.status === "completed" && appointment.recordingUrl && (
                        <Button size="sm" onClick={() => window.open(appointment.recordingUrl, "_blank")} variant="outline" className="h-8 sm:h-9 px-3 sm:px-4 rounded-xl text-xs sm:text-sm">Download Recording</Button>
                    )}
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <ProtectedComponent permission={Permission.VIEW_VIDEO_APPOINTMENTS}>
      <div className="w-full">
        {title && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight sm:text-2xl">{title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
            {isPatient && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-9 px-4 rounded-xl"
                  onClick={() => router.push("/patient/appointments?mode=video")}
                >
                  Book Session
                </Button>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9 w-9 rounded-xl p-0"><RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} /></Button>
              </div>
            )}
          </div>
        )}

        {showStatistics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6">
            <LocalStatCard label="Active" value={activeAppointments} icon={<Activity className="w-4 h-4 sm:w-5 sm:h-5" />} color="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" />
            <LocalStatCard label="Pending" value={scheduledAppointments} icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />} color="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" />
            <LocalStatCard label="Finished" value={completedAppointmentsCount} icon={<CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />} color="text-muted-foreground bg-muted" />
            <LocalStatCard label="Cancelled" value={cancelledAppointments} icon={<XCircle className="w-4 h-4 sm:w-5 sm:h-5" />} color="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20" />
          </div>
        )}

        <div className="space-y-3 mb-4">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by doctor or session ID..." className="h-11 pl-9 rounded-xl border-border bg-muted/50 text-sm" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
             <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full sm:w-auto">
                <TabsList className="max-w-full overflow-x-auto h-auto p-1 justify-start scrollbar-hide">
                    {["all", "scheduled", "in-progress", "completed", "cancelled"].map(s => (
                        <TabsTrigger key={s} value={s} className="capitalize shrink-0 text-xs sm:text-sm px-3">{s}</TabsTrigger>
                    ))}
                </TabsList>
             </Tabs>
             {(dateFilter.start || dateFilter.end) && (
                 <Button variant="ghost" size="sm" onClick={() => setDateFilter({ start: "", end: "" })} className="text-xs text-muted-foreground self-start sm:self-auto">Clear Filter</Button>
             )}
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground/30" /><p className="text-muted-foreground font-medium text-xs uppercase tracking-widest">Loading sessions...</p></div>
          ) : filteredAppointments.length === 0 ? (
            <div className="py-16 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center px-6">
              <CalendarClock className="w-12 h-12 text-muted-foreground/20 mb-4" />
              <p className="text-base font-semibold text-foreground mb-1">No Sessions Found</p>
              <p className="text-muted-foreground text-sm max-w-sm mb-6">Try adjusting the status filter or book a new video consultation.</p>
              {isPatient && (
                <Button
                  size="sm"
                  className="rounded-xl"
                  onClick={() => router.push("/patient/appointments?mode=video")}
                >
                  Book Session
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredAppointments.map(apt => (
                <AppointmentCard key={apt.id || apt.appointmentId} appointment={apt} />
              ))}
            </div>
          )}
        </div>

        <Dialog open={isVideoRoomOpen} onOpenChange={setIsVideoRoomOpen}><DialogContent className="max-w-7xl w-full h-[90vh] p-0 overflow-hidden rounded-3xl border-none shadow-2xl"><div className="h-full"><VideoAppointmentRoom appointment={selectedAppointment!} onLeaveRoom={() => { setIsVideoRoomOpen(false); setSelectedAppointment(null); }} /></div></DialogContent></Dialog>
        <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}><DialogContent className="rounded-3xl p-8"><DialogHeader><DialogTitle className="text-2xl font-bold tracking-tight">Modify Schedule</DialogTitle><DialogDescription className="italic font-medium">Select a new clinical window for this session.</DialogDescription></DialogHeader><div className="space-y-6 py-6"><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</Label><Input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} className="h-12 rounded-xl" /></div><div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Time</Label><Input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} className="h-12 rounded-xl" /></div></div><div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Context</Label><Textarea placeholder="Reason for change..." value={actionReason} onChange={e => setActionReason(e.target.value)} className="rounded-xl min-h-[100px]" /></div></div><div className="flex gap-3"><Button variant="outline" onClick={() => setIsRescheduleOpen(false)} className="flex-1 h-12 rounded-xl font-bold">Discard</Button><Button onClick={handleRescheduleSubmit} className="flex-1 h-12 rounded-xl bg-slate-900 font-bold">Confirm Move</Button></div></DialogContent></Dialog>
        <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}><DialogContent className="rounded-3xl p-8"><DialogHeader><DialogTitle className="text-2xl font-bold tracking-tight">Terminate Session</DialogTitle><DialogDescription className="italic font-medium text-red-600">Are you sure you want to end this clinical commitment?</DialogDescription></DialogHeader><div className="space-y-6 py-6"><div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mandatory Context</Label><Textarea placeholder="Clinical reason for termination..." value={actionReason} onChange={e => setActionReason(e.target.value)} className="rounded-xl min-h-[100px]" /></div></div><div className="flex gap-3"><Button variant="outline" onClick={() => setIsCancelOpen(false)} className="flex-1 h-12 rounded-xl font-bold">Abort Change</Button><Button variant="destructive" onClick={handleCancelSubmit} className="flex-1 h-12 rounded-xl font-bold">Confirm Termination</Button></div></DialogContent></Dialog>
      </div>
    </ProtectedComponent>
  );
}
