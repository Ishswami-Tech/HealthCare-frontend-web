import { useQueryData } from '../core/useQueryData';
import { useMutationOperation } from '../core/useMutationOperation';
import { clinicApiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/config/config';
import { tbdKeys, TBD_CACHE } from './tbdQueryKeys';
import {
  normalizeDirectDispense,
  normalizeDirectDispenses,
  normalizeStockList,
  type CreateDirectDispenseInput,
  type DirectDispense,
  type StockStatus,
} from '@/lib/dispense/direct-dispense';

/**
 * Direct dispensing from clinic stock (API_CONTRACT §6). One set of hooks for every role that
 * hands medicines over from stock: the doctor (DocDispense), the assistant doctor (AsDispense,
 * AsStockView) and the clinic admin / pharmacist (read). No prices are read: the server strips
 * them for the clinical roles.
 */

export const directDispenseKeys = {
  all: (clinicId: string) => ['direct-dispense', clinicId] as const,
  list: (clinicId: string, filters: Record<string, unknown>) => ['direct-dispense', clinicId, 'list', filters] as const,
  detail: (clinicId: string, id: string) => ['direct-dispense', clinicId, 'detail', id] as const,
};

/** The plain-JSON routes come back as the body itself or wrapped in `{ data }`. */
function body(response: unknown): unknown {
  const record = response as { data?: unknown } | null;
  return record && typeof record === 'object' && 'data' in record ? record.data : response;
}

export interface DispenseStockFilters {
  q?: string;
  status?: StockStatus;
  limit?: number;
}

/** GET /direct-dispense/stock: what is on hand at the clinic, earliest expiry first. */
export const useDispenseStock = (clinicId: string, filters: DispenseStockFilters = {}, options?: { enabled?: boolean }) => {
  const query = {
    ...(filters.q?.trim() ? { q: filters.q.trim() } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    limit: filters.limit ?? 50,
  };
  return useQueryData(
    tbdKeys.clinicStock(clinicId, query),
    async () => normalizeStockList(body(await clinicApiClient.get(API_ENDPOINTS.DIRECT_DISPENSE.STOCK, query))),
    { enabled: Boolean(clinicId) && (options?.enabled ?? true), ...TBD_CACHE.working },
  );
};

export interface DirectDispenseFilters {
  patientId?: string;
  status?: 'DISPENSED' | 'REVERSED';
  /** Only the caller's own dispenses (the clinical roles only ever get their own). */
  mine?: boolean;
  limit?: number;
}

/** GET /direct-dispense: recent hand-overs. */
export const useDirectDispenses = (
  clinicId: string,
  filters: DirectDispenseFilters = {},
  options?: { enabled?: boolean },
) => {
  const query = {
    ...(filters.patientId ? { patientId: filters.patientId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.mine ? { mine: 'true' } : {}),
    limit: filters.limit ?? 20,
  };
  return useQueryData(
    directDispenseKeys.list(clinicId, query),
    async () => normalizeDirectDispenses(body(await clinicApiClient.get(API_ENDPOINTS.DIRECT_DISPENSE.LIST, query))),
    { enabled: Boolean(clinicId) && (options?.enabled ?? true), ...TBD_CACHE.live },
  );
};

/** GET /direct-dispense/:id */
export const useDirectDispense = (clinicId: string, id: string) =>
  useQueryData(
    directDispenseKeys.detail(clinicId, id),
    async () => normalizeDirectDispense(body(await clinicApiClient.get(API_ENDPOINTS.DIRECT_DISPENSE.GET(id)))),
    { enabled: Boolean(clinicId && id), ...TBD_CACHE.live },
  );

const AFTER_DISPENSE_INVALIDATES = [['direct-dispense'], ['clinic-stock'], ['inventory'], ['prescriptions'], ['prescription']];

/** POST /direct-dispense: stock is deducted (FEFO) and the record goes to billing. */
export const useCreateDirectDispense = () =>
  useMutationOperation<DirectDispense, CreateDirectDispenseInput>(
    async (input) => normalizeDirectDispense(body(await clinicApiClient.post(API_ENDPOINTS.DIRECT_DISPENSE.CREATE, input))),
    {
      toastId: 'direct-dispense-create',
      loadingMessage: 'Recording the hand-over...',
      successMessage: 'Medicines handed over',
      invalidateQueries: AFTER_DISPENSE_INVALIDATES,
    },
  );

/** POST /direct-dispense/:id/undo: the dispenser takes it back inside the undo window; stock returns. */
export const useUndoDirectDispense = () =>
  useMutationOperation<DirectDispense, { id: string }>(
    async ({ id }) => normalizeDirectDispense(body(await clinicApiClient.post(API_ENDPOINTS.DIRECT_DISPENSE.UNDO(id), {}))),
    {
      toastId: 'direct-dispense-undo',
      loadingMessage: 'Undoing the hand-over...',
      successMessage: 'Hand-over undone, stock returned',
      invalidateQueries: AFTER_DISPENSE_INVALIDATES,
    },
  );
