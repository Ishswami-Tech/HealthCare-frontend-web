"use client";

import { runSave } from "./run-save";
import { useState, type ReactNode } from "react";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [draft, setDraft] = useState<SessionDraft>(emptyDraft);

  const closed = plan.status === "COMPLETED" || plan.status === "CANCELLED";
  const nextNumber = plan.completedSessions + 1;
  const canSave = draft.sessionDate.trim().length > 0 && !record.isPending;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setDraft(emptyDraft());
  };

  const handleSave = async () => {
    if (!canSave) return;
    const saved = await runSave(() =>
      record.mutateAsync({ clinicId, planId: plan.id, input: toInput(draft) }),
    );
    if (saved) setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" disabled={disabled || closed}>
            <ClipboardCheck className="mr-1 size-4" />
            Record session
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record session {nextNumber} of {plan.plannedSessions}</DialogTitle>
          <DialogDescription>{therapyProcedureLabel(plan)}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-y-1">
            <Label htmlFor="therapy-session-date">Date</Label>
            <Input
              id="therapy-session-date"
              type="date"
              value={draft.sessionDate}
              max={formatISODateInIST(new Date())}
              onChange={(event) => setDraft((prev) => ({ ...prev, sessionDate: event.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-y-1">
            <Label htmlFor="therapy-session-duration">Duration (minutes)</Label>
            <Input
              id="therapy-session-duration"
              type="number"
              inputMode="numeric"
              min={1}
              max={600}
              placeholder="e.g. 45"
              value={draft.durationMinutes}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, durationMinutes: event.target.value }))
              }
            />
          </div>
          <div className="flex flex-col gap-y-2 sm:col-span-2">
            <Label>Pain score (0 = none, 10 = worst)</Label>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Pain score">
              {PAIN_SCORES.map((score) => {
                const active = draft.painScore === score;
                return (
                  <button
                    key={score}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() =>
                      setDraft((prev) => ({ ...prev, painScore: active ? null : score }))
                    }
                    className={cn(
                      "size-9 rounded-full border text-sm font-medium transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/70 bg-background text-foreground hover:bg-muted",
                    )}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-y-1 sm:col-span-2">
            <Label htmlFor="therapy-session-observations">Observations</Label>
            <Textarea
              id="therapy-session-observations"
              rows={2}
              placeholder="Procedure notes, tolerance, sweating, etc."
              value={draft.observations}
              onChange={(event) => setDraft((prev) => ({ ...prev, observations: event.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-y-1 sm:col-span-2">
            <Label htmlFor="therapy-session-response">Patient response</Label>
            <Textarea
              id="therapy-session-response"
              rows={2}
              placeholder="How the patient felt after the session"
              value={draft.patientResponse}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, patientResponse: event.target.value }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={record.isPending}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={!canSave}>
            {record.isPending ? "Saving..." : "Save session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
