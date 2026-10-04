"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Note } from "@/components/tbd";
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
    <Dialog
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[500px]">
        <DialogHeader className="gap-0.5 px-6 pb-3.5 pt-[22px] pr-16 text-left">
          <DialogTitle>Assign Doctor</DialogTitle>
          <DialogDescription>Assign a doctor to this active queue appointment.</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-6 pb-5 pt-1">
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

          <div className="flex min-w-0 flex-col gap-1.5">
            <label id="queue-assign-doctor-label" htmlFor="queue-assign-doctor" className="text-xs font-bold text-ink-soft">
              Doctor
            </label>
            <Select value={selectedDoctorId} onValueChange={onSelectDoctor}>
              <SelectTrigger id="queue-assign-doctor" aria-labelledby="queue-assign-doctor-label" className="w-full">
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
          </div>

          {doctors.length === 0 ? <Note tone="amber">No doctors are listed for this clinic yet.</Note> : null}
        </div>

        <div className="flex flex-col-reverse gap-2.5 border-t border-hair bg-[#f8fafc] px-6 py-3.5 dark:bg-white/5 sm:flex-row sm:justify-end">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
