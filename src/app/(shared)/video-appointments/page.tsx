"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import {
  useVideoAppointments,
  useVideoAppointment,
  useCreateVideoAppointment,
  useJoinVideoAppointment,
  useEndVideoAppointment,
  useVideoRecording,
} from "@/hooks/useVideoAppointments";
import {
  Video,
  Plus,
  Search,
  Filter,
  Play,
  Square,
  Download,
  Users,
  Clock,
  Calendar,
  User,
  Phone,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { WebSocketStatusIndicator } from "@/components/websocket/WebSocketErrorBoundary";
import { useWebSocketQuerySync } from "@/hooks/useRealTimeQueries";
import { useVideoAppointmentWebSocket } from "@/hooks/useWebSocket";

export default function VideoAppointmentsPage() {
  const { session } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const userId = session?.user?.id || "";

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  // Fetch video appointments using hook
  const {
    data: appointmentsData,
    isLoading,
    refetch,
  } = useVideoAppointments({
    status: filterStatus || undefined,
    page: 1,
    limit: 50,
  });

  // Real-time video appointment WebSocket hooks
  const {
    subscribeToVideoAppointments,
    subscribeToParticipantEvents,
    subscribeToRecordingEvents,
  } = useVideoAppointmentWebSocket();

  // Subscribe to real-time video appointment updates
  React.useEffect(() => {
    const unsubscribeAppointments = subscribeToVideoAppointments(
      (data: any) => {
        // Invalidate queries on real-time updates
        refetch();
      }
    );

    const unsubscribeParticipants = subscribeToParticipantEvents(
      (data: any) => {
        // Invalidate queries on participant events
        refetch();
      }
    );

    const unsubscribeRecordings = subscribeToRecordingEvents((data: any) => {
      // Invalidate queries on recording events
      refetch();
    });

    return () => {
      unsubscribeAppointments();
      unsubscribeParticipants();
      unsubscribeRecordings();
    };
  }, [
    subscribeToVideoAppointments,
    subscribeToParticipantEvents,
    subscribeToRecordingEvents,
    refetch,
  ]);

  const appointments =
    appointmentsData?.appointments || appointmentsData?.data || [];

  // Selected appointment details
  const { data: selectedAppointment } = useVideoAppointment(
    selectedAppointmentId || ""
  );

  // Mutations
  const createVideoAppointment = useCreateVideoAppointment();
  const joinVideoAppointment = useJoinVideoAppointment();
  const endVideoAppointment = useEndVideoAppointment();

  // Filter appointments
  const filteredAppointments = appointments.filter((apt: any) => {
    const matchesSearch =
      !searchTerm ||
      apt.appointmentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.roomName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || apt.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Separate by status
  const upcomingAppointments = filteredAppointments.filter(
    (apt: any) => apt.status === "scheduled" || apt.status === "in-progress"
  );
  const completedAppointments = filteredAppointments.filter(
    (apt: any) => apt.status === "completed"
  );
  const cancelledAppointments = filteredAppointments.filter(
    (apt: any) => apt.status === "cancelled"
  );

  const handleJoinAppointment = async (appointmentId: string) => {
    try {
      const result = await joinVideoAppointment.mutateAsync({
        appointmentId,
        userId,
        role: session?.user?.role === "DOCTOR" ? "doctor" : "patient",
      });

      if (result?.token) {
        // Open video consultation in new window or redirect
        window.open(
          `/video-consultation/${appointmentId}?token=${result.token.token}`,
          "_blank"
        );
        toast.success("Joining video consultation...");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to join appointment");
    }
  };

  const handleEndAppointment = async (appointmentId: string) => {
    try {
      await endVideoAppointment.mutateAsync(appointmentId);
      toast.success("Video appointment ended successfully");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to end appointment");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      scheduled: { label: "Scheduled", variant: "outline" },
      "in-progress": { label: "In Progress", variant: "default" },
      completed: { label: "Completed", variant: "secondary" },
      cancelled: { label: "Cancelled", variant: "destructive" },
    };

    const config = statusConfig[status] || {
      label: status,
      variant: "outline",
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const AppointmentCard = ({ appointment }: { appointment: any }) => (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Video className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">
                {appointment.roomName || `Room ${appointment.appointmentId}`}
              </h3>
              {getStatusBadge(appointment.status)}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {appointment.startTime
                    ? format(new Date(appointment.startTime), "MMM dd, yyyy")
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {appointment.startTime
                    ? format(new Date(appointment.startTime), "hh:mm a")
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>
                  Appointment ID: {appointment.appointmentId?.slice(0, 8)}...
                </span>
              </div>
              {appointment.recordingUrl && (
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>Recording Available</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {appointment.status === "scheduled" && (
              <Button
                onClick={() => handleJoinAppointment(appointment.appointmentId)}
                size="sm"
                className="gap-2"
                disabled={joinVideoAppointment.isPending}
              >
                {joinVideoAppointment.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Join
                  </>
                )}
              </Button>
            )}
            {appointment.status === "in-progress" && (
              <>
                <Button
                  onClick={() =>
                    handleJoinAppointment(appointment.appointmentId)
                  }
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  disabled={joinVideoAppointment.isPending}
                >
                  {joinVideoAppointment.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4" />
                      Rejoin
                    </>
                  )}
                </Button>
                <Button
                  onClick={() =>
                    handleEndAppointment(appointment.appointmentId)
                  }
                  size="sm"
                  variant="destructive"
                  className="gap-2"
                  disabled={endVideoAppointment.isPending}
                >
                  {endVideoAppointment.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Ending...
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4" />
                      End
                    </>
                  )}
                </Button>
              </>
            )}
            {appointment.status === "completed" && appointment.recordingUrl && (
              <Button
                onClick={() => window.open(appointment.recordingUrl, "_blank")}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Video Appointments</h1>
          <p className="text-muted-foreground mt-2">
            Manage and join video consultations
          </p>
        </div>
        <WebSocketStatusIndicator />
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Video Appointment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Video Appointment</DialogTitle>
              <DialogDescription>
                Create a new video consultation appointment
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Video appointments are created automatically when you schedule a
                regular appointment with video consultation enabled. Check your
                appointments page to enable video for an existing appointment.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({cancelledAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Loading appointments...
                </p>
              </CardContent>
            </Card>
          ) : upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No upcoming video appointments
                </p>
              </CardContent>
            </Card>
          ) : (
            upcomingAppointments.map((appointment: any) => (
              <AppointmentCard
                key={appointment.id || appointment.appointmentId}
                appointment={appointment}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedAppointments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No completed video appointments
                </p>
              </CardContent>
            </Card>
          ) : (
            completedAppointments.map((appointment: any) => (
              <AppointmentCard
                key={appointment.id || appointment.appointmentId}
                appointment={appointment}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {cancelledAppointments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No cancelled video appointments
                </p>
              </CardContent>
            </Card>
          ) : (
            cancelledAppointments.map((appointment: any) => (
              <AppointmentCard
                key={appointment.id || appointment.appointmentId}
                appointment={appointment}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
