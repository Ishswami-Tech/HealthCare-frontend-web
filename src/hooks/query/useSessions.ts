"use client";

import { useQueryData } from "../core/useQueryData";
import { useMutationOperation } from "../core/useMutationOperation";
import { TOAST_IDS } from "../utils/use-toast";
import { clinicApiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/config/config";

export interface ActiveSession {
  sessionId: string;
  deviceInfo: string;
  ipAddress: string;
  lastActivity: string;
  createdAt: string;
  isCurrent: boolean;
}

type ActiveSessionPayload = Partial<ActiveSession> & {
  id?: string;
  session_id?: string;
  device?: string;
  deviceName?: string;
  lastSeenAt?: string;
  updatedAt?: string;
  isCurrentSession?: boolean;
  current?: boolean;
};

function normalizeSession(session: ActiveSessionPayload): ActiveSession | null {
  const sessionId = session.sessionId || session.session_id || session.id;
  if (!sessionId) {
    return null;
  }

  return {
    sessionId,
    deviceInfo: session.deviceInfo || session.device || session.deviceName || "Unknown device",
    ipAddress: session.ipAddress || "Unknown",
    lastActivity: session.lastActivity || session.lastSeenAt || session.updatedAt || new Date().toISOString(),
    createdAt: session.createdAt || session.lastActivity || session.lastSeenAt || new Date().toISOString(),
    isCurrent: Boolean(session.isCurrent ?? session.isCurrentSession ?? session.current),
  };
}

export const useActiveSessions = (enabled: boolean = true) => {
  return useQueryData<ActiveSession[]>(
    ["activeSessions"],
    async () => {
      const result = await clinicApiClient.get<{
        sessions?: ActiveSessionPayload[];
        data?: ActiveSessionPayload[];
      }>(
        API_ENDPOINTS.AUTH.SESSIONS
      );
      const payload = result.data as
        | { sessions?: ActiveSessionPayload[]; data?: ActiveSessionPayload[] }
        | undefined;
      const rawSessions = payload?.sessions ?? payload?.data ?? [];
      return rawSessions.map(normalizeSession).filter((session): session is ActiveSession => Boolean(session));
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
