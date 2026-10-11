"use client";

import { Button } from "@/components/ui/button";
import { FIELD_LABEL, Note, DialogBody, DialogShell } from "@/components/tbd";
import type { QueueFilterOption } from "@/types/api.types";
import { QueuePatientSummary } from "./QueuePatientSummary";
import { normalizeQueueToken, type QueueDisplayItem } from "./queue.logic";

interface QueueMoveToDialogProps {
  /** The patient being moved; null closes the dialog. */
  item: QueueDisplayItem | null;
  /** Every queue of the clinic. The patient's current queue is left out here. */
  options: QueueFilterOption[];
  onSelect: (item: QueueDisplayItem, option: QueueFilterOption) => void;
  onClose: () => void;
}

/** "Move to": pick the destination queue for one patient. Choosing a queue moves the patient. */
export function QueueMoveToDialog({ item, options, onSelect, onClose }: QueueMoveToDialogProps) {
  const destinations = item
    ? options.filter((option) => normalizeQueueToken(option.value) !== normalizeQueueToken(item.treatmentType))
    : [];

  return (
    <DialogShell
      open={Boolean(item)}
      onClose={onClose}
      title="Move To"
      description="Choose the destination queue for the selected patient."
      width={680}
      stretch
      cornerClose
      // Choosing a queue moves the patient at once, so the dialog opens with Close focused, not a queue.
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        if (event.currentTarget instanceof HTMLElement) {
          event.currentTarget.querySelector<HTMLElement>('[data-slot="dialog-close"]')?.focus();
        }
      }}
    >
      {item ? (
        <DialogBody>
          <QueuePatientSummary item={item} showCategory />

          {destinations.length === 0 ? (
            <Note tone="blue">There is no other queue to move this patient to.</Note>
          ) : (
            <div role="group" aria-labelledby="queue-move-to-label" className="flex flex-col gap-4">
              <span id="queue-move-to-label" className={FIELD_LABEL}>
                Destination queue
              </span>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {destinations.map((option) => (
                  <Button
                    key={option.value}
                    variant="outline"
                    size="lg"
                    className="h-auto min-h-10 w-full whitespace-normal px-3.5 py-2 text-center"
                    onClick={() => onSelect(item, option)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogBody>
      ) : null}
    </DialogShell>
  );
}
