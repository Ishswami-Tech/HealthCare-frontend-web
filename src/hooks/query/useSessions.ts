"use client";

import { useQueryData } from "../core/useQueryData";
import { useMutationOperation } from "../core/useMutationOperation";
import { TOAST_IDS } from "../utils/use-toast";
import { clinicApiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/config/config";

export interface ActiveSession {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  lastActivity: string;
  createdAt: string;
  isCurrent: boolean;
}

export const useActiveSessions = (enabled: boolean = true) => {
  return useQueryData<ActiveSession[]>(
    ["activeSessions"],
    async () => {
      const result = await clinicApiClient.get<{ sessions?: ActiveSession[]; data?: ActiveSession[] }>(
        API_ENDPOINTS.AUTH.SESSIONS
      );
      const payload = result.data as { sessions?: ActiveSession[]; data?: ActiveSession[] } | undefined;
      return payload?.sessions ?? payload?.data ?? [];
    },
    {
      enabled,
      staleTime: 60 * 1000,
    }
  );
};

export const useRevokeSession = () => {
  return useMutationOperation<void, string>(
    async (sessionId) => {
      await clinicApiClient.delete(API_ENDPOINTS.USERS.SESSIONS.REVOKE(sessionId));
    },
    {
      toastId: TOAST_IDS.SESSION.TERMINATE,
      loadingMessage: "Revoking session...",
      successMessage: "Session revoked successfully",
      invalidateQueries: [["activeSessions"], ["session"], ["auth", "session"]],
    }
  );
};
