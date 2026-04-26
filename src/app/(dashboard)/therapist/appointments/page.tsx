"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Calendar,
  Clock,
  CheckCircle,
  MessageCircle,
  Play,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useTherapistAppointments, useCreateTherapistAppointment, useUpdateTherapistAppointment, useDeleteTherapistAppointment } from "@/hooks/query/useTherapist";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";

export default function TherapistAppointments() {
  useAuth();
  const { user } = useAuth();

  // Extract therapist ID from user
  const therapistId = user?.id || "";

  // State for filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch real data using hook
  const { data: appointmentsData, isPending: isPending } = useTherapistAppointments(therapistId, {
    status: filterStatus !== "all" ? filterStatus : undefined,
  });

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  // Mutations
  const createAppointmentMutation = useCreateTherapistAppointment();
  const updateAppointmentMutation = useUpdateTherapistAppointment();
  const deleteAppointmentMutation = useDeleteTherapistAppointment();

  // Extract appointments array from response
  const appointments = appointmentsData?.appointments || [];
  const safeSearch = searchQuery.trim().toLowerCase();

  const safeDate = (value: unknown): Date | null => {
    if (typeof value !== "string" || !value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDate = (value: unknown): string => {
    const parsed = safeDate(value);
    return parsed ? parsed.toLocaleDateString("en-IN") : "N/A";
  };

  const isToday = (value: unknown): boolean => {
    const parsed = safeDate(value);
    return parsed ? parsed.toDateString() === new Date().toDateString() : false;
  };

  const getStatusValue = (value: unknown): string =>
    typeof value === "string" && value.trim().length > 0
      ? value.toUpperCase()
      : "SCHEDULED";

  const visibleAppointments = appointments.filter((appointment) => {
    if (!safeSearch) return true;
    const tokens = [
      appointment.patientName,
      appointment.clientId,
      appointment.notes,
      appointment.type,
    ]
      .filter((token): token is string => typeof token === "string" && token.length > 0)
      .map((token) => token.toLowerCase());
    return tokens.some((token) => token.includes(safeSearch));
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "SCHEDULED":
        return "bg-gray-100 text-gray-800";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return <Play className="w-4 h-4" />;
      case "CONFIRMED":
        return <CheckCircle className="w-4 h-4" />;
      case "SCHEDULED":
        return <Clock className="w-4 h-4" />;
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Appointments</h1>
        <p className="text-gray-600">
          Manage your sessions and appointments
        </p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by client name or notes..."
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
                variant={filterStatus === "SCHEDULED" ? "default" : "outline"}
                onClick={() => setFilterStatus("SCHEDULED")}
              >
                Scheduled
              </Button>
              <Button
                variant={filterStatus === "CONFIRMED" ? "default" : "outline"}
                onClick={() => setFilterStatus("CONFIRMED")}
              >
                Confirmed
              </Button>
              <Button
                variant={filterStatus === "COMPLETED" ? "default" : "outline"}
                onClick={() => setFilterStatus("COMPLETED")}
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
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{appointments.length}</div>
                <div className="text-sm text-gray-600">Total Appointments</div>
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
                <div className="text-2xl font-bold text-green-600">
                  {
                    appointments.filter(
                      (a) => getStatusValue(a.status) === "COMPLETED"
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-600">Completed Sessions</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {appointments.filter((a) => a.type === "Session").length}
                </div>
                <div className="text-sm text-gray-600">Procedural Sessions</div>
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
                  {appointments.filter((a) => isToday(a.date)).length}
                </div>
                <div className="text-sm text-gray-600">Today&apos;s Sessions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Appointments List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : visibleAppointments.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No appointments found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleAppointments.map((appointment) => {
                const status = getStatusValue(appointment.status);
                const patientName = appointment.patientName || "Unknown Patient";
                const clientId = appointment.clientId || "N/A";
                const appointmentType = appointment.type || "Session";
                const duration = appointment.duration || "N/A";
                const time = appointment.time || "N/A";
                return (
                  <div
                  key={appointment.id}
                  className="p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{patientName}</h4>
                        <Badge variant="outline" className="text-xs">
                          {clientId}
                        </Badge>
                        <p className="text-sm text-gray-600">
                          {appointmentType} - {duration}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(appointment.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {time}
                          </span>
                        </div>
                      </div>
                      {appointment.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          Notes: {appointment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={`${getStatusColor(status)} flex items-center gap-1`}
                    >
                      {getStatusIcon(status)}
                      {status.replace("_", " ").toLowerCase()}
                    </Badge>
                    <div className="flex gap-2 mt-2">
                      {status === "SCHEDULED" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            updateAppointmentMutation.mutate({
                              appointmentId: appointment.id,
                              updates: { status: "CONFIRMED" },
                            })
                          }
                          disabled={updateAppointmentMutation.isPending}
                        >
                          Start
                        </Button>
                      )}
                      {status === "IN_PROGRESS" && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() =>
                            updateAppointmentMutation.mutate({
                              appointmentId: appointment.id,
                              updates: { status: "COMPLETED" },
                            })
                          }
                          disabled={updateAppointmentMutation.isPending}
                        >
                          Complete
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          deleteAppointmentMutation.mutate(appointment.id)
                        }
                        disabled={deleteAppointmentMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
