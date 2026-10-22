"use client";

import { useQueryData } from "../core/useQueryData";
import { useMutationOperation } from "../core/useMutationOperation";
import { TOAST_IDS } from "../utils/use-toast";
import { clinicApiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/config/config";
import { useAuthStore } from "@/stores/auth.store";

export interface ActiveSession {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  lastActivity: string;
  createdAt: string;
  isCurrent: boolean;
}

const DEVICE_LABEL_FIELDS = ['deviceName', 'name', 'browser', 'os', 'platform', 'deviceType', 'userAgent'] as const;

/** A readable device label from whatever the server sent (string, object or nothing). */
export function deviceInfoLabel(raw: unknown): string {
  if (typeof raw === 'string') return raw.trim();
  if (!raw || typeof raw !== 'object') return '';
  const record = raw as Record<string, unknown>;
  const browser = typeof record['browser'] === 'string' ? record['browser'].trim() : '';
  const os = typeof record['os'] === 'string' ? record['os'].trim() : '';
  if (browser && os) return `${browser} on ${os}`;
  for (const field of DEVICE_LABEL_FIELDS) {
    const value = record[field];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

/**
 * GET /auth/sessions (any signed-in user). The response is `{ data: Session[] }`;
 * note the backend currently always answers with an empty list.
 */
export const useActiveSessions = (enabled: boolean = true) => {
  return useQueryData<ActiveSession[]>(
    ["activeSessions"],
    async () => {
      const result = await clinicApiClient.get<
        ActiveSession[] | { sessions?: ActiveSession[]; data?: ActiveSession[] }
      >(API_ENDPOINTS.AUTH.SESSIONS);
      const payload = result.data;
      const list = Array.isArray(payload) ? payload : (payload?.sessions ?? payload?.data ?? []);
      // The backend may send deviceInfo as an object ({ userAgent, platform, ... }) or null;
      // the UI works with one readable label.
      return list.map((session) => ({ ...session, deviceInfo: deviceInfoLabel(session.deviceInfo) }));
    },
    {
      enabled,
      staleTime: 60 * 1000,
    }
  );
};

/**
 * Sign out one session ("Sign out a device").
 *
 * The backend has no `DELETE /user/sessions/:id` (the users controller has no session
 * routes at all). The route that ends a session by id is `POST /auth/logout` with
 * `{ sessionId }` (LogoutDto), so that is what is called. The caller's own session is
 * refused here: ending it has to go through the normal sign-out, which also clears the
 * local session.
 */
export const useRevokeSession = () => {
  return useMutationOperation<void, string>(
    async (sessionId) => {
      const targetSessionId = String(sessionId || "").trim();
      if (!targetSessionId) {
        throw new Error("Session ID is required");
      }
      if (targetSessionId === useAuthStore.getState().session?.session_id) {
        throw new Error("This is the session you are using. Use Sign out to end it.");
      }
      await clinicApiClient.post(API_ENDPOINTS.AUTH.LOGOUT, { sessionId: targetSessionId });
    },
    {
      toastId: TOAST_IDS.SESSION.TERMINATE,
      loadingMessage: "Revoking session...",
      successMessage: "Session revoked successfully",
      invalidateQueries: [["activeSessions"], ["session"], ["auth", "session"]],
    }
  );
};
