"use client";

import React, { useState } from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import GlobalSidebar from "@/components/global/GlobalSidebar/GlobalSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getRoutesByRole } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { 
  Activity,
  Calendar, 
  FileText,
  Pill,
  User,
  Users,
  Building2,
  Settings,
  LogOut,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  Heart,
  Stethoscope,
  CalendarDays,
  UserCheck,
  DollarSign,
  Target,
  Zap,
  Globe,
  Smartphone,
  MapPin,
  Star
} from "lucide-react";

export default function AnalyticsDashboard() {
  const { session } = useAuth();
  const user = session?.user;
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("appointments");

  // Determine user role and setup appropriate sidebar
  const userRole = user?.role || Role.SUPER_ADMIN;
  
  // Mock Analytics data
  const overallStats = {
    totalPatients: 4567,
    activePatients: 3456,
    totalAppointments: 12340,
    completedAppointments: 11280,
    totalRevenue: 2456000,
    avgSessionDuration: "8.5 mins",
    patientSatisfaction: 4.7,
    systemUptime: 99.8
  };

  const performanceMetrics = [
    {
      metric: "Patient Growth",
      value: "+15.2%",
      trend: "up",
      period: "vs last month",
      color: "text-green-600"
    },
    {
      metric: "Appointment Completion Rate", 
      value: "91.4%",
      trend: "up",
      period: "vs 89.2% last month",
      color: "text-blue-600"
    },
    {
      metric: "Average Wait Time",
      value: "12 mins",
      trend: "down", 
      period: "vs 15 mins last month",
      color: "text-green-600"
    },
    {
      metric: "Patient Satisfaction",
      value: "4.7/5.0",
      trend: "up",
      period: "vs 4.5/5.0 last month",
      color: "text-purple-600"
    }
  ];

  const departmentStats = [
    {
      department: "General Consultation",
      appointments: 3240,
      revenue: 648000,
      satisfaction: 4.6,
      growth: "+12%"
    },
    {
      department: "Panchakarma Therapy",
      appointments: 1890,
      revenue: 756000,
      satisfaction: 4.8,
      growth: "+18%"
    },
    {
      department: "Diagnostic Services",
      appointments: 2340,
      revenue: 468000,
      satisfaction: 4.5,
      growth: "+8%"
    },
    {
      department: "Specialized Treatments",
      appointments: 1560,
      revenue: 624000,
      satisfaction: 4.9,
      growth: "+25%"
    }
  ];

  const patientDemographics = {
    ageGroups: [
      { group: "18-30", percentage: 25, count: 1142 },
      { group: "31-45", percentage: 35, count: 1598 },
      { group: "46-60", percentage: 28, count: 1279 },
      { group: "60+", percentage: 12, count: 548 }
    ],
    genderDistribution: {
      male: 52,
      female: 47,
      other: 1
    },
    locationDistribution: [
      { city: "Mumbai", percentage: 45, count: 2055 },
      { city: "Pune", percentage: 25, count: 1142 },
      { city: "Nashik", percentage: 15, count: 685 },
      { city: "Others", percentage: 15, count: 685 }
    ]
  };

  const treatmentEffectiveness = [
    {
      treatment: "Panchakarma Detox",
      successRate: 94,
      avgDuration: "21 days",
      patientCount: 456,
      improvementScore: 8.7
    },
    {
      treatment: "Stress Management",
      successRate: 87,
      avgDuration: "14 days", 
      patientCount: 672,
      improvementScore: 8.2
    },
    {
      treatment: "Digestive Health",
      successRate: 91,
      avgDuration: "30 days",
      patientCount: 589,
      improvementScore: 8.5
    },
    {
      treatment: "Joint & Mobility",
      successRate: 89,
      avgDuration: "45 days",
      patientCount: 378,
      improvementScore: 8.3
    }
  ];

  const digitalEngagement = {
    channelUsage: [
      { channel: "Mobile App", usage: 65, sessions: 8940 },
      { channel: "Website", usage: 28, sessions: 3850 },
      { channel: "Phone Booking", usage: 7, sessions: 960 }
    ],
    popularFeatures: [
      { feature: "Online Appointment Booking", usage: 78 },
      { feature: "Prescription Tracking", usage: 65 },
      { feature: "Treatment Progress", usage: 58 },
      { feature: "Video Consultations", usage: 45 }
    ]
  };

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? 
      <TrendingUp className="w-4 h-4 text-green-500" /> : 
      <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getTrendColor = (trend: string) => {
    return trend === "up" ? "text-green-600" : "text-red-600";
  };

  const sidebarLinks = getRoutesByRole(userRole).map(route => ({
    ...route,
    href: route.path,
    icon: route.path.includes('dashboard') ? <Activity className="w-5 h-5" /> :
          route.path.includes('appointments') ? <Calendar className="w-5 h-5" /> :
          route.path.includes('patients') ? <Users className="w-5 h-5" /> :
          route.path.includes('medical-records') ? <FileText className="w-5 h-5" /> :
          route.path.includes('prescriptions') ? <Pill className="w-5 h-5" /> :
          route.path.includes('profile') ? <User className="w-5 h-5" /> :
          route.path.includes('clinics') ? <Building2 className="w-5 h-5" /> :
          route.path.includes('users') ? <Users className="w-5 h-5" /> :
          route.path.includes('staff') ? <Users className="w-5 h-5" /> :
          route.path.includes('schedule') ? <Calendar className="w-5 h-5" /> :
          route.path.includes('settings') ? <Settings className="w-5 h-5" /> :
          <Activity className="w-5 h-5" />
  }));

  // Add Analytics link to sidebar
  sidebarLinks.push({
    label: "Analytics",
    href: "/analytics",
    icon: <BarChart3 className="w-5 h-5" />
  });

  sidebarLinks.push({
    label: "Logout",
    href: "/auth/login",
    icon: <LogOut className="w-5 h-5" />
  });

  return (
    <DashboardLayout title="Analytics Dashboard" allowedRole={userRole}>
      <GlobalSidebar
        links={sidebarLinks}
        user={{ 
          name: user?.name || `${user?.firstName} ${user?.lastName}` || "Administrator",
          avatarUrl: user?.profilePicture 
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
              <p className="text-gray-600">Comprehensive healthcare analytics and insights</p>
            </div>
            <div className="flex gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 3 months</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{overallStats.totalPatients.toLocaleString()}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                  +15.2% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                <Calendar className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{overallStats.totalAppointments.toLocaleString()}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                  91.4% completion rate
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">₹{(overallStats.totalRevenue / 100000).toFixed(1)}L</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                  +22.5% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
                <Star className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{overallStats.patientSatisfaction}/5.0</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                  +0.2 from last month
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="patients">Patient Analytics</TabsTrigger>
              <TabsTrigger value="treatments">Treatment Insights</TabsTrigger>
              <TabsTrigger value="digital">Digital Engagement</TabsTrigger>
              <TabsTrigger value="reports">Custom Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Key Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {performanceMetrics.map((metric, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{metric.metric}</h4>
                            <p className="text-sm text-gray-600">{metric.period}</p>
                          </div>
                          <div className="text-right">
                            <div className={`text-xl font-bold ${metric.color}`}>
                              {metric.value}
                            </div>
                            <div className="flex items-center gap-1">
                              {getTrendIcon(metric.trend)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Department Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Department Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {departmentStats.map((dept, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{dept.department}</h4>
                            <Badge className="bg-green-100 text-green-800">
                              {dept.growth}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Appointments</p>
                              <p className="font-semibold">{dept.appointments.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Revenue</p>
                              <p className="font-semibold">₹{(dept.revenue / 100000).toFixed(1)}L</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Satisfaction</p>
                              <p className="font-semibold flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                {dept.satisfaction}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    System Health & Operational Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{overallStats.systemUptime}%</div>
                      <div className="text-sm text-green-700">System Uptime</div>
                      <div className="text-xs text-green-600 mt-1">Last 30 days</div>
                    </div>
                    
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{overallStats.avgSessionDuration}</div>
                      <div className="text-sm text-blue-700">Avg Session Duration</div>
                      <div className="text-xs text-blue-600 mt-1">Per user visit</div>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">12 sec</div>
                      <div className="text-sm text-purple-700">Response Time</div>
                      <div className="text-xs text-purple-600 mt-1">Average API response</div>
                    </div>
                    
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">4</div>
                      <div className="text-sm text-orange-700">Active Alerts</div>
                      <div className="text-xs text-orange-600 mt-1">Require attention</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Appointment Performance Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">Booking Efficiency</h4>
                        <div className="text-2xl font-bold text-blue-600">94.2%</div>
                        <p className="text-sm text-blue-600">Successful bookings</p>
                        <div className="mt-2 text-xs text-blue-700">
                          ↑ 2.1% from last month
                        </div>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">No-Show Rate</h4>
                        <div className="text-2xl font-bold text-green-600">5.8%</div>
                        <p className="text-sm text-green-600">Below industry average</p>
                        <div className="mt-2 text-xs text-green-700">
                          ↓ 1.3% from last month
                        </div>
                      </div>
                      
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h4 className="font-semibold text-purple-800 mb-2">Reschedule Rate</h4>
                        <div className="text-2xl font-bold text-purple-600">8.4%</div>
                        <p className="text-sm text-purple-600">Within normal range</p>
                        <div className="mt-2 text-xs text-purple-700">
                          ↑ 0.5% from last month
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Peak Hours Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>Morning (9-12 PM)</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                            <span className="text-sm font-medium">75%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Afternoon (12-5 PM)</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                            </div>
                            <span className="text-sm font-medium">90%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Evening (5-8 PM)</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                            </div>
                            <span className="text-sm font-medium">65%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center p-8 text-gray-500">
                        <LineChart className="w-16 h-16 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Interactive Charts Coming Soon</h3>
                        <p className="text-sm">Detailed revenue trends and forecasting will be available here.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="patients">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Patient Demographics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-4">Age Distribution</h4>
                        <div className="space-y-3">
                          {patientDemographics.ageGroups.map((group, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span>{group.group} years</span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full" 
                                    style={{ width: `${group.percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium w-8">{group.percentage}%</span>
                                <span className="text-xs text-gray-600">({group.count})</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-4">Geographic Distribution</h4>
                        <div className="space-y-3">
                          {patientDemographics.locationDistribution.map((location, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-gray-500" />
                                {location.city}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full" 
                                    style={{ width: `${location.percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium w-8">{location.percentage}%</span>
                                <span className="text-xs text-gray-600">({location.count})</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold mb-4">Gender Distribution</h4>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                          <span>Male: {patientDemographics.genderDistribution.male}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-pink-500 rounded-full"></div>
                          <span>Female: {patientDemographics.genderDistribution.female}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                          <span>Other: {patientDemographics.genderDistribution.other}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Patient Acquisition & Retention</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">67%</div>
                        <div className="text-sm text-blue-700">New Patients</div>
                        <div className="text-xs text-blue-600 mt-1">This month</div>
                      </div>
                      
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">89%</div>
                        <div className="text-sm text-green-700">Retention Rate</div>
                        <div className="text-xs text-green-600 mt-1">6-month period</div>
                      </div>
                      
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">4.2</div>
                        <div className="text-sm text-purple-700">Avg Visits</div>
                        <div className="text-xs text-purple-600 mt-1">Per patient annually</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="treatments">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5" />
                    Treatment Effectiveness Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {treatmentEffectiveness.map((treatment, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{treatment.treatment}</h3>
                            <p className="text-sm text-gray-600">{treatment.patientCount} patients treated</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            {treatment.successRate}% Success Rate
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-xl font-bold text-blue-600">{treatment.avgDuration}</div>
                            <div className="text-sm text-blue-700">Average Duration</div>
                          </div>
                          
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-xl font-bold text-green-600">{treatment.improvementScore}/10</div>
                            <div className="text-sm text-green-700">Improvement Score</div>
                          </div>
                          
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="text-xl font-bold text-purple-600">{treatment.patientCount}</div>
                            <div className="text-sm text-purple-700">Patients Treated</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="digital">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5" />
                      Digital Channel Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-4">Channel Usage</h4>
                        <div className="space-y-3">
                          {digitalEngagement.channelUsage.map((channel, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                {channel.channel === "Mobile App" && <Smartphone className="w-4 h-4 text-blue-600" />}
                                {channel.channel === "Website" && <Globe className="w-4 h-4 text-green-600" />}
                                {channel.channel === "Phone Booking" && <Activity className="w-4 h-4 text-purple-600" />}
                                {channel.channel}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full" 
                                    style={{ width: `${channel.usage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium w-8">{channel.usage}%</span>
                                <span className="text-xs text-gray-600">({channel.sessions})</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-4">Popular Features</h4>
                        <div className="space-y-3">
                          {digitalEngagement.popularFeatures.map((feature, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span>{feature.feature}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full" 
                                    style={{ width: `${feature.usage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium w-8">{feature.usage}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Experience Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Page Load Speed</span>
                          <div className="flex items-center gap-2">
                            <div className="text-green-600 font-semibold">2.3s</div>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Mobile Responsiveness</span>
                          <div className="flex items-center gap-2">
                            <div className="text-green-600 font-semibold">98%</div>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Error Rate</span>
                          <div className="flex items-center gap-2">
                            <div className="text-green-600 font-semibold">0.2%</div>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>User Satisfaction</span>
                          <div className="flex items-center gap-2">
                            <div className="text-green-600 font-semibold">4.6/5</div>
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Conversion Funnel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>Website Visitors</span>
                          <span className="font-semibold">10,000</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Appointment Inquiries</span>
                          <span className="font-semibold">4,500 (45%)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Bookings Started</span>
                          <span className="font-semibold">3,200 (71%)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Bookings Completed</span>
                          <span className="font-semibold">2,880 (90%)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Appointments Attended</span>
                          <span className="font-semibold">2,712 (94%)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Custom Reports & Data Export
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                        <Calendar className="w-6 h-6" />
                        <span className="text-sm">Monthly Report</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                        <Users className="w-6 h-6" />
                        <span className="text-sm">Patient Report</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                        <DollarSign className="w-6 h-6" />
                        <span className="text-sm">Revenue Report</span>
                      </Button>
                    </div>

                    <div className="border rounded-lg p-6">
                      <h3 className="font-semibold mb-4">Generate Custom Report</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select report type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="appointments">Appointments</SelectItem>
                            <SelectItem value="patients">Patients</SelectItem>
                            <SelectItem value="revenue">Revenue</SelectItem>
                            <SelectItem value="treatments">Treatments</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Date range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 3 months</SelectItem>
                            <SelectItem value="1y">Last year</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Export format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="excel">Excel</SelectItem>
                            <SelectItem value="csv">CSV</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button className="flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          Generate Report
                        </Button>
                        <Button variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </GlobalSidebar>
    </DashboardLayout>
  );
}