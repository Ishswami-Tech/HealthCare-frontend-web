"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryData } from "@/hooks/useQueryData";
import { useRouter } from "next/navigation";
import { Role } from "@/types/auth.types";
import { getUserProfile } from "@/lib/actions/users.server";
import { useMyAppointments } from "@/hooks/useAppointments";
import {
  Loader2,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
} from "lucide-react";
import { AppointmentWithRelations } from "@/types/appointment.types";
import { useMyClinic } from "@/hooks/useClinics";

// Define a type for user data
interface UserData {
  id?: string;
  email?: string;
  role?: Role;
  firstName?: string;
  lastName?: string;
  name?: string;
  isVerified?: boolean;
  profileComplete?: boolean;
  // Additional possible properties
  phone?: string;
  address?: string;
  dateOfBirth?: string | Date;
  gender?: string;
  age?: number;
  googleId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Define a default user data object
const defaultUserData: UserData = { id: "", email: "", role: Role.PATIENT };

export default function PatientDashboardPage() {
  const { data: clinic, isPending: loadingClinic } = useMyClinic();
  const router = useRouter();
  const { session, isLoading, refreshSession } = useAuth();
  const { user } = session || {};
  const [isInitializing, setIsInitializing] = useState(true);

  // Fetch user profile using React Query
  const { data: profileData, isPending: loadingProfile } =
    useQueryData<UserData>(
      ["patient-profile"],
      async () => {
        const response: unknown = await getUserProfile();
        if (typeof response === "object" && response !== null) {
          const data = (response as Record<string, unknown>).data || response;
          if (
            typeof (data as UserData).id === "string" &&
            typeof (data as UserData).email === "string" &&
            typeof (data as UserData).role === "string"
          ) {
            return data as UserData;
          }
        }
        return defaultUserData;
      },
      {
        enabled: !!session?.access_token,
      }
    );

  // Fetch appointments
  const { data: appointments, isPending: loadingAppointments } =
    useMyAppointments();

  useEffect(() => {
    console.log("Dashboard Mount - Session:", JSON.stringify(session, null, 2));
    console.log("Dashboard Mount - Loading:", isLoading);
    console.log("Dashboard Mount - User:", JSON.stringify(user, null, 2));
    console.log(
      "Dashboard Mount - User object keys:",
      user ? Object.keys(user) : "No user"
    );

    // Try to refresh the session once on mount
    const initializeSession = async () => {
      try {
        if (!session?.user) {
          await refreshSession();
        }
      } catch (error) {
        console.error("Error refreshing session:", error);
      } finally {
        // Mark initialization as complete after a short delay
        setTimeout(() => setIsInitializing(false), 1000);
      }
    };

    initializeSession();

    // Only check role if we're not loading and have a user
    if (!isLoading && user) {
      console.log("User Role Check - Role:", user.role);
      if (user.role !== Role.PATIENT) {
        console.log("Invalid role, redirecting to login");
        router.push("/auth/login");
      }
    } else if (!isLoading && !isInitializing && !user) {
      console.log("No user found, redirecting to login");
      router.push("/auth/login");
    }
  }, [user, isLoading, router, session, refreshSession, isInitializing]);

  // Show loading state
  if (isLoading || isInitializing) {
    console.log("Rendering loading state");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not a patient or no user
  if (!user || user.role !== Role.PATIENT) {
    console.log("Not rendering - Invalid user or role");
    return null;
  }

  // Combine user data with profile data if available
  const userData: UserData = {
    ...(user || {}),
    ...(profileData || {}),
    dateOfBirth: profileData?.dateOfBirth || undefined,
  };

  // Get the display name in order of preference
  const displayName = (() => {
    console.log("Building display name from:", {
      firstName: userData.firstName,
      lastName: userData.lastName,
      name: userData.name,
      email: userData.email,
    });

    if (userData.firstName && userData.lastName) {
      return `${userData.firstName} ${userData.lastName}`;
    }
    if (userData.name) {
      return userData.name;
    }
    if (userData.firstName) {
      return userData.firstName;
    }
    // If no name is available, use the first part of the email
    if (userData.email) {
      return userData.email.split("@")[0];
    }
    return "Patient";
  })();

  console.log("Final display name:", displayName);

  // Calculate appointment statistics
  const today = new Date().toISOString().split("T")[0];
  const appointmentsList: AppointmentWithRelations[] = appointments || [];
  const todayAppointments =
    appointmentsList.filter((apt: AppointmentWithRelations) =>
      apt.date?.startsWith(today)
    ) || [];
  const upcomingAppointments =
    appointmentsList.filter(
      (apt: AppointmentWithRelations) => apt.date > today
    ) || [];
  const completedAppointments =
    appointmentsList.filter(
      (apt: AppointmentWithRelations) => apt.status === "COMPLETED"
    ) || [];
  const pendingAppointments =
    appointmentsList.filter(
      (apt: AppointmentWithRelations) => apt.status === "PENDING"
    ) || [];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Welcome, {displayName}!
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            This is your personal healthcare dashboard. Here you can manage your
            appointments, view medical records, and more.
          </p>
          {loadingProfile && (
            <div className="mt-4 flex items-center">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500 mr-2" />
              <span className="text-sm text-gray-500">
                Loading profile data...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Appointment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Today&apos;s Appointments
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loadingAppointments ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      todayAppointments.length
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Upcoming Appointments
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loadingAppointments ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      upcomingAppointments.length
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completed
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loadingAppointments ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      completedAppointments.length
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loadingAppointments ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      pendingAppointments.length
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Upcoming Appointments
          </h3>
          {loadingAppointments ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAppointments
                .slice(0, 3)
                .map((appointment: AppointmentWithRelations) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {appointment.doctor?.user?.firstName}{" "}
                          {appointment.doctor?.user?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {appointment.date} at {appointment.time}
                        </p>
                        <p className="text-xs text-gray-400">
                          {appointment.type} - {appointment.notes || "No notes"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
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
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No upcoming appointments
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by scheduling your first appointment.
              </p>
              <div className="mt-6">
                <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                  <Plus className="-ml-1 mr-2 h-4 w-4" />
                  Schedule Appointment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Information */}
      {profileData && (
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Profile Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Email:
                </span>
                <p className="text-sm text-gray-900">{profileData.email}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Clinic:
                </span>
                <p className="text-sm text-gray-900">
                  {loadingClinic ? "Loading..." : clinic?.name}
                </p>
              </div>{" "}
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Clinic Address:
                </span>
                <p className="text-sm text-gray-900">{clinic?.address}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Clinic Phone:
                </span>
                <p className="text-sm text-gray-900">{clinic?.phone}</p>
              </div>
              {profileData.phone && (
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Phone:
                  </span>
                  <p className="text-sm text-gray-900">{profileData.phone}</p>
                </div>
              )}
              {profileData.gender && (
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Gender:
                  </span>
                  <p className="text-sm text-gray-900">{profileData.gender}</p>
                </div>
              )}
              {profileData.address && (
                <div className="md:col-span-2">
                  <span className="text-sm font-medium text-gray-500">
                    Address:
                  </span>
                  <p className="text-sm text-gray-900">{profileData.address}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Appointments Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900">
                  Appointments
                </h3>
                <p className="text-sm text-gray-500">
                  View and manage your appointments
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Medical Records Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900">
                  Medical Records
                </h3>
                <p className="text-sm text-gray-500">
                  Access your medical history
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Prescriptions Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900">
                  Prescriptions
                </h3>
                <p className="text-sm text-gray-500">View your prescriptions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
