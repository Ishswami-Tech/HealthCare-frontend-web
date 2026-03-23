"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "@/components/ui/loader";
import {
  Users,
  Calendar,
  CheckCircle,
  MessageCircle,
  Clock,
  Brain,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCounselorAppointments } from "@/hooks/query/useCounselor";
import { useWebSocketQuerySync } from "@/hooks/query/utils/use-websocket-query-sync";

export default function CounselorDashboard() {
  const { session } = useAuth();
  const user = session?.user;

  const counselorId = user?.id;
  const today = new Date().toISOString().split('T')[0];

  const { data: todayAppointmentsData, isPending: isAppointmentsPending } = useCounselorAppointments(
    counselorId,
    { startDate: today, endDate: today }
  );

  const { data: allAppointmentsData, isPending: isAllAppointmentsPending } = useCounselorAppointments(
    counselorId,
    { startDate: today }
  );

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync([['counselorAppointments', counselorId]]);

  const todayAppointments = todayAppointmentsData?.appointments || [];
  const allAppointments = allAppointmentsData?.appointments || [];

  const stats = useMemo(() => {
    const completedToday = todayAppointments.filter((a: any) => a.status === "COMPLETED").length;
    return {
      todaySessions: todayAppointments.length,
      completedToday,
      totalClients: new Set(allAppointments.map((a: any) => a.clientId)).size,
      avgSessionDuration: allAppointments.length > 0
        ? Math.round(allAppointments.reduce((sum: number, a: any) => {
            const duration = parseInt(a.duration) || 60;
            return sum + duration;
          }, 0) / allAppointments.length)
        : 55,
    };
  }, [todayAppointments, allAppointments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "SCHEDULED":
        return "bg-gray-100 text-gray-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isAppointmentsPending || isAllAppointmentsPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Counselor Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here's your counseling overview.
        </p>
      </div>

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
              {stats.todaySessions}
            </div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
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
              Sessions finished
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
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">Under care</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Duration
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Today&apos;s Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No sessions scheduled today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayAppointments.map((session: any) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Brain className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{session.clientName}</h4>
                      <p className="text-sm text-gray-600">
                        {session.type} - {session.duration}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{session.time}</div>
                    <Badge className={getStatusColor(session.status)}>
                      {session.status.toLowerCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Counseling Specialties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <MessageCircle className="w-6 h-6 text-blue-600" />
              <div>
                <div className="font-medium">Individual Counseling</div>
                <div className="text-sm text-gray-600">One-on-one</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
              <div>
                <div className="font-medium">Family Therapy</div>
                <div className="text-sm text-gray-600">Group sessions</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
              <div>
                <div className="font-medium">Cognitive Behavioral</div>
                <div className="text-sm text-gray-600">CBT approach</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
