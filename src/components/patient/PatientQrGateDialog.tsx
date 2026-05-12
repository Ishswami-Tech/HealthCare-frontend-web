"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PatientQrGateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  closeLabel?: string;
  bookLabel?: string;
  onBookAppointment?: () => void;
};

export function PatientQrGateDialog({
  open,
  onOpenChange,
  title = "You need an in-person appointment",
  description = "QR scan is available only for in-person visits. Book an appointment first, then return here to scan the clinic QR.",
  closeLabel = "Close",
  bookLabel = "Book appointment",
  onBookAppointment,
}: PatientQrGateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {closeLabel}
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              onBookAppointment?.();
            }}
          >
            {bookLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
