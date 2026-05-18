"use client";

import { ROUTES } from "@/lib/config/routes";
import { clearTokens } from "@/lib/utils/token-manager";
import { refreshToken } from "@/lib/actions/auth.server";
import { useAuthStore } from "@/stores/auth.store";
import type { Session } from "@/types/auth.types";
import { resetAllStores } from "@/stores";

const DEFAULT_JWT_REFRESH_LEAD_MS = 2 * 60 * 1000;

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

  const message = extractAuthErrorMessage(error).toLowerCase();
  if (!message) {
    return false;
  }

  return [
    "no token provided",
    "authentication required",
    "session expired",
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

export function getJwtRefreshDelayMs(
  token: string,
  leadTimeMs: number = DEFAULT_JWT_REFRESH_LEAD_MS
): number | null {
  const expiryMs = getJwtExpiryEpochMs(token);
  if (!expiryMs) {
    return null;
  }

  return Math.max(expiryMs - Date.now() - leadTimeMs, 0);
}

export async function refreshClientSessionForRealtime(
  context: string
): Promise<Session | null> {
  const authStore = useAuthStore.getState();
  authStore.setRefreshing(true);

  try {
    const refreshedSession = await refreshToken();
    if (refreshedSession?.access_token) {
      authStore.setSession(refreshedSession);
      return refreshedSession;
    }

    return null;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      // Keep logs quiet in production unless the caller wants to surface the failure.
      console.warn(`[${context}] realtime auth refresh failed`, error);
    }
    return null;
  } finally {
    authStore.setRefreshing(false);
  }
}

export function triggerClientAuthRecovery(): void {
  if (typeof window === "undefined") {
    return;
  }

  if ((window as Window & { __authRecoveryInProgress?: boolean }).__authRecoveryInProgress) {
    return;
  }

  (window as Window & { __authRecoveryInProgress?: boolean }).__authRecoveryInProgress = true;

  try {
    clearTokens();
    resetAllStores();
  } finally {
    window.setTimeout(() => {
      window.location.replace(`${ROUTES.LOGIN}?reason=session-expired`);
    }, 150);
  }
}
