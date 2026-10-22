"use client";

/**
 * Investigation orders (API_CONTRACT section 13): the doctor orders lab / imaging tests for a
 * patient; the doctor, assistant, lab and clinic admin read them; the doctor and lab move the status.
 */
import { useMutationOperation } from "../core/useMutationOperation";
import { useQueryData } from "../core/useQueryData";
import { TBD_CACHE } from "./tbdQueryKeys";
import { useCurrentClinicId } from "./useClinics";
import { clinicApiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/config/config";
import { asList, asRecordOrEmpty, textOf, trimmedString } from "@/lib/utils/coerce";

export type InvestigationUrgency = "ROUTINE" | "URGENT" | "STAT";
export type InvestigationStatus = "ORDERED" | "SAMPLE_COLLECTED" | "RESULT_READY" | "CANCELLED";
export type InvestigationKind = "LAB" | "IMAGING";

export interface InvestigationTest {
  name: string;
  kind: InvestigationKind;
}

export interface InvestigationOrder {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId: string;
  visitId: string;
  tests: InvestigationTest[];
  urgency: InvestigationUrgency;
  labDestination: string;
  notes: string;
  status: InvestigationStatus;
  orderedAt: string;
}

export interface CreateInvestigationInput {
  /** Patient-record id. */
  patientId: string;
  appointmentId?: string;
  visitId?: string;
  tests: InvestigationTest[];
  urgency?: InvestigationUrgency;
  labDestination?: string;
  notes?: string;
}

/** Invalidation prefix (every clinic); reads are keyed clinic first: ["investigations", clinicId, params]. */
const INVESTIGATIONS_KEY = ["investigations"] as const;

export function toInvestigationOrders(data: unknown): InvestigationOrder[] {
  const rows = Array.isArray(data) ? data : asList(asRecordOrEmpty(data).data);
  return rows.map((entry) => {
    const row = asRecordOrEmpty(entry);
    return {
      id: trimmedString(row.id),
      patientId: textOf(row.patientId),
      patientName: textOf(row.patientName) || "Patient",
      appointmentId: textOf(row.appointmentId),
      visitId: textOf(row.visitId),
      tests: asList(row.tests).map((test) => {
        const item = asRecordOrEmpty(test);
        return { name: textOf(item.name), kind: textOf(item.kind) === "IMAGING" ? "IMAGING" : "LAB" } as InvestigationTest;
      }),
      urgency: (textOf(row.urgency) || "ROUTINE") as InvestigationUrgency,
      labDestination: textOf(row.labDestination),
      notes: textOf(row.notes),
      status: (textOf(row.status) || "ORDERED") as InvestigationStatus,
      orderedAt: textOf(row.orderedAt) || textOf(row.createdAt),
    };
  });
}

export function useInvestigationOrders(filters: { patientId?: string; status?: InvestigationStatus } = {}, options?: { enabled?: boolean }) {
  const params: Record<string, string> = {};
  if (filters.patientId) params.patientId = filters.patientId;
  if (filters.status) params.status = filters.status;
  const clinicId = useCurrentClinicId();
  return useQueryData<InvestigationOrder[]>(
    [...INVESTIGATIONS_KEY, clinicId, params],
    async () => toInvestigationOrders((await clinicApiClient.get<unknown>(API_ENDPOINTS.INVESTIGATIONS.LIST, params)).data),
    { enabled: options?.enabled ?? true, ...TBD_CACHE.working },
  );
}

/** DOCTOR only on the server. */
export function useOrderInvestigations() {
  return useMutationOperation(
    async (input: CreateInvestigationInput) => (await clinicApiClient.post<unknown>(API_ENDPOINTS.INVESTIGATIONS.CREATE, input)).data,
    {
      toastId: "investigations-order",
      loadingMessage: "Ordering tests...",
      successMessage: "Tests ordered",
      invalidateQueries: [[...INVESTIGATIONS_KEY]],
    },
  );
}

export function useSetInvestigationStatus() {
  return useMutationOperation(
    async ({ id, status }: { id: string; status: Exclude<InvestigationStatus, "ORDERED"> }) =>
      (await clinicApiClient.patch<unknown>(API_ENDPOINTS.INVESTIGATIONS.STATUS(id), { status })).data,
    {
      toastId: "investigations-status",
      loadingMessage: "Updating...",
      successMessage: "Order updated",
      invalidateQueries: [[...INVESTIGATIONS_KEY]],
    },
  );
}
