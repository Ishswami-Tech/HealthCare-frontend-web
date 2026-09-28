"use client";

import { runSave } from "./run-save";
import { RecordTherapySessionDialog } from "./RecordTherapySessionDialog";
import { useState } from "react";
import { Ban, ChevronDown, ChevronUp, Pause, Play, Plus, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatDateInIST, formatISODateInIST } from "@/lib/utils/date-time";
import {
  useCreateTherapyPlan,
  useTherapists,
  useUpdateTherapyPlan,
  useVisitTherapyPlans,
} from "@/hooks/query/useVisitTherapy";
import {
  THERAPY_PROCEDURES,
  THERAPY_PROCEDURE_LABELS,
  THERAPY_STATUS_LABELS,
  therapyProcedureLabel,
  type CreateTherapyPlanInput,
  type TherapyProcedure,
  type TherapyStatus,
  type VisitTherapyPlan,
  type VisitTherapySession,
} from "@/types/visit-therapy.types";

interface TherapyPlanPanelProps {
  clinicId: string;
  patientId: string;
  visitId: string;
}

const FREQUENCY_SUGGESTIONS = ["Daily", "Alternate days", "Twice a week", "Weekly", "Once"];
const UNASSIGNED = "__unassigned__";

const STATUS_CLASS: Record<TherapyStatus, string> = {
  SCHEDULED: "border-border/70 bg-background text-foreground",
  IN_PROGRESS: "border-transparent bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-100",
  COMPLETED:
    "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100",
  PAUSED: "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100",
  CANCELLED: "border-transparent bg-muted text-muted-foreground line-through",
};

