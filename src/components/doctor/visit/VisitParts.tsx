"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Check, Circle, Clock, Megaphone, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EmptyBlock,
  InitialsAvatar,
  LiveTag,
  LoadError,
  Pill,
  SectionTitle,
  SkeletonRows,
  Surface,
  VisitTypeChip,
  statusLabel,
  statusTone,
} from "@/components/tbd";
import { cn } from "@/lib/utils";
import { formatClock, type DoctorQueueLine } from "@/app/(dashboard)/doctor/dashboard/_components/doctor-dashboard.logic";
import { useNowTick, type DoctorVisitData } from "./useDoctorVisit";
import { elapsedLabel, isConsultRunning, type VisitStage } from "./visit-flow.logic";

/** Loading / not found / could not load for every visit screen; renders `children` once the visit is there. */
export function VisitGate({ visit, children }: { visit: DoctorVisitData; children: ReactNode }) {
  if (visit.loading) {
    return (
      <Surface flush aria-busy="true">
        <SkeletonRows rows={4} />
      </Surface>
    );
  }
  if (visit.error || !visit.appointment) {
    return (
      <Surface flush>
        <LoadError
          title="This visit could not be loaded"
          message={visit.error ? "Check the connection and try again." : "The appointment was not found."}
          onRetry={visit.retry}
        />
      </Surface>
    );
  }
  return <>{children}</>;
}

/** Patient strip at the top of the visit screens: who, token, visit type, status, consult timer. */
export function VisitPatientCard({ visit, aside }: { visit: DoctorVisitData; aside?: ReactNode }) {
  const appointment = visit.appointment;
  const running = appointment ? isConsultRunning({ status: appointment.statusEnum, startedAt: appointment.startedAt }) : false;
  const now = useNowTick(running);
  if (!appointment) return null;
  const meta = [appointment.patientMeta, visit.opdNumber ? `OPD ${visit.opdNumber}` : "", appointment.reason]
    .filter(Boolean)
    .join(" · ");
  const startedMs = appointment.startedAt ? Date.parse(appointment.startedAt) : null;

  return (
    <Surface className="gap-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        {visit.token ? (
          <span className="flex h-12 min-w-[64px] shrink-0 items-center justify-center rounded-[14px] bg-[#047857] px-2 text-base font-extrabold text-white">
            {visit.token}
          </span>
        ) : null}
        <InitialsAvatar name={appointment.patientName} size={48} />
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="m-0 text-lg font-extrabold text-ink">{appointment.patientName}</h2>
            <Pill tone={statusTone(appointment.statusEnum)}>{statusLabel(appointment.statusEnum)}</Pill>
            <VisitTypeChip type={appointment.type} />
          </div>
          {meta ? <p className="m-0 text-[13px] text-ink-muted">{meta}</p> : null}
          <p className="m-0 text-xs text-ink-muted">
            {appointment.dateLabel} · {appointment.timeLabel}
            {visit.locationName ? ` · ${visit.locationName}` : ""}
          </p>
        </div>
      </div>
      {running ? (
        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
          <LiveTag>In consult</LiveTag>
          <span className="text-2xl font-extrabold tabular-nums text-ink" aria-label="Time in consult">
            {elapsedLabel(startedMs, now)}
          </span>
          <span className="text-xs text-ink-muted">since {formatClock(appointment.startedAt)}</span>
        </div>
      ) : null}
      {aside}
    </Surface>
  );
}

const STAGE_ICON = {
  done: Check,
  current: Clock,
  todo: Circle,
  optional: Minus,
  skipped: Minus,
} as const;

const STAGE_TONE: Record<VisitStage["state"], string> = {
  done: "bg-[#047857] text-white",
  current: "bg-[#fef3c7] text-[#b45309] dark:bg-amber-500/15 dark:text-amber-300",
  todo: "bg-well text-ink-muted",
  optional: "bg-well text-ink-muted",
  skipped: "bg-well text-ink-muted",
};

const STAGE_TAG: Record<VisitStage["state"], { tone: "green" | "amber" | "slate"; label: string }> = {
  done: { tone: "green", label: "Done" },
  current: { tone: "amber", label: "Now" },
  todo: { tone: "slate", label: "Not yet" },
  optional: { tone: "slate", label: "Optional" },
  skipped: { tone: "slate", label: "Skipped" },
};

/** Visit progress: checked in -> with doctor -> prescription -> dispensing -> completed. */
export function VisitStageList({ stages }: { stages: readonly VisitStage[] }) {
  return (
    <ol className="m-0 flex list-none flex-col p-0" aria-label="Visit progress">
      {stages.map((stage, index) => {
        const Icon = STAGE_ICON[stage.state];
        const tag = STAGE_TAG[stage.state];
        return (
          <li key={stage.key} className="relative flex gap-3 pb-4 last:pb-0">
            {index < stages.length - 1 ? (
              <span className="absolute left-[13px] top-7 h-[calc(100%-24px)] w-px bg-hair" aria-hidden="true" />
            ) : null}
            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", STAGE_TONE[stage.state])}>
              <Icon className="size-3.5" strokeWidth={2.6} aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-ink">{stage.label}</span>
                <Pill tone={tag.tone}>{tag.label}</Pill>
              </div>
              <span className="text-xs text-ink-muted">{stage.detail}</span>
            </div>
            {stage.at ? <span className="shrink-0 text-xs font-semibold text-ink-muted">{formatClock(stage.at)}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

/** Checked-in patients waiting for the doctor; the first one can be called (doctor only). */
export function VisitQueueCard({
  lines,
  onCall,
  callPending,
  canCall,
  locationName,
}: {
  lines: readonly DoctorQueueLine[];
  onCall?: (line: DoctorQueueLine) => void;
  callPending?: boolean;
  /** False while this visit is still open: finish it before calling the next patient. */
  canCall: boolean;
  locationName?: string;
}) {
  return (
    <Surface>
      <SectionTitle
        title="Next in queue"
        description={`${lines.length} checked in${locationName ? ` · ${locationName}` : ""}`}
        action={
          <Link href="/queue" className="text-[13px] font-bold text-brand hover:underline">
            Full queue
          </Link>
        }
      />
      {lines.length === 0 ? (
        <EmptyBlock title="Nobody waiting" description="Patients appear here when they check in at the clinic." className="py-5" />
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {lines.slice(0, 4).map((line, index) => (
            <li key={line.key} className="flex items-center gap-3 border-b border-hair py-2.5 last:border-b-0">
              <span className="inline-flex h-7 min-w-9 items-center justify-center rounded-lg bg-mint px-1.5 text-xs font-extrabold text-brand-dark">
                {line.position}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-bold text-ink">{line.patientName}</span>
                <span className="truncate text-xs text-ink-muted">
                  {line.label}
                  {line.waitMinutes ? ` · ${line.waitMinutes} min waiting` : ""}
                </span>
              </span>
              {index === 0 && onCall ? (
                <Button
                  size="compact"
                  variant={canCall ? "default" : "outline"}
                  disabled={!canCall || callPending}
                  onClick={() => onCall(line)}
                  title={canCall ? undefined : "Complete the current visit first"}
                >
                  <Megaphone aria-hidden="true" />
                  Call
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}
