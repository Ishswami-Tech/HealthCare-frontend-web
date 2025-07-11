"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryData } from "@/hooks/useQueryData";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ActionButton } from "@/components/dashboard/ActionButton";
import { Role } from "@/types/auth.types";
import {
  getAllUsers,
  getPatients,
  getDoctors,
  getReceptionists,
  getClinicAdmins,
} from "@/lib/actions/users.server";
import { useAppointments } from "@/hooks/useAppointments";
import { Loader2, Calendar } from "lucide-react";
import { AppointmentWithRelations } from "@/types/appointment.types";

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
}

export default function SuperAdminDashboard() {
  const { session, isLoading: authLoading } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  // Fetch all users for system statistics
  const { data: allUsers, isPending: loadingUsers } = useQueryData<User[]>(
    ["system-users"],
    async () => {
      const response = await getAllUsers();
      return response.data || [];
    },
    {
      enabled: !!session?.access_token,
    }
  );

  // Fetch patients
  const { data: patients } = useQueryData<User[]>(
    ["system-patients"],
    async () => {
      const response = await getPatients();
      return response.data || [];
    },
    {
      enabled: !!session?.access_token,
    }
  );

  // Fetch doctors
  const { data: doctors } = useQueryData<User[]>(
    ["system-doctors"],
    async () => {
      const response = await getDoctors();
      return response.data || [];
    },
    {
      enabled: !!session?.access_token,
    }
  );

  // Fetch receptionists
  const { data: receptionists } = useQueryData<User[]>(
    ["system-receptionists"],
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
    ["system-clinic-admins"],
    async () => {
      const response = await getClinicAdmins();
      return response.data || [];
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

  // Show loading state
  if (authLoading || isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600">Loading super admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalUsers = allUsers?.length || 0;
  const totalPatients = patients?.length || 0;
  const totalDoctors = doctors?.length || 0;
  const totalReceptionists = receptionists?.length || 0;
  const totalClinicAdmins = clinicAdmins?.length || 0;

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
    <DashboardLayout
      title="Super Admin Dashboard"
      allowedRole={Role.SUPER_ADMIN}
    >
      <DashboardCard
        title="System Statistics"
        stats={[
          { label: "Total Users", value: totalUsers },
          { label: "Total Patients", value: totalPatients },
          { label: "Total Doctors", value: totalDoctors },
          { label: "Total Receptionists", value: totalReceptionists },
          { label: "Total Clinic Admins", value: totalClinicAdmins },
        ]}
      />

      <DashboardCard
        title="Appointment Overview"
        stats={[
          { label: "Today's Appointments", value: todayAppointments.length },
          { label: "Pending Appointments", value: pendingAppointments.length },
          {
            label: "Confirmed Appointments",
            value: confirmedAppointments.length,
          },
          {
            label: "Completed Appointments",
            value: completedAppointments.length,
          },
        ]}
      />

      <DashboardCard title="System Management">
        <div className="space-y-4">
          <ActionButton label="Manage Clinics" variant="blue" />
          <ActionButton label="System Settings" variant="green" />
          <ActionButton label="User Management" variant="purple" />
          <ActionButton label="View Reports" variant="yellow" />
          <ActionButton label="Appointment Analytics" variant="blue" />
        </div>
      </DashboardCard>

      {/* System-wide Appointments */}
      <DashboardCard title="Recent System Appointments">
        <div className="space-y-4">
          {loadingAppointments ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : appointments && appointments.length > 0 ? (
            <div className="space-y-2">
              {appointments
                .slice(0, 5)
                .map((appointment: AppointmentWithRelations) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">
                          {appointment.patient?.user?.firstName}{" "}
                          {appointment.patient?.user?.lastName} →{" "}
                          {appointment.doctor?.user?.firstName}{" "}
                          {appointment.doctor?.user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {appointment.date} at {appointment.time}
                        </p>
                        <p className="text-xs text-gray-400">
                          {appointment.type} - {appointment.notes}
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
            <div className="text-gray-600 text-center py-4">
              No appointments found in the system
            </div>
          )}
        </div>
      </DashboardCard>

      <DashboardCard title="Clinics Overview">
        <div className="text-gray-600 text-center py-4">
          {loadingUsers ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
              Loading clinic data...
            </div>
          ) : (
            `${totalClinicAdmins} clinic administrators registered`
          )}
        </div>
      </DashboardCard>

      <DashboardCard title="Recent Doctors">
        <div className="space-y-4">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : doctors && doctors.length > 0 ? (
            <div className="space-y-2">
              {doctors.slice(0, 5).map((doctor: User) => (
                <div
                  key={doctor.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <span className="text-sm font-medium">
                    {doctor.firstName} {doctor.lastName}
                  </span>
                  <span className="text-xs text-gray-500">{doctor.email}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-600 text-center py-4">
              No doctors registered yet
            </div>
          )}
        </div>
      </DashboardCard>

      <DashboardCard title="Recent Patients">
        <div className="space-y-4">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : patients && patients.length > 0 ? (
            <div className="space-y-2">
              {patients.slice(0, 5).map((patient: User) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <span className="text-sm font-medium">
                    {patient.firstName} {patient.lastName}
                  </span>
                  <span className="text-xs text-gray-500">{patient.email}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-600 text-center py-4">
              No patients registered yet
            </div>
          )}
        </div>
      </DashboardCard>
    </DashboardLayout>
  );
}
