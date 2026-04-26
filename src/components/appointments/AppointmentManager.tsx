"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";

import { showErrorToast, showInfoToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { useAuth } from "@/hooks/auth/useAuth";
import { useWebSocketStatus } from "@/app/providers/WebSocketProvider";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import {
  useCancelAppointment,
  useMyAppointments,
  useAppointments,
  useProcessCheckIn,
  useRescheduleAppointment,
  useRejectVideoProposal,
} from "@/hooks/query/useAppointments";
import {
  AppointmentWithRelations,
} from "@/types/appointment.types";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { cn } from "@/lib/utils";
import {
  formatDateInIST,
  getAppointmentStatusBadgeLabel,
  getAppointmentDateTimeValue,
  getDisplayAppointmentDuration,
  isVideoAppointmentPaymentCompleted,
  normalizeAppointmentStatus,
  normalizePatientAppointment,
} from "@/lib/utils/appointmentUtils";
import {
  isPaidVideoAppointmentAwaitingDoctorConfirmation,
} from "@/lib/utils/appointmentUtils";
import {
  Calendar,
  Clock,
  Stethoscope,
  Video,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  ChevronDown,
  Activity,
  Zap,
  CalendarPlus,
  Timer,
  CreditCard,
} from "lucide-react";
import { PaymentButton } from "@/components/payments/PaymentButton";

type StatusFilter = "ALL" | "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  SCHEDULED:   { label: "Scheduled",   color: "text-blue-700 dark:text-blue-300",   dot: "bg-blue-500",   bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900" },
  CONFIRMED:   { label: "Confirmed",   color: "text-green-700 dark:text-green-300", dot: "bg-green-500", bg: "bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900" },
  IN_PROGRESS: { label: "In Progress", color: "text-purple-700 dark:text-purple-300",dot: "bg-purple-500",bg: "bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900" },
  COMPLETED:   { label: "Completed",   color: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400", bg: "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700" },
  CANCELLED:   { label: "Cancelled",   color: "text-red-700 dark:text-red-300",     dot: "bg-red-500",   bg: "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900" },
  NO_SHOW:     { label: "No Show",     color: "text-orange-700 dark:text-orange-300",dot: "bg-orange-400",bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900" },
};

interface AppointmentManagerProps {
  filterType?: "VIDEO_CALL" | "IN_PERSON";
  defaultConsultationMode?: "VIDEO" | "IN_PERSON";
  isAdminView?: boolean;
  clinicId?: string;
  patientId?: string;
  hideBookButton?: boolean;
  autoOpenBookDialog?: boolean;
}

function getEffectiveAppointmentId(appointment: AppointmentWithRelations | any): string {
  return String(appointment?.appointmentId || appointment?.id || "");
}

export default function AppointmentManager({ 
  filterType, 
  defaultConsultationMode, 
  isAdminView = false,
  clinicId: propClinicId,
  patientId: propPatientId,
  hideBookButton = false,
  autoOpenBookDialog = false,
}: AppointmentManagerProps = {}) {
  const { session } = useAuth();
  const user = session?.user;
  const hasShownRealtimeToastRef = useRef(false);

  // Real-time WebSocket integration
  const { isConnected, isRealTimeEnabled } = useWebSocketStatus();
  useWebSocketQuerySync();

  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(isAdminView ? "ALL" : "SCHEDULED");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ date: "", time: "" });
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // ─── Data Fetching ────────────────────────────────────────────────────────
  
  // Choose hook based on view role
  // Sanitize filters to avoid undefined properties breaking exactOptionalPropertyTypes
  const adminFilters = useMemo(() => {
    if (!isAdminView) return undefined;
    const filters: any = {
      clinicId: propClinicId || "",
    };
    if (propPatientId) filters.patientId = propPatientId;
    if (filterType) filters.type = filterType;
    if (dateFilter.start) filters.date = dateFilter.start;
    return filters;
  }, [isAdminView, propClinicId, propPatientId, filterType, dateFilter.start]);

  const personalFilters = useMemo(() => {
    if (isAdminView) return undefined;
    const filters: any = {};
    if (dateFilter.start) filters.date = dateFilter.start;
    return filters;
  }, [isAdminView, dateFilter.start]);

  const adminAppointments = useAppointments(adminFilters);
  const myPersonalAppointments = useMyAppointments(personalFilters);

  const { mutate: cancelAppointment, isPending: cancellingAppointment } = useCancelAppointment();
  const { mutate: rescheduleAppointment, isPending: reschedulingAppointment } = useRescheduleAppointment();
  const { mutate: rejectVideoProposal, isPending: rejectingProposal } = useRejectVideoProposal();
  const { mutate: processCheckIn, isPending: processingCheckIn } = useProcessCheckIn();

  const appointmentsFetching = isAdminView ? adminAppointments.isFetching : myPersonalAppointments.isFetching;
  const isAppointmentsLoading = isAdminView ? adminAppointments.isPending : myPersonalAppointments.isPending;
  const refetch = isAdminView ? adminAppointments.refetch : myPersonalAppointments.refetch;
  const rawData = isAdminView ? adminAppointments.data : myPersonalAppointments.data;

  const fetchedAppointments = useMemo((): AppointmentWithRelations[] => {
    let list: AppointmentWithRelations[] = [];
    if (Array.isArray(rawData)) list = rawData;
    else if (Array.isArray((rawData as any)?.data?.appointments)) list = (rawData as any).data.appointments;
    else if (Array.isArray((rawData as any)?.appointments)) list = (rawData as any).appointments;
    else if (Array.isArray((rawData as any)?.data)) list = (rawData as any).data;
    return list;
  }, [rawData]);

  const allAppointments = fetchedAppointments;
  const patientScopedAppointments = useMemo(() => {
    // Admin views already fetch filtered by clinic/patient — don't re-filter.
    if (isAdminView) return allAppointments;

    // Patient view uses /appointments/my-appointments (already server scoped).
    // Do not perform client-side patientId/userId filtering here.
    return allAppointments;
  }, [allAppointments, isAdminView]);

  const normalizedAppointments = useMemo(() => {
    return patientScopedAppointments
      .map((appointment) => {
        const normalized = normalizePatientAppointment(appointment);
        return {
          ...appointment,
          status: normalized.status,
          type: normalized.type,
          location: {
            ...(appointment.location || {}),
            name: normalized.locationName,
          },
          doctorLabel: normalized.doctorName,
          locationLabel: normalized.locationName,
          normalizedDate: normalized.normalizedDate,
          normalizedTime: normalized.normalizedTime,
          appointmentDateTime: normalized.dateTime,
        } as any;
      })
      .sort((a, b) => {
        const aCancelled = normalizeAppointmentStatus(a.status) === "CANCELLED";
        const bCancelled = normalizeAppointmentStatus(b.status) === "CANCELLED";

        if (aCancelled !== bCancelled) {
          return aCancelled ? 1 : -1;
        }

        const aTime = a.appointmentDateTime?.getTime() ?? 0;
        const bTime = b.appointmentDateTime?.getTime() ?? 0;
        return bTime - aTime;
      });
  }, [patientScopedAppointments]);

  const awaitingDoctorReviewAppointments = useMemo(
    () =>
      normalizedAppointments.filter((appointment) =>
        isPaidVideoAppointmentAwaitingDoctorConfirmation(appointment)
      ),
    [normalizedAppointments]
  );

  const awaitingDoctorReviewIds = useMemo(
    () => new Set(awaitingDoctorReviewAppointments.map((appointment) => String(appointment.id || ""))),
    [awaitingDoctorReviewAppointments]
  );

  const primaryAppointments = useMemo(
    () => normalizedAppointments.filter((appointment) => !awaitingDoctorReviewIds.has(String(appointment.id || ""))),
    [normalizedAppointments, awaitingDoctorReviewIds]
  );

  const filteredAppointments = useMemo(() => {
    const parseAppointmentDate = (value: string) => {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const startDate = dateFilter.start ? parseAppointmentDate(`${dateFilter.start}T00:00:00`) : null;
    const endDate = dateFilter.end ? parseAppointmentDate(`${dateFilter.end}T23:59:59.999`) : null;

    return primaryAppointments.filter(apt => {
      const matchesType = !filterType || apt.type === filterType;
      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : apt.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        apt.doctorLabel.toLowerCase().includes(q) ||
        apt.doctor?.user?.firstName?.toLowerCase().includes(q) ||
        apt.doctor?.user?.lastName?.toLowerCase().includes(q) ||
        (apt as any).doctorName?.toLowerCase().includes(q) ||
        apt.locationLabel.toLowerCase().includes(q) ||
        (apt as any).locationName?.toLowerCase().includes(q) ||
        apt.status?.toLowerCase().includes(q);
      const appointmentDate = apt.appointmentDateTime;
      const matchesStartDate = !startDate || (appointmentDate !== null && appointmentDate >= startDate);
      const matchesEndDate = !endDate || (appointmentDate !== null && appointmentDate <= endDate);
      return matchesType && matchesStatus && matchesSearch && matchesStartDate && matchesEndDate;
    });
  }, [primaryAppointments, statusFilter, searchQuery, dateFilter.start, dateFilter.end]);

  // Stats
  const stats = useMemo(() => {
    const total = normalizedAppointments.length;
    const upcoming = primaryAppointments.filter(a => ["SCHEDULED", "CONFIRMED"].includes(a.status)).length;
    const completed = primaryAppointments.filter(a => a.status === "COMPLETED").length;
    const inProgress = primaryAppointments.filter(a => a.status === "IN_PROGRESS").length;
    return { total, upcoming, completed, inProgress };
  }, [normalizedAppointments, primaryAppointments]);

  const formatDate = (date: string) => {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "Date TBD";
    return parsed.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (time: string | undefined) => {
    if (!time) return "—";
    const parts = time.split(":");
    const hour = parseInt(parts[0] ?? "0");
    const m = parts[1] ?? "00";
    const suffix = hour >= 12 ? "PM" : "AM";
    return `${hour % 12 || 12}:${m} ${suffix}`;
  };

  const parseDateValue = (value: string) => {
    if (!value) return undefined;
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const formatDateValue = (value: string, placeholder: string) => {
    const parsed = parseDateValue(value);
    return parsed
      ? formatDateInIST(parsed, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : placeholder;
  };

  const toDateString = (date?: Date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };


  const handleCancelAppointment = useCallback((id: string) => {
    cancelAppointment({ id, reason: "Cancelled via appointment manager" }, {
      onSuccess: () => showSuccessToast("Appointment cancelled", { id: TOAST_IDS.APPOINTMENT.DELETE, description: "Your appointment has been cancelled." }),
      onError: (error: Error) => showErrorToast(sanitizeErrorMessage(error) || "Failed to cancel", { id: TOAST_IDS.APPOINTMENT.DELETE }),
    });
  }, [cancelAppointment]);

  const handleRescheduleSubmit = () => {
    if (!selectedAppointment) return;
    const appointmentId = getEffectiveAppointmentId(selectedAppointment);
    rescheduleAppointment({ id: appointmentId, data: { date: rescheduleData.date, time: rescheduleData.time } }, {
      onSuccess: () => {
        showSuccessToast("Appointment rescheduled", { id: TOAST_IDS.APPOINTMENT.UPDATE, description: "Your appointment has been rescheduled." });
        setIsRescheduleDialogOpen(false);
      },
      onError: (error: Error) => showErrorToast(sanitizeErrorMessage(error) || "Failed to reschedule", { id: TOAST_IDS.APPOINTMENT.UPDATE }),
    });
  };

  const handleRejectProposal = () => {
    if (!selectedAppointment) return;
    const appointmentId = getEffectiveAppointmentId(selectedAppointment);
    rejectVideoProposal({ id: appointmentId, reason: rejectReason }, {
      onSuccess: () => {
        showSuccessToast("Proposal rejected", { id: TOAST_IDS.APPOINTMENT.UPDATE });
        setIsRejectDialogOpen(false);
        setRejectReason("");
        setSelectedAppointment(null);
      },
      onError: (error: Error) => showErrorToast(sanitizeErrorMessage(error) || "Failed to reject", { id: TOAST_IDS.APPOINTMENT.UPDATE }),
    });
  };

  useEffect(() => {
    if (isRealTimeEnabled && isConnected && !hasShownRealtimeToastRef.current) {
      hasShownRealtimeToastRef.current = true;
      showInfoToast("Live updates active", { id: TOAST_IDS.GLOBAL.INFO, description: "Appointments update in real-time", duration: 2000 });
    }

    if (!isConnected) {
      hasShownRealtimeToastRef.current = false;
    }
  }, [isRealTimeEnabled, isConnected]);

  const StatCard = ({
    label,
    value,
    icon,
    iconBg,
    iconBorder,
    iconColor,
    cardBorder,
    cardHover,
    className,
  }: {
    label: string;
    value: number;
    icon: React.ReactNode;
    color?: string;
    iconBg: string;
    iconBorder: string;
    iconColor: string;
    cardBorder: string;
    cardHover: string;
    className?: string;
  }) => (
    <div className={`rounded-2xl border ${cardBorder} bg-card p-4 flex items-center gap-3 transition-all ${cardHover} hover:shadow-sm ${className || ""}`}>
      <div className={`rounded-xl ${iconBg} p-2.5 border ${iconBorder} ${iconColor}`}>{icon}</div>
      <div>
        <p className="text-2xl font-extrabold text-foreground tracking-tight">{value}</p>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );

  const AppointmentCard = ({ apt }: { apt: AppointmentWithRelations }) => {
    const cfg = (STATUS_CONFIG[apt.status] ?? STATUS_CONFIG["SCHEDULED"]) as { label: string; color: string; dot: string; bg: string };
    const statusLabel = getAppointmentStatusBadgeLabel((apt as any).raw || apt);
    const isExpanded = expandedCard === apt.id;
    const appointmentDateTime = getAppointmentDateTimeValue(apt);
    const normalizedAppointment = normalizePatientAppointment(apt);
    const doctorName = (apt as any).doctorLabel || normalizedAppointment.doctorName;
    const locationName = (apt as any).locationLabel || normalizedAppointment.locationName;
    const appointmentTypeLabel =
      apt.type === "VIDEO_CALL"
        ? "Video Consultation"
        : apt.type === "IN_PERSON"
          ? "In-Person Visit"
          : String(apt.type || "Appointment").replace(/_/g, " ");
    const displayTime =
      apt.time ||
      (appointmentDateTime
        ? `${String(appointmentDateTime.getHours()).padStart(2, "0")}:${String(
            appointmentDateTime.getMinutes()
          ).padStart(2, "0")}`
        : undefined);
    const normalizedDate = appointmentDateTime?.toISOString() || apt.date;
    const displayDuration = getDisplayAppointmentDuration(apt);

    const isCancelled = apt.status === "CANCELLED" || apt.status === "NO_SHOW";
    return (
      <div className={`rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-md ${
        isCancelled
          ? "bg-red-50 border-red-200 dark:bg-red-950/25 dark:border-red-900/50 hover:border-red-300"
          : `bg-card border-border hover:border-emerald-200 ${isExpanded ? "shadow-md border-emerald-300" : ""}`
      }`}>
        {/* Card header */}
        <div
          className="p-4 cursor-pointer"
          onClick={() => {
            setExpandedCard(isExpanded ? null : apt.id);
            setSelectedAppointment(isExpanded ? null : apt as AppointmentWithRelations);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setExpandedCard(isExpanded ? null : apt.id);
              setSelectedAppointment(isExpanded ? null : apt as AppointmentWithRelations);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/70 flex items-center justify-center shrink-0 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                {doctorName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{doctorName}</p>
                <p className="text-xs opacity-60 truncate">{apt.location?.name || "—"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold shadow-sm">
                {apt.type === "VIDEO_CALL" ? <Video className="w-3.5 h-3.5" /> : <Stethoscope className="w-3.5 h-3.5" />}
                {apt.type === "VIDEO_CALL"
                  ? "Video"
                  : apt.type === "IN_PERSON"
                    ? "In-Person"
                    : apt.type.replace(/_/g, " ")}
              </span>
              {/* Status badge */}
              <span className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold shadow-sm ${cfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {statusLabel}
              </span>
              <ChevronDown className={`w-4 h-4 opacity-40 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            </div>
          </div>

          {/* Date/time row */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs opacity-70">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(normalizedDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(displayTime)}
            </span>
            {displayDuration && (
              <span className="flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5" />
                {displayDuration} min
              </span>
            )}
          </div>
        </div>

        {/* Expanded body */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-border/60 mt-0">
            <div className="pt-3 space-y-3">
              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {(apt as any).chiefComplaint && (
                  <div className="col-span-2 rounded-lg bg-background/70 p-2.5 ring-1 ring-border/40">
                    <p className="font-semibold mb-0.5 opacity-60">Chief Complaint</p>
                    <p className="font-medium">{(apt as any).chiefComplaint}</p>
                  </div>
                )}
                {(apt as any).urgency && (
                  <div className="rounded-lg bg-background/70 p-2.5 ring-1 ring-border/40">
                    <p className="font-semibold mb-0.5 opacity-60">Urgency</p>
                    <p className="font-medium capitalize">{(apt as any).urgency.toLowerCase()}</p>
                  </div>
                )}
                {apt.type && (
                  <div className="rounded-lg bg-background/70 p-2.5 ring-1 ring-border/40">
                    <p className="font-semibold mb-0.5 opacity-60">Type</p>
                    <p className="font-medium">
                      {apt.type === "VIDEO_CALL"
                        ? "Video Consultation"
                        : apt.type === "IN_PERSON"
                          ? "In-Person Visit"
                          : apt.type.replace(/_/g, " ")}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions — unified to avoid duplicate buttons */}
              <div className="flex flex-wrap gap-3 mt-4">
                {apt.status === "SCHEDULED" && (
                  <Button
                    variant="outline"
                    className="h-10 px-5 rounded-lg border-border/50 bg-background/50 text-sm hover:bg-accent/50 transition-all active:scale-95 flex-1 sm:flex-none"
                    onClick={() => {
                      setSelectedAppointment(apt as AppointmentWithRelations);
                      setRescheduleData({
                        date: normalizedDate ? normalizedDate.slice(0, 10) : "",
                        time: displayTime || "",
                      });
                      setIsRescheduleDialogOpen(true);
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reschedule
                  </Button>
                )}
                {apt.status === "SCHEDULED" && apt.type !== "VIDEO_CALL" && (
                  <Button
                    className="h-10 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm shadow-sm transition-all active:scale-95 flex-1"
                    onClick={() => {
                      window.location.href = "/patient/check-in";
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Go To Check-In
                  </Button>
                )}
                {apt.status === "SCHEDULED" && (
                  <Button
                    variant="outline"
                    className="h-10 px-5 rounded-lg border-red-200/50 bg-red-50/30 text-red-600 hover:bg-red-100/50 hover:text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 text-sm transition-all active:scale-95 flex-1 sm:flex-none"
                    onClick={() => handleCancelAppointment(getEffectiveAppointmentId(apt))}
                    disabled={cancellingAppointment}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
                {apt.type === "VIDEO_CALL" &&
                  ["CONFIRMED", "IN_PROGRESS"].includes(String((apt as any).raw?.status || "").toUpperCase()) &&
                  isVideoAppointmentPaymentCompleted(apt) && (
                  <Button
                    className="h-10 px-6 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm shadow-sm transition-all active:scale-95 flex-1"
                    onClick={() => window.location.href = `/patient/video?appointmentId=${getEffectiveAppointmentId(apt)}`}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Join Video
                  </Button>
                )}
                {apt.type === "VIDEO_CALL" &&
                  !isVideoAppointmentPaymentCompleted(apt) && (
                  <PaymentButton
                    appointmentId={getEffectiveAppointmentId(apt)}
                    amount={apt.invoice?.amount || 500}
                    className="h-10 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm shadow-sm transition-all active:scale-95 flex-1"
                    onSuccess={() => {
                      const appointmentStatus = normalizeAppointmentStatus((apt as any).raw?.status || apt.status);
                      if (["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(appointmentStatus)) {
                        window.location.href = `/patient/video?appointmentId=${getEffectiveAppointmentId(apt)}`;
                      } else {
                         window.location.reload();
                      }
                    }}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Complete Payment
                  </PaymentButton>
                )}
                {apt.type === "VIDEO_CALL" &&
                  isVideoAppointmentPaymentCompleted(apt) &&
                  isPaidVideoAppointmentAwaitingDoctorConfirmation(apt) && (
                    <Button
                      variant="outline"
                      className="h-10 px-6 rounded-lg border-amber-200 bg-amber-50 text-amber-700 text-sm pointer-events-none flex-1"
                      disabled
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Awaiting Doctor Confirmation
                    </Button>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isAppointmentsLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />)}
        </div>
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />)}
      </div>
    );
  }

  return (
    <Card className="max-w-6xl mx-auto bg-card rounded-xl border border-border sm:rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
               <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            Current Appointments
          </CardTitle>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start sm:gap-3 lg:w-auto lg:justify-end">
            {isRealTimeEnabled && (
              <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${isConnected ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-amber-500"}`} />
                {isConnected ? "Live" : "Connecting..."}
              </span>
            )}

            {!hideBookButton && (
              <BookAppointmentDialog 
                defaultOpen={autoOpenBookDialog}
                {...(defaultConsultationMode ? { initialConsultationMode: defaultConsultationMode } : {})}
                {...(propClinicId ? { clinicId: propClinicId } : {})}
                {...(propPatientId ? { initialPatientId: propPatientId } : {})}
                trigger={
                <Button
                  className="w-full sm:w-auto gap-2 rounded-xl border-0 bg-emerald-600 px-6 font-bold h-10 text-white shadow-md transition-all active:scale-95 hover:bg-emerald-700 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                >
                  <CalendarPlus className="h-5 w-5" />
                  Book Appointment
                </Button>
                }
              />
            )}

            <Button
              variant="outline"
              onClick={() => refetch()}
              className="h-10 w-full gap-2 rounded-xl border-sky-200 bg-sky-50 px-4 py-2 text-sky-700 hover:bg-sky-100 hover:text-sky-800 transition-all shadow-sm dark:border-sky-900/70 dark:bg-sky-950/25 dark:text-sky-300 dark:hover:bg-sky-950/45 sm:w-auto"
              disabled={appointmentsFetching}
              title="Refresh Appointments"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-200">
                <RefreshCw className={`w-3.5 h-3.5 ${appointmentsFetching ? "animate-spin" : ""}`} />
              </span>
              <span className="text-sm font-medium">Refresh</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          <StatCard
            label="Total"
            value={stats.total}
            icon={<Stethoscope className="w-5 h-5" />}
            iconBg="bg-blue-50 dark:bg-blue-950/30"
            iconBorder="border-blue-100 dark:border-blue-900"
            iconColor="text-blue-600"
            cardBorder="border-blue-100 dark:border-blue-900"
            cardHover="hover:border-blue-300"
            className="bg-blue-50/70 dark:bg-blue-950/20"
          />
          <StatCard
            label="Upcoming"
            value={stats.upcoming}
            icon={<Calendar className="w-5 h-5" />}
            iconBg="bg-emerald-50 dark:bg-emerald-950/30"
            iconBorder="border-emerald-100 dark:border-emerald-900"
            iconColor="text-emerald-600"
            cardBorder="border-emerald-100 dark:border-emerald-900"
            cardHover="hover:border-emerald-300"
            className="bg-emerald-50/70 dark:bg-emerald-950/20"
          />
          <StatCard
            label="In Progress"
            value={stats.inProgress}
            icon={<Zap className="w-5 h-5" />}
            iconBg="bg-amber-50 dark:bg-amber-950/30"
            iconBorder="border-amber-100 dark:border-amber-900"
            iconColor="text-amber-600"
            cardBorder="border-amber-100 dark:border-amber-900"
            cardHover="hover:border-amber-300"
            className="bg-amber-50/70 dark:bg-amber-950/20"
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon={<CheckCircle className="w-5 h-5" />}
            iconBg="bg-violet-50 dark:bg-violet-950/30"
            iconBorder="border-violet-100 dark:border-violet-900"
            iconColor="text-violet-600"
            cardBorder="border-violet-100 dark:border-violet-900"
            cardHover="hover:border-violet-300"
            className="bg-violet-50/70 dark:bg-violet-950/20"
          />
      </div>

      {awaitingDoctorReviewAppointments.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                Awaiting doctor review
              </p>
              <h3 className="mt-1 text-base font-semibold text-foreground">
                {awaitingDoctorReviewAppointments.length} video request{awaitingDoctorReviewAppointments.length > 1 ? "s" : ""} need confirmation
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The doctor will confirm one of your 3 preferred slots. This request stays separate from normal upcoming visits.
              </p>
            </div>
            <Badge className="rounded-full border border-amber-200 bg-white px-3 py-1 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300">
              Pending review
            </Badge>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {awaitingDoctorReviewAppointments.slice(0, 3).map((appointment) => (
              <div
                key={getEffectiveAppointmentId(appointment)}
                className="rounded-xl border border-amber-200/80 bg-white/90 p-3 shadow-sm dark:border-amber-900/40 dark:bg-card/80"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {getAppointmentStatusBadgeLabel(appointment)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {getDisplayAppointmentDuration(appointment) || "15"} min video consult
                    </p>
                  </div>
                  <Badge className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                    Pending
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.isArray((appointment as any).proposedSlots) &&
                    (appointment as any).proposedSlots.map((slot: { date?: string; time?: string }, index: number) => (
                      <span
                        key={`${getEffectiveAppointmentId(appointment)}-${index}`}
                        className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
                      >
                        {slot.time || "Time TBD"}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters (REPLICATING DASHBOARD EXACTLY) */}
      <div className="space-y-4 mb-8">
        {/* 1. Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doctor, location..."
            className="pl-10 h-11 border-muted/30 bg-muted/5 rounded-lg text-sm focus-visible:ring-primary shadow-sm w-full"
          />
        </div>

        <div className="bg-card border border-border/60 p-1 sm:p-1.5 h-12 sm:h-14 rounded-xl sm:rounded-2xl max-w-full flex gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide shadow-sm">
          {(["ALL", "SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as StatusFilter[]).map(s => {
            const isActive = statusFilter === s;
            const labelMap: Record<string, string> = {
              ALL: "All",
              SCHEDULED: "Scheduled",
              CONFIRMED: "Confirmed",
              IN_PROGRESS: "In Progress",
              COMPLETED: "Completed",
              CANCELLED: "Cancelled"
            };

            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-lg sm:rounded-xl px-3 sm:px-6 h-full font-semibold text-[11px] sm:text-sm transition-all whitespace-nowrap",
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                )}
              >
                {labelMap[s]}
              </button>
            );
          })}
        </div>

        {/* 3. Default View Label */}
        <p className="text-[13px] text-muted-foreground/80 px-1">
           Default view is showing scheduled appointments first.
        </p>

        {/* 4. Date Range Pickers (From date, To date) */}
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-10 w-44 justify-start text-left text-sm font-normal rounded-lg border-border bg-background",
                  !dateFilter.start && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4 opacity-50" />
                {formatDateValue(dateFilter.start, "From date")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarPicker
                mode="single"
                selected={parseDateValue(dateFilter.start)}
                onSelect={(date) => setDateFilter((p) => ({ ...p, start: toDateString(date) }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-10 w-44 justify-start text-left text-sm font-normal rounded-lg border-border bg-background",
                  !dateFilter.end && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4 opacity-50" />
                {formatDateValue(dateFilter.end, "To date")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarPicker
                mode="single"
                selected={parseDateValue(dateFilter.end)}
                onSelect={(date) => setDateFilter((p) => ({ ...p, end: toDateString(date) }))}
                disabled={(date) => {
                  const startDate = parseDateValue(dateFilter.start);
                  return !!startDate && date < startDate;
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {(dateFilter.start || dateFilter.end || (statusFilter && statusFilter !== "SCHEDULED")) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFilter({ start: "", end: "" });
                setStatusFilter("SCHEDULED");
                setSearchQuery("");
              }}
              className="text-primary hover:bg-primary/5 h-9"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Appointments list */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-2xl bg-muted/20">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-semibold text-muted-foreground">
            {allAppointments.length === 0 ? "No appointments yet" : "No appointments match your filters"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {allAppointments.length === 0
              ? "Book your first appointment to get started"
              : "Try adjusting the status filter or search query"}
          </p>
          {allAppointments.length === 0 && (
            <BookAppointmentDialog
              defaultOpen={autoOpenBookDialog}
              {...(defaultConsultationMode ? { initialConsultationMode: defaultConsultationMode } : {})}
              {...(propClinicId ? { clinicId: propClinicId } : {})}
              {...(propPatientId ? { initialPatientId: propPatientId } : {})}
              trigger={
                <Button className="mt-4 gap-2">
                  <CalendarPlus className="w-4 h-4" />
                  Book Appointment
                </Button>
              }
            />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pagination info */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">
              Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredAppointments.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredAppointments.length)} of {filteredAppointments.length} appointments
            </p>
          </div>
          {filteredAppointments
            .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
            .map((apt) => (
              <AppointmentCard key={apt.id} apt={apt} />
            ))}
          {/* Pagination controls */}
          {filteredAppointments.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-9 px-4 rounded-lg border-border/60 text-sm"
              >
                ← Prev
              </Button>
              {Array.from({ length: Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "w-9 h-9 rounded-lg text-sm font-semibold transition-all",
                    page === currentPage
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "border border-border/60 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                  )}
                >
                  {page}
                </button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE), p + 1))}
                disabled={currentPage === Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE)}
                className="h-9 px-4 rounded-lg border-border/60 text-sm"
              >
                Next →
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              Reschedule Appointment
            </DialogTitle>
            <DialogDescription>
              Choose a new date and time for your appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">New Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !rescheduleData.date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formatDateValue(rescheduleData.date, "Pick a new date")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker
                    mode="single"
                    selected={parseDateValue(rescheduleData.date)}
                    onSelect={(date) => setRescheduleData((p) => ({ ...p, date: toDateString(date) }))}
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
            <div>
              <label className="text-sm font-medium mb-1.5 block">New Time</label>
              <Input
                type="time"
                value={rescheduleData.time}
                onChange={(e) => setRescheduleData(p => ({ ...p, time: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsRescheduleDialogOpen(false)}
              className="h-11 px-6 rounded-xl border-border/50 transition-all active:scale-95"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRescheduleSubmit}
              disabled={reschedulingAppointment || !rescheduleData.date || !rescheduleData.time}
              className="h-11 px-8 rounded-xl font-semibold shadow-sm transition-all active:scale-95 bg-primary hover:bg-primary/90 text-white"
            >
              {reschedulingAppointment ? "Rescheduling..." : "Confirm Reschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Proposal Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Proposal</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting the proposed time slots.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-1.5 block">Reason</label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Only available in evenings"
              className="mt-2 rounded-xl"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsRejectDialogOpen(false)}
              className="h-11 px-6 rounded-xl border-border/50 transition-all active:scale-95"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectProposal}
              disabled={!rejectReason || rejectingProposal}
              className="h-11 px-8 rounded-xl font-semibold shadow-sm transition-all active:scale-95"
            >
              {rejectingProposal ? "Rejecting..." : "Reject Proposal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </CardContent>
    </Card>
  );
}
