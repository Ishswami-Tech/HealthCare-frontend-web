"use client";

import { TherapyPlanProgress, TherapyStatusBadge } from "./TherapyPlanPanel";
import { PlanCardHeader } from "./PlanShared";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Check, LineChart as LineChartIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyBlock, Note, Surface } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { formatDateInIST } from "@/lib/utils/date-time";
import { useTherapyProgress } from "@/hooks/query/useVisitTherapy";
import {
  therapyProcedureLabel,
  type TherapyProgress,
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
  /** Short note after the count in the heading ("score out of 10"). */
  note: string;
}

const DEFAULT_METRIC: MetricDef = { key: "painScore", label: "Pain", unit: "/10", note: "score out of 10" };

const METRICS: readonly MetricDef[] = [
  DEFAULT_METRIC,
  { key: "weightKg", label: "Weight", unit: "kg", note: "in kg" },
  { key: "bmi", label: "BMI", unit: "", note: "" },
  { key: "bpSystolic", label: "BP systolic", unit: "mmHg", note: "in mmHg" },
  { key: "bpDiastolic", label: "BP diastolic", unit: "mmHg", note: "in mmHg" },
];

interface TrendPoint {
  label: string;
  opdNumber: string;
  value: number | null;
}

interface TrendChartProps {
  data: TrendPoint[];
  /** Name of the value in the tooltip ("Pain"). */
  label: string;
  unit: string;
  /** Pain is always drawn on the full 0 to 10 scale. */
  fixedScale: boolean;
}

const PAIN_TICKS = [0, 2, 4, 6, 8, 10];

