"use client";

import { useMemo, useRef, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HashTabs } from "@/hooks/navigation/HashTabs";
import {
  PatientPageHeader,
  PatientPageShell,
} from "@/components/patient/PatientPageShell";
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHead,
  DashboardEmpty,
} from "@/components/dashboard/DashboardPrimitives";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/auth/useAuth";
import { useQueryClient } from "@/hooks/core";
import {
  useAllergies,
  useComprehensiveHealthRecord,
  useCreateMedicalRecord,
} from "@/hooks/query/useMedicalRecords";
import { clinicApiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/config/config";
import { theme } from "@/lib/utils/theme-utils";
import { LoadingSpinner, ErrorState, EmptyState } from "@/components/ui/loading";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { formatDateInIST } from "@/lib/utils/date-time";
import type {
  ComprehensiveHealthRecord,
  PatientAllergyEntry,
  PatientLabReportEntry,
  PatientMedicalHistoryEntry,
  PatientPrescriptionEntry,
  PatientVitalEntry,
} from "@/types/medical-records.types";
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
  Loader2,
} from "lucide-react";

type QuickUploadType = "LAB_TEST" | "XRAY" | "PRESCRIPTION" | "DIAGNOSIS_REPORT";

const QUICK_UPLOAD_OPTIONS: Array<{
  type: QuickUploadType;
  label: string;
  accept: string;
  icon: typeof TestTube;
}> = [
  { type: "LAB_TEST", label: "Lab Report", accept: ".pdf,.png,.jpg,.jpeg,.webp", icon: TestTube },
  { type: "XRAY", label: "X-Ray/Scan", accept: ".pdf,.png,.jpg,.jpeg,.webp,.dcm", icon: Image },
  { type: "PRESCRIPTION", label: "Prescription", accept: ".pdf,.png,.jpg,.jpeg,.webp", icon: Pill },
  { type: "DIAGNOSIS_REPORT", label: "Other Document", accept: ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx", icon: File },
];

const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  LAB_TEST: "Lab Report",
  XRAY: "X-Ray/Scan",
  MRI: "MRI",
  PRESCRIPTION: "Prescription",
  DIAGNOSIS_REPORT: "Other Document",
  PULSE_DIAGNOSIS: "Pulse Diagnosis",
};

/** Anything larger is rejected before we spend a round trip on it. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * The picker's `accept` list is a hint, not a guarantee — a patient can still
 * choose "All files" on most platforms — so the extension is re-checked here.
 */
function isAcceptedFile(file: File, accept: string): boolean {
  const allowed = accept
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return true;
  const name = file.name.toLowerCase();
  return allowed.some((ext) => name.endsWith(ext));
}

/** The backend replies with a prefixed id (LAB_/RAD_/GEN_), shape varies by layer. */
function extractRecordId(response: unknown): string | null {
  const payload = response as
    | { id?: string; data?: { id?: string }; record?: { id?: string } }
    | null
    | undefined;
  return payload?.id || payload?.data?.id || payload?.record?.id || null;
}

type PatientMedicalRecordsProps = {
  embedded?: boolean;
};

