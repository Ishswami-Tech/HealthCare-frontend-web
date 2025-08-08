"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useMyAppointments } from "@/hooks/useAppointments";
import { Role } from "@/types/auth.types";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Video,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

export default function AppointmentsPage() {
  const { session } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterType, setFilterType] = useState("");

  const userRole = session?.user?.role as Role;

  // Fetch real appointments data
  const {
    data: appointments,
    isPending: isLoading,
    error,
  } = useMyAppointments({
    search: searchTerm,
    doctorId: filterDoctor || undefined,
    type: filterType || undefined,
  });

  // Separate upcoming and past appointments
  const now = new Date();
  const upcomingAppointments =
    appointments?.filter((apt) => new Date(apt.date) >= now) || [];

  const pastAppointments =
    appointments?.filter((apt) => new Date(apt.date) < now) || [];

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">
            Error loading appointments: {error.message}
          </p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Mock data for appointments (fallback if no real data)
  const mockUpcomingAppointments = [
    {
      id: "1",
      patientName: "Rajesh Kumar",
      doctorName: "Dr. Priya Sharma",
      date: "2025-08-10",
      time: "10:00 AM",
      type: "Consultation",
      mode: "in-person",
      status: "confirmed",
      clinic: "Ayurveda Center",
      phone: "+91 98765 43210",
    },
    {
      id: "2",
      patientName: "Aarti Singh",
      doctorName: "Dr. Amit Patel",
      date: "2025-08-10",
      time: "2:30 PM",
      type: "Panchakarma",
      mode: "in-person",
      status: "pending",
      clinic: "Wellness Clinic",
      phone: "+91 87654 32109",
    },
    {
      id: "3",
      patientName: "Vikram Gupta",
      doctorName: "Dr. Ravi Mehta",
      date: "2025-08-11",
      time: "11:00 AM",
      type: "Nadi Pariksha",
      mode: "video",
      status: "confirmed",
      clinic: "Holistic Health",
      phone: "+91 76543 21098",
    },
  ];

  const mockPastAppointments = [
    {
      id: "4",
      patientName: "Sunita Devi",
      doctorName: "Dr. Priya Sharma",
      date: "2025-08-05",
      time: "9:00 AM",
      type: "Follow-up",
      mode: "in-person",
      status: "completed",
      clinic: "Ayurveda Center",
      phone: "+91 65432 10987",
    },
    {
      id: "5",
      patientName: "Manoj Tiwari",
      doctorName: "Dr. Amit Patel",
      date: "2025-08-03",
      time: "3:00 PM",
      type: "Agnikarma",
      mode: "in-person",
      status: "completed",
      clinic: "Wellness Clinic",
      phone: "+91 54321 09876",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Consultation":
        return "bg-blue-100 text-blue-800";
      case "Panchakarma":
        return "bg-purple-100 text-purple-800";
      case "Agnikarma":
        return "bg-orange-100 text-orange-800";
      case "Nadi Pariksha":
        return "bg-green-100 text-green-800";
      case "Follow-up":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const AppointmentCard = ({
    appointment,
    showActions = true,
  }: {
    appointment: any;
    showActions?: boolean;
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {userRole === Role.PATIENT
                    ? appointment.doctorName
                    : appointment.patientName}
                </h3>
                <p className="text-sm text-gray-600">
                  {userRole === Role.PATIENT
                    ? appointment.clinic
                    : appointment.phone}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{appointment.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{appointment.time}</span>
              </div>
              <div className="flex items-center gap-2">
                {appointment.mode === "video" ? (
                  <Video className="w-4 h-4 text-gray-500" />
                ) : (
                  <MapPin className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-sm capitalize">{appointment.mode}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{appointment.phone}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Badge className={getTypeColor(appointment.type)}>
                {appointment.type}
              </Badge>
              <Badge className={getStatusColor(appointment.status)}>
                {appointment.status}
              </Badge>
            </div>
          </div>

          {showActions && (
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                View
              </Button>
              {appointment.status !== "completed" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-gray-600">Manage your appointments and schedule</p>
        </div>
        {(userRole === Role.PATIENT || userRole === Role.RECEPTIONIST) && (
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Book Appointment
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterDoctor} onValueChange={setFilterDoctor}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by doctor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doctors</SelectItem>
                <SelectItem value="dr-priya">Dr. Priya Sharma</SelectItem>
                <SelectItem value="dr-amit">Dr. Amit Patel</SelectItem>
                <SelectItem value="dr-ravi">Dr. Ravi Mehta</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="consultation">Consultation</SelectItem>
                <SelectItem value="panchakarma">Panchakarma</SelectItem>
                <SelectItem value="agnikarma">Agnikarma</SelectItem>
                <SelectItem value="nadi-pariksha">Nadi Pariksha</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No upcoming appointments
                </h3>
                <p className="text-gray-500 mb-4">
                  You don't have any appointments scheduled.
                </p>
                {userRole === Role.PATIENT && (
                  <Button>Book Your First Appointment</Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {(pastAppointments.length > 0
            ? pastAppointments
            : mockPastAppointments
          ).length > 0 ? (
            (pastAppointments.length > 0
              ? pastAppointments
              : mockPastAppointments
            ).map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                showActions={false}
              />
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No past appointments
                </h3>
                <p className="text-gray-500">
                  Your appointment history will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
