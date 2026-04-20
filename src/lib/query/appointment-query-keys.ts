import type { AppointmentFilters } from '@/types/appointment.types';

export function serializeAppointmentFilters(
  filters: AppointmentFilters & { omitClinicId?: boolean } = {}
): string {
  return Object.entries(filters)
    .filter(([key, value]) => key !== 'omitClinicId' && value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${Array.isArray(value) ? value.join(',') : String(value)}`)
    .join('|');
}

export function toAppointmentFilterParams(
  filters: AppointmentFilters & { omitClinicId?: boolean } = {}
): Record<string, string | number> {
  const params: Record<string, string | number> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (key === 'omitClinicId' || value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        params[key] = value.join(',');
      }
      return;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      params[key] = value;
    }
  });

  return params;
}

export function serializeAppointmentQueryKey(
  clinicId?: string,
  clinicIdOrFilters?: string | (AppointmentFilters & { omitClinicId?: boolean })
) {
  if (typeof clinicIdOrFilters === 'string') {
    return ['appointments', clinicIdOrFilters, ''];
  }

  const filters = clinicIdOrFilters ?? {};
  return ['appointments', clinicId ?? '__all__', serializeAppointmentFilters(filters)];
}

export function getAppointmentQueryKey(
  clinicId?: string,
  filters: AppointmentFilters & { omitClinicId?: boolean } = {}
) {
  return ['appointments', clinicId ?? '__all__', serializeAppointmentFilters(filters)];
}
