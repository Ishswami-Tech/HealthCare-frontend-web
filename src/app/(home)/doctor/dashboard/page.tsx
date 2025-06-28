"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryData } from "@/hooks/useQueryData";
import { useRouter } from "next/navigation";
import { Role } from "@/types/auth.types";
import { getUserProfile } from "@/lib/actions/users.server";
import { useAppointments } from "@/hooks/useAppointments";
import { Loader2, Calendar, Clock, User, CheckCircle, AlertCircle } from "lucide-react";
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

export default function DoctorDashboard() {
  const { session, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(true);

  // Fetch doctor profile
  const { data: profile, isPending: loadingProfile } =
    useQueryData<UserProfile>(
      ["doctor-profile"],
      async () => {
        const response = await getUserProfile();
        return response.data || response;
      },
      {
        enabled: !!session?.access_token,
      }
    );

  // Fetch appointments
  const { data: appointments, isPending: loadingAppointments } = useAppointments();

  useEffect(() => {
    if (!authLoading) {
      setTimeout(() => setIsInitializing(false), 1000);
    }
  }, [authLoading]);

  useEffect(() => {
    // Verify user role
    if (session?.user?.role !== Role.DOCTOR) {
      router.replace("/auth/login");
    }
  }, [session, router]);

  // Show loading state
  if (authLoading || isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600">Loading doctor dashboard...</p>
        </div>
      </div>
    );
  }

  const displayName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile?.firstName || session?.user?.firstName || "Doctor";

  // Calculate appointment statistics
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments?.filter(apt => 
    apt.date?.startsWith(today) && apt.doctorId === session?.user?.id
  ) || [];
  const pendingAppointments = appointments?.filter(apt => 
    apt.status === 'PENDING' && apt.doctorId === session?.user?.id
  ) || [];
  const completedAppointments = appointments?.filter(apt => 
    apt.status === 'COMPLETED' && apt.doctorId === session?.user?.id
  ) || [];
  const confirmedAppointments = appointments?.filter(apt => 
    apt.status === 'CONFIRMED' && apt.doctorId === session?.user?.id
  ) || [];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Doctor Dashboard</h1>
      <p className="text-gray-600 mb-6">Welcome back, {displayName}!</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Today&apos;s Schedule */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Today&apos;s Schedule</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Upcoming Appointments</span>
              <span className="font-semibold">{todayAppointments.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed Today</span>
              <span className="font-semibold">{completedAppointments.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Confirmation</span>
              <span className="font-semibold">{pendingAppointments.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Confirmed Today</span>
              <span className="font-semibold">{confirmedAppointments.length}</span>
            </div>
          </div>
        </div>

        {/* Patient Queue */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Patient Queue</h2>
          <div className="space-y-4">
            {loadingAppointments ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : todayAppointments.length > 0 ? (
              <div className="space-y-2">
                {todayAppointments.slice(0, 3).map((appointment: AppointmentWithRelations) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">
                          {appointment.patient?.user?.firstName} {appointment.patient?.user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {appointment.time}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      appointment.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                      appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No patients in queue</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <button className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
              View Appointments
            </button>
            <button className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors">
              Write Prescription
            </button>
            <button className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors">
              View Patient History
            </button>
            <button className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors">
              Manage Queue
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
                  .filter(apt => apt.doctorId === session?.user?.id)
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
                            {appointment.patient?.user?.firstName} {appointment.patient?.user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {appointment.date}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        appointment.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                        appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
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
                    {profile?.email || session?.user?.email}
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
