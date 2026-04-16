"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Calendar, CheckCircle, Clock, ListTodo, QrCode, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import { useAppointments } from "@/hooks/query/useAppointments";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useMedicineDeskQueue } from "@/hooks/query/usePharmacy";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { getQueuePositionLabel, normalizeQueueEntry } from "@/lib/queue/queue-adapter";

type ReceptionAppointment = {
  id: string;
  patientName: string;
  doctorName: string;
  doctorRole?: string;
  isDelegated: boolean;
  status: string;
  timeLabel: string;
  queuePosition: number | null;
  waitLabel: string;
  queueCategory?: string;
};

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-200",
  CONFIRMED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  NO_SHOW: "bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-300",
  CANCELLED: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
};

export default function ReceptionistDashboard() {
  useAuth();
  const { clinicId } = useClinicContext();
  useWebSocketQuerySync();

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const { data: appointmentsData, isPending, error: appointmentsError } = useAppointments({
    date: today,
    limit: 200,
  });
  const { data: medicineDeskQueueResult } = useMedicineDeskQueue(clinicId || "", !!clinicId);
  const medicineDeskQueue = Array.isArray(medicineDeskQueueResult) ? medicineDeskQueueResult : (medicineDeskQueueResult as any)?.prescriptions || [];

  const appointments = useMemo(() => {
    const raw = appointmentsData?.appointments || [];
    return (raw as any[]).map(appointment => {
      const canonical = normalizeQueueEntry(appointment);
      const startAt = 
        appointment.startTime || 
        appointment.appointmentDate || 
        (appointment.date && appointment.time ? `${appointment.date}T${appointment.time}` : null);
      const parsed = startAt ? new Date(startAt) : null;

      return {
        id: canonical.entryId || canonical.appointmentId || appointment.id,
        patientName: canonical.patientName || "Unknown Patient",
        doctorName: canonical.doctorName || "Unassigned Doctor",
        doctorRole: String(appointment.doctor?.role || appointment.doctor?.user?.role || "DOCTOR").toUpperCase(),
        isDelegated:
          Boolean(canonical.primaryDoctorId || appointment.primaryDoctorId || appointment.metadata?.primaryDoctorId) &&
          String(canonical.primaryDoctorId || appointment.primaryDoctorId || appointment.metadata?.primaryDoctorId || "") !==
            String(canonical.assignedDoctorId || appointment.assignedDoctorId || appointment.metadata?.assignedDoctorId || appointment.doctorId || ""),
        status: canonical.status,
        timeLabel:
          parsed && !Number.isNaN(parsed.getTime())
            ? parsed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
            : appointment.time || "TBD",
        queuePosition: canonical.position > 0 ? canonical.position : null,
        waitLabel:
          typeof canonical.estimatedWaitTime === "number"
            ? `${canonical.estimatedWaitTime} min`
            : typeof (appointment as any).waitTime === "number"
              ? `${(appointment as any).waitTime} min`
              : typeof (appointment as any).waitTime === "string"
                ? (appointment as any).waitTime
                : "Pending",
        queueCategory: canonical.queueCategory,
      };
    });
  }, [appointmentsData]);

  const stats = useMemo(() => {
    const total = appointments.length;
    const scheduled = appointments.filter((item) => item.status === "SCHEDULED").length;
    const confirmed = appointments.filter((item) => item.status === "CONFIRMED").length;
    const inProgress = appointments.filter((item) => item.status === "IN_PROGRESS").length;
    const completed = appointments.filter((item) => item.status === "COMPLETED").length;

    return { total, scheduled, confirmed, inProgress, completed };
  }, [appointments]);

  const doctorBacklog = useMemo(() => {
    const grouped = new Map<
      string,
      {
        doctorName: string;
        scheduled: number;
        confirmed: number;
        inProgress: number;
        total: number;
        nextPatient: string | null;
      }
    >();

    for (const appointment of appointments) {
      const current = grouped.get(appointment.doctorName) || {
        doctorName: appointment.doctorName,
        scheduled: 0,
        confirmed: 0,
        inProgress: 0,
        total: 0,
        nextPatient: null,
      };

      current.total += 1;
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
  }, [appointments]);

  const activeQueue = useMemo(
    () =>
      appointments
        .filter((item) => item.status === "CONFIRMED" || item.status === "IN_PROGRESS")
        .sort((a, b) => (a.queuePosition ?? 999) - (b.queuePosition ?? 999)),
    [appointments]
  );

  const upcoming = useMemo(
    () =>
      appointments
        .filter((item) => item.status === "SCHEDULED")
        .slice(0, 8),
    [appointments]
  );

  const medicineDesk = useMemo(
    () =>
      (Array.isArray(medicineDeskQueue) ? medicineDeskQueue : [])
        .filter((entry: any) => entry?.id)
        .map((raw: any) => {
          const entry = normalizeQueueEntry(raw);
          return {
            id: entry.entryId,
            patientName: entry.patientName || "Unknown Patient",
            queuePosition: entry.position > 0 ? entry.position : null,
            paymentStatus: String(entry.paymentStatus || "PENDING").toUpperCase(),
            pendingAmount: Number(raw?.pendingAmount || 0),
            readyForHandover: Boolean(entry.readyForHandover),
          };
        })
        .slice(0, 6),
    [medicineDeskQueue]
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reception Dashboard</h1>
          <p className="text-muted-foreground">
            Live appointment backlog, queue intake, and today&apos;s clinic flow
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button asChild variant="outline">
            <Link href="/receptionist/check-in">
              <QrCode className="w-4 h-4 mr-2" />
              Confirm Arrival
            </Link>
          </Button>
          <Button asChild>
            <Link href="/receptionist/appointments">
              <Calendar className="w-4 h-4 mr-2" />
              New Appointment
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Today</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Scheduled</div>
            <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">{stats.scheduled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Queued</div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.confirmed}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-100/50 shadow-sm">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-slate-500">In Progress</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card className="border-emerald-100/50 shadow-sm">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-slate-500">Completed</div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Medicine Desk</div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {medicineDesk.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Doctor Backlog
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {doctorBacklog.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {appointmentsError
                  ? `Error loading appointments: ${appointmentsError.message}`
                  : isPending
                    ? "Loading clinic backlog..."
                    : "No doctor backlog for today."}
              </p>
            ) : (
              doctorBacklog.map((doctor) => (
                <div
                  key={doctor.doctorName}
                  className="rounded-xl border border-slate-100 bg-white dark:bg-slate-800/50 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between shadow-sm hover:border-emerald-100 transition-colors"
                >
                  <div>
                    <p className="font-semibold">{doctor.doctorName}</p>
                    <p className="text-sm text-muted-foreground">
                      {doctor.nextPatient ? `Next queued patient: ${doctor.nextPatient}` : "No patient waiting yet"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Scheduled {doctor.scheduled}</Badge>
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Queued {doctor.confirmed}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      In Progress {doctor.inProgress}
                    </Badge>
                    <Badge variant="outline">Total {doctor.total}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Active Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeQueue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No confirmed patients in the live queue.</p>
            ) : (
              activeQueue.slice(0, 8).map((appointment) => (
                <div key={appointment.id} className="rounded-xl border p-3 bg-card">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{appointment.patientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.doctorName}
                        {appointment.doctorRole === "ASSISTANT_DOCTOR" ? " (Assistant Doctor)" : ""}
                      </p>
                    </div>
                    <Badge className={STATUS_STYLES[appointment.status] || STATUS_STYLES.SCHEDULED}>
                      {appointment.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Time {appointment.timeLabel}</span>
                    <span>{getQueuePositionLabel({ position: appointment.queuePosition ?? 0 })}</span>
                    <span>Wait {appointment.waitLabel}</span>
                    {appointment.isDelegated ? <span>Delegated from primary doctor</span> : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="w-5 h-5" />
              Upcoming Scheduled Patients
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No more scheduled patients for today.</p>
          ) : (
            upcoming.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-xl border p-4 bg-card flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold">{appointment.patientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.doctorName}
                    {appointment.doctorRole === "ASSISTANT_DOCTOR" ? " (Assistant Doctor)" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span>{appointment.timeLabel}</span>
                  <Badge className={STATUS_STYLES[appointment.status] || STATUS_STYLES.SCHEDULED}>
                    {appointment.status.replaceAll("_", " ")}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold">Reception Intake</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Manually confirm a patient as arrived so they join the doctor queue.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/receptionist/check-in">Open Check-In Desk</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold">Schedule Patients</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Create appointments for walk-ins or assisted front-desk booking.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/receptionist/appointments#appointment-manager">Create Appointment</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold">Queue View</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Review scheduled backlog, queued patients, and live consultation state.
            </p>
            <Button asChild variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <Link href="/receptionist/appointments">Open Queue Workspace</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Medicine Desk Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {medicineDesk.length > 0 ? (
            <div className="space-y-3">
              {medicineDesk.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-semibold">{entry.patientName}</div>
                    <div className="text-sm text-muted-foreground">
                      {entry.queuePosition ? getQueuePositionLabel({ position: entry.queuePosition }) : "Medicine handover pending"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        entry.readyForHandover || entry.paymentStatus === "PAID"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                      }
                    >
                      {entry.readyForHandover || entry.paymentStatus === "PAID"
                        ? "Ready For Handover"
                        : "Awaiting Payment"}
                    </Badge>
                    {entry.pendingAmount > 0 ? (
                      <span className="text-sm font-medium text-muted-foreground">
                        INR {entry.pendingAmount.toFixed(2)}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No active medicine desk handovers right now.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
