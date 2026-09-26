"use client";

import { TherapyPlanProgress, TherapyStatusBadge } from "./TherapyPlanPanel";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDateInIST } from "@/lib/utils/date-time";
import { useTherapyProgress } from "@/hooks/query/useVisitTherapy";
import {
  therapyProcedureLabel,
  type TherapyProgressVitalsPoint,
} from "@/types/visit-therapy.types";

interface TherapyProgressPanelProps {
  clinicId: string;
  patientId: string;
}

type MetricKey = "painScore" | "weightKg" | "bmi" | "bpSystolic" | "bpDiastolic";

interface MetricDef {
  key: MetricKey;
  label: string;
  unit: string;
}

const DEFAULT_METRIC: MetricDef = { key: "painScore", label: "Pain", unit: "/10" };

const METRICS: readonly MetricDef[] = [
  DEFAULT_METRIC,
  { key: "weightKg", label: "Weight", unit: "kg" },
  { key: "bmi", label: "BMI", unit: "" },
  { key: "bpSystolic", label: "BP systolic", unit: "mmHg" },
  { key: "bpDiastolic", label: "BP diastolic", unit: "mmHg" },
];

interface TrendPoint {
  label: string;
  opdNumber: string;
  value: number | null;
}

interface TrendChartProps {
  data: TrendPoint[];
  unit: string;
}

// recharts is heavy; load it only when the Progress tab is opened.
const TrendChart = dynamic(
  async () => {
    const { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } =
      await import("recharts");

    return function TrendChart({ data, unit }: TrendChartProps) {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.12} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
              width={44}
            />
            <Tooltip
              formatter={(value) => [`${String(value)} ${unit}`.trim(), ""]}
              labelFormatter={(_label, payload) => {
                const point = payload?.[0]?.payload as TrendPoint | undefined;
                return point ? `${point.opdNumber} · ${point.label}` : String(_label);
              }}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="currentColor"
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 2 }}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    };
  },
  { ssr: false, loading: () => <div className="h-full w-full" /> },
);

function CompletionRing({ completed, planned }: { completed: number; planned: number }) {
  const percent = planned > 0 ? Math.min(100, Math.round((completed / planned) * 100)) : 0;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 80 80" className="size-20 shrink-0" role="img" aria-label={`${percent}% of sessions done`}>
        <circle cx="40" cy="40" r={radius} className="fill-none stroke-primary/15" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          className="fill-none stroke-primary transition-[stroke-dashoffset]"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          transform="rotate(-90 40 40)"
        />
        <text x="40" y="44" textAnchor="middle" className="fill-foreground text-[15px] font-bold">
          {percent}%
        </text>
      </svg>
      <div>
        <p className="text-2xl font-bold text-foreground">
          {completed}
          <span className="text-base font-medium text-muted-foreground"> / {planned}</span>
        </p>
        <p className="text-xs text-muted-foreground">therapy sessions completed across all visits</p>
      </div>
    </div>
  );
}

function buildTrend(series: TherapyProgressVitalsPoint[], metric: MetricKey): TrendPoint[] {
  return series.map((point) => ({
    label: formatDateInIST(point.date, { day: "2-digit", month: "short" }),
    opdNumber: point.opdNumber,
    value: point[metric],
  }));
}

/**
 * Progress across visits: sessions done vs planned, every plan the patient
 * has had, and a per-visit trend of pain / weight / BMI / BP.
 */
export function TherapyProgressPanel({ clinicId, patientId }: TherapyProgressPanelProps) {
  const query = useTherapyProgress(clinicId, patientId);
  const [metric, setMetric] = useState<MetricKey>("painScore");
  const progress = query.data;
  const plans = progress?.plans ?? [];
  const series = progress?.vitalsSeries ?? [];

  const trend = useMemo(() => buildTrend(series, metric), [series, metric]);
  const measuredCount = trend.filter((point) => point.value !== null).length;
  const activeMetric = METRICS.find((entry) => entry.key === metric) ?? DEFAULT_METRIC;
  const visitCount = useMemo(() => new Set(plans.map((plan) => plan.visitId)).size, [plans]);

  return (
    <div className="flex flex-col gap-y-4">
      <Card className="border-border/70 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-foreground">Progress</CardTitle>
          <p className="text-sm text-muted-foreground">
            {query.isPending
              ? "Loading…"
              : plans.length === 0
                ? "No therapy has been planned for this patient yet."
                : `${plans.length} plan${plans.length === 1 ? "" : "s"} across ${visitCount} visit${visitCount === 1 ? "" : "s"}`}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-y-5">
          <CompletionRing
            completed={progress?.totals.completed ?? 0}
            planned={progress?.totals.planned ?? 0}
          />

          {plans.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border/60 rounded-xl border border-border/60 bg-background/60">
              {plans.map((plan) => (
                <li key={plan.id} className="flex flex-col gap-y-2 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {therapyProcedureLabel(plan)}
                      </span>
                      <TherapyStatusBadge status={plan.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                      {plan.opdNumber ? <span className="font-medium">{plan.opdNumber}</span> : null}
                      <span>{formatDateInIST(plan.startDate)}</span>
                      {plan.therapist ? <span>{plan.therapist.name}</span> : null}
                    </div>
                  </div>
                  <TherapyPlanProgress completed={plan.completedSessions} planned={plan.plannedSessions} />
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-3">
          <div>
            <CardTitle className="text-base font-bold text-foreground">Trend by visit</CardTitle>
            <p className="text-sm text-muted-foreground">
              {measuredCount === 0
                ? "Recorded in General Exam on each visit"
                : `${activeMetric.label} recorded on ${measuredCount} of ${series.length} visit${series.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Metric">
            {METRICS.map((entry) => {
              const active = entry.key === metric;
              return (
                <button
                  key={entry.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setMetric(entry.key)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/70 bg-background text-foreground hover:bg-muted",
                  )}
                >
                  {entry.label}
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent>
          {measuredCount === 0 ? (
            <p className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
              {query.isPending
                ? "Loading…"
                : `No ${activeMetric.label.toLowerCase()} values recorded yet.`}
            </p>
          ) : (
            <div className="h-[220px] w-full text-primary">
              <TrendChart data={trend} unit={activeMetric.unit} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
