"use client";

import { useMemo } from "react";
import { useQueryData } from "@/hooks/core/useQueryData";
import { usePatient } from "@/hooks/query/usePatients";
import { useVisitCaseSheet } from "@/hooks/query/usePatientVisits";
import { clinicApiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/config/config";
import { useAuthStore } from "@/stores/auth.store";
import { usePatientStore } from "@/stores";
import { extractPatients } from "../../_components/doctorPatients.logic";

type Raw = Record<string, unknown>;

const asRecord = (value: unknown): Raw =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};

const idOf = (value: unknown): string => {
  const id = asRecord(value).id;
  return typeof id === "string" ? id : "";
};

/** Most patients a doctor's list lookup asks for (the API caps a page at 200). */
const LOOKUP_LIMIT = 200;

export interface EhrPatientResult {
  /** The patient as the API sent it (flat, or with the person under `user`); null until found. */
  patient: Raw | null;
  loading: boolean;
  /** Nothing could be found for this id. */
  failed: boolean;
  retry: () => void;
}

/**
 * The patient behind `/doctor/patients/[id]`.
 *
 * `usePatient` (the clinic patient record) is asked first. When it has no answer, the page
 * still opens from data the doctor is already allowed to read: the patient list the doctor
 * came from, the doctor's own patient list, and the patient block of the selected OPD visit.
 */
export function useEhrPatient(
  clinicId: string,
  patientId: string,
  /** The selected OPD visit, and whether the visit list is still on its way. */
  visitId: string | null,
  visitsPending: boolean,
): EhrPatientResult {
  const patientQuery = usePatient(clinicId, patientId);
  const direct = idOf(patientQuery.data) ? asRecord(patientQuery.data) : null;

  // The row of the list the doctor clicked "View EHR" in (kept in the patient store).
  const stored = usePatientStore((state) => {
    const fromList = state.collections.doctor.find((item) => idOf(item) === patientId);
    return fromList ?? (idOf(state.selectedPatient) === patientId ? state.selectedPatient : null);
  });

  const directSettled = !patientQuery.isPending || Boolean(patientQuery.error);
  const needsLookup = Boolean(clinicId && patientId) && !direct && !stored && directSettled;

  const doctorUserId = useAuthStore((state) => state.session?.user?.id ?? "");
  const lookupFilters = useMemo(() => ({ limit: LOOKUP_LIMIT }), []);
  const lookupQuery = useQueryData(
    ["doctorPatients", clinicId, lookupFilters],
    async () => clinicApiClient.get(API_ENDPOINTS.DOCTORS.PATIENTS(clinicId, doctorUserId), lookupFilters),
    { enabled: needsLookup && Boolean(doctorUserId) },
  );
  const fromLookup = useMemo(() => {
    if (!lookupQuery.data) return null;
    const payload = asRecord(lookupQuery.data);
    const rows = extractPatients(lookupQuery.data);
    const list = rows.length > 0 ? rows : extractPatients(payload.data);
    return list.find((item) => idOf(item) === patientId) ?? null;
  }, [lookupQuery.data, patientId]);

  const lookupSettled = !needsLookup || !doctorUserId || !lookupQuery.isPending || Boolean(lookupQuery.error);
  const lookupMissed = needsLookup && !fromLookup && lookupSettled;
  const needsSheet = lookupMissed && Boolean(visitId);
  const sheetQuery = useVisitCaseSheet(clinicId, needsSheet && visitId ? visitId : "");
  const fromSheet = needsSheet && sheetQuery.data?.patient ? (sheetQuery.data.patient as unknown as Raw) : null;

  const patient = direct ?? (stored as Raw | null) ?? fromLookup ?? fromSheet;
  const loading =
    !patient &&
    (!directSettled ||
      (needsLookup && !lookupSettled) ||
      (lookupMissed && !visitId && visitsPending) ||
      (needsSheet && sheetQuery.isPending && !sheetQuery.error));

  return {
    patient,
    loading,
    failed: !patient && !loading,
    retry: () => {
      void patientQuery.refetch();
      if (needsLookup) void lookupQuery.refetch();
    },
  };
}
