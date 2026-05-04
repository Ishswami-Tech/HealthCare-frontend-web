const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  scheduled:   { label: "Scheduled",   color: "text-blue-700 dark:text-blue-300",   dot: "bg-blue-500",   bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900" },
  confirmed:   { label: "Confirmed",   color: "text-green-700 dark:text-green-300", dot: "bg-green-500", bg: "bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900" },
  "in-progress": { label: "In Progress", color: "text-emerald-700 dark:text-emerald-300",dot: "bg-emerald-500",bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900" },
  completed:   { label: "Completed",   color: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400", bg: "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700" },
  cancelled:   { label: "Cancelled",   color: "text-red-700 dark:text-red-300",     dot: "bg-red-500",   bg: "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900" },
  proposed:    { label: "Proposed",    color: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500",  bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900" },
};
const VIDEO_STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Upcoming" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;
const DEFAULT_STATUS_CONFIG = {
  label: "Scheduled",
  color: "text-blue-700 dark:text-blue-300",
  dot: "bg-blue-500",
  bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900",
} as const;

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { useWebSocketContext } from "@/app/providers/WebSocketProvider";
import {
  useEndVideoAppointment,
  getVideoTokenRole,
  useRescheduleVideoAppointment,
  useCancelVideoAppointment,
  useRejectVideoProposal,
  type VideoAppointment,
} from "@/hooks/query/useVideoAppointments";
import { useAppointmentServices, useAppointments, useConfirmVideoSlot, useDoctorAvailability, useMyAppointments } from "@/hooks/query/useAppointments";
import { useClinics, useCurrentClinicId } from "@/hooks/query/useClinics";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { useRBAC } from "@/hooks/utils/useRBAC";
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
  getAppointmentPatientName,
  getDisplayAppointmentDuration,
  formatDateInIST,
  formatAppointmentTime,
  formatTimeInIST,
  getVideoAppointmentJoinBlockedReason,
  isVideoAppointmentJoinable,
  normalizeAppointmentStatus,
  getAppointmentServiceLabel,
} from "@/lib/utils/appointmentUtils";
import {
  getAppointmentViewState,
  isPaidVideoAppointmentAwaitingDoctorConfirmation,
} from "@/lib/utils/appointmentUtils";
import { ProposeVideoAppointmentDialog } from "@/components/appointments/ProposeVideoAppointmentDialog";
import { useClinicContext } from "@/hooks/query/useClinics";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { CalendarPlus, Filter } from "lucide-react";
import { buildVideoSessionRoute } from "@/lib/utils/video-session-route";

// ─── Module-scope pure helpers ───────────────────────────────────────────────

function extractAppointments(data: unknown): VideoAppointment[] {
  const rawAppointments: VideoAppointment[] = (() => {
    if (!data || typeof data !== 'object') return [];
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.appointments)) return d.appointments as VideoAppointment[];
    if (Array.isArray(d.data)) return d.data as VideoAppointment[];
    if (Array.isArray(data)) return data as VideoAppointment[];
    return [];
  })();

  const getRank = (appointment: any) => {
    const status = String(appointment?.rawStatus || appointment?.status || "").toUpperCase();
    const viewState = getAppointmentViewState(appointment);
    const updatedAt = new Date(appointment?.updatedAt || appointment?.createdAt || 0).getTime();

    return [
      status === "CONFIRMED" ? 4 : 0,
      viewState.hasConfirmedSlot ? 2 : 0,
      viewState.hasProposedSlots ? 1 : 0,
      Number.isFinite(updatedAt) ? updatedAt : 0,
    ] as const;
  };

  const dedupedAppointments = new Map<string, VideoAppointment>();
  for (const appointment of rawAppointments) {
    const key = String(appointment?.appointmentId || appointment?.id || "");
    if (!key) continue;

    const current = dedupedAppointments.get(key);
    if (!current) {
      dedupedAppointments.set(key, appointment);
      continue;
    }

    const currentRank = getRank(current);
    const incomingRank = getRank(appointment);
    const shouldReplace =
      incomingRank[0] > currentRank[0] ||
      (incomingRank[0] === currentRank[0] && incomingRank[1] > currentRank[1]) ||
      (incomingRank[0] === currentRank[0] && incomingRank[1] === currentRank[1] && incomingRank[2] > currentRank[2]) ||
      (incomingRank[0] === currentRank[0] && incomingRank[1] === currentRank[1] && incomingRank[2] === currentRank[2] && incomingRank[3] >= currentRank[3]);

    if (shouldReplace) {
      dedupedAppointments.set(key, appointment);
    }
  }

  return Array.from(dedupedAppointments.values());
}

function getEffectiveAppointmentId(appointment: Partial<VideoAppointment> | null | undefined): string {
  if (!appointment) return "";
  return String(appointment.appointmentId || appointment.id || "");
}

function getAppointmentSortTime(appointment: Partial<VideoAppointment> | null | undefined): number {
  if (!appointment) return 0;
  const dateTime = getAppointmentDateTimeValue(appointment);
  if (dateTime && !Number.isNaN(dateTime.getTime())) {
    return dateTime.getTime();
  }

  const fallbackAppointment = appointment as any;
  const fallbackTime = fallbackAppointment?.startTime || fallbackAppointment?.appointmentDate || fallbackAppointment?.createdAt;
  const parsedTime = fallbackTime ? new Date(fallbackTime) : null;
  return parsedTime && !Number.isNaN(parsedTime.getTime()) ? parsedTime.getTime() : 0;
}

