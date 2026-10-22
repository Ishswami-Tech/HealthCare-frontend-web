import { authenticatedApi } from './auth.server';
import {
  actionFailure,
  actionSuccess,
  caughtFailure,
  clinicHeaders,
  resolveClinicContext,
  statusFailure,
  type ActionResult,
} from './_shared';

/**
 * One request helper for the clinic-scoped server actions of the clinic admin screens
 * (billing ops, staff admin, holidays, QR, check-in log). A plain module, not `'use server'`:
 * only action files import it.
 *
 * It resolves the clinic of the session, sends it as `X-Clinic-ID`, maps the HTTP status to an
 * `ActionFailure` and returns `{ success, data }` instead of throwing, so the hooks can keep the
 * backend message ("Only the doctor can …", "Staff member not found").
 */

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

/** `path?key=value&…` with empty values left out. */
export function withQuery(path: string, params?: QueryParams): string {
  if (!params) return path;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export interface OpsRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Names the thing asked for in failure messages: "Invoice", "Check-in log". */
  what: string;
}

export async function clinicOpsRequest<T>(
  endpoint: string,
  { method = 'GET', body, what }: OpsRequestOptions
): Promise<ActionResult<T>> {
  try {
    const context = await resolveClinicContext(`load ${what.toLowerCase()}`);
    if (!context.success) return context;

    const { status, data, success, message } = await authenticatedApi<T>(endpoint, {
      method,
      headers: clinicHeaders(context.clinicId),
      omitClinicId: true,
      cache: 'no-store',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    const failure = statusFailure(status, what);
    if (failure) return failure;
    if (success === false) return actionFailure(message || `${what} request failed`, 'NETWORK');
    return actionSuccess(data);
  } catch (error) {
    return caughtFailure(error);
  }
}
