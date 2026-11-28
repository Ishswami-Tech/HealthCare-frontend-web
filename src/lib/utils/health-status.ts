import type { DetailedHealthStatus } from "@/hooks/query/useHealth";

/**
 * Header status (MinimalStatusIndicator) derived from the latest health snapshot.
 *
 * One failed or timed-out `/health` probe is not an outage: it shows amber "checking" until
 * `PROBE_FAILURES_FOR_OUTAGE` probes in a row have failed. A backend-reported core failure
 * (database / cache) turns red only once it has been seen on `CORE_FAILURES_FOR_OUTAGE`
 * consecutive polls; a live socket snapshot (no streak) is the backend's own report and counts
 * as confirmed. Supporting services (queue, communication, video) only ever degrade (amber).
 */
export type GlobalHealthState = "loading" | "operational" | "checking" | "degraded" | "down";

export const PROBE_FAILURES_FOR_OUTAGE = 3;
export const CORE_FAILURES_FOR_OUTAGE = 2;

interface ServiceLike {
  status?: string;
  healthy?: boolean;
  isHealthy?: boolean;
  degraded?: boolean;
}

function isUnhealthy(service: ServiceLike | undefined): boolean {
  if (!service) return false;
  return (
    service.status === "down" ||
    service.status === "unavailable" ||
    service.healthy === false ||
    service.isHealthy === false
  );
}

function isDegraded(service: ServiceLike | undefined): boolean {
  return Boolean(service && (service.status === "degraded" || service.degraded === true));
}

/** True when this snapshot counts as a failure for the consecutive-failure streak. */
export function isHealthSnapshotFailing(status: DetailedHealthStatus): boolean {
  return Boolean(status.probeFailed) || isUnhealthy(status.database) || isUnhealthy(status.cache);
}

/** Streak after `status` arrives: +1 on a failing snapshot, reset to 0 on a healthy one. */
export function nextHealthFailureStreak(previous: number, status: DetailedHealthStatus): number {
  return isHealthSnapshotFailing(status) ? previous + 1 : 0;
}

export function deriveGlobalHealthState(status: DetailedHealthStatus | null | undefined): GlobalHealthState {
  if (!status) return "loading";
  const streak = status.failureStreak;

  if (status.probeFailed) {
    return (streak ?? PROBE_FAILURES_FOR_OUTAGE) >= PROBE_FAILURES_FOR_OUTAGE ? "down" : "checking";
  }

  const core = [status.database, status.cache];
  const supporting = [status.queue, status.communication, status.video];
  if (core.some(isUnhealthy)) {
    return (streak ?? CORE_FAILURES_FOR_OUTAGE) >= CORE_FAILURES_FOR_OUTAGE ? "down" : "degraded";
  }
  if (supporting.some(isUnhealthy) || [...core, ...supporting].some(isDegraded)) return "degraded";
  return "operational";
}
