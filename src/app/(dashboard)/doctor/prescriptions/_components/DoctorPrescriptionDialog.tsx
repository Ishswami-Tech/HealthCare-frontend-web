"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { DoctorPrescriptionEditForm } from "./doctor-prescriptions.logic";

export interface DoctorPrescriptionDialogProps {
  open: boolean;
  form: DoctorPrescriptionEditForm;
  isSaving?: boolean;
  onFormChange: (value: Partial<DoctorPrescriptionEditForm>) => void;
  onSave: () => void;
  onOpenChange: (open: boolean) => void;
}

const FIELD_LABEL = "text-xs font-bold text-ink-soft";

/** Edits the notes of a saved prescription (new ones are written from the patient's record). */
export function DoctorPrescriptionDialog({
  open,
  form,
  isSaving = false,
  onFormChange,
  onSave,
  onOpenChange,
}: DoctorPrescriptionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[560px]"
        onOpenAutoFocus={(event) => {
          // Start in the notes field instead of on the close button.
          event.preventDefault();
          document.getElementById("doctor-prescription-notes")?.focus();
        }}
      >
        <div className="flex items-start gap-3 px-4 pb-3.5 pt-[22px] sm:px-6">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <DialogTitle>Edit Prescription</DialogTitle>
            <DialogDescription>
              Update the diagnosis and clinical notes. Medicines and status change through the pharmacy.
            </DialogDescription>
          </div>
          <DialogClose className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-well text-ink-soft transition-colors hover:bg-line focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40">
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-5 pt-1 sm:px-6">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="doctor-prescription-notes" className={FIELD_LABEL}>
              Diagnosis / Notes
            </label>
            <Textarea
              id="doctor-prescription-notes"
              className="min-h-24 resize-none border-line"
              placeholder="Enter diagnosis or clinical notes..."
              value={form.notes}
              onChange={(event) => onFormChange({ notes: event.target.value })}
            />
          </div>
        </div>

        <div className="flex shrink-0 gap-2.5 border-t border-hair bg-[#f8fafc] px-4 py-3.5 [&>*]:flex-1 sm:justify-end sm:px-6 sm:[&>*]:flex-none dark:bg-white/5">
          <Button size="md" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="md" onClick={onSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
