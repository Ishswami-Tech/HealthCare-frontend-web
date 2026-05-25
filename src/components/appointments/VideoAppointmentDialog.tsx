"use client";

import { BookAppointmentDialog } from "./BookAppointmentDialog";

interface VideoAppointmentDialogProps {
  trigger?: React.ReactNode;
  clinicId?: string;
  locationId?: string;
  clinicName?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  onBooked?: () => void;
  initialServiceId?: string;
  initialDoctorId?: string;
  initialPatientId?: string;
}

/**
 * VideoAppointmentDialog - A convenience wrapper for BookAppointmentDialog
 * that forces video-only mode for appointments.
 *
 * NOTE: videoOnly is now the default in BookAppointmentDialog (hardcoded to VIDEO).
 * This wrapper is kept for semantic clarity and easy identification of video-specific usages.
 *
 * Flow: Date → Time → Confirm & Pay
 */
export function VideoAppointmentDialog(props: VideoAppointmentDialogProps) {
  return <BookAppointmentDialog {...props} />;
}