import type { QueryClient, QueryKey } from "@tanstack/react-query";

import type { Appointment } from "@/types/appointment.types";

type AppointmentCachePayload = unknown;

const DEFAULT_APPOINTMENT_QUERY_KEYS: QueryKey[] = [
  ["myAppointments"],
  ["appointments"],
  ["userUpcomingAppointments"],
  ["appointment"],
  ["video-appointments"],
  ["video-appointment"],
];

const getAppointmentCacheId = (appointment: unknown): string => {
  if (!appointment || typeof appointment !== "object") {
    return "";
  }

  const record = appointment as Record<string, unknown>;
  return String(record.appointmentId || record.id || "");
};

const getAppointmentTimestamp = (appointment: unknown): number => {
  if (!appointment || typeof appointment !== "object") {
    return 0;
  }

  const record = appointment as Record<string, unknown>;
  const timestamp = String(record.updatedAt || record.updated_at || record.createdAt || record.created_at || "");
  const parsed = new Date(timestamp);
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : 0;
};

const mergeAppointmentRecord = (
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>
): Record<string, unknown> => {
  const existingUpdatedAt = getAppointmentTimestamp(existing);
  const incomingUpdatedAt = getAppointmentTimestamp(incoming);
  return incomingUpdatedAt >= existingUpdatedAt ? { ...existing, ...incoming } : { ...incoming, ...existing };
};

const upsertAppointmentCollection = (
  items: unknown,
  appointmentToInsert: Record<string, unknown>
): unknown => {
  if (!Array.isArray(items)) {
    return items;
  }

  const targetId = getAppointmentCacheId(appointmentToInsert);
  if (!targetId) {
    return items;
  }

  const existingIndex = items.findIndex((item) => getAppointmentCacheId(item) === targetId);
  if (existingIndex >= 0) {
    return items.map((item, index) => {
      if (index !== existingIndex) {
        return item;
      }

      if (item && typeof item === "object") {
        return mergeAppointmentRecord(item as Record<string, unknown>, appointmentToInsert);
      }

      return appointmentToInsert;
    });
  }

  return [...items, appointmentToInsert];
};

const upsertAppointmentPayload = (
  payload: AppointmentCachePayload,
  appointmentToInsert: Record<string, unknown>
): AppointmentCachePayload => {
  if (Array.isArray(payload)) {
    return upsertAppointmentCollection(payload, appointmentToInsert);
  }

  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const record = payload as Record<string, unknown>;
  const nextRecord: Record<string, unknown> = { ...record };
  let changed = false;

  if (Array.isArray(record.appointments)) {
    nextRecord.appointments = upsertAppointmentCollection(record.appointments, appointmentToInsert);
    changed = true;
  }

  if (Array.isArray(record.data)) {
    nextRecord.data = upsertAppointmentCollection(record.data, appointmentToInsert);
    changed = true;
  }

  if (record.data && typeof record.data === "object") {
    const nestedData = record.data as Record<string, unknown>;
    const nestedRecord: Record<string, unknown> = { ...nestedData };

    if (Array.isArray(nestedData.appointments)) {
      nestedRecord.appointments = upsertAppointmentCollection(nestedData.appointments, appointmentToInsert);
      changed = true;
    }

    if (Array.isArray(nestedData.data)) {
      nestedRecord.data = upsertAppointmentCollection(nestedData.data, appointmentToInsert);
      changed = true;
    }

    if (changed) {
      nextRecord.data = nestedRecord;
    }
  }

  return changed ? nextRecord : payload;
};

export function syncAppointmentInCache(
  queryClient: Pick<QueryClient, "setQueriesData">,
  appointment: Appointment | Record<string, unknown>,
  options?: {
    appointmentStatus?: Appointment["status"];
    queryKeys?: QueryKey[];
  }
) {
  const appointmentRecord =
    appointment && typeof appointment === "object"
      ? {
          ...(appointment as Record<string, unknown>),
          ...(options?.appointmentStatus ? { status: options.appointmentStatus } : {}),
        }
      : null;

  if (!appointmentRecord) {
    return;
  }

  const queryKeys = options?.queryKeys?.length ? options.queryKeys : DEFAULT_APPOINTMENT_QUERY_KEYS;
  queryKeys.forEach((queryKey) => {
    queryClient.setQueriesData({ queryKey, exact: false }, (current) =>
      upsertAppointmentPayload(current, appointmentRecord)
    );
  });
}
