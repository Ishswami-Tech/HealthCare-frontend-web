"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { DoctorPrescriptionEditForm } from "./doctor-prescriptions.logic";

export interface DoctorPrescriptionDialogProps {
  open: boolean;
  /** "edit" hides the medicines field: only notes and status of a saved prescription change. */
  mode: "create" | "edit";
  form: DoctorPrescriptionEditForm;
  isSaving?: boolean;
  onFormChange: (value: Partial<DoctorPrescriptionEditForm>) => void;
  onSave: () => void;
  onOpenChange: (open: boolean) => void;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const FIELD_LABEL = "text-xs font-bold text-ink-soft";

/** Clinical Prescription dialog: the same dialog creates and edits. */
export function DoctorPrescriptionDialog({
  open,
  mode,
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
            <DialogTitle>{mode === "edit" ? "Edit Prescription" : "New Prescription"}</DialogTitle>
            <DialogDescription>
              Create or update a prescription with the patient&apos;s medication plan and clinical notes.
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

          {mode === "create" ? (
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor="doctor-prescription-medicines" className={FIELD_LABEL}>
                Medicines (comma-separated)
              </label>
              <Input
                id="doctor-prescription-medicines"
                placeholder="e.g. Paracetamol 500mg, Amoxicillin 250mg"
                value={form.medicines}
                onChange={(event) => onFormChange({ medicines: event.target.value })}
              />
            </div>
          ) : null}

          <fieldset className="m-0 flex min-w-0 flex-col gap-1.5 border-0 p-0">
            <legend className={cn(FIELD_LABEL, "mb-1.5 p-0")}>Status</legend>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {STATUS_OPTIONS.map((option) => {
                const active = form.status === option.value;
                return (
                  <label
                    key={option.value}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 text-sm transition-colors",
                      "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40",
                      active
                        ? "border-[#6ee7b7] bg-mint-soft font-bold text-brand-dark dark:border-emerald-700"
                        : "border-line bg-card font-medium text-ink hover:bg-mint-soft",
                    )}
                  >
                    <input
                      type="radio"
                      name="doctor-prescription-status"
                      value={option.value}
                      checked={active}
                      onChange={() => onFormChange({ status: option.value })}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                        active ? "border-brand" : "border-[#cbd5e1] dark:border-slate-500",
                      )}
                      aria-hidden="true"
                    >
                      {active ? <span className="size-2 rounded-full bg-brand" /> : null}
                    </span>
                    {option.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
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
