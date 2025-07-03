"use client";

import React, { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
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
  useFormatAppointmentDateTime,
  useAppointmentStatusColor,
  useDoctorQueue,
} from "@/hooks/useAppointments";
import {
  AppointmentWithRelations,
  CreateAppointmentData,
} from "@/types/appointment.types";
import { useClinicLocations, useClinicDoctors } from "@/hooks/useClinics";

export default function AppointmentManager() {
  const { toast } = useToast();
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentWithRelations | null>(null);
  const [newAppointment, setNewAppointment] = useState<CreateAppointmentData>({
    doctorId: "",
    locationId: "",
    date: "",
    time: "",
    duration: 30,
    type: "CONSULTATION",
    notes: "",
  });

  // Appointment CRUD hooks
  const { data: appointments, isPending: appointmentsLoading } =
    useAppointments();
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

  // Location and doctor data
  const CLINIC_ID = process.env.NEXT_PUBLIC_CLINIC_ID!;
  const { data: locations } = useClinicLocations(CLINIC_ID);
  const { data: doctors } = useClinicDoctors(CLINIC_ID);

  // Check-in and queue hooks
  const { mutate: processCheckIn, isPending: processingCheckIn } =
    useProcessCheckIn();
  const { data: queuePosition } = usePatientQueuePosition(
    selectedAppointment?.id || ""
  );

  // Queue management
  const { data: doctorQueue } = useDoctorQueue(
    selectedAppointment?.doctorId || "",
    selectedAppointment?.date || ""
  );
  const { mutate: confirmAppointment, isPending: confirmingAppointment } =
    useConfirmAppointment();
  const { mutate: startConsultation, isPending: startingConsultation } =
    useStartConsultation();

  // Utility hooks
  const canCancelData = useCanCancelAppointment(selectedAppointment);
  const { formatDateTime } = useFormatAppointmentDateTime();
  const { getStatusColor } = useAppointmentStatusColor();

  const handleCreateAppointment = () => {
    createAppointment(newAppointment, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Appointment created successfully",
        });
        setNewAppointment({
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
  };

  const handleCancelAppointment = (id: string) => {
    cancelAppointment(id, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Appointment cancelled successfully",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to cancel appointment",
          variant: "destructive",
        });
      },
    });
  };

  const handleProcessCheckIn = (appointmentId: string) => {
    processCheckIn(
      { appointmentId },
      {
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
      }
    );
  };

  const handleConfirmAppointment = (appointmentId: string) => {
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
  };

  const handleStartConsultation = (appointmentId: string, doctorId: string) => {
    startConsultation(
      { appointmentId, data: { doctorId } },
      {
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
      }
    );
  };

  if (appointmentsLoading) {
    return <div>Loading appointments...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Appointment Manager</h1>

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
                value={newAppointment.locationId}
                onValueChange={(value) =>
                  setNewAppointment({ ...newAppointment, locationId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
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
                  {doctors?.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.user.firstName} {doctor.user.lastName}
                    </SelectItem>
                  ))}
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
                  setNewAppointment({ ...newAppointment, type: value })
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
                    doctorAvailability.availableSlots?.length > 0
                      ? "default"
                      : "destructive"
                  }
                >
                  {doctorAvailability.availableSlots?.length > 0 ? "Yes" : "No"}
                </Badge>
              </div>
              {doctorAvailability.availableSlots &&
                doctorAvailability.availableSlots.length > 0 && (
                  <div>
                    <span className="font-medium">Available Slots:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {doctorAvailability.availableSlots.map((slot, index) => (
                        <Badge key={index} variant="outline">
                          {slot}
                        </Badge>
                      ))}
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
            {appointments?.map((appointment) => (
              <div
                key={appointment.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedAppointment(appointment)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">
                      {appointment.doctor.user.firstName}{" "}
                      {appointment.doctor.user.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(appointment.date, appointment.time)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {appointment.location.name}
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
                        setSelectedAppointment(appointment);
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
                  {selectedAppointment.doctor.user.firstName}{" "}
                  {selectedAppointment.doctor.user.lastName} -{" "}
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
                {canCancelData.canCancel && (
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

                {canCancelData.canCheckIn && (
                  <Button
                    onClick={() => handleProcessCheckIn(selectedAppointment.id)}
                    disabled={processingCheckIn}
                  >
                    Check In
                  </Button>
                )}

                {canCancelData.canStart && (
                  <Button
                    onClick={() =>
                      handleConfirmAppointment(selectedAppointment.id)
                    }
                    disabled={confirmingAppointment}
                  >
                    Confirm
                  </Button>
                )}

                {canCancelData.canComplete && (
                  <Button
                    onClick={() =>
                      handleStartConsultation(
                        selectedAppointment.id,
                        selectedAppointment.doctorId
                      )
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
                    <p>Total in Queue: {queuePosition.totalInQueue}</p>
                  </div>
                )}

                {/* Doctor Queue */}
                {doctorQueue && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Doctor Queue</h4>
                    <p>Appointments: {doctorQueue.appointments?.length || 0}</p>
                    <p>
                      Current Position: {doctorQueue.currentPosition || "N/A"}
                    </p>
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
                      {appointment.doctor.user.firstName}{" "}
                      {appointment.doctor.user.lastName}
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
