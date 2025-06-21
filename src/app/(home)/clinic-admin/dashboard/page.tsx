"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryData } from "@/hooks/useQueryData";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ActionButton } from "@/components/dashboard/ActionButton";
import { Role } from "@/types/auth.types";
import {
  getPatients,
  getDoctors,
  getReceptionists,
  getClinicAdmins,
} from "@/lib/actions/users.server";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
}

export default function ClinicAdminDashboard() {
  const { session, isLoading: authLoading } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  // Fetch patients
  const { data: patients } = useQueryData<User[]>(
    ["clinic-patients"],
    async () => {
      const response = await getPatients();
      return response.data || [];
    },
    {
      enabled: !!session?.access_token,
    }
  );

  // Fetch doctors
  const { data: doctors, isPending: loadingDoctors } = useQueryData<User[]>(
    ["clinic-doctors"],
    async () => {
      const response = await getDoctors();
      return response.data || [];
    },
    {
      enabled: !!session?.access_token,
    }
  );

  // Fetch receptionists
  const { data: receptionists, isPending: loadingReceptionists } = useQueryData<
    User[]
  >(
    ["clinic-receptionists"],
    async () => {
      const response = await getReceptionists();
      return response.data || [];
    },
    {
      enabled: !!session?.access_token,
    }
  );

  // Fetch clinic admins
  const { data: clinicAdmins } = useQueryData<User[]>(
    ["clinic-admins"],
    async () => {
      const response = await getClinicAdmins();
      return response.data || [];
    },
    {
      enabled: !!session?.access_token,
    }
  );

  useEffect(() => {
    if (!authLoading) {
      setTimeout(() => setIsInitializing(false), 1000);
    }
  }, [authLoading]);

  // Show loading state
  if (authLoading || isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600">Loading clinic dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalDoctors = doctors?.length || 0;
  const totalPatients = patients?.length || 0;
  const totalReceptionists = receptionists?.length || 0;
  const totalClinicAdmins = clinicAdmins?.length || 0;

  return (
    <DashboardLayout
      title="Clinic Admin Dashboard"
      allowedRole={Role.CLINIC_ADMIN}
    >
      <DashboardCard
        title="Clinic Statistics"
        stats={[
          { label: "Total Doctors", value: totalDoctors },
          { label: "Total Patients", value: totalPatients },
          { label: "Total Receptionists", value: totalReceptionists },
          { label: "Total Clinic Admins", value: totalClinicAdmins },
        ]}
      />

      <DashboardCard
        title="Today's Overview"
        stats={[
          { label: "Appointments", value: 0 },
          { label: "Available Doctors", value: totalDoctors },
          { label: "Pending Reports", value: 0 },
        ]}
      />

      <DashboardCard title="Clinic Management">
        <div className="space-y-4">
          <ActionButton label="Manage Staff" variant="blue" />
          <ActionButton label="View Schedule" variant="green" />
          <ActionButton label="Clinic Settings" variant="purple" />
          <ActionButton label="Generate Reports" variant="yellow" />
        </div>
      </DashboardCard>

      {/* Recent Staff Members */}
      <DashboardCard title="Recent Staff Members">
        <div className="space-y-4">
          {loadingDoctors || loadingReceptionists ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="space-y-2">
              {doctors?.slice(0, 3).map((doctor: User) => (
                <div
                  key={doctor.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <span className="text-sm font-medium">
                    {doctor.firstName} {doctor.lastName}
                  </span>
                  <span className="text-xs text-gray-500">Doctor</span>
                </div>
              ))}
              {receptionists?.slice(0, 2).map((receptionist: User) => (
                <div
                  key={receptionist.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <span className="text-sm font-medium">
                    {receptionist.firstName} {receptionist.lastName}
                  </span>
                  <span className="text-xs text-gray-500">Receptionist</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardCard>
    </DashboardLayout>
  );
}
