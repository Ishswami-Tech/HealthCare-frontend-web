"use client";

import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyBlock, InitialsAvatar, SearchBox } from "@/components/tbd";
import {
  getAppointmentReassignmentCandidates,
  reassignAppointmentDoctor,
} from "@/lib/actions/appointments.server";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { cn } from "@/lib/utils";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Stethoscope,
  ClipboardList,
} from "lucide-react";
import type { AppointmentReassignmentCandidate } from "@/types/appointment.types";

interface ReassignAppointmentDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  appointmentId: string;
  trigger?: React.ReactNode;
  onReassigned?: () => void;
}

interface SelectedCandidate extends AppointmentReassignmentCandidate {
  _selected: boolean;
}

export function ReassignAppointmentDialog({
  open,
  onOpenChange,
  appointmentId,
  trigger,
  onReassigned,
}: ReassignAppointmentDialogProps) {
  const [candidates, setCandidates] = useState<AppointmentReassignmentCandidate[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!open || !appointmentId) return;

    let cancelled = false;

    const fetchCandidates = async () => {
      setIsLoading(true);
      setError(null);
      setSelectedDoctorId("");
      setReason("");
      setSearchQuery("");

      try {
        const result = await getAppointmentReassignmentCandidates(appointmentId);

        if (!result.success) {
          const message = result.error || "Failed to load reassignment candidates";
          setError(message);
          setCandidates([]);
          return;
        }

        const list = Array.isArray(result.candidates) ? result.candidates : [];
        setCandidates(list);
      } catch (err) {
        const message = sanitizeErrorMessage(
          err instanceof Error ? err : new Error("Failed to load candidates")
        );
        setError(message);
        setCandidates([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchCandidates();

    return () => {
      cancelled = true;
    };
  }, [open, appointmentId]);

  const eligibleCandidates = candidates.filter((c) => c.eligible && !c.isCurrent);
  const currentDoctor = candidates.find((c) => c.isCurrent);

  const visibleCandidates = eligibleCandidates.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q) ||
      (c.reason ?? "").toLowerCase().includes(q)
    );
  });

  const canSubmit =
    selectedDoctorId.trim().length > 0 &&
    !isSubmitting &&
    !isLoading &&
    eligibleCandidates.length > 0;

  const handleSubmit = async () => {
    if (!selectedDoctorId) return;

    setIsSubmitting(true);
    const toastId = TOAST_IDS.APPOINTMENT.UPDATE;

    try {
      const result = await reassignAppointmentDoctor(appointmentId, {
        doctorId: selectedDoctorId,
        reason: reason.trim() || undefined,
      });

      if (result.success) {
        showSuccessToast("Appointment reassigned successfully.", {
          id: toastId,
          description: "The appointment has been transferred to the new doctor.",
        });
        setSelectedDoctorId("");
        setReason("");
        setCandidates([]);
        onOpenChange?.(false);
        onReassigned?.();
      } else {
        const message = sanitizeErrorMessage(
          new Error(result.error || "Failed to reassign appointment")
        );
        showErrorToast(message, { id: toastId });
      }
    } catch (error) {
      const message = sanitizeErrorMessage(
        error instanceof Error ? error : new Error("Failed to reassign appointment")
      );
      showErrorToast(message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      setSelectedDoctorId("");
      setReason("");
      setCandidates([]);
      setError(null);
      setSearchQuery("");
    }
    onOpenChange?.(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {trigger && (
        <DialogTrigger asChild>
          <button type="button">{trigger}</button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="size-5 text-brand" aria-hidden="true" />
            Reassign visit
          </DialogTitle>
          <DialogDescription>
            Pick another doctor for this visit.
          </DialogDescription>
        </DialogHeader>

        {/* Current doctor summary */}
        {currentDoctor && (
          <div className="rounded-[14px] bg-well px-3.5 py-3">
            <p className="m-0 mb-1.5 text-xs font-semibold text-ink-muted">Now with</p>
            <div className="flex items-center gap-2.5 text-sm">
              <InitialsAvatar name={currentDoctor.name} size={36} />
              <div className="min-w-0">
                <p className="m-0 truncate font-bold text-ink">{currentDoctor.name}</p>
                <p className="m-0 truncate text-xs text-ink-muted">{currentDoctor.role}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-y-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <p className="m-0 text-[13px] font-bold text-ink">Available doctors</p>
            {eligibleCandidates.length > 0 && (
              <span className="text-xs text-ink-muted">
                {eligibleCandidates.length} doctor
                {eligibleCandidates.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {/* Search */}
          {eligibleCandidates.length > 3 && (
            <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Search doctors" />
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center gap-2 py-8 text-ink-muted" role="status">
              <Loader2 className="size-6 animate-spin text-brand" aria-hidden="true" />
              <p className="m-0 text-sm">Loading doctors…</p>
            </div>
          )}

          {/* Error state */}
          {!isLoading && error && (
            <EmptyBlock
              className="py-6"
              icon={AlertTriangle}
              tone="rose"
              title="Could not load doctors"
              description={error}
              action={
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setError(null);
                    // Re-trigger the effect by toggling open state.
                    onOpenChange?.(false);
                    setTimeout(() => onOpenChange?.(true), 50);
                  }}
                >
                  <RefreshCw aria-hidden="true" />
                  Try again
                </Button>
              }
            />
          )}

          {/* Empty state */}
          {!isLoading &&
            !error &&
            eligibleCandidates.length === 0 &&
            candidates.length > 0 && (
              <EmptyBlock
                className="py-6"
                icon={Stethoscope}
                tone="slate"
                title="No doctor is free"
                description="No other doctor can take this visit right now."
              />
            )}

          {!isLoading && !error && candidates.length === 0 && (
            <EmptyBlock
              className="py-6"
              icon={Stethoscope}
              tone="slate"
              title="No doctors to show"
              description="No doctor can take over this visit."
            />
          )}

          {/* Candidates list */}
          {visibleCandidates.length > 0 && (
            <div className="flex max-h-64 flex-col gap-y-2 overflow-y-auto pr-1">
              {visibleCandidates.map((candidate) => {
                const isSelected = selectedDoctorId === candidate.id;

                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => setSelectedDoctorId(candidate.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[14px] border px-3.5 py-3 text-left transition-colors",
                      "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
                      isSelected
                        ? "border-brand bg-mint-soft"
                        : "border-line bg-card hover:bg-mint-soft"
                    )}
                  >
                    <InitialsAvatar name={candidate.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "m-0 truncate text-sm font-bold",
                          isSelected ? "text-brand-dark" : "text-ink"
                        )}
                      >
                        {candidate.name}
                      </p>
                      <p className="m-0 truncate text-xs text-ink-muted">
                        {candidate.role}
                        {candidate.isPrimary ? " · Primary doctor" : ""}
                        {candidate.reason ? ` · ${candidate.reason}` : ""}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="size-[18px] shrink-0 text-brand" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-y-2">
          <Label
            htmlFor="reassign-reason"
            className="text-[13px] font-semibold text-ink"
          >
            Reason <span className="font-medium text-ink-muted">(optional)</span>
          </Label>
          <Textarea
            id="reassign-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="For example: the doctor is away for an emergency"
            className="min-h-16"
          />
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button
            size="md"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Reassigning…
              </>
            ) : (
              "Reassign visit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
