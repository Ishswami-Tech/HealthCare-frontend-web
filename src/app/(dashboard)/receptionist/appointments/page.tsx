"use client";

import React, { useState } from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import GlobalSidebar from "@/components/global/GlobalSidebar/GlobalSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRoutesByRole } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { 
  Activity,
  Calendar, 
  Users,
  UserCheck,
  LogOut,
  Search,
  Filter,
  Plus,
  QrCode,
  Phone,
  MessageSquare,
  Clock,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Bell,
  Eye,
  Edit,
  UserPlus,
  Stethoscope
} from "lucide-react";

export default function ReceptionistAppointments() {
  const { session } = useAuth();
  const user = session?.user;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [queueFilter, setQueueFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Mock appointment data with queue management features
  const appointments = [
    {
      id: "1",
      patientName: "Rajesh Kumar",
      patientPhone: "+91 9876543210",
      doctor: "Dr. Priya Sharma",
      time: "10:00 AM",
      status: "In Progress",
      type: "Panchakarma Consultation",
      queueType: "General",
      duration: "45 min",
      checkedInAt: "09:55 AM",
      waitTime: "5 min",
      queuePosition: 1,
      isWalkIn: false,
      priority: "Normal",
      notes: "Follow-up for chronic pain treatment"
    },
    {
      id: "2", 
      patientName: "Meera Patel",
      patientPhone: "+91 9876543211",
      doctor: "Dr. Amit Singh",
      time: "10:30 AM",
      status: "Waiting",
      type: "Shirodhara Session",
      queueType: "Panchakarma",
      duration: "90 min",
      checkedInAt: "10:15 AM",
      waitTime: "25 min",
      queuePosition: 2,
      isWalkIn: false,
      priority: "Normal",
      notes: "Stress management therapy"
    },
    {
      id: "3",
      patientName: "Suresh Gupta", 
      patientPhone: "+91 9876543212",
      doctor: "Dr. Priya Sharma",
      time: "11:00 AM",
      status: "Checked In",
      type: "Nadi Pariksha",
      queueType: "Viddhakarma",
      duration: "60 min",
      checkedInAt: "10:52 AM",
      waitTime: "8 min",
      queuePosition: 1,
      isWalkIn: false,
      priority: "Normal",
      notes: "Initial dosha analysis consultation"
    },
    {
      id: "4",
      patientName: "Anita Desai",
      patientPhone: "+91 9876543213", 
      doctor: "Dr. Ravi Kumar",
      time: "11:30 AM",
      status: "Scheduled",
      type: "Agnikarma Treatment",
      queueType: "Agnikarma",
      duration: "75 min",
      checkedInAt: null,
      waitTime: "-",
      queuePosition: null,
      isWalkIn: false,
      priority: "High",
      notes: "Chronic arthritis treatment session"
    },
    {
      id: "5",
      patientName: "Vikram Singh",
      patientPhone: "+91 9876543214",
      doctor: "Dr. Amit Singh",
      time: "Walk-in",
      status: "Walk-in",
      type: "General Consultation", 
      queueType: "General",
      duration: "30 min",
      checkedInAt: "11:35 AM",
      waitTime: "15 min",
      queuePosition: 3,
      isWalkIn: true,
      priority: "Low",
      notes: "General health consultation"
    }
  ];

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.doctor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || appointment.status.toLowerCase().replace(" ", "_") === statusFilter;
    const matchesQueue = queueFilter === "all" || appointment.queueType === queueFilter;
    
    return matchesSearch && matchesStatus && matchesQueue;
  });

  // Group appointments by queue type
  const queueGroups = {
    "General": filteredAppointments.filter(apt => apt.queueType === "General"),
    "Panchakarma": filteredAppointments.filter(apt => apt.queueType === "Panchakarma"), 
    "Viddhakarma": filteredAppointments.filter(apt => apt.queueType === "Viddhakarma"),
    "Agnikarma": filteredAppointments.filter(apt => apt.queueType === "Agnikarma")
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Waiting': return 'bg-yellow-100 text-yellow-800';
      case 'Checked In': return 'bg-green-100 text-green-800';
      case 'Scheduled': return 'bg-gray-100 text-gray-800';
      case 'Walk-in': return 'bg-purple-100 text-purple-800';
      case 'Completed': return 'bg-emerald-100 text-emerald-800';
      case 'No Show': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Normal': return 'bg-blue-100 text-blue-800';
      case 'Low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQueueTypeColor = (type: string) => {
    switch (type) {
      case 'General': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Panchakarma': return 'bg-green-50 text-green-700 border-green-200';
      case 'Viddhakarma': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Agnikarma': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleCheckIn = (appointmentId: string) => {
    console.log("Checking in patient:", appointmentId);
  };

  const handleMoveQueue = (appointmentId: string, newQueue: string) => {
    console.log("Moving patient to queue:", appointmentId, newQueue);
  };

  const handleNotifyNext = (queueType: string) => {
    console.log("Notifying next patient in queue:", queueType);
  };

  const handleMarkNoShow = (appointmentId: string) => {
    console.log("Marking as no-show:", appointmentId);
  };

  const sidebarLinks = getRoutesByRole(Role.RECEPTIONIST).map(route => ({
    ...route,
    href: route.path,
    icon: route.path.includes('dashboard') ? <Activity className="w-5 h-5" /> :
          route.path.includes('appointments') ? <Calendar className="w-5 h-5" /> :
          route.path.includes('patients') ? <Users className="w-5 h-5" /> :
          route.path.includes('profile') ? <UserCheck className="w-5 h-5" /> :
          <Activity className="w-5 h-5" />
  }));

  sidebarLinks.push({
    label: "Logout",
    href: "/(auth)/auth/login",
    path: "/(auth)/auth/login",
    icon: <LogOut className="w-5 h-5" />
  });

  return (
    <DashboardLayout title="Appointment Management" allowedRole={Role.RECEPTIONIST}>
      <GlobalSidebar
        links={sidebarLinks}
        user={{ 
          name: user?.name || `${user?.firstName} ${user?.lastName}` || "Receptionist",
          avatarUrl: (user as any)?.profilePicture || "/avatar.png" 
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Appointment & Queue Management</h1>
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

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{appointments.length}</div>
                <div className="text-sm text-gray-600">Total Today</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {appointments.filter(a => a.status === 'Checked In').length}
                </div>
                <div className="text-sm text-gray-600">Checked In</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {appointments.filter(a => a.status === 'Waiting').length}
                </div>
                <div className="text-sm text-gray-600">Waiting</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {appointments.filter(a => a.status === 'In Progress').length}
                </div>
                <div className="text-sm text-gray-600">In Progress</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {appointments.filter(a => a.isWalkIn).length}
                </div>
                <div className="text-sm text-gray-600">Walk-ins</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">18m</div>
                <div className="text-sm text-gray-600">Avg Wait</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search by patient name, doctor, or treatment type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedDate} onValueChange={setSelectedDate}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Select date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={new Date().toISOString().split('T')[0]}>Today</SelectItem>
                    <SelectItem value={new Date(Date.now() + 86400000).toISOString().split('T')[0]}>Tomorrow</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="checked_in">Checked In</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="walk-in">Walk-in</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={queueFilter} onValueChange={setQueueFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by queue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Queues</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Panchakarma">Panchakarma</SelectItem>
                    <SelectItem value="Viddhakarma">Viddhakarma</SelectItem>
                    <SelectItem value="Agnikarma">Agnikarma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="all-appointments" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all-appointments">All Appointments</TabsTrigger>
              <TabsTrigger value="general-queue">General Queue</TabsTrigger>
              <TabsTrigger value="panchakarma-queue">Panchakarma</TabsTrigger>
              <TabsTrigger value="viddhakarma-queue">Viddhakarma</TabsTrigger>
              <TabsTrigger value="agnikarma-queue">Agnikarma</TabsTrigger>
            </TabsList>

            <TabsContent value="all-appointments">
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => (
                  <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-800 font-semibold text-lg">
                              {appointment.patientName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              {appointment.patientName}
                              {appointment.isWalkIn && (
                                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                                  Walk-in
                                </Badge>
                              )}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {appointment.patientPhone}
                              </span>
                              <span>{appointment.doctor}</span>
                              <span>{appointment.type}</span>
                              <span>{appointment.duration}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={getQueueTypeColor(appointment.queueType)}>
                                {appointment.queueType}
                              </Badge>
                              <Badge className={getPriorityColor(appointment.priority)}>
                                {appointment.priority}
                              </Badge>
                              {appointment.queuePosition && (
                                <Badge variant="outline">
                                  Queue #{appointment.queuePosition}
                                </Badge>
                              )}
                            </div>
                            {appointment.notes && (
                              <p className="text-xs text-gray-500 mt-1">{appointment.notes}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium">
                              {appointment.time}
                              {appointment.checkedInAt && (
                                <div className="text-xs text-gray-500">
                                  In: {appointment.checkedInAt}
                                </div>
                              )}
                            </div>
                            <div className="text-sm">Wait: {appointment.waitTime}</div>
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-1">
                              {appointment.status === 'Scheduled' && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleCheckIn(appointment.id)}
                                  className="text-xs"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Check In
                                </Button>
                              )}
                              {appointment.status === 'Walk-in' && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleCheckIn(appointment.id)}
                                  className="text-xs"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Check In
                                </Button>
                              )}
                              {(appointment.status === 'Checked In' || appointment.status === 'Waiting') && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-xs"
                                >
                                  <Bell className="w-3 h-3 mr-1" />
                                  Notify
                                </Button>
                              )}
                              <Button variant="outline" size="sm" className="text-xs">
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>
                            
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" className="text-xs">
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button variant="outline" size="sm" className="text-xs">
                                <Phone className="w-3 h-3 mr-1" />
                                Call
                              </Button>
                              {appointment.status !== 'Completed' && appointment.status !== 'No Show' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleMarkNoShow(appointment.id)}
                                  className="text-xs text-red-600"
                                >
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  No Show
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Individual Queue Tabs */}
            {Object.entries(queueGroups).map(([queueName, queueAppointments]) => (
              <TabsContent key={queueName} value={`${queueName.toLowerCase()}-queue`}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Stethoscope className="w-5 h-5" />
                        {queueName} Queue ({queueAppointments.length})
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleNotifyNext(queueName)}
                        >
                          <Bell className="w-4 h-4 mr-1" />
                          Notify Next
                        </Button>
                        <Button variant="outline" size="sm">
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Refresh Queue
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {queueAppointments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Stethoscope className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No patients in {queueName} queue</p>
                        </div>
                      ) : (
                        queueAppointments.map((appointment, index) => (
                          <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-800">
                                {appointment.queuePosition || index + 1}
                              </div>
                              <div>
                                <h4 className="font-semibold">{appointment.patientName}</h4>
                                <div className="text-sm text-gray-600">
                                  {appointment.doctor} • {appointment.type}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Wait: {appointment.waitTime} • {appointment.time}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(appointment.status)}>
                                {appointment.status}
                              </Badge>
                              <div className="flex gap-1">
                                {appointment.status === 'Waiting' && index === 0 && (
                                  <Button size="sm" className="text-xs">
                                    <Play className="w-3 h-3 mr-1" />
                                    Next
                                  </Button>
                                )}
                                <Button variant="outline" size="sm" className="text-xs">
                                  <MessageSquare className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Quick Actions for Walk-in */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button className="flex items-center gap-2 h-16" variant="outline">
                  <Plus className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Add Walk-in</div>
                    <div className="text-xs text-gray-600">Quick patient registration</div>
                  </div>
                </Button>
                
                <Button className="flex items-center gap-2 h-16" variant="outline">
                  <QrCode className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">QR Check-in</div>
                    <div className="text-xs text-gray-600">Scan patient QR code</div>
                  </div>
                </Button>
                
                <Button className="flex items-center gap-2 h-16" variant="outline">
                  <Bell className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Send Reminders</div>
                    <div className="text-xs text-gray-600">Notify upcoming patients</div>
                  </div>
                </Button>
                
                <Button className="flex items-center gap-2 h-16" variant="outline">
                  <RotateCcw className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Refresh All</div>
                    <div className="text-xs text-gray-600">Update queue status</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </GlobalSidebar>
    </DashboardLayout>
  );
}

