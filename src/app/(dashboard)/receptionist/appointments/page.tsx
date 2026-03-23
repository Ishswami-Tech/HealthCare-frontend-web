"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, Calendar, Loader2, QrCode, Search, Stethoscope, UserCheck, Eye, MoreHorizontal, UserMinus } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";

import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/hooks/auth/useAuth";
import { useDoctors } from "@/hooks/query/useDoctors";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { useAppointmentServices, useAppointments } from "@/hooks/query/useAppointments";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import {
  checkInAppointment,
  getAppointmentReassignmentCandidates,
  reassignAppointmentDoctor,
  updateAppointmentStatus,
} from "@/lib/actions/appointments.server";
import { callNextPatient } from "@/lib/actions/queue.server";
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
};

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-slate-100 text-slate-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-violet-100 text-violet-800",
  NO_SHOW: "bg-red-100 text-red-800",
  CANCELLED: "bg-rose-100 text-rose-800",
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
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [activeDoctorId, setActiveDoctorId] = useState<string | null>(null);
  const [selectedReassignments, setSelectedReassignments] = useState<Record<string, string>>({});
  const [reassignmentCandidates, setReassignmentCandidates] = useState<
    Record<
      string,
      Array<{
        id: string;
        name: string;
        role: string;
        eligible: boolean;
        reason?: string;
        isCurrent: boolean;
        isPrimary: boolean;
      }>
    >
  >({});

  const {
    data: appointmentsData,
    isPending,
    refetch,
  } = useAppointments({
    ...(clinicId ? { clinicId } : {}),
    ...(selectedDate ? { date: selectedDate } : {}),
    limit: 200,
  });
  const { data: doctorsData } = useDoctors(clinicId || "", { limit: 200 });

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
      }
    >();

    for (const appointment of filteredAppointments) {
      const current = grouped.get(appointment.doctorName) || {
        doctorId: appointment.doctorId,
        doctorName: appointment.doctorName,
        scheduled: 0,
        confirmed: 0,
        inProgress: 0,
        nextPatient: null,
      };

      if (appointment.status === "SCHEDULED") current.scheduled += 1;
      if (appointment.status === "CONFIRMED") {
        current.confirmed += 1;
        if (!current.nextPatient || appointment.queuePosition === 1) {
          current.nextPatient = appointment.patientName;
        }
      }
      if (appointment.status === "IN_PROGRESS") current.inProgress += 1;
      grouped.set(appointment.doctorName, current);
    }

    return Array.from(grouped.values()).sort((a, b) => b.confirmed - a.confirmed || b.scheduled - a.scheduled);
  }, [filteredAppointments]);

  async function handleConfirmArrival(appointmentId: string) {
    setActiveActionId(appointmentId);
    const result = await checkInAppointment(appointmentId);
    if (result.success) {
      showSuccessToast("Patient confirmed and added to queue", { id: TOAST_IDS.APPOINTMENT.CHECK_IN });
      await refetch?.();
    } else {
      showErrorToast(result.error || "Failed to confirm patient arrival", { id: TOAST_IDS.APPOINTMENT.CHECK_IN });
    }
    setActiveActionId(null);
  }

  async function handleMarkNoShow(appointmentId: string) {
    setActiveActionId(appointmentId);
    const result = await updateAppointmentStatus(appointmentId, { status: "NO_SHOW" });
    if (result.success) {
      showSuccessToast("Appointment marked as no-show", { id: TOAST_IDS.APPOINTMENT.UPDATE });
      await refetch?.();
    } else {
      showErrorToast(result.error || "Failed to mark no-show", { id: TOAST_IDS.APPOINTMENT.UPDATE });
    }
    setActiveActionId(null);
  }

  async function handleNotifyNext(doctorId: string) {
    if (!doctorId) return;
    setActiveDoctorId(doctorId);
    const result = (await callNextPatient(doctorId, "clinic")) as any;
    if (result?.success) {
      showSuccessToast("Next patient moved into consultation", { id: TOAST_IDS.QUEUE.CALL_NEXT });
      await refetch?.();
    } else {
      showErrorToast(result?.message || "No waiting patient available", { id: TOAST_IDS.QUEUE.CALL_NEXT });
    }
    setActiveDoctorId(null);
  }

  async function handleReassignDoctor(appointmentId: string, doctorId: string) {
    setActiveActionId(appointmentId);
    const result = await reassignAppointmentDoctor(appointmentId, {
      doctorId,
      reason: "Reception desk reassignment",
    });

    if (result.success) {
      showSuccessToast("Appointment reassigned successfully", { id: TOAST_IDS.APPOINTMENT.UPDATE });
      await refetch?.();
    } else {
      showErrorToast(result.error || "Failed to reassign", { id: TOAST_IDS.APPOINTMENT.UPDATE });
    }
    setActiveActionId(null);
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
                <DropdownMenuItem onClick={() => window.open(`/receptionist/appointments/${appointment.id}`, "_blank")}>
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
          <BookAppointmentDialog
            {...(clinicId ? { clinicId } : {})}
            trigger={
              <Button>
                <Calendar className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Total</div><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Scheduled</div><div className="text-2xl font-bold">{stats.scheduled}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Queued</div><div className="text-2xl font-bold text-emerald-700">{stats.confirmed}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">In Progress</div><div className="text-2xl font-bold text-blue-700">{stats.inProgress}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Completed</div><div className="text-2xl font-bold text-violet-700">{stats.completed}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Appointment List</CardTitle>
              <div className="flex gap-2">
                <Input 
                  placeholder="Search..." 
                  className="w-64 h-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 h-8"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
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
                        onClick={() => handleNotifyNext(doctor.doctorId)}
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
    </div>
  );
}
