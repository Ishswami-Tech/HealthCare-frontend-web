"use client";

import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";

type LabTechnicianStats = {
  pendingTests: number;
  completedToday: number;
  totalPatients: number;
  avgProcessingTime: number;
};

interface LabTechnicianStatsCardsProps {
  stats: LabTechnicianStats;
}

export function LabTechnicianStatsCards({ stats }: LabTechnicianStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <DashboardMetricCard
        label="Pending Tests"
        value={stats.pendingTests}
        subtext="Awaiting processing"
        accentClassName="border-orange-200 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/10"
        valueClassName="mt-1 text-2xl font-bold text-orange-600"
        labelClassName="text-orange-600"
        compact
      />
      <DashboardMetricCard
        label="Completed Today"
        value={stats.completedToday}
        subtext="Results reported"
        accentClassName="border-green-200 bg-green-50 dark:border-green-500/20 dark:bg-green-500/10"
        valueClassName="mt-1 text-2xl font-bold text-green-600"
        labelClassName="text-green-600"
        compact
      />
      <DashboardMetricCard
        label="Total Patients"
        value={stats.totalPatients}
        subtext="Unique patients today"
        accentClassName="border-slate-200 bg-slate-50 dark:border-slate-500/20 dark:bg-slate-500/10"
        valueClassName="mt-1 text-2xl font-bold"
        labelClassName="text-slate-600"
        compact
      />
      <DashboardMetricCard
        label="Avg. Processing"
        value={`${stats.avgProcessingTime} min`}
        subtext="Per test average"
        accentClassName="border-indigo-200 bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/10"
        valueClassName="mt-1 text-2xl font-bold text-indigo-600"
        labelClassName="text-indigo-600"
        compact
      />
    </div>
  );
}
