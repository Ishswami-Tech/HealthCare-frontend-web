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
import { getDisplayAppointmentDuration } from "@/lib/utils/appointmentUtils";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";

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
  patientId: string;
}

export default function DoctorDashboard() {
  const router = useRouter();
  const { session } = useAuth();
  const user = session?.user;
  const clinicId = user?.clinicId;

  const [searchTerm, setSearchTerm] = useState("");

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  // IST date for server-side filtering
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  // Fetch real data using existing hooks and server actions
  const { data: appointments, isPending: isAppointmentsPending, error: appointmentsError } = useAppointments({
    ...(clinicId ? { clinicId } : {}),
    ...(user?.id ? { doctorId: user.id } : {}),
    date: today,
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
        const aptDate = apt.date || (apt as unknown as Record<string, unknown>).appointmentDate?.toString().split("T")?.[0] || "";
        return aptDate === todayStr;
      })
      .sort(
        (a: AppointmentWithRelations, b: AppointmentWithRelations) =>
          (a.time || "").localeCompare(b.time || "", undefined, { numeric: true })
      )
      .map((apt: AppointmentWithRelations): TransformedAppointment => {
        const patientName =
          `${apt.patient?.firstName || ""} ${apt.patient?.lastName || ""}`.trim() ||
          "Unknown Patient";
        const displayDuration = getDisplayAppointmentDuration(apt);
        const statusLabels: Partial<Record<AppointmentStatus, string>> = {
          IN_PROGRESS: "In Progress",
          SCHEDULED: "Scheduled",
          CONFIRMED: "Confirmed",
          AWAITING_SLOT_CONFIRMATION: "Awaiting Confirmation",
          COMPLETED: "Completed",
          CANCELLED: "Cancelled",
          NO_SHOW: "No Show",
        };
        return {
          id: apt.id,
          patientName,
          patientId: apt.patientId,
          time: apt.time || "",
          status: statusLabels[apt.status] || apt.status,
          statusEnum: apt.status,
          type: apt.type || "Consultation",
          duration: `${displayDuration || 30} min`,
          notes: apt.notes || "",
          isVideo: apt.type === "VIDEO_CALL",
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
        (apt: TransformedAppointment) => apt.statusEnum === "CONFIRMED" || apt.statusEnum === "IN_PROGRESS"
      ),
    [filteredAppointments]
  );

  const stats = useMemo(() => {
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const todayApts = appointmentsArray.filter((apt: AppointmentWithRelations) => {
      const aptDate = apt.date || (apt as unknown as Record<string, unknown>).appointmentDate?.toString().split("T")?.[0] || "";
      return aptDate === todayStr;
    });

    return {
      todayAppointments: todayApts.length,
      checkedInPatients: todayApts.filter((apt: AppointmentWithRelations) => apt.status === "CONFIRMED").length,
      completedToday: todayApts.filter((apt: AppointmentWithRelations) => apt.status === "COMPLETED").length,
      totalPatients: new Set(appointmentsArray.map((apt: AppointmentWithRelations) => apt.patientId)).size,
      nextAppointment: todaysAppointments.find(
        (a: TransformedAppointment) =>
          a.statusEnum === "SCHEDULED" ||
          a.statusEnum === "CONFIRMED" ||
          a.statusEnum === "IN_PROGRESS"
      )?.time || "-",
    };
  }, [appointmentsArray, todaysAppointments]);

  const columns: ColumnDef<TransformedAppointment>[] = [
    {
      accessorKey: "patientName",
      header: "Patient",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="font-semibold leading-none mb-1">{row.original.patientName}</div>
            <div className="text-xs text-muted-foreground">{row.original.type} • {row.original.duration}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "time",
      header: "Time",
      cell: ({ row }) => (
        <div className="text-sm font-medium">{row.original.time}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const colors: Record<string, string> = {
          "In Progress": "bg-blue-100 text-blue-800",
          "Confirmed": "bg-green-100 text-green-800",
          "Scheduled": "bg-slate-100 text-slate-800",
          "Completed": "bg-emerald-100 text-emerald-800",
        };
        return (
          <Badge variant="secondary" className={`${colors[row.original.status] || "bg-slate-100"} border-none text-[10px]`}>
            {row.original.status.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const appointment = row.original;
        return (
          <div className="flex gap-2">
            {appointment.statusEnum === "CONFIRMED" && (
              <Button
                size="sm"
                className="h-8 gap-1.5"
                disabled={startAppointmentMutation.isPending}
                onClick={async () => {
                  await startAppointmentMutation.mutateAsync(appointment.id);
                  if (appointment.isVideo) {
                    router.push("/doctor/video");
                  }
                }}
              >
                {startAppointmentMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3 fill-current" />
                )}
                Start
              </Button>
            )}
            {appointment.statusEnum === "IN_PROGRESS" && (
              <Button
                size="sm"
                variant="default"
                className="h-8 gap-1.5 bg-green-600 hover:bg-green-700"
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
            )}
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8"
              onClick={() => router.push(`/doctor/patients/${appointment.patientId}`)}
            >
              EHR
            </Button>
          </div>
        );
      },
    },
  ];

  if (isAppointmentsPending && appointmentsArray.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (appointmentsError && appointmentsArray.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        Error loading appointments: {appointmentsError.message}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, Dr. {user?.name?.split(' ')[0] || "Doctor"}
          </h1>
          <p className="text-muted-foreground">
            Today is{" "}
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="text-left md:text-right p-4 bg-emerald-50 rounded-lg border border-emerald-100">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">Next Appointment</div>
          <div className="text-2xl font-bold text-emerald-700">
            {stats.nextAppointment}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">{stats.checkedInPatients}</span> confirmed and waiting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
            <p className="text-xs text-muted-foreground">Consultations finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">Unique patients seen</p>
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Treatment Queue Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Active Treatment Queue
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search today's queue..."
                className="pl-8 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={activeTreatmentQueue}
              pageSize={5}
              emptyMessage="No patients currently in treatment queue"
            />
          </CardContent>
        </Card>

        {/* Quick Actions & Satisfaction */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start h-11"
                onClick={() => router.push("/doctor/video")}
              >
                <Video className="w-4 h-4 mr-2 text-blue-600" />
                Start Video Consultation
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-11"
                onClick={() => router.push("/doctor/appointments")}
              >
                <FileText className="w-4 h-4 mr-2 text-green-600" />
                Manage Appointments
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-11"
                onClick={() => router.push("/doctor/patients")}
              >
                <Users className="w-4 h-4 mr-2 text-emerald-600" />
                View Patient Directory
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appointment Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats.completedToday}/{stats.todayAppointments}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Completed of today's appointments</p>
              <div className="mt-4 w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: stats.todayAppointments > 0 ? `${Math.round((stats.completedToday / stats.todayAppointments) * 100)}%` : '0%' }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scheduled Today Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-500" />
            Full Schedule (Today)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredAppointments}
            pageSize={10}
            emptyMessage="No appointments scheduled for today"
          />
        </CardContent>
      </Card>
    </div>
  );
}
