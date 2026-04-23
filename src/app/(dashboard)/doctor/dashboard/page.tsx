"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import { useAppointments, useConfirmVideoSlot, useStartAppointment, useCompleteAppointment } from "@/hooks/query/useAppointments";
import { AppointmentWithRelations, AppointmentStatus } from "@/types/appointment.types";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import {
  getAppointmentDateTimeValue,
  getAppointmentPaymentStatus,
  getAppointmentPatientName,
  getDisplayAppointmentDuration,
  isAppointmentAwaitingPayment,
  isVideoAppointmentPaymentCompleted,
} from "@/lib/utils/appointmentUtils";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { theme } from "@/lib/utils/theme-utils";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";

import {
  Activity,
  Calendar,
  Users,
  Clock,
  Stethoscope,
  Play,
  CheckCircle,
  AlertCircle,
  FileText,
  Video,
  Loader2,
  Search,
  Pill,
} from "lucide-react";
import { QuickPrescriptionModal } from "@/components/doctor/QuickPrescriptionModal";

// Interface for the transformed appointment object
interface TransformedAppointment {
  id: string;
  patientName: string;
  time: string;
  status: string;
  statusEnum: AppointmentStatus;
  type: string;
  duration: string;
  notes: string;
  isVideo: boolean;
  priority: string;
  patientId: string;
  paymentStatus: string;
  paymentPending: boolean;
  checkedInAt: string | null;
  proposedSlots?: { date: string; time: string }[];
  confirmedSlotIndex?: number | null;
}

const isAwaitingDoctorVideoConfirmation = (appointment: {
  status?: string;
  type?: string;
  proposedSlots?: Array<{ date: string; time: string }>;
  confirmedSlotIndex?: number | null;
}) => {
  if (String(appointment.type || "").toUpperCase() !== "VIDEO_CALL") return false;
  if (!isVideoAppointmentPaymentCompleted(appointment)) return false;

  const hasProposedSlots = Array.isArray(appointment.proposedSlots) && appointment.proposedSlots.length > 0;
  const hasConfirmedSlot =
    appointment.confirmedSlotIndex !== null &&
    appointment.confirmedSlotIndex !== undefined &&
    !Number.isNaN(Number(appointment.confirmedSlotIndex));

  return String(appointment.status || "").toUpperCase() === "SCHEDULED" && hasProposedSlots && !hasConfirmedSlot;
};

const getPaymentBadgeClasses = (paymentStatus: string) => {
  switch (paymentStatus) {
    case "PAID":
      return "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300";
    case "PENDING":
    case "OVERDUE":
      return "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300";
    case "FAILED":
    case "VOID":
    case "UNCOLLECTIBLE":
      return "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300";
    default:
      return "bg-muted border-border text-muted-foreground";
  }
};

const getDisplayDoctorName = (name?: string | null) => {
  const cleaned = String(name || "")
    .replace(/^dr\.?\s+/i, "")
    .trim();

  return cleaned || "Doctor";
};

