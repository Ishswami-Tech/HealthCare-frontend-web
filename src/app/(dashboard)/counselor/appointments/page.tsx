"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "@/components/ui/loader";
import {
  Search,
  Calendar,
  Filter,
  Clock,
  CheckCircle,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useCounselorAppointments,
  useUpdateCounselorAppointment,
  useDeleteCounselorAppointment,
} from "@/hooks/query/useCounselor";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { getReceptionistAppointmentTimeLabel } from "@/lib/utils/appointmentUtils";
import { formatDateInIST } from "@/lib/utils/date-time";

export default function CounselorAppointments() {
  const { session } = useAuth();
  const user = session?.user;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const counselorId = user?.id;

  const { data: appointmentsData, isPending } = useCounselorAppointments(counselorId);
  const updateMutation = useUpdateCounselorAppointment();
  const deleteMutation = useDeleteCounselorAppointment();

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync();

  const appointments = appointmentsData?.appointments || [];

  const filteredAppointments = appointments.filter((appointment: any) => {
    const matchesSearch =
      appointment.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || appointment.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (appointmentId: string, newStatus: string) => {
    updateMutation.mutate({
      appointmentId,
      updates: { status: newStatus },
    });
  };

  const handleDelete = (appointmentId: string) => {
    if (confirm("Are you sure you want to delete this appointment?")) {
      deleteMutation.mutate(appointmentId);
    }
  };

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

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-semibold">Appointments</h1>
        <p className="text-gray-600">Manage counseling sessions and appointments</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 size-4 text-gray-400" />
              <Input
                placeholder="Search by client name or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2 sm:flex-nowrap">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
                className="flex-1 sm:flex-none"
              >
                All
              </Button>
              <Button
                variant={filterStatus === "SCHEDULED" ? "default" : "outline"}
                onClick={() => setFilterStatus("SCHEDULED")}
                className="flex-1 sm:flex-none"
              >
                Scheduled
              </Button>
              <Button
                variant={filterStatus === "COMPLETED" ? "default" : "outline"}
                onClick={() => setFilterStatus("COMPLETED")}
                className="flex-1 sm:flex-none"
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
            <Calendar className="size-5" />
            Appointments List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="size-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No appointments found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="gap-y-4">
              {filteredAppointments.map((appointment: any) => (
                <div
                  key={appointment.id}
                  className="rounded-lg border p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4 flex-1">
                      <div className="size-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="size-5 text-purple-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{appointment.clientName}</h4>
                          <Badge variant="outline" className="text-xs">
                            {appointment.clientId}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {appointment.type} - {appointment.duration}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {formatDateInIST(appointment.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {getReceptionistAppointmentTimeLabel(appointment as Record<string, unknown>)}
                          </span>
                        </div>
                        {appointment.notes && (
                          <p className="mt-1 text-xs italic text-gray-500">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status.toLowerCase()}
                      </Badge>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        {appointment.status === "SCHEDULED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => handleStatusChange(appointment.id, "IN_PROGRESS")}
                            disabled={updateMutation.isPending}
                          >
                            Start
                          </Button>
                        )}
                        {appointment.status === "IN_PROGRESS" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => handleStatusChange(appointment.id, "COMPLETED")}
                            disabled={updateMutation.isPending}
                          >
                            Complete
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => handleDelete(appointment.id)}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </Button>
                      </div>
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


