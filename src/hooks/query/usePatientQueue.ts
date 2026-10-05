"use client";

import { useQueryData } from "../core/useQueryData";
import { useAuth } from "../auth/useAuth";
import { useAuthStore } from "@/stores/auth.store";
import { fetchMyQueuePosition, type MyQueuePosition } from "@/lib/actions/patient-queue.server";

export type { MyQueuePosition } from "@/lib/actions/patient-queue.server";

/** How often the patient's queue place is read again while the tab is visible. */
export const PATIENT_QUEUE_REFRESH_MS = 30 * 1000;

/** Query keys for the patient's own queue place. Clinic-aware: a queue belongs to one clinic. */
export const patientQueueKeys = {
  all: ["patientQueue"] as const,
  me: (clinicId: string | undefined, userId: string | undefined, appointmentId?: string) =>
    ["patientQueue", "me", clinicId, userId, appointmentId?.trim() || null] as const,
};

export type UsePatientQueueOptions = {
  /** Narrow to one visit. Left out, the backend returns the patient's active entry for today. */
  appointmentId?: string;
  enabled?: boolean;
};

function useQueueScope() {
  const { session } = useAuth();
  const isAuthRefreshing = useAuthStore((state) => state.isRefreshing);
  const sessionUser = session?.user as
    | { id?: string; role?: string; clinicId?: string; primaryClinicId?: string }
    | undefined;
  return {
    userId: sessionUser?.id,
    isPatient: String(sessionUser?.role || "").toUpperCase() === "PATIENT",
    clinicId: sessionUser?.clinicId || sessionUser?.primaryClinicId || undefined,
    isAuthRefreshing,
  };
}

const queueRetry = (failureCount: number, error: Error) => {
  const message = error.message || "";
  if (
    message.includes("Access denied") ||
    message.includes("Not authenticated") ||
    message.includes("Forbidden")
  ) {
    return false;
  }
  return failureCount < 2;
};

/**
 * The signed-in patient's own place in today's clinic queue (`GET queue/me`).
 *
 * Resolves to `null` when the patient is not in a queue, so a page can show its empty state
 * without catching an error. Reads again every 30 seconds while the tab is visible, and when
 * the tab comes back into view. Patients only: the backend route is patient-only, and the
 * staff queue list is never requested.
 */
export const usePatientQueue = (options: UsePatientQueueOptions = {}) => {
  const { userId, isPatient, clinicId, isAuthRefreshing } = useQueueScope();
  const appointmentId = options.appointmentId?.trim() || undefined;

  return useQueryData<MyQueuePosition | null>(
    patientQueueKeys.me(clinicId, userId, appointmentId),
    async () => {
      const result = await fetchMyQueuePosition(appointmentId);
      if (!result.success) {
        if (result.code === "UNAUTHENTICATED" || result.code === "CLINIC_CONTEXT_REQUIRED") {
          return null;
        }
        throw new Error(result.error || "Failed to fetch your queue position");
      }
      return result.data;
    },
    {
      enabled: (options.enabled ?? true) && !!userId && isPatient,
      staleTime: PATIENT_QUEUE_REFRESH_MS / 2,
      gcTime: 5 * 60 * 1000,
      refetchInterval: isAuthRefreshing ? false : PATIENT_QUEUE_REFRESH_MS,
      // The timer stops while the tab is hidden; coming back reads the place again.
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: !isAuthRefreshing,
      refetchOnReconnect: !isAuthRefreshing,
      retry: queueRetry,
    }
  );
};
