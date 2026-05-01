"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Activity, ArrowRightLeft, Clock, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getQueuePatientDisplayName,
  getQueueStatusLabel,
  hasQueuePatientIdentity,
  normalizeQueueEntry,
  resolveQueueDisplayLabel,
} from "@/lib/queue/queue-adapter";
import type { QueueFilterGroup, QueueFilterOption } from "@/types/api.types";

type QueueTreatmentTabsProps = {
  title: string;
  description: string;
  queueData: unknown;
  queueFilterCatalog: QueueFilterGroup[];
  actionHref?: string;
  actionLabel?: string;
  emptyMessage?: string;
};

type QueueSummaryEntry = ReturnType<typeof normalizeQueueEntry>;

function normalizeQueueToken(value?: string | null): string {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

const CONSULTATION_FILTERS = [
  "GENERAL_CONSULTATION",
  "FOLLOW_UP",
  "SPECIAL_CASE",
  "DIAGNOSTIC",
  "SENIOR_CITIZEN",
] as const;

function extractQueueEntries(queueData: unknown): QueueSummaryEntry[] {
  if (Array.isArray(queueData)) {
    return queueData.map((entry) => normalizeQueueEntry(entry));
  }

  if (!queueData || typeof queueData !== "object") {
    return [];
  }

  const record = queueData as Record<string, unknown>;
  const candidates: unknown[] = [];

  for (const key of ["data", "queue", "items", "entries"]) {
    const candidate = record[key];
    if (Array.isArray(candidate)) {
      candidates.push(...candidate);
      break;
    }
  }

  return candidates.map((entry) => normalizeQueueEntry(entry));
}

function hasQueueTaxonomy(entry: QueueSummaryEntry): boolean {
  return Boolean(
    entry.queueCategory ||
      entry.displayLabel ||
      entry.serviceBucket ||
      entry.treatmentType ||
      entry.serviceType
  );
}

function isAnalyticsQueueEntry(entry: QueueSummaryEntry): boolean {
  const tokens = [
    entry.queueCategory,
    entry.displayLabel,
    entry.serviceBucket,
    entry.treatmentType,
    entry.serviceType,
    resolveQueueDisplayLabel(entry),
  ]
    .filter(Boolean)
    .map((token) => normalizeQueueToken(token));

  return tokens.some((token) => token.includes("ANALYTICS"));
}

function matchesFilter(entry: QueueSummaryEntry, filter: QueueFilterOption): boolean {
  const normalizedFilter = normalizeQueueToken(filter.value);

  if (normalizedFilter === "UNCATEGORIZED") {
    return !hasQueueTaxonomy(entry) || isAnalyticsQueueEntry(entry);
  }

  const filterTokens = new Set(
    [filter.value, filter.label, ...(filter.aliases || [])]
      .filter(Boolean)
      .map((token) => normalizeQueueToken(token))
  );

  const entryTokens = [
    entry.queueCategory,
    entry.displayLabel,
    entry.serviceBucket,
    entry.treatmentType,
    resolveQueueDisplayLabel(entry),
  ]
    .filter(Boolean)
    .map((token) => normalizeQueueToken(token));

  return entryTokens.some((token) => filterTokens.has(token));
}

function getQueueWaitLabel(entry: QueueSummaryEntry): string {
  const waitValue = entry.estimatedWaitTime || entry.waitTime;
  return waitValue ? `${waitValue}m` : "-";
}

export function QueueTreatmentTabs({
  title,
  description,
  queueData,
  queueFilterCatalog,
  actionHref,
  actionLabel = "Open Queue Workspace",
  emptyMessage = "No treatment queues are active right now.",
}: QueueTreatmentTabsProps) {
  const queueEntries = useMemo(
    () =>
      extractQueueEntries(queueData)
        .filter((entry) => hasQueuePatientIdentity(entry))
        .filter((entry) => !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(String(entry.status || "").toUpperCase()))
        .sort((a, b) => a.position - b.position),
    [queueData]
  );

  const treatmentGroup = useMemo(
    () =>
      queueFilterCatalog.find((group) => normalizeQueueToken(group.key) === "TREATMENTS") ??
      queueFilterCatalog.find((group) => normalizeQueueToken(group.label) === "TREATMENTS"),
    [queueFilterCatalog]
  );

  const treatmentFilters = treatmentGroup?.filters || [];
  const consultationQueueFilters = useMemo<QueueFilterOption[]>(
    () =>
      treatmentFilters
        .filter((filter) => CONSULTATION_FILTERS.includes(normalizeQueueToken(filter.value) as (typeof CONSULTATION_FILTERS)[number]))
        .map((filter) => ({
          value: filter.value,
          label: filter.label,
          description: filter.description || filter.label,
        })),
    [treatmentFilters]
  );
  const procedureQueueFilters = useMemo<QueueFilterOption[]>(
    () => [
      ...treatmentFilters.filter(
        (filter) => !CONSULTATION_FILTERS.includes(normalizeQueueToken(filter.value) as (typeof CONSULTATION_FILTERS)[number])
      ),
      {
        value: "UNCATEGORIZED",
        label: "Uncategorized",
        description: "Queue entries without a treatment type or service label.",
      },
    ],
    [treatmentFilters]
  );

  const consultationQueueSections = useMemo(
    () =>
      consultationQueueFilters.map((option) => ({
        key: normalizeQueueToken(option.value),
        title: option.label,
        items: queueEntries.filter((entry) => matchesFilter(entry, option)),
      })),
    [consultationQueueFilters, queueEntries]
  );

  const procedureQueueSections = useMemo(
    () =>
      procedureQueueFilters.map((option) => ({
        key: normalizeQueueToken(option.value),
        title: option.label,
        items: queueEntries.filter((entry) => matchesFilter(entry, option)),
      })),
    [procedureQueueFilters, queueEntries]
  );

  const [activeQueue, setActiveQueue] = useState<"consultations" | "procedures">("consultations");
  const [activeConsultationLane, setActiveConsultationLane] = useState("");
  const [activeTherapyLane, setActiveTherapyLane] = useState("");

  useEffect(() => {
    if (consultationQueueSections.length === 0) {
      setActiveConsultationLane("");
      return;
    }

    if (!consultationQueueSections.some((section) => section.key === activeConsultationLane)) {
      setActiveConsultationLane(consultationQueueSections[0]?.key || "");
    }
  }, [activeConsultationLane, consultationQueueSections]);

  useEffect(() => {
    if (procedureQueueSections.length === 0) {
      setActiveTherapyLane("");
      return;
    }

    if (!procedureQueueSections.some((section) => section.key === activeTherapyLane)) {
      setActiveTherapyLane(procedureQueueSections[0]?.key || "");
    }
  }, [activeTherapyLane, procedureQueueSections]);

  const activeConsultationSection =
    consultationQueueSections.find((section) => section.key === activeConsultationLane) ?? consultationQueueSections[0];
  const activeProcedureSection =
    procedureQueueSections.find((section) => section.key === activeTherapyLane) ?? procedureQueueSections[0];
  const selectedConsultationItems = activeConsultationSection?.items ?? [];
  const selectedProcedureItems = activeProcedureSection?.items ?? [];

  const queueColumns = useMemo<ColumnDef<QueueSummaryEntry>[]>(
    () => [
      {
        accessorKey: "patientName",
        header: "Patient",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">
                {getQueuePatientDisplayName(row.original)}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  {resolveQueueDisplayLabel(row.original)}
                </Badge>
                <span className="text-muted-foreground/80">#{row.original.position || 0}</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "doctorName",
        header: "Doctor",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.doctorName || "Assigned doctor pending"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="outline" className="border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {getQueueStatusLabel(row.original)}
          </Badge>
        ),
      },
      {
        id: "waitTime",
        header: "Wait Time",
        cell: ({ row }) => (
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Clock className="h-3 w-3" />
            {getQueueWaitLabel(row.original)}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <Card className="overflow-hidden border border-border/60 shadow-sm">
      <CardHeader className="flex flex-col gap-3 border-b border-border bg-muted/40 px-4 pb-4 pt-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
            <Activity className="h-4 w-4 text-emerald-600" />
            {title}
          </CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        {actionHref ? (
          <Button asChild variant="outline" className="gap-2">
            <Link href={actionHref}>
              <ArrowRightLeft className="h-4 w-4" />
              {actionLabel}
            </Link>
          </Button>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        <Tabs value={activeQueue} onValueChange={(value) => setActiveQueue(value as "consultations" | "procedures")} className="space-y-4">
          <TabsList className="grid h-auto grid-cols-2 gap-2 bg-transparent p-0">
            <TabsTrigger
              value="consultations"
              className="justify-between rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <span>Consultations</span>
              <Badge variant="outline" className="h-5 rounded-full border-transparent bg-muted/70 px-1.5 text-[10px] text-muted-foreground data-[state=active]:bg-white/20 data-[state=active]:text-white">
                {consultationQueueSections.reduce((total, section) => total + section.items.length, 0)}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="procedures"
              className="justify-between rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <span>Procedures</span>
              <Badge variant="outline" className="h-5 rounded-full border-transparent bg-muted/70 px-1.5 text-[10px] text-muted-foreground data-[state=active]:bg-white/20 data-[state=active]:text-white">
                {procedureQueueSections.reduce((total, section) => total + section.items.length, 0)}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="consultations" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {consultationQueueSections.map((section) => (
                <Badge
                  key={section.key}
                  asChild
                  variant="outline"
                  className={`cursor-pointer gap-2 px-3 py-2 text-sm font-semibold shadow-sm transition ${
                    activeConsultationLane === section.key
                      ? "border-emerald-500 bg-emerald-600 text-white ring-1 ring-emerald-300"
                      : "border-border bg-background text-foreground hover:bg-muted/40"
                  }`}
                >
                  <button type="button" onClick={() => setActiveConsultationLane(section.key)}>
                    <span className="truncate">{section.title}</span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold text-current">
                      {section.items.length}
                    </span>
                  </button>
                </Badge>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">
                  {activeConsultationSection?.title || "Consultations"}
                </div>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  {selectedConsultationItems.length}
                </Badge>
              </div>
              <DataTable
                columns={queueColumns}
                data={selectedConsultationItems}
                pageSize={5}
                compact
                emptyMessage={`No patients in ${String(activeConsultationSection?.title || "selected").toLowerCase()} queue.`}
              />
            </div>
          </TabsContent>

          <TabsContent value="procedures" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {procedureQueueSections.map((section) => (
                <Badge
                  key={section.key}
                  asChild
                  variant="outline"
                  className={`cursor-pointer gap-2 px-3 py-2 text-sm font-semibold shadow-sm transition ${
                    activeTherapyLane === section.key
                      ? "border-emerald-500 bg-emerald-600 text-white ring-1 ring-emerald-300"
                      : "border-border bg-background text-foreground hover:bg-muted/40"
                  }`}
                >
                  <button type="button" onClick={() => setActiveTherapyLane(section.key)}>
                    <span className="truncate">{section.title}</span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold text-current">
                      {section.items.length}
                    </span>
                  </button>
                </Badge>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">
                  {activeProcedureSection?.title || "Procedures"}
                </div>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  {selectedProcedureItems.length}
                </Badge>
              </div>
              <DataTable
                columns={queueColumns}
                data={selectedProcedureItems}
                pageSize={5}
                compact
                emptyMessage={`No patients in ${String(activeProcedureSection?.title || "selected").toLowerCase()} queue.`}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
