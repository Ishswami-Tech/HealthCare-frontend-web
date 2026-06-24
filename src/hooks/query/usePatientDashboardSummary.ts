"use client";

import { useEffect } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";

import { fetchPatientDashboardSummary } from "@/lib/actions/patient-dashboard.server";
import type { PatientDashboardSummaryResponse } from "@/types/patient-dashboard.types";

import { useQueryData } from "../core/useQueryData";
import { useAuth } from "../auth/useAuth";
import { useAuthStore } from "@/stores/auth.store";
import { useRBAC } from "../utils/useRBAC";
import { Permission } from "@/types/rbac.types";
import { useWebSocketStatus } from "@/app/providers/WebSocketProvider";

// ============================================================================
// First-load-only skeleton gate (mirrors the pattern in useAppointments.ts)
// ============================================================================
//
// While the React Query `placeholderData: keepPreviousData` keeps the *previous*
// payload visible during background refetches, we still need a way for UI to
// distinguish "never loaded in this session" (show skeleton) from "background
// refetch in flight" (don't flash a skeleton over the previous data).
//
// `useMyAppointments` solves this with a module-level `appointmentsLoadedState`
// keyed on `session_id`. We mirror that pattern here for the dashboard summary
// so that:
//
//   - First mount in a fresh session → `loaded = false` → skeleton shows
//   - First successful fetch → `loaded = true` (forever for this session)
//   - Subsequent refetches → `data` stays populated via `placeholderData`
//     AND `loaded` is true → no skeleton flash

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

/** True once the dashboard summary has returned successfully in this session. */
export const hasDashboardSummaryLoadedForSession = (): boolean =>
  dashboardSummaryLoadedState.loaded;

/** Reset on logout / session change so the next user sees a real skeleton. */
export const resetDashboardSummaryLoadedForSession = (): void => {
  dashboardSummaryLoadedState.sessionKey = "";
  dashboardSummaryLoadedState.loaded = false;
};

// ============================================================================
// Hook
// ============================================================================

export type UsePatientDashboardSummaryOptions = {
  /** Pass false to skip the request (e.g. before auth resolves). */
  enabled?: boolean;
};

export type UsePatientDashboardSummaryResult = ReturnType<
  typeof useQueryData<PatientDashboardSummaryResponse | null>
>;

/**
 * Single-round-trip dashboard summary hook.
 *
 * Replaces the fan-out of 5-7 separate hooks on `/patient/dashboard`:
 * appointments, vitals, prescriptions, comprehensive EHR, invoices, payments.
 *
 * The backend endpoint (`GET /api/patients/me/dashboard-summary`) fans out
 * internally via `Promise.all`, serves from a 60-second server-side cache,
 * and returns one merged response. The frontend keeps the previous summary
 * visible during background refetches via `placeholderData: keepPreviousData`.
 *
 * The hook also tracks a session-level "has loaded once" flag (mirrors the
 * pattern in `useMyAppointments`) so consumers can distinguish first-load
 * from background-refetch and avoid flashing a skeleton.
 */
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
      const result = await fetchPatientDashboardSummary();

      // Auth / clinic-context failures are not query errors — they're
      // a stable shape the page can branch on. Throw only on truly
      // unexpected failures.
      if (!result.success) {
        // Surface stable codes as readable messages; retry logic below
        // will skip retrying for the well-known sentinel codes.
        const code = (result as { code?: string }).code || "UNKNOWN";
        // Don't throw on UNAUTHENTICATED/CLINIC_CONTEXT_REQUIRED/
        // PROFILE_INCOMPLETE — these are terminal for this query.
        if (
          code === "UNAUTHENTICATED" ||
          code === "CLINIC_CONTEXT_REQUIRED" ||
          code === "PROFILE_INCOMPLETE"
        ) {
          // Return null; the UI's profile-completion / no-clinic paths
          // handle this without a skeleton.
          return null;
        }
        throw new Error(result.error || "Failed to load dashboard summary");
      }

      const sessionKey =
        useAuthStore.getState().session?.session_id ||
        `${String(userId || "")}|${String(clinicId || "")}`;
      markDashboardSummaryLoadedOnce(sessionKey);

      return result.data;
    },
    {
      enabled:
        (options.enabled ?? true) &&
        !!userId &&
        hasPermission(Permission.VIEW_APPOINTMENTS),
      // 60s mirrors the server-side TTL. Reuse the response for the same
      // window so navigating away and back doesn't refetch.
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: !isAuthRefreshing,
      // While the WebSocket is connected the realtime layer invalidates
      // this cache on lifecycle events; only poll as a fallback when
      // the socket is offline (or auth is refreshing, where we let the
      // foreground handle the refetch).
      refetchInterval: isConnected || isAuthRefreshing ? false : 60_000,
      retry: (failureCount, error: Error) => {
        const message = error.message || "";
        if (message.includes("Access denied") || message.includes("Not authenticated")) {
          return false;
        }
        return failureCount < 2;
      },
      // Keep the previous summary visible during background refetches.
      // First load still surfaces isPending=true (gated by
      // hasDashboardSummaryLoadedForSession in the UI).
      placeholderData: keepPreviousData,
    }
  );

  return query;
};

// ============================================================================
// Prefetch (for DashboardLayout warm-up)
// ============================================================================

/**
 * Prefetches the dashboard summary into the React Query cache. Used by
 * `DashboardLayout` and `usePrefetchAppointmentsForRole` so the first
 * render of `/patient/dashboard` reads from cache, not a fresh fetch.
 */
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
        const result = await fetchPatientDashboardSummary();
        if (!result.success) {
          if (
            (result as { code?: string }).code === "UNAUTHENTICATED" ||
            (result as { code?: string }).code === "CLINIC_CONTEXT_REQUIRED" ||
            (result as { code?: string }).code === "PROFILE_INCOMPLETE"
          ) {
            return null;
          }
          throw new Error(result.error || "Failed to prefetch dashboard summary");
        }
        const sessionKey =
          state.session?.session_id || `${String(userId)}|${String(clinicId)}`;
        markDashboardSummaryLoadedOnce(sessionKey);
        return result.data;
      },
      staleTime: 60 * 1000,
    });
  } catch {
    // Best-effort: never let prefetch failures bubble up to the layout.
  }
};

/**
 * Hook variant of `prefetchPatientDashboardSummary` for layout-level
 * warm-up. Mounts a `useEffect` that prefetches the summary as soon
 * as the user id and clinic id are available.
 */
export const usePrefetchPatientDashboardSummary = (): void => {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const userId = session?.user?.id;
  const clinicId =
    (session?.user as { clinicId?: string; primaryClinicId?: string } | undefined)?.clinicId ||
    (session?.user as { primaryClinicId?: string } | undefined)?.primaryClinicId;

  useEffect(() => {
    if (!userId || !clinicId) return;
    void prefetchPatientDashboardSummary(queryClient, { userId, clinicId });
  }, [queryClient, userId, clinicId]);
};
