"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  Clock,
  CheckCircle,
  Brain,
  Activity,
  Play,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useTherapistAppointments, useTherapistClients } from "@/hooks/query/useTherapist";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { usePatientStore } from "@/stores";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import {
  formatDateInIST,
  formatISODateInIST,
  getReceptionistAppointmentTimeLabel,
} from "@/lib/utils/appointmentUtils";

export default function TherapistDashboard() {
  useAuth();
  const { user } = useAuth();
  const clientsArray = usePatientStore((state) => state.collections.therapist);
  const therapistId = useMemo(() => {
    return user?.id || "";
  }, [user?.id]);

  // Fetch real data using hooks
  const { data: appointmentsData, isPending: isPendingAppointments } = useTherapistAppointments(therapistId);
  const { isPending: isPendingClients } = useTherapistClients(therapistId);

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  // Calculate stats from real data
  const appointmentsArray = appointmentsData?.appointments || [];
  const stats = useMemo(() => {
    const today = formatISODateInIST(new Date());
    const todayAppointments = appointmentsArray.filter(
      (apt: any) => formatISODateInIST(apt.date || apt.startTime || apt.createdAt) === today
    );

    return {
      todayAppointments: todayAppointments.length,
      completedToday: todayAppointments.filter((a: any) => a.status === "COMPLETED").length,
      totalPatients: clientsArray.length,
      avgSessionDuration: appointmentsArray.length > 0
        ? Math.round(appointmentsArray.reduce((sum: number, a: any) => sum + (parseInt(a.duration) || 60), 0) / appointmentsArray.length)
        : 0,
    };
  }, [appointmentsArray, clientsArray]);

  const recentPatients = useMemo(() => {
    return clientsArray.slice(0, 3).map((client: any) => ({
      name: client.name,
      lastVisit: client.lastVisit,
      condition: client.condition,
      sessionsCompleted: client.sessionsCompleted || 0,
    }));
  }, [clientsArray]);

  const recentSessions = useMemo(() => {
    return appointmentsArray
      .slice()
      .sort((a: any, b: any) => {
        const first = new Date(`${a.date || ""}T${a.time || "00:00"}`).getTime();
        const second = new Date(`${b.date || ""}T${b.time || "00:00"}`).getTime();
        if (Number.isNaN(first) && Number.isNaN(second)) return 0;
        if (Number.isNaN(first)) return 1;
        if (Number.isNaN(second)) return -1;
        return second - first;
      })
      .slice(0, 5)
      .map((apt: any) => ({
        id: apt.id,
        patientName: apt.patientName,
        time: apt.time,
        date: apt.date,
        type: apt.type,
        duration: apt.duration,
        status: apt.status,
        notes: apt.notes,
      }));
  }, [appointmentsArray]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "SCHEDULED":
        return "bg-gray-100 text-gray-800";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return <Play className="w-4 h-4" />;
      case "CONFIRMED":
        return <CheckCircle className="w-4 h-4" />;
      case "SCHEDULED":
        return <Clock className="w-4 h-4" />;
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "Confirmed";
      case "IN_PROGRESS":
        return "In Progress";
      case "SCHEDULED":
        return "Scheduled";
      case "COMPLETED":
        return "Completed";
      default:
        return status.replaceAll("_", " ").toLowerCase();
    }
  };

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Therapist"
        title="Therapist Dashboard"
        description="Review sessions, client activity, and care progress from a unified therapist workspace."
        meta={
          <span className="text-sm font-medium text-muted-foreground">
            {stats.totalPatients} active clients
          </span>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <DashboardMetricCard
          label="Today's Sessions"
          value={stats.todayAppointments}
          subtext={`${stats.completedToday} completed`}
          accentClassName="border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10"
          valueClassName="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-100"
          labelClassName="text-blue-700 dark:text-blue-300"
          compact
        />
        <DashboardMetricCard
          label="Completed Today"
          value={stats.completedToday}
          subtext="Procedural sessions finished"
          accentClassName="border-green-200 bg-green-50 dark:border-green-500/20 dark:bg-green-500/10"
          valueClassName="mt-1 text-2xl font-bold text-green-600"
          labelClassName="text-green-700 dark:text-green-300"
          compact
        />
        <DashboardMetricCard
          label="Total Clients"
          value={stats.totalPatients}
          subtext="Under care"
          accentClassName="border-slate-200 bg-slate-50 dark:border-slate-500/20 dark:bg-slate-500/10"
          valueClassName="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100"
          labelClassName="text-slate-700 dark:text-slate-300"
          compact
        />
        <DashboardMetricCard
          label="Avg. Session"
          value={`${stats.avgSessionDuration} min`}
          subtext="Per session"
          accentClassName="border-indigo-200 bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/10"
          valueClassName="mt-1 text-2xl font-bold text-indigo-900 dark:text-indigo-100"
          labelClassName="text-indigo-700 dark:text-indigo-300"
          compact
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isPendingAppointments ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : recentSessions.length === 0 ? (
              <Empty>
                <EmptyContent>
                  <EmptyMedia>
                    <Calendar className="h-5 w-5" />
                  </EmptyMedia>
                  <EmptyTitle>No recent appointments found</EmptyTitle>
                  <EmptyDescription>
                    Recent sessions will appear here once appointments are scheduled for this therapist.
                  </EmptyDescription>
                </EmptyContent>
              </Empty>
            ) : (
              <div className="space-y-4">
                {recentSessions.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Brain className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{appointment.patientName}</h4>
                        <p className="text-sm text-gray-600">
                          {appointment.type} - {appointment.duration}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {appointment.notes}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {getReceptionistAppointmentTimeLabel(appointment as Record<string, unknown>)}
                      </div>
                        <Badge
                          className={`${getStatusColor(appointment.status)} flex items-center gap-1`}
                        >
                          {getStatusIcon(appointment.status)}
                        {getStatusLabel(appointment.status)}
                        </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Recent Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isPendingClients ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : clientsArray.length === 0 ? (
              <Empty>
                <EmptyContent>
                  <EmptyMedia>
                    <Users className="h-5 w-5" />
                  </EmptyMedia>
                  <EmptyTitle>No clients found</EmptyTitle>
                  <EmptyDescription>
                    Assigned clients will appear here once they are linked to this therapist.
                  </EmptyDescription>
                </EmptyContent>
              </Empty>
            ) : (
              <div className="space-y-4">
                {recentPatients.map((client, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{client.name}</h4>
                        <p className="text-sm text-gray-600">{client.condition}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>Sessions: {client.sessionsCompleted}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Last:{" "}
                            {formatDateInIST(client.lastVisit, { day: "2-digit", month: "short", year: "numeric" }, "en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">
                        {client.sessionsCompleted} sessions
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Specialties */}
      <Card>
        <CardHeader>
          <CardTitle>Your Specialties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
              <div>
                <div className="font-medium">Cognitive Behavioral Therapy</div>
                <div className="text-sm text-gray-600">Primary focus</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Brain className="w-6 h-6 text-blue-600" />
              <div>
                <div className="font-medium">Mindfulness & Meditation</div>
                <div className="text-sm text-gray-600">Specialty</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
              <div>
                <div className="font-medium">Stress Management</div>
                <div className="text-sm text-gray-600">Expertise</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}
