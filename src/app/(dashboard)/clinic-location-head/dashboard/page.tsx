"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "@/components/ui/loader";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useAuth } from "@/hooks/auth/useAuth";
import { useAppointments } from "@/hooks/query/useAppointments";
import { useQueue, useQueueStats } from "@/hooks/query/useQueue";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import { formatISODateInIST, getAppointmentDateTimeValue } from "@/lib/utils/appointmentUtils";
import {
  Building2,
  Calendar,
  Activity,
  ClipboardList,
  Users,
  ArrowRight,
  CheckCircle,
  Clock,
  Wallet,
  MapPin,
} from "lucide-react";

export default function ClinicLocationHeadDashboard() {
  const router = useRouter();
  const { session } = useAuth();
  const user = session?.user;
  const clinicId = user?.clinicId;

  useWebSocketQuerySync();

  const today = useMemo(() => formatISODateInIST(new Date()), []);
  const historyStartDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return formatISODateInIST(date);
  }, []);
  const futureEndDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 365);
    return formatISODateInIST(date);
  }, []);

  const { data: appointmentsResult, isPending: appointmentsPending } = useAppointments(
    clinicId ? { clinicId, startDate: historyStartDate, ...(futureEndDate ? { endDate: futureEndDate } : {}) } : undefined
  );

  const { data: queueData, isPending: queuePending } = useQueue(clinicId ?? undefined, {
    ...(today ? { date: today } : {}),
    enabled: !!clinicId,
  });

  const { data: queueStatsRaw } = useQueueStats(clinicId ?? "");

  const appointments = useMemo(() => {
    const raw = appointmentsResult?.appointments ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [appointmentsResult]);

  const todayAppointments = useMemo(
    () =>
      appointments.filter((appointment: Record<string, unknown>) => {
        const dateTime = getAppointmentDateTimeValue(appointment);
        const aptDate =
          (dateTime ? formatISODateInIST(dateTime) : "") ||
          formatISODateInIST(String(appointment.date || appointment.appointmentDate || ""));
        return aptDate === today;
      }),
    [appointments, today]
  );

  const queueEntries = useMemo(() => {
    const raw = Array.isArray(queueData)
      ? queueData
      : (queueData as { entries?: unknown[] })?.entries ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [queueData]);

  const queueStats = queueStatsRaw as Record<string, unknown> | undefined;

  const stats = useMemo(() => {
    const totalToday = todayAppointments.length;
    const completed = todayAppointments.filter(
      (a: Record<string, unknown>) => String(a.status ?? "").toUpperCase() === "COMPLETED"
    ).length;
    const waiting = queueEntries.filter(
      (e: Record<string, unknown>) => String(e.status ?? "").toUpperCase() === "WAITING"
    ).length;
    const inProgress = todayAppointments.filter(
      (a: Record<string, unknown>) => String(a.status ?? "").toUpperCase() === "IN_PROGRESS"
    ).length;

    return { totalToday, completed, waiting, inProgress };
  }, [todayAppointments, queueEntries]);

  const upcomingAppointments = useMemo(
    () =>
      [...appointments]
        .filter((a: Record<string, unknown>) => {
          const s = String(a.status ?? "").toUpperCase();
          return ["SCHEDULED", "CONFIRMED", "WAITING", "IN_PROGRESS"].includes(s);
        })
        .sort((left: Record<string, unknown>, right: Record<string, unknown>) => {
          const leftTime = new Date(
            String(left.date || left.appointmentDate || left.createdAt || left.updatedAt || 0)
          ).getTime();
          const rightTime = new Date(
            String(right.date || right.appointmentDate || right.createdAt || right.updatedAt || 0)
          ).getTime();
          return rightTime - leftTime;
        })
        .slice(0, 5),
    [appointments]
  );

  const isLoading =
    appointmentsPending && queuePending && appointments.length === 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 sm:p-6 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Location Overview</h1>
          <p className="text-muted-foreground">
            {user?.name ? `${user.name} · ` : ""}Clinic Location Head · {today}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push("/clinic-location-head/check-in")}
          >
            <ClipboardList className="w-4 h-4" />
            Check-In
          </Button>
          <Button className="gap-2" onClick={() => router.push("/queue")}>
            <Activity className="w-4 h-4" />
            Live Queue
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <DashboardMetricCard
          label="Today"
          value={stats.totalToday}
          subtext="Total appointments"
          accentClassName="border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10"
          valueClassName="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-100"
          labelClassName="text-blue-700 dark:text-blue-300"
          compact
        />
        <DashboardMetricCard
          label="Queue"
          value={queueStats ? Number(queueStats.waiting ?? stats.waiting) : stats.waiting}
          subtext="Waiting patients"
          accentClassName="border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10"
          valueClassName="mt-1 text-2xl font-bold text-emerald-900 dark:text-emerald-100"
          labelClassName="text-emerald-700 dark:text-emerald-300"
          compact
        />
        <DashboardMetricCard
          label="In Progress"
          value={stats.inProgress}
          subtext="Active consultations"
          accentClassName="border-indigo-200 bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/10"
          valueClassName="mt-1 text-2xl font-bold text-indigo-900 dark:text-indigo-100"
          labelClassName="text-indigo-700 dark:text-indigo-300"
          compact
        />
        <DashboardMetricCard
          label="Completed"
          value={stats.completed}
          subtext="Done today"
          accentClassName="border-green-200 bg-green-50 dark:border-green-500/20 dark:bg-green-500/10"
          valueClassName="mt-1 text-2xl font-bold text-green-900 dark:text-green-100"
          labelClassName="text-green-700 dark:text-green-300"
          compact
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Appointments */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Recent Appointments
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-blue-600"
              onClick={() => router.push("/clinic-location-head/appointments")}
            >
              See all <ArrowRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <Empty className="min-h-[200px] border-border/70 bg-muted/20">
                <EmptyContent>
                  <EmptyMedia variant="icon">
                    <Calendar className="h-5 w-5" />
                  </EmptyMedia>
                  <EmptyTitle>No recent appointments found</EmptyTitle>
                  <EmptyDescription>Scheduled visits for this location will appear here.</EmptyDescription>
                </EmptyContent>
              </Empty>
            ) : (
              <div className="space-y-2">
                {upcomingAppointments.map((apt: Record<string, unknown>, idx: number) => {
                  const status = String(apt.status ?? "").toUpperCase();
                  const isActive = status === "IN_PROGRESS";
                  const patientName =
                    (apt.patientName as string) ??
                    ((apt.patient as Record<string, unknown>)?.name as string) ??
                    "Patient";
                  const doctorName =
                    (apt.doctorName as string) ??
                    ((apt.doctor as Record<string, unknown>)?.name as string) ??
                    "";
                  const time = (apt.scheduledTime as string) ?? (apt.time as string) ?? "";

                  return (
                    <div
                      key={(apt.id as string) ?? idx}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isActive ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            isActive ? "bg-blue-500 animate-pulse" : "bg-slate-300"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium">{patientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {time}
                            {doctorName ? ` · Dr. ${doctorName}` : ""}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={`text-xs border-none ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="flex flex-col h-20 gap-1 border-slate-100 hover:bg-blue-50"
                onClick={() => router.push("/clinic-location-head/locations")}
              >
                <MapPin className="w-5 h-5 text-blue-600" />
                <span className="text-[11px] font-medium text-slate-600">Locations</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col h-20 gap-1 border-slate-100 hover:bg-emerald-50"
                onClick={() => router.push("/queue")}
              >
                <Activity className="w-5 h-5 text-emerald-600" />
                <span className="text-[11px] font-medium text-slate-600">Queue</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col h-20 gap-1 border-slate-100 hover:bg-amber-50"
                onClick={() => router.push("/clinic-location-head/appointments")}
              >
                <Calendar className="w-5 h-5 text-amber-600" />
                <span className="text-[11px] font-medium text-slate-600">Appointments</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col h-20 gap-1 border-slate-100 hover:bg-purple-50"
                onClick={() => router.push("/clinic-location-head/check-in")}
              >
                <ClipboardList className="w-5 h-5 text-purple-600" />
                <span className="text-[11px] font-medium text-slate-600">Check-In</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col h-20 gap-1 border-slate-100 hover:bg-slate-50 col-span-2"
                onClick={() => router.push("/billing")}
              >
                <Wallet className="w-5 h-5 text-slate-600" />
                <span className="text-[11px] font-medium text-slate-600">Billing</span>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
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
                <span className="text-muted-foreground">In progress</span>
                <span className="font-semibold text-blue-600">{stats.inProgress}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Queue waiting</span>
                <span className="font-semibold text-amber-600">{stats.waiting}</span>
              </div>
              {stats.totalToday > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Completion rate</span>
                    <span>
                      {Math.round((stats.completed / stats.totalToday) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.round((stats.completed / stats.totalToday) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Manage your clinic locations and their schedules.
              </p>
              <Button
                className="w-full gap-2"
                variant="outline"
                onClick={() => router.push("/clinic-location-head/locations")}
              >
                <Building2 className="w-4 h-4" />
                Manage Locations
                <ArrowRight className="w-3 h-3 ml-auto" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
