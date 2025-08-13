"use client";

import React, { useState } from "react";
import { Role } from "@/types/auth.types";
import { Permission } from "@/types/rbac.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import GlobalSidebar from "@/components/global/GlobalSidebar/GlobalSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRoutesByRole } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import {
  usePatients,
  usePatientMedicalHistory,
  usePatientVitalSigns,
  usePatientLabResults,
  useSearchPatients,
  useAddPatientMedicalHistory,
  useAddPatientVitalSigns,
  useAddPatientLabResult,
} from "@/hooks/usePatients";
import {
  useCurrentClinicId,
  useClinicContext,
  useClinicPatients,
} from "@/hooks/useClinic";
import {
  usePatientMedicalRecords,
  useCreateMedicalRecord,
  useUpdateMedicalRecord,
  useDeleteMedicalRecord,
  useMedicalRecordTemplates,
} from "@/hooks/useMedicalRecords";
import { usePatientPermissions, useRBAC } from "@/hooks/useRBAC";
import {
  ProtectedComponent,
  PatientProtectedComponent,
  MedicalRecordsRouteProtection,
} from "@/components/rbac";
import { useMedicalRecordsStore, useMedicalRecordsActions } from "@/stores";
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
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Download,
  Upload,
  Heart,
  Brain,
  TestTube,
  Stethoscope,
  Clipboard,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Database,
  Shield,
  Zap,
  Bell,
} from "lucide-react";

