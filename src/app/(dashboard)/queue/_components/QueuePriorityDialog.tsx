"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChoiceChip, DialogActions, DialogBody, DialogError, DialogShell, Field } from "@/components/tbd";
import { QueuePatientSummary } from "./QueuePatientSummary";
import type { QueueDisplayItem } from "./queue.logic";
import {
  QUEUE_PRIORITY_OPTIONS,
  priorityReasonRequired,
  queuePriorityLabel,
  queuePriorityOf,
  type QueuePriority,
} from "./queue-roles.logic";

export interface QueuePriorityDialogProps {
  /** The patient whose priority is being set; null = closed. */
  item: QueueDisplayItem | null;
  isPending: boolean;
  error: string | null;
  onSubmit: (item: QueueDisplayItem, priority: QueuePriority, reason: string) => void;
  onClose: () => void;
}

/** RecPriority: Normal / Senior / Pregnant / Emergency with a reason (required for Emergency). Audited by the API. */
export function QueuePriorityDialog({ item, isPending, error, onSubmit, onClose }: QueuePriorityDialogProps) {
  return (
    <DialogShell
      open={!!item}
      onClose={onClose}
      busy={isPending}
      title="Set priority"
      description="Moves the patient up the queue. The doctor and the clinic admin can see who changed it."
      width={520}
    >
      {item ? <PriorityForm key={item.id} item={item} isPending={isPending} error={error} onSubmit={onSubmit} onClose={onClose} /> : null}
    </DialogShell>
  );
}

function PriorityForm({
  item,
  isPending,
  error,
  onSubmit,
  onClose,
}: Omit<QueuePriorityDialogProps, "item"> & { item: QueueDisplayItem }) {
  const current = queuePriorityOf(item);
  const [priority, setPriority] = useState<QueuePriority>(current === "NORMAL" ? "SENIOR" : current);
  const [reason, setReason] = useState("");
  const reasonRequired = priorityReasonRequired(priority);
  const blocked = isPending || (reasonRequired && reason.trim().length === 0) || priority === current;

  return (
    <>
      <DialogBody>
        <QueuePatientSummary item={item} />
        <p className="m-0 text-[13px] font-semibold text-ink-muted">Now: {queuePriorityLabel(current)}</p>
        <Field label="Priority">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label="Priority">
            {QUEUE_PRIORITY_OPTIONS.map((option) => (
              <ChoiceChip
                key={option.value}
                shape="box"
                size="lg"
                active={priority === option.value}
                onClick={() => setPriority(option.value)}
                className="flex-col items-start py-2.5"
              >
                <span className="block text-sm font-bold">{option.label}</span>
                <span className="block text-xs font-medium opacity-80">{option.hint}</span>
              </ChoiceChip>
            ))}
          </div>
        </Field>
        <Field
          label="Reason"
          htmlFor="queue-priority-reason"
          required={reasonRequired}
          hint={reasonRequired ? "Required for Emergency." : "Optional."}
        >
          <Textarea
            id="queue-priority-reason"
            value={reason}
            placeholder="For example: age 61 verified on ID at the desk"
            disabled={isPending}
            maxLength={300}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
        <DialogError message={error} />
      </DialogBody>
      <DialogActions>
        <Button variant="outline" size="md" disabled={isPending} onClick={onClose}>
          Cancel
        </Button>
        <Button size="md" disabled={blocked} onClick={() => onSubmit(item, priority, reason.trim())}>
          {isPending ? "Saving…" : `Set ${queuePriorityLabel(priority).toLowerCase()} priority`}
        </Button>
      </DialogActions>
    </>
  );
}
