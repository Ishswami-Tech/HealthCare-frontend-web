"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, Calendar, Loader2, QrCode, Search, Stethoscope, UserCheck, Eye, MoreHorizontal, UserMinus } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  getReceptionistAppointmentDateLabel,
  getReceptionistAppointmentTimeLabel,
  parseReceptionistAppointmentDateTime,
} from "@/lib/utils/appointmentUtils";

import AppointmentManager from "@/components/appointments/AppointmentManager";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/hooks/auth/useAuth";
import { useDoctors } from "@/hooks/query/useDoctors";
import { showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import {
  useAppointmentServices,
  useAppointments,
  useCheckInAppointment,
  useMarkAppointmentNoShow,
  useReassignAppointmentDoctor,
} from "@/hooks/query/useAppointments";
import { useActiveLocations, useClinicContext } from "@/hooks/query/useClinics";
import { useCallNextPatient as useQueueCallNextPatient } from "@/hooks/query/useQueue";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { getQueuePositionLabel, resolveQueueDisplayLabel } from "@/lib/queue/queue-adapter";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";

type ViewAppointment = {
  id: string;
  locationId?: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  primaryDoctorId?: string;
  assignedDoctorId?: string;
  doctorName: string;
  doctorRole?: string;
  dateLabel: string;
  timeLabel: string;
  status: string;
  paymentStatus: string;
  queuePosition: number | null;
  queueType: string;
  notes: string;
  cancellationReason?: string;
  waitLabel: string;
  isWalkIn: boolean;
  isDelegated: boolean;
  doctor?: any;
  sortAt: number;
};

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-300",
  CONFIRMED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  NO_SHOW: "bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-300",
  CANCELLED: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
};

function normalizeAppointment(
  app: any,
  serviceCatalogMap: Map<string, { label: string; serviceBucket: string; queueCategory: string }>
): ViewAppointment {
  const parsed = parseReceptionistAppointmentDateTime(app as unknown as Record<string, unknown>);
  const patientName =
    app.patientName ||
    app.patient?.name ||
    app.patient?.user?.name ||
    `${app.patient?.firstName || app.patient?.user?.firstName || ""} ${app.patient?.lastName || app.patient?.user?.lastName || ""}`.trim() ||
    "Unknown Patient";
  const patientPhone =
    app.patientPhone ||
    app.patient?.phone ||
    app.patient?.user?.phone ||
    "";
  const doctorName =
    app.doctorName ||
    app.doctor?.name ||
    app.doctor?.user?.name ||
    `${app.doctor?.firstName || app.doctor?.user?.firstName || ""} ${app.doctor?.lastName || app.doctor?.user?.lastName || ""}`.trim() ||
    "Unassigned Doctor";

  return {
    id: app.id,
    locationId: app.locationId || app.location?.id || undefined,
    patientName,
    patientPhone,
    doctorId: app.doctor?.id || app.doctorId || "",
    primaryDoctorId: app.primaryDoctorId || app.metadata?.primaryDoctorId || app.doctorId || "",
    assignedDoctorId: app.assignedDoctorId || app.metadata?.assignedDoctorId || app.doctorId || "",
    doctorName,
    doctorRole: String(app.doctor?.role || app.doctor?.user?.role || "").toUpperCase(),
    dateLabel: getReceptionistAppointmentDateLabel(app as unknown as Record<string, unknown>),
    timeLabel: getReceptionistAppointmentTimeLabel(app as unknown as Record<string, unknown>),
    status: String(app.status || "SCHEDULED").toUpperCase(),
    paymentStatus: String(app.payment?.status || "N/A").toUpperCase(),
    queuePosition: typeof app.queuePosition === "number" ? app.queuePosition : null,
    queueType: resolveQueueDisplayLabel(app, serviceCatalogMap),
    notes: app.notes || app.cancellationReason || app.reason || "",
    cancellationReason: app.cancellationReason || undefined,
    waitLabel:
      typeof app.estimatedWaitTime === "number"
        ? `${app.estimatedWaitTime} min`
        : typeof app.waitTime === "number"
          ? `${app.waitTime} min`
          : typeof app.waitTime === "string"
            ? app.waitTime
            : "Pending",
    isWalkIn: Boolean(app.isWalkIn),
    isDelegated:
      Boolean(app.primaryDoctorId || app.metadata?.primaryDoctorId) &&
      String(app.primaryDoctorId || app.metadata?.primaryDoctorId || "") !==
        String(app.assignedDoctorId || app.metadata?.assignedDoctorId || app.doctorId || ""),
    doctor: app.doctor || app.metadata?.doctor,
    sortAt: parsed && !Number.isNaN(parsed.getTime()) ? parsed.getTime() : 0,
  };
}

