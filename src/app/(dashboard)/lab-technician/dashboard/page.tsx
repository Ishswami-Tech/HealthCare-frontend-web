"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "@/components/ui/loader";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
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
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { formatDateTimeInIST } from "@/lib/utils/date-time";
import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";

export default function LabTechnicianDashboard() {
  const { session } = useAuth();
  const user = session?.user;
  const technicianId = user?.id;

  const { data: labResultsData, isPending } = useLabTechnicianResults({ labTechnicianId: technicianId } as any);

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync();

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
        requestedAt: r.createdAt ? formatDateTimeInIST(r.createdAt, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }, "en-IN") : "TBA",
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
        completedAt: r.reportedAt || r.updatedAt ? formatDateTimeInIST(r.reportedAt || r.updatedAt, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }, "en-IN") : "Recent",
      }));
  }, [labResults]);

  const categoryStats = useMemo(() => {
    const hematology = labResults.filter((r: any) =>
      /hematol|blood.*count|cbc/i.test(r.testName || r.testType || '')
    ).length;
    const urineAnalysis = labResults.filter((r: any) =>
      /urine|urinanal|urinalysis/i.test(r.testName || r.testType || '')
    ).length;
    const biochemistry = labResults.filter((r: any) =>
      /biochem|metabol|glucose|lipid|liver|kidney/i.test(r.testName || r.testType || '')
    ).length;
    const microbiology = labResults.filter((r: any) =>
      /microb|cultur|bacteria|virus|parasite/i.test(r.testName || r.testType || '')
    ).length;
    return { hematology, urineAnalysis, biochemistry, microbiology };
  }, [labResults]);

  const stats = useMemo(() => {
    const pendingCount = labResults.filter((r: any) => 
      ["pending", "in_progress", "PENDING"].includes(r.status)
    ).length;
    const completedCount = labResults.filter((r: any) => 
      ["completed", "COMPLETED", "NORMAL", "ABNORMAL", "CRITICAL"].includes(r.status)
    ).length;
    
    const completedWithTimes = labResults.filter(
      (r: any) =>
        ["completed", "COMPLETED", "NORMAL", "ABNORMAL", "CRITICAL"].includes(r.status) &&
        r.createdAt &&
        (r.reportedAt || r.updatedAt)
    );
    const processingTimes = completedWithTimes
      .map((r: any) => {
        const start = new Date(r.createdAt).getTime();
        const end = new Date(r.reportedAt || r.updatedAt).getTime();
        return (end - start) / 60000;
      })
      .filter((t: number) => t > 0);
    const avgProcessingTime =
      processingTimes.length > 0
        ? Math.round(processingTimes.reduce((a: number, b: number) => a + b, 0) / processingTimes.length)
        : 0;

    return {
      pendingTests: pendingCount,
      completedToday: completedCount,
      totalPatients: new Set(labResults.map((r: any) => r.patientId)).size,
      avgProcessingTime,
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
    <div className="p-4 space-y-4 sm:p-6 sm:space-y-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Lab Technician Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name || "Technician"}! Here's your laboratory overview.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <DashboardMetricCard
          label="Pending Tests"
          value={stats.pendingTests}
          subtext="Awaiting processing"
          accentClassName="border-orange-200 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/10"
          valueClassName="mt-1 text-2xl font-bold text-orange-600"
          labelClassName="text-orange-600"
          compact
        />
        <DashboardMetricCard
          label="Completed Today"
          value={stats.completedToday}
          subtext="Results reported"
          accentClassName="border-green-200 bg-green-50 dark:border-green-500/20 dark:bg-green-500/10"
          valueClassName="mt-1 text-2xl font-bold text-green-600"
          labelClassName="text-green-600"
          compact
        />
        <DashboardMetricCard
          label="Total Patients"
          value={stats.totalPatients}
          subtext="Unique patients today"
          accentClassName="border-slate-200 bg-slate-50 dark:border-slate-500/20 dark:bg-slate-500/10"
          valueClassName="mt-1 text-2xl font-bold"
          labelClassName="text-slate-600"
          compact
        />
        <DashboardMetricCard
          label="Avg. Processing"
          value={`${stats.avgProcessingTime} min`}
          subtext="Per test average"
          accentClassName="border-indigo-200 bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/10"
          valueClassName="mt-1 text-2xl font-bold text-indigo-600"
          labelClassName="text-indigo-600"
          compact
        />
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
              <Empty className="min-h-[220px] border-border/70 bg-muted/20">
                <EmptyContent>
                  <EmptyMedia variant="icon">
                    <Clock className="h-5 w-5" />
                  </EmptyMedia>
                  <EmptyTitle>No pending lab tests</EmptyTitle>
                  <EmptyDescription>Tests waiting for processing will appear here.</EmptyDescription>
                </EmptyContent>
              </Empty>
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
              <Empty className="min-h-[220px] border-border/70 bg-muted/20">
                <EmptyContent>
                  <EmptyMedia variant="icon">
                    <FileText className="h-5 w-5" />
                  </EmptyMedia>
                  <EmptyTitle>No recent lab reports</EmptyTitle>
                  <EmptyDescription>Reported results will appear here once finalized.</EmptyDescription>
                </EmptyContent>
              </Empty>
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
                <div className="text-2xl font-bold text-blue-700">{categoryStats.hematology}</div>
                <div className="text-sm text-blue-600/80 font-medium">Hematology</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-purple-50/50 border border-purple-100 rounded-lg">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-700">{categoryStats.urineAnalysis}</div>
                <div className="text-sm text-purple-600/80 font-medium">Urine Analysis</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-700">{categoryStats.biochemistry}</div>
                <div className="text-sm text-emerald-600/80 font-medium">Biochemistry</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-orange-50/50 border border-orange-100 rounded-lg">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-700">{categoryStats.microbiology}</div>
                <div className="text-sm text-orange-600/80 font-medium">Microbiology</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
