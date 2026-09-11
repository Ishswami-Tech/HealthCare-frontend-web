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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  getAppointmentReassignmentCandidates,
  reassignAppointmentDoctor,
} from "@/lib/actions/appointments.server";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { cn } from "@/lib/utils";
import {
  User,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Stethoscope,
  Search,
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
            <ClipboardList className="size-5 text-primary" />
            Reassign Appointment
          </DialogTitle>
          <DialogDescription>
            Select a replacement doctor for this appointment.
          </DialogDescription>
        </DialogHeader>

        {/* Current doctor summary */}
        {currentDoctor && (
          <Card className="border-border/60 bg-muted/30">
            <CardContent className="p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                Currently assigned to
              </p>
              <div className="flex items-center gap-2 text-sm">
                <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                  {currentDoctor.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{currentDoctor.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentDoctor.role}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-y-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Available Doctors
            </p>
            {eligibleCandidates.length > 0 && (
              <span className="text-[11px] text-muted-foreground">
                {eligibleCandidates.length} candidate
                {eligibleCandidates.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {/* Search */}
          {eligibleCandidates.length > 3 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search doctors..."
                className="pl-9 h-9 text-sm"
              />
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm">Loading candidates...</p>
            </div>
          )}

          {/* Error state */}
          {!isLoading && error && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">
              <AlertTriangle className="size-5 shrink-0" />
              <p className="font-semibold">Unable to load candidates</p>
              <p className="text-xs opacity-80">{error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 h-8 rounded-lg"
                onClick={() => {
                  setError(null);
                  // Re-trigger the effect by toggling open state.
                  onOpenChange?.(false);
                  setTimeout(() => onOpenChange?.(true), 50);
                }}
              >
                <RefreshCw className="mr-1.5 size-3.5" />
                Retry
              </Button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading &&
            !error &&
            eligibleCandidates.length === 0 &&
            candidates.length > 0 && (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                <Stethoscope className="size-8 opacity-40" />
                <p className="font-medium">No eligible doctors found</p>
                <p className="text-xs opacity-80">
                  There are no available replacement doctors for this
                  appointment right now.
                </p>
              </div>
            )}

          {!isLoading && !error && candidates.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              <Stethoscope className="size-8 opacity-40" />
              <p className="font-medium">No candidates available</p>
              <p className="text-xs opacity-80">
                The system could not find any doctors eligible for reassignment.
              </p>
            </div>
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
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {candidate.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate font-semibold text-sm",
                          isSelected ? "text-primary" : ""
                        )}
                      >
                        {candidate.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {candidate.role}
                        {candidate.isPrimary ? " · Primary doctor" : ""}
                        {candidate.reason ? ` · ${candidate.reason}` : ""}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="size-4 text-primary shrink-0" />
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
            className="text-xs font-semibold text-muted-foreground"
          >
            Reason <span className="opacity-60">(optional)</span>
          </Label>
          <Textarea
            id="reassign-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Doctor unavailable due to emergency"
            className="rounded-xl text-sm min-h-16"
          />
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
            className="h-10 rounded-xl border-border/50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-10 rounded-xl bg-primary hover:bg-primary/90 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Reassigning...
              </>
            ) : (
              "Confirm Reassignment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
