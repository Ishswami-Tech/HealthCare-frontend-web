"use client";

import { Calendar, ScanQrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconBox } from "@/components/tbd";

type PatientQrGateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  closeLabel?: string;
  bookLabel?: string;
  onBookAppointment?: () => void;
};

/**
 * Shown when a patient taps "check in" without an in-clinic visit. Check-in with the clinic QR
 * is only for in-clinic visits; a video visit never needs it.
 */
export function PatientQrGateDialog({
  open,
  onOpenChange,
  title = "You need an in-clinic visit",
  description = "Check-in with the clinic QR is only for in-clinic visits. Book a visit first, then scan the QR at the clinic.",
  closeLabel = "Close",
  bookLabel = "Book a visit",
  onBookAppointment,
}: PatientQrGateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-2.5">
          <IconBox icon={ScanQrCode} tone="mint" size={44} className="max-sm:mx-auto" />
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2.5 sm:justify-end">
          <Button variant="outline" size="md" onClick={() => onOpenChange(false)}>
            {closeLabel}
          </Button>
          {/* Booking is the amber action. */}
          <Button
            variant="action"
            size="md"
            onClick={() => {
              onOpenChange(false);
              onBookAppointment?.();
            }}
          >
            <Calendar aria-hidden="true" />
            {bookLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
