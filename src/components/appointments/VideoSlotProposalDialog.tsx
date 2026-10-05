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
            <Video className="size-5 text-video" aria-hidden="true" />
            Propose other times
          </DialogTitle>
          <DialogDescription>
            If the time does not work, suggest up to 3 other times, or keep
            the original one.
          </DialogDescription>
        </DialogHeader>

        {/* Appointment summary */}
        <div className="flex flex-col gap-y-2 rounded-[14px] bg-well px-3.5 py-3 text-sm text-ink">
          <div className="flex items-center gap-2">
            <User className="size-4 shrink-0 text-brand" aria-hidden="true" />
            <span className="font-bold">{doctorName}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="size-4 shrink-0 text-brand" aria-hidden="true" />
            <span>Original date: {formatDateLabel(originalDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-brand" aria-hidden="true" />
            <span>Original time: {originalTime || "To be confirmed"}</span>
          </div>
        </div>

        <div className="flex flex-col gap-y-3 py-2">
          <p className="m-0 text-[13px] font-bold text-ink">Other times</p>
          {slots.map((slot, index) => (
            <div key={index} className="rounded-[14px] border border-line p-3">
                <p className="m-0 mb-2 text-xs font-semibold text-ink-muted">
                  Time {index + 1}
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
                      aria-invalid={Boolean(slot.date) && !isValidDate(slot.date)}
                      className={cn(
                        slot.date && !isValidDate(slot.date)
                          ? "border-[#e11d48]"
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
                    />
                  </div>
                </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              resetSlots();
              onOpenChange?.(false);
            }}
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button
            variant="soft"
            size="md"
            onClick={handleConfirmSlot}
            disabled={isConfirming}
          >
            {isConfirming ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Confirming…
              </>
            ) : (
              "Keep original time"
            )}
          </Button>
          <Button
            size="md"
            onClick={handlePropose}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Sending…
              </>
            ) : (
              "Send other times"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
