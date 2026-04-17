"use client";

import { ROUTES } from "@/lib/config/routes";
import { clearTokens } from "@/lib/utils/token-manager";
import { resetAllStores } from "@/stores";

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
