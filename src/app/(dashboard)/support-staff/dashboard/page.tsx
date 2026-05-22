"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "@/components/ui/loader";
import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  Users,
  AlertTriangle,
  Headphones,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useSupportStaffRequests } from "@/hooks/query/useSupportStaff";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { formatTimeInIST } from "@/lib/utils/date-time";

export default function SupportStaffDashboard() {
  const { session } = useAuth();
  const user = session?.user;
  const staffId = user?.id;

  const { data: requestsData, isPending } = useSupportStaffRequests({ staffId } as any);

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync();

  const requests = requestsData?.requests || [];

  const activeRequests = useMemo(() => {
    return requests
      .filter((r: any) => r.status === "pending" || r.status === "in_progress" || r.status === "OPEN")
      .slice(0, 5)
      .map((r: any) => ({
        id: r.id,
        type: r.type || "General Support",
        requester: r.requesterName || r.patient?.name || "Unknown User",
        priority: r.priority || "normal",
        time: r.createdAt ? formatTimeInIST(r.createdAt) : "Recent",
        status: r.status,
      }));
  }, [requests]);

  const stats = useMemo(() => {
    const active = requests.filter((r: any) => ["pending", "in_progress", "OPEN"].includes(r.status)).length;
    const completed = requests.filter((r: any) => ["completed", "RESOLVED", "CLOSED"].includes(r.status)).length;
    // Calculate avg response time from resolved requests that have both createdAt and updatedAt
    const resolved = requests.filter((r: any) =>
      ["completed", "RESOLVED", "CLOSED"].includes(r.status) && r.createdAt && r.updatedAt
    );
    let avgResponseTime = "N/A";
    if (resolved.length > 0) {
      const avgMs = resolved.reduce((sum: number, r: any) => {
        return sum + (new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime());
      }, 0) / resolved.length;
      const avgMins = Math.round(avgMs / 60000);
      avgResponseTime = avgMins < 60 ? `${avgMins} min` : `${Math.round(avgMins / 60)}h`;
    }
    return {
      activeRequests: active,
      resolvedToday: completed,
      totalRequests: requests.length,
      avgResponseTime,
    };
  }, [requests]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
      case "urgent":
      case "critical":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (["completed", "resolved", "closed"].includes(s)) return "bg-green-100 text-green-800";
    if (["pending", "open", "in_progress"].includes(s)) return "bg-amber-100 text-amber-800";
    return "bg-slate-100 text-slate-800";
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 gap-y-4 sm:p-6 sm:gap-y-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Support Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name || "Support"}! Here's your support overview.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <DashboardMetricCard
          label="Active Requests"
          value={stats.activeRequests}
          subtext="Awaiting response"
          accentClassName="border-orange-200 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/10"
          valueClassName="mt-1 text-2xl font-bold text-orange-600"
          labelClassName="text-orange-700 dark:text-orange-300"
          compact
        />
        <DashboardMetricCard
          label="Resolved Today"
          value={stats.resolvedToday}
          subtext="Issues closed"
          accentClassName="border-green-200 bg-green-50 dark:border-green-500/20 dark:bg-green-500/10"
          valueClassName="mt-1 text-2xl font-bold text-green-600"
          labelClassName="text-green-700 dark:text-green-300"
          compact
        />
        <DashboardMetricCard
          label="Total Requests"
          value={stats.totalRequests}
          subtext="This session"
          accentClassName="border-slate-200 bg-slate-50 dark:border-slate-500/20 dark:bg-slate-500/10"
          valueClassName="mt-1 text-2xl font-bold"
          labelClassName="text-slate-700 dark:text-slate-300"
          compact
        />
        <DashboardMetricCard
          label="Avg. Response"
          value={stats.avgResponseTime}
          subtext="First response time"
          accentClassName="border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10"
          valueClassName="mt-1 text-2xl font-bold text-blue-600"
          labelClassName="text-blue-700 dark:text-blue-300"
          compact
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-orange-600" />
            Support Queue
          </CardTitle>
          <Badge variant="outline">{activeRequests.length} Pending</Badge>
        </CardHeader>
        <CardContent>
          {activeRequests.length === 0 ? (
            <Empty className="min-h-[220px] border-border/70 bg-muted/20">
              <EmptyContent>
                <EmptyMedia variant="icon">
                  <MessageSquare className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No active support requests</EmptyTitle>
                <EmptyDescription>New requests will appear here once users submit them.</EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="gap-y-4">
              {activeRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <Headphones className="size-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold leading-none mb-1">{request.type}</h4>
                      <p className="text-sm text-muted-foreground">{request.requester}</p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="size-3" />
                        {request.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getPriorityColor(request.priority)}>
                      {request.priority.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(request.status)}>
                      {request.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-50/50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-blue-800">Knowledge Base</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-blue-700/80">Access quick solutions and FAQs for common patient inquiries.</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-800">Escalation Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-emerald-700/80">Review guidelines for escalating medical concerns to clinical staff.</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50/50 border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-purple-800">Service Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-purple-700/80">Check current clinic operational status and availability of departments.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


