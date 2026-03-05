"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
import {
  useWebSocketIntegration,
} from "@/hooks/realtime/useWebSocketIntegration";
import {
  useRealTimeAppointments,
} from "@/hooks/realtime/useRealTimeQueries";
import { useAppointmentsStore } from "@/stores";
import {
  useAppointments,
  useCancelAppointment,
  useProcessCheckIn,
  useRescheduleAppointment,
  useRejectVideoProposal,
} from "@/hooks/query/useAppointments";
import {
  AppointmentWithRelations,
} from "@/types/appointment.types";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
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

type StatusFilter = "ALL" | "SCHEDULED" | "CONFIRMED" | "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  SCHEDULED:   { label: "Scheduled",   color: "text-blue-700 dark:text-blue-300",   dot: "bg-blue-500",   bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900" },
  CONFIRMED:   { label: "Confirmed",   color: "text-green-700 dark:text-green-300", dot: "bg-green-500", bg: "bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900" },
  CHECKED_IN:  { label: "Checked In",  color: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900" },
  IN_PROGRESS: { label: "In Progress", color: "text-purple-700 dark:text-purple-300",dot: "bg-purple-500",bg: "bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900" },
  COMPLETED:   { label: "Completed",   color: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400", bg: "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700" },
  CANCELLED:   { label: "Cancelled",   color: "text-red-700 dark:text-red-300",     dot: "bg-red-500",   bg: "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900" },
  NO_SHOW:     { label: "No Show",     color: "text-orange-700 dark:text-orange-300",dot: "bg-orange-400",bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900" },
};

export default function AppointmentManager() {
  const { toast } = useToast();
  const { session } = useAuth();
  const user = session?.user;

  // Real-time WebSocket integration
  const { isConnected, isReady: isRealTimeEnabled } = useWebSocketIntegration({
    subscribeToAppointments: true,
    autoConnect: true,
  });

  const { data: realTimeAppointments } = useRealTimeAppointments();
  const { setSelectedAppointment: setStoreSelectedAppointment } = useAppointmentsStore();

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
  const { data: appointments, isPending: appointmentsLoading, refetch } = useAppointments({
    ...(dateFilter.start ? { startDate: dateFilter.start } : {}),
    ...(dateFilter.end ? { endDate: dateFilter.end } : {}),
  });
  const appointmentData = realTimeAppointments?.success ? realTimeAppointments : appointments;
  const isAppointmentsLoading = isRealTimeEnabled ? false : appointmentsLoading;

  const { mutate: cancelAppointment, isPending: cancellingAppointment } = useCancelAppointment();
  const { mutate: rescheduleAppointment, isPending: reschedulingAppointment } = useRescheduleAppointment();
  const { mutate: rejectVideoProposal, isPending: rejectingProposal } = useRejectVideoProposal();
  const { mutate: processCheckIn, isPending: processingCheckIn } = useProcessCheckIn();

  // Derived list
  const allAppointments = useMemo((): AppointmentWithRelations[] => {
    let list: AppointmentWithRelations[] = [];
    if (Array.isArray(appointmentData)) list = appointmentData;
    else if (Array.isArray((appointmentData as any)?.data?.appointments)) list = (appointmentData as any).data.appointments;
    else if (Array.isArray((appointmentData as any)?.data)) list = (appointmentData as any).data;
    else if (Array.isArray((appointmentData as any)?.appointments)) list = (appointmentData as any).appointments;
    return list;
  }, [appointmentData]);

  const filteredAppointments = useMemo(() => {
    return allAppointments.filter(apt => {
      const matchesStatus = statusFilter === "ALL" || apt.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        apt.doctor?.user?.firstName?.toLowerCase().includes(q) ||
        apt.doctor?.user?.lastName?.toLowerCase().includes(q) ||
        apt.location?.name?.toLowerCase().includes(q) ||
        apt.status?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [allAppointments, statusFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = allAppointments.length;
    const upcoming = allAppointments.filter(a => ["SCHEDULED", "CONFIRMED", "CHECKED_IN"].includes(a.status)).length;
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
    if (isRealTimeEnabled && isConnected) {
      toast({ title: "Live Updates Active", description: "Appointments update in real-time", duration: 2000 });
    }
  }, [isRealTimeEnabled, isConnected, toast]);

  const StatCard = ({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) => (
    <div className={`rounded-2xl border p-4 flex items-center gap-3 ${color}`}>
      <div className="p-2.5 rounded-xl bg-white/60 dark:bg-black/20">{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs font-medium opacity-70">{label}</p>
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
            if (isRealTimeEnabled) setStoreSelectedAppointment(apt);
          }}
        >
          <div className="flex items-start justify-between gap-3">
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

            <div className="flex items-center gap-2 shrink-0">
              {/* Status badge */}
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/60 dark:bg-black/20 ${cfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
              {/* Type icon */}
              {apt.type === "VIDEO_CALL" && <Video className="w-4 h-4 opacity-60" />}
              <ChevronDown className={`w-4 h-4 opacity-40 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            </div>
          </div>

          {/* Date/time row */}
          <div className="flex items-center gap-4 mt-3 text-xs opacity-70">
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
                  <div className="col-span-2 p-2.5 bg-white/40 dark:bg-black/10 rounded-lg">
                    <p className="font-semibold mb-0.5 opacity-60">Chief Complaint</p>
                    <p className="font-medium">{(apt as any).chiefComplaint}</p>
                  </div>
                )}
                {(apt as any).urgency && (
                  <div className="p-2.5 bg-white/40 dark:bg-black/10 rounded-lg">
                    <p className="font-semibold mb-0.5 opacity-60">Urgency</p>
                    <p className="font-medium capitalize">{(apt as any).urgency.toLowerCase()}</p>
                  </div>
                )}
                {apt.type && (
                  <div className="p-2.5 bg-white/40 dark:bg-black/10 rounded-lg">
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
                      className="flex-1 text-xs h-8 bg-white/50 dark:bg-black/10 border-white/60"
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
                      className="flex-1 text-xs h-8 bg-white/50 dark:bg-black/10 border-white/60 text-red-600 hover:text-red-700"
                      onClick={() => handleCancelAppointment(apt.id)}
                      disabled={cancellingAppointment}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Cancel
                    </Button>
                  </>
                )}
                {apt.status === "CONFIRMED" && (
                  <>
                    <Button
                      size="sm"
                      className="flex-1 text-xs h-8 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => processCheckIn({ appointmentId: apt.id, patientId: user?.id || "" }, {
                        onSuccess: () => toast({ title: "Checked In!", description: "You have successfully checked in." }),
                      })}
                      disabled={processingCheckIn}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Check In
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 bg-white/50 dark:bg-black/10 border-white/60 text-red-600"
                      onClick={() => handleCancelAppointment(apt.id)}
                      disabled={cancellingAppointment}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Cancel
                    </Button>
                  </>
                )}
                {apt.type === "VIDEO_CALL" && ["CONFIRMED", "CHECKED_IN"].includes(apt.status) && (
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            My Appointments
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your healthcare visits and schedules
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isRealTimeEnabled && (
            <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${isConnected ? "text-green-600 bg-green-50 border-green-200" : "text-amber-600 bg-amber-50 border-amber-200"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-amber-500"}`} />
              {isConnected ? "Live" : "Connecting..."}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <BookAppointmentDialog
            trigger={
              <Button size="sm" className="gap-1.5">
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
      <div className="flex flex-col md:flex-row gap-3">
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
        <div className="flex gap-1 overflow-x-auto shrink-0">
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
        <div className="flex gap-2 shrink-0">
          <Input
            type="date"
            value={dateFilter.start}
            onChange={(e) => setDateFilter(p => ({ ...p, start: e.target.value }))}
            className="h-9 w-36 text-xs"
            placeholder="From"
          />
          <Input
            type="date"
            value={dateFilter.end}
            onChange={(e) => setDateFilter(p => ({ ...p, end: e.target.value }))}
            className="h-9 w-36 text-xs"
            placeholder="To"
          />
          {(dateFilter.start || dateFilter.end) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateFilter({ start: "", end: "" })}
              className="h-9 px-2 text-xs"
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
              <Input
                type="date"
                value={rescheduleData.date}
                onChange={(e) => setRescheduleData(p => ({ ...p, date: e.target.value }))}
                min={new Date().toISOString().split("T")[0]}
              />
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
