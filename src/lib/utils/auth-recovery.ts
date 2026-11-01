"use client";

import { ROUTES } from "@/lib/config/routes";
import { clearTokens } from "@/lib/utils/token-manager";
import { clearSession, refreshToken } from "@/lib/actions/auth.server";
import { useAuthStore } from "@/stores/auth.store";
import type { Session } from "@/types/auth.types";
import { resetAllStores } from "@/stores";
import {
  classifySessionFailure,
  isSessionEndedMessage,
  toSessionFailureInput,
} from "@/lib/utils/session-failure";

export const JWT_REFRESH_LEAD_MS = 2 * 60 * 1000;

type AuthLikeError = {
  message?: string;
  status?: number;
  statusCode?: number;
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
};

function extractAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || "";
  }

  if (error && typeof error === "object") {
    const authError = error as AuthLikeError;
    return String(
      authError.response?.data?.message ||
        authError.response?.data?.error ||
        authError.message ||
        ""
    );
  }

  return typeof error === "string" ? error : "";
}

function extractAuthErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const authError = error as AuthLikeError;
  return authError.response?.status || authError.status || authError.statusCode;
}

export function isSocketAuthError(error: unknown): boolean {
  const status = extractAuthErrorStatus(error);
  if (status === 401 || status === 403) {
    return true;
  }

  const message = extractAuthErrorMessage(error).toLowerCase();
  if (!message) {
    return false;
  }

  return [
    "jwt expired",
    "authentication required",
    "no token or session",
    "no token provided",
    "auth token invalid",
    "invalid token",
    "invalid session",
    "session expired",
  ].some((pattern) => message.includes(pattern));
}

export function isSessionInvalidError(error: unknown): boolean {
  const status = extractAuthErrorStatus(error);
  if (status === 401) {
    return true;
  }

  const rawMessage = extractAuthErrorMessage(error);
  // Server actions hand the browser only the message, so `authenticatedApi`
  // marks a session it has already ended with this sentinel.
  if (isSessionEndedMessage(rawMessage)) {
    return true;
  }

  // Direct browser API errors keep status + backend code: a 403 for a user who
  // lost access to the session's clinic (or was deleted) ends the session too.
  if (status === 403) {
    const sessionClinicId = useAuthStore.getState().session?.user?.clinicId || undefined;
    if (classifySessionFailure(toSessionFailureInput(error, { sessionClinicId })) === "session-ended") {
      return true;
    }
  }

  const message = rawMessage.toLowerCase();
  if (!message) {
    return false;
  }

  return [
    "no token provided",
    "authentication required",
    "session expired",
    "session has expired",
    "invalid token",
    "invalid session",
    "unauthorized",
    "no refresh token available",
    "auth token invalid",
  ].some((pattern) => message.includes(pattern));
}

export function getJwtExpiryEpochMs(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1] || '')) as { exp?: number };
    if (typeof payload.exp !== 'number') {
      return null;
    }

    return payload.exp * 1000;
  } catch {
    return null;
  }
}

// Added on top of the lead time (never subtracted) so tokens issued in the
// same window - e.g. everyone who logged in via a shared login page, or all
// staff at shift start - don't force-reconnect their sockets in lockstep at
// the exact same second. This only makes the refresh fire earlier/never
// later than before, so the "always refresh before expiry" guarantee is
// unaffected.
const JWT_REFRESH_JITTER_MAX_MS = 30 * 1000;

export function getJwtRefreshDelayMs(
  token: string,
  leadTimeMs: number = JWT_REFRESH_LEAD_MS
): number | null {
  const expiryMs = getJwtExpiryEpochMs(token);
  if (!expiryMs) {
    return null;
  }

  const jitterMs = Math.floor(Math.random() * JWT_REFRESH_JITTER_MAX_MS);
  return Math.max(expiryMs - Date.now() - leadTimeMs - jitterMs, 0);
}

