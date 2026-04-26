"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinics } from "@/hooks/query/useClinics";
import { useUsers } from "@/hooks/query/useUsers";
import { useAppointments } from "@/hooks/query/useAppointments";
import { useRevenueAnalytics } from "@/hooks/query/useAnalytics";
import {
  TrendingUp,
  Building2,
  Users,
  Calendar,
  Settings,
  Activity,
} from "lucide-react";

export default function SuperAdminDashboard() {
  useAuth();

  // Fetch real data using existing hooks and server actions
  const { data: clinics } = useClinics();
  const { data: users } = useUsers();
  const { data: appointmentsData } = useAppointments({ limit: 1 }); // Just to get total count
  const { data: revenueData } = useRevenueAnalytics({ period: "month" });

  // Calculate real stats from fetched data
  const clinicsArray = (clinics as any)?.clinics || [];
  const usersArray = Array.isArray(users) ? users : (users as any)?.users || [];
  const appointments = (appointmentsData as any)?.appointments || [];
  const revenue = (revenueData as any)?.totalRevenue || (revenueData as any)?.monthlyRevenue || 0;

  const stats = {
    totalClinics: clinicsArray.length || 0,
    totalUsers: usersArray.length || 0,
    totalAppointments: (appointmentsData as any)?.total || appointments.length || 0,
    monthlyRevenue: revenue || 0,
    activePatients:
      usersArray.filter(
        (user: any) =>
          user.role === "PATIENT" ||
          user.roles?.some((r: any) => r.name === "PATIENT")
      ).length || 0,
    activeDoctors:
      usersArray.filter(
        (user: any) =>
          user.role === "DOCTOR" ||
          user.roles?.some((r: any) => r.name === "DOCTOR")
      ).length || 0,
    systemHealth: clinicsArray.length > 0 ? "LIVE" : "LIMITED",
    avgSatisfaction:
      typeof (revenueData as any)?.avgSatisfaction === "number"
        ? (revenueData as any).avgSatisfaction
        : null,
  };

  const recentActivity = useMemo(() => {
    const clinicActivity = clinicsArray
      .slice()
      .sort((a: any, b: any) => new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime())
      .slice(0, 5)
      .map((clinic: any) => ({
        id: `clinic-${clinic.id}`,
        type: "Clinic",
        name: clinic.name,
        status: clinic.isActive !== false ? "Active" : "Inactive",
        clinic: clinic.name,
        date: clinic.createdAt || clinic.updatedAt || new Date(),
      }));

    const userActivity = usersArray
      .slice()
      .sort((a: any, b: any) => new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime())
      .slice(0, 5)
      .map((user: any) => ({
        id: `user-${user.id}`,
        type: "User",
        name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
        status: user.isActive !== false ? "Active" : "Inactive",
        clinic: user.clinic?.name || "N/A",
        date: user.createdAt || user.updatedAt || new Date(),
      }));

    return [...clinicActivity, ...userActivity]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [clinicsArray, usersArray]);

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
        cell: ({ row }) => new Date(row.original.date).toLocaleString(),
      },
    ],
    []
  );


  return (
    
      <div className="p-4 space-y-4 sm:p-6 sm:space-y-5">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              System Status: {stats.systemHealth}
            </Badge>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-blue-100 bg-blue-50/70 shadow-sm dark:border-blue-900 dark:bg-blue-950/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Clinics
                </CardTitle>
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-50">{stats.totalClinics}</div>
                <p className="text-xs text-muted-foreground">Live clinic count</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 bg-emerald-50/70 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-50">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Live user count</p>
              </CardContent>
            </Card>

            <Card className="border-indigo-100 bg-indigo-50/70 shadow-sm dark:border-indigo-900 dark:bg-indigo-950/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Appointments
                </CardTitle>
                <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-50">
                  {stats.totalAppointments}
                </div>
                <p className="text-xs text-muted-foreground">Live appointment volume</p>
              </CardContent>
            </Card>

            <Card className="border-amber-100 bg-amber-50/70 shadow-sm dark:border-amber-900 dark:bg-amber-950/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Monthly Revenue
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-900 dark:text-amber-50">
                  ₹{stats.monthlyRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Current analytics total</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-blue-100 bg-blue-50/70 shadow-sm dark:border-blue-900 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="text-lg">Active Patients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {stats.activePatients}
                </div>
                <p className="text-sm text-blue-700/70 dark:text-blue-200/70">
                  Patients treated this month
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 bg-emerald-50/70 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/20">
              <CardHeader>
                <CardTitle className="text-lg">Active Doctors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                  {stats.activeDoctors}
                </div>
                <p className="text-sm text-emerald-700/70 dark:text-emerald-200/70">
                  Doctors across all clinics
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-100 bg-purple-50/70 shadow-sm dark:border-purple-900 dark:bg-purple-950/20">
              <CardHeader>
                <CardTitle className="text-lg">Satisfaction Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  {stats.avgSatisfaction !== null ? `${stats.avgSatisfaction}/5.0` : "N/A"}
                </div>
                <p className="text-sm text-purple-700/70 dark:text-purple-200/70">
                  {stats.avgSatisfaction !== null
                    ? "Average patient satisfaction"
                    : "Satisfaction data is not yet wired system-wide"}
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
                  <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-300 mb-2" />
                  <h3 className="font-medium">Add / Manage Clinics</h3>
                  <p className="text-xs text-muted-foreground">Register or update clinic records</p>
                </Link>
                <Link href="/super-admin/users" className="p-4 border rounded-xl border-emerald-100 bg-emerald-50/70 hover:bg-emerald-100 transition-colors dark:border-emerald-900 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/35">
                  <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-300 mb-2" />
                  <h3 className="font-medium">Manage Users</h3>
                  <p className="text-xs text-muted-foreground">View and manage all users</p>
                </Link>
                <Link href="/super-admin/health" className="p-4 border rounded-xl border-purple-100 bg-purple-50/70 hover:bg-purple-100 transition-colors dark:border-purple-900 dark:bg-purple-950/20 dark:hover:bg-purple-950/35">
                  <Activity className="w-6 h-6 text-purple-600 dark:text-purple-300 mb-2" />
                  <h3 className="font-medium">Operational Health</h3>
                  <p className="text-xs text-muted-foreground">Monitor system status</p>
                </Link>
                <Link href="/super-admin/settings" className="p-4 border rounded-xl border-amber-100 bg-amber-50/70 hover:bg-amber-100 transition-colors dark:border-amber-900 dark:bg-amber-950/20 dark:hover:bg-amber-950/35">
                  <Settings className="w-6 h-6 text-amber-600 dark:text-amber-300 mb-2" />
                  <h3 className="font-medium">System Settings</h3>
                  <p className="text-xs text-muted-foreground">Configure clinic defaults</p>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
    
  );
}