export function TherapyStatusBadge({ status }: { status: TherapyStatus }) {
  return (
    <Badge variant="outline" className={cn("rounded-md", STATUS_CLASS[status])}>
      {THERAPY_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function TherapyPlanProgress({
  completed,
  planned,
  className,
}: {
  completed: number;
  planned: number;
  className?: string;
}) {
  const percent = planned > 0 ? Math.min(100, Math.round((completed / planned) * 100)) : 0;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Progress value={percent} className="h-2 flex-1" aria-label="Sessions completed" />
      <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
        {completed}/{planned} sessions
      </span>
    </div>
  );
}

function planDateRange(plan: VisitTherapyPlan): string {
  const start = formatDateInIST(plan.startDate);
  return plan.endDate ? `${start} – ${formatDateInIST(plan.endDate)}` : `from ${start}`;
}

function SessionList({ sessions }: { sessions: VisitTherapySession[] }) {
  if (sessions.length === 0) {
    return <p className="text-xs text-muted-foreground">No sessions recorded yet.</p>;
  }
  return (
    <ol className="flex flex-col divide-y divide-border/60 rounded-xl border border-border/60 bg-background/60">
      {sessions.map((session) => (
        <li key={session.id} className="grid grid-cols-[auto_1fr] gap-x-3 px-3 py-2 text-sm">
          <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
            {session.sessionNumber}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{formatDateInIST(session.sessionDate)}</span>
              {session.durationMinutes !== null ? <span>{session.durationMinutes} min</span> : null}
              {session.painScore !== null ? <span>Pain {session.painScore}/10</span> : null}
              {session.status !== "COMPLETED" ? (
                <span>{THERAPY_STATUS_LABELS[session.status] ?? session.status}</span>
              ) : null}
            </div>
            {session.observations ? (
              <p className="mt-1 text-sm text-foreground">{session.observations}</p>
            ) : null}
            {session.patientResponse ? (
              <p className="mt-0.5 text-xs text-muted-foreground">Response: {session.patientResponse}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

interface PlanCardProps {
  clinicId: string;
  plan: VisitTherapyPlan;
  onStatus: (planId: string, status: TherapyStatus) => Promise<unknown>;
  busy: boolean;
}

function PlanCard({ clinicId, plan, onStatus, busy }: PlanCardProps) {
  const [showSessions, setShowSessions] = useState(false);
  const isClosed = plan.status === "COMPLETED" || plan.status === "CANCELLED";
  const resumeTo: TherapyStatus = plan.completedSessions > 0 ? "IN_PROGRESS" : "SCHEDULED";

  return (
    <div className="flex flex-col gap-y-3 rounded-xl border border-border/70 bg-background/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-semibold text-foreground">{therapyProcedureLabel(plan)}</h4>
            <TherapyStatusBadge status={plan.status} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{planDateRange(plan)}</span>
            {plan.frequency ? <span>{plan.frequency}</span> : null}
            <span className="inline-flex items-center gap-1">
              <UserRound className="size-3" />
              {plan.therapist?.name ?? "Unassigned"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RecordTherapySessionDialog clinicId={clinicId} plan={plan} disabled={busy} />
          {plan.status === "PAUSED" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void onStatus(plan.id, resumeTo)}
            >
              <Play className="mr-1 size-4" />
              Resume
            </Button>
          ) : !isClosed ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void onStatus(plan.id, "PAUSED")}
            >
              <Pause className="mr-1 size-4" />
              Pause
            </Button>
          ) : null}
          {!isClosed ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={busy}
              onClick={() => {
                if (window.confirm("Cancel this therapy plan? Recorded sessions are kept.")) {
                  void onStatus(plan.id, "CANCELLED");
                }
              }}
            >
              <Ban className="mr-1 size-4" />
              Cancel
            </Button>
          ) : null}
        </div>
      </div>

      <TherapyPlanProgress completed={plan.completedSessions} planned={plan.plannedSessions} />

      {plan.medicinesUsed || plan.notes ? (
        <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          {plan.medicinesUsed ? (
            <p>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Medicines
              </span>
              <br />
              {plan.medicinesUsed}
            </p>
          ) : null}
          {plan.notes ? (
            <p>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notes
              </span>
              <br />
              {plan.notes}
            </p>
          ) : null}
        </div>
      ) : null}

      <div>
        <button
          type="button"
          onClick={() => setShowSessions((prev) => !prev)}
          aria-expanded={showSessions}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {showSessions ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          {plan.sessions.length} session{plan.sessions.length === 1 ? "" : "s"} recorded
        </button>
        {showSessions ? (
          <div className="mt-2">
            <SessionList sessions={plan.sessions} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface PlanDraft {
  procedure: TherapyProcedure;
  procedureLabel: string;
  plannedSessions: string;
  frequency: string;
  startDate: string;
  endDate: string;
  therapistUserId: string;
  medicinesUsed: string;
  notes: string;
}

function emptyPlanDraft(): PlanDraft {
  return {
    procedure: "ABHYANGA",
    procedureLabel: "",
    plannedSessions: "7",
    frequency: "Daily",
    startDate: formatISODateInIST(new Date()),
    endDate: "",
    therapistUserId: UNASSIGNED,
    medicinesUsed: "",
    notes: "",
  };
}

function toCreateInput(draft: PlanDraft): CreateTherapyPlanInput {
  return {
    procedure: draft.procedure,
    plannedSessions: Number.parseInt(draft.plannedSessions, 10),
    startDate: draft.startDate,
    ...(draft.procedureLabel.trim() ? { procedureLabel: draft.procedureLabel.trim() } : {}),
    ...(draft.frequency.trim() ? { frequency: draft.frequency.trim() } : {}),
    ...(draft.endDate ? { endDate: draft.endDate } : {}),
    ...(draft.therapistUserId !== UNASSIGNED ? { therapistUserId: draft.therapistUserId } : {}),
    ...(draft.medicinesUsed.trim() ? { medicinesUsed: draft.medicinesUsed.trim() } : {}),
    ...(draft.notes.trim() ? { notes: draft.notes.trim() } : {}),
  };
}

interface AddPlanFormProps {
  clinicId: string;
  onSubmit: (input: CreateTherapyPlanInput) => Promise<boolean>;
  onCancel: () => void;
  isSaving: boolean;
}

function AddPlanForm({ clinicId, onSubmit, onCancel, isSaving }: AddPlanFormProps) {
  const therapists = useTherapists(clinicId);
  const [draft, setDraft] = useState<PlanDraft>(emptyPlanDraft);
  const sessions = Number.parseInt(draft.plannedSessions, 10);
  const sessionsValid = Number.isFinite(sessions) && sessions >= 1 && sessions <= 60;
  const datesValid = draft.startDate.length > 0 && (!draft.endDate || draft.endDate >= draft.startDate);
  const canSave = sessionsValid && datesValid && !isSaving;

  const set = <K extends keyof PlanDraft>(key: K, value: PlanDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!canSave) return;
    if (await onSubmit(toCreateInput(draft))) setDraft(emptyPlanDraft());
  };

  return (
    <div className="flex flex-col gap-y-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-y-1">
          <Label htmlFor="therapy-procedure">Procedure</Label>
          <Select
            value={draft.procedure}
            onValueChange={(value) => set("procedure", value as TherapyProcedure)}
          >
            <SelectTrigger id="therapy-procedure">
              <SelectValue placeholder="Select procedure" />
            </SelectTrigger>
            <SelectContent>
              {THERAPY_PROCEDURES.map((procedure) => (
                <SelectItem key={procedure} value={procedure}>
                  {THERAPY_PROCEDURE_LABELS[procedure]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-y-1">
          <Label htmlFor="therapy-label">Label (optional)</Label>
          <Input
            id="therapy-label"
            placeholder="e.g. Sarvanga Abhyanga"
            value={draft.procedureLabel}
            onChange={(event) => set("procedureLabel", event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label htmlFor="therapy-sessions">Sessions</Label>
          <Input
            id="therapy-sessions"
            type="number"
            inputMode="numeric"
            min={1}
            max={60}
            value={draft.plannedSessions}
            aria-invalid={!sessionsValid}
            onChange={(event) => set("plannedSessions", event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label htmlFor="therapy-frequency">Frequency</Label>
          <Input
            id="therapy-frequency"
            list="therapy-frequency-suggestions"
            placeholder="Daily"
            value={draft.frequency}
            onChange={(event) => set("frequency", event.target.value)}
          />
          <datalist id="therapy-frequency-suggestions">
            {FREQUENCY_SUGGESTIONS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
        <div className="flex flex-col gap-y-1">
          <Label htmlFor="therapy-start">Start date</Label>
          <Input
            id="therapy-start"
            type="date"
            value={draft.startDate}
            onChange={(event) => set("startDate", event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label htmlFor="therapy-end">End date (optional)</Label>
          <Input
            id="therapy-end"
            type="date"
            min={draft.startDate}
            value={draft.endDate}
            aria-invalid={!datesValid}
            onChange={(event) => set("endDate", event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label htmlFor="therapy-therapist">Therapist</Label>
          <Select value={draft.therapistUserId} onValueChange={(value) => set("therapistUserId", value)}>
            <SelectTrigger id="therapy-therapist">
              <SelectValue placeholder={therapists.isPending ? "Loading…" : "Assign therapist"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
              {(therapists.data ?? []).map((therapist) => (
                <SelectItem key={therapist.userId} value={therapist.userId}>
                  {therapist.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-y-1 md:col-span-2">
          <Label htmlFor="therapy-medicines">Medicines / oils used</Label>
          <Input
            id="therapy-medicines"
            placeholder="e.g. Dhanwantharam taila"
            value={draft.medicinesUsed}
            onChange={(event) => set("medicinesUsed", event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-y-1 md:col-span-2 lg:col-span-3">
          <Label htmlFor="therapy-notes">Notes</Label>
          <Textarea
            id="therapy-notes"
            rows={2}
            placeholder="Instructions for the therapist"
            value={draft.notes}
            onChange={(event) => set("notes", event.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button size="sm" onClick={() => void handleSave()} disabled={!canSave}>
          {isSaving ? "Saving..." : "Save plan"}
        </Button>
      </div>
    </div>
  );
}

/**
 * Therapy / Panchakarma plans for this visit: the doctor plans procedures
 * here, the therapist (or anyone at the table) records sessions.
 */
export function TherapyPlanPanel({ clinicId, visitId }: TherapyPlanPanelProps) {
  const plansQuery = useVisitTherapyPlans(clinicId, visitId);
  const create = useCreateTherapyPlan();
  const update = useUpdateTherapyPlan();
  const [showForm, setShowForm] = useState(false);
  const plans = plansQuery.data ?? [];
  const busy = create.isPending || update.isPending;

  const handleCreate = async (input: CreateTherapyPlanInput) => {
    const saved = await runSave(() => create.mutateAsync({ clinicId, visitId, input }));
    if (saved) setShowForm(false);
    return saved;
  };

  const handleStatus = (planId: string, status: TherapyStatus) =>
    runSave(() => update.mutateAsync({ clinicId, planId, input: { status } }));

  const totalPlanned = plans
    .filter((plan) => plan.status !== "CANCELLED")
    .reduce((sum, plan) => sum + plan.plannedSessions, 0);
  const totalDone = plans
    .filter((plan) => plan.status !== "CANCELLED")
    .reduce((sum, plan) => sum + plan.completedSessions, 0);

  return (
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle className="text-base font-bold text-foreground">Therapy / Panchakarma</CardTitle>
          <p className="text-sm text-muted-foreground">
            {plans.length === 0
              ? plansQuery.isPending
                ? "Loading…"
                : "No therapy planned for this visit"
              : `${plans.length} plan${plans.length === 1 ? "" : "s"} · ${totalDone}/${totalPlanned} sessions done`}
          </p>
        </div>
        {!showForm ? (
          <Button size="sm" onClick={() => setShowForm(true)} disabled={busy}>
            <Plus className="mr-1 size-4" />
            Add therapy
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-y-4">
        {showForm ? (
          <AddPlanForm
            clinicId={clinicId}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            isSaving={create.isPending}
          />
        ) : null}

        {plans.length === 0 && !showForm ? (
          <p className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
            {plansQuery.isPending
              ? "Loading…"
              : "Use “Add therapy” to plan a procedure. Assigned therapists see it on their My Sessions list."}
          </p>
        ) : (
          plans.map((plan) => (
            <PlanCard
              key={plan.id}
              clinicId={clinicId}
              plan={plan}
              onStatus={handleStatus}
              busy={update.isPending}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