export default function ReceptionistAppointmentsPage() {
  const { session } = useAuth();
  const { clinicId } = useClinicContext();
  useWebSocketQuerySync();
  const { data: serviceCatalog = [] } = useAppointmentServices();
  const assignedLocationId = useMemo(() => {
    const user = session?.user as Record<string, unknown> | undefined;
    const candidate =
      (typeof user?.locationId === "string" ? user.locationId : "") ||
      (typeof user?.clinicLocationId === "string" ? user.clinicLocationId : "") ||
      (typeof user?.assignedLocationId === "string" ? user.assignedLocationId : "");
    return candidate || null;
  }, [session?.user]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [queueFilter, setQueueFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("date-desc");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [activeDoctorId, setActiveDoctorId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<ViewAppointment | null>(null);
  const checkInMutation = useCheckInAppointment();
  const markNoShowMutation = useMarkAppointmentNoShow();
  const reassignAppointmentMutation = useReassignAppointmentDoctor();
  const callNextPatientMutation = useQueueCallNextPatient();

  useEffect(() => {
    if (assignedLocationId && assignedLocationId !== selectedLocationId) {
      setSelectedLocationId(assignedLocationId);
    }
  }, [assignedLocationId, selectedLocationId]);

  const effectiveLocationId = assignedLocationId || selectedLocationId;

  const {
    data: appointmentsData,
    isPending,
    refetch,
  } = useAppointments({
    ...(clinicId ? { clinicId } : {}),
    ...(selectedDate ? { date: selectedDate } : {}),
    ...(effectiveLocationId ? { locationId: effectiveLocationId } : {}),
    limit: 200,
  });
  const { data: locations = [] } = useActiveLocations(clinicId || "");
  const { data: doctorsData } = useDoctors(clinicId || "", { limit: 500 });

  const assignableDoctors = useMemo(() => {
    const normalize = (users: any[]) =>
      users
        .map((user) => {
          const role = String(user.role || user.doctor?.user?.role || "").toUpperCase();
          return {
            id: user.doctor?.id || user.id,
            name:
              user.name ||
              user.doctor?.user?.name ||
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              "Unknown Doctor",
            role,
          };
        })
        .filter((doctor) => doctor.id && (doctor.role === "DOCTOR" || doctor.role === "ASSISTANT_DOCTOR"));

    if (Array.isArray(doctorsData)) return normalize(doctorsData);
    if (Array.isArray((doctorsData as any)?.data?.doctors)) return normalize((doctorsData as any).data.doctors);
    return normalize((doctorsData as any)?.doctors || []);
  }, [doctorsData]);

  const appointments = useMemo(() => {
    const raw = Array.isArray(appointmentsData)
      ? appointmentsData
      : (appointmentsData as any)?.appointments || [];
    const serviceMap = new Map(
      serviceCatalog.map((service) => [
        String(service.treatmentType).toUpperCase(),
        {
          label: service.label,
          serviceBucket: service.serviceBucket,
          queueCategory: service.queueCategory,
        },
      ])
    );

    return raw.map((appointment: any) => normalizeAppointment(appointment, serviceMap));
  }, [appointmentsData, serviceCatalog]);

  const filteredAppointments = useMemo(() => {
    const base = appointments.filter((appointment: ViewAppointment) => {
      const matchesSearch =
        !searchTerm ||
        appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.patientPhone.includes(searchTerm);
      const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
      const matchesQueue = queueFilter === "all" || appointment.queueType === queueFilter;
      const matchesAssignedLocation =
        !assignedLocationId || !appointment.locationId || appointment.locationId === assignedLocationId;
      return matchesSearch && matchesStatus && matchesQueue && matchesAssignedLocation;
    });
    return [...base].sort((left, right) => {
      if (sortOrder === "date-asc") return left.sortAt - right.sortAt;
      if (sortOrder === "patient-asc") return left.patientName.localeCompare(right.patientName);
      if (sortOrder === "patient-desc") return right.patientName.localeCompare(left.patientName);
      return right.sortAt - left.sortAt;
    });
  }, [appointments, assignedLocationId, queueFilter, searchTerm, sortOrder, statusFilter]);

  const availableQueueTypes = useMemo(
    () =>
      (
        Array.from(
          new Set(
            appointments
              .map((appointment: ViewAppointment) => appointment.queueType)
              .filter((queueType: string) => Boolean(queueType))
          )
        ) as string[]
      ).sort(),
    [appointments]
  );

  const selectedCalendarDate = useMemo(
    () => (selectedDate ? new Date(`${selectedDate}T00:00:00`) : undefined),
    [selectedDate]
  );

  const stats = useMemo(() => {
    const total = appointments.length;
    const scheduled = appointments.filter((item: ViewAppointment) => item.status === "SCHEDULED").length;
    const confirmed = appointments.filter((item: ViewAppointment) => item.status === "CONFIRMED").length;
    const inProgress = appointments.filter((item: ViewAppointment) => item.status === "IN_PROGRESS").length;
    const completed = appointments.filter((item: ViewAppointment) => item.status === "COMPLETED").length;
    return { total, scheduled, confirmed, inProgress, completed };
  }, [appointments]);

  const doctorBacklog = useMemo(() => {
    const grouped = new Map<
      string,
      {
        doctorId: string;
        doctorName: string;
        scheduled: number;
        confirmed: number;
        inProgress: number;
        nextPatient: string | null;
        nextAppointmentId: string | null;
      }
    >();

    for (const appointment of filteredAppointments) {
      const doctorKey = appointment.doctorId || appointment.doctorName;
      const current = grouped.get(doctorKey) || {
        doctorId: appointment.doctorId,
        doctorName: appointment.doctorName,
        scheduled: 0,
        confirmed: 0,
        inProgress: 0,
        nextPatient: null,
        nextAppointmentId: null,
      };

      if (appointment.status === "SCHEDULED") current.scheduled += 1;
      if (appointment.status === "CONFIRMED") {
        current.confirmed += 1;
        if (!current.nextPatient || appointment.queuePosition === 1) {
          current.nextPatient = appointment.patientName;
          current.nextAppointmentId = appointment.id;
        }
      }
      if (appointment.status === "IN_PROGRESS") current.inProgress += 1;
      grouped.set(doctorKey, current);
    }

    return Array.from(grouped.values()).sort((a, b) => b.confirmed - a.confirmed || b.scheduled - a.scheduled);
  }, [filteredAppointments]);

  const doctorQueueColumns = useMemo<ColumnDef<(typeof doctorBacklog)[number]>[]>(
    () => [
      {
        accessorKey: "doctorName",
        header: "Doctor",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{row.original.doctorName}</span>
            <span className="text-xs text-muted-foreground">Doctor</span>
          </div>
        ),
      },
      {
        accessorKey: "scheduled",
        header: "Scheduled",
        cell: ({ row }) => (
          <Badge variant="outline" className="bg-muted/40 text-foreground border-border">
            {row.original.scheduled}
          </Badge>
        ),
      },
      {
        accessorKey: "confirmed",
        header: "Queued",
        cell: ({ row }) => (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
            {row.original.confirmed}
          </Badge>
        ),
      },
      {
        accessorKey: "inProgress",
        header: "In Progress",
        cell: ({ row }) => (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            {row.original.inProgress}
          </Badge>
        ),
      },
      {
        accessorKey: "nextPatient",
        header: "Next Patient",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.nextPatient || "No waiting patients"}</span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            size="sm"
            className="h-8 px-3 text-xs font-bold gap-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white"
            onClick={() => void handleNotifyNext(row.original.doctorId, row.original.nextAppointmentId)}
            disabled={activeDoctorId === row.original.doctorId || row.original.confirmed === 0}
          >
            {activeDoctorId === row.original.doctorId ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Bell className="h-3.5 w-3.5" />
            )}
            Call Next
          </Button>
        ),
      },
    ],
    [activeDoctorId]
  );

  async function handleConfirmArrival(appointmentId: string, locationId?: string) {
    const locationToSend = assignedLocationId || locationId;
    if (assignedLocationId && locationId && assignedLocationId !== locationId) {
      showErrorToast("This appointment does not belong to your assigned location", {
        id: TOAST_IDS.APPOINTMENT.UPDATE,
      });
      return;
    }
    setActiveActionId(appointmentId);
    try {
      await checkInMutation.mutateAsync({
        appointmentId,
        reason: "Reception desk manual check-in for this location",
        ...(locationToSend ? { locationId: locationToSend } : {}),
      });
      await refetch?.();
    } finally {
      setActiveActionId(null);
    }
  }

  async function handleMarkNoShow(appointmentId: string) {
    setActiveActionId(appointmentId);
    try {
      await markNoShowMutation.mutateAsync(appointmentId);
      await refetch?.();
    } finally {
      setActiveActionId(null);
    }
  }

  async function handleNotifyNext(doctorId: string, appointmentId: string | null) {
    if (!doctorId || !appointmentId) {
      showErrorToast("No queued patient is available for this doctor", { id: TOAST_IDS.QUEUE.CALL_NEXT });
      return;
    }
    setActiveDoctorId(doctorId);
    try {
      await callNextPatientMutation.mutateAsync({ doctorId, appointmentId });
      await refetch?.();
    } finally {
      setActiveDoctorId(null);
    }
  }

  async function handleReassignDoctor(appointmentId: string, doctorId: string) {
    setActiveActionId(appointmentId);
    try {
      await reassignAppointmentMutation.mutateAsync({
        appointmentId,
        doctorId,
        reason: "Reception desk reassignment",
      });
      await refetch?.();
    } finally {
      setActiveActionId(null);
    }
  }

  const columns: ColumnDef<ViewAppointment>[] = [
    {
      accessorKey: "patientName",
      header: "Patient",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.patientName}</span>
          <span className="text-xs text-muted-foreground">{row.original.patientPhone}</span>
          {row.original.isWalkIn && <Badge variant="outline" className="w-fit mt-1 text-[10px]">Walk-in</Badge>}
        </div>
      ),
    },
    {
      accessorKey: "doctorName",
      header: "Doctor",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.doctorName}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.doctorRole === "ASSISTANT_DOCTOR" ? "Assistant" : "Doctor"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "dateTime",
      header: "Schedule",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{row.original.dateLabel}</span>
          <span className="text-xs text-muted-foreground">{row.original.timeLabel}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={STATUS_STYLES[row.original.status] || STATUS_STYLES.SCHEDULED}>
          {row.original.status.replace("_", " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "queue",
      header: "Queue",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">{row.original.queueType || "—"}</span>
          {row.original.queuePosition != null && (
            <Badge variant="outline" className="text-[10px] h-4 px-1 leading-none">
              #{row.original.queuePosition}
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const appointment = row.original;
        const canConfirmArrival = appointment.status === "SCHEDULED";
        const canReassign = appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED";
        const canMarkNoShow =
          appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED";

        return (
          <div className="flex items-center gap-2">
            {canConfirmArrival && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-xs"
                onClick={() => handleConfirmArrival(appointment.id, appointment.locationId)}
                disabled={activeActionId === appointment.id}
              >
                {activeActionId === appointment.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <UserCheck className="h-3 w-3 mr-1" />
                )}
                Confirm
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setSelectedAppointment(appointment)}>
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </DropdownMenuItem>
                
                {canReassign && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[10px] font-normal text-muted-foreground">Reassign Doctor</DropdownMenuLabel>
                    {assignableDoctors.slice(0, 5).map((doc) => (
                      <DropdownMenuItem 
                        key={doc.id} 
                        disabled={doc.id === appointment.doctorId}
                        onClick={() => handleReassignDoctor(appointment.id, doc.id)}
                      >
                        <UserMinus className="mr-2 h-4 w-4" /> {doc.name}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                
                {canMarkNoShow && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleMarkNoShow(appointment.id)}
                      disabled={activeActionId === appointment.id}
                    >
                      Mark No Show
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <DashboardPageShell className="p-4 md:p-6">
      <DashboardPageHeader
        eyebrow="Reception Appointments"
        title="Reception Queue Workspace"
        description="Unified workspace for appointment management, queue flow, and doctor reassignment."
        meta={<span className="text-sm font-medium text-muted-foreground">Showing {filteredAppointments.length} of {appointments.length} appointments</span>}
        actionsSlot={
          <Button asChild variant="outline">
            <Link href="/receptionist/check-in">
              <QrCode className="w-4 h-4 mr-2" />
              QR Check-In
            </Link>
          </Button>
        }
      />

      <div id="appointment-manager">
        <AppointmentManager
          isAdminView={true}
          {...(clinicId ? { clinicId } : {})}
        />
      </div>


      <div className="space-y-6">
        <div>
          <Card>
            <CardHeader className="border-b bg-muted/40 dark:bg-muted/20 px-5 py-4 space-y-3">
              {/* Row 1: Title + Live badge */}
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base font-bold inline-flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                  </div>
                  Appointment Queue Workspace
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background px-3 py-1.5 rounded-full border border-border shadow-sm shrink-0">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync Active
                </div>
              </div>

              {/* Row 2: Search + filters in one scrollable row */}
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
                {/* Search */}
                <div className="relative shrink-0 w-52">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search patient, doctor..."
                    className="pl-8 h-9 text-sm border-border bg-background focus:ring-emerald-500/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Status */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 text-sm w-[130px] shrink-0 border-border bg-background">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="AWAITING_SLOT_CONFIRMATION">Awaiting Slot</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="NO_SHOW">No Show</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="h-9 text-sm w-[130px] shrink-0 border-border bg-background">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Latest first</SelectItem>
                    <SelectItem value="date-asc">Earliest first</SelectItem>
                    <SelectItem value="patient-asc">Patient A–Z</SelectItem>
                    <SelectItem value="patient-desc">Patient Z–A</SelectItem>
                  </SelectContent>
                </Select>

                {/* Queue */}
                <Select value={queueFilter} onValueChange={setQueueFilter}>
                  <SelectTrigger className="h-9 text-sm w-[120px] shrink-0 border-border bg-background">
                    <SelectValue placeholder="All Queues" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Queues</SelectItem>
                    {availableQueueTypes.map((queueType) => (
                      <SelectItem key={queueType} value={queueType}>{queueType}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Location (only if not assigned) */}
                {!assignedLocationId && locations.length > 1 && (
                  <Select
                    value={selectedLocationId || "all"}
                    onValueChange={(val) => setSelectedLocationId(val === "all" ? null : val)}
                  >
                    <SelectTrigger className="h-9 text-sm w-[130px] shrink-0 border-border bg-background">
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {(locations as any[]).map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name || loc.address || "Location"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Date picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-9 text-sm px-3 shrink-0 border-border bg-background gap-1.5 font-normal">
                      <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                      {selectedCalendarDate ? format(selectedCalendarDate, "dd MMM yyyy") : "All dates"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <DateCalendar
                      mode="single"
                      selected={selectedCalendarDate}
                      onSelect={(date) => {
                        if (!date) { setSelectedDate(""); return; }
                        setSelectedDate(format(date, "yyyy-MM-dd"));
                      }}
                    />
                    <div className="border-t p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => setSelectedDate("")}
                      >
                        Clear date filter
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={columns} 
                data={filteredAppointments} 
                pageSize={10}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60 shadow-sm overflow-hidden bg-card">
          <CardHeader className="pb-3 border-b border-border px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    Active Doctor Queues
                    {doctorBacklog.length > 0 && (
                      <span className="ml-3 px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-bold ring-1 ring-inset ring-blue-700/10">
                        {doctorBacklog.length} Active
                      </span>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground font-medium mt-0.5">Real-time clinical workload and patient flow</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {doctorBacklog.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground bg-muted/30 rounded-2xl border border-dashed border-border">
                <Stethoscope className="w-8 h-8 text-muted-foreground/50" />
                <p className="text-sm font-medium">No active doctor queues at the moment</p>
              </div>
            ) : (
              <DataTable
                columns={doctorQueueColumns}
                data={doctorBacklog}
                pageSize={9}
                emptyMessage="No active doctor queues at the moment"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!selectedAppointment}
        onOpenChange={(open) => {
          if (!open) setSelectedAppointment(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment ? (
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Patient</p>
                <p className="font-medium">{selectedAppointment.patientName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{selectedAppointment.patientPhone || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Doctor</p>
                <p className="font-medium">{selectedAppointment.doctorName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Schedule</p>
                <p className="font-medium">{selectedAppointment.dateLabel} at {selectedAppointment.timeLabel}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge className={STATUS_STYLES[selectedAppointment.status] || STATUS_STYLES.SCHEDULED}>
                  {selectedAppointment.status.replace("_", " ")}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Payment</p>
                <p className="font-medium">{selectedAppointment.paymentStatus}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Queue</p>
                <p className="font-medium">
                  {selectedAppointment.queueType}
                  {selectedAppointment.queuePosition ? `, position ${selectedAppointment.queuePosition}` : ""}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Estimated Wait</p>
                <p className="font-medium">{selectedAppointment.waitLabel}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Notes</p>
                <p className="font-medium">{selectedAppointment.notes || "No notes provided"}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  );
}
