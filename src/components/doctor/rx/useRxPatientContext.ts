"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAppointment } from "@/hooks/query/useAppointments";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useCurrentDoctorEntityId } from "@/hooks/query/useDoctors";
import { usePatientDirectoryEntry } from "@/hooks/query/usePatientDirectory";
import { patientSummaryLine } from "@/app/(dashboard)/doctor/patients/_components/doctorPatients.logic";
import { formatTimeInIST, getAppointmentDateTimeValue, getAppointmentPatientName } from "@/lib/utils/appointmentUtils";
import { asRecordOrEmpty, textOf } from "@/lib/utils/coerce";
import { visitTypeLabel } from "@/components/tbd";

export interface RxPatientContext {
  clinicId: string;
  /** Doctor-record id of the signed-in doctor ("" until known). */
  doctorId: string;
  /** Patient-record id from `?patientId`, else the appointment's patient. */
  patientId: string;
  appointmentId: string;
  patientName: string;
  patientSummary: string;
  /** "In-clinic · 12:00 pm" when an appointment is given. */
  visitLabel: string;
  visitStatus: string;
  /** The appointment as the API sent it (for its saved visit note), or null. */
  appointment: Record<string, unknown> | null;
  loading: boolean;
  error: unknown;
  retry: () => void;
}

/**
 * The patient (and visit) a doctor screen works on, from `?patientId=` and / or `?appointmentId=`:
 * the patient directory gives the name, age and gender; the appointment gives the visit and its note.
 * Shared by the new prescription, diagnosis and investigations screens.
 */
export function useRxPatientContext(): RxPatientContext {
  const params = useSearchParams();
  const { clinicId } = useClinicContext();
  const { doctorId } = useCurrentDoctorEntityId(clinicId || undefined);
  const appointmentId = params.get("appointmentId")?.trim() ?? "";
  const appointmentQuery = useAppointment(appointmentId);
  const appointment = appointmentQuery.data ? asRecordOrEmpty(appointmentQuery.data) : null;
  const patientId =
    params.get("patientId")?.trim() || textOf(appointment?.patientId) || textOf(asRecordOrEmpty(appointment?.patient).id);
  const entryQuery = usePatientDirectoryEntry(clinicId || "", patientId);

  return useMemo(() => {
    const entry = entryQuery.data;
    const fromAppointment = appointment ? getAppointmentPatientName(appointment) : "";
    const startsAt = appointment ? getAppointmentDateTimeValue(appointment) : null;
    const visitLabel = appointment
      ? [visitTypeLabel(textOf(appointment.type) || textOf(appointment.appointmentType)), startsAt ? formatTimeInIST(startsAt) : ""]
          .filter(Boolean)
          .join(" · ")
      : "";
    return {
      clinicId: clinicId || "",
      doctorId,
      patientId,
      appointmentId,
      patientName: entry?.name || fromAppointment || "Patient",
      patientSummary: entry ? patientSummaryLine({ age: entry.age, gender: entry.gender ?? "" }) : "",
      visitLabel,
      visitStatus: appointment ? textOf(appointment.status) : "",
      appointment,
      loading: (Boolean(appointmentId) && appointmentQuery.isPending) || (Boolean(patientId) && entryQuery.isPending && !fromAppointment),
      error: appointmentQuery.error ?? (fromAppointment ? null : entryQuery.error),
      retry: () => {
        void appointmentQuery.refetch();
        void entryQuery.refetch();
      },
    };
  }, [appointment, appointmentId, appointmentQuery, clinicId, doctorId, entryQuery, patientId]);
}

/** The visit note saved on an appointment (`metadata.consultationDraft`) by the diagnosis screen or a consultation. */
export function visitNoteOf(appointment: Record<string, unknown> | null): {
  diagnosis: string;
  complaint: string;
  advice: string;
  symptoms: string[];
} {
  const metadata = asRecordOrEmpty(appointment?.metadata);
  const draft = asRecordOrEmpty(metadata.consultationDraft);
  const symptoms = Array.isArray(draft.symptoms) ? draft.symptoms.filter((item): item is string => typeof item === "string") : [];
  return {
    diagnosis: textOf(draft.diagnosis) || textOf(appointment?.diagnosis),
    complaint: textOf(appointment?.notes) || textOf(draft.notes) || textOf(appointment?.chiefComplaint) || textOf(appointment?.reason),
    advice: textOf(draft.treatmentPlan),
    symptoms,
  };
}
