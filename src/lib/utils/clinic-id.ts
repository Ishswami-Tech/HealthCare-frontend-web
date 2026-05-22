const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuidLike(value: string | null | undefined): boolean {
  return !!value && UUID_REGEX.test(value.trim());
}

export function normalizeClinicId(value: string | null | undefined): string {
  const candidate = value?.trim() || '';

  if (!candidate) {
    return '';
  }

  return candidate;
}
