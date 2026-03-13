"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
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

import { useToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { useAuth } from "@/hooks/auth/useAuth";
import { useWebSocketStatus } from "@/app/providers/WebSocketProvider";
import {
  useCancelAppointment,
  useMyAppointments,
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
} from "lucide-react";
import { format } from "date-fns";

type StatusFilter = "ALL" | "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  SCHEDULED:   { label: "Scheduled",   color: "text-blue-700 dark:text-blue-300",   dot: "bg-blue-500",   bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900" },
  CONFIRMED:   { label: "Confirmed",   color: "text-green-700 dark:text-green-300", dot: "bg-green-500", bg: "bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900" },
  IN_PROGRESS: { label: "In Progress", color: "text-purple-700 dark:text-purple-300",dot: "bg-purple-500",bg: "bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900" },
  COMPLETED:   { label: "Completed",   color: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400", bg: "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700" },
  CANCELLED:   { label: "Cancelled",   color: "text-red-700 dark:text-red-300",     dot: "bg-red-500",   bg: "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900" },
  NO_SHOW:     { label: "No Show",     color: "text-orange-700 dark:text-orange-300",dot: "bg-orange-400",bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900" },
};

export default function AppointmentManager() {
  const { toast } = useToast();
  const { session } = useAuth();
  const user = session?.user;
  const hasShownRealtimeToastRef = useRef(false);

  // Real-time WebSocket integration
  const { isConnected, isRealTimeEnabled } = useWebSocketStatus();

  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ date: "", time: "" });
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Data
  const { data: appointments, isPending: appointmentsLoading, isFetching: appointmentsFetching, refetch } = useMyAppointments({
    ...(dateFilter.start ? { date: dateFilter.start } : {}),
  });
  const appointmentData = appointments;
  const isAppointmentsLoading = appointmentsLoading;

  const { mutate: cancelAppointment, isPending: cancellingAppointment } = useCancelAppointment();
  const { mutate: rescheduleAppointment, isPending: reschedulingAppointment } = useRescheduleAppointment();
  const { mutate: rejectVideoProposal, isPending: rejectingProposal } = useRejectVideoProposal();
  const { mutate: processCheckIn, isPending: processingCheckIn } = useProcessCheckIn();

  // Derived list
  const fetchedAppointments = useMemo((): AppointmentWithRelations[] => {
    let list: AppointmentWithRelations[] = [];
    if (Array.isArray(appointmentData)) list = appointmentData;
    else if (Array.isArray((appointmentData as any)?.data?.appointments)) list = (appointmentData as any).data.appointments;
    else if (Array.isArray((appointmentData as any)?.appointments)) list = (appointmentData as any).appointments;
    else if (Array.isArray((appointmentData as any)?.data)) list = (appointmentData as any).data;
    return list;
  }, [appointmentData]);

  const allAppointments = fetchedAppointments;

  const filteredAppointments = useMemo(() => {
    const parseAppointmentDate = (value: string) => {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const startDate = dateFilter.start ? parseAppointmentDate(`${dateFilter.start}T00:00:00`) : null;
    const endDate = dateFilter.end ? parseAppointmentDate(`${dateFilter.end}T23:59:59.999`) : null;

    return allAppointments.filter(apt => {
      const matchesStatus = statusFilter === "ALL" || apt.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        apt.doctor?.user?.firstName?.toLowerCase().includes(q) ||
        apt.doctor?.user?.lastName?.toLowerCase().includes(q) ||
        apt.location?.name?.toLowerCase().includes(q) ||
        apt.status?.toLowerCase().includes(q);
      const appointmentDate = parseAppointmentDate(`${apt.date}T${apt.time || '00:00'}:00`);
      const matchesStartDate = !startDate || (appointmentDate !== null && appointmentDate >= startDate);
      const matchesEndDate = !endDate || (appointmentDate !== null && appointmentDate <= endDate);
      return matchesStatus && matchesSearch && matchesStartDate && matchesEndDate;
    });
  }, [allAppointments, statusFilter, searchQuery, dateFilter.start, dateFilter.end]);

  // Stats
  const stats = useMemo(() => {
    const total = allAppointments.length;
    const upcoming = allAppointments.filter(a => ["SCHEDULED", "CONFIRMED"].includes(a.status)).length;
    const completed = allAppointments.filter(a => a.status === "COMPLETED").length;
    const inProgress = allAppointments.filter(a => a.status === "IN_PROGRESS").length;
    return { total, upcoming, completed, inProgress };
  }, [allAppointments]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
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
    return parsed ? format(parsed, "PPP") : placeholder;
  };

  const toDateString = (date?: Date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };


  const handleCancelAppointment = useCallback((id: string) => {
    cancelAppointment({ id }, {
      onSuccess: () => toast({ title: "Appointment Cancelled", description: "Your appointment has been cancelled.", id: TOAST_IDS.APPOINTMENT.DELETE }),
      onError: (error: Error) => toast({ title: "Error", description: sanitizeErrorMessage(error) || "Failed to cancel", variant: "destructive", id: TOAST_IDS.APPOINTMENT.DELETE }),
    });
  }, [cancelAppointment, toast]);

  const handleRescheduleSubmit = () => {
    if (!selectedAppointment) return;
    rescheduleAppointment({ id: selectedAppointment.id, data: { date: rescheduleData.date, time: rescheduleData.time } }, {
      onSuccess: () => {
        toast({ title: "Rescheduled", description: "Your appointment has been rescheduled." });
        setIsRescheduleDialogOpen(false);
      },
      onError: (error: Error) => toast({ title: "Error", description: sanitizeErrorMessage(error) || "Failed to reschedule", variant: "destructive" }),
    });
  };

  const handleRejectProposal = () => {
    if (!selectedAppointment) return;
    rejectVideoProposal({ id: selectedAppointment.id, reason: rejectReason }, {
      onSuccess: () => {
        toast({ title: "Proposal Rejected" });
        setIsRejectDialogOpen(false);
        setRejectReason("");
        setSelectedAppointment(null);
      },
      onError: (error: Error) => toast({ title: "Error", description: sanitizeErrorMessage(error) || "Failed to reject", variant: "destructive" }),
    });
  };

  useEffect(() => {
    if (isRealTimeEnabled && isConnected && !hasShownRealtimeToastRef.current) {
      hasShownRealtimeToastRef.current = true;
      toast({ title: "Live Updates Active", description: "Appointments update in real-time", duration: 2000 });
    }

    if (!isConnected) {
      hasShownRealtimeToastRef.current = false;
    }
  }, [isRealTimeEnabled, isConnected, toast]);

  const StatCard = ({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) => (
    <div className={`rounded-2xl border p-4 flex items-center gap-3 ${color}`}>
      <div className="rounded-xl bg-background/80 p-2.5 shadow-sm ring-1 ring-border/50">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );

  const AppointmentCard = ({ apt }: { apt: AppointmentWithRelations }) => {
    const cfg = (STATUS_CONFIG[apt.status] ?? STATUS_CONFIG["SCHEDULED"]) as { label: string; color: string; dot: string; bg: string };
    const isExpanded = expandedCard === apt.id;
    const doctorName = `${apt.doctor?.user?.firstName || ""} ${apt.doctor?.user?.lastName || ""}`.trim() || "Unknown Doctor";

    return (
      <div className={`rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-md ${isExpanded ? "shadow-md" : ""} ${cfg.bg}`}>
        {/* Card header */}
        <div
          className="p-4 cursor-pointer"
          onClick={() => {
            setExpandedCard(isExpanded ? null : apt.id);
            setSelectedAppointment(isExpanded ? null : apt as AppointmentWithRelations);
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center shrink-0 text-sm font-bold">
                {doctorName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{doctorName}</p>
                <p className="text-xs opacity-60 truncate">{apt.location?.name || "—"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              {/* Status badge */}
              <span className={`inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-background/80 px-2.5 py-1 text-xs font-semibold shadow-sm dark:border-white/10 ${cfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
              {/* Type icon */}
              {apt.type === "VIDEO_CALL" && <Video className="w-4 h-4 opacity-60" />}
              <ChevronDown className={`w-4 h-4 opacity-40 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            </div>
          </div>

          {/* Date/time row */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs opacity-70">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(apt.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(apt.time)}
            </span>
            {apt.duration && (
              <span className="flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5" />
                {apt.duration} min
              </span>
            )}
          </div>
        </div>

        {/* Expanded body */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-white/30 dark:border-black/20 mt-0">
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
                    <p className="font-medium">{apt.type.replace(/_/g, " ")}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {apt.status === "SCHEDULED" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 flex-1 border-border/60 bg-background/80 text-xs"
                      onClick={() => {
                        setSelectedAppointment(apt as AppointmentWithRelations);
                        setRescheduleData({ date: apt.date, time: apt.time });
                        setIsRescheduleDialogOpen(true);
                      }}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Reschedule
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 flex-1 border-border/60 bg-background/80 text-xs text-red-600 hover:text-red-700 dark:text-red-300 dark:hover:text-red-200"
                      onClick={() => handleCancelAppointment(apt.id)}
                      disabled={cancellingAppointment}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Cancel
                    </Button>
                  </>
                )}
                {apt.status === "SCHEDULED" && apt.type !== "VIDEO_CALL" && (
                  <>
                    <Button
                      size="sm"
                      className="flex-1 text-xs h-8 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        window.location.href = "/patient/check-in";
                      }}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Go To Check-In
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 border-border/60 bg-background/80 text-xs text-red-600 dark:text-red-300"
                      onClick={() => handleCancelAppointment(apt.id)}
                      disabled={cancellingAppointment}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Cancel
                    </Button>
                  </>
                )}
                {apt.type === "VIDEO_CALL" && apt.status === "CONFIRMED" && (
                  <Button
                    size="sm"
                    className="flex-1 text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => window.location.href = `/patient/video?appointmentId=${apt.id}`}
                  >
                    <Video className="w-3.5 h-3.5 mr-1" />
                    Join Video
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
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            My Appointments
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your healthcare visits and schedules
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          {isRealTimeEnabled && (
            <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${isConnected ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-amber-500"}`} />
              {isConnected ? "Live" : "Connecting..."}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="w-full gap-1.5 sm:w-auto"
            disabled={appointmentsFetching}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${appointmentsFetching ? "animate-spin" : ""}`} />
            {appointmentsFetching ? "Refreshing..." : "Refresh"}
          </Button>
          <BookAppointmentDialog
            trigger={
              <Button size="sm" className="w-full gap-1.5 sm:w-auto">
                <CalendarPlus className="w-4 h-4" />
                Book Appointment
              </Button>
            }
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} icon={<Stethoscope className="w-5 h-5 text-blue-600" />} color="border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20" />
        <StatCard label="Upcoming" value={stats.upcoming} icon={<Calendar className="w-5 h-5 text-green-600" />} color="border-green-100 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20" />
        <StatCard label="In Progress" value={stats.inProgress} icon={<Zap className="w-5 h-5 text-purple-600" />} color="border-purple-100 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20" />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle className="w-5 h-5 text-slate-600" />} color="border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20" />
      </div>

      {/* Filters row */}
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doctor, location..."
            className="pl-9 h-9"
          />
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {(["ALL", "SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as StatusFilter[]).map(s => {
            const cfg = s === "ALL" ? null : STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {s === "ALL" ? "All" : cfg?.label}
              </button>
            );
          })}
        </div>

        {/* Date range */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 w-full justify-start text-left text-xs font-normal sm:w-44",
                  !dateFilter.start && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
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
                  "h-9 w-full justify-start text-left text-xs font-normal sm:w-44",
                  !dateFilter.end && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
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
          {(dateFilter.start || dateFilter.end) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateFilter({ start: "", end: "" })}
              className="h-9 px-2 text-xs sm:self-auto"
            >
              Clear
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
          <p className="text-xs text-muted-foreground font-medium">
            Showing {filteredAppointments.length} of {allAppointments.length} appointments
          </p>
          {filteredAppointments.map((apt) => (
            <AppointmentCard key={apt.id} apt={apt} />
          ))}
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRescheduleDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleRescheduleSubmit}
              disabled={reschedulingAppointment || !rescheduleData.date || !rescheduleData.time}
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
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleRejectProposal}
              disabled={!rejectReason || rejectingProposal}
            >
              {rejectingProposal ? "Rejecting..." : "Reject Proposal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
