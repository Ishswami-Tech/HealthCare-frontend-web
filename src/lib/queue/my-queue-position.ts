import { asRecord } from '@/lib/utils/coerce';

/**
 * A patient's own place in today's clinic queue (backend `QueueController`):
 *   GET queue/me                      the caller's live queue entry for today, or `null`
 *   GET queue/me?appointmentId=<id>   the same, for one visit
 */

/** Mirrors the backend `MyQueuePosition`. Only what the route returns — no other patients. */
export interface MyQueuePosition {
  appointmentId: string;
  doctorId: string;
  locationId: string | null;
  /** Upper case queue status, for example WAITING or IN_PROGRESS. */
  status: string;
  /** 1-based position in this doctor's live queue. */
  position: number;
  patientsAhead: number;
  totalInQueue: number;
  /** True when someone in this queue is with the doctor right now. */
  nowServing: boolean;
  /** Minutes. 0 when the patient is with the doctor. */
  estimatedWaitTime: number;
  checkedInAt: string | null;
}

function wholeNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : fallback;
}

/**
 * The route answers `{ success, data: MyQueuePosition | null, meta }`. The API client lifts
 * `data` out of that envelope; this also accepts the envelope itself, so either shape works.
 */
export function readQueuePosition(payload: unknown): MyQueuePosition | null {
  const outer = asRecord(payload);
  if (!outer) return null;
  const entry = typeof outer.appointmentId === 'string' ? outer : asRecord(outer.data);
  if (!entry || typeof entry.appointmentId !== 'string' || !entry.appointmentId) return null;

  const patientsAhead = wholeNumber(entry.patientsAhead, 0);
  const position = Math.max(1, wholeNumber(entry.position, patientsAhead + 1));
  return {
    appointmentId: entry.appointmentId,
    doctorId: typeof entry.doctorId === 'string' ? entry.doctorId : '',
    locationId: typeof entry.locationId === 'string' && entry.locationId ? entry.locationId : null,
    status: String(entry.status || 'WAITING').toUpperCase(),
    position,
    patientsAhead,
    totalInQueue: Math.max(position, wholeNumber(entry.totalInQueue, position)),
    nowServing: entry.nowServing === true,
    estimatedWaitTime: wholeNumber(entry.estimatedWaitTime, 0),
    checkedInAt: typeof entry.checkedInAt === 'string' && entry.checkedInAt ? entry.checkedInAt : null,
  };
}
