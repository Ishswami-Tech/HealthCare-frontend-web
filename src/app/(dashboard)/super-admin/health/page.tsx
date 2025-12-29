"use client";

import { ComprehensiveHealthDashboard } from '@/components/admin/ComprehensiveHealthDashboard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Role } from '@/types/auth.types';

export default function HealthStatusPage() {
  return (
    <DashboardLayout
      title="System Health Status"
      allowedRole={Role.SUPER_ADMIN}
      showPermissionWarnings={false}
    >
      <div className="p-6">
        <ComprehensiveHealthDashboard />
      </div>
    </DashboardLayout>
  );
}

