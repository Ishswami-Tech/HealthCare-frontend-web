"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
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
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { formatDateInIST } from "@/lib/utils/date-time";

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
  useWebSocketQuerySync();

  const requests = requestsData?.requests || [];
  const showSkeleton = isPending && requests.length === 0;

  const filteredRequests = requests.filter((request: any) => {
    const matchesSearch =
      request.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requesterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || request.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = useCallback((requestId: string, newStatus: string) => {
    updateMutation.mutate({
      requestId,
      updates: { status: newStatus },
    });
  }, [updateMutation]);

  const handleDelete = useCallback((requestId: string) => {
    if (confirm("Are you sure you want to delete this request?")) {
      deleteMutation.mutate(requestId);
    }
  }, [deleteMutation]);

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

  const requestColumns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <span className="font-medium">{row.original.type}</span>,
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => <Badge className={getPriorityColor(row.original.priority)}>{row.original.priority}</Badge>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={getStatusColor(row.original.status)}>
            {row.original.status.replace("_", " ").toLowerCase()}
          </Badge>
        ),
      },
      {
        accessorKey: "requesterName",
        header: "Requester",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.requesterName}</span>,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDateInIST(row.original.createdAt, { day: "2-digit", month: "short", year: "numeric" }, "en-IN")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            {row.original.status === "pending" && (
              <Button
                size="sm"
                onClick={() => handleStatusChange(row.original.id, "in_progress")}
                disabled={updateMutation.isPending}
              >
                <Play className="size-3 mr-1" />
                Start
              </Button>
            )}
            {row.original.status === "in_progress" && (
              <Button
                size="sm"
                onClick={() => handleStatusChange(row.original.id, "completed")}
                disabled={updateMutation.isPending}
              >
                Complete
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(row.original.id)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
            <Button variant="outline" size="sm">
              View
            </Button>
          </div>
        ),
      },
    ],
    [deleteMutation.isPending, handleDelete, handleStatusChange, updateMutation.isPending]
  );

  return (
    <div className="p-6 gap-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Help Requests</h1>
        <p className="text-gray-600">Manage and respond to support tickets</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 size-4 text-gray-400" />
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
            <MessageSquare className="size-5" />
            Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showSkeleton ? (
            <TableSkeleton columns={["Type", "Priority", "Status", "Requester", "Created", "Actions"]} rows={4} />
          ) : filteredRequests.length === 0 ? (
            <Empty>
              <EmptyContent>
                <EmptyMedia>
                  <MessageSquare className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No requests found</EmptyTitle>
                <EmptyDescription>
                  Try adjusting your search or filters.
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            <DataTable
              columns={requestColumns}
              data={filteredRequests}
              pageSize={10}
              emptyMessage="No requests found"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}


