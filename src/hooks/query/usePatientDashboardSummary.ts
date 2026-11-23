"use client";

import { useEffect } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";

import type { PatientDashboardSummaryResponse } from "@/types/patient-dashboard.types";

import { useQueryData } from "../core/useQueryData";
import { useAuth } from "../auth/useAuth";
import { useAuthStore } from "@/stores/auth.store";
import { useRBAC } from "../utils/useRBAC";
import { Permission } from "@/types/rbac.types";
import { useWebSocketStatus } from "@/app/providers/WebSocketProvider";
import { clinicApiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/config/config";
import { isApiError } from "@/lib/utils/error-handler";

const dashboardSummaryLoadedState: { sessionKey: string; loaded: boolean } = {
  sessionKey: "",
  loaded: false,
};

const markDashboardSummaryLoadedOnce = (sessionKey: string): void => {
  const key = sessionKey && sessionKey.trim() ? sessionKey : dashboardSummaryLoadedState.sessionKey;
  if (!key) return;
  if (dashboardSummaryLoadedState.sessionKey !== key) {
    dashboardSummaryLoadedState.sessionKey = key;
    dashboardSummaryLoadedState.loaded = false;
  }
  dashboardSummaryLoadedState.loaded = true;
};

export const hasDashboardSummaryLoadedForSession = (): boolean =>
  dashboardSummaryLoadedState.loaded;

export const resetDashboardSummaryLoadedForSession = (): void => {
  dashboardSummaryLoadedState.sessionKey = "";
  dashboardSummaryLoadedState.loaded = false;
};

export type UsePatientDashboardSummaryOptions = {
  enabled?: boolean;
};

export type UsePatientDashboardSummaryResult = ReturnType<
  typeof useQueryData<PatientDashboardSummaryResponse | null>
>;

/**
 * `GET patients/me/dashboard-summary` straight from the browser. As a server action every load
 * and every 60 s poll (socket down) ran a Vercel Function. 401 and 403 (session gone, profile
 * incomplete, forbidden) give `null`, so the dashboard shows its empty state, as before.
 */
async function readPatientDashboardSummary(
  clinicId: string
): Promise<PatientDashboardSummaryResponse | null> {
  try {
    const response = await clinicApiClient.get<PatientDashboardSummaryResponse>(
      API_ENDPOINTS.PATIENTS.DASHBOARD_SUMMARY,
      undefined,
      { clinicId, cache: "no-store" } as RequestInit
    );
    return response.data ?? null;
  } catch (error) {
    if (isApiError(error) && (error.statusCode === 401 || error.statusCode === 403)) {
      return null;
    }
    throw error;
  }
}

export const usePatientDashboardSummary = (
  options: UsePatientDashboardSummaryOptions = {}
): UsePatientDashboardSummaryResult => {
  const { hasPermission } = useRBAC();
  const { session } = useAuth();
  const { isConnected } = useWebSocketStatus();
  const isAuthRefreshing = useAuthStore((state) => state.isRefreshing);
  const userId = session?.user?.id;
  const clinicId =
    (session?.user as { clinicId?: string; primaryClinicId?: string } | undefined)?.clinicId ||
    (session?.user as { primaryClinicId?: string } | undefined)?.primaryClinicId ||
    undefined;

  const query = useQueryData<PatientDashboardSummaryResponse | null>(
    ["patientDashboardSummary", userId, clinicId],
    async () => {
      if (!clinicId) return null;
      const summary = await readPatientDashboardSummary(clinicId);
      if (!summary) return null;

      const sessionKey =
        useAuthStore.getState().session?.session_id ||
        `${String(userId || "")}|${String(clinicId || "")}`;
      markDashboardSummaryLoadedOnce(sessionKey);

      return summary;
    },
    {
      enabled:
        (options.enabled ?? true) &&
        !!userId &&
        String(session?.user?.role || "").toUpperCase() === "PATIENT" &&
        hasPermission(Permission.VIEW_APPOINTMENTS),
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: !isAuthRefreshing,
      refetchInterval: isConnected || isAuthRefreshing ? false : 60_000,
      retry: (failureCount, error: Error) => {
        const message = error.message || "";
        if (
          message.includes("Access denied") ||
          message.includes("Not authenticated") ||
          message.includes("Forbidden")
        ) {
          return false;
        }
        return failureCount < 2;
      },
      placeholderData: keepPreviousData,
    }
  );

  return query;
};

export const prefetchPatientDashboardSummary = async (
  queryClient: QueryClient,
  options: { userId?: string; clinicId?: string } = {}
): Promise<void> => {
  const state = useAuthStore.getState();
  const sessionUser = state.session?.user as
    | { id?: string; sub?: string; clinicId?: string; primaryClinicId?: string }
    | undefined;
  const userId = options.userId || sessionUser?.id || sessionUser?.sub;
  const clinicId = options.clinicId || sessionUser?.clinicId || sessionUser?.primaryClinicId;
  if (!userId || !clinicId) return;

  try {
    await queryClient.prefetchQuery({
      queryKey: ["patientDashboardSummary", userId, clinicId],
      queryFn: async () => {
        const summary = await readPatientDashboardSummary(clinicId);
        if (!summary) return null;

      const sessionKey =
        state.session?.session_id || `${String(userId)}|${String(clinicId)}`;
      markDashboardSummaryLoadedOnce(sessionKey);
      return summary;
    },
    staleTime: 60 * 1000,
  });
  } catch {
    // Best-effort: never let prefetch failures bubble up to the layout.
  }
};

export const usePrefetchPatientDashboardSummary = (): void => {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const userId = session?.user?.id;
  const userRole = String(session?.user?.role || "").toUpperCase();
  const clinicId =
    (session?.user as { clinicId?: string; primaryClinicId?: string } | undefined)?.clinicId ||
    (session?.user as { primaryClinicId?: string } | undefined)?.primaryClinicId;

  useEffect(() => {
    // Patient-only endpoint — never prefetch for staff roles (causes 403 noise).
    if (userRole !== "PATIENT") return;
    if (!userId || !clinicId) return;
    void prefetchPatientDashboardSummary(queryClient, { userId, clinicId });
  }, [queryClient, userId, clinicId, userRole]);
};
