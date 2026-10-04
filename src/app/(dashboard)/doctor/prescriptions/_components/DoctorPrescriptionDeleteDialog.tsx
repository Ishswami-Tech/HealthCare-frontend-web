"use client";

import { useRef } from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { InitialsAvatar } from "@/components/tbd";
import { prescriptionDateLabel, type DoctorPrescriptionRow } from "./doctor-prescriptions.logic";

export interface DoctorPrescriptionDeleteDialogProps {
  /** The prescription to delete; null closes the dialog. */
  prescription: DoctorPrescriptionRow | null;
  isDeleting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Asks before a prescription is deleted. Nothing is removed until "Delete prescription" is pressed. */
export function DoctorPrescriptionDeleteDialog({
  prescription,
  isDeleting = false,
  onConfirm,
  onClose,
}: DoctorPrescriptionDeleteDialogProps) {
  const keepButtonRef = useRef<HTMLButtonElement>(null);
  const meta = prescription
    ? [prescription.reference, prescriptionDateLabel(prescription.date)].filter(Boolean).join(" · ")
    : "";

  return (
    <Dialog
      open={prescription !== null}
      onOpenChange={(open) => {
        if (!open && !isDeleting) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex flex-col gap-0 overflow-hidden p-0 sm:max-w-[460px]"
        onOpenAutoFocus={(event) => {
          // Start on the safe choice.
          event.preventDefault();
          keepButtonRef.current?.focus();
        }}
      >
        {prescription ? (
          <>
            <div className="flex items-start gap-3 px-4 pb-3.5 pt-[22px] sm:px-6">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <DialogTitle>Delete this prescription?</DialogTitle>
                <DialogDescription>This cannot be undone.</DialogDescription>
              </div>
              <DialogClose
                disabled={isDeleting}
                className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-well text-ink-soft transition-colors hover:bg-line focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>

            <div className="px-4 pb-5 pt-1 sm:px-6">
              <div className="flex items-center gap-3 rounded-[14px] border border-hair bg-[#f8fafc] px-4 py-3 dark:bg-white/5">
                <InitialsAvatar name={prescription.patientName} size={40} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15px] font-extrabold text-ink">{prescription.patientName}</span>
                  {meta ? <span className="truncate text-xs font-medium text-ink-muted">{meta}</span> : null}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 gap-2.5 border-t border-hair bg-[#f8fafc] px-4 py-3.5 [&>*]:flex-1 sm:justify-end sm:px-6 sm:[&>*]:flex-none dark:bg-white/5">
              <Button ref={keepButtonRef} size="md" variant="outline" onClick={onClose} disabled={isDeleting}>
                Keep it
              </Button>
              <Button size="md" variant="danger" onClick={onConfirm} disabled={isDeleting}>
                <Trash2 aria-hidden="true" />
                {isDeleting ? "Deleting…" : "Delete prescription"}
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
