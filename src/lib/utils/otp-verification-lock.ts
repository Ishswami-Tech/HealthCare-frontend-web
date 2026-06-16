const OTP_VERIFICATION_LOCK_PREFIX = 'auth:verified-otp';
const OTP_VERIFICATION_LOCK_TTL_MS = 10 * 60 * 1000;

function normalizeOtpIdentifier(identifier: string): string {
  const trimmed = identifier.trim();

  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }

  const cleaned = trimmed.replace(/[^\d+]/g, '');
  if (!cleaned) {
    return cleaned;
  }
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  return `+${cleaned}`;
}

function normalizeClinicId(clinicId?: string): string {
  return clinicId?.trim() || '';
}

function buildOtpVerificationLockKey(identifier: string, clinicId?: string): string {
  return [
    OTP_VERIFICATION_LOCK_PREFIX,
    normalizeClinicId(clinicId) || 'default',
    normalizeOtpIdentifier(identifier),
  ].join(':');
}

function isSessionStorageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function readOtpVerificationLock(key: string): number | null {
  if (!isSessionStorageAvailable()) {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(key);
    if (!rawValue) {
      return null;
    }

    const createdAt = Number(rawValue);
    if (!Number.isFinite(createdAt)) {
      window.sessionStorage.removeItem(key);
      return null;
    }

    if (Date.now() - createdAt > OTP_VERIFICATION_LOCK_TTL_MS) {
      window.sessionStorage.removeItem(key);
      return null;
    }

    return createdAt;
  } catch {
    return null;
  }
}

export function isOtpVerificationLocked(identifier: string, clinicId?: string): boolean {
  return readOtpVerificationLock(buildOtpVerificationLockKey(identifier, clinicId)) !== null;
}

export function markOtpVerificationLocked(identifier: string, clinicId?: string): void {
  if (!isSessionStorageAvailable()) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      buildOtpVerificationLockKey(identifier, clinicId),
      String(Date.now())
    );
  } catch {
    // Ignore storage failures; in-flight mutation locks still prevent duplicate submits.
  }
}

export function clearOtpVerificationLock(identifier: string, clinicId?: string): void {
  if (!isSessionStorageAvailable()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(buildOtpVerificationLockKey(identifier, clinicId));
  } catch {
    // Ignore storage failures.
  }
}
