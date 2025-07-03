"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryData } from "@/hooks/useQueryData";
import { Role } from "@/types/auth.types";
import { useRouter } from "next/navigation";
import { getUserProfile } from "@/lib/actions/users.server";
import { useAppointments } from "@/hooks/useAppointments";
import { Loader2, Calendar, User } from "lucide-react";
import { AppointmentWithRelations } from "@/types/appointment.types";

interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
}

export default function ReceptionistDashboard() {
  const { session, isLoading: authLoading } = useAuth();
  const { user } = session || {};
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(true);

  // Fetch receptionist profile
  const { data: profile, isPending: loadingProfile } =
    useQueryData<UserProfile>(
      ["receptionist-profile"],
      async () => {
        const response = await getUserProfile();
        return response.data || response;
      },
      {
        enabled: !!session?.access_token,
      }
    );

  // Fetch appointments
  const { data: appointments, isPending: loadingAppointments } =
    useAppointments();

  useEffect(() => {
    if (!authLoading) {
      setTimeout(() => setIsInitializing(false), 1000);
    }
  }, [authLoading]);

  useEffect(() => {
    // Verify user role
    if (user?.role !== Role.RECEPTIONIST) {
      console.error("Unauthorized access to receptionist dashboard");
      router.replace("/auth/login");
    }
  }, [user, router]);

  // Show loading state
  if (authLoading || isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600">Loading receptionist dashboard...</p>
        </div>
      </div>
    );
  }

  const displayName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile?.firstName || user?.firstName || "Receptionist";

  // Calculate appointment statistics
  const today = new Date().toISOString().split("T")[0];
  const todayAppointments =
    appointments?.filter((apt) => apt.date?.startsWith(today)) || [];
  const pendingAppointments =
    appointments?.filter((apt) => apt.status === "PENDING") || [];
  const confirmedAppointments =
    appointments?.filter((apt) => apt.status === "CONFIRMED") || [];
  const completedAppointments =
    appointments?.filter((apt) => apt.status === "COMPLETED") || [];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Welcome, {displayName}!</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Today&apos;s Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Today&apos;s Overview</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Appointments</span>
              <span className="font-semibold">{todayAppointments.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold">
                {pendingAppointments.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Confirmed</span>
              <span className="font-semibold">
                {confirmedAppointments.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed</span>
              <span className="font-semibold">
                {completedAppointments.length}
              </span>
            </div>
          </div>
        </div>

        {/* Appointment Queue */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Appointment Queue</h2>
          <div className="space-y-4">
            {loadingAppointments ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : todayAppointments.length > 0 ? (
              <div className="space-y-2">
                {todayAppointments
                  .slice(0, 3)
                  .map((appointment: AppointmentWithRelations) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">
                            {appointment.patient?.user?.firstName}{" "}
                            {appointment.patient?.user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {appointment.date} at {appointment.time}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          appointment.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : appointment.status === "CONFIRMED"
                            ? "bg-blue-100 text-blue-800"
                            : appointment.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-600">No appointments in queue</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <button className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
              Schedule Appointment
            </button>
            <button className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors">
              Register New Patient
            </button>
            <button className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors">
              Manage Check-ins
            </button>
            <button className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors">
              View All Appointments
            </button>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Appointments</h2>
          <div className="space-y-4">
            {loadingAppointments ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : appointments && appointments.length > 0 ? (
              <div className="space-y-2">
                {appointments
                  .slice(0, 3)
                  .map((appointment: AppointmentWithRelations) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">
                            {appointment.patient?.user?.firstName}{" "}
                            {appointment.patient?.user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {appointment.date} at {appointment.time}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          appointment.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : appointment.status === "CONFIRMED"
                            ? "bg-blue-100 text-blue-800"
                            : appointment.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-600">No recent appointments</p>
            )}
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
          <div className="space-y-3">
            {loadingProfile ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">
                    {profile?.email || user?.email}
                  </span>
                </div>
                {profile?.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{profile.phone}</span>
                  </div>
                )}
                {profile?.gender && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gender:</span>
                    <span className="font-medium">{profile.gender}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
