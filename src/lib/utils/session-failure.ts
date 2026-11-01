/**
 * Decides whether a failed authenticated request means the session itself is
 * over (log the user out) or something else went wrong (show the page's error
 * state and keep the session).
 *
 * Pure and dependency-free so the server (`authenticatedApi`), the browser API
 * client and the client recovery helpers share one rule set, and so it can be
 * unit-tested with `node --test` (see scripts/session-failure.test.mjs).
 *
 * Rules, in order:
 * - transient (network 0, 408/425/429, 5xx) never ends the session;
 * - structured backend codes for a dead token/session/account end it;
 * - 401 ends it, except a credential check (wrong password / OTP) on a live session;
 * - 403 ends it only for the ClinicGuard / session shapes ("Clinic access denied:
 *   User <id> does not have access to clinic <id>", "Clinic authentication
 *   mismatch", "User ID missing from token") and, when the denied clinic is named,
 *   only when it is the session's own clinic - a request explicitly scoped to some
 *   other clinic is a permission error, not a dead session;
 * - user-not-found on the caller's own profile endpoint ends it.
 * Everything else (RBAC "Access denied for clinic", validation, 404s elsewhere) is
 * a normal error.
 */

export type SessionFailureKind = 'session-ended' | 'transient' | 'other';

export interface SessionFailureInput {
  status?: number | undefined;
  /** Structured backend code (ApiError.backendCode / code), e.g. AUTH_TOKEN_EXPIRED. */
  code?: string | undefined;
  message?: string | undefined;
  /** Request path or URL; only used to recognise the caller's own profile endpoint. */
  endpoint?: string | undefined;
  /** Clinic bound to the current session (clinic_id cookie / session user). */
  sessionClinicId?: string | undefined;
}

/** Code the frontend raises once it has decided a session is over. */
export const SESSION_ENDED_CODE = 'AUTH_SESSION_EXPIRED';
/** User-facing copy; also the sentinel that survives the server-action boundary (only the message does). */
export const SESSION_ENDED_MESSAGE = 'Your session ended. Please sign in again.';

const TRANSIENT_STATUSES: ReadonlySet<number> = new Set([0, 408, 425, 429]);

const DEAD_SESSION_CODES: ReadonlySet<string> = new Set([
  'AUTH_TOKEN_EXPIRED',
  'AUTH_TOKEN_INVALID',
  'AUTH_SESSION_EXPIRED',
  'AUTH_SESSION_INVALID',
  'AUTH_SESSION_REVOKED',
  'AUTH_ACCOUNT_DISABLED',
  'AUTH_ACCOUNT_LOCKED',
]);

/** 401s that answer a credential check, not a dead session (e.g. wrong current password). */
const CREDENTIAL_CHECK_CODES: ReadonlySet<string> = new Set([
  'AUTH_INVALID_CREDENTIALS',
  'AUTH_OTP_INVALID',
  'AUTH_OTP_EXPIRED',
]);
const CREDENTIAL_CHECK_MESSAGE = /\b(invalid credentials|incorrect password|wrong password|current password|invalid otp|otp (?:has )?expired)\b/i;

const SESSION_403_MESSAGES: readonly RegExp[] = [
  /clinic access denied:\s*user\b.*\bdoes not have access to clinic/i,
  /clinic authentication mismatch/i,
  /user id missing from token/i,
  /session (?:has been |was )?(?:revoked|expired|invalid|ended)/i,
];

const USER_NOT_FOUND_MESSAGE = /\buser (?:not found|does not exist|no longer exists)\b/i;
const OWN_PROFILE_ENDPOINT = /\/user\/(?:profile|me)(?:[/?#]|$)/i;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

function normalizeCode(code: string | undefined): string {
  return typeof code === 'string' ? code.trim().replace(/[\s-]+/g, '_').toUpperCase() : '';
}

/** Last UUID in the message: the backend names the clinic after the user. */
function deniedClinicId(message: string): string | undefined {
  const ids = message.match(UUID);
  return ids && ids.length > 0 ? ids[ids.length - 1]?.toLowerCase() : undefined;
}

function isForeignClinicDenial(message: string, sessionClinicId: string | undefined): boolean {
  const denied = deniedClinicId(message);
  const own = sessionClinicId?.trim().toLowerCase();
  return Boolean(denied && own && denied !== own);
}

export function classifySessionFailure(input: SessionFailureInput): SessionFailureKind {
  const status = typeof input.status === 'number' ? input.status : undefined;
  const code = normalizeCode(input.code);
  const message = typeof input.message === 'string' ? input.message : '';

  if (status !== undefined && (TRANSIENT_STATUSES.has(status) || status >= 500)) {
    return 'transient';
  }

  if (code && DEAD_SESSION_CODES.has(code)) {
    return 'session-ended';
  }

  if (status === 401) {
    if (CREDENTIAL_CHECK_CODES.has(code) || CREDENTIAL_CHECK_MESSAGE.test(message)) {
      return 'other';
    }
    return 'session-ended';
  }

  if (status === 403) {
    const sessionShaped = SESSION_403_MESSAGES.some((pattern) => pattern.test(message));
    if (sessionShaped && !isForeignClinicDenial(message, input.sessionClinicId)) {
      return 'session-ended';
    }
    return 'other';
  }

  const ownProfile = typeof input.endpoint === 'string' && OWN_PROFILE_ENDPOINT.test(input.endpoint);
  if (ownProfile && (status === 404 || status === undefined) && (code === 'USER_NOT_FOUND' || USER_NOT_FOUND_MESSAGE.test(message))) {
    return 'session-ended';
  }

  return 'other';
}

/** Reads status / code / message off an ApiError, axios-style error or plain object. */
export function toSessionFailureInput(
  error: unknown,
  context: Pick<SessionFailureInput, 'endpoint' | 'sessionClinicId'> = {}
): SessionFailureInput {
  const base: SessionFailureInput = { ...context };
  if (typeof error === 'string') return { ...base, message: error };
  if (!error || typeof error !== 'object') return base;

  const record = error as {
    message?: unknown;
    status?: unknown;
    statusCode?: unknown;
    code?: unknown;
    backendCode?: unknown;
    response?: { status?: unknown; data?: { message?: unknown; error?: unknown; code?: unknown } };
  };
  const pickNumber = (...values: unknown[]) => values.find((v): v is number => typeof v === 'number');
  const pickString = (...values: unknown[]) =>
    values.find((v): v is string => typeof v === 'string' && v.length > 0);

  return {
    ...base,
    status: pickNumber(record.statusCode, record.status, record.response?.status),
    code: pickString(record.backendCode, record.code, record.response?.data?.code),
    message: pickString(record.message, record.response?.data?.message, record.response?.data?.error),
  };
}

/**
 * True when the message is the frontend's own "session ended" sentinel. A
 * server action can only hand its error message to the browser, so this is how
 * the client learns that `authenticatedApi` already ended the session.
 */
export function isSessionEndedMessage(message: string | undefined): boolean {
  return typeof message === 'string' && message.includes(SESSION_ENDED_MESSAGE);
}
