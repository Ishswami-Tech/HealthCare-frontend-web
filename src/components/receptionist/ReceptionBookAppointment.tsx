"use client";

import { CalendarPlus } from "lucide-react";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { Button } from "@/components/ui/button";
import { useReceptionLocation } from "./useReceptionDesk";

export interface ReceptionBookAppointmentProps {
  /** The patient to book for (reception patient detail); omit to pick one in the dialog. */
  patient?: { userId: string; patientId?: string; name: string; phone?: string; uhid?: string } | null;
  /** Called after a booking is created (refresh the visit lists). */
  onBooked?: () => void;
  variant?: "default" | "outline";
}

/**
 * "Book appointment" for the reception desk: a future in-clinic visit, booked on the patient's
 * behalf. It opens the same booking dialog the patient uses, in its staff mode: in-person only
 * (the server refuses video bookings by reception), the same calendar and slot rules
 * (booking/bookingDays + the availability API) and, before confirming, the patient's plan with
 * the clinic's plan-less visit rule from its settings. `POST /appointments` allows RECEPTIONIST.
 */
export function ReceptionBookAppointment({ patient, onBooked, variant = "outline" }: ReceptionBookAppointmentProps) {
  const { clinicId, locationId } = useReceptionLocation();
  const patientUserId = patient?.userId?.trim() ?? "";
  return (
    <BookAppointmentDialog
      {...(clinicId ? { clinicId } : {})}
      {...(locationId ? { locationId } : {})}
      {...(patientUserId
        ? {
            initialPatientId: patientUserId,
            initialPatient: {
              userId: patientUserId,
              displayName: patient?.name ?? "",
              ...(patient?.patientId ? { patientId: patient.patientId } : {}),
              ...(patient?.phone ? { phone: patient.phone } : {}),
              ...(patient?.uhid ? { uhid: patient.uhid } : {}),
            },
          }
        : {})}
      initialConsultationMode="IN_PERSON"
      {...(onBooked ? { onBooked } : {})}
      trigger={
        <Button
          variant={variant}
          size="md"
          disabled={!clinicId}
          aria-label={patient?.name ? `Book an appointment for ${patient.name}` : "Book an appointment"}
        >
          <CalendarPlus aria-hidden="true" /> Book appointment
        </Button>
      }
    />
  );
}
