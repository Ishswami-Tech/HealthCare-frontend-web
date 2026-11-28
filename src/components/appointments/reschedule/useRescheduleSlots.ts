"use client";

import { asRow, firstText, type Row } from "@/components/patient/home/homeData";
import { getAppointmentViewState, normalizePatientAppointment } from "@/lib/utils/appointmentUtils";
import { useOpenSlots, type OpenSlots, type OpenSlotsTarget } from "../booking/useOpenSlots";

/** Doctor, clinic, location and mode of the visit being moved: the open times are looked up for these. */
export function rescheduleTarget(appointment: Row | null | undefined, fallbackClinicId = ""): OpenSlotsTarget {
  const row = appointment ?? {};
  return {
    doctorId: firstText(row.doctorId, asRow(row.doctor)?.id),
    clinicId: firstText(row.clinicId, asRow(row.clinic)?.id, fallbackClinicId),
    locationId: firstText(row.locationId, asRow(row.location)?.id),
    // Same test as the visit lists (`toManagerVisit`).
    isVideo: normalizePatientAppointment(row).isOnline || getAppointmentViewState(row).isVideo,
  };
}

/** The open times on `date` for moving `appointment`: same doctor, same visit type, same location. */
export function useRescheduleSlots(
  appointment: Row | null | undefined,
  date: string,
  { enabled = true, clinicId = "" }: { enabled?: boolean; clinicId?: string } = {},
): OpenSlots {
  return useOpenSlots(rescheduleTarget(appointment, clinicId), date, enabled);
}