function toSlotMinutes(slot: string): number | null {
  const normalized = slot.trim().toUpperCase();
  const match = normalized.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3];

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (meridiem === "AM") {
    if (hours === 12) hours = 0;
  } else if (meridiem === "PM" && hours !== 12) {
    hours += 12;
  }

  return hours * 60 + minutes;
}

function groupSlotsByPeriod(slots: string[]) {
  const periods = {
    morning: [] as string[],
    afternoon: [] as string[],
    evening: [] as string[],
  };

  slots.forEach((slot) => {
    const minutes = toSlotMinutes(slot);
    if (minutes === null) return;

    if (minutes < 12 * 60) {
      periods.morning.push(slot);
    } else if (minutes < 17 * 60) {
      periods.afternoon.push(slot);
    } else {
      periods.evening.push(slot);
    }
  });

  return periods;
}

function matchesVideoStatusFilter(status: string, filter: string): boolean {
  const normalizedStatus = status.toLowerCase();
  const normalizedFilter = filter.toLowerCase();

  if (!normalizedFilter || normalizedFilter === "all") {
    return true;
  }

  if (normalizedFilter === "scheduled") {
    return normalizedStatus === "scheduled" || normalizedStatus === "confirmed";
  }

  return normalizedStatus === normalizedFilter;
}

function extractAvailabilitySlots(availability: unknown): string[] {
  if (!availability || typeof availability !== "object") return [];

  const source = availability as Record<string, unknown>;
  const directSlots = source.availableSlots;
  if (Array.isArray(directSlots)) {
    return directSlots.filter((slot): slot is string => typeof slot === "string" && slot.trim().length > 0);
  }

  const nestedAvailability = source.data as Record<string, unknown> | undefined;
  if (nestedAvailability?.availableSlots && Array.isArray(nestedAvailability.availableSlots)) {
    return nestedAvailability.availableSlots.filter((slot): slot is string => typeof slot === "string" && slot.trim().length > 0);
  }

  const deeperAvailability = nestedAvailability?.data as Record<string, unknown> | undefined;
  if (deeperAvailability?.availableSlots && Array.isArray(deeperAvailability.availableSlots)) {
    return deeperAvailability.availableSlots.filter((slot): slot is string => typeof slot === "string" && slot.trim().length > 0);
  }

  if (Array.isArray(source.slots)) {
    return source.slots
      .flatMap((slot) => {
        if (!slot || typeof slot !== "object") return [];
        const slotRecord = slot as Record<string, unknown>;
        if (slotRecord.isAvailable === false) return [];
        const startTime = slotRecord.startTime;
        return typeof startTime === "string" && startTime.trim().length > 0 ? [startTime] : [];
      });
  }

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
      const normalizedStatus = normalizeAppointmentStatus(apt.status).toLowerCase().replace(/_/g, "-");
      acc.total += 1;
      if (normalizedStatus === "in-progress") acc.active += 1;
      else if (normalizedStatus === "scheduled" || normalizedStatus === "confirmed") acc.scheduled += 1;
      else if (normalizedStatus === "completed") acc.completed += 1;
      else if (normalizedStatus === "cancelled") acc.cancelled += 1;
      return acc;
    },
    { total: 0, active: 0, scheduled: 0, completed: 0, cancelled: 0 }
  );
}

export function isJoinableVideoAppointment(appointment: VideoAppointment | any): boolean {
  return isVideoAppointmentJoinable(appointment);
}

