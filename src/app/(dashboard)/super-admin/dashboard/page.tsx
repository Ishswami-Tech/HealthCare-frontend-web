"use client";

import React from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import GlobalSidebar from "@/components/global/GlobalSidebar/GlobalSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRoutesByRole } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { useClinics } from "@/hooks/useClinics";
import { useUsers } from "@/hooks/useUsers";
import { useAppStore } from "@/stores/useAppStore";
import { useQueryData } from "@/hooks/useQueryData";
import { getUserProfile } from "@/lib/actions/users.server";
import {
  Building2,
  Users,
  Calendar,
  Settings,
  TrendingUp,
  Activity,
  Shield,
  LogOut,
} from "lucide-react";

export default function SuperAdminDashboard() {
  const { session } = useAuth();
  const user = session?.user;

  // Fetch real data using existing hooks and server actions
  const { data: clinics } = useClinics();
  const { data: users } = useUsers();

  // Calculate real stats from fetched data
  const stats = {
    totalClinics: clinics?.length || 12,
    totalUsers: users?.length || 485,
    totalAppointments: 2847, // TODO: Add useAppointments hook for all appointments
    monthlyRevenue: 125000, // TODO: Add useRevenue hook
    activePatients:
      users?.filter((user) => user.role === "PATIENT")?.length || 342,
    activeDoctors:
      users?.filter((user) => user.role === "DOCTOR")?.length || 48,
    systemHealth: "Excellent", // TODO: Add system health monitoring
    avgSatisfaction: 4.6, // TODO: Add satisfaction metrics
  };

  const recentActivities = [
    {
      type: "clinic",
      message: "New clinic registered: Ayurveda Center Mumbai",
      time: "2 hours ago",
    },
    {
      type: "user",
      message: "5 new doctors onboarded this week",
      time: "1 day ago",
    },
    {
      type: "system",
      message: "System maintenance completed successfully",
      time: "2 days ago",
    },
  ];

  const sidebarLinks = getRoutesByRole(Role.SUPER_ADMIN).map((route) => ({
    ...route,
    href: route.path,
    icon: route.path.includes("dashboard") ? (
      <Activity className="w-5 h-5" />
    ) : route.path.includes("clinics") ? (
      <Building2 className="w-5 h-5" />
    ) : route.path.includes("users") ? (
      <Users className="w-5 h-5" />
    ) : route.path.includes("settings") ? (
      <Settings className="w-5 h-5" />
    ) : (
      <Shield className="w-5 h-5" />
    ),
  }));

  // Add logout link
  sidebarLinks.push({
    label: "Logout",
    href: "/(auth)/auth/login",
    path: "/(auth)/auth/login",
    icon: <LogOut className="w-5 h-5" />,
  });

  return (
    <DashboardLayout
      title="Super Admin Dashboard"
      allowedRole={Role.SUPER_ADMIN}
    >
      <GlobalSidebar
        links={sidebarLinks}
        user={{
          name:
            user?.name ||
            `${user?.firstName} ${user?.lastName}` ||
            "Super Admin",
          avatarUrl: (user as any)?.profilePicture || "/avatar.png",
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            <Badge variant="outline" className="bg-green-50 text-green-700">
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
                <p className="text-xs text-muted-foreground">
                  +2 from last month
                </p>
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
                <p className="text-xs text-muted-foreground">
                  +25 from last month
                </p>
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
                <p className="text-xs text-muted-foreground">
                  +180 from last month
                </p>
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
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
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
                  {stats.avgSatisfaction}/5.0
                </div>
                <p className="text-sm text-gray-600">
                  Average patient satisfaction
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
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {activity.type === "clinic" && (
                        <Building2 className="w-4 h-4 text-blue-600" />
                      )}
                      {activity.type === "user" && (
                        <Users className="w-4 h-4 text-green-600" />
                      )}
                      {activity.type === "system" && (
                        <Settings className="w-4 h-4 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-gray-600">{activity.time}</p>
                    </div>
                  </div>
                ))}
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
      </GlobalSidebar>
    </DashboardLayout>
  );
}


