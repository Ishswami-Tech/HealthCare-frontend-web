export interface QueueStatusSnapshot {
  currentToken?: number;
  totalInQueue?: number;
  estimatedWaitTime?: number;
  averageWaitTime?: number;
  inProgress?: number;
  completedToday?: number;
  waiting?: number;
  [key: string]: unknown;
}

const ALL_QUEUES_KEY = '__all__';

export type QueueListFilters = {
  type?: string;
  treatmentType?: string;
  status?: string;
  doctorId?: string;
  date?: string;
};

function toStableQueueValue(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => toStableQueueValue(entry)).join(',')}]`;
  }

  if (typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${key}:${toStableQueueValue(entry)}`)
      .join(',')}}`;
  }

  return String(value);
}

export function serializeQueueFilters(filters?: QueueListFilters) {
  if (!filters) {
    return '';
  }

  return toStableQueueValue(filters);
}

export function getQueueListQueryKey(clinicId?: string, filters?: QueueListFilters) {
  return [
    'queue',
    clinicId ?? ALL_QUEUES_KEY,
    serializeQueueFilters(filters),
  ] as const;
}

export function getQueueStatusQueryKey(
  clinicId?: string,
  locationId?: string,
  queueName?: string
) {
  return [
    'queue-status',
    clinicId ?? ALL_QUEUES_KEY,
    queueName ?? ALL_QUEUES_KEY,
    locationId ?? ALL_QUEUES_KEY,
  ] as const;
}

export function getQueueStatsQueryKey(locationId?: string, clinicId?: string) {
  return getQueueStatusQueryKey(clinicId, locationId);
}

export function normalizeQueueStatusSnapshot(payload: unknown): QueueStatusSnapshot {
  if (!payload || typeof payload !== 'object') {
    return {};
  }

  const data =
    'data' in payload &&
    payload.data &&
    typeof payload.data === 'object' &&
    !Array.isArray(payload.data)
      ? (payload.data as Record<string, unknown>)
      : (payload as Record<string, unknown>);

  return data as QueueStatusSnapshot;
}