export default function PatientMedicalRecords({ embedded = false }: PatientMedicalRecordsProps) {
  const { session, isPending: authLoading } = useAuth();
  const user = session?.user;
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingUploadType, setPendingUploadType] = useState<QuickUploadType | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    data: healthData,
    isPending: isLoading,
    error: healthDataError,
  } = useComprehensiveHealthRecord(user?.id || "");
  const { data: allergiesData } = useAllergies(user?.id || "");
  // Silent: this flow is two calls (create the record, then attach the file) but
  // one user action, so it reports a single result instead of three toasts.
  const createMedicalRecord = useCreateMedicalRecord({ silent: true });
  const typedHealthData = (healthData ?? null) as ComprehensiveHealthRecord | null;
  const allergies = Array.isArray(allergiesData) ? (allergiesData as PatientAllergyEntry[]) : [];
  
  // View Details State
  const [selectedRecord, setSelectedRecord] = useState<PatientMedicalHistoryEntry | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const handleViewRecord = (record: PatientMedicalHistoryEntry) => {
    setSelectedRecord(record);
    setIsViewDialogOpen(true);
  };

  const handleDownload = (e: React.MouseEvent, recordType: string) => {
    e.stopPropagation();
    showSuccessToast(`Downloading ${recordType}...`, {
      id: TOAST_IDS.GLOBAL.SUCCESS,
    });
  };

  const openQuickUpload = (type: QuickUploadType) => {
    if (!user?.id || isUploading) return;
    setPendingUploadType(type);
    const option = QUICK_UPLOAD_OPTIONS.find((item) => item.type === type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = option?.accept || ".pdf,.png,.jpg,.jpeg,.webp";
      // Clearing first means picking the same file twice still fires onChange.
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleQuickUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const uploadType = pendingUploadType;
    event.target.value = "";
    setPendingUploadType(null);

    if (!file || !uploadType) {
      return;
    }

    if (!user?.id) {
      showErrorToast("Sign in again before uploading a document.", {
        id: TOAST_IDS.MEDICAL_RECORD.UPLOAD,
      });
      return;
    }

    const option = QUICK_UPLOAD_OPTIONS.find((item) => item.type === uploadType);

    if (file.size === 0) {
      showErrorToast("That file is empty. Pick another one.", {
        id: TOAST_IDS.MEDICAL_RECORD.UPLOAD,
      });
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      showErrorToast(
        `${file.name} is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`,
        { id: TOAST_IDS.MEDICAL_RECORD.UPLOAD },
      );
      return;
    }

    if (option && !isAcceptedFile(file, option.accept)) {
      showErrorToast(
        `${option.label} accepts ${option.accept.replaceAll(".", "").replaceAll(",", ", ")} files.`,
        { id: TOAST_IDS.MEDICAL_RECORD.UPLOAD },
      );
      return;
    }

    setIsUploading(true);
    setUploadingFileName(file.name);
    try {
      const created = await createMedicalRecord.mutateAsync({
        patientId: user.id,
        type: uploadType,
        title: file.name || option?.label || "Uploaded document",
        content: `Patient uploaded ${option?.label || "document"}: ${file.name}`,
      });

      const recordId = extractRecordId(created);
      if (!recordId) {
        throw new Error(
          "The record was created but the server did not return its id, so the file was not attached.",
        );
      }

      // Upload the file directly to the API — do not send File through a
      // Next.js Server Action (default 1mb body limit caused POST 500s).
      await clinicApiClient.upload(
        API_ENDPOINTS.MEDICAL_RECORDS.UPLOAD(recordId),
        file,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ehr"], exact: false }),
        queryClient.invalidateQueries({ queryKey: ["medicalRecords"], exact: false }),
      ]);
      showSuccessToast(`${option?.label || "Document"} uploaded`, {
        id: TOAST_IDS.MEDICAL_RECORD.UPLOAD,
      });
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : "Failed to upload document",
        { id: TOAST_IDS.MEDICAL_RECORD.UPLOAD },
      );
    } finally {
      setIsUploading(false);
      setUploadingFileName(null);
    }
  };

  // Files uploaded from Quick Upload (and by staff). Previously these were written
  // to a table the read path never returned, so an upload appeared to vanish.
  const documents = (typedHealthData?.documents || []).toSorted(
    (left, right) =>
      new Date(String(right.date || right.createdAt || 0)).getTime() -
      new Date(String(left.date || left.createdAt || 0)).getTime()
  );

  const medicalHistory = (typedHealthData?.medicalHistory || []).toSorted(
    (left: any, right: any) =>
      new Date(String(right.date || right.createdAt || right.updatedAt || 0)).getTime() -
      new Date(String(left.date || left.createdAt || left.updatedAt || 0)).getTime()
  );
  const prescriptions = (typedHealthData?.prescriptions || []).toSorted(
    (left: any, right: any) =>
      new Date(String(right.prescribedAt || right.createdAt || right.updatedAt || 0)).getTime() -
      new Date(String(left.prescribedAt || left.createdAt || left.updatedAt || 0)).getTime()
  );
  const labReports = (typedHealthData?.labReports || []).toSorted(
    (left: any, right: any) =>
      new Date(String(right.date || right.createdAt || right.updatedAt || 0)).getTime() -
      new Date(String(left.date || left.createdAt || left.updatedAt || 0)).getTime()
  );
  const vitalSigns = (typedHealthData?.vitals || []).toSorted(
    (left: any, right: any) =>
      new Date(String(right.date || right.recordedAt || right.createdAt || 0)).getTime() -
      new Date(String(left.date || left.recordedAt || left.createdAt || 0)).getTime()
  );

  const filteredMedicalHistory = medicalHistory.filter((record: PatientMedicalHistoryEntry) => {
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
      vitalSigns.map((vital: PatientVitalEntry, index: number) => ({
        id: `${vital.date}-${index}`,
        dateLabel: formatDateInIST(vital.date, { day: "2-digit", month: "short", year: "numeric" }, "en-IN"),
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
      return <TrendingUp className={`size-4 ${theme.iconColors.red}`} />;
    if (current < previous)
      return <TrendingDown className={`size-4 ${theme.iconColors.green}`} />;
    return <Minus className={`size-4 ${theme.iconColors.gray}`} />;
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
    []
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
  if (healthDataError) {
    return (
      
        <ErrorState
          title="Unable to load medical records"
          message="We couldn't fetch your medical records. Please try again."
          onRetry={() => window.location.reload()}
        />
      
    );
  }

  // Show loading state while data is fetching
  if (isLoading) {
    return (
      <LoadingSpinner size="lg" center />
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


  const content = (
    <div className="flex flex-col gap-y-3">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => void handleQuickUploadFile(event)}
      />
      {!embedded && (
        <PatientPageHeader
          eyebrow="Health History"
          title="Medical records"
          description="Review your consultations, lab reports, vitals, allergies, and care notes with the same spacing, contrast, and controls across light and dark mode."
          actions={[
            {
              label: "Upload report",
              icon: <Upload className="size-4" />,
              variant: "outline",
              onClick: () => openQuickUpload("DIAGNOSIS_REPORT"),
            },
            {
              label: "Export records",
              icon: <Download className="size-4" />,
              variant: "outline",
            },
          ]}
        />
      )}

          <HashTabs
            tabs={["history", "prescriptions", "reports", "vitals", "allergies", "diet"] as const}
            defaultValue="history"
            namespace="records"
            className="flex flex-col gap-y-3"
          >
            <div className="scrollbar-hide -mx-1 overflow-x-auto px-1 pb-1 sm:mx-0 sm:px-0">
              <TabsList
                className="inline-flex h-10 w-max min-w-full justify-start gap-1 rounded-xl bg-muted/50 p-1 sm:w-full"
                role="group"
                aria-label="Record type"
              >
                <TabsTrigger value="history">
                  History
                </TabsTrigger>
                <TabsTrigger value="prescriptions">
                  Prescriptions
                </TabsTrigger>
                <TabsTrigger value="reports">
                  Reports
                </TabsTrigger>
                <TabsTrigger value="vitals">
                  Vitals
                </TabsTrigger>
                <TabsTrigger value="allergies">
                  Allergies
                </TabsTrigger>
                <TabsTrigger value="diet">
                  Diet
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="history" className="mt-0">
              <div className="flex flex-col gap-y-4">
                <Card className="rounded-2xl border-border/70 shadow-sm dark:border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Clock className="size-5" />
                      Medical History Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-y-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <div className="relative flex-1">
                          <Search
                            className={`absolute left-3 top-1/2 size-4 -translate-y-1/2 ${theme.textColors.muted}`}
                          />
                          <Input
                            placeholder="Search medical history..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-10 rounded-xl pl-10"
                          />
                        </div>
                        <Button variant="outline" className="h-10 shrink-0 rounded-xl">
                          <Filter className="mr-2 size-4" />
                          Filter
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {filteredMedicalHistory.length === 0 ? (
                          <div className="col-span-full">
                            <EmptyState
                              title={searchTerm ? "No matching records" : "No medical history"}
                              description={searchTerm ? "Try adjusting your search terms." : "You don't have any medical history records yet."}
                              icon={FileText}
                            />
                          </div>
                        ) : (
                          filteredMedicalHistory.map((record: PatientMedicalHistoryEntry) => (
                          <div
                            key={record.id}
                            className={`cursor-pointer rounded-2xl border p-3 sm:p-4 ${theme.borders.primary} transition-colors hover:bg-emerald-50/40`}
                            onClick={() => handleViewRecord(record)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <h3 className="font-semibold">
                                    {record.type}
                                  </h3>
                                  <Badge
                                    className={getStatusColor(record.status)}
                                  >
                                    {record.status}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 sm:gap-3">
                                  <div>
                                    <p>
                                      <strong>Date:</strong>{" "}
                                      {formatDateInIST(record.date, { day: "2-digit", month: "short", year: "numeric" }, "en-IN")}
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
                                    className={`mt-3 rounded-lg p-3 ${theme.containers.featureBlue}`}
                                  >
                                    <p
                                      className={`text-sm ${theme.textColors.heading}`}
                                    >
                                      <strong>Notes:</strong> {record.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="flex shrink-0 gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="rounded-xl"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewRecord(record);
                                  }}
                                >
                                  <Eye className="size-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="rounded-xl"
                                  onClick={(e) => handleDownload(e, "Medical Record")}
                                >
                                  <Download className="size-4" />
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
              <div className="flex flex-col gap-y-4">
                <Card className="rounded-3xl border-border/70 shadow-sm dark:border-border/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="size-5" />
                      Ayurvedic Prescriptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                      {prescriptions.map((prescription: PatientPrescriptionEntry) => (
                        <div key={prescription.id} className="rounded-2xl border border-border/70 p-3 sm:p-4 dark:border-border/60">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold">
                                Prescription -{" "}
                                {formatDateInIST(prescription.date, { day: "2-digit", month: "short", year: "numeric" }, "en-IN")}
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
                                <Download className="size-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-y-3">
                            <h4 className="font-medium">Medications:</h4>
                            {prescription.medications.map((med) => (
                              <div
                                key={med.name}
                                className={`flex items-center justify-between p-2.5 sm:p-3 ${theme.containers.featureGreen} rounded-lg`}
                              >
                                <div className="flex items-center gap-3">
                                  <Leaf
                                    className={`size-4 ${theme.iconColors.green}`}
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
              <div className="flex flex-col gap-y-4">
                <DashboardCard>
                  <DashboardCardHead
                    title="Uploaded documents"
                    icon={<Upload className="size-[15px]" />}
                  >
                    <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wider">
                      {documents.length}
                    </Badge>
                  </DashboardCardHead>
                  {documents.length === 0 ? (
                    <DashboardEmpty
                      icon={<Upload className="size-5" />}
                      title="No documents uploaded yet"
                      description="Use Quick Upload below to add a prescription, scan or report from your device."
                    />
                  ) : (
                    <DashboardCardBody className="flex flex-col gap-3">
                      {documents.map((document) => (
                        <div
                          key={document.id}
                          className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background p-3.5"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                            <File className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {document.title}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {DOCUMENT_CATEGORY_LABELS[document.category] || document.category}
                              {document.date
                                ? ` · ${formatDateInIST(document.date, { day: "2-digit", month: "short", year: "numeric" }, "en-IN")}`
                                : ""}
                              {typeof document.fileSize === "number" && document.fileSize > 0
                                ? ` · ${formatBytes(document.fileSize)}`
                                : ""}
                            </p>
                          </div>
                          {document.fileUrl ? (
                            <Button asChild variant="outline" size="sm" className="h-8 rounded-lg">
                              <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                                <Eye className="size-4" />
                                Open
                              </a>
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                              No file attached
                            </Badge>
                          )}
                        </div>
                      ))}
                    </DashboardCardBody>
                  )}
                </DashboardCard>

                <Card className="rounded-3xl border-border/70 shadow-sm dark:border-border/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TestTube className="size-5" />
                      Laboratory Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                      {labReports.map((report: PatientLabReportEntry) => (
                        <div key={report.id} className="border rounded-lg p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold">
                                {report.testName}
                              </h3>
                              <p
                                className={`text-sm ${theme.textColors.secondary}`}
                              >
                                {formatDateInIST(report.date, { day: "2-digit", month: "short", year: "numeric" }, "en-IN")} •{" "}
                                {report.doctor}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(report.status)}>
                                {report.status}
                              </Badge>
                              <Button variant="outline" size="sm">
                                <Eye className="size-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-y-3">
                            <h4 className="font-medium">Results:</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                              {report.results.map((result) => (
                                <div
                                  key={result.parameter}
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
              <div className="flex flex-col gap-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="size-5" />
                      Vital Signs Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-y-6">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
                        <div
                          className={`p-3 sm:p-4 ${theme.containers.featureRed} rounded-lg`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Heart
                              className={`size-5 ${theme.iconColors.red}`}
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
                          className={`p-3 sm:p-4 ${theme.containers.featureBlue} rounded-lg`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Pulse
                              className={`size-5 ${theme.iconColors.blue}`}
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
                          className={`p-3 sm:p-4 ${theme.containers.featureGreen} rounded-lg`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Scale
                              className={`size-5 ${theme.iconColors.green}`}
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
                          className={`p-3 sm:p-4 ${theme.containers.featureBlue} rounded-lg`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Thermometer
                              className={`size-5 ${theme.iconColors.blue}`}
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
              <div className="flex flex-col gap-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="size-5" />
                      Known Allergies & Sensitivities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-y-4">
                      {allergies.length === 0 ? (
                        <EmptyState
                          title="No allergies recorded"
                          description="No known allergies or sensitivities have been recorded yet."
                        />
                      ) : (
                        allergies.map((allergy: PatientAllergyEntry) => (
                          <div
                            key={allergy.id || allergy.allergen}
                            className={`p-3 sm:p-4 border rounded-xl ${theme.containers.featureRed}`}
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
                                {formatDateInIST(allergy.onsetDate ?? allergy.diagnosedDate ?? "", { day: "2-digit", month: "short", year: "numeric" }, "en-IN")}
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
                          <AlertTriangle className={`size-5 ${theme.iconColors.yellow} mt-0.5`} />
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
              <div className="flex flex-col gap-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Leaf className="size-5" />
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
          </HashTabs>

          {/* Quick Upload Section */}
          <DashboardCard>
            <DashboardCardHead title="Quick upload" icon={<Upload className="size-[15px]" />}>
              {isUploading ? (
                <span className="inline-flex max-w-[16rem] items-center gap-1.5 text-xs font-normal text-muted-foreground">
                  <Loader2 className="size-3.5 shrink-0 animate-spin" />
                  <span className="truncate">
                    Uploading{uploadingFileName ? ` ${uploadingFileName}` : "…"}
                  </span>
                </span>
              ) : null}
            </DashboardCardHead>
            <DashboardCardBody>
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                {QUICK_UPLOAD_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.type}
                      type="button"
                      variant="outline"
                      disabled={isUploading || !user?.id}
                      onClick={() => openQuickUpload(option.type)}
                      className="flex h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-xl border-dashed px-2 hover:border-solid hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300"
                    >
                      <Icon className="size-5 shrink-0" aria-hidden="true" />
                      <span className="text-center text-xs font-medium leading-tight">
                        {option.label}
                      </span>
                    </Button>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Choose a type, then pick a PDF or image from your device. Up to{" "}
                {formatBytes(MAX_UPLOAD_BYTES)} per file.
              </p>
            </DashboardCardBody>
          </DashboardCard>

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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Date</h4>
                  <p>{formatDateInIST(selectedRecord.date, { day: "2-digit", month: "short", year: "numeric" }, "en-IN")}</p>
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
              <Download className="size-4 mr-2" />
              Download Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  return embedded ? content : <PatientPageShell>{content}</PatientPageShell>;
}