export default function EHRSystem() {
  const { session } = useAuth();
  const user = session?.user;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("overview");

  // Determine user role and setup appropriate sidebar
  const userRole = user?.role || Role.DOCTOR;

  // RBAC permissions
  const patientPermissions = usePatientPermissions();
  const rbac = useRBAC();

  // Clinic context
  const { clinicId, hasAccess } = useClinicContext();

  // Zustand store actions
  const medicalRecordsActions = useMedicalRecordsActions();

  // Fetch patients data with proper permissions using clinic-aware hook
  const {
    data: patients,
    isPending: patientsLoading,
    error: patientsError,
    refetch: refetchPatients,
  } = useClinicPatients({
    search: searchTerm,
    limit: 50,
  });

  // Fetch medical records for selected patient
  const { data: medicalRecords, isPending: recordsLoading } =
    usePatientMedicalRecords(clinicId || "", selectedPatientId || "", {
      enabled:
        !!clinicId &&
        !!selectedPatientId &&
        patientPermissions.canViewMedicalRecords,
    });

  // Fetch vital signs for selected patient
  const { data: vitalSigns, isPending: vitalsLoading } = usePatientVitalSigns(
    selectedPatientId || "",
    {
      limit: 10,
      enabled: !!selectedPatientId && patientPermissions.canViewMedicalRecords,
    }
  );

  // Fetch lab results for selected patient
  const { data: labResults, isPending: labsLoading } = usePatientLabResults(
    selectedPatientId || "",
    {
      limit: 10,
      enabled: !!selectedPatientId && patientPermissions.canViewMedicalRecords,
    }
  );

  // Fetch medical record templates
  const { data: templates } = useMedicalRecordTemplates();

  // Mutation hooks
  const createMedicalRecordMutation = useCreateMedicalRecord();
  const addVitalSignsMutation = useAddPatientVitalSigns();
  const addLabResultMutation = useAddPatientLabResult();
  const searchPatientsMutation = useSearchPatients();

  // Calculate EHR stats from real data
  const ehrStats = {
    totalPatients: patients?.length || 0,
    activeRecords: medicalRecords?.length || 0,
    recordsToday:
      medicalRecords?.filter((record) => {
        const today = new Date().toDateString();
        const recordDate = new Date(record.createdAt).toDateString();
        return today === recordDate;
      }).length || 0,
    criticalAlerts:
      labResults?.filter((lab) => lab.status === "CRITICAL").length || 0,
  };

  // Action handlers
  const handleSearchPatients = async (query: string) => {
    if (!query.trim()) return;
    try {
      await searchPatientsMutation.mutateAsync({
        query,
        filters: { limit: 20 },
      });
    } catch (error) {
      console.error("Failed to search patients:", error);
    }
  };

  const handleCreateMedicalRecord = async (recordData: any) => {
    if (!selectedPatientId || !patientPermissions.canCreateMedicalRecords)
      return;
    try {
      await createMedicalRecordMutation.mutateAsync({
        patientId: selectedPatientId,
        recordData,
      });
      medicalRecordsActions.addRecord(recordData);
    } catch (error) {
      console.error("Failed to create medical record:", error);
    }
  };

  const handleAddVitalSigns = async (vitalsData: any) => {
    if (!selectedPatientId || !patientPermissions.canUpdateMedicalRecords)
      return;
    try {
      await addVitalSignsMutation.mutateAsync({
        patientId: selectedPatientId,
        vitalsData: {
          ...vitalsData,
          recordedAt: new Date().toISOString(),
          recordedBy: user?.id || "",
        },
      });
    } catch (error) {
      console.error("Failed to add vital signs:", error);
    }
  };

  const handleAddLabResult = async (labData: any) => {
    if (!selectedPatientId || !patientPermissions.canUpdateMedicalRecords)
      return;
    try {
      await addLabResultMutation.mutateAsync({
        patientId: selectedPatientId,
        labData: {
          ...labData,
          reportedDate: new Date().toISOString(),
          doctorId: user?.id,
        },
      });
    } catch (error) {
      console.error("Failed to add lab result:", error);
    }
  };

  // Transform patients data for display
  const recentPatients =
    patients?.slice(0, 10).map((patient) => ({
      id: patient.id,
      name:
        `${patient.user?.firstName || ""} ${
          patient.user?.lastName || ""
        }`.trim() ||
        patient.user?.name ||
        "Unknown",
      age: patient.dateOfBirth
        ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
        : "N/A",
      lastVisit: patient.lastVisit || "N/A",
      condition: patient.primaryCondition || "General",
      status: patient.status || "Active",
      nextAppointment: patient.nextAppointment || "Not scheduled",
    })) || [];

  const criticalAlerts = [
    {
      id: "A001",
      patient: "Amit Singh",
      type: "Lab Result",
      message: "HbA1c levels elevated (9.2%) - Requires immediate attention",
      severity: "High",
      timestamp: "2 hours ago",
    },
    {
      id: "A002",
      patient: "Maya Patel",
      type: "Vitals",
      message: "Blood pressure reading 180/110 - Emergency range",
      severity: "Critical",
      timestamp: "4 hours ago",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "stable":
        return "bg-green-100 text-green-800";
      case "improving":
        return "bg-blue-100 text-blue-800";
      case "critical":
        return "bg-red-100 text-red-800";
      case "monitoring":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "low":
        return "bg-yellow-100 text-yellow-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "high":
        return "bg-red-100 text-red-800";
      case "critical":
        return "bg-red-100 text-red-800 animate-pulse";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const sidebarLinks = getRoutesByRole(userRole).map((route) => ({
    ...route,
    href: route.path,
    icon: route.path.includes("dashboard") ? (
      <Activity className="w-5 h-5" />
    ) : route.path.includes("appointments") ? (
      <Calendar className="w-5 h-5" />
    ) : route.path.includes("patients") ? (
      <Users className="w-5 h-5" />
    ) : route.path.includes("medical-records") ? (
      <FileText className="w-5 h-5" />
    ) : route.path.includes("prescriptions") ? (
      <Pill className="w-5 h-5" />
    ) : route.path.includes("profile") ? (
      <User className="w-5 h-5" />
    ) : route.path.includes("clinics") ? (
      <Building2 className="w-5 h-5" />
    ) : route.path.includes("users") ? (
      <Users className="w-5 h-5" />
    ) : route.path.includes("staff") ? (
      <Users className="w-5 h-5" />
    ) : route.path.includes("schedule") ? (
      <Calendar className="w-5 h-5" />
    ) : route.path.includes("settings") ? (
      <Settings className="w-5 h-5" />
    ) : (
      <Activity className="w-5 h-5" />
    ),
  }));

  // Add EHR link to sidebar
  sidebarLinks.push({
    label: "EHR System",
    href: "/ehr",
    icon: <Database className="w-5 h-5" />,
  });

  sidebarLinks.push({
    label: "Logout",
    href: "/auth/login",
    icon: <LogOut className="w-5 h-5" />,
  });

  // Transform critical alerts from real lab data
  const realCriticalAlerts =
    labResults
      ?.filter((lab) => lab.status === "CRITICAL")
      .map((lab) => ({
        id: lab.id,
        patient: lab.patientName || "Unknown Patient",
        type: "Lab Result",
        message: `${lab.testName}: ${lab.result} ${lab.unit || ""} - ${
          lab.notes || "Requires attention"
        }`,
        severity: "High",
        timestamp: new Date(lab.reportedDate).toLocaleString(),
      })) || [];

  // Show loading state
  if (patientsLoading) {
    return (
      <DashboardLayout
        title="Electronic Health Records"
        requiredPermission={Permission.VIEW_MEDICAL_RECORDS}
        showPermissionWarnings={true}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading EHR system...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (patientsError) {
    return (
      <DashboardLayout
        title="Electronic Health Records"
        requiredPermission={Permission.VIEW_MEDICAL_RECORDS}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600">
              Error loading EHR data: {patientsError.message}
            </p>
            <Button onClick={() => refetchPatients()} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <MedicalRecordsRouteProtection>
      <DashboardLayout
        title="Electronic Health Records"
        requiredPermission={Permission.VIEW_MEDICAL_RECORDS}
        showPermissionWarnings={true}
        customUnauthorizedMessage="You need medical records access to view the EHR system."
      >
        <GlobalSidebar
          links={sidebarLinks}
          user={{
            name:
              user?.name ||
              `${user?.firstName} ${user?.lastName}` ||
              "Healthcare Professional",
            avatarUrl: user?.profilePicture,
          }}
        >
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  Electronic Health Records
                </h1>
                <p className="text-gray-600">
                  Comprehensive patient data management system
                </p>
              </div>
              <div className="flex gap-2">
                <ProtectedComponent
                  permission={Permission.IMPORT_MEDICAL_RECORDS}
                >
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={createMedicalRecordMutation.isPending}
                  >
                    <Upload className="w-4 h-4" />
                    {createMedicalRecordMutation.isPending
                      ? "Importing..."
                      : "Import Records"}
                  </Button>
                </ProtectedComponent>

                <ProtectedComponent
                  permission={Permission.CREATE_MEDICAL_RECORDS}
                >
                  <Button
                    className="flex items-center gap-2"
                    onClick={() => handleCreateMedicalRecord({})}
                    disabled={createMedicalRecordMutation.isPending}
                  >
                    <Plus className="w-4 h-4" />
                    {createMedicalRecordMutation.isPending
                      ? "Creating..."
                      : "New Patient Record"}
                  </Button>
                </ProtectedComponent>
              </div>
            </div>

            {/* EHR Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Patients
                  </CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {ehrStats.totalPatients.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">In EHR system</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Records
                  </CardTitle>
                  <FileText className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {ehrStats.activeRecords.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Records Updated Today
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {ehrStats.recordsToday}
                  </div>
                  <p className="text-xs text-muted-foreground">New updates</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Critical Alerts
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {ehrStats.criticalAlerts}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Require attention
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="patients">Patient Records</TabsTrigger>
                <TabsTrigger value="alerts">Critical Alerts</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Patient Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Recent Patient Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentPatients.map((patient) => (
                          <div
                            key={patient.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold">
                                  {patient.name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  ID: {patient.id} • Age: {patient.age}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Last visit: {patient.lastVisit}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(patient.status)}>
                                {patient.status}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {patient.condition}
                              </p>
                            </div>
                          </div>
                        ))}

                        <Button variant="outline" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          View All Patients
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* System Health */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        System Health & Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Database Connection</span>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-600">
                              Online
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span>Backup Status</span>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-600">
                              Up to date
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span>System Load</span>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-sm text-yellow-600">
                              Moderate (65%)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span>Security Status</span>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-600">
                              Secure
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <p className="text-sm text-gray-600">
                            <strong>Last System Update:</strong> January 10,
                            2024
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Data Integrity Check:</strong> Passed
                            (January 15, 2024)
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <PatientProtectedComponent action="create">
                        <Button
                          variant="outline"
                          className="h-20 flex flex-col items-center justify-center gap-2"
                          onClick={() => handleCreateMedicalRecord({})}
                        >
                          <Plus className="w-6 h-6" />
                          <span className="text-sm">New Patient</span>
                        </Button>
                      </PatientProtectedComponent>

                      <PatientProtectedComponent action="view">
                        <Button
                          variant="outline"
                          className="h-20 flex flex-col items-center justify-center gap-2"
                          onClick={() => handleSearchPatients(searchTerm)}
                          disabled={searchPatientsMutation.isPending}
                        >
                          <Search className="w-6 h-6" />
                          <span className="text-sm">
                            {searchPatientsMutation.isPending
                              ? "Searching..."
                              : "Search Records"}
                          </span>
                        </Button>
                      </PatientProtectedComponent>

                      <ProtectedComponent
                        permission={Permission.IMPORT_MEDICAL_RECORDS}
                      >
                        <Button
                          variant="outline"
                          className="h-20 flex flex-col items-center justify-center gap-2"
                          disabled={createMedicalRecordMutation.isPending}
                        >
                          <Upload className="w-6 h-6" />
                          <span className="text-sm">Import Data</span>
                        </Button>
                      </ProtectedComponent>

                      <ProtectedComponent
                        permission={Permission.EXPORT_MEDICAL_RECORDS}
                      >
                        <Button
                          variant="outline"
                          className="h-20 flex flex-col items-center justify-center gap-2"
                        >
                          <Download className="w-6 h-6" />
                          <span className="text-sm">Export Reports</span>
                        </Button>
                      </ProtectedComponent>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="patients">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Patient Records Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <Input
                            placeholder="Search by patient name, ID, or condition..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Button variant="outline">
                          <Filter className="w-4 h-4 mr-2" />
                          Filter
                        </Button>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Patient
                        </Button>
                      </div>

                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium">
                                Patient
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium">
                                ID
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium">
                                Age
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium">
                                Condition
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium">
                                Status
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium">
                                Last Visit
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentPatients.map((patient) => (
                              <tr
                                key={patient.id}
                                className="border-t hover:bg-gray-50"
                              >
                                <td className="px-4 py-3 font-medium">
                                  {patient.name}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {patient.id}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {patient.age}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {patient.condition}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge
                                    className={getStatusColor(patient.status)}
                                  >
                                    {patient.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {patient.lastVisit}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-2">
                                    <PatientProtectedComponent action="view">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          setSelectedPatientId(patient.id)
                                        }
                                      >
                                        <Eye className="w-3 h-3" />
                                      </Button>
                                    </PatientProtectedComponent>

                                    <PatientProtectedComponent action="update">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedPatientId(patient.id);
                                          setActiveTab("records");
                                        }}
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                    </PatientProtectedComponent>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Showing 3 of 1,248 patients</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Previous
                          </Button>
                          <Button variant="outline" size="sm">
                            Next
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alerts">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Critical Alerts & Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {criticalAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="p-4 border-l-4 border-red-500 bg-red-50 rounded"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-red-800">
                                  {alert.patient}
                                </h4>
                                <Badge
                                  className={getSeverityColor(alert.severity)}
                                >
                                  {alert.severity}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mb-1">
                                <Clipboard className="w-4 h-4 text-red-600" />
                                <span className="text-sm font-medium text-red-700">
                                  {alert.type}
                                </span>
                              </div>
                              <p className="text-sm text-red-700">
                                {alert.message}
                              </p>
                              <p className="text-xs text-red-600 mt-2">
                                {alert.timestamp}
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <PatientProtectedComponent action="view">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setSelectedPatientId(alert.patientId)
                                  }
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                              </PatientProtectedComponent>

                              <ProtectedComponent
                                permission={Permission.MANAGE_ALERTS}
                              >
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    // Handle resolve alert
                                    console.log("Resolving alert:", alert.id);
                                  }}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Resolve
                                </Button>
                              </ProtectedComponent>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium">
                            All other patients are stable
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          No additional critical alerts at this time
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        EHR Analytics Dashboard
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-2">
                            Patient Growth
                          </h4>
                          <div className="text-2xl font-bold text-blue-600">
                            +15%
                          </div>
                          <p className="text-sm text-blue-600">
                            This month vs last month
                          </p>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="font-semibold text-green-800 mb-2">
                            Record Completeness
                          </h4>
                          <div className="text-2xl font-bold text-green-600">
                            94.2%
                          </div>
                          <p className="text-sm text-green-600">
                            Complete patient records
                          </p>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-lg">
                          <h4 className="font-semibold text-purple-800 mb-2">
                            System Uptime
                          </h4>
                          <div className="text-2xl font-bold text-purple-600">
                            99.9%
                          </div>
                          <p className="text-sm text-purple-600">
                            Last 30 days
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Usage Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center p-8 text-gray-500">
                        <TrendingUp className="w-16 h-16 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          Advanced Analytics Coming Soon
                        </h3>
                        <p>
                          Detailed usage statistics, patient trends, and
                          performance metrics will be available here.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      EHR System Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-4">Data Management</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Button
                            variant="outline"
                            className="h-16 flex flex-col items-center justify-center gap-2"
                          >
                            <Database className="w-6 h-6" />
                            <span className="text-sm">Backup Settings</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-16 flex flex-col items-center justify-center gap-2"
                          >
                            <Shield className="w-6 h-6" />
                            <span className="text-sm">Security Settings</span>
                          </Button>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-4">
                          System Configuration
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Button
                            variant="outline"
                            className="h-16 flex flex-col items-center justify-center gap-2"
                          >
                            <Zap className="w-6 h-6" />
                            <span className="text-sm">Performance</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-16 flex flex-col items-center justify-center gap-2"
                          >
                            <Bell className="w-6 h-6" />
                            <span className="text-sm">Alert Settings</span>
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold mb-2">
                          System Information
                        </h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>EHR System Version:</span>
                            <span>v2.4.1</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Database Version:</span>
                            <span>PostgreSQL 15.2</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Last System Update:</span>
                            <span>January 10, 2024</span>
                          </div>
                          <div className="flex justify-between">
                            <span>HIPAA Compliance:</span>
                            <span className="text-green-600">✓ Certified</span>
                          </div>
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
    </MedicalRecordsRouteProtection>
  );
}
