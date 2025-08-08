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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
  Eye,
  Phone,
  Mail,
  MapPin,
  FileText,
  Clock,
  TrendingUp,
  AlertCircle,
  Pill,
  Heart,
  Brain,
  Stethoscope,
} from "lucide-react";

export default function DoctorPatients() {
  const { session } = useAuth();
  const user = session?.user;
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Mock patient data
  const patients = [
    {
      id: "1",
      name: "Rajesh Kumar",
      age: 45,
      gender: "Male",
      phone: "+91 9876543210",
      email: "rajesh.kumar@email.com",
      address: "123 MG Road, Mumbai, MH 400001",
      lastVisit: "2024-01-15",
      nextAppointment: "2024-01-22",
      totalVisits: 8,
      chiefComplaints: ["Chronic back pain", "Joint stiffness"],
      currentTreatment: "Panchakarma Therapy",
      medications: ["Yogaraja Guggulu", "Mahanarayana Oil"],
      allergies: ["None known"],
      vitalSigns: {
        bp: "130/80",
        pulse: "76",
        weight: "70 kg",
        height: "5'8\"",
      },
      medicalHistory: ["Diabetes Type 2", "Hypertension"],
      treatmentHistory: [
        {
          date: "2024-01-15",
          treatment: "Panchakarma Session",
          doctor: "Dr. Priya",
          notes: "Good response to treatment",
        },
        {
          date: "2024-01-08",
          treatment: "Consultation",
          doctor: "Dr. Priya",
          notes: "Started new medication",
        },
        {
          date: "2024-01-01",
          treatment: "Follow-up",
          doctor: "Dr. Priya",
          notes: "Pain reduced significantly",
        },
      ],
      labReports: [
        {
          date: "2024-01-10",
          test: "Blood Sugar",
          result: "Normal",
          value: "110 mg/dl",
        },
        {
          date: "2024-01-10",
          test: "Blood Pressure",
          result: "Elevated",
          value: "140/85 mmHg",
        },
      ],
    },
    {
      id: "2",
      name: "Priya Sharma",
      age: 32,
      gender: "Female",
      phone: "+91 9876543211",
      email: "priya.sharma@email.com",
      address: "456 Park Street, Delhi, DL 110001",
      lastVisit: "2024-01-12",
      nextAppointment: "2024-01-19",
      totalVisits: 5,
      chiefComplaints: ["Digestive issues", "Irregular periods"],
      currentTreatment: "Nadi Pariksha & Ayurvedic Medicine",
      medications: ["Ashokarishtam", "Triphala Churna"],
      allergies: ["Nuts"],
      vitalSigns: {
        bp: "110/70",
        pulse: "82",
        weight: "58 kg",
        height: "5'4\"",
      },
      medicalHistory: ["PCOS", "Iron deficiency anemia"],
      treatmentHistory: [
        {
          date: "2024-01-12",
          treatment: "Nadi Pariksha",
          doctor: "Dr. Priya",
          notes: "Vata-Pitta imbalance detected",
        },
        {
          date: "2024-01-05",
          treatment: "Consultation",
          doctor: "Dr. Priya",
          notes: "Dietary changes recommended",
        },
      ],
      labReports: [
        {
          date: "2024-01-08",
          test: "Hemoglobin",
          result: "Low",
          value: "9.8 g/dl",
        },
        {
          date: "2024-01-08",
          test: "Thyroid Function",
          result: "Normal",
          value: "TSH: 2.5 mIU/L",
        },
      ],
    },
    {
      id: "3",
      name: "Amit Singh",
      age: 28,
      gender: "Male",
      phone: "+91 9876543212",
      email: "amit.singh@email.com",
      address: "789 Brigade Road, Bangalore, KA 560001",
      lastVisit: "2024-01-14",
      nextAppointment: "2024-01-21",
      totalVisits: 3,
      chiefComplaints: ["Stress", "Anxiety", "Sleep issues"],
      currentTreatment: "Stress Management & Shirodhara",
      medications: ["Brahmi Ghrita", "Ashwagandha"],
      allergies: ["Shellfish"],
      vitalSigns: {
        bp: "125/75",
        pulse: "88",
        weight: "72 kg",
        height: "5'10\"",
      },
      medicalHistory: ["Anxiety disorder"],
      treatmentHistory: [
        {
          date: "2024-01-14",
          treatment: "Shirodhara",
          doctor: "Dr. Priya",
          notes: "Excellent relaxation response",
        },
        {
          date: "2024-01-07",
          treatment: "Consultation",
          doctor: "Dr. Priya",
          notes: "Lifestyle counseling provided",
        },
      ],
      labReports: [
        {
          date: "2024-01-05",
          test: "Cortisol Level",
          result: "Elevated",
          value: "25 μg/dl",
        },
      ],
    },
  ];

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.chiefComplaints.some((complaint) =>
        complaint.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesGender =
      genderFilter === "all" || patient.gender.toLowerCase() === genderFilter;
    const matchesAge =
      ageFilter === "all" ||
      (ageFilter === "young" && patient.age < 30) ||
      (ageFilter === "middle" && patient.age >= 30 && patient.age < 60) ||
      (ageFilter === "senior" && patient.age >= 60);

    return matchesSearch && matchesGender && matchesAge;
  });

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
    <DashboardLayout title="Doctor Patients" allowedRole={Role.DOCTOR}>
      <GlobalSidebar
        links={sidebarLinks}
        user={{
          name:
            user?.name || `${user?.firstName} ${user?.lastName}` || "Doctor",
          avatarUrl: (user as any)?.profilePicture || "/avatar.png",
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">My Patients</h1>
            <div className="text-sm text-gray-600">
              Total: {patients.length} patients
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Patients
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patients.length}</div>
                <p className="text-xs text-muted-foreground">Under your care</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">12</div>
                <p className="text-xs text-muted-foreground">
                  Appointments scheduled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Follow-ups
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">5</div>
                <p className="text-xs text-muted-foreground">Due this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Recovery Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">92%</div>
                <p className="text-xs text-muted-foreground">
                  Patient improvement
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search by name or condition..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={ageFilter} onValueChange={setAgeFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by age" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ages</SelectItem>
                    <SelectItem value="young">Under 30</SelectItem>
                    <SelectItem value="middle">30-60</SelectItem>
                    <SelectItem value="senior">Over 60</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Patients List */}
          <div className="grid gap-4">
            {filteredPatients.map((patient) => (
              <Card
                key={patient.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-800 font-semibold text-xl">
                          {patient.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {patient.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            {patient.age} years • {patient.gender}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {patient.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {patient.email}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {patient.chiefComplaints
                            .slice(0, 2)
                            .map((complaint, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {complaint}
                              </Badge>
                            ))}
                          {patient.chiefComplaints.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{patient.chiefComplaints.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="text-sm">
                        <div>
                          <strong>Last Visit:</strong>{" "}
                          {new Date(patient.lastVisit).toLocaleDateString()}
                        </div>
                        <div>
                          <strong>Next:</strong>{" "}
                          {new Date(
                            patient.nextAppointment
                          ).toLocaleDateString()}
                        </div>
                        <div>
                          <strong>Total Visits:</strong> {patient.totalVisits}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Drawer>
                          <DrawerTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPatient(patient)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View EHR
                            </Button>
                          </DrawerTrigger>
                          <DrawerContent className="max-w-4xl mx-auto">
                            <DrawerHeader>
                              <DrawerTitle>
                                {patient.name} - Electronic Health Record
                              </DrawerTitle>
                            </DrawerHeader>
                            {selectedPatient && (
                              <div className="px-6 pb-6">
                                <Tabs
                                  defaultValue="overview"
                                  className="space-y-4"
                                >
                                  <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="overview">
                                      Overview
                                    </TabsTrigger>
                                    <TabsTrigger value="history">
                                      Treatment History
                                    </TabsTrigger>
                                    <TabsTrigger value="reports">
                                      Lab Reports
                                    </TabsTrigger>
                                    <TabsTrigger value="medications">
                                      Medications
                                    </TabsTrigger>
                                  </TabsList>

                                  <TabsContent value="overview">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-lg">
                                            Patient Information
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                          <div>
                                            <strong>Age:</strong>{" "}
                                            {selectedPatient.age} years
                                          </div>
                                          <div>
                                            <strong>Gender:</strong>{" "}
                                            {selectedPatient.gender}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            <span>
                                              {selectedPatient.address}
                                            </span>
                                          </div>
                                          <div>
                                            <strong>Total Visits:</strong>{" "}
                                            {selectedPatient.totalVisits}
                                          </div>
                                          <div>
                                            <strong>Current Treatment:</strong>{" "}
                                            {selectedPatient.currentTreatment}
                                          </div>
                                        </CardContent>
                                      </Card>

                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-lg">
                                            Vital Signs
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                              <Heart className="w-4 h-4 text-red-500" />
                                              <span>
                                                BP:{" "}
                                                {selectedPatient.vitalSigns.bp}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Activity className="w-4 h-4 text-blue-500" />
                                              <span>
                                                Pulse:{" "}
                                                {
                                                  selectedPatient.vitalSigns
                                                    .pulse
                                                }
                                              </span>
                                            </div>
                                            <div>
                                              Weight:{" "}
                                              {
                                                selectedPatient.vitalSigns
                                                  .weight
                                              }
                                            </div>
                                            <div>
                                              Height:{" "}
                                              {
                                                selectedPatient.vitalSigns
                                                  .height
                                              }
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>

                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-lg">
                                            Chief Complaints
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="space-y-2">
                                            {selectedPatient.chiefComplaints.map(
                                              (
                                                complaint: string,
                                                index: number
                                              ) => (
                                                <div
                                                  key={index}
                                                  className="flex items-center gap-2"
                                                >
                                                  <AlertCircle className="w-4 h-4 text-orange-500" />
                                                  <span className="text-sm">
                                                    {complaint}
                                                  </span>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </CardContent>
                                      </Card>

                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-lg">
                                            Medical History
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="space-y-2">
                                            {selectedPatient.medicalHistory.map(
                                              (
                                                condition: string,
                                                index: number
                                              ) => (
                                                <div
                                                  key={index}
                                                  className="flex items-center gap-2"
                                                >
                                                  <FileText className="w-4 h-4 text-purple-500" />
                                                  <span className="text-sm">
                                                    {condition}
                                                  </span>
                                                </div>
                                              )
                                            )}
                                            <div className="mt-3">
                                              <strong>Allergies:</strong>{" "}
                                              {selectedPatient.allergies.join(
                                                ", "
                                              )}
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  </TabsContent>

                                  <TabsContent value="history">
                                    <div className="space-y-4">
                                      {selectedPatient.treatmentHistory.map(
                                        (treatment: any, index: number) => (
                                          <Card key={index}>
                                            <CardContent className="p-4">
                                              <div className="flex justify-between items-start">
                                                <div>
                                                  <h4 className="font-semibold">
                                                    {treatment.treatment}
                                                  </h4>
                                                  <p className="text-sm text-gray-600">
                                                    by {treatment.doctor}
                                                  </p>
                                                  <p className="text-sm mt-2">
                                                    {treatment.notes}
                                                  </p>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                  {new Date(
                                                    treatment.date
                                                  ).toLocaleDateString()}
                                                </div>
                                              </div>
                                            </CardContent>
                                          </Card>
                                        )
                                      )}
                                    </div>
                                  </TabsContent>

                                  <TabsContent value="reports">
                                    <div className="space-y-4">
                                      {selectedPatient.labReports.map(
                                        (report: any, index: number) => (
                                          <Card key={index}>
                                            <CardContent className="p-4">
                                              <div className="flex justify-between items-center">
                                                <div>
                                                  <h4 className="font-semibold">
                                                    {report.test}
                                                  </h4>
                                                  <p className="text-sm">
                                                    Value: {report.value}
                                                  </p>
                                                </div>
                                                <div className="text-right">
                                                  <Badge
                                                    className={
                                                      report.result === "Normal"
                                                        ? "bg-green-100 text-green-800"
                                                        : report.result ===
                                                          "Elevated"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-red-100 text-red-800"
                                                    }
                                                  >
                                                    {report.result}
                                                  </Badge>
                                                  <p className="text-sm text-gray-500 mt-1">
                                                    {new Date(
                                                      report.date
                                                    ).toLocaleDateString()}
                                                  </p>
                                                </div>
                                              </div>
                                            </CardContent>
                                          </Card>
                                        )
                                      )}
                                    </div>
                                  </TabsContent>

                                  <TabsContent value="medications">
                                    <div className="space-y-4">
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-lg flex items-center gap-2">
                                            <Pill className="w-5 h-5" />
                                            Current Medications
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="space-y-3">
                                            {selectedPatient.medications.map(
                                              (
                                                medication: any,
                                                index: number
                                              ) => (
                                                <div
                                                  key={index}
                                                  className="flex items-center justify-between p-3 border rounded-lg"
                                                >
                                                  <div className="flex items-center gap-3">
                                                    <Pill className="w-4 h-4 text-blue-600" />
                                                    <span>{medication}</span>
                                                  </div>
                                                  <Badge variant="outline">
                                                    Active
                                                  </Badge>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  </TabsContent>
                                </Tabs>
                              </div>
                            )}
                          </DrawerContent>
                        </Drawer>

                        <Button size="sm" className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPatients.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No patients found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search criteria
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </GlobalSidebar>
    </DashboardLayout>
  );
}
