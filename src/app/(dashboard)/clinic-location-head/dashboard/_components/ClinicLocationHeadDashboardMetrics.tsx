"use client";

import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import type { ClinicLocationHeadDashboardStats } from "./clinic-location-head-dashboard.types";

interface ClinicLocationHeadDashboardMetricsProps {
  stats: ClinicLocationHeadDashboardStats;
  queueWaiting: number;
}

export function ClinicLocationHeadDashboardMetrics({
  stats,
  queueWaiting,
}: ClinicLocationHeadDashboardMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <DashboardMetricCard
        label="Today"
        value={stats.totalToday}
        subtext="Total appointments"
        accentClassName="border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10"
        valueClassName="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-100"
        labelClassName="text-blue-700 dark:text-blue-300"
        compact
      />
      <DashboardMetricCard
        label="Queue"
        value={queueWaiting}
        subtext="Waiting patients"
        accentClassName="border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10"
        valueClassName="mt-1 text-2xl font-bold text-emerald-900 dark:text-emerald-100"
        labelClassName="text-emerald-700 dark:text-emerald-300"
        compact
      />
      <DashboardMetricCard
        label="In Progress"
        value={stats.inProgress}
        subtext="Active consultations"
        accentClassName="border-indigo-200 bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/10"
        valueClassName="mt-1 text-2xl font-bold text-indigo-900 dark:text-indigo-100"
        labelClassName="text-indigo-700 dark:text-indigo-300"
        compact
      />
      <DashboardMetricCard
        label="Completed"
        value={stats.completed}
        subtext="Done today"
        accentClassName="border-green-200 bg-green-50 dark:border-green-500/20 dark:bg-green-500/10"
        valueClassName="mt-1 text-2xl font-bold text-green-900 dark:text-green-100"
        labelClassName="text-green-700 dark:text-green-300"
        compact
      />
    </div>
  );
}
