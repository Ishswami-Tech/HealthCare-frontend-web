"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryData } from "@/hooks/useQueryData";
import { useRouter } from "next/navigation";
import { Role } from "@/types/auth.types";
import { getUserProfile } from "@/lib/actions/users.server";
import { Loader2 } from "lucide-react";

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

export default function PatientDashboardPage() {
  const router = useRouter();
  const { session, isLoading, refreshSession } = useAuth();
  const { user } = session || {};
  const [isInitializing, setIsInitializing] = useState(true);

  // Fetch user profile using React Query
  const { data: profileData, isPending: loadingProfile } =
    useQueryData<UserData>(
      ["patient-profile"],
      async () => {
        const response = await getUserProfile();
        return response.data || response;
      },
      {
        enabled: !!session?.access_token,
      }
    );

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
