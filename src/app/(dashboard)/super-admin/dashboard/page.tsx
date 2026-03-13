"use client";


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


  return (
    
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              System Status: {stats.systemHealth}
            </Badge>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Clinics
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClinics}</div>
                <p className="text-xs text-muted-foreground">Live clinic count</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Live user count</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Appointments
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalAppointments}
                </div>
                <p className="text-xs text-muted-foreground">Live appointment volume</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Monthly Revenue
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{stats.monthlyRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Current analytics total</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Patients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {stats.activePatients}
                </div>
                <p className="text-sm text-gray-600">
                  Patients treated this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Doctors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {stats.activeDoctors}
                </div>
                <p className="text-sm text-gray-600">
                  Doctors across all clinics
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Satisfaction Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {stats.avgSatisfaction !== null ? `${stats.avgSatisfaction}/5.0` : "N/A"}
                </div>
                <p className="text-sm text-gray-600">
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
              <CardTitle>Recent System Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                System activity feed is not yet connected to a backend audit stream on this dashboard.
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <Building2 className="w-6 h-6 text-blue-600 mb-2" />
                  <h3 className="font-medium">Add New Clinic</h3>
                  <p className="text-xs text-gray-600">
                    Register a new clinic location
                  </p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <Users className="w-6 h-6 text-green-600 mb-2" />
                  <h3 className="font-medium">Manage Users</h3>
                  <p className="text-xs text-gray-600">
                    View and manage all users
                  </p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <TrendingUp className="w-6 h-6 text-purple-600 mb-2" />
                  <h3 className="font-medium">View Analytics</h3>
                  <p className="text-xs text-gray-600">
                    System performance metrics
                  </p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <Settings className="w-6 h-6 text-orange-600 mb-2" />
                  <h3 className="font-medium">System Settings</h3>
                  <p className="text-xs text-gray-600">
                    Configure global settings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    
  );
}
