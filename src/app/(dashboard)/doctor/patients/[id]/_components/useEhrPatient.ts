"use client";

import { useMemo } from "react";
import { usePatientDirectoryEntry } from "@/hooks/query/usePatientDirectory";
import { useVisitCaseSheet } from "@/hooks/query/usePatientVisits";
import { usePatientStore } from "@/stores";
import type { PatientDirectoryRow } from "@/types/patient-directory.types";

type Raw = Record<string, unknown>;

const asRecord = (value: unknown): Raw =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};

const idOf = (value: unknown): string => {
  const id = asRecord(value).id;
  return typeof id === "string" ? id : "";
};

export interface EhrPatientResult {
  /** The patient as the API sent it (flat, or with the person under `user`); null until found. */
  patient: Raw | null;
  loading: boolean;
  /** Nothing could be found for this id. */
  failed: boolean;
  retry: () => void;
}

/** A directory row in the flat shape the EHR page already reads (`id` is the Patient id). */
function directoryRowToPatient(row: PatientDirectoryRow): Raw {
  return {
    id: row.patientId,
    userId: row.userId,
    name: row.name,
    age: row.age,
    gender: row.gender,
    dateOfBirth: row.dateOfBirth,
    phone: row.phone,
    email: row.email,
    city: row.city,
    state: row.state,
    uhid: row.uhid,
    totalVisits: row.totalVisits,
    lastVisit: row.lastVisit,
  };
}

/**
 * The patient behind `/doctor/patients/[id]` (the id is the Patient id).
 *
 * The patient directory answers for any patient of the clinic, however many there are, and returns
 * the user id the EHR routes need plus the UHID and contact details kept outside the login. When it
 * has no answer, the page still opens from data the doctor is already allowed to read: the row the
 * doctor came from and the patient block of the selected OPD visit.
 */
export function useEhrPatient(
  clinicId: string,
  patientId: string,
  /** The selected OPD visit, and whether the visit list is still on its way. */
  visitId: string | null,
  visitsPending: boolean,
): EhrPatientResult {
  const entryQuery = usePatientDirectoryEntry(clinicId, patientId);
  const fromDirectory = entryQuery.data ? directoryRowToPatient(entryQuery.data) : null;
  const directorySettled = !entryQuery.isPending || Boolean(entryQuery.error);

  // The row of the list the doctor clicked "View EHR" in (kept in the patient store).
  const stored = usePatientStore((state) => {
    const fromList = state.collections.doctor.find((item) => idOf(item) === patientId);
    return fromList ?? (idOf(state.selectedPatient) === patientId ? state.selectedPatient : null);
  });

  const needsSheet = Boolean(clinicId && patientId) && !fromDirectory && !stored && directorySettled && Boolean(visitId);
  const sheetQuery = useVisitCaseSheet(clinicId, needsSheet && visitId ? visitId : "");
  const fromSheet = needsSheet && sheetQuery.data?.patient ? (sheetQuery.data.patient as unknown as Raw) : null;

  const patient = fromDirectory ?? (stored as Raw | null) ?? fromSheet;
  const loading =
    !patient &&
    (!directorySettled ||
      (!visitId && visitsPending) ||
      (needsSheet && sheetQuery.isPending && !sheetQuery.error));

  return {
    patient,
    loading,
    failed: !patient && !loading,
    retry: () => {
      void entryQuery.refetch();
    },
  };
}
