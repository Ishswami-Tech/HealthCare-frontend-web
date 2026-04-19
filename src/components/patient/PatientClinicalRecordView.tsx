"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Calendar,
  FileText,
  FlaskConical,
  HeartPulse,
  Pill,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type RecordLike = Record<string, any>;

export interface PatientClinicalRecordViewProps {
  patient: RecordLike;
  ehr: RecordLike;
  appointments: RecordLike[];
  history: RecordLike[];
  vitals: RecordLike[];
  labs: RecordLike[];
  carePlan: RecordLike[];
  className?: string;
}

function toArray(value: unknown): RecordLike[] {
  if (Array.isArray(value)) return value as RecordLike[];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["data", "items", "records", "appointments", "history", "labs", "results"]) {
      const candidate = record[key];
      if (Array.isArray(candidate)) return candidate as RecordLike[];
    }
  }
  return [];
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusClass(status?: string): string {
  const normalized = String(status || "").toUpperCase();
  if (["COMPLETE", "COMPLETED", "ACTIVE", "NORMAL", "PAID", "STABLE"].includes(normalized)) {
    return "bg-emerald-500 text-white dark:bg-emerald-500 dark:text-emerald-950";
  }
  if (["PENDING", "DRAFT", "OPEN", "REVIEW", "ONGOING"].includes(normalized)) {
    return "bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-950";
  }
  if (["FAILED", "ABNORMAL", "CRITICAL", "OVERDUE", "CANCELLED"].includes(normalized)) {
    return "bg-red-500 text-white dark:bg-red-400 dark:text-red-950";
  }
  return "bg-slate-500 text-white dark:bg-slate-400 dark:text-slate-950";
}