export default function DoctorDashboard() {
  const router = useRouter();
  const { session } = useAuth();
  const user = session?.user;
  const displayDoctorName = useMemo(
    () => getDisplayDoctorName(user?.name || user?.firstName || null),
    [user?.firstName, user?.name]
  );
  const clinicId = useCurrentClinicId();
  const doctorId = user?.id;

  const [searchTerm, setSearchTerm] = useState("");
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [activePatient, setActivePatient] = useState<{ id: string; name: string } | null>(null);
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);
  const [pendingVideoSlotSelections, setPendingVideoSlotSelections] = useState<Record<string, number>>({});

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  // Fetch real data using existing hooks and server actions
  const { data: appointments, isPending: isAppointmentsPending, error: appointmentsError } = useAppointments({
    ...(clinicId ? { clinicId } : {}),
    ...(doctorId ? { doctorId } : {}),
    limit: 100,
  });
  
  const startAppointmentMutation = useStartAppointment();
  const completeAppointmentMutation = useCompleteAppointment();
  const confirmVideoSlotMutation = useConfirmVideoSlot();

  // Calculate real stats from fetched data
  const appointmentsArray = useMemo(() => {
    if (Array.isArray(appointments)) return appointments;
    return (appointments as any)?.appointments || [];
  }, [appointments]);

  const visibleAppointmentsArray = useMemo(
    () =>
      appointmentsArray.filter(
        (appointment: AppointmentWithRelations) =>
          String(appointment.type).toUpperCase() !== "VIDEO_CALL" ||
          isVideoAppointmentPaymentCompleted(appointment)
      ),
    [appointmentsArray]
  );

  const awaitingSlotReviewAppointments = useMemo(
    () =>
      visibleAppointmentsArray.filter((appointment: AppointmentWithRelations) =>
        isAwaitingDoctorVideoConfirmation(appointment as any)
      ),
    [visibleAppointmentsArray]
  );

  // Today's appointments from real data (sorted by time)
  const todaysAppointments = useMemo(() => {
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    return visibleAppointmentsArray
      .filter((apt: AppointmentWithRelations) => {
        const dateTime = getAppointmentDateTimeValue(apt);
        const aptDate =
          (dateTime
            ? dateTime.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
            : "") ||
          apt.date ||
          (apt as unknown as Record<string, unknown>).appointmentDate?.toString().split("T")?.[0] ||
          "";
        return aptDate === todayStr;
      })
      .sort(
        (a: AppointmentWithRelations, b: AppointmentWithRelations) =>
          (getAppointmentDateTimeValue(a)?.getTime() ?? 0) - (getAppointmentDateTimeValue(b)?.getTime() ?? 0)
      )
      .map((apt: AppointmentWithRelations): TransformedAppointment => {
        const patientName = getAppointmentPatientName(apt);
        const displayDuration = getDisplayAppointmentDuration(apt);
        const paymentStatus = getAppointmentPaymentStatus(apt);
        
        let displayStatus = apt.status as string;
        if (isAwaitingDoctorVideoConfirmation(apt as any)) {
          displayStatus = "SCHEDULED (AWAITING SLOT CONFIRMATION)";
        }
        else if (apt.status === "IN_PROGRESS") displayStatus = "IN PROGRESS";

        return {
          id: apt.id,
          patientName,
          patientId: apt.patientId,
          time:
            apt.time ||
            (getAppointmentDateTimeValue(apt)?.toLocaleTimeString("en-IN", {
              timeZone: "Asia/Kolkata",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }) ?? ""),
          status: displayStatus.replace(/_/g, " "),
          statusEnum: apt.status,
          type: apt.type || "Consultation",
          duration: `${displayDuration || 30} min`,
          notes: apt.notes || "",
          isVideo: apt.type === "VIDEO_CALL",
          priority: (apt as any).priority || "NORMAL",
          paymentStatus,
          paymentPending: isAppointmentAwaitingPayment(apt),
          checkedInAt: apt.checkedInAt ? new Date(apt.checkedInAt).toISOString() : null,
          proposedSlots: (apt as any).proposedSlots,
          confirmedSlotIndex: (apt as any).confirmedSlotIndex,
        };
      });
  }, [visibleAppointmentsArray]);

  const filteredAppointments = useMemo(() => {
    return todaysAppointments.filter((apt: TransformedAppointment) => 
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [todaysAppointments, searchTerm]);

  const activeTreatmentQueue = useMemo(
    () =>
      filteredAppointments.filter(
        (apt: TransformedAppointment) =>
          ((apt.statusEnum === "CONFIRMED" && !!apt.checkedInAt) || apt.statusEnum === "IN_PROGRESS") &&
          (!apt.isVideo || apt.statusEnum === "IN_PROGRESS" || !apt.paymentPending)
      ),
    [filteredAppointments]
  );

  const stats = useMemo(() => {
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const todayApts = visibleAppointmentsArray.filter((apt: AppointmentWithRelations) => {
      const dateTime = getAppointmentDateTimeValue(apt);
      const aptDate =
        (dateTime
          ? dateTime.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
          : "") ||
        apt.date ||
        (apt as unknown as Record<string, unknown>).appointmentDate?.toString().split("T")?.[0] ||
        "";
      return aptDate === todayStr;
    });

    return {
      todayAppointments: todayApts.length,
      checkedInPatients: todayApts.filter((apt: AppointmentWithRelations) => Boolean((apt as any).checkedInAt)).length,
      completedToday: todayApts.filter((apt: AppointmentWithRelations) => apt.status === "COMPLETED").length,
      totalPatients: new Set(appointmentsArray.map((apt: AppointmentWithRelations) => apt.patientId)).size,
      awaitingPayments: todayApts.filter(
        (apt: AppointmentWithRelations) =>
          String(apt.type).toUpperCase() === "VIDEO_CALL" && isAppointmentAwaitingPayment(apt)
      ).length,
      nextAppointment: todaysAppointments.find(
        (a: TransformedAppointment) =>
          a.statusEnum === "SCHEDULED" ||
          a.statusEnum === "CONFIRMED" ||
          a.statusEnum === "IN_PROGRESS" ||
          isAwaitingDoctorVideoConfirmation(a)
      ),
    };
  }, [todaysAppointments, visibleAppointmentsArray]);

  const openPrescription = (apt: TransformedAppointment) => {
    setActivePatient({ id: apt.patientId, name: apt.patientName });
    setActiveAppointmentId(apt.id);
    setIsPrescriptionModalOpen(true);
  };

  const formatProposedSlot = (slot?: { date: string; time: string }) => {
    if (!slot) return "Slot";
    const dateLabel = slot.date
      ? new Date(`${slot.date}T00:00:00`).toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "short",
        })
      : "";
    return `${dateLabel ? `${dateLabel} • ` : ""}${slot.time}`;
  };

  const columns: ColumnDef<TransformedAppointment>[] = [
    {
      accessorKey: "patientName",
      header: "Patient",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 ${row.original.isVideo ? 'bg-indigo-100/80 text-indigo-600' : 'bg-blue-100/80 text-blue-600'} rounded-full flex items-center justify-center shrink-0`}>
            {row.original.isVideo ? <Video className="w-4 h-4" /> : <Users className="w-4 h-4" />}
          </div>
          <div>
            <div className={`font-semibold leading-none mb-1 flex items-center gap-2 ${theme.textColors.heading}`}>
              {row.original.patientName}
              {row.original.priority === "URGENT" && (
                <Badge variant="destructive" className="h-4 px-1.5 text-[8px] animate-pulse ring-2 ring-destructive/20 font-black">
                  URGENT
                </Badge>
              )}
            </div>
            <div className={`text-xs ${theme.textColors.tertiary} flex items-center gap-1`}>
              {row.original.type} • {row.original.duration}
              {isAwaitingDoctorVideoConfirmation(row.original) && row.original.proposedSlots?.[0] && (
                <span className="text-amber-600 font-medium ml-1">
                  (Prop: {row.original.proposedSlots[0].time})
                </span>
              )}
            </div>
            {row.original.isVideo && (
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold uppercase tracking-wider ${getPaymentBadgeClasses(
                    row.original.paymentStatus
                  )}`}
                >
                  {row.original.paymentStatus === "PAID"
                    ? "Paid video request"
                    : "Payment pending"}
                </Badge>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "time",
      header: "Time",
      cell: ({ row }) => (
        <div className={`text-sm font-semibold tracking-tight ${theme.textColors.primary}`}>
          {row.original.time}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const stat = row.original.statusEnum;
        let colorClasses = "bg-muted border-border text-muted-foreground";
        if (stat === "IN_PROGRESS") colorClasses = "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300";
        else if (stat === "CONFIRMED") colorClasses = "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300";
        else if (stat === "COMPLETED") colorClasses = "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300";
        else if (isAwaitingDoctorVideoConfirmation(row.original)) colorClasses = "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300";
        
        return (
          <Badge variant="outline" className={`font-semibold text-[10px] uppercase tracking-wider ${colorClasses}`}>
            {row.original.status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const appointment = row.original;
        const paymentReady = !appointment.isVideo || !appointment.paymentPending;
        return (
          <div className="flex gap-2">
            {appointment.statusEnum === "CONFIRMED" && appointment.checkedInAt && (
              <Button
                size="sm"
                className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                disabled={startAppointmentMutation.isPending || !paymentReady}
                onClick={async () => {
                  await startAppointmentMutation.mutateAsync(appointment.id);
                  if (appointment.isVideo) {
                    router.push("/doctor/video");
                  }
                }}
                title={!paymentReady ? "Video request is waiting for payment" : undefined}
              >
                {startAppointmentMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3 fill-current" />
                )}
                Start
              </Button>
            )}
            {appointment.statusEnum === "CONFIRMED" && !appointment.checkedInAt && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-border bg-card text-muted-foreground shadow-sm"
                disabled
                title="Patient must be checked in before consultation can start"
              >
                <Play className="w-3 h-3 fill-current" />
                Waiting check-in
              </Button>
            )}
            {appointment.statusEnum === "CONFIRMED" && appointment.isVideo && appointment.paymentPending && (
              <Badge
                variant="outline"
                className="h-8 rounded-md border-amber-200 bg-amber-50 px-2 text-[10px] font-semibold uppercase tracking-wider text-amber-700"
              >
                Payment pending
              </Badge>
            )}
            {isAwaitingDoctorVideoConfirmation(appointment) && Array.isArray(appointment.proposedSlots) && appointment.proposedSlots.length > 0 && (
              <div className="flex items-center gap-2">
                <Select
                  value={String(pendingVideoSlotSelections[appointment.id] ?? 0)}
                  onValueChange={(value: string) =>
                    setPendingVideoSlotSelections((current) => ({
                      ...current,
                      [appointment.id]: Number(value),
                    }))
                  }
                >
                  <SelectTrigger className="h-8 w-[190px] rounded-md text-xs">
                    <SelectValue placeholder="Choose slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointment.proposedSlots.map((slot, index) => (
                      <SelectItem key={`${appointment.id}-${index}`} value={String(index)}>
                        {formatProposedSlot(slot)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                  disabled={confirmVideoSlotMutation.isPending}
                  onClick={() =>
                    confirmVideoSlotMutation.mutateAsync({
                      appointmentId: appointment.id,
                      confirmedSlotIndex: pendingVideoSlotSelections[appointment.id] ?? 0,
                    })
                  }
                >
                  {confirmVideoSlotMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3 h-3" />
                  )}
                  Confirm slot
                </Button>
              </div>
            )}
            {appointment.statusEnum === "IN_PROGRESS" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-sm"
                  onClick={() => openPrescription(appointment)}
                >
                  <Pill className="w-3 h-3" />
                  Prescribe
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-none"
                  disabled={completeAppointmentMutation.isPending}
                  onClick={() =>
                    completeAppointmentMutation.mutateAsync({
                      id: appointment.id,
                      data: {},
                    })
                  }
                >
                  {completeAppointmentMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3 h-3" />
                  )}
                  Complete
                </Button>
              </div>
            )}
            {appointment.statusEnum !== "IN_PROGRESS" && (
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 border-border bg-card text-muted-foreground shadow-sm hover:text-foreground"
                onClick={() => router.push(`/doctor/patients/${appointment.patientId}`)}
              >
                EHR
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (isAppointmentsPending && appointmentsArray.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
          <p className="text-emerald-700 font-medium">Loading your clinical workspace...</p>
        </div>
      </div>
    );
  }

  if (appointmentsError && appointmentsArray.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Workspace Connection Issue</h3>
        <p className="text-muted-foreground max-w-sm mb-6">We could not load your appointments. Please check your connection and try again.</p>
        <Button onClick={() => window.location.reload()} variant="outline">Refresh Workspace</Button>
      </div>
    );
  }

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Doctor Dashboard"
        title={`Welcome, Dr. ${displayDoctorName}`}
        description={`Today is ${new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}. Manage checked-in patients, video visits, and prescriptions from one workspace.`}
        meta={
          <Badge
            variant="outline"
            className="rounded-full border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"
          >
            <Activity className="mr-1 inline-block h-3 w-3" />
            Active Shift
          </Badge>
        }
        actions={[
          {
            label: "Video Visits",
            href: "/doctor/video",
            icon: <Video className="h-4 w-4" />,
          },
          {
            label: "Patient Directory",
            href: "/doctor/patients",
            icon: <Users className="h-4 w-4" />,
          },
        ]}
      />

      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
                <Clock className="h-4 w-4" />
                Live Workspace
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-muted-foreground">Next appointment</span>
                {stats.nextAppointment ? (
                  <span className="truncate text-sm font-semibold text-foreground">
                    {stats.nextAppointment.patientName} · {stats.nextAppointment.time || "Time TBD"} · {stats.nextAppointment.type}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">
                    No checked-in patient ready for consultation
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted-foreground">
              <span className="rounded-full border border-border bg-background px-2.5 py-1">Status-first workspace</span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-5">
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/10">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Today</div>
              <div className="mt-1 text-lg font-bold leading-none text-blue-900 dark:text-blue-100">{stats.todayAppointments}</div>
              <div className="mt-1 text-[11px] text-blue-700/80 dark:text-blue-200/80">Appointments</div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Waiting</div>
              <div className="mt-1 text-lg font-bold leading-none text-emerald-900 dark:text-emerald-100">{stats.checkedInPatients}</div>
              <div className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-200/80">Checked-in</div>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 shadow-sm dark:border-green-500/20 dark:bg-green-500/10">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-green-700 dark:text-green-300">Done</div>
              <div className="mt-1 text-lg font-bold leading-none text-green-900 dark:text-green-100">{stats.completedToday}</div>
              <div className="mt-1 text-[11px] text-green-700/80 dark:text-green-200/80">Consulted</div>
            </div>
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 shadow-sm dark:border-indigo-500/20 dark:bg-indigo-500/10">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Patients</div>
              <div className="mt-1 text-lg font-bold leading-none text-indigo-900 dark:text-indigo-100">{stats.totalPatients}</div>
              <div className="mt-1 text-[11px] text-indigo-700/80 dark:text-indigo-200/80">Lifetime</div>
            </div>
            <div className="col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 shadow-sm sm:col-span-4 xl:col-span-1 dark:border-amber-500/20 dark:bg-amber-500/10">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Video</div>
              <div className="mt-1 text-lg font-bold leading-none text-amber-900 dark:text-amber-100">{stats.awaitingPayments}</div>
              <div className="mt-1 text-[11px] text-amber-700/80 dark:text-amber-200/80">Payments pending</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-4">
        {/* Active Treatment Queue Table - Dominant Column */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="overflow-hidden border-l-4 border-l-emerald-400 shadow-sm">
            <CardHeader className="flex flex-col items-start justify-between gap-4 border-b border-border bg-muted/40 px-4 pb-4 pt-5 sm:flex-row sm:items-center sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                Active Clinical Queue
              </CardTitle>
              <div className="relative w-full sm:w-72 mt-4 sm:mt-0">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Find patient or type..."
                  className="pl-9 h-9 bg-background border-border transition-all focus:ring-emerald-500/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <DataTable
                columns={columns}
                data={activeTreatmentQueue}
                pageSize={10}
                emptyMessage="No active consultations in the queue right now."
              />
            </CardContent>
          </Card>

          {/* Scheduled Today Table */}
          <Card className="overflow-hidden border-l-4 border-l-blue-400 shadow-sm">
            <CardHeader className="border-b border-border bg-muted/40 pb-4 pt-5 px-6">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                Full Schedule List
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 opacity-90 transition-opacity hover:opacity-100 sm:p-4">
              <DataTable
                columns={columns}
                data={filteredAppointments}
                pageSize={10}
                emptyMessage="Your schedule is clear for today."
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
            {awaitingSlotReviewAppointments.length > 0 && (
              <Card className="overflow-hidden border-l-4 border-l-amber-400 shadow-sm">
                <div className="border-b border-border bg-amber-50/80 p-4 dark:bg-amber-950/20">
                  <h3 className="flex items-center gap-2 font-bold text-foreground">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Awaiting Slot Review
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Video bookings are paid and waiting for your confirmation of one proposed slot.
                  </p>
                </div>
                <CardContent className="space-y-3 p-4">
                  <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {awaitingSlotReviewAppointments.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {awaitingSlotReviewAppointments.length === 1
                      ? "Request awaiting your review"
                      : "Requests awaiting your review"}
                  </p>
                  <div className="space-y-2">
                    {awaitingSlotReviewAppointments.slice(0, 3).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="rounded-xl border border-amber-200 bg-white/90 px-3 py-2 text-sm shadow-sm dark:border-amber-900/40 dark:bg-card/80"
                      >
                        <div className="font-semibold text-foreground">
                          {getAppointmentPatientName(appointment)}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {getAppointmentDateTimeValue(appointment)
                            ? getAppointmentDateTimeValue(appointment)?.toLocaleDateString("en-IN", {
                                timeZone: "Asia/Kolkata",
                                day: "numeric",
                                month: "short",
                              })
                            : "Date TBD"}
                          {" · "}
                          {Array.isArray((appointment as any).proposedSlots)
                            ? `${(appointment as any).proposedSlots.length} proposed slots`
                            : "3 proposed slots"}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="overflow-hidden border-l-4 border-l-slate-400 shadow-sm">
              <div className="bg-muted/40 border-b border-border p-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Workspace Tools
                </h3>
              </div>
              <CardContent className="p-4 space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100 dark:hover:bg-emerald-500/20"
                  onClick={() => router.push("/doctor/appointments")}
                >
                  <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200 flex items-center justify-center mr-3 transition-colors">
                    <Calendar className="w-4 h-4" />
                  </div>
                  Master Calendar
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-100 dark:hover:bg-indigo-500/20"
                  onClick={() => router.push("/doctor/patients")}
                >
                  <div className="w-8 h-8 rounded bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200 flex items-center justify-center mr-3 transition-colors">
                    <Users className="w-4 h-4" />
                  </div>
                  Patient Directory
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100 dark:hover:bg-amber-500/20"
                  onClick={() => router.push("/doctor/video")}
                >
                  <div className="w-8 h-8 rounded bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200 flex items-center justify-center mr-3 transition-colors">
                    <Video className="w-4 h-4" />
                  </div>
                  Video Visits
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100 dark:hover:bg-blue-500/20"
                  onClick={() => router.push("/doctor/appointments")}
                >
                  <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200 flex items-center justify-center mr-3 transition-colors">
                    <Calendar className="w-4 h-4" />
                  </div>
                  Appointment Manager
                </Button>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-l-4 border-l-amber-400 bg-amber-50 shadow-sm dark:bg-amber-950/30">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100 rounded-bl-[100px] -z-0 dark:bg-amber-900/40" />
            <div className="p-5 relative z-10">
              <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-2 dark:text-amber-100">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                Clinical Notice
              </h3>
              <p className="text-sm text-amber-800/80 leading-relaxed dark:text-amber-100/80">
                Consultation starts only after the patient is checked in. Video visits stay locked until payment is confirmed, and medicine packing/dispatch are handled by the medicine desk after the prescription is saved.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <QuickPrescriptionModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        appointmentId={activeAppointmentId || ""}
        patientId={activePatient?.id || ""}
        patientName={activePatient?.name || ""}
        doctorId={user?.id || ""}
      />
    </DashboardPageShell>
  );
}
