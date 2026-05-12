import { APP_CONFIG } from '@/lib/config/config';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuidLike(value: string | null | undefined): boolean {
  return !!value && UUID_REGEX.test(value.trim());
}

export function normalizeClinicId(value: string | null | undefined): string {
  const fallbackClinicId = APP_CONFIG.CLINIC.ID?.trim() || '';
  const candidate = value?.trim() || '';

  if (!candidate) {
    return fallbackClinicId;
  }

  // Prefer the configured public clinic code in deployments that expose one.
  // This prevents stale UUIDs from old persisted state from leaking into headers
  // and route params when the live tenant is addressed by a clinic code.
  if (fallbackClinicId && UUID_REGEX.test(candidate)) {
    return fallbackClinicId;
  }

  return candidate;
}
