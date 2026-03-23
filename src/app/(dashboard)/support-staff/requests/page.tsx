"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "@/components/ui/loader";
import {
  Search,
  MessageSquare,
  Filter,
  Clock,
  CheckCircle,
  Play,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useSupportStaffRequests,
  useUpdateSupportRequest,
  useCreateSupportRequest,
  useDeleteSupportRequest,
} from "@/hooks/query/useSupportStaff";
import { useWebSocketQuerySync } from "@/hooks/query/utils/use-websocket-query-sync";

export default function SupportStaffRequests() {
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const staffId = user?.id;

  const { data: requestsData, isPending } = useSupportStaffRequests({ staffId } as any);
  const updateMutation = useUpdateSupportRequest();
  const deleteMutation = useDeleteSupportRequest();
  const createMutation = useCreateSupportRequest();

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync([['supportStaffRequests', staffId]]);

  const requests = requestsData?.requests || [];

  const filteredRequests = requests.filter((request: any) => {
    const matchesSearch =
      request.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requesterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || request.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (requestId: string, newStatus: string) => {
    updateMutation.mutate({
      requestId,
      updates: { status: newStatus },
    });
  };

  const handleDelete = (requestId: string) => {
    if (confirm("Are you sure you want to delete this request?")) {
      deleteMutation.mutate(requestId);
    }
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
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
        <h1 className="text-3xl font-bold">Help Requests</h1>
        <p className="text-gray-600">Manage and respond to support tickets</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search requests..."
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No requests found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request: any) => (
                <div
                  key={request.id}
                  className="p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{request.type}</h4>
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.replace("_", " ").toLowerCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {request.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        Requester: {request.requesterName} | Created:{" "}
                        {new Date(request.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {request.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(request.id, "in_progress")}
                          disabled={updateMutation.isPending}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Start
                        </Button>
                      )}
                      {request.status === "in_progress" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(request.id, "completed")}
                          disabled={updateMutation.isPending}
                        >
                          Complete
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(request.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
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
