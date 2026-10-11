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
import { asRecordOrEmpty, trimmedString } from "@/lib/utils/coerce";

type Raw = Record<string, unknown>;

const idOf = (value: unknown): string => trimmedString(asRecordOrEmpty(value).id);

/** The patient's USER id of a list row, a stored row or a case-sheet patient block. */
const userIdOf = (value: unknown): string => {
  const record = asRecordOrEmpty(value);
  return trimmedString(record.userId) || trimmedString(asRecordOrEmpty(record.user).id);
};

/** Most patients a doctor's list lookup asks for (the API caps a page at 200). */
const LOOKUP_LIMIT = 200;

export interface EhrPatientResult {
  /** The patient as the API sent it (flat, or with the person under `user`); null until found. */
  patient: Raw | null;
  /** The patient's USER id (User.id): what `/patients/:id` and the `/ehr/*` routes are keyed on. `""` until known. */
  patientUserId: string;
  loading: boolean;
  /** Nothing could be found for this id. */
  failed: boolean;
  retry: () => void;
}

/**
 * The patient behind `/doctor/patients/[id]`.
 *
 * The route id is the Patient-record id, and the backend finds one patient by USER id only
 * (`GET /patients/:userId`). So the row is resolved first, from data the doctor is already
 * allowed to read: the patient list the doctor came from (patient store), the doctor's own
 * patient list, then the patient block of the selected OPD visit. The row gives the user id,
 * and `usePatient` then reads the full record with it.
 */
export function useEhrPatient(
  clinicId: string,
  /** Patient-record id (Patient.id), as in the route. */
  patientId: string,
  /** The selected OPD visit, and whether the visit list is still on its way. */
  visitId: string | null,
  visitsPending: boolean,
): EhrPatientResult {
  // 1. The row of the list the doctor clicked "View EHR" in (kept in the patient store).
  const stored = usePatientStore((state) => {
    const fromList = state.collections.doctor.find((item) => idOf(item) === patientId);
    return fromList ?? (idOf(state.selectedPatient) === patientId ? state.selectedPatient : null);
  }) as Raw | null;

  // 2. The doctor's own patient list (a direct link, or a reload of this page).
  const needsLookup = Boolean(clinicId && patientId) && !stored;
  const doctorUserId = useAuthStore((state) => state.session?.user?.id ?? "");
  const lookupFilters = useMemo(() => ({ limit: LOOKUP_LIMIT }), []);
  const lookupQuery = useQueryData(
    ["doctorPatients", clinicId, lookupFilters],
    async () => clinicApiClient.get(API_ENDPOINTS.DOCTORS.PATIENTS(clinicId, doctorUserId), lookupFilters),
    { enabled: needsLookup && Boolean(doctorUserId) },
  );
  const fromLookup = useMemo(() => {
    if (!lookupQuery.data) return null;
    const payload = asRecordOrEmpty(lookupQuery.data);
    const rows = extractPatients(lookupQuery.data);
    const list = rows.length > 0 ? rows : extractPatients(payload.data);
    return list.find((item) => idOf(item) === patientId) ?? null;
  }, [lookupQuery.data, patientId]);

  // 3. The patient block of the selected OPD visit's case sheet.
  const lookupSettled = !needsLookup || !doctorUserId || !lookupQuery.isPending || Boolean(lookupQuery.error);
  const lookupMissed = needsLookup && !fromLookup && lookupSettled;
  const needsSheet = lookupMissed && Boolean(visitId);
  const sheetQuery = useVisitCaseSheet(clinicId, needsSheet && visitId ? visitId : "");
  const fromSheet = needsSheet && sheetQuery.data?.patient ? (sheetQuery.data.patient as unknown as Raw) : null;

  const row = stored ?? fromLookup ?? fromSheet;
  const patientUserId = userIdOf(row);

  // The full record, once the user id is known ("" keeps the query off). The row is shown
  // meanwhile, and stays when this request has no answer.
  const patientQuery = usePatient(clinicId, patientUserId);
  const direct = idOf(patientQuery.data) ? asRecordOrEmpty(patientQuery.data) : null;

  const patient = direct ?? row;
  const loading =
    !patient &&
    ((needsLookup && !lookupSettled) ||
      (lookupMissed && !visitId && visitsPending) ||
      (needsSheet && sheetQuery.isPending && !sheetQuery.error));

  return {
    patient,
    patientUserId,
    loading,
    failed: !patient && !loading,
    retry: () => {
      if (needsLookup) void lookupQuery.refetch();
      if (needsSheet) void sheetQuery.refetch();
      if (patientUserId) void patientQuery.refetch();
    },
  };
}
