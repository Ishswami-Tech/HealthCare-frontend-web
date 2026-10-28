"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DoctorEhrContent } from "../../patients/[id]/_components/DoctorEhrContent";
import type { PrescriptionSavedResult } from "@/components/doctor/QuickPrescriptionModal";

/**
 * The patient's case sheet / EHR, opened over the consultation screen instead of navigating away
 * to `/doctor/patients/[id]` — reported live: "Open case sheet" took the doctor off the
 * in-progress consultation (notes, prescribe, complete-without-medicine all live on that page),
 * so checking the record mid-consultation meant losing that screen and navigating back. Same
 * data and layout as the full page (`DoctorEhrContent`/`DoctorEhrView`), just embedded.
 */
export function DoctorCaseSheetDialog({
  open,
  onOpenChange,
  patientId,
  onPrescriptionSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  onPrescriptionSaved?: (result: PrescriptionSavedResult) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[88vh] w-full max-w-[calc(100%-2rem)] overflow-y-auto sm:max-w-3xl lg:max-w-5xl"
        showCloseButton
      >
        <DialogTitle className="sr-only">Case sheet</DialogTitle>
        {open ? (
          <DoctorEhrContent
            patientId={patientId}
            embedded
            {...(onPrescriptionSaved ? { onPrescriptionSaved } : {})}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
