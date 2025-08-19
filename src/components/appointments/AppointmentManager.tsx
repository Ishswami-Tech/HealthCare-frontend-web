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
  useDoctorQueue,
} from "@/hooks/useAppointments";
import {
  AppointmentWithRelations,
  CreateAppointmentData,
} from "@/types/appointment.types";
import { useClinicLocations, useClinicDoctors } from "@/hooks/useClinics";
import { useClinicContext } from "@/hooks/useClinic";

export default function AppointmentManager() {
  const { toast } = useToast();
  const { clinicId } = useClinicContext();
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
    useAppointments(clinicId || "");
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
    selectedAppointment?.doctorId || ""
  );
  const { mutate: confirmAppointment, isPending: confirmingAppointment } =
    useConfirmAppointment();
  const { mutate: startConsultation, isPending: startingConsultation } =
    useStartConsultation();

  // Utility hooks
  const canCancelData = useCanCancelAppointment(selectedAppointment || undefined);
  
  // Utility function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'CHECKED_IN': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'NO_SHOW': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Utility function to format date and time
  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

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

                {selectedAppointment?.status === 'CONFIRMED' && (
                  <Button
                    onClick={() => handleProcessCheckIn(selectedAppointment.id)}
                    disabled={processingCheckIn}
                  >
                    Check In
                  </Button>
                )}

                {selectedAppointment?.status === 'CHECKED_IN' && (
                  <Button
                    onClick={() =>
                      handleConfirmAppointment(selectedAppointment.id)
                    }
                    disabled={confirmingAppointment}
                  >
                    Confirm
                  </Button>
                )}

                {selectedAppointment?.status === 'IN_PROGRESS' && (
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
                  </div>
                )}

                {/* Doctor Queue */}
                {doctorQueue && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Doctor Queue</h4>
                    <p>Appointments in Queue: {Array.isArray(doctorQueue) ? doctorQueue.length : 0}</p>
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
