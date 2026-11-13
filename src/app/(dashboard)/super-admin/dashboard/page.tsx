"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/auth/useAuth";
import { useDashboardAnalytics } from "@/hooks/query/useAnalytics";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { formatDateTimeInIST } from "@/lib/utils/date-time";
import {
  TrendingUp,
  Building2,
  Users,
  Calendar,
  Settings,
  Activity,
} from "lucide-react";

type ApiRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is ApiRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toNumber = (value: unknown): number | null => (typeof value === "number" ? value : null);

interface RecentEntry {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  clinicName: string | null;
}

interface SystemDashboard {
  totalClinics: number | null;
  totalUsers: number | null;
  usersByRole: Record<string, number> | null;
  totalAppointments: number | null;
  revenue: number | null;
  recentClinics: RecentEntry[];
  recentUsers: RecentEntry[];
}

function toRecentEntries(value: unknown): RecentEntry[] {
  return (Array.isArray(value) ? value : [])
    .filter(isRecord)
    .filter((entry) => typeof entry.id === "string" && typeof entry.createdAt === "string")
    .map((entry) => ({
      id: entry.id as string,
      name: typeof entry.name === "string" && entry.name ? entry.name : "Unnamed",
      isActive: entry.isActive !== false,
      createdAt: entry.createdAt as string,
      clinicName: typeof entry.clinicName === "string" ? entry.clinicName : null,
    }));
}

/**
 * GET /analytics/dashboard for a Super Admin: { summary, billing, system } covering every clinic,
 * possibly wrapped in { data }. Anything missing stays null and shows as a dash, never as 0.
 */
function toSystemDashboard(data: unknown): SystemDashboard {
  const source = isRecord(data) && isRecord(data.data) ? data.data : data;
  const summary = isRecord(source) && isRecord(source.summary) ? source.summary : {};
  const system = isRecord(source) && isRecord(source.system) ? source.system : {};
  let usersByRole: Record<string, number> | null = null;
  if (isRecord(system.usersByRole)) {
    usersByRole = {};
    for (const [role, count] of Object.entries(system.usersByRole)) {
      if (typeof count === "number") usersByRole[role] = count;
    }
  }
  return {
    totalClinics: toNumber(system.totalClinics),
    totalUsers: toNumber(system.totalUsers),
    usersByRole,
    totalAppointments: toNumber(summary.totalAppointments),
    revenue: toNumber(summary.revenue),
    recentClinics: toRecentEntries(system.recentClinics),
    recentUsers: toRecentEntries(system.recentUsers),
  };
}

const showCount = (value: number | null | undefined) =>
  typeof value === "number" ? value.toLocaleString() : "—";

