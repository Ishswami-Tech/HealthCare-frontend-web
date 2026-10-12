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
      if (Array.isArray(payload)) return payload;
      return payload?.sessions ?? payload?.data ?? [];
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
