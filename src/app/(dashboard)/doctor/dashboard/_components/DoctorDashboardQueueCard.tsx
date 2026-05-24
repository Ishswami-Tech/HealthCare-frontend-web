"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Activity, CheckCircle, Clock, Play, Users } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { CanonicalQueueEntry } from "@/types/queue.types";
import { getQueuePatientDisplayName, getQueueStatusLabel } from "@/lib/queue/queue-adapter";
import type { DoctorQueueSection } from "./doctor-dashboard.logic";
import { getDoctorQueueLaneLabel } from "./doctor-dashboard.logic";

interface DoctorDashboardQueueCardProps {
  doctorQueueSections: DoctorQueueSection[];
  resolvedActiveDoctorQueueLane: string;
  activeDoctorQueueSection: DoctorQueueSection | undefined;
  selectedDoctorQueueItems: CanonicalQueueEntry[];
  highlightedQueuePatient: CanonicalQueueEntry | null;
  onSelectQueueLane: (lane: string) => void;
  onViewQueue: () => void;
}

function getStatusColor(status: string) {
  switch (status) {
    case "WAITING":
      return "bg-yellow-100 text-yellow-800";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800";
    case "CONFIRMED":
      return "bg-green-100 text-green-800";
    case "COMPLETED":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "WAITING":
      return <Clock className="size-4" />;
    case "IN_PROGRESS":
      return <Play className="size-4" />;
    case "CONFIRMED":
      return <Users className="size-4" />;
    case "COMPLETED":
      return <CheckCircle className="size-4" />;
    default:
      return <Activity className="size-4" />;
  }
}

export function DoctorDashboardQueueCard({
  doctorQueueSections,
  resolvedActiveDoctorQueueLane,
  activeDoctorQueueSection,
  selectedDoctorQueueItems,
  highlightedQueuePatient,
  onSelectQueueLane,
  onViewQueue,
}: DoctorDashboardQueueCardProps) {
  const liveQueueColumns = useMemo<ColumnDef<CanonicalQueueEntry>[]>(
    () => [
      {
        accessorKey: "patientName",
        header: "Patient",
        cell: ({ row }) => {
          const queueItem = row.original;
          const queueLabel = getDoctorQueueLaneLabel(queueItem);

          return (
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Users className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-foreground">
                  {getQueuePatientDisplayName(queueItem)}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    {queueLabel}
                  </Badge>
                  <span className="text-muted-foreground/80">#{queueItem.position || 0}</span>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "doctorName",
        header: "Doctor",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.doctorName || "Assigned doctor pending"}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={`${getStatusColor(row.original.status)} flex w-max items-center justify-center gap-1 whitespace-nowrap border px-2 py-0.5 text-[10px] font-semibold`}
          >
            {getStatusIcon(row.original.status)}
            {getQueueStatusLabel(row.original)}
          </Badge>
        ),
      },
      {
        id: "waitTime",
        header: "Wait Time",
        cell: ({ row }) => {
          const waitValue = row.original.estimatedWaitTime || row.original.waitTime;
          if (!waitValue) return <span className="text-muted-foreground">-</span>;
          return (
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Clock className="size-3" />
              {waitValue}m
            </span>
          );
        },
      },
    ],
    []
  );

  return (
    <Card className="overflow-hidden border-l-2 border-l-emerald-400 shadow-sm">
      <CardHeader className="flex flex-col gap-3 border-b border-border bg-muted/40 px-4 pb-4 pt-4 dark:bg-muted/20 sm:flex-row sm:items-end sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
          <div className="flex size-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Activity className="size-4" />
          </div>
          Live Queue
        </CardTitle>
        <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted-foreground">
            <span className="rounded-full border border-border bg-background px-2.5 py-1">Direct treatment lanes</span>
            <span className="rounded-full border border-border bg-background px-2.5 py-1">Live queue snapshot</span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
              Read only
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            onClick={onViewQueue}
          >
            View Queue Workspace
          </Button>
        </div>
      </CardHeader>
      <CardContent className="gap-y-3 p-3 sm:p-4">
        {highlightedQueuePatient ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                  Next patient
                </div>
                <div className="mt-1 truncate text-lg font-semibold text-foreground">
                  {getQueuePatientDisplayName(highlightedQueuePatient)}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-700 dark:border-emerald-900 dark:bg-muted/20 dark:text-emerald-200">
                    {getDoctorQueueLaneLabel(highlightedQueuePatient)}
                  </Badge>
                  <span>{highlightedQueuePatient.doctorName || "Assigned doctor pending"}</span>
                  <span className="text-muted-foreground/60">·</span>
                  <span>Queue #{highlightedQueuePatient.position || 0}</span>
                </div>
              </div>
              <Badge
                variant="outline"
                className="shrink-0 border-emerald-200 bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white dark:border-emerald-700 dark:bg-emerald-500"
              >
                {getQueueStatusLabel(highlightedQueuePatient)}
              </Badge>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {doctorQueueSections.map((section) => (
            <Badge
              key={section.key}
              asChild
              variant="outline"
              className={`cursor-pointer gap-2 px-3 py-2 text-sm font-semibold shadow-sm transition ${
                resolvedActiveDoctorQueueLane === section.key
                  ? "border-emerald-500 bg-emerald-600 text-white shadow-md ring-1 ring-emerald-300 dark:border-emerald-400 dark:bg-emerald-500 dark:text-white"
                  : "border-border bg-background text-foreground hover:bg-muted/40"
              }`}
            >
              <button type="button" onClick={() => onSelectQueueLane(section.key)}>
                <span className="truncate font-semibold">{section.title}</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold text-current">
                  {section.items.length}
                </span>
              </button>
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
              Selected lane
            </div>
            <div className="mt-1 truncate text-sm font-semibold text-foreground">
              {activeDoctorQueueSection?.title || "Live queue"}
            </div>
          </div>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            {selectedDoctorQueueItems.length}
          </Badge>
        </div>

        <DataTable
          columns={liveQueueColumns}
          data={selectedDoctorQueueItems}
          pageSize={5}
          emptyMessage="No active queue entries right now."
          compact
        />
      </CardContent>
    </Card>
  );
}
