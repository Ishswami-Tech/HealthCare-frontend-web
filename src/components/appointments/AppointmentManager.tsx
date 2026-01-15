"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import {
  useWebSocketIntegration,
} from "@/hooks/realtime/useWebSocketIntegration";
import {
  useRealTimeAppointments,
  useRealTimeAppointmentMutation,
} from "@/hooks/realtime/useRealTimeQueries";
import { useAppointmentsStore } from "@/stores";
import {
  useAppointments,
  useCreateAppointment,
  useCancelAppointment,
  useDoctorAvailability,
  useUserUpcomingAppointments,
  useProcessCheckIn,
  usePatientQueuePosition,
  useConfirmAppointment,
  useStartConsultation,
  useCanCancelAppointment,
  useDoctorQueue,
} from "@/hooks/query/useAppointments";
import {
  AppointmentWithRelations,
  CreateAppointmentData,
  AppointmentType,
} from "@/types/appointment.types";
import { useClinicLocations, useClinicDoctors } from "@/hooks/query/useClinics";
// import { APP_CONFIG } from "@/lib/config/config";

export default function AppointmentManager() {
  const { toast } = useToast();

  // Real-time WebSocket integration
  const { isConnected, isReady: isRealTimeEnabled } = useWebSocketIntegration({
    subscribeToAppointments: true,
    autoConnect: true,
  });

  // Enhanced appointment hooks with real-time updates
  const { data: realTimeAppointments } = useRealTimeAppointments();
  const { createAppointment: createRealTimeAppointment } =
    useRealTimeAppointmentMutation();

  // Zustand store integration
  const { setSelectedAppointment: setStoreSelectedAppointment } =
    useAppointmentsStore();
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentWithRelations | null>(null);
  const [newAppointment, setNewAppointment] = useState<CreateAppointmentData>({
    patientId: "",
    doctorId: "",
    locationId: "",
    date: "",
    time: "",
    duration: 30,
    type: "CONSULTATION",
    notes: "",
  });

  // Appointment CRUD hooks (fallback for non-real-time)
  const { data: appointments, isPending: appointmentsLoading } =
    useAppointments();

  // Use real-time data if available, otherwise fallback to regular data
  const appointmentData = realTimeAppointments?.success
    ? realTimeAppointments
    : appointments;
  const isAppointmentsLoading = isRealTimeEnabled ? false : appointmentsLoading;
  const { mutate: createAppointment, isPending: creatingAppointment } =
    useCreateAppointment();
  const { mutate: cancelAppointment, isPending: cancellingAppointment } =
    useCancelAppointment();

  // Doctor availability
  const { data: doctorAvailability } = useDoctorAvailability(
    newAppointment.doctorId,
    newAppointment.date
  );

  // User appointments
  const { data: upcomingAppointments } = useUserUpcomingAppointments("user-id");

  // Location and doctor data (memoized)
  // Use environment-aware clinic ID with fallback
  const CLINIC_ID = useMemo(
    () => process.env.NEXT_PUBLIC_CLINIC_ID || "CL0002",
    []
  );
  const { data: locations } = useClinicLocations(CLINIC_ID);
  const { data: doctors } = useClinicDoctors(CLINIC_ID);

  // Check-in and queue hooks
  const { mutate: processCheckIn, isPending: processingCheckIn } =
    useProcessCheckIn();
  const { data: queuePosition } = usePatientQueuePosition(
    selectedAppointment?.patientId || "",
    "appointment"
  );

  // Queue management
  const { data: doctorQueue } = useDoctorQueue(
    selectedAppointment?.doctorId || ""
  );
  const { mutate: confirmAppointment, isPending: confirmingAppointment } =
    useConfirmAppointment();
  const { mutate: startConsultation, isPending: startingConsultation } =
    useStartConsultation();

  // Utility hooks
  const canCancelData = useCanCancelAppointment(selectedAppointment?.id || "");

  // Utility function to get status color (memoized)
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800";
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "CHECKED_IN":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-800";
      case "COMPLETED":
        return "bg-muted text-muted-foreground";
      case "CANCELLED":
        return "bg-destructive/10 text-destructive";
      case "NO_SHOW":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  }, []);

  // Utility function to format date and time
  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleCreateAppointment = () => {
    if (isRealTimeEnabled) {
      createRealTimeAppointment.mutate(newAppointment as any, {
        onSuccess: (data) => {
          toast({
            title: "Success",
            description: "Appointment created successfully (real-time updated)",
          });

          // Reset form
          setNewAppointment({
            patientId: "",
            doctorId: "",
            locationId: "",
            date: "",
            time: "",
            duration: 30,
            type: "CONSULTATION",
            notes: "",
          });

          // Update Zustand store
          if (data?.data) {
            useAppointmentsStore.getState().addAppointment(data.data);
          }
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to create appointment",
            variant: "destructive",
          });
        },
      });
    } else {
      createAppointment(newAppointment, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Appointment created successfully",
            id: TOAST_IDS.APPOINTMENT.CREATE, // ✅ Prevent duplicates
          });
          setNewAppointment({
            patientId: "",
            doctorId: "",
            locationId: "",
            date: "",
            time: "",
            duration: 30,
            type: "CONSULTATION",
            notes: "",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to create appointment",
            variant: "destructive",
          });
        },
      });
    }
  };

  const handleCancelAppointment = useCallback(
    (id: string) => {
      cancelAppointment(
        { id },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "Appointment cancelled successfully",
              id: TOAST_IDS.APPOINTMENT.DELETE, // ✅ Prevent duplicates
            });
          },
          onError: (error: Error) => {
            // ✅ Use centralized error handler
            toast({
              title: "Error",
              description: sanitizeErrorMessage(error) || "Failed to cancel appointment",
              variant: "destructive",
              id: TOAST_IDS.APPOINTMENT.DELETE, // ✅ Prevent duplicates
            });
          },
        }
      );
    },
    [cancelAppointment, toast]
  );

  const handleProcessCheckIn = useCallback(
    (appointmentId: string) => {
      processCheckIn(appointmentId, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Check-in processed successfully",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to process check-in",
            variant: "destructive",
          });
        },
      });
    },
    [processCheckIn, toast]
  );

  const handleConfirmAppointment = useCallback(
    (appointmentId: string) => {
      confirmAppointment(appointmentId, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Appointment confirmed successfully",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to confirm appointment",
            variant: "destructive",
          });
        },
      });
    },
    [confirmAppointment, toast]
  );

  const handleStartConsultation = (appointmentId: string) => {
    startConsultation(appointmentId, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Consultation started successfully",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to start consultation",
          variant: "destructive",
        });
      },
    });
  };

  // Show real-time connection status
  useEffect(() => {
    if (isRealTimeEnabled && isConnected) {
      toast({
        title: "Real-time Updates Active",
        description: "Appointment updates will appear instantly",
        duration: 3000,
      });
    }
  }, [isRealTimeEnabled, isConnected, toast]);

  if (isAppointmentsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading appointments...</p>
          {isRealTimeEnabled && (
            <p className="text-sm text-muted-foreground mt-1">
              Real-time updates {isConnected ? "connected" : "connecting..."}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Appointment Manager</h1>
        {isRealTimeEnabled && (
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-yellow-500"
              }`}
            ></div>
            <span className="text-sm text-muted-foreground">
              {isConnected ? "Real-time connected" : "Connecting..."}
            </span>
          </div>
        )}
      </div>

      {/* Appointment Statistics */}
      {/* {appointmentStats && (
        <Card>
          <CardHeader>
            <CardTitle>Appointment Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{appointmentStats.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{appointmentStats.scheduled}</div>
                <div className="text-sm text-gray-600">Scheduled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{appointmentStats.confirmed}</div>
                <div className="text-sm text-gray-600">Confirmed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{appointmentStats.completed}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* Create New Appointment */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Appointment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Select
                onValueChange={(value) =>
                  setNewAppointment({ ...newAppointment, locationId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(locations) ? locations.map((location: any) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  )) : null}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="doctor">Doctor</Label>
              <Select
                value={newAppointment.doctorId}
                onValueChange={(value) =>
                  setNewAppointment({ ...newAppointment, doctorId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(doctors) ? doctors.map((doctor: any) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.user?.firstName} {doctor.user?.lastName}
                    </SelectItem>
                  )) : null}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                value={newAppointment.date}
                onChange={(e) =>
                  setNewAppointment({ ...newAppointment, date: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                type="time"
                value={newAppointment.time}
                onChange={(e) =>
                  setNewAppointment({ ...newAppointment, time: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                type="number"
                value={newAppointment.duration}
                onChange={(e) =>
                  setNewAppointment({
                    ...newAppointment,
                    duration: parseInt(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={newAppointment.type}
                onValueChange={(value) =>
                  setNewAppointment({ ...newAppointment, type: value as AppointmentType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONSULTATION">Consultation</SelectItem>
                  <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                  <SelectItem value="EMERGENCY">Emergency</SelectItem>
                  <SelectItem value="ROUTINE_CHECKUP">
                    Routine Checkup
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              value={newAppointment.notes}
              onChange={(e) =>
                setNewAppointment({ ...newAppointment, notes: e.target.value })
              }
              placeholder="Additional notes..."
            />
          </div>

          <Button
            onClick={handleCreateAppointment}
            disabled={creatingAppointment}
            className="w-full"
          >
            {creatingAppointment ? "Creating..." : "Create Appointment"}
          </Button>
        </CardContent>
      </Card>

      {/* Doctor Availability */}
      {doctorAvailability && (
        <Card>
          <CardHeader>
            <CardTitle>Doctor Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Available:</span>
                <Badge
                  variant={
                    (doctorAvailability as any)?.availableSlots?.length > 0
                      ? "default"
                      : "destructive"
                  }
                >
                  {(doctorAvailability as any)?.availableSlots?.length > 0 ? "Yes" : "No"}
                </Badge>
              </div>
              {(doctorAvailability as any)?.availableSlots &&
                (doctorAvailability as any).availableSlots.length > 0 && (
                  <div>
                    <span className="font-medium">Available Slots:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(doctorAvailability as any).availableSlots.map(
                        (slot: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {slot}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {((appointmentData as unknown as any[]) || []).map((appointment: AppointmentWithRelations) => (
              <div
                key={appointment.id}
                className="border border-border rounded-lg p-4 hover:bg-muted cursor-pointer"
                onClick={() => {
                  setSelectedAppointment(
                    appointment as AppointmentWithRelations
                  );
                  if (isRealTimeEnabled) {
                    setStoreSelectedAppointment(appointment);
                  }
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">
                      {appointment.doctor?.user?.firstName || ""}{" "}
                      {appointment.doctor?.user?.lastName || ""}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(appointment.date, appointment.time)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.location?.name || ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAppointment(
                          appointment as AppointmentWithRelations
                        );
                        if (isRealTimeEnabled) {
                          setStoreSelectedAppointment(appointment);
                        }
                      }}
                    >
                      Actions
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Appointment Actions */}
      {selectedAppointment && (
        <Card>
          <CardHeader>
            <CardTitle>Appointment Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Selected Appointment</h3>
                <p>
                  {selectedAppointment.doctor?.user?.firstName || ""}{" "}
                  {selectedAppointment.doctor?.user?.lastName || ""} -{" "}
                  {formatDateTime(
                    selectedAppointment.date,
                    selectedAppointment.time
                  )}
                </p>
                <Badge className={getStatusColor(selectedAppointment.status)}>
                  {selectedAppointment.status}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {canCancelData && (
                  <Button
                    variant="destructive"
                    onClick={() =>
                      handleCancelAppointment(selectedAppointment.id)
                    }
                    disabled={cancellingAppointment}
                  >
                    Cancel
                  </Button>
                )}

                {selectedAppointment?.status === "CONFIRMED" && (
                  <Button
                    onClick={() => handleProcessCheckIn(selectedAppointment.id)}
                    disabled={processingCheckIn}
                  >
                    Check In
                  </Button>
                )}

                {selectedAppointment?.status === "CHECKED_IN" && (
                  <Button
                    onClick={() =>
                      handleConfirmAppointment(selectedAppointment.id)
                    }
                    disabled={confirmingAppointment}
                  >
                    Confirm
                  </Button>
                )}

                {selectedAppointment?.status === "IN_PROGRESS" && (
                  <Button
                    onClick={() =>
                      handleStartConsultation(selectedAppointment.id)
                    }
                    disabled={startingConsultation}
                  >
                    Start Consultation
                  </Button>
                )}

                {/* Queue Information */}
                {queuePosition && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Queue Position</h4>
                    <p>Position: {queuePosition.position}</p>
                    <p>
                      Estimated Wait: {queuePosition.estimatedWaitTime} minutes
                    </p>
                  </div>
                )}

                {/* Doctor Queue */}
                {doctorQueue && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Doctor Queue</h4>
                    <p>
                      Appointments in Queue:{" "}
                      {Array.isArray(doctorQueue) ? doctorQueue.length : 0}
                    </p>
                    <p>Queue Status: Active</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Appointments */}
      {upcomingAppointments && upcomingAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">
                      {appointment.doctor?.user?.firstName || ""}{" "}
                      {appointment.doctor?.user?.lastName || ""}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(appointment.date, appointment.time)}
                    </p>
                  </div>
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
