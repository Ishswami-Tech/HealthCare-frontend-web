"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, Note, DialogActions, DialogBody, DialogShell } from "@/components/tbd";
import { QueuePatientSummary } from "./QueuePatientSummary";
import { isUnassignedQueueItem, type AssignableDoctor, type QueueDisplayItem } from "./queue.logic";

interface QueueAssignDoctorDialogProps {
  /** The patient who gets a doctor; null closes the dialog. */
  item: QueueDisplayItem | null;
  doctors: AssignableDoctor[];
  selectedDoctorId: string;
  error: string;
  isPending: boolean;
  onSelectDoctor: (doctorId: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

/** "Assign doctor": choose the doctor for one active queue appointment. */
export function QueueAssignDoctorDialog({
  item,
  doctors,
  selectedDoctorId,
  error,
  isPending,
  onSelectDoctor,
  onSubmit,
  onClose,
}: QueueAssignDoctorDialogProps) {
  const patientName = item?.patientName || "Patient";

  return (
    <DialogShell
      open={Boolean(item)}
      onClose={onClose}
      title="Assign Doctor"
      description="Assign a doctor to this active queue appointment."
      width={500}
      stretch
      cornerClose
    >
      <DialogBody>
        {item ? <QueuePatientSummary item={item} /> : null}

        <p className="m-0 text-sm text-ink-soft">
          {item && !isUnassignedQueueItem(item)
            ? `${patientName} is with ${item.doctorName}. Select another doctor to change this.`
            : `${patientName} is currently unassigned. Select a doctor.`}
        </p>

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-[#fecdd3] bg-[#fff1f2] px-3.5 py-2.5 text-sm text-[#9f1239] dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200"
          >
            {error}
          </div>
        ) : null}

        <Field label="Doctor" htmlFor="queue-assign-doctor">
          <Select value={selectedDoctorId} onValueChange={onSelectDoctor}>
            <SelectTrigger id="queue-assign-doctor" className="w-full">
              <SelectValue placeholder="Select doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {doctors.length === 0 ? <Note tone="amber">No doctors are listed for this clinic yet.</Note> : null}
      </DialogBody>

      <DialogActions>
        <Button variant="outline" size="md" onClick={onClose}>
          Cancel
        </Button>
        <Button size="md" onClick={onSubmit} disabled={isPending || !selectedDoctorId}>
          {isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Assigning…
            </>
          ) : (
            "Assign Doctor"
          )}
        </Button>
      </DialogActions>
    </DialogShell>
  );
}
