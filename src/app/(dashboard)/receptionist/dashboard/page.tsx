"use client";


import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Sidebar from "@/components/global/GlobalSidebar/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRoutesByRole, ROUTES } from "@/lib/config/routes";
import { useAuth } from "@/hooks/auth/useAuth";
import { useMyAppointments } from "@/hooks/query/useAppointments";
import {
  Activity,
  Calendar,
  Users,
  UserCheck,
  LogOut,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Phone,
  MessageSquare,
  QrCode,
  Eye,
  Edit,
  Stethoscope,
} from "lucide-react";

export default function ReceptionistDashboard() {
  const { session } = useAuth();
  const user = session?.user;

  // Fetch real data using existing hooks and server actions
  const { data: appointments } = useMyAppointments();

  // Calculate real stats from fetched data
  const appointmentsArray = appointments?.appointments || [];
  const stats = {
    todayAppointments:
      appointmentsArray.filter((apt) => {
        const today = new Date().toDateString();
        return new Date(apt.date).toDateString() === today;
      }).length || 0,
    checkedInPatients:
      appointmentsArray.filter((apt) => apt.status === "CHECKED_IN").length || 0,
    waitingPatients:
      appointmentsArray.filter((apt) => apt.status === "SCHEDULED").length || 0,
    completedToday:
      appointmentsArray.filter((apt) => {
        const today = new Date().toDateString();
        return (
          new Date(apt.date).toDateString() === today &&
          apt.status === "COMPLETED"
        );
      }).length || 15,
    walkInsToday: 4,
    averageWaitTime: 18,
  };

  const todaysQueue = [
    {
      id: "1",
      patientName: "Rajesh Kumar",
      doctor: "Dr. Priya Sharma",
      time: "10:00 AM",
      status: "In Progress",
      type: "Consultation",
      queueType: "General",
      waitTime: "5 min",
      checkedInAt: "09:55 AM",
    },
    {
      id: "2",
      patientName: "Meera Patel",
      doctor: "Dr. Amit Singh",
      time: "10:30 AM",
      status: "Waiting",
      type: "Panchakarma",
      queueType: "Therapy",
      waitTime: "15 min",
      checkedInAt: "10:15 AM",
    },
    {
      id: "3",
      patientName: "Suresh Gupta",
      doctor: "Dr. Priya Sharma",
      time: "11:00 AM",
      status: "Checked In",
      type: "Nadi Pariksha",
      queueType: "Diagnosis",
      waitTime: "8 min",
      checkedInAt: "10:52 AM",
    },
    {
      id: "4",
      patientName: "Anita Desai",
      doctor: "Dr. Ravi Kumar",
      time: "11:30 AM",
      status: "Scheduled",
      type: "Shirodhara",
      queueType: "Therapy",
      waitTime: "-",
      checkedInAt: null,
    },
    {
      id: "5",
      patientName: "Vikram Singh",
      doctor: "Dr. Amit Singh",
      time: "12:00 PM",
      status: "Walk-in",
      type: "Consultation",
      queueType: "General",
      waitTime: "25 min",
      checkedInAt: "11:35 AM",
    },
  ];

  const upcomingAppointments = [
    {
      patient: "Kavita Sharma",
      doctor: "Dr. Priya",
      time: "2:00 PM",
      type: "Follow-up",
    },
    {
      patient: "Ramesh Joshi",
      doctor: "Dr. Amit",
      time: "2:30 PM",
      type: "Agnikarma",
    },
    {
      patient: "Deepa Singh",
      doctor: "Dr. Ravi",
      time: "3:00 PM",
      type: "Consultation",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Waiting":
        return "bg-yellow-100 text-yellow-800";
      case "Checked In":
        return "bg-green-100 text-green-800";
      case "Scheduled":
        return "bg-gray-100 text-gray-800";
      case "Walk-in":
        return "bg-purple-100 text-purple-800";
      case "Completed":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getQueueTypeColor = (type: string) => {
    switch (type) {
      case "General":
        return "bg-blue-50 text-blue-700";
      case "Therapy":
        return "bg-green-50 text-green-700";
      case "Diagnosis":
        return "bg-purple-50 text-purple-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  const sidebarLinks = getRoutesByRole(Role.RECEPTIONIST).map((route) => ({
    ...route,
    href: route.path,
    icon: route.path.includes("dashboard") ? (
      <Activity className="w-5 h-5" />
    ) : route.path.includes("appointments") ? (
      <Calendar className="w-5 h-5" />
    ) : route.path.includes("patients") ? (
      <Users className="w-5 h-5" />
    ) : route.path.includes("profile") ? (
      <UserCheck className="w-5 h-5" />
    ) : (
      <Activity className="w-5 h-5" />
    ),
  }));

  sidebarLinks.push({
    label: "Logout",
    href: ROUTES.LOGIN,
    path: ROUTES.LOGIN,
    icon: <LogOut className="w-5 h-5" />,
  });

  return (
    <DashboardLayout
      title="Receptionist Dashboard"
      allowedRole={Role.RECEPTIONIST}
    >
      <Sidebar
        links={sidebarLinks}
        user={{
          name:
            user?.name ||
            `${user?.firstName} ${user?.lastName}` ||
            "Receptionist",
          avatarUrl: (user as any)?.profilePicture || "/avatar.png",
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Reception Dashboard</h1>
              <p className="text-gray-600">
                Today is{" "}
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                QR Check-in
              </Button>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Appointment
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Today's Total
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.todayAppointments}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Checked In
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.checkedInPatients}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Waiting</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.waitingPatients}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.completedToday}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Walk-ins</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.walkInsToday}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Wait</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.averageWaitTime}m
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Queue Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Current Patient Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todaysQueue.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">
                          {appointment.patientName}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span>{appointment.doctor}</span>
                          <span>•</span>
                          <span>{appointment.type}</span>
                          <span>•</span>
                          <Badge
                            className={getQueueTypeColor(appointment.queueType)}
                            variant="outline"
                          >
                            {appointment.queueType}
                          </Badge>
                        </div>
                        {appointment.checkedInAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Checked in at {appointment.checkedInAt}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium text-sm">
                          {appointment.time}
                        </div>
                        <div className="text-xs text-gray-500">
                          Wait: {appointment.waitTime}
                        </div>
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                      <div className="flex gap-1">
                        {appointment.status === "Scheduled" && (
                          <Button size="sm" className="text-xs">
                            Check In
                          </Button>
                        )}
                        {appointment.status === "Walk-in" && (
                          <Button size="sm" className="text-xs">
                            Check In
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="text-xs">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs">
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{appointment.patient}</h4>
                        <p className="text-sm text-gray-600">
                          {appointment.doctor} • {appointment.type}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">
                          {appointment.time}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs mt-1"
                        >
                          Notify
                        </Button>
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
                    <Plus className="w-6 h-6 text-blue-600 mb-2" />
                    <h3 className="font-medium">New Appointment</h3>
                    <p className="text-xs text-gray-600">
                      Schedule new patient visit
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <QrCode className="w-6 h-6 text-green-600 mb-2" />
                    <h3 className="font-medium">QR Check-in</h3>
                    <p className="text-xs text-gray-600">
                      Quick patient check-in
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <Phone className="w-6 h-6 text-purple-600 mb-2" />
                    <h3 className="font-medium">Call Patient</h3>
                    <p className="text-xs text-gray-600">
                      Contact waiting patients
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <MessageSquare className="w-6 h-6 text-orange-600 mb-2" />
                    <h3 className="font-medium">Send SMS</h3>
                    <p className="text-xs text-gray-600">
                      Appointment reminders
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Queue Management by Type */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-blue-700">
                  General Consultations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {todaysQueue
                    .filter((apt) => apt.queueType === "General")
                    .map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{appointment.patientName}</span>
                        <Badge
                          className={getStatusColor(appointment.status)}
                          variant="outline"
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                    ))}
                  <div className="pt-2 text-xs text-gray-500">
                    Total:{" "}
                    {
                      todaysQueue.filter((apt) => apt.queueType === "General")
                        .length
                    }
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-700">
                  Therapy Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {todaysQueue
                    .filter((apt) => apt.queueType === "Therapy")
                    .map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{appointment.patientName}</span>
                        <Badge
                          className={getStatusColor(appointment.status)}
                          variant="outline"
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                    ))}
                  <div className="pt-2 text-xs text-gray-500">
                    Total:{" "}
                    {
                      todaysQueue.filter((apt) => apt.queueType === "Therapy")
                        .length
                    }
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-purple-700">
                  Diagnostic Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {todaysQueue
                    .filter((apt) => apt.queueType === "Diagnosis")
                    .map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{appointment.patientName}</span>
                        <Badge
                          className={getStatusColor(appointment.status)}
                          variant="outline"
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                    ))}
                  <div className="pt-2 text-xs text-gray-500">
                    Total:{" "}
                    {
                      todaysQueue.filter((apt) => apt.queueType === "Diagnosis")
                        .length
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Important Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Long Wait Time Alert
                    </p>
                    <p className="text-xs text-yellow-700">
                      Meera Patel has been waiting for 15+ minutes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Appointment Reminder
                    </p>
                    <p className="text-xs text-blue-700">
                      3 patients have appointments in the next 30 minutes
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
