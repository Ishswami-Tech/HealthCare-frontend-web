"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { hasAppointmentsLoadedForSession } from "@/hooks/query/useAppointments";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { AppointmentListSkeleton, StatCardSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";
import { formatISODateInIST } from "@/lib/utils/date-time";

export default function CounselorDashboard() {
  const { session } = useAuth();
  const user = session?.user;

  const counselorId = user?.id;
  const today = formatISODateInIST(new Date());
  const historyStartDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return formatISODateInIST(date);
  }, []);

  const { data: todayAppointmentsData, isPending: isAppointmentsPending } = useCounselorAppointments(
    counselorId,
    { startDate: today, endDate: today }
  );

  const { data: allAppointmentsData, isPending: isAllAppointmentsPending } = useCounselorAppointments(
    counselorId,
    { startDate: historyStartDate, endDate: today }
  );

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync();

  const todayAppointments = useMemo(() => todayAppointmentsData?.appointments || [], [todayAppointmentsData]);
  const allAppointments = useMemo(() => allAppointmentsData?.appointments || [], [allAppointmentsData]);

  // First-load-only skeleton gate: keep the previous list visible during
  // background refetches (focus, reconnect, WebSocket-driven merges) by
  // requiring a truly empty cache in addition to isPending. With
  // `placeholderData: keepPreviousData` set on the hook, the previous data
  // stays in `data`, so this gate correctly distinguishes "never loaded" from
  // "refreshing".
  const hasCachedToday = todayAppointments.length > 0;
  const hasCachedHistory = allAppointments.length > 0;
  // Session-level gate: don't flash skeleton during refetches within the
  // same session, even if the React Query cache is briefly empty.
  const sessionLoaded = hasAppointmentsLoadedForSession();
  const showTodaySkeleton = isAppointmentsPending && !hasCachedToday && !sessionLoaded;
  const showHistorySkeleton = isAllAppointmentsPending && !hasCachedHistory && !sessionLoaded;
  const showInitialLoading = showTodaySkeleton || showHistorySkeleton;

  const stats = useMemo(() => {
    let completedToday = 0;
    let totalDuration = 0;
    const uniqueClients = new Set<string>();

    for (const appointment of allAppointments) {
      uniqueClients.add(String(appointment.clientId || ""));
      totalDuration += parseInt(String(appointment.duration || 60), 10) || 60;
    }

    for (const appointment of todayAppointments) {
      if (appointment.status === "COMPLETED") {
        completedToday += 1;
      }
    }

    return {
      todaySessions: todayAppointments.length,
      completedToday,
      totalClients: uniqueClients.size,
      avgSessionDuration: allAppointments.length > 0 ? Math.round(totalDuration / allAppointments.length) : 0,
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

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Counselor"
        title="Counselor Dashboard"
        description="Track counseling sessions, client volume, and daily completion metrics from one workspace."
        meta={`${stats.totalClients} total clients`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {showInitialLoading ? (
          <>
            <StatCardSkeleton icon={<Calendar className="size-4" />} label="Today's Sessions" />
            <StatCardSkeleton icon={<CheckCircle className="size-4" />} label="Completed Today" />
            <StatCardSkeleton icon={<Users className="size-4" />} label="Total Clients" />
            <StatCardSkeleton icon={<Clock className="size-4" />} label="Avg. Duration" />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Today&apos;s Sessions
                </CardTitle>
                <Calendar className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.todaySessions}
                </div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completed Today
                </CardTitle>
                <CheckCircle className="size-4 text-green-600" />
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
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Clients
                </CardTitle>
                <Users className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClients}</div>
                <p className="text-xs text-muted-foreground">Under care</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Duration
                </CardTitle>
                <Clock className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.avgSessionDuration} min
                </div>
                <p className="text-xs text-muted-foreground">Per session</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="size-5" />
            Today&apos;s Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showInitialLoading ? (
            <AppointmentListSkeleton items={3} />
          ) : todayAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="size-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No sessions scheduled today</p>
            </div>
          ) : (
            <div className="gap-y-4">
              {todayAppointments.map((session: any) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Brain className="size-5 text-purple-600" />
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
              <MessageCircle className="size-6 text-blue-600" />
              <div>
                <div className="font-medium">Individual Counseling</div>
                <div className="text-sm text-gray-600">One-on-one</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <Users className="size-6 text-green-600" />
              <div>
                <div className="font-medium">Family Therapy</div>
                <div className="text-sm text-gray-600">Group sessions</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <Brain className="size-6 text-purple-600" />
              <div>
                <div className="font-medium">Cognitive Behavioral</div>
                <div className="text-sm text-gray-600">CBT approach</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}


