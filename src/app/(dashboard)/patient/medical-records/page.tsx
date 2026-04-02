"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { PatientPageHeader, PatientPageShell } from "@/components/patient/PatientPageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/utils/use-toast";
import { useAuth } from "@/hooks/auth/useAuth";
import { theme } from "@/lib/utils/theme-utils";
import { LoadingSpinner, PageLoading, ErrorState, EmptyState } from "@/components/ui/loading";
import { getComprehensiveHealthRecord, getAllergies } from "@/lib/actions/ehr.server";
import { useEffect } from "react";
import {
  FileText,
  Pill,
  Upload,
  Download,
  Eye,
  Search,
  Filter,
  AlertTriangle,
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
  const { session, isPending: authLoading } = useAuth();
  const user = session?.user;
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [allergies, setAllergies] = useState<any[]>([]);
  
  // View Details State
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const handleViewRecord = (record: any) => {
    setSelectedRecord(record);
    setIsViewDialogOpen(true);
  };

  const handleDownload = (e: React.MouseEvent, recordType: string) => {
    e.stopPropagation();
    toast({
      title: "Download Started",
      description: `Downloading ${recordType}...`,
    });
  };

  // Fetch comprehensive health records and allergies on mount
  useEffect(() => {
    const fetchHealthRecords = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        setHasError(false);
        const [data, allergiesData] = await Promise.all([
          getComprehensiveHealthRecord(user.id),
          getAllergies(user.id).catch(() => []),
        ]);
        setHealthData(data);
        setAllergies(Array.isArray(allergiesData) ? allergiesData : []);
      } catch (error) {
        console.error('Failed to fetch health records:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealthRecords();
  }, [user?.id]);

  const medicalHistory = healthData?.medicalHistory || [];
  const prescriptions = healthData?.prescriptions || [];
  const labReports = healthData?.labReports || [];
  const vitalSigns = healthData?.vitals || [];

  const filteredMedicalHistory = medicalHistory.filter((record: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      record.diagnosis?.toLowerCase().includes(term) ||
      record.treatment?.toLowerCase().includes(term) ||
      record.doctor?.toLowerCase().includes(term) ||
      record.notes?.toLowerCase().includes(term) ||
      record.type?.toLowerCase().includes(term)
    );
  });

  const vitalHistoryRows = useMemo(
    () =>
      vitalSigns.map((vital: any, index: number) => ({
        id: `${vital.date}-${index}`,
        dateLabel: new Date(vital.date).toLocaleDateString(),
        bpLabel: `${vital.bp} mmHg`,
        hrLabel: `${vital.hr} bpm`,
        weightLabel: `${vital.weight} kg`,
        bmiLabel: String(vital.bmi),
        currentWeight: parseFloat(vital.weight),
        previousWeight: parseFloat(vitalSigns[index + 1]?.weight || "0"),
        hasPrevious: index < vitalSigns.length - 1 && !!vitalSigns[index + 1],
      })),
    [vitalSigns]
  );

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous)
      return <TrendingUp className={`w-4 h-4 ${theme.iconColors.red}`} />;
    if (current < previous)
      return <TrendingDown className={`w-4 h-4 ${theme.iconColors.green}`} />;
    return <Minus className={`w-4 h-4 ${theme.iconColors.gray}`} />;
  };

  const vitalHistoryColumns = useMemo<ColumnDef<(typeof vitalHistoryRows)[number]>[]>(
    () => [
      { accessorKey: "dateLabel", header: "Date" },
      { accessorKey: "bpLabel", header: "Blood Pressure" },
      { accessorKey: "hrLabel", header: "Heart Rate" },
      { accessorKey: "weightLabel", header: "Weight" },
      { accessorKey: "bmiLabel", header: "BMI" },
      {
        id: "trend",
        header: "Trend",
        cell: ({ row }) =>
          row.original.hasPrevious
            ? getTrendIcon(row.original.currentWeight, row.original.previousWeight)
            : null,
      },
    ],
    [vitalHistoryRows]
  );

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

  // Show error state if data fetch failed
  if (hasError) {
    return (
      
        <ErrorState
          title="Unable to load medical records"
          message="We couldn't fetch your medical records. Please try again."
          onRetry={() => setHasError(false)}
        />
      
    );
  }

  // Show loading state while data is fetching
  if (isLoading) {
    return (
      
        <PageLoading text="Loading your medical records..." />
      
    );
  }

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


  return (
    <PatientPageShell>
      <PatientPageHeader
        eyebrow="Health History"
        title="Medical records"
        description="Review your consultations, lab reports, vitals, allergies, and care notes with the same spacing, contrast, and controls across light and dark mode."
        actions={[
          {
            label: "Upload report",
            icon: <Upload className="h-4 w-4" />,
            variant: "outline",
          },
          {
            label: "Export records",
            icon: <Download className="h-4 w-4" />,
            variant: "outline",
          },
        ]}
      />

          <Tabs defaultValue="history" className="space-y-6">
            <TabsList>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              <TabsTrigger value="reports">Lab Reports</TabsTrigger>
              <TabsTrigger value="vitals">Vitals</TabsTrigger>
              <TabsTrigger value="allergies">Allergies</TabsTrigger>
              <TabsTrigger value="diet">Diet Plan</TabsTrigger>
            </TabsList>

            <TabsContent value="history">
              <div className="space-y-4">
                <Card className="rounded-3xl border-border/70 shadow-sm dark:border-border/60">
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
                            className="h-11 rounded-xl pl-10"
                          />
                        </div>
                        <Button variant="outline" className="h-11 rounded-xl">
                          <Filter className="w-4 h-4 mr-2" />
                          Filter
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {filteredMedicalHistory.length === 0 ? (
                          <EmptyState
                            title={searchTerm ? "No matching records" : "No medical history"}
                            description={searchTerm ? "Try adjusting your search terms." : "You don't have any medical history records yet."}
                            icon={FileText}
                          />
                        ) : (
                          filteredMedicalHistory.map((record: any) => (
                          <div
                            key={record.id}
                            className={`rounded-2xl border p-4 ${theme.borders.primary} hover:bg-emerald-50/40 transition-colors`}
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
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="rounded-xl"
                                  onClick={() => handleViewRecord(record)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="rounded-xl"
                                  onClick={(e) => handleDownload(e, "Medical Record")}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          ))
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="prescriptions">
              <div className="space-y-4">
                <Card className="rounded-3xl border-border/70 shadow-sm dark:border-border/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="w-5 h-5" />
                      Ayurvedic Prescriptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {prescriptions.map((prescription: any) => (
                        <div key={prescription.id} className="rounded-2xl border border-border/70 p-4 dark:border-border/60">
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
                              <Button variant="outline" size="sm" className="rounded-xl">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-medium">Medications:</h4>
                            {prescription.medications.map((med: any, index: number) => (
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
                <Card className="rounded-3xl border-border/70 shadow-sm dark:border-border/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TestTube className="w-5 h-5" />
                      Laboratory Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {labReports.map((report: any) => (
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
                              {report.results.map((result: any, index: number) => (
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
                          className={`p-4 ${theme.containers.featureBlue} rounded-lg`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Thermometer
                              className={`w-5 h-5 ${theme.iconColors.blue}`}
                            />
                            <span
                              className={`font-medium ${theme.textColors.heading}`}
                            >
                              BMI
                            </span>
                          </div>
                          <div
                            className={`text-2xl font-bold ${theme.iconColors.blue}`}
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
                        <div className="p-4">
                          <DataTable
                            columns={vitalHistoryColumns}
                            data={vitalHistoryRows}
                            emptyMessage="No vitals history available"
                            pageSize={8}
                          />
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
                      {allergies.length === 0 ? (
                        <EmptyState
                          title="No allergies recorded"
                          description="No known allergies or sensitivities have been recorded yet."
                        />
                      ) : (
                        allergies.map((allergy: any) => (
                          <div
                            key={allergy.id || allergy.allergen}
                            className={`p-4 border rounded-xl ${theme.containers.featureRed}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className={`font-semibold ${theme.iconColors.red}`}>
                                {allergy.allergen}
                              </h3>
                              <Badge className={getSeverityColor(allergy.severity)}>
                                {allergy.severity}
                              </Badge>
                            </div>
                            {allergy.reaction && (
                              <p className={`text-sm ${theme.textColors.secondary} mb-1`}>
                                <strong>Reaction:</strong> {allergy.reaction}
                              </p>
                            )}
                            {(allergy.onsetDate || allergy.diagnosedDate) && (
                              <p className={`text-xs ${theme.textColors.muted}`}>
                                Onset:{" "}
                                {new Date(allergy.onsetDate || allergy.diagnosedDate).toLocaleDateString()}
                              </p>
                            )}
                            {allergy.status && (
                              <Badge className={allergy.status === "active" ? theme.badges.red : theme.badges.gray} variant="outline">
                                {allergy.status}
                              </Badge>
                            )}
                          </div>
                        ))
                      )}

                      <div className={`p-4 border rounded-xl ${theme.containers.featureYellow}`}>
                        <div className="flex items-start gap-2">
                          <AlertTriangle className={`w-5 h-5 ${theme.iconColors.yellow} mt-0.5`} />
                          <div className={`text-sm ${theme.textColors.warning}`}>
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
                      Diet Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EmptyState
                      title="No diet plan available"
                      description="Your doctor hasn't prescribed a diet plan yet. Ask your doctor to add a personalized diet and lifestyle plan during your next consultation."
                    />
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
      {/* View Record Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Medical Record Details</DialogTitle>
            <DialogDescription>
              View detailed information about this medical record.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Date</h4>
                  <p>{new Date(selectedRecord.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Doctor</h4>
                  <p>{selectedRecord.doctor}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Type</h4>
                  <p>{selectedRecord.type}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Status</h4>
                  <Badge className={getStatusColor(selectedRecord.status)}>{selectedRecord.status}</Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">Diagnosis</h4>
                <p className="bg-slate-50 border border-border/50 p-2 rounded-md text-sm">{selectedRecord.diagnosis}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">Treatment Plan</h4>
                <p className="bg-slate-50 border border-border/50 p-2 rounded-md text-sm">{selectedRecord.treatment}</p>
              </div>

              {selectedRecord.notes && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Notes</h4>
                  <p className="bg-slate-50 border border-border/50 p-2 rounded-md text-sm">{selectedRecord.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            <Button onClick={(e) => {
              handleDownload(e, "Medical Record");
              setIsViewDialogOpen(false);
            }}>
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PatientPageShell>
  );
}
