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
import { useClinicContext } from "@/hooks/query/useClinics";
import { useTherapistAppointments, useTherapistClients } from "@/hooks/query/useTherapist";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";

export default function TherapistDashboard() {
  useAuth();
  const { user } = useAuth();
  const { clinicId } = useClinicContext();

  // Fetch real data using hooks
  const { data: appointmentsData, isPending: isPendingAppointments } = useTherapistAppointments(clinicId);
  const { data: clientsData, isPending: isPendingClients } = useTherapistClients(clinicId);

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  // Extract therapist ID from user
  const therapistId = useMemo(() => {
    return user?.id || "";
  }, [user?.id]);

  // Calculate stats from real data
  const appointmentsArray = appointmentsData?.appointments || [];
  const clientsArray = clientsData?.clients || [];

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayAppointments = appointmentsArray.filter(
      (apt: any) => apt.date === today
    );

    return {
      todayAppointments: todayAppointments.length,
      completedToday: todayAppointments.filter((a: any) => a.status === "COMPLETED").length,
      totalPatients: clientsArray.length,
      avgSessionDuration: 45,
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

  const todaySessions = useMemo(() => {
    const today = new Date().toDateString();
    return appointmentsArray
      .filter((apt: any) => apt.date === today)
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Therapist Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here's your overview for today.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Sessions
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.todayAppointments}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.completedToday} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.completedToday}
            </div>
            <p className="text-xs text-muted-foreground">
              Therapy sessions finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Clients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">Under care</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Session
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgSessionDuration} min
            </div>
            <p className="text-xs text-muted-foreground">Per session</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today&apos;s Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isPendingAppointments ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : todaySessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No appointments scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaySessions.map((appointment) => (
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
                      <div className="font-medium">{appointment.time}</div>
                      <Badge
                        className={`${getStatusColor(appointment.status)} flex items-center gap-1`}
                      >
                        {getStatusIcon(appointment.status)}
                        {appointment.status.replace("_", " ").toLowerCase()}
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
              <div className="text-center py-8">
                <p className="text-gray-500">No clients found</p>
              </div>
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
                            {new Date(client.lastVisit).toLocaleDateString("en-IN")}
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

      {/* Therapy Specialties */}
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
    </div>
  );
}
