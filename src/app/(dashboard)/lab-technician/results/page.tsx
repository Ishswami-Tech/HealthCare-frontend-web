"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "@/components/ui/loader";
import {
  Search,
  FileText,
  CheckCircle,
  Clock,
  User,
  TestTube2,
  Filter,
  Download,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useLabTechnicianResults,
  useUpdateLabResult,
  useCreateLabResult,
  useDeleteLabResult,
} from "@/hooks/query/useLabTechnician";
import { useWebSocketQuerySync } from "@/hooks/query/utils/use-websocket-query-sync";

export default function LabTechnicianResults() {
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const technicianId = user?.id;

  const { data: labResultsData, isPending } = useLabTechnicianResults({ labTechnicianId: technicianId } as any);
  const updateMutation = useUpdateLabResult();
  const deleteMutation = useDeleteLabResult();
  const createMutation = useCreateLabResult();

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync([['labTechnicianResults', technicianId]]);

  const testResults = labResultsData?.results || [];

  const filteredResults = testResults.filter((result: any) => {
    const matchesSearch =
      result.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.testType?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || result.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (resultId: string, newStatus: string) => {
    updateMutation.mutate({
      resultId,
      updates: { status: newStatus },
    });
  };

  const handleDelete = (resultId: string) => {
    if (confirm("Are you sure you want to delete this result?")) {
      deleteMutation.mutate(resultId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "normal":
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
        <h1 className="text-3xl font-bold">Test Results</h1>
        <p className="text-gray-600">
          View and manage laboratory test results
        </p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by patient name or test type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
              >
                All
              </Button>
              <Button
                variant={filterStatus === "pending" ? "default" : "outline"}
                onClick={() => setFilterStatus("pending")}
              >
                Pending
              </Button>
              <Button
                variant={filterStatus === "in_progress" ? "default" : "outline"}
                onClick={() => setFilterStatus("in_progress")}
              >
                In Progress
              </Button>
              <Button
                variant={filterStatus === "completed" ? "default" : "outline"}
                onClick={() => setFilterStatus("completed")}
              >
                Completed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{testResults.length}</div>
                <div className="text-sm text-gray-600">Total Results</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {testResults.filter((r: any) => r.status === "completed").length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {testResults.filter((r: any) => r.status === "pending").length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TestTube2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {testResults.filter((r: any) => r.priority === "high").length}
                </div>
                <div className="text-sm text-gray-600">High Priority</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Test Results List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No test results found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((result: any) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <TestTube2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{result.patientName}</h4>
                        <Badge variant="outline" className="text-xs">
                          {result.patientId}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {result.testType}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Collected:{" "}
                          {new Date(result.collectionDate).toLocaleDateString("en-IN")}
                        </span>
                        {result.completedDate && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Completed:{" "}
                            {new Date(result.completedDate).toLocaleDateString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <Badge
                        className={`${getPriorityColor(result.priority)} mb-1`}
                      >
                        {result.priority}
                      </Badge>
                      <Badge className={`${getStatusColor(result.status)}`}>
                        {result.status.replace("_", " ").toLowerCase()}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      {result.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(result.id, "in_progress")}
                          disabled={updateMutation.isPending}
                        >
                          Start
                        </Button>
                      )}
                      {result.status === "in_progress" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(result.id, "completed")}
                          disabled={updateMutation.isPending}
                        >
                          Complete
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
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
