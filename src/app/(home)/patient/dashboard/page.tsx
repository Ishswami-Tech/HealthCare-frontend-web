"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Role } from "@/types/auth.types";
import { Loader2 } from "lucide-react";

export default function PatientDashboardPage() {
  const router = useRouter();
  const { session, isLoading, refreshSession } = useAuth();
  const { user } = session || {};
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    console.log("Dashboard Mount - Session:", JSON.stringify(session, null, 2));
    console.log("Dashboard Mount - Loading:", isLoading);
    console.log("Dashboard Mount - User:", JSON.stringify(user, null, 2));

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

  // Get the display name in order of preference
  const displayName = (() => {
    console.log("Building display name from:", {
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
    });

    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.name) {
      return user.name;
    }
    if (user.firstName) {
      return user.firstName;
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
        </div>
      </div>

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
