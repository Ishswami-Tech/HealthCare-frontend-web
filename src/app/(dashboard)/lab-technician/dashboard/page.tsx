"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "@/components/ui/loader";
import {
  TestTube2,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Activity,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useLabTechnicianResults } from "@/hooks/query/useLabTechnician";
import { useWebSocketQuerySync } from "@/hooks/query/utils/use-websocket-query-sync";

export default function LabTechnicianDashboard() {
  const { session } = useAuth();
  const user = session?.user;
  const technicianId = user?.id;

  const { data: labResultsData, isPending } = useLabTechnicianResults({ labTechnicianId: technicianId } as any);

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync([['labTechnicianResults', technicianId]]);

  const labResults = labResultsData?.results || [];

  const pendingTests = useMemo(() => {
    return labResults
      .filter((r: any) => r.status === "pending" || r.status === "in_progress" || r.status === "PENDING")
      .slice(0, 5)
      .map((r: any) => ({
        id: r.id,
        patientName: r.patientName || r.patient?.name || "Unknown Patient",
        testType: r.testName || r.testType || "General Lab Test",
        priority: r.priority || "normal",
        requestedAt: r.createdAt ? new Date(r.createdAt).toLocaleString() : "TBA",
      }));
  }, [labResults]);

  const recentResults = useMemo(() => {
    return labResults
      .filter((r: any) => ["completed", "COMPLETED", "NORMAL", "ABNORMAL", "CRITICAL"].includes(r.status))
      .slice(0, 5)
      .map((r: any) => ({
        id: r.id,
        patientName: r.patientName || r.patient?.name || "Unknown Patient",
        testType: r.testName || r.testType || "General Lab Test",
        status: r.status,
        completedAt: r.reportedAt || r.updatedAt ? new Date(r.reportedAt || r.updatedAt).toLocaleString() : "Recent",
      }));
  }, [labResults]);

  const stats = useMemo(() => {
    const pendingCount = labResults.filter((r: any) => 
      ["pending", "in_progress", "PENDING"].includes(r.status)
    ).length;
    const completedCount = labResults.filter((r: any) => 
      ["completed", "COMPLETED", "NORMAL", "ABNORMAL", "CRITICAL"].includes(r.status)
    ).length;
    
    return {
      pendingTests: pendingCount,
      completedToday: completedCount,
      totalPatients: new Set(labResults.map((r: any) => r.patientId)).size,
      avgProcessingTime: 45, // Mocked for now, ideally from backend
    };
  }, [labResults]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
      case "critical":
        return "bg-red-100 text-red-800";
      case "medium":
      case "moderate":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (["completed", "normal"].includes(s)) return "bg-green-100 text-green-800";
    if (s === "abnormal") return "bg-orange-100 text-orange-800";
    if (s === "critical") return "bg-red-600 text-white font-bold";
    if (["pending", "in_progress"].includes(s)) return "bg-amber-100 text-amber-800";
    return "bg-slate-100 text-slate-800";
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Lab Technician Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name || "Technician"}! Here's your laboratory overview.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tests</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingTests}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
            <p className="text-xs text-muted-foreground">Results reported</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">Unique patients today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Processing</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProcessingTime} min</div>
            <p className="text-xs text-muted-foreground">Per test average</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Test Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTests.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-dashed rounded-lg">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                <p className="text-muted-foreground">No pending lab tests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTests.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <TestTube2 className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold leading-none mb-1">{test.patientName}</h4>
                        <p className="text-sm text-muted-foreground">{test.testType}</p>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {test.requestedAt}
                        </p>
                      </div>
                    </div>
                    <Badge className={getPriorityColor(test.priority)}>
                      {test.priority.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Recent Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentResults.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-dashed rounded-lg">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                <p className="text-muted-foreground">No recent lab reports</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold leading-none mb-1">{result.patientName}</h4>
                        <p className="text-sm text-muted-foreground">{result.testType}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Reported: {result.completedAt}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(result.status)}>
                      {result.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Lab Statistics by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-4 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TestTube2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-700">12</div>
                <div className="text-sm text-blue-600/80 font-medium">Hematology</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-purple-50/50 border border-purple-100 rounded-lg">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-700">8</div>
                <div className="text-sm text-purple-600/80 font-medium">Urine Analysis</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-700">5</div>
                <div className="text-sm text-emerald-600/80 font-medium">Biochemistry</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-orange-50/50 border border-orange-100 rounded-lg">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-700">3</div>
                <div className="text-sm text-orange-600/80 font-medium">Microbiology</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
