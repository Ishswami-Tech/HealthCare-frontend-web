"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, Calendar, Loader2, QrCode, Search, Stethoscope, UserCheck, Eye, MoreHorizontal, UserMinus } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import AppointmentManager from "@/components/appointments/AppointmentManager";
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

type ViewAppointment = {
  id: string;
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
  waitLabel: string;
  isWalkIn: boolean;
  isDelegated: boolean;
  doctor?: any;
};

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-slate-100 text-slate-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  NO_SHOW: "bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-300",
  CANCELLED: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
};

function normalizeAppointment(
  app: any,
  serviceCatalogMap: Map<string, { label: string; serviceBucket: string; queueCategory: string }>
): ViewAppointment {
  const startAt = app.startTime || app.appointmentDate || (app.date && app.time ? `${app.date}T${app.time}` : null);
  const parsed = startAt ? new Date(startAt) : null;
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
    patientName,
    patientPhone,
    doctorId: app.doctor?.id || app.doctorId || "",
    primaryDoctorId: app.primaryDoctorId || app.metadata?.primaryDoctorId || app.doctorId || "",
    assignedDoctorId: app.assignedDoctorId || app.metadata?.assignedDoctorId || app.doctorId || "",
    doctorName,
    doctorRole: String(app.doctor?.role || app.doctor?.user?.role || "").toUpperCase(),
    dateLabel:
      parsed && !Number.isNaN(parsed.getTime())
        ? parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : app.date || "TBD",
    timeLabel:
      parsed && !Number.isNaN(parsed.getTime())
        ? parsed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
        : app.time || "TBD",
    status: String(app.status || "SCHEDULED").toUpperCase(),
    paymentStatus: String(app.payment?.status || "N/A").toUpperCase(),
    queuePosition: typeof app.queuePosition === "number" ? app.queuePosition : null,
    queueType: resolveQueueDisplayLabel(app, serviceCatalogMap),
    notes: app.notes || app.reason || "",
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
    doctor: app.doctor || app.metadata?.doctor
  };
}

