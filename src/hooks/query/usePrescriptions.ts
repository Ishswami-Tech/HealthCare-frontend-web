import { keepPreviousData } from '@tanstack/react-query';
import { useQueryData } from '../core/useQueryData';
import { useMutationOperation } from '../core/useMutationOperation';
import { TOAST_IDS } from '../utils/use-toast';
import { useCurrentClinicId } from './useClinics';
import { ApiError, clinicApiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/config/config';
import type { Prescription } from '@/types/medical-records.types';
import type { PrescriptionItemPayload } from '@/components/doctor/rx/rx-form.logic';

/** The list routes answer a plain list; a `{ prescriptions }` or `{ data }` wrapper is read too. */
function toPrescriptionRows(payload: unknown): Prescription[] {
  if (Array.isArray(payload)) return payload as Prescription[];
  const record = (payload ?? {}) as { prescriptions?: unknown; data?: unknown };
  if (Array.isArray(record.prescriptions)) return record.prescriptions as Prescription[];
  if (Array.isArray(record.data)) return record.data as Prescription[];
  return [];
}

// ── Server-paged list (GET /pharmacy/prescriptions?page=…) ──────────────────

export type PrescriptionStatusParam = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DRAFT' | 'RETURNED';
export type PrescriptionPharmacyStageParam = 'PAYMENT_PENDING' | 'READY_TO_DISPENSE' | 'DISPENSED' | 'NOT_SENT';
export type PrescriptionSortParam = 'newest' | 'oldest' | 'patient';

/**
 * Query of the paged list. Only keys that are set go on the wire: the backend answers 400 to
 * unknown keys. Dates are IST day keys (`YYYY-MM-DD`, both ends inclusive).
 */
export interface PrescriptionListParams {
  page: number;
  limit: number;
  q?: string | undefined;
  status?: PrescriptionStatusParam | undefined;
  pharmacyStage?: PrescriptionPharmacyStageParam | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  patientId?: string | undefined;
  sort?: PrescriptionSortParam | undefined;
}

/**
 * One page of prescriptions. `legacy` means the backend still answers the whole list as a plain
 * array (no paging support yet): `rows` is then every prescription and the caller pages and
 * filters on the client.
 */
export interface PrescriptionPageResult {
  mode: 'server' | 'legacy';
  rows: Prescription[];
  total: number;
  page: number;
  limit: number;
}

/** GET /pharmacy/prescriptions/summary */
export interface PrescriptionSummary {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  drafts: number;
  today: number;
  uniquePatients: number;
}

export interface PrescriptionSummaryRange {
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
}

/** Every key starts with `prescriptions`, so the existing `['prescriptions']` invalidations reach them. */
export const prescriptionQueryKeys = {
  root: ['prescriptions'] as const,
  doctorPage: (clinicId: string, doctorId: string, params: PrescriptionListParams) =>
    ['prescriptions', 'doctor-page', clinicId, doctorId, params] as const,
  doctorSummary: (clinicId: string, doctorId: string, range: PrescriptionSummaryRange) =>
    ['prescriptions', 'doctor-summary', clinicId, doctorId, range] as const,
};

/** Drops unset and empty values, so `URLSearchParams` never sends `undefined` or `''`. */
function definedParams(params: object): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params).flatMap(([key, value]) =>
      value === undefined || value === null || value === '' ? [] : [[key, String(value)]],
    ),
  );
}

function finiteNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Reads both answers of the list route. The API client spreads the body over its own `data`, so a
 * paged body arrives either as `{ data: rows, total, … }` or, behind a response envelope, as
 * `{ data: { data: rows, total, … } }`. A bare array is the legacy, unpaged answer.
 */
export function toPrescriptionPage(response: unknown, params: PrescriptionListParams): PrescriptionPageResult {
  const outer = (response ?? {}) as Record<string, unknown>;
  const inner = outer.data;
  const paged = (source: Record<string, unknown>, rows: unknown): PrescriptionPageResult => ({
    mode: 'server',
    rows: Array.isArray(rows) ? (rows as Prescription[]) : [],
    total: finiteNumber(source.total, 0),
    page: finiteNumber(source.page, params.page),
    limit: finiteNumber(source.limit, params.limit),
  });
  if (Array.isArray(inner) && outer.total !== undefined) return paged(outer, inner);
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    const record = inner as Record<string, unknown>;
    if (Array.isArray(record.data) && record.total !== undefined) return paged(record, record.data);
  }
  const rows = toPrescriptionRows(inner ?? response);
  return { mode: 'legacy', rows, total: rows.length, page: 1, limit: rows.length };
}

/**
 * A backend without the summary route answers `summary` as a prescription id (400 / 404, or 500
 * from an older id lookup); the tiles then fall back to counting the list instead of failing.
 */
function isMissingRoute(error: unknown): boolean {
  return error instanceof ApiError && [400, 404, 405, 500].includes(error.statusCode);
}

