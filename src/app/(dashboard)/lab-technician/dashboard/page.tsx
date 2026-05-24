"use client";

import { useMemo } from "react";
import { Loader2 } from "@/components/ui/loader";
import { useAuth } from "@/hooks/auth/useAuth";
import { useLabTechnicianResults } from "@/hooks/query/useLabTechnician";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { formatDateTimeInIST } from "@/lib/utils/date-time";
import { LabTechnicianCategoryStats } from "../_components/LabTechnicianCategoryStats";
import { LabTechnicianPanels } from "../_components/LabTechnicianPanels";
import { LabTechnicianStatsCards } from "../_components/LabTechnicianStatsCards";

type LabTechnicianResultRow = {
  id: string;
  status?: string;
  patientName?: string;
  patient?: { name?: string };
  testName?: string;
  testType?: string;
  priority?: string;
  createdAt?: string;
  reportedAt?: string;
  updatedAt?: string;
  patientId?: string;
};

type CategoryStats = {
  hematology: number;
  urineAnalysis: number;
  biochemistry: number;
  microbiology: number;
};

function getPriorityColor(priority: string) {
  switch (priority.toLowerCase()) {
    case "high":
    case "critical":
      return "bg-red-100 text-red-800";
    case "medium":
    case "moderate":
      return "bg-orange-100 text-orange-800";
    case "low":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

function getStatusColor(status: string) {
  const s = status.toLowerCase();
  if (["completed", "normal"].includes(s)) return "bg-green-100 text-green-800";
  if (s === "abnormal") return "bg-orange-100 text-orange-800";
  if (s === "critical") return "bg-red-600 text-white font-bold";
  if (["pending", "in_progress"].includes(s)) return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-800";
}

export default function LabTechnicianDashboard() {
  const { session } = useAuth();
  const user = session?.user;
  const technicianId = user?.id;

  const { data: labResultsData, isPending } = useLabTechnicianResults({ labTechnicianId: technicianId } as any);

  useWebSocketQuerySync();

  const labResults = useMemo<LabTechnicianResultRow[]>(
    () => (labResultsData?.results || []) as LabTechnicianResultRow[],
    [labResultsData]
  );

  const pendingTests = useMemo(
    () =>
      labResults
        .filter((r) => r.status === "pending" || r.status === "in_progress" || r.status === "PENDING")
        .slice(0, 5)
        .map((r) => ({
          id: r.id,
          patientName: r.patientName || r.patient?.name || "Unknown Patient",
          testType: r.testName || r.testType || "General Lab Test",
          priority: r.priority || "normal",
          requestedAt: r.createdAt
            ? formatDateTimeInIST(
                r.createdAt,
                { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" },
                "en-IN"
              )
            : "TBA",
        })),
    [labResults]
  );

  const recentResults = useMemo(
    () =>
      labResults
        .filter((r) => ["completed", "COMPLETED", "NORMAL", "ABNORMAL", "CRITICAL"].includes(r.status || ""))
        .slice(0, 5)
        .map((r) => ({
          id: r.id,
          patientName: r.patientName || r.patient?.name || "Unknown Patient",
          testType: r.testName || r.testType || "General Lab Test",
          status: r.status || "",
          completedAt: (() => {
            const completedAt = r.reportedAt || r.updatedAt;
            return completedAt
              ? formatDateTimeInIST(
                  completedAt,
                  { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" },
                  "en-IN"
                )
              : "Recent";
          })(),
        })),
    [labResults]
  );

  const categoryStats = useMemo<CategoryStats>(() => {
    return labResults.reduce(
      (acc, result) => {
        const testLabel = String(result.testName || result.testType || "");

        if (/hematol|blood.*count|cbc/i.test(testLabel)) {
          acc.hematology += 1;
        }

        if (/urine|urinanal|urinalysis/i.test(testLabel)) {
          acc.urineAnalysis += 1;
        }

        if (/biochem|metabol|glucose|lipid|liver|kidney/i.test(testLabel)) {
          acc.biochemistry += 1;
        }

        if (/microb|cultur|bacteria|virus|parasite/i.test(testLabel)) {
          acc.microbiology += 1;
        }

        return acc;
      },
      {
        hematology: 0,
        urineAnalysis: 0,
        biochemistry: 0,
        microbiology: 0,
      }
    );
  }, [labResults]);

  const stats = useMemo(
    () => {
      const statsAccumulator = labResults.reduce(
        (acc, result) => {
          const status = String(result.status || "");

          if (["pending", "in_progress", "PENDING"].includes(status)) {
            acc.pendingCount += 1;
          }

          if (["completed", "COMPLETED", "NORMAL", "ABNORMAL", "CRITICAL"].includes(status)) {
            acc.completedCount += 1;
          }

          const completedAt = result.reportedAt || result.updatedAt;
          if (
            ["completed", "COMPLETED", "NORMAL", "ABNORMAL", "CRITICAL"].includes(status) &&
            result.createdAt &&
            completedAt
          ) {
            const start = new Date(result.createdAt);
            const end = new Date(completedAt);

            if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
              const durationMinutes = (end.getTime() - start.getTime()) / 60000;

              if (durationMinutes > 0) {
                acc.processingTimes.push(durationMinutes);
              }
            }
          }

          acc.patientIds.add(result.patientId || result.id);
          return acc;
        },
        {
          pendingCount: 0,
          completedCount: 0,
          processingTimes: [] as number[],
          patientIds: new Set<string>(),
        }
      );

      const avgProcessingTime =
        statsAccumulator.processingTimes.length > 0
          ? Math.round(
              statsAccumulator.processingTimes.reduce((a, b) => a + b, 0) /
                statsAccumulator.processingTimes.length
            )
          : 0;

      return {
        pendingTests: statsAccumulator.pendingCount,
        completedToday: statsAccumulator.completedCount,
        totalPatients: statsAccumulator.patientIds.size,
        avgProcessingTime,
      };
    },
    [labResults]
  );

  if (isPending) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="gap-y-4 p-4 sm:p-6 sm:gap-y-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Lab Technician Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name || "Technician"}! Here's your laboratory overview.
        </p>
      </div>

      <LabTechnicianStatsCards stats={stats} />
      <LabTechnicianPanels
        pendingTests={pendingTests}
        recentResults={recentResults}
        getPriorityColor={getPriorityColor}
        getStatusColor={getStatusColor}
      />
      <LabTechnicianCategoryStats categoryStats={categoryStats} />
    </div>
  );
}