export default function ReceptionistAppointmentsPage() {
  useAuth();
  const { clinicId } = useClinicContext();
  useWebSocketQuerySync();
  const { data: serviceCatalog = [] } = useAppointmentServices();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [queueFilter, setQueueFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [activeDoctorId, setActiveDoctorId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<ViewAppointment | null>(null);
  const checkInMutation = useCheckInAppointment();
  const markNoShowMutation = useMarkAppointmentNoShow();
  const reassignAppointmentMutation = useReassignAppointmentDoctor();
  const callNextPatientMutation = useQueueCallNextPatient();

  const {
    data: appointmentsData,
    isPending,
    refetch,
  } = useAppointments({
    ...(clinicId ? { clinicId } : {}),
    ...(selectedDate ? { date: selectedDate } : {}),
    ...(selectedLocationId ? { locationId: selectedLocationId } : {}),
    limit: 1000,
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
    return appointments.filter((appointment: ViewAppointment) => {
      const matchesSearch =
        !searchTerm ||
        appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.patientPhone.includes(searchTerm);
      const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
      const matchesQueue = queueFilter === "all" || appointment.queueType === queueFilter;
      return matchesSearch && matchesStatus && matchesQueue;
    });
  }, [appointments, queueFilter, searchTerm, statusFilter]);

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

  async function handleConfirmArrival(appointmentId: string) {
    setActiveActionId(appointmentId);
    try {
      await checkInMutation.mutateAsync(appointmentId);
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
        <div className="flex flex-col text-xs">
          <span className="font-medium">{row.original.queueType}</span>
          <span className="text-muted-foreground">Pos: {row.original.queuePosition ?? "N/A"}</span>
          <span className="text-muted-foreground">Wait: {row.original.waitLabel}</span>
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

        return (
          <div className="flex items-center gap-2">
            {canConfirmArrival && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-xs"
                onClick={() => handleConfirmArrival(appointment.id)}
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
                
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => handleMarkNoShow(appointment.id)}
                  disabled={activeActionId === appointment.id}
                >
                  Mark No Show
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reception Queue Workspace</h1>
          <p className="text-muted-foreground">
            Unified workspace for appointment management and doctor queue flow.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button asChild variant="outline">
            <Link href="/receptionist/check-in">
              <QrCode className="w-4 h-4 mr-2" />
              QR Check-In
            </Link>
          </Button>
          <Button asChild>
            <Link href="#appointment-manager">
              <Calendar className="w-4 h-4 mr-2" />
              New Appointment
            </Link>
          </Button>
        </div>
      </div>

      <div id="appointment-manager">
        <AppointmentManager
          isAdminView={true}
          {...(clinicId ? { clinicId } : {})}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="border-slate-100 shadow-sm bg-white dark:bg-slate-800">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-slate-500 uppercase tracking-tight">Total</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm bg-white dark:bg-slate-800">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-slate-500 uppercase tracking-tight">Scheduled</div>
            <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">{stats.scheduled}</div>
          </CardContent>
        </Card>
        <Card className="border-emerald-100 shadow-sm bg-white dark:bg-slate-800">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-emerald-600 uppercase tracking-tight">Queued</div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.confirmed}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-100 shadow-sm bg-white dark:bg-slate-800">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-blue-600 uppercase tracking-tight">In Progress</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card className="border-emerald-100 shadow-sm bg-white dark:bg-slate-800">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-emerald-600 uppercase tracking-tight">Completed</div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="space-y-4 border-b bg-slate-50/50 dark:bg-slate-900/10 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-xl inline-flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-500" />
                  Appointment Queue Workspace
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-slate-500 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm self-start sm:self-center">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync Active
                </div>
              </div>
              
              <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between">
                <div className="relative flex-1 max-w-2xl">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search by patient name, doctor, phone, or appointment ID..." 
                    className="pl-10 h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-emerald-500/20 text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <Select value={queueFilter} onValueChange={setQueueFilter}>
                      <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <SelectValue placeholder="Queue" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Queues</SelectItem>
                        {availableQueueTypes.map((queueType) => (
                          <SelectItem key={queueType} value={queueType}>
                            {queueType}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {locations.length > 1 && (
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <Select
                        value={selectedLocationId || "all"}
                        onValueChange={(val) =>
                          setSelectedLocationId(val === "all" ? null : val)
                        }
                      >
                        <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                          <SelectValue placeholder="Location" />
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
                    </div>
                  )}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto h-10 justify-start text-left font-normal border-slate-200 dark:border-slate-700">
                      <Calendar className="mr-2 h-4 w-4 text-emerald-500" />
                      {selectedCalendarDate ? format(selectedCalendarDate, "dd MMM yyyy") : "All dates"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <DateCalendar
                      mode="single"
                      selected={selectedCalendarDate}
                      onSelect={(date) => {
                        if (!date) {
                          setSelectedDate("");
                          return;
                        }
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                Doctor Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {doctorBacklog.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No active queues</p>
              ) : (
                doctorBacklog.map((doctor) => (
                  <div key={doctor.doctorId} className="p-3 border rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{doctor.doctorName}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => handleNotifyNext(doctor.doctorId, doctor.nextAppointmentId)}
                        disabled={activeDoctorId === doctor.doctorId || doctor.confirmed === 0}
                      >
                        {activeDoctorId === doctor.doctorId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Bell className="h-4 w-4 text-blue-600" />
                        )}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-[10px]">Q: {doctor.confirmed}</Badge>
                      <Badge variant="outline" className="text-[10px]">Active: {doctor.inProgress}</Badge>
                    </div>
                    {doctor.nextPatient && (
                      <p className="text-[10px] text-muted-foreground">Next: {doctor.nextPatient}</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
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
    </div>
  );
}
