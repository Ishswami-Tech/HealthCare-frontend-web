"use client";

import { useState } from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Sidebar from "@/components/global/GlobalSidebar/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRoutesByRole } from "@/lib/config/routes";
import { useAuth } from "@/hooks/auth/useAuth";
import { theme } from "@/lib/utils/theme-utils";
import { LoadingSpinner } from "@/components/ui/loading";
import {
  Activity,
  Calendar,
  FileText,
  Pill,
  User,
  LogOut,
  Upload,
  Download,
  Eye,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  Heart,
  Thermometer,
  Scale,
  Activity as Pulse,
  TrendingUp,
  TrendingDown,
  Minus,
  Leaf,
  TestTube,
  File,
  Image,
} from "lucide-react";

export default function PatientMedicalRecords() {
  const { session, isLoading: authLoading } = useAuth();
  const user = session?.user;
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Show loading only if auth is actually loading (not just if user is null initially)
  // Don't block content if user data is being fetched in background
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner
          size="lg"
          color="primary"
          text="Loading medical records..."
        />
      </div>
    );
  }

  // If not loading but no user, redirect will be handled by layout
  if (!user) {
    return null;
  }

  // Mock medical records data
  const medicalHistory = [
    {
      id: "1",
      date: "2024-01-15",
      type: "Consultation",
      doctor: "Dr. Priya Sharma",
      diagnosis: "Vata-Pitta imbalance with chronic stress",
      treatment: "Panchakarma therapy recommended",
      notes:
        "Patient shows signs of elevated Vata dosha. Recommended lifestyle changes and Shirodhara sessions.",
      status: "Completed",
    },
    {
      id: "2",
      date: "2024-01-08",
      type: "Therapy Session",
      doctor: "Dr. Priya Sharma",
      diagnosis: "Stress-induced insomnia",
      treatment: "Shirodhara with Brahmi oil",
      notes:
        "Patient responded well to therapy. Improved sleep quality reported.",
      status: "Completed",
    },
    {
      id: "3",
      date: "2023-12-20",
      type: "Nadi Pariksha",
      doctor: "Dr. Amit Singh",
      diagnosis: "Constitutional analysis - Vata-Pitta Prakriti",
      treatment: "Personalized diet and lifestyle plan",
      notes:
        "Initial assessment reveals strong Vata tendencies with Pitta secondary. Recommended cooling foods.",
      status: "Completed",
    },
  ];

  const prescriptions = [
    {
      id: "1",
      date: "2024-01-15",
      doctor: "Dr. Priya Sharma",
      medications: [
        {
          name: "Triphala Churna",
          dosage: "1 tsp twice daily with warm water",
          duration: "30 days",
        },
        {
          name: "Ashwagandha Capsules",
          dosage: "2 capsules at bedtime",
          duration: "60 days",
        },
        {
          name: "Brahmi Ghrita",
          dosage: "5 drops in each nostril morning",
          duration: "21 days",
        },
      ],
      instructions:
        "Take medicines 30 minutes before meals. Avoid cold foods and drinks.",
      status: "Active",
    },
    {
      id: "2",
      date: "2024-01-08",
      doctor: "Dr. Priya Sharma",
      medications: [
        {
          name: "Saraswatarishta",
          dosage: "15ml twice daily after meals",
          duration: "45 days",
        },
        {
          name: "Jatamansi Churna",
          dosage: "1/2 tsp with honey at bedtime",
          duration: "30 days",
        },
      ],
      instructions:
        "Continue meditation and yoga practice. Follow prescribed sleep schedule.",
      status: "Completed",
    },
  ];

  const labReports = [
    {
      id: "1",
      date: "2024-01-10",
      type: "Blood Test",
      testName: "Complete Blood Count",
      results: [
        {
          parameter: "Hemoglobin",
          value: "13.2 g/dl",
          normalRange: "12.0-16.0",
          status: "Normal",
        },
        {
          parameter: "WBC Count",
          value: "7,200 cells/mcL",
          normalRange: "4,000-11,000",
          status: "Normal",
        },
        {
          parameter: "Platelet Count",
          value: "2.8 lakhs/mcL",
          normalRange: "1.5-4.5 lakhs",
          status: "Normal",
        },
      ],
      doctor: "Dr. Priya Sharma",
      status: "Normal",
    },
    {
      id: "2",
      date: "2024-01-05",
      type: "Lipid Profile",
      testName: "Cholesterol Test",
      results: [
        {
          parameter: "Total Cholesterol",
          value: "195 mg/dl",
          normalRange: "<200",
          status: "Normal",
        },
        {
          parameter: "LDL",
          value: "125 mg/dl",
          normalRange: "<100",
          status: "High",
        },
        {
          parameter: "HDL",
          value: "48 mg/dl",
          normalRange: ">40",
          status: "Normal",
        },
        {
          parameter: "Triglycerides",
          value: "140 mg/dl",
          normalRange: "<150",
          status: "Normal",
        },
      ],
      doctor: "Dr. Priya Sharma",
      status: "Attention Required",
    },
  ];

  const vitalSigns = [
    {
      date: "2024-01-15",
      bp: "128/82",
      hr: "72",
      temp: "98.6",
      weight: "70",
      height: "175",
      bmi: "22.9",
    },
    {
      date: "2024-01-08",
      bp: "132/85",
      hr: "75",
      temp: "98.4",
      weight: "70.5",
      height: "175",
      bmi: "23.0",
    },
    {
      date: "2024-01-01",
      bp: "135/88",
      hr: "78",
      temp: "98.8",
      weight: "71",
      height: "175",
      bmi: "23.2",
    },
    {
      date: "2023-12-20",
      bp: "138/90",
      hr: "80",
      temp: "98.6",
      weight: "71.5",
      height: "175",
      bmi: "23.3",
    },
  ];

  const allergies = [
    {
      allergen: "Tree Nuts",
      severity: "Moderate",
      reaction: "Skin rash, itching",
      discovered: "2020-03-15",
    },
    {
      allergen: "Shellfish",
      severity: "Mild",
      reaction: "Digestive discomfort",
      discovered: "2019-08-22",
    },
    {
      allergen: "Dust Mites",
      severity: "Mild",
      reaction: "Respiratory symptoms",
      discovered: "2018-11-10",
    },
  ];

  const dietaryPreferences = {
    type: "Vegetarian",
    restrictions: ["No onion", "No garlic", "Limited spicy food"],
    preferences: ["Warm foods", "Cooked vegetables", "Herbal teas"],
    constitution: "Vata-Pitta balancing diet recommended",
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "normal":
        return theme.badges.green;
      case "high":
      case "attention required":
        return theme.badges.yellow;
      case "critical":
      case "abnormal":
        return theme.badges.red;
      case "active":
        return theme.badges.blue;
      case "completed":
        return theme.badges.gray;
      default:
        return theme.badges.gray;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "mild":
        return theme.badges.yellow;
      case "moderate":
        return theme.badges.orange;
      case "severe":
        return theme.badges.red;
      default:
        return theme.badges.gray;
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous)
      return <TrendingUp className={`w-4 h-4 ${theme.iconColors.red}`} />;
    if (current < previous)
      return <TrendingDown className={`w-4 h-4 ${theme.iconColors.green}`} />;
    return <Minus className={`w-4 h-4 ${theme.iconColors.gray}`} />;
  };

  const sidebarLinks = getRoutesByRole(Role.PATIENT).map((route) => ({
    ...route,
    href: route.path,
    icon: route.path.includes("dashboard") ? (
      <Activity className="w-5 h-5" />
    ) : route.path.includes("appointments") ? (
      <Calendar className="w-5 h-5" />
    ) : route.path.includes("medical-records") ? (
      <FileText className="w-5 h-5" />
    ) : route.path.includes("prescriptions") ? (
      <Pill className="w-5 h-5" />
    ) : route.path.includes("profile") ? (
      <User className="w-5 h-5" />
    ) : (
      <Activity className="w-5 h-5" />
    ),
  }));

  sidebarLinks.push({
    label: "Logout",
    href: "/(auth)/auth/login",
    path: "/(auth)/auth/login",
    icon: <LogOut className="w-5 h-5" />,
  });

  return (
    <DashboardLayout title="Medical Records" allowedRole={Role.PATIENT}>
      <Sidebar
        links={sidebarLinks}
        user={{
          name:
            user?.name || `${user?.firstName} ${user?.lastName}` || "Patient",
          avatarUrl: (user as any)?.profilePicture || "/avatar.png",
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Medical Records</h1>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Report
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Records
              </Button>
            </div>
          </div>

          <Tabs defaultValue="history" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              <TabsTrigger value="reports">Lab Reports</TabsTrigger>
              <TabsTrigger value="vitals">Vitals</TabsTrigger>
              <TabsTrigger value="allergies">Allergies</TabsTrigger>
              <TabsTrigger value="diet">Diet Plan</TabsTrigger>
            </TabsList>

            <TabsContent value="history">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Medical History Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="relative flex-1">
                          <Search
                            className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${theme.textColors.muted}`}
                          />
                          <Input
                            placeholder="Search medical history..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Button variant="outline">
                          <Filter className="w-4 h-4 mr-2" />
                          Filter
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {medicalHistory.map((record) => (
                          <div
                            key={record.id}
                            className={`border rounded-lg p-4 ${theme.borders.primary} hover:bg-gray-50 dark:hover:bg-gray-800/50`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold">
                                    {record.type}
                                  </h3>
                                  <Badge
                                    className={getStatusColor(record.status)}
                                  >
                                    {record.status}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p>
                                      <strong>Date:</strong>{" "}
                                      {new Date(
                                        record.date
                                      ).toLocaleDateString()}
                                    </p>
                                    <p>
                                      <strong>Doctor:</strong> {record.doctor}
                                    </p>
                                  </div>
                                  <div>
                                    <p>
                                      <strong>Diagnosis:</strong>{" "}
                                      {record.diagnosis}
                                    </p>
                                    <p>
                                      <strong>Treatment:</strong>{" "}
                                      {record.treatment}
                                    </p>
                                  </div>
                                </div>
                                {record.notes && (
                                  <div
                                    className={`mt-3 p-3 ${theme.containers.featureBlue} rounded-lg`}
                                  >
                                    <p
                                      className={`text-sm ${theme.textColors.heading}`}
                                    >
                                      <strong>Notes:</strong> {record.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="prescriptions">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="w-5 h-5" />
                      Ayurvedic Prescriptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {prescriptions.map((prescription) => (
                        <div
                          key={prescription.id}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold">
                                Prescription -{" "}
                                {new Date(
                                  prescription.date
                                ).toLocaleDateString()}
                              </h3>
                              <p
                                className={`text-sm ${theme.textColors.secondary}`}
                              >
                                Prescribed by {prescription.doctor}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={getStatusColor(prescription.status)}
                              >
                                {prescription.status}
                              </Badge>
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-medium">Medications:</h4>
                            {prescription.medications.map((med, index) => (
                              <div
                                key={index}
                                className={`flex items-center justify-between p-3 ${theme.containers.featureGreen} rounded-lg`}
                              >
                                <div className="flex items-center gap-3">
                                  <Leaf
                                    className={`w-4 h-4 ${theme.iconColors.green}`}
                                  />
                                  <div>
                                    <h5
                                      className={`font-medium ${theme.textColors.success}`}
                                    >
                                      {med.name}
                                    </h5>
                                    <p
                                      className={`text-sm ${theme.textColors.success}`}
                                    >
                                      {med.dosage}
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={theme.badges.green}
                                >
                                  {med.duration}
                                </Badge>
                              </div>
                            ))}
                          </div>

                          {prescription.instructions && (
                            <div
                              className={`mt-4 p-3 ${theme.containers.featureBlue} rounded-lg`}
                            >
                              <h4
                                className={`font-medium ${theme.textColors.info} mb-1`}
                              >
                                Instructions:
                              </h4>
                              <p className={`text-sm ${theme.textColors.info}`}>
                                {prescription.instructions}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reports">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TestTube className="w-5 h-5" />
                      Laboratory Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {labReports.map((report) => (
                        <div key={report.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold">
                                {report.testName}
                              </h3>
                              <p
                                className={`text-sm ${theme.textColors.secondary}`}
                              >
                                {new Date(report.date).toLocaleDateString()} •{" "}
                                {report.doctor}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(report.status)}>
                                {report.status}
                              </Badge>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-medium">Results:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {report.results.map((result, index) => (
                                <div
                                  key={index}
                                  className="p-3 border rounded-lg"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm">
                                      {result.parameter}
                                    </span>
                                    <Badge
                                      className={getStatusColor(result.status)}
                                      variant="outline"
                                    >
                                      {result.status}
                                    </Badge>
                                  </div>
                                  <p className="text-lg font-bold">
                                    {result.value}
                                  </p>
                                  <p
                                    className={`text-xs ${theme.textColors.tertiary}`}
                                  >
                                    Normal: {result.normalRange}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="vitals">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      Vital Signs Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div
                          className={`p-4 ${theme.containers.featureRed} rounded-lg`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Heart
                              className={`w-5 h-5 ${theme.iconColors.red}`}
                            />
                            <span
                              className={`font-medium ${theme.textColors.heading}`}
                            >
                              Latest BP
                            </span>
                          </div>
                          <div
                            className={`text-2xl font-bold ${theme.iconColors.red}`}
                          >
                            {vitalSigns[0]?.bp || "N/A"}
                          </div>
                          <div
                            className={`text-sm ${theme.textColors.secondary}`}
                          >
                            mmHg
                          </div>
                        </div>

                        <div
                          className={`p-4 ${theme.containers.featureBlue} rounded-lg`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Pulse
                              className={`w-5 h-5 ${theme.iconColors.blue}`}
                            />
                            <span
                              className={`font-medium ${theme.textColors.heading}`}
                            >
                              Heart Rate
                            </span>
                          </div>
                          <div
                            className={`text-2xl font-bold ${theme.iconColors.blue}`}
                          >
                            {vitalSigns[0]?.hr || "N/A"}
                          </div>
                          <div
                            className={`text-sm ${theme.textColors.secondary}`}
                          >
                            bpm
                          </div>
                        </div>

                        <div
                          className={`p-4 ${theme.containers.featureGreen} rounded-lg`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Scale
                              className={`w-5 h-5 ${theme.iconColors.green}`}
                            />
                            <span
                              className={`font-medium ${theme.textColors.heading}`}
                            >
                              Weight
                            </span>
                          </div>
                          <div
                            className={`text-2xl font-bold ${theme.iconColors.green}`}
                          >
                            {vitalSigns[0]?.weight || "N/A"}
                          </div>
                          <div
                            className={`text-sm ${theme.textColors.secondary}`}
                          >
                            kg
                          </div>
                        </div>

                        <div
                          className={`p-4 ${theme.containers.featurePurple} rounded-lg`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Thermometer
                              className={`w-5 h-5 ${theme.iconColors.purple}`}
                            />
                            <span
                              className={`font-medium ${theme.textColors.heading}`}
                            >
                              BMI
                            </span>
                          </div>
                          <div
                            className={`text-2xl font-bold ${theme.iconColors.purple}`}
                          >
                            {vitalSigns[0]?.bmi || "N/A"}
                          </div>
                          <div
                            className={`text-sm ${theme.textColors.secondary}`}
                          >
                            Normal
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-lg overflow-hidden">
                        <div
                          className={`px-4 py-2 ${theme.backgrounds.secondary} font-medium ${theme.textColors.heading}`}
                        >
                          Vital Signs History
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className={theme.backgrounds.secondary}>
                              <tr>
                                <th className="px-4 py-2 text-left">Date</th>
                                <th className="px-4 py-2 text-left">
                                  Blood Pressure
                                </th>
                                <th className="px-4 py-2 text-left">
                                  Heart Rate
                                </th>
                                <th className="px-4 py-2 text-left">Weight</th>
                                <th className="px-4 py-2 text-left">BMI</th>
                                <th className="px-4 py-2 text-left">Trend</th>
                              </tr>
                            </thead>
                            <tbody>
                              {vitalSigns.map((vital, index) => (
                                <tr key={vital.date} className="border-t">
                                  <td className="px-4 py-2">
                                    {new Date(vital.date).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-2">{vital.bp} mmHg</td>
                                  <td className="px-4 py-2">{vital.hr} bpm</td>
                                  <td className="px-4 py-2">
                                    {vital.weight} kg
                                  </td>
                                  <td className="px-4 py-2">{vital.bmi}</td>
                                  <td className="px-4 py-2">
                                    {index < vitalSigns.length - 1 &&
                                      vitalSigns[index + 1] &&
                                      getTrendIcon(
                                        parseFloat(vital.weight),
                                        parseFloat(
                                          vitalSigns[index + 1]?.weight || "0"
                                        )
                                      )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="allergies">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Known Allergies & Sensitivities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {allergies.map((allergy, index) => (
                        <div
                          key={index}
                          className="p-4 border rounded-lg bg-red-50 border-red-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-red-800">
                              {allergy.allergen}
                            </h3>
                            <Badge
                              className={getSeverityColor(allergy.severity)}
                            >
                              {allergy.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-red-700 mb-2">
                            <strong>Reaction:</strong> {allergy.reaction}
                          </p>
                          <p className="text-xs text-red-600">
                            Discovered:{" "}
                            {new Date(allergy.discovered).toLocaleDateString()}
                          </p>
                        </div>
                      ))}

                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                          <div className="text-sm text-yellow-800">
                            <p className="font-medium mb-1">Important:</p>
                            <p>
                              Always inform your healthcare providers about
                              these allergies before any treatment or
                              prescription.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="diet">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Leaf className="w-5 h-5" />
                      Ayurvedic Diet & Lifestyle Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="p-4 bg-green-50 rounded-lg">
                            <h3 className="font-semibold text-green-800 mb-2">
                              Dietary Type
                            </h3>
                            <p className="text-green-700">
                              {dietaryPreferences.type}
                            </p>
                          </div>

                          <div className="p-4 bg-blue-50 rounded-lg">
                            <h3 className="font-semibold text-blue-800 mb-2">
                              Constitutional Guidance
                            </h3>
                            <p className="text-blue-700">
                              {dietaryPreferences.constitution}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="p-4 bg-red-50 rounded-lg">
                            <h3 className="font-semibold text-red-800 mb-2">
                              Restrictions
                            </h3>
                            <div className="space-y-1">
                              {dietaryPreferences.restrictions.map(
                                (restriction, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2"
                                  >
                                    <AlertTriangle className="w-3 h-3 text-red-600" />
                                    <span className="text-red-700 text-sm">
                                      {restriction}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          <div className="p-4 bg-emerald-50 rounded-lg">
                            <h3 className="font-semibold text-emerald-800 mb-2">
                              Recommendations
                            </h3>
                            <div className="space-y-1">
                              {dietaryPreferences.preferences.map(
                                (preference, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700 text-sm">
                                      {preference}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg">
                          <h4 className="font-semibold text-orange-800 mb-2">
                            Morning Routine
                          </h4>
                          <ul className="text-sm text-orange-700 space-y-1">
                            <li>• Wake up before sunrise</li>
                            <li>• Warm water with lemon</li>
                            <li>• Gentle yoga or stretching</li>
                            <li>• Meditation (10-15 min)</li>
                          </ul>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-2">
                            Meal Guidelines
                          </h4>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Eat largest meal at lunch</li>
                            <li>• Light, warm dinner before 7 PM</li>
                            <li>• Avoid cold, raw foods</li>
                            <li>• Chew slowly and mindfully</li>
                          </ul>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                          <h4 className="font-semibold text-purple-800 mb-2">
                            Evening Routine
                          </h4>
                          <ul className="text-sm text-purple-700 space-y-1">
                            <li>• Light walk after dinner</li>
                            <li>• Herbal tea (chamomile/brahmi)</li>
                            <li>• Oil massage for feet</li>
                            <li>• Sleep by 10 PM</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Quick Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <TestTube className="w-6 h-6" />
                  <span className="text-sm">Lab Report</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <Image
                    className="w-6 h-6"
                    aria-label="Medical imaging icon"
                  />
                  <span className="text-sm">X-Ray/Scan</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <Pill className="w-6 h-6" />
                  <span className="text-sm">Prescription</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <File className="w-6 h-6" />
                  <span className="text-sm">Other Document</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Sidebar>
    </DashboardLayout>
  );
}
