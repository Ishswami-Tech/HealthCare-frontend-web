"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import { useAppointments, useStartAppointment, useCompleteAppointment } from "@/hooks/query/useAppointments";
import { AppointmentWithRelations, AppointmentStatus } from "@/types/appointment.types";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import {
  getAppointmentDateTimeValue,
  getAppointmentPaymentStatus,
  getAppointmentPatientName,
  getDisplayAppointmentDuration,
  isAppointmentAwaitingPayment,
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
  proposedSlots?: { date: string; time: string }[];
  confirmedSlotIndex?: number | null;
}

const isAwaitingDoctorVideoConfirmation = (appointment: {
  status?: string;
  type?: string;
  proposedSlots?: Array<{ date: string; time: string }>;
  confirmedSlotIndex?: number | null;
}) => {
  const status = String(appointment.status || "").toUpperCase();
  if (status === "AWAITING_SLOT_CONFIRMATION") return true;
  if (String(appointment.type || "").toUpperCase() !== "VIDEO_CALL") return false;

  const hasProposedSlots = Array.isArray(appointment.proposedSlots) && appointment.proposedSlots.length > 0;
  const hasConfirmedSlot =
    appointment.confirmedSlotIndex !== null &&
    appointment.confirmedSlotIndex !== undefined &&
    !Number.isNaN(Number(appointment.confirmedSlotIndex));

  return status === "SCHEDULED" && hasProposedSlots && !hasConfirmedSlot;
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

export default function DoctorDashboard() {
  const router = useRouter();
  const { session } = useAuth();
  const user = session?.user;
  const clinicId = user?.clinicId;

  const [searchTerm, setSearchTerm] = useState("");
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [activePatient, setActivePatient] = useState<{ id: string; name: string } | null>(null);
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  // Fetch real data using existing hooks and server actions
  const { data: appointments, isPending: isAppointmentsPending, error: appointmentsError } = useAppointments({
    ...(clinicId ? { clinicId } : {}),
    ...(user?.id ? { doctorId: user.id } : {}),
    limit: 100,
  });
  
  const startAppointmentMutation = useStartAppointment();
  const completeAppointmentMutation = useCompleteAppointment();

  // Calculate real stats from fetched data
  const appointmentsArray = useMemo(() => {
    if (Array.isArray(appointments)) return appointments;
    return (appointments as any)?.appointments || [];
  }, [appointments]);

  // Today's appointments from real data (sorted by time)
  const todaysAppointments = useMemo(() => {
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    return appointmentsArray
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
          displayStatus = "SCHEDULED (AWAITING DOCTOR CONFIRMATION)";
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
          proposedSlots: (apt as any).proposedSlots,
          confirmedSlotIndex: (apt as any).confirmedSlotIndex,
        };
      });
  }, [appointmentsArray]);

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
          (apt.statusEnum === "CONFIRMED" || apt.statusEnum === "IN_PROGRESS") &&
          (!apt.isVideo || apt.statusEnum === "IN_PROGRESS" || !apt.paymentPending)
      ),
    [filteredAppointments]
  );

  const stats = useMemo(() => {
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const todayApts = appointmentsArray.filter((apt: AppointmentWithRelations) => {
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
      checkedInPatients: todayApts.filter((apt: AppointmentWithRelations) => apt.status === "CONFIRMED").length,
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
  }, [appointmentsArray, todaysAppointments]);

  const openPrescription = (apt: TransformedAppointment) => {
    setActivePatient({ id: apt.patientId, name: apt.patientName });
    setActiveAppointmentId(apt.id);
    setIsPrescriptionModalOpen(true);
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
                  Payment {row.original.paymentStatus.replace(/_/g, " ")}
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
            {appointment.statusEnum === "CONFIRMED" && (
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
                title={!paymentReady ? "Video appointment is waiting for patient payment" : undefined}
              >
                {startAppointmentMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3 fill-current" />
                )}
                Start
              </Button>
            )}
            {appointment.statusEnum === "CONFIRMED" && appointment.isVideo && appointment.paymentPending && (
              <Badge
                variant="outline"
                className="h-8 rounded-md border-amber-200 bg-amber-50 px-2 text-[10px] font-semibold uppercase tracking-wider text-amber-700"
              >
                Awaiting Payment
              </Badge>
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
        title={`Welcome, Dr. ${user?.name?.split(" ")[0] || "Doctor"}`}
        description={`Today is ${new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}. Manage appointments, video visits, and clinical prescriptions from one workspace.`}
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

      <Card className="border-l-4 border-l-emerald-400 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600">
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Next Appointment
              </div>
              {stats.nextAppointment ? (
                <>
                  <div className="truncate text-lg font-bold tracking-tight text-foreground">
                    {stats.nextAppointment.patientName}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {stats.nextAppointment.time || "Time TBD"} · {stats.nextAppointment.type}
                  </div>
                </>
              ) : (
                <div className="text-sm font-medium text-muted-foreground">
                  No upcoming appointment for today
                </div>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full rounded-xl border-emerald-200 bg-emerald-50 font-semibold text-emerald-700 hover:bg-emerald-100 sm:w-auto"
            onClick={() => router.push("/doctor/appointments")}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Open Appointment Manager
          </Button>
        </CardContent>
      </Card>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-5">
        <Card className="border-l-4 border-l-blue-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100/80 flex items-center justify-center text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold tracking-tight text-foreground">{stats.todayAppointments}</h3>
              <p className="text-sm font-medium text-muted-foreground">Scheduled Today</p>
            </div>
            <div className="mt-4 text-xs font-medium text-blue-700 bg-blue-50 py-1.5 px-3 rounded-md inline-block">
              {stats.checkedInPatients} Confirmed & Waiting
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 flex items-center justify-center text-emerald-600">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold tracking-tight text-foreground">{stats.completedToday}</h3>
              <p className="text-sm font-medium text-muted-foreground">Consultations Finished</p>
            </div>
            <div className="mt-4 w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: stats.todayAppointments > 0 ? `${(stats.completedToday / stats.todayAppointments) * 100}%` : '0%' }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100/80 flex items-center justify-center text-indigo-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold tracking-tight text-foreground">{stats.totalPatients}</h3>
              <p className="text-sm font-medium text-muted-foreground">Unique Patients</p>
            </div>
            <div className="mt-4 text-xs font-medium text-indigo-700 bg-indigo-50 py-1.5 px-3 rounded-md inline-block">
              Across lifetime records
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100/80 flex items-center justify-center text-amber-600">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold tracking-tight text-foreground">{stats.awaitingPayments}</h3>
              <p className="text-sm font-medium text-muted-foreground">Video Payments Pending</p>
            </div>
            <div className="mt-4 text-xs font-medium text-amber-700 bg-amber-50 py-1.5 px-3 rounded-md inline-block">
              Start is unlocked after payment confirmation
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-sm transition-shadow duration-300 hover:shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Stethoscope className="w-24 h-24" />
          </div>
          <CardContent className="p-6 relative z-10 h-full flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="font-semibold text-emerald-50 text-lg">Quick Access</h3>
              <p className="text-sm text-emerald-100/80 leading-relaxed">Need to access full patient history or jump into a video call? Access your tools quickly below.</p>
            </div>
            <div className="flex gap-2 mt-6">
              <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-0 flex-1" onClick={() => router.push("/doctor/video")}>
                <Video className="w-4 h-4 mr-2" />
                Video
              </Button>
              <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-0 flex-1" onClick={() => router.push("/doctor/patients")}>
                <Users className="w-4 h-4 mr-2" />
                Directory
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

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
                className="w-full justify-start h-12 border-border text-muted-foreground hover:bg-muted hover:text-foreground group"
                onClick={() => router.push("/doctor/appointments")}
              >
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center mr-3 transition-colors group-hover:bg-muted/80">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                Master Calendar
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12 border-border text-muted-foreground hover:bg-muted hover:text-foreground group"
                onClick={() => router.push("/doctor/patients")}
              >
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center mr-3 transition-colors group-hover:bg-muted/80">
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
                Patient Directory
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
                Doctors only record diagnosis and prescribed medicines here. Video consultations wait for patient payment confirmation, while medicine payment, packing, and dispatch are handled by the medicine desk.
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