function toPrescriptionSummary(payload: unknown): PrescriptionSummary | null {
  const outer = (payload ?? {}) as Record<string, unknown>;
  const record = (outer.total !== undefined ? outer : (outer.data ?? {})) as Record<string, unknown>;
  if (record.total === undefined) return null;
  return {
    total: finiteNumber(record.total, 0),
    active: finiteNumber(record.active, 0),
    completed: finiteNumber(record.completed, 0),
    cancelled: finiteNumber(record.cancelled, 0),
    drafts: finiteNumber(record.drafts, 0),
    today: finiteNumber(record.today, 0),
    uniquePatients: finiteNumber(record.uniquePatients, 0),
  };
}

/**
 * One page of the signed-in doctor's prescriptions (the backend scopes a doctor to their own).
 * The previous page stays on screen while the next one loads.
 */
export const usePrescriptionPage = (
  doctorId: string | undefined,
  params: PrescriptionListParams,
  options?: { enabled?: boolean },
) => {
  const clinicId = useCurrentClinicId() || '';
  return useQueryData(
    prescriptionQueryKeys.doctorPage(clinicId, doctorId || '', params),
    async () => {
      const result = await clinicApiClient.get(API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.LIST, definedParams(params));
      return toPrescriptionPage(result, params);
    },
    {
      enabled: (options?.enabled ?? true) && !!doctorId,
      placeholderData: keepPreviousData,
    },
  );
};

/** Counts for the stat tiles; `null` while the backend has no summary route yet. */
export const usePrescriptionSummary = (
  doctorId: string | undefined,
  range: PrescriptionSummaryRange,
  options?: { enabled?: boolean },
) => {
  const clinicId = useCurrentClinicId() || '';
  return useQueryData(
    prescriptionQueryKeys.doctorSummary(clinicId, doctorId || '', range),
    async (): Promise<PrescriptionSummary | null> => {
      try {
        const result = await clinicApiClient.get(API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.SUMMARY, definedParams(range));
        return toPrescriptionSummary(result);
      } catch (error) {
        if (isMissingRoute(error)) return null;
        throw error;
      }
    },
    {
      enabled: (options?.enabled ?? true) && !!doctorId,
      placeholderData: keepPreviousData,
    },
  );
};

/** What the prescribing doctor may change on a not-yet-dispensed prescription (PATCH /pharmacy/prescriptions/:id). */
export interface PrescriptionEditInput {
  items?: PrescriptionItemPayload[];
  notes?: string;
  diagnosis?: string;
  validUntil?: string;
}

/**
 * Hook to get all prescriptions
 */
export const usePrescriptions = (doctorId?: string, filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  patientName?: string;
  limit?: number;
  offset?: number;
}, options?: {
  enabled?: boolean;
}) => {
  return useQueryData(
    ['prescriptions', doctorId, filters],
    async () => {
      const result = await clinicApiClient.get(API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.LIST, { doctorId, ...filters });
      return { prescriptions: toPrescriptionRows(result.data) };
    },
    {
      enabled: (options?.enabled ?? true) && !!doctorId,
    }
  );
};

/**
 * Hook to get prescriptions for a specific patient
 */
export const usePatientPrescriptions = (
  doctorId: string,
  patientId: string,
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }
) => {
  return useQueryData(
    ['patientPrescriptions', doctorId, patientId, filters],
    async () => {
      const result = await clinicApiClient.get(API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.GET_BY_PATIENT(patientId), {
        doctorId,
        ...filters,
      });
      return { prescriptions: toPrescriptionRows(result.data) };
    },
    {
      enabled: !!doctorId && !!patientId,
    }
  );
};

/**
 * Hook to create a new prescription
 */
export const useCreatePrescription = () => {
  return useMutationOperation(
    async (prescriptionData: Prescription) => {
      return await clinicApiClient.post(API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.CREATE, prescriptionData);
    },
    {
      toastId: TOAST_IDS.PRESCRIPTION.CREATE,
      loadingMessage: 'Creating prescription...',
      successMessage: 'Prescription created successfully',
      invalidateQueries: [
        ['prescriptions'],
        ['patientPrescriptions'],
        ['patient-prescriptions'],
        ['medical-records'],
        ['medicalRecords'],
        ['ehr'],
        ['ehrClinic'],
        ['prescription'],
      ],
    }
  );
};

/**
 * Hook to update a prescription
 */
export const useUpdatePrescription = () => {
  return useMutationOperation(
    async ({ prescriptionId, updates }: { prescriptionId: string; updates: PrescriptionEditInput }) => {
      // The prescribing doctor edits items / notes / diagnosis here (the assistant only their own
      // DRAFT / RETURNED draft); status changes (dispense, cancel) belong to the pharmacist's route.
      return await clinicApiClient.patch(API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.GET(prescriptionId), updates);
    },
    {
      toastId: TOAST_IDS.PRESCRIPTION.UPDATE,
      loadingMessage: 'Updating prescription...',
      successMessage: 'Prescription updated successfully',
      invalidateQueries: [
        ['prescriptions'],
        ['patientPrescriptions'],
        ['patient-prescriptions'],
        ['medical-records'],
        ['medicalRecords'],
        ['ehr'],
        ['ehrClinic'],
        ['prescription'],
      ],
    }
  );
};