// recharts is heavy; load it only when the Progress tab is opened.
const TrendChart = dynamic(
  async () => {
    const { CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } =
      await import("recharts");

    return function TrendChart({ data, label, unit, fixedScale }: TrendChartProps) {
      const tick = { fontSize: 11, fill: "var(--tbd-muted)" };
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 22, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 4" stroke="var(--tbd-line)" />
            <XAxis
              dataKey="label"
              tick={tick}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              padding={{ left: 30, right: 30 }}
            />
            <YAxis
              tick={tick}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              width={44}
              {...(fixedScale
                ? { domain: [0, 10] as [number, number], ticks: PAIN_TICKS }
                : { domain: ["auto", "auto"] as ["auto", "auto"] })}
            />
            <Tooltip
              formatter={(value) => [`${String(value)}${unit.startsWith("/") ? "" : " "}${unit}`.trim(), label]}
              labelFormatter={(_label, payload) => {
                const point = payload?.[0]?.payload as TrendPoint | undefined;
                return point ? `${point.opdNumber} · ${point.label}` : String(_label);
              }}
              contentStyle={{
                borderRadius: 12,
                fontSize: 12,
                border: "1px solid var(--tbd-line)",
                background: "var(--card)",
                color: "var(--tbd-ink)",
              }}
            />
            <Line
              type="linear"
              dataKey="value"
              stroke="var(--tbd-brand)"
              strokeWidth={2.5}
              strokeLinejoin="round"
              dot={{ r: 4.5, strokeWidth: 2.5, fill: "var(--card)", stroke: "var(--tbd-brand)" }}
              activeDot={{ r: 5.5, strokeWidth: 2.5, fill: "var(--card)", stroke: "var(--tbd-brand)" }}
              connectNulls
              isAnimationActive={false}
            >
              <LabelList
                dataKey="value"
                position="top"
                offset={9}
                style={{ fontSize: 12, fontWeight: 700, fill: "var(--tbd-ink)" }}
              />
            </Line>
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
    <div className="flex items-center gap-[18px]">
      <svg
        viewBox="0 0 80 80"
        className="size-[92px] shrink-0"
        role="img"
        aria-label={`${percent}% of sessions done`}
      >
        <circle cx="40" cy="40" r={radius} className="fill-none stroke-mint" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          className="fill-none stroke-brand transition-[stroke-dashoffset]"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          transform="rotate(-90 40 40)"
        />
        <text x="40" y="45" textAnchor="middle" className="fill-ink text-[15px] font-extrabold">
          {percent}%
        </text>
      </svg>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="m-0 text-[28px] font-extrabold leading-[1.1] text-ink">
          {completed}
          <span className="text-base font-medium text-ink-muted"> / {planned}</span>
        </p>
        <p className="m-0 max-w-[200px] text-[13px] text-ink-muted">
          therapy sessions completed across all visits
        </p>
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

export interface TherapyProgressViewProps {
  progress: TherapyProgress | undefined;
  isLoading: boolean;
  /** Message when the progress could not be loaded. */
  error?: string | null;
}

/** Layout of the Progress section. Data comes in through props. */
export function TherapyProgressView({ progress, isLoading, error = null }: TherapyProgressViewProps) {
  const [metric, setMetric] = useState<MetricKey>("painScore");
  const plans = progress?.plans ?? [];
  const series = progress?.vitalsSeries ?? [];

  const trend = useMemo(() => buildTrend(series, metric), [series, metric]);
  const measuredCount = trend.filter((point) => point.value !== null).length;
  const activeMetric = METRICS.find((entry) => entry.key === metric) ?? DEFAULT_METRIC;
  const visitCount = useMemo(() => new Set(plans.map((plan) => plan.visitId)).size, [plans]);

  return (
    <div className="flex flex-col gap-5">
      <Surface as="section" className="gap-4">
        <PlanCardHeader
          title="Progress"
          description={
            isLoading
              ? "Loading…"
              : plans.length === 0
                ? "No therapy has been planned for this patient yet."
                : `${plans.length} plan${plans.length === 1 ? "" : "s"} across ${visitCount} visit${visitCount === 1 ? "" : "s"}`
          }
        />

        {error ? <Note tone="rose">Could not load the progress. {error}</Note> : null}

        {isLoading ? (
          <div className="grid items-center gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
            <Skeleton className="h-[92px] w-64 rounded-2xl" />
            <Skeleton className="h-[150px] rounded-[14px]" />
          </div>
        ) : (
          <div
            className={cn(
              "grid items-center gap-5",
              plans.length > 0 && "lg:grid-cols-[330px_minmax(0,1fr)]",
            )}
          >
            <CompletionRing
              completed={progress?.totals.completed ?? 0}
              planned={progress?.totals.planned ?? 0}
            />

            {plans.length > 0 ? (
              <ul className="m-0 flex list-none flex-col divide-y divide-hair rounded-[14px] border border-line p-0">
                {plans.map((plan) => (
                  <li key={plan.id} className="flex flex-col gap-2.5 px-4 py-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5">
                        <span className="text-sm font-bold text-ink">{therapyProcedureLabel(plan)}</span>
                        <TherapyStatusBadge status={plan.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 text-xs text-ink-muted">
                        {plan.opdNumber ? <b className="font-bold text-ink-soft">{plan.opdNumber}</b> : null}
                        <span>{formatDateInIST(plan.startDate)}</span>
                        {plan.therapist ? <span>{plan.therapist.name}</span> : null}
                      </div>
                    </div>
                    <TherapyPlanProgress completed={plan.completedSessions} planned={plan.plannedSessions} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </Surface>

      <Surface as="section" className="gap-4">
        <PlanCardHeader
          title="Trend by visit"
          description={
            measuredCount === 0
              ? "Recorded in General Exam on each visit"
              : `${activeMetric.label} recorded on ${measuredCount} of ${series.length} visit${series.length === 1 ? "" : "s"}${activeMetric.note ? ` · ${activeMetric.note}` : ""}`
          }
        >
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
                    "inline-flex min-h-8 items-center gap-1.5 whitespace-nowrap rounded-full border px-[13px] text-xs transition-colors",
                    "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
                    active
                      ? "border-primary bg-primary font-bold text-primary-foreground"
                      : "border-line bg-card font-medium text-ink hover:bg-mint-soft",
                  )}
                >
                  {active ? <Check className="size-3.5" strokeWidth={2.6} aria-hidden="true" /> : null}
                  {entry.label}
                </button>
              );
            })}
          </div>
        </PlanCardHeader>

        {isLoading ? (
          <Skeleton className="h-[230px] rounded-2xl" />
        ) : measuredCount === 0 ? (
          <EmptyBlock
            icon={LineChartIcon}
            title={`No ${activeMetric.label.toLowerCase()} values recorded yet`}
            description="Values are recorded in General Exam on each visit."
            className="rounded-2xl border border-dashed border-line"
          />
        ) : (
          <div className="h-[230px] w-full">
            <TrendChart
              data={trend}
              label={activeMetric.label}
              unit={activeMetric.unit}
              fixedScale={metric === "painScore"}
            />
          </div>
        )}
      </Surface>
    </div>
  );
}

/**
 * Progress across visits: sessions done vs planned, every plan the patient
 * has had, and a per-visit trend of pain / weight / BMI / BP.
 */
export function TherapyProgressPanel({ clinicId, patientId }: TherapyProgressPanelProps) {
  const query = useTherapyProgress(clinicId, patientId);
  return (
    <TherapyProgressView
      progress={query.data}
      isLoading={query.isPending}
      error={query.error ? query.error.message : null}
    />
  );
}
