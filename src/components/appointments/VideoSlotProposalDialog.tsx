"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateInIST } from "@/lib/utils/date-time";

import { proposeVideoAppointment, confirmVideoSlot } from "@/lib/actions/appointments.server";
import {
  dismissToast,
  showErrorToast,
  showSuccessToast,
  TOAST_IDS,
} from "@/hooks/utils/use-toast";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import {
  CalendarIcon,
  Clock,
  Video,
  User,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoSlotProposalDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  appointmentId: string;
  doctorName: string;
  patientId: string;
  doctorId: string;
  clinicId?: string;
  locationId?: string;
  duration: number;
  treatmentType?: string;
  originalDate: string;
  originalTime: string;
  trigger?: React.ReactNode;
}

interface SlotDraft {
  date: string;
  time: string;
}

const DEFAULT_SLOTS: SlotDraft[] = [
  { date: "", time: "" },
  { date: "", time: "" },
  { date: "", time: "" },
];

export function VideoSlotProposalDialog({
  open,
  onOpenChange,
  appointmentId,
  doctorName,
  patientId,
  doctorId,
  clinicId,
  locationId,
  duration,
  treatmentType,
  originalDate,
  originalTime,
  trigger,
}: VideoSlotProposalDialogProps) {
  const [slots, setSlots] = useState<SlotDraft[]>([...DEFAULT_SLOTS]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleSlotChange = (index: number, field: keyof SlotDraft, value: string) => {
    setSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  };

  const isValidDate = (value: string) => {
    if (!value) return false;
    const parsed = new Date(`${value}T00:00:00+05:30`);
    return !Number.isNaN(parsed.getTime());
  };

  const filledSlotsCount = slots.filter(
    (s) => isValidDate(s.date) && s.time.trim().length > 0
  ).length;

  const canSubmit = filledSlotsCount > 0 && !isSubmitting;

  const resetSlots = () => setSlots([...DEFAULT_SLOTS]);

  const handlePropose = async () => {
    const proposedSlots = slots
      .filter((s) => isValidDate(s.date) && s.time.trim().length > 0)
      .map((s) => ({ date: s.date, time: s.time }));

    if (proposedSlots.length === 0) {
      showErrorToast("Please fill in at least one alternative time slot.", {
        id: TOAST_IDS.APPOINTMENT.CREATE,
      });
      return;
    }

    setIsSubmitting(true);
    const toastId = TOAST_IDS.APPOINTMENT.CREATE;

    try {
      const result = await proposeVideoAppointment({
        patientId,
        doctorId,
        clinicId,
        locationId,
        duration,
        treatmentType,
        proposedSlots,
      });

      if (result.success) {
        showSuccessToast("Alternative slots proposed successfully.", {
          id: toastId,
          description: "The doctor will review your proposed times.",
        });
        resetSlots();
        onOpenChange?.(false);
      } else {
        const message = sanitizeErrorMessage(
          new Error(result.error || "Failed to propose slots")
        );
        showErrorToast(message, { id: toastId });
      }
    } catch (error) {
      const message = sanitizeErrorMessage(
        error instanceof Error ? error : new Error("Failed to propose slots")
      );
      showErrorToast(message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSlot = async () => {
    // If the patient is simply confirming the doctor's original proposed slot,
    // they can choose index 0 to accept. The component defaults to showing
    // the original slot as the first entry for convenience.
    setIsConfirming(true);
    const toastId = TOAST_IDS.GLOBAL.SUCCESS;

    try {
      const result = await confirmVideoSlot(appointmentId, {
        confirmedSlotIndex: 0,
      });

      if (result.success) {
        showSuccessToast("Time slot confirmed.", {
          id: toastId,
          description: "Your video appointment has been confirmed.",
        });
        onOpenChange?.(false);
      } else {
        const message = sanitizeErrorMessage(
          new Error(result.error || "Failed to confirm slot")
        );
        showErrorToast(message, { id: toastId });
      }
    } catch (error) {
      const message = sanitizeErrorMessage(
        error instanceof Error ? error : new Error("Failed to confirm slot")
      );
      showErrorToast(message, { id: toastId });
    } finally {
      setIsConfirming(false);
    }
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return "Pick date";
    const parsed = new Date(`${dateStr}T00:00:00+05:30`);
    if (Number.isNaN(parsed.getTime())) return "Invalid date";
    return formatDateInIST(parsed, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="size-5 text-primary" />
            Propose Alternative Video Slots
          </DialogTitle>
          <DialogDescription>
            The proposed time does not work? Suggest up to 3 alternative
            slots, or confirm the original slot.
          </DialogDescription>
        </DialogHeader>

        {/* Appointment summary */}
        <Card className="border-border/60 bg-muted/30">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span className="font-medium">{doctorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="size-4 text-muted-foreground" />
                <span>Original: {formatDateLabel(originalDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <span>Original: {originalTime || "Time TBD"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-y-3 py-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Alternative Time Slots
          </p>
          {slots.map((slot, index) => (
            <Card
              key={index}
              className="border-border/60"
            >
              <CardContent className="p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Slot {index + 1}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-y-1.5">
                    <Label
                      htmlFor={`slot-date-${index}`}
                      className="text-xs font-medium"
                    >
                      Date
                    </Label>
                    <Input
                      id={`slot-date-${index}`}
                      type="date"
                      value={slot.date}
                      onChange={(e) =>
                        handleSlotChange(index, "date", e.target.value)
                      }
                      className={cn(
                        "h-9 text-sm",
                        slot.date && !isValidDate(slot.date)
                          ? "border-red-400"
                          : ""
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-y-1.5">
                    <Label
                      htmlFor={`slot-time-${index}`}
                      className="text-xs font-medium"
                    >
                      Time
                    </Label>
                    <Input
                      id={`slot-time-${index}`}
                      type="time"
                      value={slot.time}
                      onChange={(e) =>
                        handleSlotChange(index, "time", e.target.value)
                      }
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => {
              resetSlots();
              onOpenChange?.(false);
            }}
            disabled={isSubmitting}
            className="h-10 rounded-xl border-border/50"
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleConfirmSlot}
            disabled={isConfirming}
            className="h-10 rounded-xl"
          >
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Confirming...
              </>
            ) : (
              "Accept Original Slot"
            )}
          </Button>
          <Button
            onClick={handlePropose}
            disabled={!canSubmit}
            className="h-10 rounded-xl bg-primary hover:bg-primary/90 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Proposing...
              </>
            ) : (
              "Propose Alternatives"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
