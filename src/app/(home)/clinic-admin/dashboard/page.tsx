"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ActionButton } from "@/components/dashboard/ActionButton";
import { Role } from "@/types/auth.types";

export default function ClinicAdminDashboard() {
  return (
    <DashboardLayout
      title="Clinic Admin Dashboard"
      allowedRole={Role.CLINIC_ADMIN}
    >
      <DashboardCard
        title="Clinic Statistics"
        stats={[
          { label: "Total Doctors", value: 0 },
          { label: "Total Patients", value: 0 },
          { label: "Today's Revenue", value: "₹0" },
        ]}
      />

      <DashboardCard
        title="Today's Overview"
        stats={[
          { label: "Appointments", value: 0 },
          { label: "Available Doctors", value: 0 },
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
    </DashboardLayout>
  );
}
