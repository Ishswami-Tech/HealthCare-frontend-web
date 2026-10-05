"use client";

import { runSave } from "./run-save";
import { PLAN_DIALOG_CONTENT, PlanDialogBody, PlanDialogFooter, PlanDialogHeader, PlanField } from "./PlanShared";
import { useState, type ReactNode } from "react";
import { ClipboardPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatISODateInIST } from "@/lib/utils/date-time";
import { useRecordTherapySession } from "@/hooks/query/useVisitTherapy";
import {
  therapyProcedureLabel,
  type RecordTherapySessionInput,
  type VisitTherapyPlan,
} from "@/types/visit-therapy.types";

type PlanSummary = Pick<
  VisitTherapyPlan,
  "id" | "procedure" | "procedureLabel" | "plannedSessions" | "completedSessions" | "status"
>;

interface RecordTherapySessionDialogProps {
  clinicId: string;
  plan: PlanSummary;
  /** Custom trigger; defaults to a "Record session" button. */
  trigger?: ReactNode;
  disabled?: boolean;
}

interface SessionDraft {
  sessionDate: string;
  durationMinutes: string;
  observations: string;
  patientResponse: string;
  painScore: number | null;
}

const PAIN_SCORES = Array.from({ length: 11 }, (_, index) => index);

function emptyDraft(): SessionDraft {
  return {
    sessionDate: formatISODateInIST(new Date()),
    durationMinutes: "",
    observations: "",
    patientResponse: "",
    painScore: null,
  };
}

function toInput(draft: SessionDraft): RecordTherapySessionInput {
  const today = formatISODateInIST(new Date());
  const duration = Number.parseInt(draft.durationMinutes, 10);
  return {
    // Today keeps the real time of day; a back-dated entry is date-only.
    sessionDate: draft.sessionDate === today ? new Date().toISOString() : draft.sessionDate,
    ...(Number.isFinite(duration) && duration > 0 ? { durationMinutes: duration } : {}),
    ...(draft.observations.trim() ? { observations: draft.observations.trim() } : {}),
    ...(draft.patientResponse.trim() ? { patientResponse: draft.patientResponse.trim() } : {}),
    ...(draft.painScore !== null ? { painScore: draft.painScore } : {}),
  };
}

export interface RecordTherapySessionDialogViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PlanSummary;
  saving: boolean;
  /** Saves the session. Resolves to true when it was saved. */
  onSubmit: (input: RecordTherapySessionInput) => Promise<boolean>;
  /** Element that opens the dialog. */
  trigger?: ReactNode;
}

/** The "Record session" dialog itself: form state lives here, saving comes in through `onSubmit`. */
export function RecordTherapySessionDialogView({
  open,
  onOpenChange,
  plan,
  saving,
  onSubmit,
  trigger,
}: RecordTherapySessionDialogViewProps) {
  const [draft, setDraft] = useState<SessionDraft>(emptyDraft);
  const nextNumber = plan.completedSessions + 1;
  const canSave = draft.sessionDate.trim().length > 0 && !saving;

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (next) setDraft(emptyDraft());
  };

  const handleSave = async () => {
    if (!canSave) return;
    await onSubmit(toInput(draft));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent showCloseButton={false} className={cn(PLAN_DIALOG_CONTENT, "sm:max-w-[560px]")}>
        <PlanDialogHeader
          title={`Record session ${nextNumber} of ${plan.plannedSessions}`}
          description={therapyProcedureLabel(plan)}
        />

        <PlanDialogBody>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <PlanField label="Date" htmlFor="therapy-session-date">
              <Input
                id="therapy-session-date"
                type="date"
                value={draft.sessionDate}
                max={formatISODateInIST(new Date())}
                onChange={(event) => setDraft((prev) => ({ ...prev, sessionDate: event.target.value }))}
              />
            </PlanField>
            <PlanField label="Duration (minutes)" htmlFor="therapy-session-duration">
              <Input
                id="therapy-session-duration"
                type="number"
                inputMode="numeric"
                min={1}
                max={600}
                placeholder="e.g. 45"
                value={draft.durationMinutes}
                onChange={(event) => setDraft((prev) => ({ ...prev, durationMinutes: event.target.value }))}
              />
            </PlanField>
          </div>

          <div className="flex flex-col gap-2">
            <span id="therapy-session-pain-label" className="text-xs font-bold text-ink-soft">
              Pain score (0 = none, 10 = worst)
            </span>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-labelledby="therapy-session-pain-label">
              {PAIN_SCORES.map((score) => {
                const active = draft.painScore === score;
                return (
                  <button
                    key={score}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setDraft((prev) => ({ ...prev, painScore: active ? null : score }))}
                    className={cn(
                      "flex size-[38px] items-center justify-center rounded-full border text-sm transition-colors",
                      "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
                      active
                        ? "border-primary bg-primary font-extrabold text-primary-foreground"
                        : "border-line bg-card font-semibold text-ink hover:bg-mint-soft",
                    )}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
          </div>

          <PlanField label="Observations" htmlFor="therapy-session-observations">
            <Textarea
              id="therapy-session-observations"
              rows={2}
              placeholder="Procedure notes, tolerance, sweating, etc."
              value={draft.observations}
              onChange={(event) => setDraft((prev) => ({ ...prev, observations: event.target.value }))}
              className="min-h-[72px]"
            />
          </PlanField>
          <PlanField label="Patient response" htmlFor="therapy-session-response">
            <Textarea
              id="therapy-session-response"
              rows={2}
              placeholder="How the patient felt after the session"
              value={draft.patientResponse}
              onChange={(event) => setDraft((prev) => ({ ...prev, patientResponse: event.target.value }))}
              className="min-h-[72px]"
            />
          </PlanField>
        </PlanDialogBody>

        <PlanDialogFooter>
          <Button variant="outline" size="md" onClick={() => handleOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button size="md" onClick={() => void handleSave()} disabled={!canSave}>
            {saving ? "Saving..." : "Save session"}
          </Button>
        </PlanDialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Records one performed session against a therapy plan. Shared by the
 * case-sheet Therapy tab (doctor / nurse) and the therapist's work list.
 */
export function RecordTherapySessionDialog({
  clinicId,
  plan,
  trigger,
  disabled = false,
}: RecordTherapySessionDialogProps) {
  const record = useRecordTherapySession();
  const [open, setOpen] = useState(false);
  const closed = plan.status === "COMPLETED" || plan.status === "CANCELLED";

  const handleSubmit = async (input: RecordTherapySessionInput) => {
    const saved = await runSave(() => record.mutateAsync({ clinicId, planId: plan.id, input }));
    if (saved) setOpen(false);
    return saved;
  };

  return (
    <RecordTherapySessionDialogView
      open={open}
      onOpenChange={setOpen}
      plan={plan}
      saving={record.isPending}
      onSubmit={handleSubmit}
      trigger={
        trigger ?? (
          <Button disabled={disabled || closed}>
            <ClipboardPlus aria-hidden="true" />
            Record session
          </Button>
        )
      }
    />
  );
}
