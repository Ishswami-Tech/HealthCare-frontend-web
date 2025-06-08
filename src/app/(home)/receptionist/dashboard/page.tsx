"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function ReceptionistDashboard() {
  const { session } = useAuth();
  const { user } = session || {};

  useEffect(() => {
    // Verify user role
    if (user?.role !== "RECEPTIONIST") {
      console.error("Unauthorized access to receptionist dashboard");
    }
  }, [user]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Receptionist Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Today&apos;s Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Today&apos;s Overview</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Appointments</span>
              <span className="font-semibold">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Check-ins</span>
              <span className="font-semibold">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Registrations</span>
              <span className="font-semibold">0</span>
            </div>
          </div>
        </div>

        {/* Appointment Queue */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Appointment Queue</h2>
          <div className="space-y-4">
            <p className="text-gray-600">No appointments in queue</p>
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
          </div>
        </div>
      </div>
    </div>
  );
}
