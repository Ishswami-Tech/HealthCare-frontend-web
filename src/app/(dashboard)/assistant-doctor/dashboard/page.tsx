"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import { useAppointments } from "@/hooks/query/useAppointments";
import { useQueue } from "@/hooks/query/useQueue";
import { useDoctors } from "@/hooks/query/useDoctors";
import { useAssistantDoctorCoverage } from "@/hooks/query/useAppointments";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { formatDateInIST, formatISODateInIST, getAppointmentDateTimeValue } from "@/lib/utils/appointmentUtils";
import {
  Calendar,
  Users,
  Activity,
  Pill,
  Video,
  Clock,
  CheckCircle,
  Loader2,
  ArrowRight,
  Stethoscope,
  ShieldCheck,
  HeartPulse,
  ClipboardList,
} from "lucide-react";

type DoctorListItem = {
  id: string;
  name: string;
  role: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export default function AssistantDoctorDashboard() {
  const router = useRouter();
  const { session } = useAuth();
  const user = session?.user;
  const clinicId = user?.clinicId;
  const userId = user?.id;

  useWebSocketQuerySync();

  const today = useMemo(() => formatISODateInIST(new Date()), []);
  const historyStartDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return formatISODateInIST(date);
  }, []);
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const workspaceLinks = useMemo(
    () => ({
      appointments: "/assistant-doctor/appointments",
      patients: "/assistant-doctor/patients",
      prescriptions: "/assistant-doctor/prescriptions",
      video: "/assistant-doctor/video",
      coverage: "/assistant-doctor/coverage",
      queue: "/queue",
    }),
    []
  );

  const { data: assistantCoverageData = [] } = useAssistantDoctorCoverage();
  const { data: doctorsData } = useDoctors(clinicId || "", { limit: 200 });

  const { data: appointmentsResult, isPending: appointmentsPending } = useAppointments(
    clinicId && userId
      ? {
          clinicId,
          doctorId: userId,
          startDate: historyStartDate,
          ...(today ? { endDate: today } : {}),
        }
      : undefined
  );

  const { data: queueData, isPending: queuePending } = useQueue(clinicId ?? undefined, {
    ...(userId ? { doctorId: userId } : {}),
    ...(today ? { date: today } : {}),
    enabled: !!clinicId,
  });

  const appointments = useMemo(() => {
    const raw = appointmentsResult?.appointments ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [appointmentsResult]);

  const todayAppointments = useMemo(
    () =>
      appointments.filter((appointment: Record<string, unknown>) => {
        const dateTime = getAppointmentDateTimeValue(appointment);
        const aptDate =
          (dateTime
            ? formatDateInIST(dateTime, { year: "numeric", month: "2-digit", day: "2-digit" }, "en-CA")
            : "") ||
          formatISODateInIST(String(appointment.date || appointment.appointmentDate || ""));
        return aptDate === today;
      }),
    [appointments, today]
  );

  const queueEntries = useMemo(() => {
    const raw = Array.isArray(queueData) ? queueData : (queueData as { entries?: unknown[] })?.entries ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [queueData]);

  const doctors = useMemo<DoctorListItem[]>(() => {
    const raw = doctorsData as unknown;
    const arr = Array.isArray(raw)
      ? raw
      : isRecord(raw) && Array.isArray(raw.data)
        ? raw.data
        : isRecord(raw) && isRecord(raw.data) && Array.isArray(raw.data.doctors)
          ? raw.data.doctors
          : [];

    return arr
      .map((doctorValue) => {
        const doctorRecord = isRecord(doctorValue) ? doctorValue : {};
        const nestedDoctor = isRecord(doctorRecord.doctor) ? doctorRecord.doctor : {};
        const nestedUser = isRecord(nestedDoctor.user) ? nestedDoctor.user : {};

        return {
          id: String(nestedDoctor.id ?? doctorRecord.id ?? ""),
          name: String(doctorRecord.name ?? nestedUser.name ?? "Doctor"),
          role: String(doctorRecord.role ?? nestedUser.role ?? "").toUpperCase(),
        };
      })
      .filter((doctor) => !!doctor.id);
  }, [doctorsData]);

  const primaryDoctors = useMemo(
    () => doctors.filter((doctor) => doctor.role === "DOCTOR"),
    [doctors]
  );

  const assistantCoverage = useMemo(() => {
    if (!userId) return null;
    return assistantCoverageData.find((entry) => entry.assistantDoctorId === userId) ?? null;
  }, [assistantCoverageData, userId]);

  const assistantCoveragePrimaryDoctors = useMemo(() => {
    if (!assistantCoverage) return [];

    return assistantCoverage.primaryDoctorIds
      .map((primaryDoctorId) => primaryDoctors.find((doctor) => doctor.id === primaryDoctorId))
      .filter((doctor): doctor is DoctorListItem => Boolean(doctor));
  }, [assistantCoverage, primaryDoctors]);

  const stats = useMemo(() => {
    const myAppointments = userId
      ? todayAppointments.filter((a: Record<string, unknown>) => {
          const doctorId = (a.doctorId ?? a.doctor_id ?? (a.doctor as Record<string, unknown>)?.id) as string | undefined;
          return !doctorId || doctorId === userId;
        })
      : todayAppointments;

    return {
      todayTotal: myAppointments.length,
      arrived: myAppointments.filter(
        (a: Record<string, unknown>) => Boolean(a.checkedInAt) || String(a.status ?? "").toUpperCase() === "IN_PROGRESS"
      ).length,
      completed: myAppointments.filter(
        (a: Record<string, unknown>) => String(a.status ?? "").toUpperCase() === "COMPLETED"
      ).length,
      inProgress: myAppointments.filter(
        (a: Record<string, unknown>) => String(a.status ?? "").toUpperCase() === "IN_PROGRESS"
      ).length,
      pendingArrival: myAppointments.filter((a: Record<string, unknown>) => {
        const s = String(a.status ?? "").toUpperCase();
        return s === "SCHEDULED" || s === "CONFIRMED" || s === "WAITING";
      }).length,
      queueCount: queueEntries.filter(
        (e: Record<string, unknown>) => String(e.status ?? "").toUpperCase() === "WAITING"
      ).length,
    };
  }, [todayAppointments, queueEntries, userId]);

  const supportLaneStats = useMemo(() => {
    const activeCoverage = assistantCoverage?.isActive ? 1 : 0;
    const coveredPrimaryDoctors = assistantCoveragePrimaryDoctors.length;
    const todayClinicalLoad = stats.todayTotal + stats.queueCount;

    return {
      activeCoverage,
      coveredPrimaryDoctors,
      todayClinicalLoad,
      coverageLabel:
        assistantCoverage?.isActive && coveredPrimaryDoctors > 0
          ? "Coverage active"
          : "Coverage needs review",
    };
  }, [assistantCoverage, assistantCoveragePrimaryDoctors, stats.queueCount, stats.todayTotal]);

  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter((a: Record<string, unknown>) => {
        const s = String(a.status ?? "").toUpperCase();
        return s === "SCHEDULED" || s === "CONFIRMED" || s === "WAITING" || s === "IN_PROGRESS";
      })
      .slice(0, 5);
  }, [appointments]);

  const isLoading = appointmentsPending && queuePending && appointments.length === 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardPageShell className="p-4 sm:p-6">
      <DashboardPageHeader
        eyebrow="Assistant Doctor"
        title={`${greeting}${user?.name ? `, Dr. ${user.name.split(" ")[0]}` : ""}`}
        description="Monitor your assigned queue, today's appointments, and quick clinical actions from one place."
        meta={<span className="text-sm font-medium text-muted-foreground">{today}</span>}
        actionsSlot={
          <Button
            className="gap-2"
            onClick={() => router.push(workspaceLinks.appointments)}
          >
            <Calendar className="w-4 h-4" />
            View All Appointments
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-blue-200 bg-blue-50 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-tight text-blue-700 dark:text-blue-300">
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.todayTotal}</div>
            <p className="mt-1 text-xs text-blue-700/80 dark:text-blue-200/80">Appointments</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-tight text-amber-700 dark:text-amber-300">
              To Arrive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">{stats.pendingArrival}</div>
            <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-200/80">To see</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-tight text-emerald-700 dark:text-emerald-300">
              Arrived
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{stats.arrived}</div>
            <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-200/80">Ready to work</p>
          </CardContent>
        </Card>
        <Card className="border-indigo-200 bg-indigo-50 shadow-sm dark:border-indigo-500/20 dark:bg-indigo-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-tight text-indigo-700 dark:text-indigo-300">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{stats.inProgress}</div>
            <p className="mt-1 text-xs text-indigo-700/80 dark:text-indigo-200/80">Active now</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50 shadow-sm dark:border-green-500/20 dark:bg-green-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-tight text-green-700 dark:text-green-300">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.completed}</div>
            <p className="mt-1 text-xs text-green-700/80 dark:text-green-200/80">Done today</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-slate-50 shadow-sm dark:border-slate-500/20 dark:bg-slate-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-tight text-slate-700 dark:text-slate-300">
              Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.queueCount}</div>
            <p className="mt-1 text-xs text-slate-700/80 dark:text-slate-200/80">Waiting</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-emerald-200/70 bg-emerald-50/60 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10">
        <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Assistant-doctor support lane
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Coverage, handoffs, and the live queue are aligned here so assistant-doctor work stays on one operational track.
            </p>
          </div>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-100 text-emerald-700">
            {supportLaneStats.coverageLabel}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-background/80 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <HeartPulse className="h-4 w-4 text-emerald-600" />
              Coverage status
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">
              {assistantCoverage?.isActive ? "Active" : "Inactive"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Managed from clinic admin, read-only here for assistant-doctor review.
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/80 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4 text-blue-600" />
              Primary doctors covered
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">
              {supportLaneStats.coveredPrimaryDoctors}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {assistantCoveragePrimaryDoctors.length > 0 ? (
                assistantCoveragePrimaryDoctors.map((doctor) => (
                  <Badge
                    key={doctor.id}
                    variant="secondary"
                    className="rounded-full bg-blue-50 text-blue-700"
                  >
                    {doctor.name}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">
                  No active primary doctor coverage assigned yet.
                </span>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/80 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ClipboardList className="h-4 w-4 text-purple-600" />
              Daily support load
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">
              {supportLaneStats.todayClinicalLoad}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Today&apos;s appointments plus live queue items requiring follow-up.
            </p>
          </div>
        </CardContent>
        <CardContent className="flex flex-wrap gap-2 pt-0">
          <Button className="gap-2" onClick={() => router.push(workspaceLinks.coverage)}>
            <ShieldCheck className="h-4 w-4" />
            Open coverage lane
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => router.push(workspaceLinks.queue)}>
            <Activity className="h-4 w-4" />
            Open queue
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-600" />
              Today&apos;s Appointments
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-blue-600"
              onClick={() => router.push(workspaceLinks.appointments)}
            >
              See all <ArrowRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No appointments scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((apt: Record<string, unknown>, idx: number) => {
                  const status = String(apt.status ?? "").toUpperCase();
                  const isInProgress = status === "IN_PROGRESS";
                  const patientName =
                    (apt.patientName as string) ??
                    ((apt.patient as Record<string, unknown>)?.name as string) ??
                    "Unknown Patient";
                  const time =
                    (apt.scheduledTime as string) ??
                    (apt.time as string) ??
                    "";
                  const type =
                    (apt.appointmentType as string) ??
                    (apt.type as string) ??
                    "GENERAL";

                  return (
                    <div
                      key={(apt.id as string) ?? idx}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isInProgress
                          ? "bg-blue-50 border-blue-200"
                          : "bg-slate-50 border-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isInProgress ? "bg-blue-500 animate-pulse" : "bg-slate-300"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium">{patientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {time} - {String(type).replace(/_/g, " ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={isInProgress ? "default" : "secondary"}
                          className={
                            isInProgress
                              ? "bg-blue-600 border-none text-xs"
                              : "bg-slate-100 text-slate-600 border-none text-xs"
                          }
                        >
                          {status.replace(/_/g, " ")}
                        </Badge>
                        {isInProgress && (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                            onClick={() => router.push("/queue")}
                          >
                            Resume
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="flex flex-col h-20 gap-1 border-slate-100 hover:bg-blue-50"
                onClick={() => router.push("/queue")}
              >
                <Activity className="w-5 h-5 text-blue-600" />
                <span className="text-[11px] font-medium text-slate-600">Queue</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col h-20 gap-1 border-slate-100 hover:bg-emerald-50"
                onClick={() => router.push(workspaceLinks.patients)}
              >
                <Users className="w-5 h-5 text-emerald-600" />
                <span className="text-[11px] font-medium text-slate-600">Patients</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col h-20 gap-1 border-slate-100 hover:bg-amber-50"
                onClick={() => router.push(workspaceLinks.prescriptions)}
              >
                <Pill className="w-5 h-5 text-amber-600" />
                <span className="text-[11px] font-medium text-slate-600">Prescriptions</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col h-20 gap-1 border-slate-100 hover:bg-purple-50"
                onClick={() => router.push(workspaceLinks.video)}
              >
                <Video className="w-5 h-5 text-purple-600" />
                <span className="text-[11px] font-medium text-slate-600">Video</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col h-20 gap-1 border-slate-100 hover:bg-emerald-50"
                onClick={() => router.push(workspaceLinks.coverage)}
              >
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-[11px] font-medium text-slate-600">Coverage</span>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Day Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> {stats.completed}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">To arrive</span>
                <span className="font-semibold text-amber-600">{stats.pendingArrival}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Queue waiting</span>
                <span className="font-semibold">{stats.queueCount}</span>
              </div>
              {stats.todayTotal > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{Math.round((stats.completed / stats.todayTotal) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.round((stats.completed / stats.todayTotal) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardPageShell>
  );
}
