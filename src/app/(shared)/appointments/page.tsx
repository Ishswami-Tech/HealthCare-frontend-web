"use client";

import React, { useState, useMemo, useCallback } from "react";
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
import { useJoinVideoAppointment } from "@/hooks/useVideoAppointments";
import { useClinicContext } from "@/hooks/useClinic";
import { useRBAC } from "@/hooks/useRBAC";
import {
  useRealTimeAppointments,
  useWebSocketQuerySync,
} from "@/hooks/useRealTimeQueries";
import { useDebouncedCallback } from "@/lib/performance";
import { PAGINATION } from "@/lib/query/query-config";
import { Pagination } from "@/components/virtual/VirtualizedList";
import {
  AppointmentProtectedComponent,
  ProtectedComponent,
} from "@/components/rbac";
import { Role } from "@/types/auth.types";
import { Permission } from "@/types/rbac.types";
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search to reduce API calls (optimized for 10M users)
  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearchTerm(value);
    setPage(1); // Reset to first page on new search
  }, 300);

  React.useEffect(() => {
    debouncedSetSearch(searchTerm);
  }, [searchTerm, debouncedSetSearch]);

  const userRole = session?.user?.role as Role;

  // RBAC permissions
  const rbac = useRBAC();

  // Clinic context
  const { clinicId } = useClinicContext();

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  // Determine which appointments to fetch based on role
  const shouldFetchAllAppointments = rbac.hasPermission(
    Permission.VIEW_ALL_APPOINTMENTS
  );

  // Fetch appointments data with proper permissions, real-time updates, and pagination
  // Always call hooks, but conditionally enable them
  const allAppointmentsQuery = useAppointments(clinicId || "", {
    search: debouncedSearchTerm, // Use debounced search
    doctorId: filterDoctor || undefined,
    type: filterType || undefined,
    status: filterStatus || undefined,
    page,
    limit: PAGINATION.DEFAULT_PAGE_SIZE,
  });

  const myAppointmentsQuery = useMyAppointments({
    status: filterStatus || undefined,
    page,
    limit: PAGINATION.DEFAULT_PAGE_SIZE,
  });

  // Use the appropriate query based on permissions
  const appointmentsQuery = shouldFetchAllAppointments
    ? allAppointmentsQuery
    : myAppointmentsQuery;

  // Real-time appointments hook for live updates (with pagination)
  const realTimeAppointments = useRealTimeAppointments({
    doctorId: filterDoctor || undefined,
    type: filterType ? [filterType as any] : undefined,
    status: filterStatus ? [filterStatus as any] : undefined,
    searchQuery: debouncedSearchTerm || undefined,
  } as any);

  // Use real-time data if available, otherwise fall back to regular query
  const appointmentsData =
    realTimeAppointments.isRealTimeEnabled && realTimeAppointments.data
      ? realTimeAppointments.data
      : shouldFetchAllAppointments
      ? (appointmentsQuery.data as any)?.appointments ||
        (appointmentsQuery.data as any)?.data ||
        appointmentsQuery.data
      : appointmentsQuery.data;

  const appointments = Array.isArray(appointmentsData) ? appointmentsData : [];
  const isLoading =
    appointmentsQuery.isPending || realTimeAppointments.isPending;
  const error = appointmentsQuery.error || realTimeAppointments.error;
  const refetchAppointments = () => {
    appointmentsQuery.refetch();
    realTimeAppointments.refetch();
  };

  // Fetch appointment statistics for authorized users
  const { data: appointmentStats } = useAppointmentStats();

  // Mutation hooks for appointment actions
  const updateAppointmentMutation = useUpdateAppointment();
  const cancelAppointmentMutation = useCancelAppointment();
  const joinVideoAppointment = useJoinVideoAppointment();

  const [activeTab, setActiveTab] = useState("upcoming");

  // Memoize filtered appointments for performance (optimized for 10M users)
  const { upcomingAppointments, pastAppointments, totalPages } = useMemo(() => {
    const now = new Date();
    const appointmentsList = Array.isArray(appointments) ? appointments : [];

    const upcoming = appointmentsList.filter(
      (apt) => new Date(apt.date) >= now
    );
    const past = appointmentsList.filter((apt) => new Date(apt.date) < now);

    // Calculate pagination
    const pageSize = PAGINATION.DEFAULT_PAGE_SIZE;
    const currentList = activeTab === "upcoming" ? upcoming : past;
    const totalPages = Math.ceil(currentList.length / pageSize);

    // Paginate the current list
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedUpcoming = upcoming.slice(startIndex, endIndex);
    const paginatedPast = past.slice(startIndex, endIndex);

    return {
      upcomingAppointments: paginatedUpcoming,
      pastAppointments: paginatedPast,
      totalPages,
      totalUpcoming: upcoming.length,
      totalPast: past.length,
    };
  }, [appointments, page, activeTab]);

  // Extract totals for pagination
  const { totalUpcoming, totalPast } = useMemo(() => {
    const now = new Date();
    const appointmentsList = Array.isArray(appointments) ? appointments : [];
    return {
      totalUpcoming: appointmentsList.filter(
        (apt: any) => new Date(apt.date) >= now
      ).length,
      totalPast: appointmentsList.filter((apt: any) => new Date(apt.date) < now)
        .length,
    };
  }, [appointments]);

  // AppointmentCard is already memoized above

  // Reset page when tab changes
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    setPage(1);
  }, []);

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
            Error loading appointments: {error.message}
          </p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Real-time data from API - no mock data

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
  const handleUpdateAppointment = async (
    appointmentId: string,
    updates: any
  ) => {
    try {
      await updateAppointmentMutation.mutateAsync({
        id: appointmentId,
        data: updates,
      });
      refetchAppointments();
    } catch (error) {
      console.error("Failed to update appointment:", error);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await cancelAppointmentMutation.mutateAsync({ id: appointmentId });
      refetchAppointments();
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
    }
  };

  const handleJoinVideo = async (appointmentId: string) => {
    try {
      const userId = session?.user?.id || "";
      const result = await joinVideoAppointment.mutateAsync({
        appointmentId,
        userId,
        role: userRole === Role.DOCTOR ? "doctor" : "patient",
      });

      const resultData = result as { token?: { token?: string } | string };
      const token =
        typeof resultData?.token === "string"
          ? resultData.token
          : resultData?.token?.token;

      if (token) {
        // Open video consultation in new window
        window.open(
          `/video-consultation/${appointmentId}?token=${token}`,
          "_blank"
        );
      }
    } catch (error: any) {
      console.error("Failed to join video:", error);
    }
  };

  // Memoize AppointmentCard to prevent unnecessary re-renders (optimized for 10M users)
  const AppointmentCard = React.memo(
    ({
      appointment,
      showActions = true,
    }: {
      appointment: any;
      showActions?: boolean;
    }) => {
      // Component implementation
      return (
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
                        ? appointment.doctorName
                        : appointment.patientName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {userRole === Role.PATIENT
                        ? appointment.clinic
                        : appointment.phone}
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
                    {appointment.mode === "video" ? (
                      <Video className="w-4 h-4 text-gray-500" />
                    ) : (
                      <MapPin className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="text-sm capitalize">
                      {appointment.mode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{appointment.phone}</span>
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
                          onClick={() =>
                            handleCancelAppointment(appointment.id)
                          }
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

                  {/* Video Join Button for video appointments */}
                  {appointment.mode === "video" &&
                    (appointment.status === "confirmed" ||
                      appointment.status === "IN_PROGRESS") && (
                      <Button
                        size="sm"
                        variant="default"
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleJoinVideo(appointment.id)}
                        disabled={joinVideoAppointment.isPending}
                      >
                        <Video className="w-3 h-3" />
                        {joinVideoAppointment.isPending
                          ? "Joining..."
                          : "Join Video"}
                      </Button>
                    )}

                  {/* Queue management actions for authorized users */}
                  {appointment.status === "confirmed" &&
                    appointment.mode !== "video" && (
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
    }
  );

  // Set display name for debugging
  AppointmentCard.displayName = "AppointmentCard";

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
                      {appointmentStats?.todayAppointments || 0}
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
                      {appointmentStats?.completedAppointments || 0}
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
                      {appointmentStats?.totalAppointments || 0}
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
                      {appointmentStats?.cancelledAppointments || 0}
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
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.length > 0 ? (
            <>
              {upcomingAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                />
              ))}
              {totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  pageSize={PAGINATION.DEFAULT_PAGE_SIZE}
                  totalItems={totalUpcoming}
                />
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No upcoming appointments
                </h3>
                <p className="text-gray-500 mb-4">
                  You don&apos;t have any appointments scheduled.
                </p>
                {userRole === Role.PATIENT && (
                  <Button>Book Your First Appointment</Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastAppointments.length > 0 ? (
            <>
              {pastAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  showActions={false}
                />
              ))}
              {totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  pageSize={PAGINATION.DEFAULT_PAGE_SIZE}
                  totalItems={totalPast}
                />
              )}
            </>
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
