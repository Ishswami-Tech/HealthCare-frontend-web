"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
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
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useVideoAppointments,
  useJoinVideoAppointment,
  useEndVideoAppointment,
  getVideoTokenRole,
} from "@/hooks/query/useVideoAppointments";
import {
  useAppointments,
  useAppointmentServices,
  useConfirmVideoSlot,
} from "@/hooks/query/useAppointments";
import { ProposeVideoAppointmentDialog } from "@/components/appointments/ProposeVideoAppointmentDialog";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Video,
  Plus,
  Play,
  Square,
  Download,
  Clock,
  Calendar,
  User,
  Loader2,
  CheckCircle,
  CreditCard,
} from "lucide-react";
import { showSuccessToast, showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { ConnectionStatusIndicator as WebSocketStatusIndicator } from "@/components/common/StatusIndicator";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { useVideoAppointmentWebSocket } from "@/hooks/realtime/useVideoAppointmentSocketIO";
import { ProtectedComponent } from "@/components/rbac/ProtectedComponent";
import { Permission } from "@/types/rbac.types";
import { Role } from "@/types/auth.types";
import { PaymentButton } from "@/components/payments/PaymentButton";
import { useMyAppointments } from "@/hooks/query/useAppointments";
import { useQueryClient } from "@/hooks/core";
import {
  getAppointmentDateTimeValue,
  getAppointmentDoctorName,
  formatDateInIST,
  formatTimeInIST,
  isVideoAppointmentPaymentCompleted,
} from "@/lib/utils/appointmentUtils";
import {
  getVideoPaymentAmount,
  isJoinableVideoAppointment,
} from "@/components/video/VideoAppointmentsList";

const isAwaitingDoctorConfirmation = (appointment: any) => {
  const status = String(appointment?.status || "").toUpperCase();
  const confirmedSlotIndex = appointment?.confirmedSlotIndex;
  const hasConfirmedSlot =
    confirmedSlotIndex !== null &&
    confirmedSlotIndex !== undefined &&
    !Number.isNaN(Number(confirmedSlotIndex));

  if (status === "AWAITING_SLOT_CONFIRMATION") return true;
  return status === "SCHEDULED" && !hasConfirmedSlot;
};

const parseSlotDateTime = (slot?: { date?: string; time?: string } | null) => {
  if (!slot?.date || !slot?.time) return null;
  const normalizedTime = /^\d{2}:\d{2}$/.test(slot.time.trim())
    ? `${slot.time.trim()}:00`
    : slot.time.trim();
  const parsed = new Date(`${slot.date}T${normalizedTime}+05:30`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatProposedSlotDate = (slot?: { date?: string; time?: string } | null) => {
  const parsed = parseSlotDateTime(slot);
  if (!parsed) return "Invalid slot";
  return formatDateInIST(parsed, { day: "2-digit", month: "short", year: "numeric" });
};

const formatProposedSlotTime = (slot?: { date?: string; time?: string } | null) => {
  const parsed = parseSlotDateTime(slot);
  if (!parsed) return "Invalid slot";
  return formatTimeInIST(parsed, { hour: "2-digit", minute: "2-digit", hour12: true });
};

export default function VideoAppointmentsPage() {
  const { session } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isProposeDialogOpen, setIsProposeDialogOpen] = useState(false);
  const [optimisticallyConfirmedAppointmentIds, setOptimisticallyConfirmedAppointmentIds] = useState<Set<string>>(new Set());

  const userId = session?.user?.id || "";
  const userRole = (session?.user?.role as Role) ?? "";
  const queryClient = useQueryClient();
  const invalidateAppointmentLists = React.useCallback(() => {
    if (userRole === Role.PATIENT) {
      queryClient.invalidateQueries({ queryKey: ["myAppointments"] });
    } else {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    }
  }, [queryClient, userRole]);

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  // Fetch video appointments using hook
  const {
    data: appointmentsData,

    isPending,
    refetch,
  } = useVideoAppointments({
    status: filterStatus || "",
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
      () => {
        // Invalidate queries on real-time updates
        refetch();
      }
    );

    const unsubscribeParticipants = subscribeToParticipantEvents(
      () => {
        // Invalidate queries on participant events
        refetch();
      }
    );

    const unsubscribeRecordings = subscribeToRecordingEvents(() => {
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

  const appointments = Array.isArray(appointmentsData?.appointments)
    ? appointmentsData.appointments
    : Array.isArray(appointmentsData?.data)
    ? appointmentsData.data
    : [];



  // Appointments pending doctor slot confirmation (new + legacy statuses)
  const { data: appointmentsApi } = useAppointments({
    type: "VIDEO_CALL",
    status: ["SCHEDULED", "AWAITING_SLOT_CONFIRMATION"],
    limit: 50,
    omitClinicId: true,
  });
  const awaitingConfirmation = (
    Array.isArray((appointmentsApi as any)?.appointments)
      ? (appointmentsApi as any).appointments
      : Array.isArray((appointmentsApi as any)?.data)
      ? (appointmentsApi as any).data
      : []
  ).filter(
    (apt: any) =>
      isAwaitingDoctorConfirmation(apt) &&
      !optimisticallyConfirmedAppointmentIds.has(String(apt?.id || ""))
  );

  // Patient's proposed appointments (awaiting doctor slot confirmation + payment)
  const { data: myAppointmentsData } = useMyAppointments();
  const { data: appointmentServicesData = [] } = useAppointmentServices();
  const appointmentServices = Array.isArray(appointmentServicesData)
    ? appointmentServicesData
    : [];
  const myProposedVideo = React.useMemo(() => {
    const list = Array.isArray((myAppointmentsData as any)?.appointments)
      ? (myAppointmentsData as any).appointments
      : [];
    return list.filter(
      (apt: any) =>
        isAwaitingDoctorConfirmation(apt) &&
        String(apt.type) === "VIDEO_CALL"
    );
  }, [myAppointmentsData]);

  // Mutations
  const joinVideoAppointment = useJoinVideoAppointment();
  const endVideoAppointment = useEndVideoAppointment();
  const confirmSlotMutation = useConfirmVideoSlot();

  const patientVideoAppointments = React.useMemo(() => {
    const list = Array.isArray((myAppointmentsData as any)?.appointments)
      ? (myAppointmentsData as any).appointments
      : [];

    return list
      .filter((apt: any) => String(apt.type).toUpperCase() === "VIDEO_CALL")
      .map((apt: any) => {
        const dateTime = getAppointmentDateTimeValue(apt);
        return {
          ...apt,
          appointmentId: apt.id,
          roomName: getAppointmentDoctorName(apt),
          startTime: dateTime ? dateTime.toISOString() : apt.appointmentDate || apt.startTime,
          status: String(apt.status || "").toLowerCase().replace(/_/g, "-"),
          doctorName: getAppointmentDoctorName(apt),
          paymentCompleted: isVideoAppointmentPaymentCompleted(apt),
        };
      });
  }, [myAppointmentsData]);

  const appointmentSource =
    userRole === Role.PATIENT ? patientVideoAppointments : appointments;

  const normalizedVideoAppointments = appointmentSource.map((apt: any) => ({
    ...apt,
    status: String(apt.status || "").toLowerCase(),
    paymentCompleted: isVideoAppointmentPaymentCompleted(apt),
  }));

  // Filter appointments
  const filteredAppointments = normalizedVideoAppointments.filter((apt: any) => {
    const matchesSearch =
      !searchTerm ||
      apt.appointmentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.roomName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || filterStatus === "all" || apt.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Separate by status
  const upcomingAppointments = filteredAppointments.filter(
    (apt: any) =>
      apt.status === "scheduled" ||
      apt.status === "confirmed" ||
      apt.status === "in_progress" ||
      apt.status === "in-progress"
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
        role: getVideoTokenRole(session?.user?.role),
      });

      if (result?.token) {
        // Open video consultation in new window or redirect
        window.open(
          `/video-consultation/${appointmentId}?token=${result.token.token}`,
          "_blank"
        );
        showSuccessToast("Joining video consultation...", {
          id: TOAST_IDS.VIDEO.JOIN,
        });
      }
    } catch (error: unknown) {
      showErrorToast(error instanceof Error ? error.message : "Failed to join appointment", {
        id: TOAST_IDS.VIDEO.ERROR,
      });
    }
  };

  const handleEndAppointment = async (appointmentId: string) => {
    try {
      await endVideoAppointment.mutateAsync(appointmentId);
      showSuccessToast("Video appointment ended successfully", {
        id: TOAST_IDS.VIDEO.END,
      });
      refetch();
    } catch (error: unknown) {
      showErrorToast(error instanceof Error ? error.message : "Failed to end appointment", {
        id: TOAST_IDS.VIDEO.ERROR,
      });
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

  const AppointmentCard = ({ appointment }: { appointment: any }) => {
    const paymentCompleted = Boolean(
      appointment.paymentCompleted ?? isVideoAppointmentPaymentCompleted(appointment)
    );
    const paymentAmount =
      userRole === Role.PATIENT
        ? getVideoPaymentAmount(appointment, appointmentServices)
        : 0;
    const shouldShowPaymentButton =
      userRole === Role.PATIENT &&
      (appointment.status === "scheduled" || appointment.status === "confirmed") &&
      !paymentCompleted &&
      paymentAmount > 0;
    const canJoinAppointment = isJoinableVideoAppointment({
      ...appointment,
      paymentCompleted,
    });

    return (
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
                      ? formatDateInIST(new Date(appointment.startTime), {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        })
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {appointment.startTime
                      ? formatTimeInIST(new Date(appointment.startTime), {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>
                    Appointment ID: {appointment.appointmentId?.slice(0, 8)}...
                  </span>
                </div>
                {userRole === Role.PATIENT &&
                  (appointment.status === "scheduled" ||
                    appointment.status === "confirmed") &&
                  !paymentCompleted && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Payment required before you can join</span>
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

            <div className="flex gap-2 flex-wrap justify-end">
              {shouldShowPaymentButton && (
                <PaymentButton
                  appointmentId={appointment.appointmentId}
                  amount={paymentAmount}
                  appointmentType="VIDEO_CALL"
                  description="Video consultation"
                  onSuccess={() => {
                    invalidateAppointmentLists();
                    refetch();
                  }}
                  className="gap-2"
                >
                  Pay INR {paymentAmount.toLocaleString("en-IN")}
                </PaymentButton>
              )}
              {appointment.status === "scheduled" && canJoinAppointment && (
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
              {appointment.status === "in-progress" && canJoinAppointment && (
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
  };

  return (
    <DashboardLayout title="My Appointments">
      <ProtectedComponent permission={Permission.VIEW_VIDEO_APPOINTMENTS}>
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
            <Button variant="outline" className="gap-2">
              <Video className="h-4 w-4" />
              Direct Schedule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Video Appointment</DialogTitle>
              <DialogDescription>
                Schedule directly from the appointments page with video consultation enabled.
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
        {(userRole === Role.PATIENT || userRole === Role.RECEPTIONIST || userRole === Role.ASSISTANT_DOCTOR) && (
          <>
            <Button className="gap-2" onClick={() => setIsProposeDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Propose Video Appointment
            </Button>
            <ProposeVideoAppointmentDialog
              open={isProposeDialogOpen}
              onOpenChange={setIsProposeDialogOpen}
              patientId={userId}
              userRole={userRole}
            />
          </>
        )}
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
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Patient: Pay for proposed video appointments (payment required before doctor confirms) */}
      {userRole === Role.PATIENT && myProposedVideo.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-amber-600" />
              Pay for Proposed Video Appointment
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Complete payment so the doctor can confirm your preferred time slot.
            </p>
            <div className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
              {myProposedVideo.map((apt: any) => {
                const paymentAmount = getVideoPaymentAmount(apt, appointmentServices);

                return (
                  <Card key={apt.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">
                            Video appointment with {apt.doctor?.user?.name ?? apt.doctorName ?? "Doctor"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Proposed slots:{" "}
                            {(apt.proposedSlots || [])
                              .map((s: { date: string; time: string }) => `${s.date} @ ${s.time}`)
                              .join(", ")}
                          </p>
                        </div>
                        {paymentAmount > 0 && !isVideoAppointmentPaymentCompleted(apt) ? (
                          <PaymentButton
                            appointmentId={apt.id}
                            amount={paymentAmount}
                            appointmentType="VIDEO_CALL"
                            description="Video consultation"
                            onSuccess={() => {
                              invalidateAppointmentLists();
                              refetch();
                            }}
                            className="gap-2"
                          >
                            Pay INR {paymentAmount.toLocaleString("en-IN")}
                          </PaymentButton>
                        ) : (
                          <Button variant="outline" className="gap-2 border-amber-200 bg-amber-50 text-amber-700 pointer-events-none" disabled>
                            <Clock className="w-4 h-4" />
                            Awaiting Doctor Confirmation
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Awaiting Slot Confirmation (Doctor only) */}
      {(userRole === Role.DOCTOR || userRole === Role.ASSISTANT_DOCTOR || userRole === Role.RECEPTIONIST) && awaitingConfirmation.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-amber-600" />
              Awaiting Slot Confirmation ({awaitingConfirmation.length})
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Patients have proposed time slots. Select one to confirm each appointment.
            </p>
            <div className="space-y-4">
              {awaitingConfirmation.map((apt: any) => (
                <Card key={apt.id} className="border-amber-100 bg-amber-50/70 shadow-sm dark:border-amber-900 dark:bg-amber-950/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">
                          {apt.patient?.user?.name ?? apt.patientName ?? "Patient"} – Video appointment
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Proposed slots:
                        </p>
                        <div className="grid gap-3 mt-3 md:grid-cols-3">
                          {(apt.proposedSlots || []).map((s: { date: string; time: string }, i: number) => (
                            <div
                              key={i}
                              className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 shadow-sm dark:border-amber-800/70 dark:bg-amber-950/30"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                                    Option {i + 1}
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-foreground">
                                    {formatProposedSlotDate(s)}
                                  </p>
                                </div>
                                <Badge className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/60 dark:text-amber-100">
                                  Proposed
                                </Badge>
                              </div>
                              <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-amber-100 bg-background/80 px-3 py-2 text-sm dark:border-amber-900/50 dark:bg-card/80">
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Time
                                  </p>
                                  <p className="mt-0.5 font-semibold text-foreground">
                                    {formatProposedSlotTime(s)}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 rounded-full border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                                  disabled={confirmSlotMutation.isPending}
                                  onClick={async () => {
                                    await confirmSlotMutation.mutateAsync({
                                      appointmentId: apt.id,
                                      confirmedSlotIndex: i,
                                    });
                                    setOptimisticallyConfirmedAppointmentIds(prev => {
                                      const next = new Set(prev);
                                      next.add(String(apt.id));
                                      return next;
                                    });
                                  }}
                                >
                                  Confirm
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-xl border border-dashed border-amber-200 bg-background/80 p-3 dark:border-amber-800/70 dark:bg-card/80">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground">Need a fallback slot?</p>
                              <p className="text-sm text-muted-foreground">
                                Use the custom slot dialog when none of the proposed times work.
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="rounded-xl"
                              onClick={() => {
                                // Shared page keeps the fallback in the dedicated doctor view.
                              }}
                              disabled
                            >
                              <Clock className="mr-1.5 h-3.5 w-3.5" />
                              Custom fallback only
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
          {isPending ? (
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
      </ProtectedComponent>
    </DashboardLayout>
  );
}
