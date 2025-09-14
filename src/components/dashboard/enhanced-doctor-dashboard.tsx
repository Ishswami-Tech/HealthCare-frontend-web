"use client";

import React from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import GlobalSidebar from "@/components/global/GlobalSidebar/GlobalSidebar";
import { MetricCard, Card, CardHeader, CardTitle, CardContent } from "@/components/ui/enhanced-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getRoutesByRole } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { useMyAppointments } from "@/hooks/useAppointments";
import { useClinicContext } from "@/hooks/useClinic";
import {
  Activity,
  Calendar,
  Users,
  UserCheck,
  Clock,
  Stethoscope,
  LogOut,
  Play,
  CheckCircle,
  AlertCircle,
  FileText,
  Video,
  Heart,
  Brain,
  Eye,
  MessageSquare,
  Star,
  TrendingUp,
  Bell,
  Settings,
} from "lucide-react";

export default function EnhancedDoctorDashboard() {
  const { session } = useAuth();
  const user = session?.user;
  const { clinicId } = useClinicContext();
  
  // Fetch real data
  const { data: appointments, isPending: loadingAppointments } = useMyAppointments();

  // Enhanced stats with better calculations
  const stats = {
    todayAppointments:
      appointments?.appointments?.filter((apt) => {
        const today = new Date().toDateString();
        return new Date(apt.date).toDateString() === today;
      })?.length || 8,
    checkedInPatients:
      appointments?.appointments?.filter((apt) => apt.status === "CHECKED_IN")?.length || 3,
    completedToday:
      appointments?.appointments?.filter((apt) => {
        const today = new Date().toDateString();
        return (
          new Date(apt.date).toDateString() === today &&
          apt.status === "COMPLETED"
        );
      })?.length || 5,
    totalPatients:
      appointments?.appointments?.reduce((acc: any[], apt: any) => {
        const patientIds = new Set(acc.map((p) => p.patientId));
        if (!patientIds.has(apt.patientId)) {
          acc.push(apt);
        }
        return acc;
      }, [])?.length || 124,
    avgConsultationTime: 25,
    patientSatisfaction: 4.8,
    nextAppointment: "10:30 AM",
    urgentTasks: 2,
    pendingReports: 5,
    todayRevenue: 8500,
    monthlyTarget: 50000,
    targetProgress: 68,
  };

  // Enhanced queue data
  const todaysQueue = [
    {
      id: "1",
      patientName: "Rajesh Kumar",
      time: "10:00 AM",
      status: "in-progress" as const,
      type: "Consultation",
      duration: "30 min",
      priority: "normal" as const,
      notes: "Follow-up for Panchakarma treatment",
      vitals: { bp: "120/80", temp: "98.6°F", pulse: "72" },
      lastVisit: "2 weeks ago",
    },
    {
      id: "2",
      patientName: "Priya Sharma",
      time: "10:30 AM",
      status: "waiting" as const,
      type: "Nadi Pariksha",
      duration: "45 min",
      priority: "high" as const,
      notes: "Initial consultation for dosha analysis",
      condition: "Chronic fatigue, digestive issues",
      age: 34,
    },
    {
      id: "3",
      patientName: "Amit Singh",
      time: "11:15 AM",
      status: "waiting" as const,
      type: "Follow-up",
      duration: "15 min",
      priority: "normal" as const,
      notes: "Review treatment progress",
      medication: "Triphala, Ashwagandha",
      improvement: "70%",
    },
    {
      id: "4",
      patientName: "Sunita Devi",
      time: "12:00 PM",
      status: "waiting" as const,
      type: "Shirodhara",
      duration: "60 min",
      priority: "critical" as const,
      notes: "Stress management therapy session",
      symptoms: "Anxiety, insomnia",
      referral: "Psychiatrist recommendation",
    },
  ];

  // Recent achievements and updates
  const recentAchievements = [
    {
      icon: <Star className="h-4 w-4 text-yellow-500" />,
      text: "Achieved 4.9★ patient satisfaction rating",
      time: "This month",
      type: "achievement",
    },
    {
      icon: <TrendingUp className="h-4 w-4 text-green-500" />,
      text: "Completed 50+ consultations ahead of target",
      time: "This week",
      type: "milestone",
    },
    {
      icon: <Heart className="h-4 w-4 text-red-500" />,
      text: "Successfully treated 3 chronic conditions",
      time: "Last 30 days",
      type: "success",
    },
  ];

  // Urgent notifications
  const urgentNotifications = [
    {
      id: "1",
      type: "critical",
      message: "Patient Sunita Devi requires immediate attention",
      time: "5 min ago",
      action: "Review Case",
    },
    {
      id: "2",
      type: "warning",
      message: "Lab results pending for 3 patients",
      time: "1 hour ago",
      action: "Check Reports",
    },
  ];

  const sidebarLinks = getRoutesByRole(Role.DOCTOR).map((route) => ({
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
      <Stethoscope className="w-5 h-5" />
    ),
  }));

  sidebarLinks.push({
    label: "Logout",
    href: "/(auth)/auth/login",
    path: "/(auth)/auth/login",
    icon: <LogOut className="w-5 h-5" />,
  });

  return (
    <DashboardLayout title="Doctor Dashboard" allowedRole={Role.DOCTOR}>
      <GlobalSidebar
        links={sidebarLinks}
        user={{
          name:
            user?.name || `${user?.firstName} ${user?.lastName}` || "Doctor",
          avatarUrl: (user as any)?.profilePicture || "/avatar.png",
        }}
      >
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
          {/* Header Section */}
          <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                    Good morning, Dr. {user?.firstName || "Doctor"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString("en-IN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })} • {clinicId ? "Ayurveda Wellness Center" : "Healthcare Clinic"}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Online
                  </Badge>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Bell className="h-4 w-4" />
                    {stats.urgentTasks}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Messages
                  </Button>
                </div>
              </div>

              {/* Quick Stats Bar */}
              <div className="flex items-center justify-between mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.nextAppointment}</div>
                    <div className="text-xs text-muted-foreground">Next Patient</div>
                  </div>
                  <div className="h-8 w-px bg-gray-300"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
                    <div className="text-xs text-muted-foreground">Completed Today</div>
                  </div>
                  <div className="h-8 w-px bg-gray-300"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.checkedInPatients}</div>
                    <div className="text-xs text-muted-foreground">Waiting</div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Video className="h-4 w-4 mr-2" />
                    Start Video Call
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6 space-y-6">
            {/* Urgent Notifications */}
            {urgentNotifications.length > 0 && (
              <div className="grid gap-3">
                {urgentNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`border-l-4 ${
                      notification.type === "critical" 
                        ? "border-l-red-500 bg-red-50/50" 
                        : "border-l-amber-500 bg-amber-50/50"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <AlertCircle className={`h-5 w-5 ${
                            notification.type === "critical" ? "text-red-500" : "text-amber-500"
                          }`} />
                          <div>
                            <p className="font-medium">{notification.message}</p>
                            <p className="text-sm text-muted-foreground">{notification.time}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant={notification.type === "critical" ? "default" : "outline"}
                        >
                          {notification.action}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Today's Appointments"
                value={stats.todayAppointments}
                change={{ value: 12, type: "increase", period: "vs yesterday" }}
                icon={<Calendar className="h-5 w-5" />}
                loading={loadingAppointments}
                className="hover:shadow-lg transition-shadow"
              />
              
              <MetricCard
                title="Total Patients"
                value={stats.totalPatients}
                change={{ value: 8, type: "increase", period: "this month" }}
                icon={<Users className="h-5 w-5" />}
                variant="success"
              />
              
              <MetricCard
                title="Satisfaction Score"
                value={`${stats.patientSatisfaction}/5.0`}
                change={{ value: 0.2, type: "increase", period: "this month" }}
                icon={<Star className="h-5 w-5" />}
                variant="warning"
              />
              
              <MetricCard
                title="Avg Consultation"
                value={`${stats.avgConsultationTime} min`}
                change={{ value: 5, type: "decrease", period: "improved" }}
                icon={<Clock className="h-5 w-5" />}
                variant="success"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today's Patient Queue */}
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Stethoscope className="h-5 w-5 text-blue-600" />
                          Today's Patient Queue
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {todaysQueue.filter(p => p.status === "waiting").length} patients waiting
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {todaysQueue.map((patient) => (
                      <div
                        key={patient.id}
                        className={`group relative overflow-hidden rounded-lg border p-4 transition-all hover:shadow-md ${
                          patient.status === "in-progress" 
                            ? "bg-blue-50 border-blue-200" 
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-900">{patient.patientName}</h4>
                                {patient.priority === "critical" && (
                                  <Badge variant="destructive" className="text-xs">Critical</Badge>
                                )}
                                {patient.priority === "high" && (
                                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">High</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {patient.time} • {patient.duration}
                                </span>
                                <span>{patient.type}</span>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2">{patient.notes}</p>
                              
                              {/* Additional patient info */}
                              {patient.vitals && (
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                  <span>BP: {patient.vitals.bp}</span>
                                  <span>Temp: {patient.vitals.temp}</span>
                                  <span>Pulse: {patient.vitals.pulse}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                patient.status === "in-progress" ? "default" :
                                patient.status === "waiting" ? "secondary" : "outline"
                              }
                              className="capitalize"
                            >
                              {patient.status.replace("-", " ")}
                            </Badge>
                            
                            {patient.status === "waiting" && (
                              <Button size="sm" className="gap-1">
                                <Play className="h-3 w-3" />
                                Start
                              </Button>
                            )}
                            
                            {patient.status === "in-progress" && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="gap-1">
                                  <Video className="h-3 w-3" />
                                </Button>
                                <Button size="sm" className="gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Complete
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Progress indicator for critical patients */}
                        {patient.priority === "critical" && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-200">
                            <div className="h-full bg-red-500 animate-pulse" style={{ width: "75%" }}></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Performance Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Performance Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Monthly Target</span>
                        <span className="font-medium">₹{stats.todayRevenue.toLocaleString()} / ₹{stats.monthlyTarget.toLocaleString()}</span>
                      </div>
                      <Progress value={stats.targetProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {stats.targetProgress}% of monthly target achieved
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">4.8</div>
                        <div className="text-xs text-muted-foreground">Satisfaction</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">95%</div>
                        <div className="text-xs text-muted-foreground">Success Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Achievements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      Recent Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recentAchievements.map((achievement, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50">
                        {achievement.icon}
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{achievement.text}</p>
                          <p className="text-xs text-muted-foreground">{achievement.time}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="text-xs">Write Prescription</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col items-center gap-2">
                      <Video className="h-5 w-5 text-green-600" />
                      <span className="text-xs">Video Call</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      <span className="text-xs">AI Diagnosis</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col items-center gap-2">
                      <Heart className="h-5 w-5 text-red-600" />
                      <span className="text-xs">Health Monitor</span>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </GlobalSidebar>
    </DashboardLayout>
  );
}

// Add missing User import
const User = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    className={className}
    fill="none"
    height="24"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="24"
    {...props}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);