export default function SuperAdminDashboard() {
  useAuth();
  useWebSocketQuerySync();

  // One request: for a Super Admin, GET /analytics/dashboard covers the whole system (every
  // clinic); the selected clinic only sets the working context.
  const { data: dashboardData } = useDashboardAnalytics("month");
  const dashboard = useMemo(() => toSystemDashboard(dashboardData), [dashboardData]);

  const stats = {
    totalClinics: dashboard.totalClinics,
    totalUsers: dashboard.totalUsers,
    totalAppointments: dashboard.totalAppointments,
    monthlyRevenue: dashboard.revenue,
    patients: dashboard.usersByRole ? (dashboard.usersByRole["PATIENT"] ?? 0) : null,
    doctors: dashboard.usersByRole ? (dashboard.usersByRole["DOCTOR"] ?? 0) : null,
    systemHealth: (dashboard.totalClinics ?? 0) > 0 ? "LIVE" : "LIMITED",
  };

  const recentActivity = useMemo(
    () =>
      [
        ...dashboard.recentClinics.map((clinic) => ({ ...clinic, key: `clinic-${clinic.id}`, type: "Clinic" })),
        ...dashboard.recentUsers.map((user) => ({ ...user, key: `user-${user.id}`, type: "User" })),
      ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map((entry) => ({
          id: entry.key,
          type: entry.type,
          name: entry.name,
          status: entry.isActive ? "Active" : "Inactive",
          clinic: entry.clinicName || "N/A",
          date: entry.createdAt,
        })),
    [dashboard]
  );

  const activityColumns = useMemo<ColumnDef<any>[]>(
    () => [
      { accessorKey: "type", header: "Type" },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "clinic", header: "Clinic" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "Active" ? "default" : "secondary"}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => formatDateTimeInIST(row.original.date),
      },
    ],
    []
  );


  return (
    
      <div className="p-4 gap-y-4 sm:p-6 sm:gap-y-5">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold">Super Admin Dashboard</h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              System Status: {stats.systemHealth}
            </Badge>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-blue-100 bg-blue-50/70 shadow-sm dark:border-blue-900 dark:bg-blue-950/20">
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Clinics
                </CardTitle>
                <Building2 className="size-4 text-blue-600 dark:text-blue-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-50">{showCount(stats.totalClinics)}</div>
                <p className="text-xs text-muted-foreground">Live clinic count</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 bg-emerald-50/70 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/20">
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="size-4 text-emerald-600 dark:text-emerald-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-50">{showCount(stats.totalUsers)}</div>
                <p className="text-xs text-muted-foreground">Live user count</p>
              </CardContent>
            </Card>

            <Card className="border-indigo-100 bg-indigo-50/70 shadow-sm dark:border-indigo-900 dark:bg-indigo-950/20">
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Appointments
                </CardTitle>
                <Calendar className="size-4 text-indigo-600 dark:text-indigo-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-50">
                  {showCount(stats.totalAppointments)}
                </div>
                <p className="text-xs text-muted-foreground">Last 30 days, all clinics</p>
              </CardContent>
            </Card>

            <Card className="border-amber-100 bg-amber-50/70 shadow-sm dark:border-amber-900 dark:bg-amber-950/20">
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Monthly Revenue
                </CardTitle>
                <TrendingUp className="size-4 text-amber-600 dark:text-amber-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-900 dark:text-amber-50">
                  {typeof stats.monthlyRevenue === "number" ? `₹${stats.monthlyRevenue.toLocaleString()}` : "—"}
                </div>
                <p className="text-xs text-muted-foreground">Completed payments, last 30 days</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-blue-100 bg-blue-50/70 shadow-sm dark:border-blue-900 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="text-lg">Patients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {showCount(stats.patients)}
                </div>
                <p className="text-sm text-blue-700/70 dark:text-blue-200/70">
                  Registered patients
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 bg-emerald-50/70 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/20">
              <CardHeader>
                <CardTitle className="text-lg">Doctors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                  {showCount(stats.doctors)}
                </div>
                <p className="text-sm text-emerald-700/70 dark:text-emerald-200/70">
                  Registered doctors
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-100 bg-purple-50/70 shadow-sm dark:border-purple-900 dark:bg-purple-950/20">
              <CardHeader>
                <CardTitle className="text-lg">Satisfaction Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  N/A
                </div>
                <p className="text-sm text-purple-700/70 dark:text-purple-200/70">
                  Satisfaction data is not yet wired system-wide
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Operational Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={activityColumns}
                data={recentActivity}
                pageSize={5}
                emptyMessage="No recent records."
              />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/super-admin/clinics" className="p-4 border rounded-xl border-blue-100 bg-blue-50/70 hover:bg-blue-100 transition-colors dark:border-blue-900 dark:bg-blue-950/20 dark:hover:bg-blue-950/35">
                  <Building2 className="size-6 text-blue-600 dark:text-blue-300 mb-2" />
                  <h3 className="font-medium">Add / Manage Clinics</h3>
                  <p className="text-xs text-muted-foreground">Register or update clinic records</p>
                </Link>
                <Link href="/super-admin/users" className="p-4 border rounded-xl border-emerald-100 bg-emerald-50/70 hover:bg-emerald-100 transition-colors dark:border-emerald-900 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/35">
                  <Users className="size-6 text-emerald-600 dark:text-emerald-300 mb-2" />
                  <h3 className="font-medium">Manage Users</h3>
                  <p className="text-xs text-muted-foreground">View and manage all users</p>
                </Link>
                <Link href="/super-admin/health" className="p-4 border rounded-xl border-purple-100 bg-purple-50/70 hover:bg-purple-100 transition-colors dark:border-purple-900 dark:bg-purple-950/20 dark:hover:bg-purple-950/35">
                  <Activity className="size-6 text-purple-600 dark:text-purple-300 mb-2" />
                  <h3 className="font-medium">Operational Health</h3>
                  <p className="text-xs text-muted-foreground">Monitor system status</p>
                </Link>
                <Link href="/super-admin/settings" className="p-4 border rounded-xl border-amber-100 bg-amber-50/70 hover:bg-amber-100 transition-colors dark:border-amber-900 dark:bg-amber-950/20 dark:hover:bg-amber-950/35">
                  <Settings className="size-6 text-amber-600 dark:text-amber-300 mb-2" />
                  <h3 className="font-medium">System Settings</h3>
                  <p className="text-xs text-muted-foreground">Configure clinic defaults</p>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
    
  );
}


