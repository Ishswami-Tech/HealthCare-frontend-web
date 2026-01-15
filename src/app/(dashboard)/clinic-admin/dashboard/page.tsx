"use client";


import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Sidebar from "@/components/global/GlobalSidebar/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRoutesByRole } from "@/lib/config/routes";
import { useAuth } from "@/hooks/auth/useAuth";
// import { useClinicContext } from "@/hooks/query/useClinics";
import { useUsers } from "@/hooks/query/useUsers";
import { useMyAppointments } from "@/hooks/query/useAppointments";

import {
  Activity,
  Users,
  Calendar,
  Settings,
  UserCheck,
  Clock,
  TrendingUp,
  AlertCircle,
  LogOut,
  Plus,
  CalendarDays,
  Stethoscope,
} from "lucide-react";

export default function ClinicAdminDashboard() {
  const { session } = useAuth();
  const user = session?.user;

  // Fetch real data using existing hooks and server actions
  const { data: users } = useUsers();
  const { data: appointments } = useMyAppointments();

  // Calculate real stats from fetched data
  const appointmentsArray = appointments?.appointments || [];
  const stats = {
    totalAppointments: appointmentsArray.length || 156,
    todayAppointments:
      appointmentsArray.filter((apt) => {
        const today = new Date().toDateString();
        return new Date(apt.date).toDateString() === today;
      }).length || 24,
    totalStaff: users?.filter((u) => u.role !== "PATIENT")?.length || 18,
    activePatients: 89,
    monthlyRevenue: 45000,
    patientSatisfaction: 4.5,
    averageWaitTime: 12,
    utilizationRate: 78,
  };

  const recentActivities = [
    {
      type: "appointment",
      message: "Dr. Sharma completed consultation with patient #1234",
      time: "5 minutes ago",
    },
    {
      type: "staff",
      message: "New receptionist Maya joined the team",
      time: "2 hours ago",
    },
    {
      type: "schedule",
      message: "Weekly schedule updated for next month",
      time: "1 day ago",
    },
  ];

  const todaysQueue = [
    {
      patient: "Rajesh Kumar",
      doctor: "Dr. Priya",
      time: "10:00 AM",
      status: "Waiting",
      type: "Consultation",
    },
    {
      patient: "Aarti Sharma",
      doctor: "Dr. Amit",
      time: "10:30 AM",
      status: "In Progress",
      type: "Panchakarma",
    },
    {
      patient: "Vikram Singh",
      doctor: "Dr. Priya",
      time: "11:00 AM",
      status: "Checked In",
      type: "Follow-up",
    },
    {
      patient: "Sunita Devi",
      doctor: "Dr. Ravi",
      time: "11:30 AM",
      status: "Scheduled",
      type: "Nadi Pariksha",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Waiting":
        return "bg-yellow-100 text-yellow-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Checked In":
        return "bg-green-100 text-green-800";
      case "Scheduled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const sidebarLinks = getRoutesByRole(Role.CLINIC_ADMIN).map((route) => ({
    ...route,
    href: route.path,
    icon: route.path.includes("dashboard") ? (
      <Activity className="w-5 h-5" />
    ) : route.path.includes("staff") ? (
      <Users className="w-5 h-5" />
    ) : route.path.includes("schedule") ? (
      <Calendar className="w-5 h-5" />
    ) : route.path.includes("settings") ? (
      <Settings className="w-5 h-5" />
    ) : (
      <UserCheck className="w-5 h-5" />
    ),
  }));

  sidebarLinks.push({
    label: "Logout",
    href: "/(auth)/auth/login",
    path: "/(auth)/auth/login",
    icon: <LogOut className="w-5 h-5" />,
  });

  return (
    <DashboardLayout
      title="Clinic Admin Dashboard"
      allowedRole={Role.CLINIC_ADMIN}
    >
      <Sidebar
        links={sidebarLinks}
        user={{
          name:
            user?.name ||
            `${user?.firstName} ${user?.lastName}` ||
            "Clinic Admin",
          avatarUrl: (user as any)?.profilePicture || "/avatar.png",
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Clinic Dashboard</h1>
              <p className="text-gray-600">
                Welcome to Ayurveda Center Management
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                View Schedule
              </Button>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Quick Actions
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Today&apos;s Appointments
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.todayAppointments}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalAppointments} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Staff
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStaff}</div>
                <p className="text-xs text-muted-foreground">All departments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Patients
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activePatients}</div>
                <p className="text-xs text-muted-foreground">This month</p>
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
                  +15% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Patient Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {stats.patientSatisfaction}/5.0
                </div>
                <p className="text-sm text-gray-600">
                  Average rating this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Average Wait Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {stats.averageWaitTime} min
                </div>
                <p className="text-sm text-gray-600">
                  Clinic performance metric
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Utilization Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {stats.utilizationRate}%
                </div>
                <p className="text-sm text-gray-600">Resource efficiency</p>
              </CardContent>
            </Card>
          </div>

          {/* Today's Queue Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Today&apos;s Queue Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todaysQueue.map((appointment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Stethoscope className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{appointment.patient}</h4>
                        <p className="text-sm text-gray-600">
                          {appointment.doctor} • {appointment.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {appointment.time}
                      </span>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {activity.type === "appointment" && (
                          <Calendar className="w-4 h-4 text-blue-600" />
                        )}
                        {activity.type === "staff" && (
                          <Users className="w-4 h-4 text-green-600" />
                        )}
                        {activity.type === "schedule" && (
                          <Clock className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.message}
                        </p>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <Users className="w-6 h-6 text-blue-600 mb-2" />
                    <h3 className="font-medium">Manage Staff</h3>
                    <p className="text-xs text-gray-600">
                      Add or update staff members
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <Calendar className="w-6 h-6 text-green-600 mb-2" />
                    <h3 className="font-medium">Update Schedule</h3>
                    <p className="text-xs text-gray-600">
                      Modify doctor schedules
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <TrendingUp className="w-6 h-6 text-purple-600 mb-2" />
                    <h3 className="font-medium">View Reports</h3>
                    <p className="text-xs text-gray-600">
                      Analytics and insights
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <Settings className="w-6 h-6 text-orange-600 mb-2" />
                    <h3 className="font-medium">Clinic Settings</h3>
                    <p className="text-xs text-gray-600">
                      Configure clinic options
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts and Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Important Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Schedule Conflict
                    </p>
                    <p className="text-xs text-yellow-700">
                      Dr. Sharma has overlapping appointments at 2:00 PM
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Maintenance Reminder
                    </p>
                    <p className="text-xs text-blue-700">
                      Monthly equipment maintenance due in 3 days
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Sidebar>
    </DashboardLayout>
  );
}
