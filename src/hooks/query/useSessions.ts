"use client";

import { useQueryData, useMutationOperation } from "../core";
import { TOAST_IDS } from "../utils/use-toast";
import { getActiveSessions, revokeSession } from "@/lib/actions/session.server";

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
    async () => await getActiveSessions(),
    {
      enabled,
      staleTime: 60 * 1000,
    }
  );
};

export const useRevokeSession = () => {
  return useMutationOperation<void, string>(
    async (sessionId) => {
      await revokeSession(sessionId);
    },
    {
      toastId: TOAST_IDS.SESSION.TERMINATE,
      loadingMessage: "Revoking session...",
      successMessage: "Session revoked successfully",
      invalidateQueries: [["activeSessions"]],
    }
  );
};
