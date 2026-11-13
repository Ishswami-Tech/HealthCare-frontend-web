import { clinicApiClient } from '@/lib/api/client';
import type { AppointmentFilters } from '@/types/appointment.types';

export interface AppointmentListResult {
  appointments: unknown[];
  meta: unknown;
}

/**
 * `GET /appointments` straight from the browser (no server action, so no Vercel Function per
 * load or poll). Same backend contract as the `getAppointments` server action; the backend's
 * envelope is unwrapped here: raw array, `{ appointments }`, `{ data }` or `{ data: { appointments } }`.
 */
export async function fetchAppointmentList(filters: AppointmentFilters): Promise<AppointmentListResult> {
  // The backend list parser expects `status` as one comma-separated string.
  const status = Array.isArray(filters.status)
    ? filters.status.length > 0
      ? filters.status.join(',')
      : undefined
    : filters.status ?? undefined;

  const response = await clinicApiClient.getAppointments({
    ...(filters.clinicId ? { clinicId: filters.clinicId } : {}),
    ...(filters.patientId ? { patientId: filters.patientId } : {}),
    ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
    ...(filters.locationId ? { locationId: filters.locationId } : {}),
    ...(status ? { status: String(status) } : {}),
    ...(filters.date ? { date: filters.date } : {}),
    ...(filters.startDate ? { startDate: filters.startDate } : {}),
    ...(filters.endDate ? { endDate: filters.endDate } : {}),
    ...(filters.page ? { page: filters.page } : {}),
    ...(filters.limit ? { limit: filters.limit } : {}),
  });

  if (!response.success) {
    const failed = response as { error?: string; message?: string };
    throw new Error(failed.error || failed.message || 'Failed to fetch appointments');
  }

  const payload = response.data as
    | unknown[]
    | { appointments?: unknown; data?: unknown; pagination?: unknown }
    | null
    | undefined;
  const nested = !Array.isArray(payload) && payload ? payload.data : undefined;
  const appointments = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.appointments)
      ? payload.appointments
      : Array.isArray(nested)
        ? nested
        : nested && typeof nested === 'object' && Array.isArray((nested as { appointments?: unknown }).appointments)
          ? ((nested as { appointments: unknown[] }).appointments)
          : [];
  const meta =
    (!Array.isArray(payload) && payload ? payload.pagination : undefined) ??
    (response as { meta?: unknown }).meta;
  return { appointments, meta };
}
