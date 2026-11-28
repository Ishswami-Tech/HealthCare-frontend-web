"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CancelWithReasonDialogProps {
  /** Patient name shown in the question; null closes the dialog. */
  patientName: string | null;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

/** The API refuses a cancellation without a reason, so the admin status menu asks for one first. */
export function CancelWithReasonDialog({
  patientName,
  submitting,
  onCancel,
  onConfirm,
}: CancelWithReasonDialogProps) {
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();

  const close = () => {
    setReason("");
    onCancel();
  };

  return (
    <Dialog open={patientName !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel this appointment?</DialogTitle>
          <DialogDescription>
            {patientName ? `${patientName}'s slot is released. ` : ""}You cannot undo this.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="admin-cancel-reason">Reason</Label>
          <Textarea
            id="admin-cancel-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="For example: patient asked to cancel"
            rows={3}
            maxLength={500}
          />
        </div>
        <DialogFooter className="gap-2.5">
          <Button variant="outline" onClick={close} disabled={submitting}>
            Keep appointment
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm(trimmed);
              setReason("");
            }}
            disabled={submitting || trimmed.length < 3}
          >
            {submitting ? "Cancelling…" : "Cancel appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