export async function refreshClientSessionForRealtime(
  context: string
): Promise<Session | null> {
  const authStore = useAuthStore.getState();
  const originalSession = authStore.session;
  authStore.setRefreshing(true);

  try {
    const refreshedSession = await refreshToken();
    const currentSession = useAuthStore.getState().session;
    if (!currentSession || currentSession.user?.id !== originalSession?.user?.id) {
      return null;
    }
    if (refreshedSession?.access_token) {
      authStore.setSession(refreshedSession);
      return refreshedSession;
    }

    // The server action returns null only when the refresh session is invalid;
    // temporary failures throw and must remain retryable.
    triggerClientAuthRecovery();
    return null;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      // Keep logs quiet in production unless the caller wants to surface the failure.
      console.warn(`[${context}] realtime auth refresh failed`, error);
    }
    throw error;
  } finally {
    authStore.setRefreshing(false);
  }
}

// ─── Cross-caller refresh dedupe ────────────────────────────────────────────
// The proactive scheduler, the WebSocket onAuthError handler, and the HTTP
// 401 interceptor can all race to refresh at the same time. We dedupe them
// here so a single refresh round-trip happens per cycle, regardless of which
// trigger fires first.
let inFlightRefreshPromise: Promise<Session | null> | null = null;

export function refreshClientSessionOnce(
  context: string
): Promise<Session | null> {
  if (inFlightRefreshPromise) {
    return inFlightRefreshPromise;
  }
  inFlightRefreshPromise = refreshClientSessionForRealtime(context).finally(() => {
    inFlightRefreshPromise = null;
  });
  return inFlightRefreshPromise;
}

// ─── Voluntary logout guard ─────────────────────────────────────────────────
// A request that was in flight when the user pressed "Log out" comes back 401 once the session is
// gone; its recovery must not race the logout and land on `?reason=session-expired`.
const VOLUNTARY_LOGOUT_GUARD_MS = 15_000;
// Redirect even if clearing the server cookies hangs.
const AUTH_RECOVERY_REDIRECT_FALLBACK_MS = 3_000;
type LogoutAwareWindow = Window & { __voluntaryLogoutAt?: number; __authRecoveryInProgress?: boolean };

/** Call at the very start of a user-initiated logout. */
export function markVoluntaryLogout(): void {
  if (typeof window === "undefined") return;
  (window as LogoutAwareWindow).__voluntaryLogoutAt = Date.now();
}

export function isVoluntaryLogoutInProgress(now: number = Date.now()): boolean {
  if (typeof window === "undefined") return false;
  const startedAt = (window as LogoutAwareWindow).__voluntaryLogoutAt;
  return typeof startedAt === "number" && now - startedAt < VOLUNTARY_LOGOUT_GUARD_MS;
}

export function triggerClientAuthRecovery(): void {
  if (typeof window === "undefined") {
    return;
  }

  // The logout flow clears the session and redirects to the plain login page itself.
  if (isVoluntaryLogoutInProgress()) {
    return;
  }

  if ((window as Window & { __authRecoveryInProgress?: boolean }).__authRecoveryInProgress) {
    return;
  }

  (window as Window & { __authRecoveryInProgress?: boolean }).__authRecoveryInProgress = true;

  let redirected = false;
  const redirectToLogin = () => {
    if (redirected) return;
    redirected = true;
    window.location.replace(`${ROUTES.LOGIN}?reason=session-expired`);
  };

  try {
    clearTokens();
    resetAllStores();
  } finally {
    // The auth cookies are httpOnly, so only the server can drop them. Without this the proxy
    // still sees access_token + user_role and bounces /auth/login straight back to the
    // dashboard, which kept rendering the shell for a revoked session.
    clearSession().then(redirectToLogin, redirectToLogin);
    window.setTimeout(redirectToLogin, AUTH_RECOVERY_REDIRECT_FALLBACK_MS);
  }
}
