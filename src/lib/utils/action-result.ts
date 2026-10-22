import type { ActionResult } from '@/lib/actions/_shared';

/**
 * The data of a server-action result, or a thrown `Error` with the action's own message.
 * React Query hooks call it in their query / mutation functions so the error state and the
 * toast keep the backend wording.
 */
export function dataOrThrow<T>(result: ActionResult<T>): T {
  if (result.success) return result.data;
  throw new Error(result.error);
}

/** A list out of a result that may be a bare array or `{ data | items | rows: [] }`. */
export function listOf<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['data', 'items', 'rows', 'results']) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
  }
  return [];
}
