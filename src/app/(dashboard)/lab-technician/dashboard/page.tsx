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
import { useAuth } from "@/hooks/use-auth";
import { useClinicContext } from "@/contexts/clinic-context";
import { useLabTechnicianResults } from "@/hooks/query/useLabTechnician";
import { useWebSocketQuerySync } from "@/hooks/query/utils/use-websocket-query-sync";

export default function LabTechnicianDashboard() {
  const { user } = useAuth();
  const { clinicId } = useClinicContext();

  const technicianId = user?.id;
  const today = new Date().toISOString().split('T')[0];

  const { data: labResultsData, isPending } = useLabTechnicianResults(technicianId);

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync([['labTechnicianResults', technicianId]]);

  const labResults = labResultsData?.results || [];

  const pendingTests = labResults
    .filter((r: any) => r.status === "pending" || r.status === "in_progress")
    .slice(0, 3)
    .map((r: any) => ({
      id: r.id,
      patientName: r.patientName,
      patientId: r.patientId,
      testType: r.testType,
      priority: r.priority,
      requestedAt: r.createdAt || new Date().toLocaleString(),
    }));

  const recentResults = labResults
    .filter((r: any) => r.status === "completed")
    .slice(0, 2)
    .map((r: any) => ({
      id: r.id,
      patientName: r.patientName,
      testType: r.testType,
      status: "completed",
      completedAt: r.completedAt || new Date().toLocaleString(),
    }));

  const stats = useMemo(() => {
    const pendingCount = labResults.filter((r: any) => r.status === "pending" || r.status === "in_progress").length;
    const completedCount = labResults.filter((r: any) => r.status === "completed").length;
    return {
      pendingTests: pendingCount,
      completedToday: completedCount,
      totalPatients: new Set(labResults.map((r: any) => r.patientId)).size,
      avgProcessingTime: 45,
    };
  }, [labResults]);

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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Lab Technician Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here's your overview for today.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Tests
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pendingTests}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
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
              Test results delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Patients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              Tested today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Processing
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgProcessingTime} min
            </div>
            <p className="text-xs text-muted-foreground">Per test</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Pending Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTests.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No pending tests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTests.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <TestTube2 className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{test.patientName}</h4>
                        <p className="text-sm text-gray-600">{test.testType}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Requested: {test.requestedAt}
                        </p>
                      </div>
                    </div>
                    <Badge className={getPriorityColor(test.priority)}>
                      {test.priority}
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
              Recent Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentResults.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No results yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{result.patientName}</h4>
                        <p className="text-sm text-gray-600">{result.testType}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Completed: {result.completedAt}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {result.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Test Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <TestTube2 className="w-6 h-6 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">12</div>
                <div className="text-sm text-gray-600">Blood Tests</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <TestTube2 className="w-6 h-6 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">8</div>
                <div className="text-sm text-gray-600">Urine Tests</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <TestTube2 className="w-6 h-6 text-green-600" />
              <div>
                <div className="text-2xl font-bold">5</div>
                <div className="text-sm text-gray-600">Biochemistry</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
              <TestTube2 className="w-6 h-6 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-gray-600">Microbiology</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
