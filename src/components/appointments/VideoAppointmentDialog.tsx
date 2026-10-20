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
 * Flow: Date → Time → Confirm & Pay
 */
export function VideoAppointmentDialog(props: VideoAppointmentDialogProps) {
  return <BookAppointmentDialog {...props} videoOnly />;
}