function getDisplayName(patient?: RecordLike | null): string {
  return (
    patient?.name ||
    `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() ||
    patient?.user?.name ||
    `${patient?.user?.firstName || ""} ${patient?.user?.lastName || ""}`.trim() ||
    patient?.email ||
    patient?.user?.email ||
    "Patient Record"
  );
}

function summaryValue(value: unknown): string {
  if (Array.isArray(value)) return String(value.length);
  if (value === null || value === undefined || value === "") return "0";
  if (typeof value === "object") return String(Object.keys(value as Record<string, unknown>).length);
  return String(value);
}

export function PatientClinicalRecordView({
  patient,
  ehr,
  appointments,
  history,
  vitals,
  labs,
  carePlan,
  className,
}: PatientClinicalRecordViewProps) {
  const patientRecord = (patient || {}) as RecordLike;
  const ehrRecord = (ehr || {}) as RecordLike;

  const patientDisplayName = getDisplayName(patientRecord);
  const activeMedications = useMemo(() => toArray(ehrRecord.medications), [ehrRecord.medications]);
  const allergies = useMemo(() => toArray(ehrRecord.allergies), [ehrRecord.allergies]);
  const upcomingAppointments = useMemo(
    () =>
      appointments.filter((item) => {
        const value = item.startTime || item.appointmentDate || item.date;
        if (!value) return false;
        const parsed = new Date(value);
        return !Number.isNaN(parsed.getTime()) && parsed.getTime() >= Date.now();
      }),
    [appointments]
  );

  const summaryCards = [
    { label: "Appointments", value: appointments.length, icon: <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-300" /> },
    { label: "History Items", value: history.length, icon: <FileText className="h-4 w-4 text-sky-600 dark:text-sky-300" /> },
    { label: "Lab Reports", value: labs.length, icon: <FlaskConical className="h-4 w-4 text-violet-600 dark:text-violet-300" /> },
    { label: "Active Medications", value: activeMedications.length, icon: <Pill className="h-4 w-4 text-amber-600 dark:text-amber-300" /> },
  ];

  const appointmentColumns = useMemo<ColumnDef<RecordLike>[]>(
    () => [
      {
        accessorKey: "date",
        header: "When",
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {formatDateTime(row.original.startTime || row.original.appointmentDate || row.original.date)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={cn("rounded-full border-none px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", statusClass(row.original.status))}>
            {String(row.original.status || "UNKNOWN")}
          </Badge>
        ),
      },
      {
        accessorKey: "doctor",
        header: "Doctor",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.doctorName || row.original.doctor?.name || row.original.doctorId || "Unknown"}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.type || row.original.appointmentType || row.original.consultationType || "-"}
          </span>
        ),
      },
    ],
    []
  );

  const historyColumns = useMemo<ColumnDef<RecordLike>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.date || row.original.createdAt || row.original.startDate)}
          </span>
        ),
      },
      {
        accessorKey: "condition",
        header: "Condition",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.condition || row.original.diagnosis || row.original.title || "Record"}
          </span>
        ),
      },
      {
        accessorKey: "details",
        header: "Details",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.treatment || row.original.description || row.original.notes || "-"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={cn("rounded-full border-none px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", statusClass(row.original.status))}>
            {String(row.original.status || "Unknown")}
          </Badge>
        ),
      },
    ],
    []
  );

  const labColumns = useMemo<ColumnDef<RecordLike>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.date || row.original.testDate || row.original.reportedDate)}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Report",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.testName || row.original.reportType || row.original.imageType || row.original.type || "Report"}
          </span>
        ),
      },
      {
        accessorKey: "result",
        header: "Result",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.result || row.original.results || row.original.findings || row.original.impression || "-"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={cn("rounded-full border-none px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", statusClass(row.original.status))}>
            {String(row.original.status || "Unknown")}
          </Badge>
        ),
      },
    ],
    []
  );

  const vitalsColumns = useMemo<ColumnDef<RecordLike>[]>(
    () => [
      {
        accessorKey: "recordedAt",
        header: "Recorded",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDateTime(row.original.recordedAt || row.original.date || row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Vital",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.type || row.original.vitalType || row.original.name || "Vital"}
          </span>
        ),
      },
      {
        accessorKey: "value",
        header: "Value",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.value != null
              ? `${row.original.value}${row.original.unit ? ` ${row.original.unit}` : ""}`
              : "-"}
          </span>
        ),
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.notes || "-"}</span>,
      },
    ],
    []
  );

  const medicationColumns = useMemo<ColumnDef<RecordLike>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Medication",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.name || row.original.medicineName || row.original.medication || "Medication"}
          </span>
        ),
      },
      {
        accessorKey: "dosage",
        header: "Dosage",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.dosage || "-"}</span>,
      },
      {
        accessorKey: "frequency",
        header: "Frequency",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.frequency || "-"}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={cn("rounded-full border-none px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", statusClass(row.original.status))}>
            {String(row.original.status || "Unknown")}
          </Badge>
        ),
      },
    ],
    []
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="border-border/70 bg-card shadow-sm">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
              </div>
              <div className="rounded-xl bg-background/80 p-3 ring-1 ring-border/40">{card.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          <TabsTrigger value="overview" className="gap-2">
            <UserRound className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2">
            <Calendar className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <FileText className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="vitals" className="gap-2">
            <HeartPulse className="h-4 w-4" />
            Vitals
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FlaskConical className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="medications" className="gap-2">
            <Pill className="h-4 w-4" />
            Medications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-border/70 bg-card shadow-sm lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-foreground">Patient Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Name", patientDisplayName],
                  ["Email", patientRecord.email || patientRecord.user?.email || " - "],
                  ["Phone", patientRecord.phone || patientRecord.user?.phone || " - "],
                  ["Age", patientRecord.age ? String(patientRecord.age) : " - "],
                  ["Blood Group", patientRecord.bloodGroup || ehrRecord.bloodGroup || " - "],
                  ["Gender", patientRecord.gender || " - "],
                  ["Allergies", allergies.length ? String(allergies.length) : "0"],
                  ["Active Medications", String(activeMedications.length)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border/70 bg-background/60 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{value as string}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-foreground">Clinical Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Upcoming appointments</span>
                  <span className="font-semibold text-foreground">{upcomingAppointments.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>History entries</span>
                  <span className="font-semibold text-foreground">{summaryValue(ehrRecord.medicalHistory || history)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Lab reports</span>
                  <span className="font-semibold text-foreground">{labs.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Vitals</span>
                  <span className="font-semibold text-foreground">{vitals.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Care plan items</span>
                  <span className="font-semibold text-foreground">{carePlan.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/70 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground">EHR Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Medical History", summaryValue(ehrRecord.medicalHistory || history)],
                ["Lab Reports", summaryValue(ehrRecord.labReports || labs)],
                ["Medications", summaryValue(ehrRecord.medications || activeMedications)],
                ["Vitals", summaryValue(ehrRecord.vitals || vitals)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border/70 bg-background/60 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{value as string}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card className="border-border/70 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground">Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={appointmentColumns} data={appointments} pageSize={10} emptyMessage="No appointments found for this patient." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-border/70 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground">Treatment History</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={historyColumns} data={history} pageSize={10} emptyMessage="No treatment history found." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vitals">
          <Card className="border-border/70 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground">Vitals</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={vitalsColumns} data={vitals} pageSize={10} emptyMessage="No vitals available." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="border-border/70 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground">Lab and Imaging Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={labColumns} data={labs} pageSize={10} emptyMessage="No reports available." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications">
          <Card className="border-border/70 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground">Current Medications</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={medicationColumns} data={activeMedications} pageSize={10} emptyMessage="No active medications found." />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-border/70 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-foreground">Care Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {carePlan.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {carePlan.map((item, index) => (
                <div key={item.id || index} className="rounded-xl border border-border/70 bg-background/60 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {item.goals?.[0] || item.title || item.name || `Plan item ${index + 1}`}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.followUpInstructions || item.instructions || item.description || item.notes || "-"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/70 bg-background/60 p-6 text-sm text-muted-foreground">
              No care plan data available.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-foreground">Backend Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            This view uses clinic-scoped patient data and backend EHR endpoints. If a section is empty, it usually means the backend has no records yet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
