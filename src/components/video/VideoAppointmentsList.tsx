"use client";

import { useState } from "react";
import { ProtectedComponent } from "@/components/rbac/ProtectedComponent";
import { Permission } from "@/types/rbac.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Video,
  Download,
  Clock,
  Calendar,
  User,
  Users,
  BarChart3,
  Activity,
  Search,
  Play,
  Square,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useVideoAppointments,
  useJoinVideoAppointment,
  useEndVideoAppointment,
  type VideoAppointment,
} from "@/hooks/query/useVideoAppointments";
import { useClinics } from "@/hooks/query/useClinics";
import { useRBAC } from "@/hooks/utils/useRBAC";
import { VideoAppointmentRoom } from "./VideoAppointmentRoom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VideoAppointmentsListProps {
  title?: string;
  description?: string;
  showStatistics?: boolean;
  showClinicFilter?: boolean;
  showJoinButton?: boolean;
  showEndButton?: boolean;
  showDownloadButton?: boolean;
  limit?: number;
  filters?: {
    doctorId?: string;
    patientId?: string;
    clinicId?: string;
  };
}

export function VideoAppointmentsList({
  title = "Video Consultations",
  description = "Manage and view video consultations",
  showStatistics = true,
  showClinicFilter = false,
  showJoinButton = false,
  showEndButton = false,
  showDownloadButton = true,
  limit = 100,
  filters = {},
}: VideoAppointmentsListProps) {
  const { session, user } = useAuth();
  const { hasPermission } = useRBAC();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterClinicId, setFilterClinicId] = useState("");
  const [selectedAppointment, setSelectedAppointment] =
    useState<VideoAppointment | null>(null);
  const [isVideoRoomOpen, setIsVideoRoomOpen] = useState(false);

  const userId = session?.user?.id || "";

  // Determine permissions
  const canJoin = hasPermission(Permission.JOIN_VIDEO_APPOINTMENTS);
  const canEnd = hasPermission(Permission.END_VIDEO_APPOINTMENTS);
  const canViewRecordings = hasPermission(Permission.VIEW_VIDEO_RECORDINGS);

  // Fetch video appointments
  const {
    data: appointmentsData,
    isLoading,
    refetch,
  } = useVideoAppointments({
    ...filters,
    ...(filterStatus ? { status: filterStatus } : {}),
    page: 1,
    limit,
  });

  // Fetch clinics for filtering (if needed)
  const { data: clinicsData } = useClinics();
  const clinics = (Array.isArray(clinicsData) ? clinicsData : (clinicsData as any)?.clinics) || [];

  const appointments =
    (appointmentsData && "appointments" in appointmentsData
      ? appointmentsData.appointments
      : undefined) ||
    (appointmentsData && "data" in appointmentsData
      ? appointmentsData.data
      : undefined) ||
    [];

  // Mutations
  const joinVideoAppointment = useJoinVideoAppointment();
  const endVideoAppointment = useEndVideoAppointment();

  // Filter appointments
  const filteredAppointments = Array.isArray(appointments)
    ? appointments.filter((apt: VideoAppointment) => {
        const matchesSearch =
          !searchTerm ||
          apt.appointmentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.roomName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.doctorId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.patientId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !filterStatus || apt.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
    : [];

  // Statistics
  const totalAppointments = filteredAppointments.length;
  const activeAppointments = filteredAppointments.filter(
    (apt: VideoAppointment) => apt.status === "in-progress"
  ).length;
  const completedAppointmentsCount = filteredAppointments.filter(
    (apt: VideoAppointment) => apt.status === "completed"
  ).length;
  const scheduledAppointments = filteredAppointments.filter(
    (apt: VideoAppointment) => apt.status === "scheduled"
  ).length;
  const cancelledAppointments = filteredAppointments.filter(
    (apt: VideoAppointment) => apt.status === "cancelled"
  ).length;

  // Separate by status
  const upcomingAppointments = filteredAppointments.filter(
    (apt: VideoAppointment) =>
      apt.status === "scheduled" || apt.status === "in-progress"
  );
  const completedAppointments = filteredAppointments.filter(
    (apt: VideoAppointment) => apt.status === "completed"
  );

  const handleJoinAppointment = async (appointment: VideoAppointment) => {
    if (!canJoin) {
      toast.error("You don't have permission to join video appointments");
      return;
    }

    // Convert role enum to lowercase string for backend
    const getRoleString = (role?: string): "doctor" | "patient" | "admin" => {
      if (!role) return "patient";
      const roleLower = role.toLowerCase();
      if (roleLower === "doctor" || roleLower === "DOCTOR") return "doctor";
      if (roleLower === "admin" || roleLower === "CLINIC_ADMIN" || roleLower === "SUPER_ADMIN") return "admin";
      return "patient";
    };

    try {
      const result = await joinVideoAppointment.mutateAsync({
        appointmentId: appointment.appointmentId,
        userId,
        role: getRoleString(user?.role),
      });

      if (result?.token) {
        setSelectedAppointment(appointment);
        setIsVideoRoomOpen(true);
        toast.success("Joining video consultation...");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to join appointment";
      toast.error(errorMessage);
    }
  };

  const handleEndAppointment = async (appointmentId: string) => {
    if (!canEnd) {
      toast.error("You don't have permission to end video appointments");
      return;
    }

    try {
      await endVideoAppointment.mutateAsync(appointmentId);
      toast.success("Video appointment ended successfully");
      refetch();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to end appointment";
      toast.error(errorMessage);
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

  const AppointmentCard = ({
    appointment,
  }: {
    appointment: VideoAppointment;
  }) => (
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

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 text-sm text-muted-foreground">
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
              {appointment.doctorId && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Doctor: {appointment.doctorId.slice(0, 8)}...</span>
                </div>
              )}
              {appointment.patientId && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Patient: {appointment.patientId.slice(0, 8)}...</span>
                </div>
              )}
              {appointment.recordingUrl && (
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>Recording Available</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {showJoinButton && canJoin && (
              <>
                {appointment.status === "scheduled" && (
                  <Button
                    onClick={() => handleJoinAppointment(appointment)}
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
                  <Button
                    onClick={() => handleJoinAppointment(appointment)}
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
                )}
              </>
            )}
            {showEndButton && canEnd && appointment.status === "in-progress" && (
              <Button
                onClick={() => handleEndAppointment(appointment.appointmentId)}
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
            )}
            {showDownloadButton &&
              canViewRecordings &&
              appointment.status === "completed" &&
              appointment.recordingUrl && (
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
    <ProtectedComponent permission={Permission.VIEW_VIDEO_APPOINTMENTS}>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground mt-2">{description}</p>
          </div>
        </div>

        {/* Statistics Cards */}
        {showStatistics && (
          <div
            className={`grid grid-cols-1 gap-4 mb-6 ${
              showClinicFilter
                ? "md:grid-cols-5"
                : "md:grid-cols-4"
            }`}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAppointments}</div>
                <p className="text-xs text-muted-foreground">All consultations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeAppointments}</div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scheduledAppointments}</div>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedAppointmentsCount}</div>
                <p className="text-xs text-muted-foreground">Finished</p>
              </CardContent>
            </Card>
            {showClinicFilter && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{cancelledAppointments}</div>
                  <p className="text-xs text-muted-foreground">Cancelled</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by appointment ID, room name, doctor, or patient..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10"
                  />
                </div>
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
              {showClinicFilter && clinics.length > 0 && (
                <Select value={filterClinicId} onValueChange={setFilterClinicId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Clinics</SelectItem>
                    {clinics.map((clinic: { id: string; name: string }) => (
                      <SelectItem key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        {showJoinButton ? (
          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedAppointments.length})
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
                upcomingAppointments.map((appointment: VideoAppointment) => (
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
                completedAppointments.map((appointment: VideoAppointment) => (
                  <AppointmentCard
                    key={appointment.id || appointment.appointmentId}
                    appointment={appointment}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All ({totalAppointments})</TabsTrigger>
              <TabsTrigger value="active">
                Active ({activeAppointments})
              </TabsTrigger>
              <TabsTrigger value="scheduled">
                Scheduled ({scheduledAppointments})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedAppointmentsCount})
              </TabsTrigger>
              {showClinicFilter && (
                <TabsTrigger value="cancelled">
                  Cancelled ({cancelledAppointments})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      Loading appointments...
                    </p>
                  </CardContent>
                </Card>
              ) : filteredAppointments.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      No video appointments found
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredAppointments.map((appointment: VideoAppointment) => (
                  <AppointmentCard
                    key={appointment.id || appointment.appointmentId}
                    appointment={appointment}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {filteredAppointments
                .filter((apt: VideoAppointment) => apt.status === "in-progress")
                .map((appointment: VideoAppointment) => (
                  <AppointmentCard
                    key={appointment.id || appointment.appointmentId}
                    appointment={appointment}
                  />
                ))}
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-4">
              {filteredAppointments
                .filter((apt: VideoAppointment) => apt.status === "scheduled")
                .map((appointment: VideoAppointment) => (
                  <AppointmentCard
                    key={appointment.id || appointment.appointmentId}
                    appointment={appointment}
                  />
                ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {filteredAppointments
                .filter((apt: VideoAppointment) => apt.status === "completed")
                .map((appointment: VideoAppointment) => (
                  <AppointmentCard
                    key={appointment.id || appointment.appointmentId}
                    appointment={appointment}
                  />
                ))}
            </TabsContent>

            {showClinicFilter && (
              <TabsContent value="cancelled" className="space-y-4">
                {filteredAppointments
                  .filter((apt: VideoAppointment) => apt.status === "cancelled")
                  .map((appointment: VideoAppointment) => (
                    <AppointmentCard
                      key={appointment.id || appointment.appointmentId}
                      appointment={appointment}
                    />
                  ))}
              </TabsContent>
            )}
          </Tabs>
        )}

        {/* Video Room Dialog */}
        {selectedAppointment && (
          <Dialog open={isVideoRoomOpen} onOpenChange={setIsVideoRoomOpen}>
            <DialogContent className="max-w-7xl w-full h-[90vh] p-0">
              <DialogHeader className="sr-only">
                <DialogTitle>Video Consultation</DialogTitle>
                <DialogDescription>
                  Video consultation room for appointment{" "}
                  {selectedAppointment.appointmentId}
                </DialogDescription>
              </DialogHeader>
              <div className="h-full">
                <VideoAppointmentRoom
                  appointment={selectedAppointment}
                  onEndCall={() => {
                    if (canEnd) {
                      handleEndAppointment(selectedAppointment.appointmentId);
                    }
                  }}
                  onLeaveRoom={() => {
                    setIsVideoRoomOpen(false);
                    setSelectedAppointment(null);
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ProtectedComponent>
  );
}

