"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "@/components/ui/loader";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  Users,
  AlertTriangle,
  Headphones,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useClinicContext } from "@/contexts/clinic-context";
import { useSupportStaffRequests } from "@/hooks/query/useSupportStaff";
import { useWebSocketQuerySync } from "@/hooks/query/utils/use-websocket-query-sync";

export default function SupportStaffDashboard() {
  const { user } = useAuth();
  const { clinicId } = useClinicContext();

  const staffId = user?.id;

  const { data: requestsData, isPending } = useSupportStaffRequests(staffId);

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync([['supportStaffRequests', staffId]]);

  const requests = requestsData?.requests || [];

  const activeRequests = requests
    .filter((r: any) => r.status === "pending" || r.status === "in_progress")
    .slice(0, 3)
    .map((r: any) => ({
      id: r.id,
      type: r.type,
      requester: r.requesterName,
      priority: r.priority,
      time: new Date(r.createdAt).toLocaleTimeString(),
      status: r.status,
    }));

  const stats = useMemo(() => {
    const active = requests.filter((r: any) => r.status === "pending" || r.status === "in_progress").length;
    const completed = requests.filter((r: any) => r.status === "completed").length;
    return {
      activeRequests: active,
      resolvedToday: completed,
      totalRequests: requests.length,
      avgResponseTime: "5 min",
    };
  }, [requests]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Support Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here's your support overview.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Requests
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.activeRequests}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Resolved Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.resolvedToday}
            </div>
            <p className="text-xs text-muted-foreground">Issues resolved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Response
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgResponseTime}
            </div>
            <p className="text-xs text-muted-foreground">Per request</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Active Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeRequests.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No active requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Headphones className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{request.type}</h4>
                      <p className="text-sm text-gray-600">{request.requester}</p>
                      <p className="text-xs text-gray-500 mt-1">{request.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getPriorityColor(request.priority)}>
                      {request.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
