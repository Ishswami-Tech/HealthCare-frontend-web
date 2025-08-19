"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { useAuth } from "@/hooks/useAuth";
import {
  useMyAppointments,
  useAppointments,
  useUpdateAppointment,
  useCancelAppointment,
  useAppointmentStats,
} from "@/hooks/useAppointments";
import { useClinicContext } from "@/hooks/useClinic";
import { useRBAC } from "@/hooks/useRBAC";
import {
  AppointmentProtectedComponent,
  ProtectedComponent,
} from "@/components/rbac";
import { Role } from "@/types/auth.types";
import { Permission } from "@/types/rbac.types";
import { AppointmentWithRelations } from "@/types/appointment.types";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Video,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function AppointmentsPage() {
  const { session } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const userRole = session?.user?.role as Role;

  // RBAC permissions
  const rbac = useRBAC();

  // Clinic context
  const { clinicId } = useClinicContext();

  // Determine which appointments to fetch based on role
  const shouldFetchAllAppointments = rbac.hasPermission(
    Permission.VIEW_ALL_APPOINTMENTS
  );

  // Fetch appointments data with proper permissions
  // Always call both hooks to avoid conditional hook calls
  const allAppointmentsQuery = useAppointments(clinicId || "", {
    ...(filterDoctor && { doctorId: filterDoctor }),
    ...(filterType && { type: filterType }),
    ...(filterStatus && { status: filterStatus }),
  });

  const myAppointmentsQuery = useMyAppointments({
    ...(filterDoctor && { doctorId: filterDoctor }),
    ...(filterType && { type: filterType }),
    ...(filterStatus && { status: filterStatus }),
  });

  // Use the appropriate query result
  const {
    data: appointments,
    isPending: isLoading,
    error,
    refetch: refetchAppointments,
  } = shouldFetchAllAppointments ? allAppointmentsQuery : myAppointmentsQuery;

  // Fetch appointment statistics for authorized users
  const { data: appointmentStats } = useAppointmentStats('default-tenant');

  // Mutation hooks for appointment actions
  const updateAppointmentMutation = useUpdateAppointment();
  const cancelAppointmentMutation = useCancelAppointment();

  // Separate upcoming and past appointments
  const now = new Date();
  const upcomingAppointments =
    appointments?.filter((apt) => new Date(apt.date) >= now) || [];

  const pastAppointments =
    appointments?.filter((apt) => new Date(apt.date) < now) || [];

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">
            Error loading appointments: {error?.message || 'Unknown error'}
          </p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }


  const mockPastAppointments = [
    {
      id: "4",
      patientName: "Sunita Devi",
      doctorName: "Dr. Priya Sharma",
      date: "2025-08-05",
      time: "9:00 AM",
      type: "Follow-up",
      mode: "in-person",
      status: "completed",
      clinic: "Ayurveda Center",
      phone: "+91 65432 10987",
    },
    {
      id: "5",
      patientName: "Manoj Tiwari",
      doctorName: "Dr. Amit Patel",
      date: "2025-08-03",
      time: "3:00 PM",
      type: "Agnikarma",
      mode: "in-person",
      status: "completed",
      clinic: "Wellness Clinic",
      phone: "+91 54321 09876",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Consultation":
        return "bg-blue-100 text-blue-800";
      case "Panchakarma":
        return "bg-purple-100 text-purple-800";
      case "Agnikarma":
        return "bg-orange-100 text-orange-800";
      case "Nadi Pariksha":
        return "bg-green-100 text-green-800";
      case "Follow-up":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handle appointment actions
  const handleUpdateAppointment = (
    appointmentId: string,
    updates: any
  ) => {
    updateAppointmentMutation.mutate({ id: appointmentId, data: updates }, {
      onSuccess: () => {
        refetchAppointments();
      },
      onError: (error) => {
        console.error("Failed to update appointment:", error);
      }
    });
  };

  const handleCancelAppointment = (appointmentId: string) => {
    cancelAppointmentMutation.mutate(appointmentId, {
      onSuccess: () => {
        refetchAppointments();
      },
      onError: (error) => {
        console.error("Failed to cancel appointment:", error);
      }
    });
  };

  const AppointmentCard = ({
    appointment,
    showActions = true,
  }: {
    appointment: AppointmentWithRelations;
    showActions?: boolean;
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {userRole === Role.PATIENT
                    ? appointment.doctor?.user?.name || `${appointment.doctor?.user?.firstName || ''} ${appointment.doctor?.user?.lastName || ''}`.trim()
                    : appointment.patient?.user?.name || `${appointment.patient?.user?.firstName || ''} ${appointment.patient?.user?.lastName || ''}`.trim()}
                </h3>
                <p className="text-sm text-gray-600">
                  {userRole === Role.PATIENT
                    ? appointment.location?.name
                    : appointment.patient?.user?.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{appointment.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{appointment.time}</span>
              </div>
              <div className="flex items-center gap-2">
                {appointment.type === "video" ? (
                  <Video className="w-4 h-4 text-gray-500" />
                ) : (
                  <MapPin className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-sm capitalize">{appointment.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{appointment.location?.phone || 'N/A'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Badge className={getTypeColor(appointment.type)}>
                {appointment.type}
              </Badge>
              <Badge className={getStatusColor(appointment.status)}>
                {appointment.status}
              </Badge>
            </div>
          </div>

          {showActions && (
            <div className="flex flex-col gap-2">
              {/* View button - always visible if user can view appointments */}
              <AppointmentProtectedComponent action="view">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  View
                </Button>
              </AppointmentProtectedComponent>

              {appointment.status !== "completed" && (
                <>
                  {/* Edit button - only for users with update permission */}
                  <AppointmentProtectedComponent action="update">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() =>
                        handleUpdateAppointment(appointment.id, {})
                      }
                      disabled={updateAppointmentMutation.isPending}
                    >
                      <Edit className="w-3 h-3" />
                      {updateAppointmentMutation.isPending
                        ? "Updating..."
                        : "Edit"}
                    </Button>
                  </AppointmentProtectedComponent>

                  {/* Cancel button - only for users with delete permission */}
                  <AppointmentProtectedComponent action="delete">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      onClick={() => handleCancelAppointment(appointment.id)}
                      disabled={cancelAppointmentMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3" />
                      {cancelAppointmentMutation.isPending
                        ? "Cancelling..."
                        : "Cancel"}
                    </Button>
                  </AppointmentProtectedComponent>
                </>
              )}

              {/* Queue management actions for authorized users */}
              {appointment.status === "confirmed" && (
                <AppointmentProtectedComponent action="manage">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex items-center gap-1"
                    onClick={() =>
                      handleUpdateAppointment(appointment.id, {
                        status: "IN_PROGRESS",
                      })
                    }
                  >
                    <CheckCircle className="w-3 h-3" />
                    Start
                  </Button>
                </AppointmentProtectedComponent>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Statistics Cards for authorized users */}
      <ProtectedComponent
        permission={Permission.VIEW_ALL_APPOINTMENTS}
        showFallback={false}
      >
        {appointmentStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Today
                    </p>
                    <p className="text-2xl font-bold">
                      {appointmentStats?.total || 0}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Confirmed
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {appointmentStats.confirmed || 0}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {appointmentStats?.scheduled || 0}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Cancelled
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {appointmentStats.cancelled || 0}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </ProtectedComponent>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-gray-600">
            {shouldFetchAllAppointments
              ? "Manage all appointments and schedules"
              : "Manage your appointments and schedule"}
          </p>
        </div>

        {/* Create appointment button with RBAC */}
        <AppointmentProtectedComponent action="create">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Book Appointment
          </Button>
        </AppointmentProtectedComponent>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterDoctor} onValueChange={setFilterDoctor}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by doctor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doctors</SelectItem>
                <SelectItem value="dr-priya">Dr. Priya Sharma</SelectItem>
                <SelectItem value="dr-amit">Dr. Amit Patel</SelectItem>
                <SelectItem value="dr-ravi">Dr. Ravi Mehta</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="consultation">Consultation</SelectItem>
                <SelectItem value="panchakarma">Panchakarma</SelectItem>
                <SelectItem value="agnikarma">Agnikarma</SelectItem>
                <SelectItem value="nadi-pariksha">Nadi Pariksha</SelectItem>
              </SelectContent>
            </Select>

            {/* Status filter - only for users who can view all appointments */}
            <ProtectedComponent
              permission={Permission.VIEW_ALL_APPOINTMENTS}
              showFallback={false}
            >
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="NO_SHOW">No Show</SelectItem>
                </SelectContent>
              </Select>
            </ProtectedComponent>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No upcoming appointments
                </h3>
                <p className="text-gray-500 mb-4">
                  You don't have any appointments scheduled.
                </p>
                {userRole === Role.PATIENT && (
                  <Button>Book Your First Appointment</Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {(pastAppointments.length > 0
            ? pastAppointments
            : mockPastAppointments
          ).length > 0 ? (
            (pastAppointments.length > 0
              ? pastAppointments
              : mockPastAppointments
            ).map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment as AppointmentWithRelations}
                showActions={false}
              />
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No past appointments
                </h3>
                <p className="text-gray-500">
                  Your appointment history will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
