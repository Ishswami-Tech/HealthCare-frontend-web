"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import { Clock } from "lucide-react";
import type { DoctorDashboardStats } from "./doctor-dashboard.logic";

interface DoctorDashboardSummaryCardProps {
  dashboardTodayLabel: string;
  stats: DoctorDashboardStats;
}

export function DoctorDashboardSummaryCard({ dashboardTodayLabel, stats }: DoctorDashboardSummaryCardProps) {
  return (
    <Card className="overflow-hidden border shadow-sm">
      <CardContent className="p-2.5 sm:p-3">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
              <Clock className="size-4" />
              Live Workspace
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">Next appointment</span>
              {stats.nextAppointment ? (
                <span className="truncate text-sm font-semibold text-foreground">
                  {stats.nextAppointment.patientName} · {stats.nextAppointment.time || "Time TBD"} · {stats.nextAppointment.type}
                </span>
              ) : (
                <span className="text-sm font-medium text-muted-foreground">
                  No upcoming video consultations
                </span>
              )}
            </div>
            <div className="mt-1 text-[11px] font-medium text-muted-foreground">
              Today: {dashboardTodayLabel || "today"}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted-foreground">
            <span className="rounded-full border border-border bg-background px-2.5 py-1">Status-first workspace</span>
          </div>
        </div>

        <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <DashboardMetricCard
            label="Today"
            value={stats.todayAppointments}
            subtext="Appointments"
            accentClassName="border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10"
            valueClassName="mt-1 text-lg font-bold leading-none text-blue-900 dark:text-blue-100"
            labelClassName="text-blue-700 dark:text-blue-300"
            compact
          />
          <DashboardMetricCard
            label="Done"
            value={stats.completedToday}
            subtext="Consulted"
            accentClassName="border-green-200 bg-green-50 dark:border-green-500/20 dark:bg-green-500/10"
            valueClassName="mt-1 text-lg font-bold leading-none text-green-900 dark:text-green-100"
            labelClassName="text-green-700 dark:text-green-300"
            compact
          />
          <DashboardMetricCard
            label="Patients"
            value={stats.totalPatients}
            subtext="Lifetime"
            accentClassName="border-indigo-200 bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/10"
            valueClassName="mt-1 text-lg font-bold leading-none text-indigo-900 dark:text-indigo-100"
            labelClassName="text-indigo-700 dark:text-indigo-300"
            compact
          />
        </div>
      </CardContent>
    </Card>
  );
}