function isWithinJoinWindow(appointment: VideoAppointment | any): boolean {
  const startRaw = appointment?.startTime || appointment?.appointmentDate;
  if (!startRaw) return false;

  const startTime = new Date(startRaw);
  if (Number.isNaN(startTime.getTime())) return false;

  const endRaw = appointment?.endTime;
  const endTime = endRaw ? new Date(endRaw) : new Date(startTime.getTime() + 60 * 60 * 1000);
  if (Number.isNaN(endTime.getTime())) return false;

  const now = new Date();
  const earlyJoinWindow = new Date(startTime.getTime() - 15 * 60 * 1000);
  return now >= earlyJoinWindow && now <= endTime;
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
  enforceTimeSlotWindow?: boolean;
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
  enforceTimeSlotWindow = false,
  limit = 100,
  filters = {},
}: VideoAppointmentsListProps) {
  const { session, user } = useAuth();
  const router = useRouter();
  const { hasPermission } = useRBAC();
  const clinicContextId = useCurrentClinicId();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClinicId, setFilterClinicId] = useState("");
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: "", end: "" });
  
  const [actionAppointment, setActionAppointment] = useState<VideoAppointment | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [pendingSlotSelections, setPendingSlotSelections] = useState<Record<string, number>>({});
  
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [resolvedSlotConfirmations, setResolvedSlotConfirmations] = useState<Record<string, boolean>>({});
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

  const isPatient = user?.role === "PATIENT";
  const role = getVideoTokenRole(user?.role);
  const isDoctorRole = role === "doctor";
  const [filterStatus, setFilterStatus] = useState(isDoctorRole ? "all" : "scheduled");

  const canEnd = hasPermission(Permission.END_VIDEO_APPOINTMENTS);
  const canViewRecordings = hasPermission(Permission.VIEW_VIDEO_RECORDINGS);
  const resolvedClinicId = filterClinicId || clinicContextId || String(session?.user?.clinicId || "");
  const shouldOmitClinicId = !resolvedClinicId && Boolean((filters as any)?.doctorId);

  const { data: staffAppointmentsData, isPending: isLoadingStaff, refetch: refetchStaff } = useAppointments({
    ...filters,
    ...(resolvedClinicId ? { clinicId: resolvedClinicId } : {}),
    ...(shouldOmitClinicId ? { omitClinicId: true } : {}),
    type: "VIDEO_CALL",
    startDate: historyStartDate,
    endDate: futureEndDate,
    page: 1,
    limit: Math.max(limit, 500),
  } as any, {
    enabled: !isPatient,
  });
  useWebSocketQuerySync();
  const { data: myAppointmentsData, isPending: isLoadingMyAppointments, refetch: refetchMyAppointments } = useMyAppointments(undefined, {
    enabled: isPatient,
  });
  const { data: appointmentServices = [] } = useAppointmentServices();
  const { data: clinicsData } = useClinics({
    enabled: showClinicFilter,
  });
  const clinics = (Array.isArray(clinicsData) ? clinicsData : (clinicsData as any)?.clinics) || [];
  const confirmVideoSlot = useConfirmVideoSlot();
  const { isConnected, subscribe } = useWebSocketContext();
  const rescheduleDoctorId = String((actionAppointment as any)?.doctorId || "");
  const rescheduleClinicId = String((actionAppointment as any)?.clinicId || resolvedClinicId || clinicContextId || "");
  const rescheduleLocationId = String((actionAppointment as any)?.locationId || "");
  const { data: rescheduleAvailability, isPending: isRescheduleAvailabilityLoading, error: rescheduleAvailabilityError } = useDoctorAvailability(
    rescheduleClinicId,
    rescheduleDoctorId,
    rescheduleDate,
    rescheduleLocationId || undefined,
    "VIDEO_CALL",
    {
      enabled: isRescheduleOpen && !!rescheduleDoctorId && !!rescheduleDate,
    }
  );

  const historyAppointments = extractAppointments(staffAppointmentsData).slice().sort(
    (left, right) => getAppointmentSortTime(right) - getAppointmentSortTime(left)
  );
  const patientAppointments = useMemo<VideoAppointment[]>(() => {
    const list = Array.isArray((myAppointmentsData as any)?.appointments) ? (myAppointmentsData as any).appointments : [];
    const patientName = String(
      (session?.user as any)?.name ||
      `${(session?.user as any)?.firstName || ""} ${(session?.user as any)?.lastName || ""}`.trim() ||
      ""
    );
    const mappedAppointments = list
      .filter((apt: any) => String(apt?.type || "").toUpperCase() === "VIDEO_CALL")
    .map((apt: any) => {
      const dateTime = getAppointmentDateTimeValue(apt);
      const startTime = (dateTime && !Number.isNaN(dateTime.getTime()) ? dateTime.toISOString() : undefined) || apt?.appointmentDate || apt?.startTime || "";
      const normalizedStatus = String(apt?.status || "").toLowerCase().replace(/_/g, "-");
      return {
          id: apt?.appointmentId || apt?.id,
          appointmentId: apt?.appointmentId || apt?.id,
          roomName: getAppointmentDoctorName(apt),
          doctorId: apt?.doctorId || apt?.doctor?.id || "",
          patientId: apt?.patientId || apt?.patient?.id || "",
          patientName: patientName || getAppointmentPatientName(apt),
          startTime,
          status: normalizedStatus === "awaiting-slot-confirmation" ? "scheduled" : normalizedStatus,
          rawStatus: apt?.status,
          confirmedSlotIndex: apt?.confirmedSlotIndex ?? apt?.confirmed_slot_index ?? null,
          sessionId: apt?.sessionId,
          recordingUrl: apt?.recordingUrl,
          notes: apt?.notes,
          treatmentType: apt?.treatmentType,
          createdAt: apt?.createdAt || apt?.updatedAt || startTime,
          doctorName: getAppointmentDoctorName(apt),
          paymentCompleted: getAppointmentViewState(apt).paymentCompleted,
        } as any;
      });

    const dedupedAppointments = new Map<string, VideoAppointment>();
    for (const appointment of mappedAppointments as any[]) {
      const key = String(appointment?.appointmentId || appointment?.id || "");
      if (!key) continue;

      const current = dedupedAppointments.get(key) as any;
      if (!current) {
        dedupedAppointments.set(key, appointment);
        continue;
      }

      const currentConfirmed = getAppointmentViewState(current).hasConfirmedSlot;
      const incomingConfirmed = getAppointmentViewState(appointment).hasConfirmedSlot;
      const currentConfirmedStatus = String(current?.rawStatus || current?.status || "").toUpperCase() === "CONFIRMED";
      const incomingConfirmedStatus = String(appointment?.rawStatus || appointment?.status || "").toUpperCase() === "CONFIRMED";
      const currentTime = getAppointmentSortTime(current);
      const incomingTime = getAppointmentSortTime(appointment);

      const shouldReplace =
        incomingConfirmedStatus && !currentConfirmedStatus ||
        incomingConfirmed && !currentConfirmed ||
        (incomingConfirmedStatus === currentConfirmedStatus && incomingConfirmed === currentConfirmed && incomingTime >= currentTime);

      if (shouldReplace) {
        dedupedAppointments.set(key, appointment);
      }
    }

    return Array.from(dedupedAppointments.values()).sort((left: any, right: any) => getAppointmentSortTime(right) - getAppointmentSortTime(left));
  }, [myAppointmentsData]);

  const appointments = isPatient ? patientAppointments : historyAppointments;
  const isLoading = isPatient ? isLoadingMyAppointments : isLoadingStaff;
  const refetch = isPatient ? refetchMyAppointments : refetchStaff;

  const endVideoAppointment = useEndVideoAppointment();
  const rescheduleAppointment = useRescheduleVideoAppointment();
  const cancelAppointment = useCancelVideoAppointment();
  const rejectProposal = useRejectVideoProposal();

  useEffect(() => {
    if (!isConnected || !resolvedClinicId) {
      return;
    }

    const shouldRefreshForClinic = (payload: unknown) => {
      const data = payload as { clinicId?: string };
      return !data.clinicId || data.clinicId === resolvedClinicId;
    };

    const refreshPatientAndStaffViews = async (payload: unknown) => {
      if (!shouldRefreshForClinic(payload)) {
        return;
      }

      const data = payload as { appointmentId?: string; id?: string };
      const appointmentId = String(data.appointmentId || data.id || "");

      if (appointmentId) {
        setResolvedSlotConfirmations((current) => ({ ...current, [appointmentId]: true }));
      }

      if (isPatient) {
        await refetchMyAppointments();
      } else {
        await refetchStaff();
      }
    };

    const unsubscribeSlotConfirmed = subscribe("appointment.slot.confirmed", (payload) => {
      void refreshPatientAndStaffViews(payload);
    });

    const unsubscribeConfirmed = subscribe("appointment.confirmed", (payload) => {
      void refreshPatientAndStaffViews(payload);
    });

    const unsubscribeUpdated = subscribe("appointment.updated", (payload) => {
      void refreshPatientAndStaffViews(payload);
    });

    return () => {
      unsubscribeSlotConfirmed();
      unsubscribeConfirmed();
      unsubscribeUpdated();
    };
  }, [isConnected, resolvedClinicId, subscribe, isPatient, refetchMyAppointments, refetchStaff]);

  const searchLower = searchTerm.toLowerCase();
  const filteredAppointments = appointments.filter((apt) => {
    const normalizedStatus = String(apt.status || "").toLowerCase();
    const effectiveAppointmentId = getEffectiveAppointmentId(apt).toLowerCase();
    const matchesSearch = !searchTerm || effectiveAppointmentId.includes(searchLower) || ((apt as any).doctorName || "").toLowerCase().includes(searchLower);
    const matchesStatus = matchesVideoStatusFilter(normalizedStatus, filterStatus);
    const aptDate = getAppointmentDateTimeValue(apt) || (apt.createdAt ? new Date(apt.createdAt) : null);
    const matchesStartDate = !dateFilter.start || (aptDate && aptDate >= new Date(dateFilter.start));
    const matchesEndDate = !dateFilter.end || (aptDate && aptDate <= new Date(dateFilter.end));
    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });

  const stats = computeStats(appointments);
  const { total: totalAppointments, active: activeAppointments, scheduled: scheduledAppointments, completed: completedAppointmentsCount, cancelled: cancelledAppointments } = stats;

  const handleEndAppointment = async (appointmentId: string) => {
    if (!canEnd) return;
    try {
      await endVideoAppointment.mutateAsync(appointmentId);
      showSuccessToast("Session ended", { id: TOAST_IDS.VIDEO.END });
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.VIDEO.ERROR });
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!actionAppointment || !rescheduleDate || !rescheduleTime) return;
    try {
      const appointmentId = getEffectiveAppointmentId(actionAppointment);
      if (!appointmentId) {
        showErrorToast("Missing appointment ID for reschedule.", { id: TOAST_IDS.APPOINTMENT.UPDATE });
        return;
      }
      await rescheduleAppointment.mutateAsync({ appointmentId, date: rescheduleDate, time: rescheduleTime, reason: actionReason || "User reschedule" });
      setIsRescheduleOpen(false);
      resetActionState();
    } catch (error) {}
  };

  const handleCancelSubmit = async () => {
    if (!actionAppointment) return;
    try {
      const appointmentId = getEffectiveAppointmentId(actionAppointment);
      if (!appointmentId) {
        showErrorToast("Missing appointment ID for cancellation.", { id: TOAST_IDS.APPOINTMENT.CANCEL });
        return;
      }
      await cancelAppointment.mutateAsync({ appointmentId, reason: actionReason || "User cancel" });
      setIsCancelOpen(false);
      resetActionState();
    } catch (error) {}
  };

  const handleRejectSubmit = async () => {
    if (!actionAppointment) return;
    try {
      const appointmentId = getEffectiveAppointmentId(actionAppointment);
      if (!appointmentId) {
        showErrorToast("Missing appointment ID for rejection.", { id: TOAST_IDS.APPOINTMENT.CANCEL });
        return;
      }
      await rejectProposal.mutateAsync({ appointmentId, reason: actionReason || "Doctor reject" });
      setIsRejectOpen(false);
      resetActionState();
    } catch (error) {}
  };

  const handleConfirmSlot = async (appointment: VideoAppointment) => {
    if (!isDoctorRole) return;
    const appointmentId = getEffectiveAppointmentId(appointment);
    if (!appointmentId) {
      showErrorToast("Missing appointment ID for slot confirmation.", { id: TOAST_IDS.APPOINTMENT.UPDATE });
      return;
    }

    try {
      // Refresh the appointment list first so we confirm against the latest
      // slot/payment state instead of a stale row snapshot.
      const refreshedResult = await refetch();
      const refreshedAppointment = extractAppointments(
        (refreshedResult as any)?.data ?? (refreshedResult as any)?.appointments ?? (refreshedResult as any)
      ).find((item: any) => String(getEffectiveAppointmentId(item) || item.id || "") === appointmentId);

      if (
        refreshedAppointment &&
        !getAppointmentViewState(refreshedAppointment).awaitingDoctorSlotConfirmation
      ) {
        setResolvedSlotConfirmations((current) => ({ ...current, [appointmentId]: true }));
        showSuccessToast("Slot is already confirmed. Refreshing the list.", { id: TOAST_IDS.APPOINTMENT.UPDATE });
        setPendingSlotSelections((current) => {
          const next = { ...current };
          delete next[appointmentId];
          return next;
        });
        return;
      }

      if (refreshedAppointment && !getAppointmentViewState(refreshedAppointment).paymentCompleted) {
        showErrorToast(
          "Payment is still syncing. Please wait a moment and try confirming again.",
          { id: TOAST_IDS.APPOINTMENT.UPDATE }
        );
        return;
      }

      await confirmVideoSlot.mutateAsync({
        appointmentId,
        confirmedSlotIndex: pendingSlotSelections[appointmentId] ?? 0,
      });
      setResolvedSlotConfirmations((current) => ({ ...current, [appointmentId]: true }));
      if (isPatient) {
        await refetchMyAppointments();
      } else {
        await refetchStaff();
      }
      setPendingSlotSelections((current) => {
        const next = { ...current };
        delete next[appointmentId];
        return next;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("not awaiting doctor slot confirmation")) {
        setResolvedSlotConfirmations((current) => ({ ...current, [appointmentId]: true }));
        showSuccessToast("Slot is already confirmed. Refreshing the list.", { id: TOAST_IDS.APPOINTMENT.UPDATE });
        if (isPatient) {
          await refetchMyAppointments();
        } else {
          await refetchStaff();
        }
        setPendingSlotSelections((current) => {
          const next = { ...current };
          delete next[appointmentId];
          return next;
        });
        return;
      }
      if (message.toLowerCase().includes("slot is no longer available")) {
        showErrorToast(
          "That proposed slot is no longer available. Please choose a different proposed slot and try again.",
          { id: TOAST_IDS.APPOINTMENT.UPDATE }
        );
        if (isPatient) {
          await refetchMyAppointments();
        } else {
          await refetchStaff();
        }
        setPendingSlotSelections((current) => {
          const next = { ...current };
          delete next[appointmentId];
          return next;
        });
        return;
      }
      showErrorToast(error, { id: TOAST_IDS.APPOINTMENT.UPDATE });
    }
  };

  const resetActionState = () => { setActionAppointment(null); setRescheduleDate(""); setRescheduleTime(""); setActionReason(""); };
  const openReschedule = (apt: VideoAppointment) => {
    setActionAppointment(apt);
    const appointmentDateTime = getAppointmentDateTimeValue(apt);
    const dateValue = appointmentDateTime
      ? formatDateInIST(appointmentDateTime, { year: "numeric", month: "2-digit", day: "2-digit" }, "en-CA")
      : "";
    setRescheduleDate(dateValue);
    setRescheduleTime(appointmentDateTime ? formatTimeInIST(appointmentDateTime) : "");
    setIsRescheduleOpen(true);
  };
  const openCancel = (apt: VideoAppointment) => { setActionAppointment(apt); setIsCancelOpen(true); };
  const openReject = (apt: VideoAppointment) => { setActionAppointment(apt); setIsRejectOpen(true); };

  const parseDateValue = (v: string) => v ? new Date(`${v}T00:00:00`) : undefined;
  const toDateString = (d?: Date) => d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : "";
  const formatDateValue = (v: string, p: string) => { const d = parseDateValue(v); return d ? formatDateInIST(d, { day: "2-digit", month: "short", year: "numeric" }) : p; };
  const formatProposedSlot = (slot?: { date: string; time: string }) => {
    if (!slot) return "Slot";
    const dateLabel = slot.date
      ? formatDateInIST(new Date(`${slot.date}T00:00:00`), { day: "2-digit", month: "short" })
      : "";
    const timeLabel = slot.time ? formatAppointmentTime(slot.time) : "";
    return dateLabel ? `${dateLabel} • ${timeLabel || slot.time}` : timeLabel || slot.time;
  };
  const availableRescheduleSlots = useMemo(() => extractAvailabilitySlots(rescheduleAvailability), [rescheduleAvailability]);
  const rescheduleSlotGroups = useMemo(() => groupSlotsByPeriod(availableRescheduleSlots), [availableRescheduleSlots]);
  const selectedRescheduleSlotKey = rescheduleTime.trim().toLowerCase();
  const setRescheduleDateAndResetTime = (date: Date | undefined) => {
    setRescheduleDate(toDateString(date));
    setRescheduleTime("");
  };

  const LocalStatCard = ({ label, value, icon, color, className }: any) => (
    <div className={cn("rounded-xl border border-border bg-card p-3 sm:p-4 flex items-center gap-2 sm:gap-3", className)}>
      <div className={cn("rounded-xl p-2 sm:p-2.5 shrink-0", color)}>
        {icon}
      </div>
      <div>
        <p className="text-xl sm:text-2xl font-semibold text-foreground leading-none mb-0.5">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );

  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const AppointmentCard = ({ appointment }: { appointment: VideoAppointment }) => {
    const normalizedStatus = normalizeAppointmentStatus(appointment.status).toLowerCase().replace(/_/g, "-");
    const viewState = getAppointmentViewState(appointment);
    const effectiveStatus = viewState.normalizedStatus.toLowerCase().replace(/_/g, "-");
    const hasProposedSlots = viewState.hasProposedSlots;
    const hasConfirmedSlot = viewState.hasConfirmedSlot;
    const proposedSlots = hasProposedSlots
      ? ((appointment as any).proposedSlots as Array<{ date: string; time: string }>)
      : [];
    const appointmentSessionId = getEffectiveAppointmentId(appointment);
    const needsDoctorConfirmation =
      isDoctorRole &&
      isPaidVideoAppointmentAwaitingDoctorConfirmation(appointment) &&
      !resolvedSlotConfirmations[appointmentSessionId];
    const cfg: { label: string; color: string; dot: string; bg: string } =
      STATUS_CONFIG[normalizedStatus] ?? DEFAULT_STATUS_CONFIG;
    const statusLabel = viewState.displayStatusLabel;
    const isExpanded = expandedCard === (appointment.appointmentId || appointment.id);
    const patientName = getAppointmentPatientName(appointment);
    const rawDoctorName = (appointment as any).doctorName || getAppointmentDoctorName(appointment);
    const doctorName = rawDoctorName.startsWith("Consultation ") ||
      rawDoctorName === "Unknown Doctor" ||
      rawDoctorName === "Doctor details pending"
      ? ""
      : rawDoctorName;
    const displayDuration = getDisplayAppointmentDuration(appointment);
    const finalSlotSource = String(
      (appointment as any).metadata?.finalSlotSource ||
        (appointment as any).finalSlotSource ||
        ""
    ).toUpperCase();
    const finalSlotSourceLabel =
      finalSlotSource === "PROPOSED_SLOT"
        ? "Confirmed from patient choices"
        : finalSlotSource === "CUSTOM_SLOT"
          ? "Doctor-selected fallback slot"
          : "";
    const isCancelled = normalizedStatus === "cancelled";
    const paymentCompleted = viewState.paymentCompleted;
    const paymentAmount = getVideoPaymentAmount(appointment, appointmentServices);
    const serviceLabel = getAppointmentServiceLabel(appointment, appointmentServices as any[]);
    const appointmentDateTime = getAppointmentDateTimeValue(appointment);
    const appointmentDateLabel = appointmentDateTime
      ? formatDateInIST(appointmentDateTime, { weekday: "short", month: "short", day: "2-digit" })
      : "";
    const appointmentTimeLabel = appointmentDateTime
      ? formatTimeInIST(appointmentDateTime, { hour: "2-digit", minute: "2-digit", hour12: true })
      : "";
    return (
      <div className={cn(
        "rounded-xl border overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md",
        isCancelled ? "bg-red-50 border-red-200 dark:bg-red-950/25 dark:border-red-900/50" : cfg.bg
      )}>
        <div className="p-2.5 sm:p-4 cursor-pointer" onClick={() => setExpandedCard(isExpanded ? null : getEffectiveAppointmentId(appointment))}>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/70 flex items-center justify-center shrink-0 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {patientName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground leading-tight mb-0.5 truncate">{patientName}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[11px] text-muted-foreground truncate">
                    {doctorName ? `Doctor: ${doctorName}` : "Doctor details pending"}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-5 px-1.5 text-[10px] font-semibold uppercase tracking-wide",
                      paymentCompleted
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                        : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
                    )}
                  >
                    {paymentCompleted ? "Payment verified" : "Payment pending"}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {appointmentDateLabel || "Date pending"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {appointmentTimeLabel || "Time pending"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Session {appointmentSessionId ? appointmentSessionId.slice(-6).toUpperCase() : "—"}
                  </span>
                </div>
                {!paymentCompleted && paymentAmount > 0 && (
                  <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                    Join unlocks after payment of ₹{paymentAmount.toLocaleString("en-IN")}.
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
               <div className="text-left sm:text-right">
                  <p className="text-xs font-semibold text-foreground leading-none">{appointmentDateTime ? formatTimeInIST(appointmentDateTime, { hour: "2-digit", minute: "2-digit", hour12: true }) : "—"}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{appointmentDateTime ? formatDateInIST(appointmentDateTime, { month: "short", day: "2-digit" }) : "—"}</p>
               </div>
               <div className="flex items-center gap-2">
                 <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-semibold shadow-sm", cfg.color)}>
                   <span className={cn("w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full", cfg.dot)} />
                   {statusLabel}
                 </span>
                 <ChevronDown className={cn("w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground transition-transform duration-300", isExpanded && "rotate-180")} />
               </div>
            </div>
          </div>
        </div>

        {isExpanded && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 overflow-hidden">
               <div className="pt-3 border-t border-border space-y-3">
                  <div className="space-y-3 pt-1.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-border bg-muted/20 px-3 py-2.5 space-y-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Diagnostic Context</span>
                        <p className="text-sm text-foreground leading-snug">
                          {(appointment as any).chiefComplaint || "Routine video checkup and clinical review."}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/20 px-3 py-2.5 space-y-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Appointment Time</span>
                        <p className="font-medium text-foreground text-sm">
                          {appointmentDateLabel || "Date pending"} {appointmentTimeLabel ? `• ${appointmentTimeLabel}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-xl border border-border bg-muted/20 px-3 py-2.5 space-y-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Session ID</span>
                        <p className="font-medium text-foreground text-sm break-all">
                          {appointmentSessionId || "Pending"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/20 px-3 py-2.5 space-y-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Protocol Type</span>
                        <p className="font-medium text-foreground text-sm">{serviceLabel}</p>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/20 px-3 py-2.5 space-y-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Authorization</span>
                        <p className="font-medium text-emerald-600 text-sm">{role} Access</p>
                      </div>
                    </div>
                    {finalSlotSourceLabel && (
                      <div className="rounded-xl border border-border bg-muted/20 px-3 py-2.5 space-y-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Final Slot</span>
                        <p className="font-medium text-foreground text-sm">{finalSlotSourceLabel}</p>
                      </div>
                    )}
                  </div>

                  {(appointment as any).cancellationReason && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                      <span className="font-semibold">Cancellation reason:</span>{" "}
                      {(appointment as any).cancellationReason}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 justify-end pt-2.5 border-t border-border">
                    {needsDoctorConfirmation && hasProposedSlots && (
                      <div className="flex flex-wrap items-center gap-2 w-full justify-end">
                        <Select
                          value={String(pendingSlotSelections[getEffectiveAppointmentId(appointment)] ?? 0)}
                          onValueChange={(value: string) =>
                            setPendingSlotSelections((current) => ({
                              ...current,
                              [getEffectiveAppointmentId(appointment)]: Number(value),
                            }))
                          }
                        >
                          <SelectTrigger className="h-8 w-[190px] rounded-xl text-xs">
                            <SelectValue placeholder="Select a slot" />
                          </SelectTrigger>
                          <SelectContent>
                            {proposedSlots.map((slot: { date: string; time: string }, index: number) => (
                              <SelectItem key={`${appointment.id}-${index}`} value={String(index)}>
                                {formatProposedSlot(slot)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                          <Button
                          size="sm"
                          className="h-8 px-3 rounded-xl text-xs bg-amber-600 hover:bg-amber-700 text-white"
                          disabled={confirmVideoSlot.isPending}
                          onClick={() => handleConfirmSlot(appointment)}
                        >
                          {confirmVideoSlot.isPending ? (
                            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3 h-3 mr-1.5" />
                          )}
                          Confirm Slot
                        </Button>
                      </div>
                    )}
                    {['scheduled', 'confirmed', 'queued', 'in-progress'].includes(effectiveStatus) && (
                      <>
                        {!paymentCompleted && paymentAmount > 0 && (
                          <PaymentButton appointmentId={getEffectiveAppointmentId(appointment)} amount={getVideoPaymentAmount(appointment, appointmentServices)} appointmentType="VIDEO_CALL" description={serviceLabel} className="h-8 px-3 rounded-xl text-xs font-semibold">
                            Pay ₹{paymentAmount}
                          </PaymentButton>
                        )}
                        {paymentCompleted &&
                          needsDoctorConfirmation && (
                          <Button variant="outline" className="h-8 px-3 rounded-xl text-xs border-amber-200 bg-amber-50 text-amber-700 pointer-events-none" disabled>
                            <Clock className="w-3 h-3 mr-1.5" />
                            Awaiting Doctor Confirmation
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => openReschedule(appointment)} className="h-8 px-3 rounded-xl text-xs">Reschedule</Button>
                        <Button variant="ghost" size="sm" onClick={() => openCancel(appointment)} className="h-8 px-3 rounded-xl text-xs text-destructive hover:text-destructive">Cancel</Button>
                      </>
                    )}
                    {showJoinButton &&
                      ["scheduled", "confirmed", "queued", "in-progress"].includes(effectiveStatus) &&
                      isJoinableVideoAppointment(appointment) &&
                      (!enforceTimeSlotWindow || isWithinJoinWindow(appointment)) && (
                      <Link
                        href={buildVideoSessionRoute(getEffectiveAppointmentId(appointment))}
                        prefetch={false}
                        className="inline-flex h-8 items-center justify-center rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                      >
                        Join Session
                      </Link>
                    )}
                    {showEndButton && appointment.status === "in-progress" && (
                      <Button size="sm" variant="destructive" onClick={() => handleEndAppointment(getEffectiveAppointmentId(appointment))} className="h-8 px-3 rounded-xl text-xs" disabled={endVideoAppointment.isPending}>
                        {endVideoAppointment.isPending ? "Ending..." : "End Session"}
                      </Button>
                    )}
                    {showDownloadButton && appointment.status === "completed" && appointment.recordingUrl && (
                        <Button size="sm" onClick={() => window.open(appointment.recordingUrl, "_blank")} variant="outline" className="h-8 px-3 rounded-xl text-xs">Download Recording</Button>
                    )}
                  </div>
               </div>
            </div>
          )}
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
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 mb-4">
            <LocalStatCard label="Total" value={totalAppointments} icon={<Users className="w-4 h-4 sm:w-5 sm:h-5" />} color="text-indigo-600 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950/40" className="border-indigo-100 bg-indigo-50/70 dark:border-indigo-900 dark:bg-indigo-950/20" />
            <LocalStatCard label="Active" value={activeAppointments} icon={<Activity className="w-4 h-4 sm:w-5 sm:h-5" />} color="text-emerald-600 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/40" className="border-emerald-100 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20" />
            <LocalStatCard label="Pending" value={scheduledAppointments} icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />} color="text-blue-600 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-950/40" className="border-blue-100 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/20" />
            <LocalStatCard label="Finished" value={completedAppointmentsCount} icon={<CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />} color="text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-900/40" className="border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/20" />
            <LocalStatCard label="Cancelled" value={cancelledAppointments} icon={<XCircle className="w-4 h-4 sm:w-5 sm:h-5" />} color="text-red-600 dark:text-red-300 bg-red-100/80 dark:bg-red-950/40" className="border-red-100 bg-red-50/70 dark:border-red-900 dark:bg-red-950/20" />
          </div>
        )}

        <div className="space-y-3 mb-3">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by doctor or session ID..." className="h-10 pl-9 rounded-xl border-border bg-muted/50 text-sm" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
             <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full sm:w-auto">
                <TabsList className="max-w-full overflow-x-auto h-auto p-1 justify-start scrollbar-hide">
                    {VIDEO_STATUS_TABS.map((tab) => (
                        <TabsTrigger key={tab.value} value={tab.value} className="capitalize shrink-0 text-xs sm:text-sm px-3">
                          {tab.label}
                        </TabsTrigger>
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
            <div className="py-14 flex flex-col items-center justify-center gap-2.5"><Loader2 className="w-7 h-7 animate-spin text-muted-foreground/30" /><p className="text-muted-foreground font-medium text-[11px] uppercase tracking-widest">Loading sessions...</p></div>
          ) : filteredAppointments.length === 0 ? (
            <div className="py-12 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center px-5">
              <CalendarClock className="w-11 h-11 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-semibold text-foreground mb-1">No Sessions Found</p>
              <p className="text-muted-foreground text-xs max-w-sm mb-4">Try adjusting the status filter or book a new video consultation.</p>
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
            <div className="grid gap-4">
              {filteredAppointments.map(apt => (
                <AppointmentCard key={apt.appointmentId || apt.id} appointment={apt} />
              ))}
            </div>
          )}
        </div>

        <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
          <DialogContent className="rounded-xl p-6">
            <DialogHeader>
              <DialogTitle>Modify Schedule</DialogTitle>
              <DialogDescription>Select a new session date and pick from the available time slots.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3.5 py-3.5">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !rescheduleDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {rescheduleDate ? formatDateValue(rescheduleDate, "Pick a new date") : "Pick a new date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker
                      mode="single"
                      selected={parseDateValue(rescheduleDate)}
                      onSelect={setRescheduleDateAndResetTime}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Available slots</Label>
                  {rescheduleDate && (
                    <span className="text-xs text-muted-foreground">
                      {formatDateValue(rescheduleDate, "")}
                    </span>
                  )}
                </div>

                {isRescheduleAvailabilityLoading ? (
                  <div className="flex items-center gap-2 justify-center rounded-xl border border-dashed py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading available slots...
                  </div>
                ) : availableRescheduleSlots.length > 0 ? (
                  <div className="space-y-4">
                    {[
                      { key: "morning" as const, label: "Morning", range: "Before 12pm", slots: rescheduleSlotGroups.morning },
                      { key: "afternoon" as const, label: "Afternoon", range: "12pm – 5pm", slots: rescheduleSlotGroups.afternoon },
                      { key: "evening" as const, label: "Evening", range: "After 5pm", slots: rescheduleSlotGroups.evening },
                    ].map((period) =>
                      period.slots.length === 0 ? null : (
                        <div key={period.key}>
                          <div className="mb-2 flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              {period.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              ({period.range})
                            </span>
                            <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {period.slots.length} slots
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                            {period.slots.map((slot) => {
                              const normalizedSlot = slot.trim().toLowerCase();
                              const isSelected = selectedRescheduleSlotKey === normalizedSlot;

                              return (
                                <button
                                  key={slot}
                                  onClick={() => setRescheduleTime(slot)}
                                  className={cn(
                                    "rounded-xl border px-2 py-2 text-center transition-all",
                                    isSelected
                                      ? "border-primary bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20"
                                      : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                                  )}
                                >
                                  <span className="text-xs font-semibold">{slot}</span>
                                  <span className={cn("block text-[9px] font-medium", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                    Select slot
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed py-6 text-center text-sm text-muted-foreground">
                    <Clock className="mx-auto mb-2 h-5 w-5 opacity-40" />
                    <p className="font-medium">
                      {rescheduleDate ? "No available slots for this date" : "Pick a date to see available slots"}
                    </p>
                    <p className="mt-1 text-xs">
                      {rescheduleAvailabilityError instanceof Error
                        ? rescheduleAvailabilityError.message
                        : "Try another date or check the doctor availability settings."}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea placeholder="Reason for change..." value={actionReason} onChange={e => setActionReason(e.target.value)} className="min-h-[90px]" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsRescheduleOpen(false)} className="flex-1">Discard</Button>
              <Button onClick={handleRescheduleSubmit} className="flex-1" disabled={!rescheduleDate || !rescheduleTime}>Confirm</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
          <DialogContent className="rounded-xl p-6">
            <DialogHeader>
              <DialogTitle>Cancel Session</DialogTitle>
              <DialogDescription>Are you sure you want to cancel this video session?</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea placeholder="Cancellation reason..." value={actionReason} onChange={e => setActionReason(e.target.value)} className="min-h-[90px]" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsCancelOpen(false)} className="flex-1">Keep Session</Button>
              <Button variant="destructive" onClick={handleCancelSubmit} className="flex-1">Confirm Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedComponent>
  );
}

