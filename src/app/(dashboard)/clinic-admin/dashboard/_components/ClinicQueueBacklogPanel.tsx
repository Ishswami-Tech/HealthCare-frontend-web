"use client";

import { useMemo } from "react";
import { AlertCircle, Clock, RefreshCcw, Activity } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQueueDashboardSummary } from "@/hooks/query/useQueue";
import { formatDateTimeInIST } from "@/lib/utils/date-time";

function readCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value || 0);
}

function getQueueHealthLabel(health: Record<string, unknown> | undefined): { label: string; className: string } {
  const healthy = Boolean(health?.isHealthy ?? health?.healthy);
  return healthy
    ? { label: "Healthy", className: "border-emerald-200 bg-emerald-50 text-emerald-700" }
    : { label: "Attention", className: "border-amber-200 bg-amber-50 text-amber-700" };
}

function getJobStateLabel(state: string): { label: string; className: string } {
  switch (state.toUpperCase()) {
    case "WAITING":
      return { label: "Waiting", className: "border-sky-200 bg-sky-50 text-sky-700" };
    case "ACTIVE":
      return { label: "Active", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
    case "DELAYED":
      return { label: "Delayed", className: "border-amber-200 bg-amber-50 text-amber-700" };
    case "FAILED":
      return { label: "Failed", className: "border-rose-200 bg-rose-50 text-rose-700" };
    case "COMPLETED":
      return { label: "Completed", className: "border-slate-200 bg-slate-50 text-slate-700" };
    default:
      return { label: state || "Unknown", className: "border-border bg-background text-muted-foreground" };
  }
}

export function ClinicQueueBacklogPanel({ clinicId }: { clinicId?: string }) {
  const { data, isPending, isFetching, refetch } = useQueueDashboardSummary(clinicId, {
    enabled: !!clinicId,
    limit: 5,
  });

  const totals = data?.totals;
  const queueSummaries = useMemo(() => data?.queues || [], [data]);
  const generatedAt = data?.generatedAt ? formatDateTimeInIST(new Date(data.generatedAt)) : "";

  return (
    <Card className="overflow-hidden border border-slate-200 bg-slate-50/80 shadow-sm dark:border-slate-800 dark:bg-slate-950/20">
      <CardHeader className="border-b border-border bg-background/70 px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Activity className="size-4 text-primary" />
              Queue Job Backlog
            </CardTitle>
            <CardDescription className="text-xs">
              Read-only background job snapshot for clinic operations and admin review.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-8 gap-2 border-border bg-card px-3 text-xs font-semibold"
          >
            <RefreshCcw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {isPending ? (
          <Empty>
            <EmptyContent>
              <EmptyMedia>
                <Clock className="size-5" />
              </EmptyMedia>
              <EmptyTitle>Loading queue backlog</EmptyTitle>
              <EmptyDescription>The admin queue snapshot is being fetched from the backend.</EmptyDescription>
            </EmptyContent>
          </Empty>
        ) : !queueSummaries.length ? (
          <Empty>
            <EmptyContent>
              <EmptyMedia>
                <AlertCircle className="size-5" />
              </EmptyMedia>
              <EmptyTitle>No queue jobs found</EmptyTitle>
              <EmptyDescription>
                The backend did not return any waiting, active, delayed, or failed jobs for this clinic.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
              <div className="rounded-xl border border-border bg-background p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Queues
                </div>
                <div className="mt-1 text-2xl font-semibold">{readCount(totals?.queues)}</div>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Jobs shown
                </div>
                <div className="mt-1 text-2xl font-semibold">{readCount(totals?.jobs)}</div>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Waiting
                </div>
                <div className="mt-1 text-2xl font-semibold">{readCount(totals?.waiting)}</div>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Active
                </div>
                <div className="mt-1 text-2xl font-semibold">{readCount(totals?.active)}</div>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Delayed
                </div>
                <div className="mt-1 text-2xl font-semibold">{readCount(totals?.delayed)}</div>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Failed
                </div>
                <div className="mt-1 text-2xl font-semibold">{readCount(totals?.failed)}</div>
              </div>
            </div>

            {generatedAt ? (
              <div className="text-xs text-muted-foreground">Generated at {generatedAt}</div>
            ) : null}

            <div className="space-y-4">
              {queueSummaries.map((queue) => {
                const healthLabel = getQueueHealthLabel(queue.health);
                const queueMetrics = queue.metrics || {};
                const jobs = queue.jobs || [];

                return (
                  <div key={queue.queueName} className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold">{queue.queueName}</p>
                        <p className="text-xs text-muted-foreground">Background job queue snapshot</p>
                      </div>
                      <Badge variant="outline" className={healthLabel.className}>
                        {healthLabel.label}
                      </Badge>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-5">
                      {[
                        ["Waiting", readCount(queueMetrics.waiting)],
                        ["Active", readCount(queueMetrics.active)],
                        ["Delayed", readCount(queueMetrics.delayed)],
                        ["Failed", readCount(queueMetrics.failed)],
                        ["Completed", readCount(queueMetrics.completed)],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-border bg-muted/20 px-3 py-2">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {label}
                          </div>
                          <div className="mt-1 text-base font-semibold">{value as number}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 overflow-hidden rounded-xl border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="text-xs">State</TableHead>
                            <TableHead className="text-xs">Job</TableHead>
                            <TableHead className="text-xs">Time</TableHead>
                            <TableHead className="text-xs">Payload</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {jobs.length > 0 ? (
                            jobs.map((job) => {
                              const stateLabel = getJobStateLabel(job.state);
                              const payloadEntries = Object.entries(job.dataPreview || {});
                              return (
                                <TableRow key={`${queue.queueName}-${job.id}`} className="border-border/60">
                                  <TableCell className="py-2">
                                    <Badge variant="outline" className={stateLabel.className}>
                                      {stateLabel.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-2">
                                    <div className="min-w-0">
                                      <div className="truncate text-sm font-semibold">{job.name || "Job"}</div>
                                      <div className="text-[11px] text-muted-foreground">
                                        Attempts {job.attemptsMade} {job.priority !== null ? `• Priority ${job.priority}` : ""}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2 text-sm text-muted-foreground">
                                    {job.timestamp ? formatDateTimeInIST(new Date(job.timestamp), { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Pending"}
                                  </TableCell>
                                  <TableCell className="py-2">
                                    <div className="flex flex-wrap gap-1.5">
                                      {payloadEntries.length > 0 ? (
                                        payloadEntries.slice(0, 4).map(([key, value]) => (
                                          <Badge key={key} variant="secondary" className="rounded-full text-[10px]">
                                            {key}: {String(value)}
                                          </Badge>
                                        ))
                                      ) : (
                                        <span className="text-xs text-muted-foreground">No preview data</span>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                                No queue jobs returned for this queue.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
