"use client";

import { runSave } from "./run-save";
import { RecordTherapySessionDialog } from "./RecordTherapySessionDialog";
import {
  PLAN_HEAD_BUTTON,
  PLAN_INNER_CARD,
  PlanCaption,
  PlanCardHeader,
  PlanConfirmDialog,
  PlanField,
} from "./PlanShared";
import { useState } from "react";
import { Ban, ChevronDown, ChevronUp, ClipboardList, Pause, Play, Plus, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EmptyBlock, Note, Pill, Surface, statusTone, type PillTone } from "@/components/tbd";
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

/**
 * Colour of a therapy status. Same as every other status tag, except that a
 * finished course is green (a good result) and a paused one is amber (waiting).
 */
function therapyTone(status: TherapyStatus): PillTone {
  if (status === "COMPLETED") return "green";
  if (status === "PAUSED") return "amber";
  return statusTone(status);
}

export function TherapyStatusBadge({ status }: { status: TherapyStatus }) {
  return <Pill tone={therapyTone(status)}>{THERAPY_STATUS_LABELS[status] ?? status}</Pill>;
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
      <span
        role="progressbar"
        aria-label="Sessions completed"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="block h-2 flex-1 overflow-hidden rounded bg-well"
      >
        <span className="block h-2 rounded bg-brand transition-[width]" style={{ width: `${percent}%` }} />
      </span>
      <span className="shrink-0 whitespace-nowrap text-xs font-semibold tabular-nums text-ink-muted">
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
    return <p className="m-0 text-xs text-ink-muted">No sessions recorded yet.</p>;
  }
  return (
    <ol className="m-0 flex list-none flex-col divide-y divide-hair rounded-[14px] border border-line bg-card p-0">
      {sessions.map((session) => {
        const meta = [
          session.durationMinutes !== null ? `${session.durationMinutes} min` : null,
          session.painScore !== null ? `Pain ${session.painScore}/10` : null,
          session.status !== "COMPLETED" ? (THERAPY_STATUS_LABELS[session.status] ?? session.status) : null,
        ].filter((entry): entry is string => entry !== null);
        return (
          <li key={session.id} className="flex gap-3 px-3.5 py-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-mint text-xs font-extrabold text-brand-dark">
              {session.sessionNumber}
            </span>
            <div className="flex min-w-0 flex-col gap-[3px]">
              <span className="text-xs text-ink-muted">
                <b className="font-bold text-ink">{formatDateInIST(session.sessionDate)}</b>
                {meta.map((entry) => ` · ${entry}`).join("")}
              </span>
              {session.observations ? (
                <span className="text-sm text-ink">{session.observations}</span>
              ) : null}
              {session.patientResponse ? (
                <span className="text-xs text-ink-muted">Response: {session.patientResponse}</span>
              ) : null}
            </div>
          </li>
        );
      })}
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
  const isClosed = plan.status === "COMPLETED" || plan.status === "CANCELLED";
  // An open plan shows its sessions straight away; a closed one keeps them folded.
  const [showSessions, setShowSessions] = useState(!isClosed);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const resumeTo: TherapyStatus = plan.completedSessions > 0 ? "IN_PROGRESS" : "SCHEDULED";

  return (
    <div className={cn(PLAN_INNER_CARD, "flex flex-col gap-3.5 p-[18px]")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <h3 className="m-0 text-base font-bold text-ink">{therapyProcedureLabel(plan)}</h3>
            <TherapyStatusBadge status={plan.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
            <span>{planDateRange(plan)}</span>
            {plan.frequency ? <span>{plan.frequency}</span> : null}
            <span className="inline-flex items-center gap-1">
              <UserRound className="size-[13px]" aria-hidden="true" />
              {plan.therapist?.name ?? "Unassigned"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RecordTherapySessionDialog clinicId={clinicId} plan={plan} disabled={busy} />
          {plan.status === "PAUSED" ? (
            <Button variant="outline" disabled={busy} onClick={() => void onStatus(plan.id, resumeTo)}>
              <Play aria-hidden="true" />
              Resume
            </Button>
          ) : !isClosed ? (
            <Button variant="outline" disabled={busy} onClick={() => void onStatus(plan.id, "PAUSED")}>
              <Pause aria-hidden="true" />
              Pause
            </Button>
          ) : null}
          {!isClosed ? (
            <Button variant="danger" disabled={busy} onClick={() => setConfirmCancel(true)}>
              <Ban aria-hidden="true" />
              Cancel
            </Button>
          ) : null}
        </div>
      </div>

      <TherapyPlanProgress completed={plan.completedSessions} planned={plan.plannedSessions} />

      {plan.medicinesUsed || plan.notes ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {plan.medicinesUsed ? (
            <div className="flex min-w-0 flex-col gap-[3px]">
              <PlanCaption>Medicines</PlanCaption>
              <span className="text-sm text-ink">{plan.medicinesUsed}</span>
            </div>
          ) : null}
          {plan.notes ? (
            <div className="flex min-w-0 flex-col gap-[3px]">
              <PlanCaption>Notes</PlanCaption>
              <span className="text-sm text-ink">{plan.notes}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setShowSessions((prev) => !prev)}
          aria-expanded={showSessions}
          className="inline-flex items-center gap-1 self-start rounded-md text-[13px] font-bold text-brand hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {showSessions ? (
            <ChevronUp className="size-[15px]" strokeWidth={2.4} aria-hidden="true" />
          ) : (
            <ChevronDown className="size-[15px]" strokeWidth={2.4} aria-hidden="true" />
          )}
          {plan.sessions.length} session{plan.sessions.length === 1 ? "" : "s"} recorded
        </button>
        {showSessions ? <SessionList sessions={plan.sessions} /> : null}
      </div>

      <PlanConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this therapy plan?"
        description={`"${therapyProcedureLabel(plan)}" will be marked as cancelled. Recorded sessions are kept.`}
        cancelLabel="Keep plan"
        confirmLabel="Cancel plan"
        confirmIcon={<Ban aria-hidden="true" />}
        onConfirm={() => void onStatus(plan.id, "CANCELLED")}
      />
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
  /** Empty until a choice is made; "Unassigned" and empty both save without a therapist. */
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
    therapistUserId: "",
    medicinesUsed: "",
    notes: "",
  };
}

function toCreateInput(draft: PlanDraft): CreateTherapyPlanInput {
  const hasTherapist = draft.therapistUserId !== "" && draft.therapistUserId !== UNASSIGNED;
  return {
    procedure: draft.procedure,
    plannedSessions: Number.parseInt(draft.plannedSessions, 10),
    startDate: draft.startDate,
    ...(draft.procedureLabel.trim() ? { procedureLabel: draft.procedureLabel.trim() } : {}),
    ...(draft.frequency.trim() ? { frequency: draft.frequency.trim() } : {}),
    ...(draft.endDate ? { endDate: draft.endDate } : {}),
    ...(hasTherapist ? { therapistUserId: draft.therapistUserId } : {}),
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
    <div className="flex flex-col gap-3.5 rounded-2xl border border-[#a7f3d0] bg-mint-soft p-[18px] dark:border-emerald-800">
      <h3 className="m-0 text-sm font-bold text-ink">New therapy plan</h3>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <PlanField label="Procedure" htmlFor="therapy-procedure">
          <Select
            value={draft.procedure}
            onValueChange={(value) => set("procedure", value as TherapyProcedure)}
          >
            <SelectTrigger id="therapy-procedure" className="w-full">
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
        </PlanField>
        <PlanField label="Label (optional)" htmlFor="therapy-label">
          <Input
            id="therapy-label"
            placeholder="e.g. Sarvanga Abhyanga"
            value={draft.procedureLabel}
            onChange={(event) => set("procedureLabel", event.target.value)}
          />
        </PlanField>
        <PlanField label="Sessions" htmlFor="therapy-sessions">
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
        </PlanField>
        <PlanField label="Frequency" htmlFor="therapy-frequency">
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
        </PlanField>
        <PlanField label="Start date" htmlFor="therapy-start">
          <Input
            id="therapy-start"
            type="date"
            value={draft.startDate}
            onChange={(event) => set("startDate", event.target.value)}
          />
        </PlanField>
        <PlanField label="End date (optional)" htmlFor="therapy-end">
          <Input
            id="therapy-end"
            type="date"
            min={draft.startDate}
            value={draft.endDate}
            aria-invalid={!datesValid}
            onChange={(event) => set("endDate", event.target.value)}
          />
        </PlanField>
        <PlanField label="Therapist" htmlFor="therapy-therapist">
          <Select
            value={draft.therapistUserId}
            onValueChange={(value) => set("therapistUserId", value)}
          >
            <SelectTrigger id="therapy-therapist" className="w-full">
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
        </PlanField>
        <PlanField label="Medicines / oils used" htmlFor="therapy-medicines" className="sm:col-span-2">
          <Input
            id="therapy-medicines"
            placeholder="e.g. Dhanwantharam taila"
            value={draft.medicinesUsed}
            onChange={(event) => set("medicinesUsed", event.target.value)}
          />
        </PlanField>
        <PlanField label="Notes" htmlFor="therapy-notes" className="sm:col-span-2 lg:col-span-3">
          <Textarea
            id="therapy-notes"
            rows={2}
            placeholder="Instructions for the therapist"
            value={draft.notes}
            onChange={(event) => set("notes", event.target.value)}
            className="min-h-16"
          />
        </PlanField>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 min-w-0 flex-1 basis-60 text-xs text-ink-muted">
          Sessions: 1 to 60. Frequency suggestions: {FREQUENCY_SUGGESTIONS.join(", ")}.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className={PLAN_HEAD_BUTTON} onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button className={PLAN_HEAD_BUTTON} onClick={() => void handleSave()} disabled={!canSave}>
            {isSaving ? "Saving..." : "Save plan"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export interface TherapyPlanViewProps {
  clinicId: string;
  plans: VisitTherapyPlan[];
  isLoading: boolean;
  /** Message when the plans could not be loaded. */
  error?: string | null;
  formOpen: boolean;
  onFormOpenChange: (open: boolean) => void;
  /** Resolves to true when the plan was saved (the form then closes). */
  onCreate: (input: CreateTherapyPlanInput) => Promise<boolean>;
  onStatus: (planId: string, status: TherapyStatus) => Promise<unknown>;
  creating: boolean;
  updating: boolean;
}

/** Layout of the Therapy section. Data and saving come in through props. */
export function TherapyPlanView({
  clinicId,
  plans,
  isLoading,
  error = null,
  formOpen,
  onFormOpenChange,
  onCreate,
  onStatus,
  creating,
  updating,
}: TherapyPlanViewProps) {
  const active = plans.filter((plan) => plan.status !== "CANCELLED");
  const totalPlanned = active.reduce((sum, plan) => sum + plan.plannedSessions, 0);
  const totalDone = active.reduce((sum, plan) => sum + plan.completedSessions, 0);

  return (
    <Surface as="section" className="gap-4">
      <PlanCardHeader
        title="Therapy / Panchakarma"
        description={
          plans.length === 0
            ? isLoading
              ? "Loading…"
              : "No therapy planned for this visit"
            : `${plans.length} plan${plans.length === 1 ? "" : "s"} · ${totalDone}/${totalPlanned} sessions done`
        }
      >
        {!formOpen ? (
          <Button className={PLAN_HEAD_BUTTON} onClick={() => onFormOpenChange(true)} disabled={creating || updating}>
            <Plus aria-hidden="true" />
            Add therapy
          </Button>
        ) : null}
      </PlanCardHeader>

      {error ? <Note tone="rose">Could not load the therapy plans. {error}</Note> : null}

      {formOpen ? (
        <AddPlanForm
          clinicId={clinicId}
          onSubmit={onCreate}
          onCancel={() => onFormOpenChange(false)}
          isSaving={creating}
        />
      ) : null}

      {plans.length === 0 ? (
        isLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : formOpen || error ? null : (
          <EmptyBlock
            icon={ClipboardList}
            title="No therapy planned yet"
            description="Use “Add therapy” to plan a procedure. Assigned therapists see it on their My Sessions list."
            className="rounded-2xl border border-dashed border-line"
          />
        )
      ) : (
        plans.map((plan) => (
          <PlanCard key={plan.id} clinicId={clinicId} plan={plan} onStatus={onStatus} busy={updating} />
        ))
      )}
    </Surface>
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

  const handleCreate = async (input: CreateTherapyPlanInput) => {
    const saved = await runSave(() => create.mutateAsync({ clinicId, visitId, input }));
    if (saved) setShowForm(false);
    return saved;
  };

  const handleStatus = (planId: string, status: TherapyStatus) =>
    runSave(() => update.mutateAsync({ clinicId, planId, input: { status } }));

  return (
    <TherapyPlanView
      clinicId={clinicId}
      plans={plansQuery.data ?? []}
      isLoading={plansQuery.isPending}
      error={plansQuery.error ? plansQuery.error.message : null}
      formOpen={showForm}
      onFormOpenChange={setShowForm}
      onCreate={handleCreate}
      onStatus={handleStatus}
      creating={create.isPending}
      updating={update.isPending}
    />
  );
}
