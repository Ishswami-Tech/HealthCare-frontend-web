"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ActionButton } from "@/components/dashboard/ActionButton";
import { Role } from "@/types/auth.types";

export default function SuperAdminDashboard() {
  return (
    <DashboardLayout
      title="Super Admin Dashboard"
      allowedRole={Role.SUPER_ADMIN}
    >
      <DashboardCard
        title="System Statistics"
        stats={[
          { label: "Total Clinics", value: 0 },
          { label: "Total Doctors", value: 0 },
          { label: "Total Patients", value: 0 },
        ]}
      />

      <DashboardCard title="Clinics Overview">
        <div className="text-gray-600 text-center py-4">
          No clinics registered yet
        </div>
      </DashboardCard>

      <DashboardCard title="System Management">
        <div className="space-y-4">
          <ActionButton label="Manage Clinics" variant="blue" />
          <ActionButton label="System Settings" variant="green" />
          <ActionButton label="User Management" variant="purple" />
          <ActionButton label="View Reports" variant="yellow" />
        </div>
      </DashboardCard>

      <DashboardCard title="Recent Doctors">
        <div className="text-gray-600 text-center py-4">
          No doctors registered yet
        </div>
      </DashboardCard>
    </DashboardLayout>
  );
}
