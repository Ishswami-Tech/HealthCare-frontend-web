import { getServerSession } from './auth.server';

/**
 * Helpers shared by the server actions. A plain module (no `'use server'`): nothing here is
 * callable from the browser; the action files import it.
 *
 * Return shape of the actions that use it: a discriminated result instead of a thrown error,
 * `{ success: true, data }` or `{ success: false, error, code }` (the shape of
 * `patient-dashboard.server.ts`). A thrown error loses its message on the way to the browser
 * in a production build; a returned result keeps the message and the code, so a hook can tell
 * "not signed in" from "the request failed".
 */

export { clinicHeaders } from '../utils/clinic-id';

export type ActionErrorCode =
  | 'UNAUTHENTICATED'
  | 'CLINIC_CONTEXT_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'NETWORK'
  | 'UNKNOWN';

export type ActionFailure = { success: false; error: string; code?: ActionErrorCode };

export type ActionResult<T> = { success: true; data: T } | ActionFailure;

export function actionSuccess<T>(data: T): { success: true; data: T } {
  return { success: true, data };
}

export function actionFailure(error: string, code: ActionErrorCode): ActionFailure {
  return { success: false, error, code };
}

type SessionUser = { clinicId?: string; primaryClinicId?: string; id?: string; sub?: string };

async function readSessionUser(): Promise<SessionUser | undefined> {
  const session = await getServerSession();
  return session?.user as SessionUser | undefined;
}

/** The signed-in user's id, or an `UNAUTHENTICATED` failure. */
export async function requireSession(): Promise<{ success: true; userId: string } | ActionFailure> {
  const user = await readSessionUser();
  const userId = user?.id || user?.sub;
  if (!userId) {
    return actionFailure('Not authenticated', 'UNAUTHENTICATED');
  }
  return { success: true, userId };
}

/**
 * The signed-in user and the clinic of the session (`clinicId`, else `primaryClinicId`).
 * `purpose` finishes the sentence "Clinic context is required to …".
 */
export async function resolveClinicContext(
  purpose: string
): Promise<{ success: true; userId: string; clinicId: string } | ActionFailure> {
  const user = await readSessionUser();
  const userId = user?.id || user?.sub;
  if (!userId) {
    return actionFailure('Not authenticated', 'UNAUTHENTICATED');
  }
  const clinicId = user?.clinicId || user?.primaryClinicId;
  if (!clinicId) {
    return actionFailure(`Clinic context is required to ${purpose}`, 'CLINIC_CONTEXT_REQUIRED');
  }
  return { success: true, userId, clinicId };
}

/** The failure for an HTTP status of 400 or more; `null` for a successful status. `what` names the thing asked for. */
export function statusFailure(status: number, what: string): ActionFailure | null {
  if (status === 401) {
    return actionFailure('Session expired. Please sign in again.', 'UNAUTHENTICATED');
  }
  if (status === 403) {
    return actionFailure('Access denied', 'FORBIDDEN');
  }
  if (status === 404) {
    return actionFailure(`${what} was not found`, 'NOT_FOUND');
  }
  if (status >= 400) {
    return actionFailure(`${what} request failed with status ${status}`, 'NETWORK');
  }
  return null;
}

/** The failure for an error the API client threw: its message, and a code from its status. */
export function caughtFailure(error: unknown): ActionFailure {
  const statusCode =
    typeof error === 'object' && error !== null && 'statusCode' in error
      ? Number((error as { statusCode?: unknown }).statusCode)
      : NaN;
  const message = error instanceof Error ? error.message : 'Unknown error';
  if (statusCode === 404) return actionFailure(message, 'NOT_FOUND');
  if (statusCode === 401) return actionFailure(message, 'UNAUTHENTICATED');
  if (statusCode === 403) return actionFailure(message, 'FORBIDDEN');
  return actionFailure(message, 'NETWORK');
}
