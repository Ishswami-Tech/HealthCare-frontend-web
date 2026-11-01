/**
 * The walk-in's own check-in result, carried to the check-in success step (D12).
 *
 * The walk-in call returns the visit already checked in (status, check-in time, token). The success
 * step then reads GET /appointments/:id, and that read can lag the write: the first walk-in of the
 * day showed "NOT CHECKED IN YET" with no token while the toast said "Checked in · token A-003" and
 * the database had the check-in. So the walk-in remembers its response (in memory, per
 * appointment) and the success step overlays it on a record that does not show the check-in yet,
 * and keeps re-reading until the server agrees. A record that has moved on (with the doctor,
 * completed, cancelled ...) always wins. Pure, framework-free.
 */
import type { QueryClient } from "@tanstack/react-query";
import type { InPersonVisit } from "@/types/in-person.types";

export interface WalkInVisitSeed {
  appointmentId: string;
  appointmentStatus: string;
  checkedInAt: string;
  token: string | null;
  position: number | null;
}

type Row = Record<string, unknown>;

/** Statuses past "checked in": the server's record is newer than the walk-in response. */
const MOVED_ON = new Set(["IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW", "EXPIRED"]);

export const walkInVisitSeedKey = (appointmentId: string) => ["walkInVisitSeed", appointmentId] as const;

const upper = (value: unknown): string => (typeof value === "string" ? value.trim().toUpperCase() : "");

/** The seed of a checked-in walk-in response, or null when the response did not check the patient in. */
export function walkInVisitSeedOf(
  visit: Pick<InPersonVisit, "appointmentId" | "appointmentStatus" | "checkedInAt" | "token" | "position"> | null | undefined,
): WalkInVisitSeed | null {
  if (!visit?.appointmentId || !visit.checkedInAt) return null;
  return {
    appointmentId: visit.appointmentId,
    appointmentStatus: visit.appointmentStatus,
    checkedInAt: visit.checkedInAt,
    token: visit.token ?? null,
    position: visit.position ?? null,
  };
}

/** True when the server's record already shows the check-in (or has moved past it). */
export function serverShowsCheckIn(row: Row | null | undefined): boolean {
  if (!row) return false;
  const status = upper(row.status);
  return Boolean(row.checkedInAt) || status === "CHECKED_IN" || status === "QUEUED" || MOVED_ON.has(status);
}

/** The record to show: the server's, with the walk-in's check-in laid over it until the server has it. */
export function overlayWalkInVisit(row: Row | null, seed: WalkInVisitSeed | null | undefined): Row | null {
  if (!row || !seed) return row;
  const rowId = typeof row.id === "string" ? row.id : typeof row.appointmentId === "string" ? row.appointmentId : "";
  if (rowId && rowId !== seed.appointmentId) return row;
  if (serverShowsCheckIn(row)) return row;
  return {
    ...row,
    status: seed.appointmentStatus || row.status,
    checkedInAt: seed.checkedInAt,
    ...(seed.token && !row.tokenLabel ? { tokenLabel: seed.token } : {}),
    ...(seed.position !== null && (row.queuePosition === undefined || row.queuePosition === null) ? { queuePosition: seed.position } : {}),
  };
}

/** Called by the walk-in right after its response: the success step reads it once on open. */
export function rememberWalkInVisit(
  queryClient: Pick<QueryClient, "setQueryData">,
  visit: Parameters<typeof walkInVisitSeedOf>[0],
): void {
  const seed = walkInVisitSeedOf(visit);
  if (seed) queryClient.setQueryData<WalkInVisitSeed>(walkInVisitSeedKey(seed.appointmentId), seed);
}
