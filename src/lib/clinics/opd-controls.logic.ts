/**
 * Clinic service switches: QR self check-in, video consultations and in-person consultations.
 *
 * Source of truth is the backend: `clinic.settings.appointmentSettings.opdControls` plus the
 * per-doctor overrides in `appointmentSettings.doctorConsultationControls[doctorId]`. The web UI
 * mirrors the same rules only to hide options up front; the backend still refuses a disabled
 * action (availability `restrictions`, `QR_CHECK_IN_DISABLED`), and that refusal stays the
 * fallback when the cached clinic settings are stale.
 *
 * Kept free of React and path aliases so it runs under `node --test`.
 */

export type OpdServiceToggles = {
  /** Patients may check themselves in by scanning the clinic QR. Reception check-in is unaffected. */
  qrCheckInEnabled: boolean;
  /** Video consultations can be booked. */
  videoConsultationEnabled: boolean;
  /** In-person consultations can be booked (backend field name kept for compatibility). */
  generalConsultationEnabled: boolean;
};

export type OpdServiceToggleKey = keyof OpdServiceToggles;

export type ConsultationModeAvailability = {
  video: boolean;
  inPerson: boolean;
};

export const DEFAULT_OPD_SERVICE_TOGGLES: Readonly<OpdServiceToggles> = Object.freeze({
  qrCheckInEnabled: true,
  videoConsultationEnabled: true,
  generalConsultationEnabled: true,
});

export const OPD_SERVICE_TOGGLE_KEYS: readonly OpdServiceToggleKey[] = [
  "qrCheckInEnabled",
  "videoConsultationEnabled",
  "generalConsultationEnabled",
];

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Every switch defaults to on; only an explicit `false` turns it off. */
function flag(value: unknown): boolean {
  return value !== false;
}

/**
 * Accepts a clinic object, a clinic `settings` object or an `appointmentSettings` object and
 * returns the `appointmentSettings` record (empty when missing).
 */
export function readAppointmentSettings(source: unknown): UnknownRecord {
  if (!isRecord(source)) return {};
  if (isRecord(source.settings)) return readAppointmentSettings(source.settings);
  if (isRecord(source.appointmentSettings)) return source.appointmentSettings;
  if (isRecord(source.opdControls) || isRecord(source.opdControl) || isRecord(source.doctorConsultationControls)) {
    return source;
  }
  return {};
}

function readOpdRecord(appointmentSettings: UnknownRecord): UnknownRecord {
  if (isRecord(appointmentSettings.opdControls)) return appointmentSettings.opdControls;
  // Older clinics stored the same block under the singular key.
  if (isRecord(appointmentSettings.opdControl)) return appointmentSettings.opdControl;
  return {};
}

/** The clinic-level switches (defaults on). `source` may be a clinic, its settings or appointmentSettings. */
export function readOpdServiceToggles(source: unknown): OpdServiceToggles {
  const opd = readOpdRecord(readAppointmentSettings(source));
  return {
    qrCheckInEnabled: flag(opd.qrCheckInEnabled),
    videoConsultationEnabled: flag(opd.videoConsultationEnabled),
    generalConsultationEnabled: flag(opd.generalConsultationEnabled),
  };
}

/** Whether patients may self check-in with the clinic QR. */
export function isQrCheckInEnabled(source: unknown): boolean {
  return readOpdServiceToggles(source).qrCheckInEnabled;
}

/**
 * Bookable consultation modes, following the agreed contract:
 * clinic switch AND the doctor's override when one is set. A doctor override can only further
 * restrict; it never re-enables a mode the clinic turned off.
 */
export function resolveConsultationModes(
  source: unknown,
  doctorId?: string | null,
): ConsultationModeAvailability {
  const appointmentSettings = readAppointmentSettings(source);
  const clinic = readOpdServiceToggles(appointmentSettings);
  const controls = isRecord(appointmentSettings.doctorConsultationControls)
    ? appointmentSettings.doctorConsultationControls
    : {};
  const doctor = doctorId && isRecord(controls[doctorId]) ? controls[doctorId] : {};
  return {
    video: clinic.videoConsultationEnabled && flag(doctor.videoConsultationEnabled),
    inPerson: clinic.generalConsultationEnabled && flag(doctor.generalConsultationEnabled),
  };
}

/**
 * Returns a copy of the clinic `settings` with the given switches written into
 * `appointmentSettings.opdControls`, keeping every other key (pause state, emergency mode,
 * `requireLocationForQrCheckIn`, doctor overrides, other sections) untouched. The legacy
 * `opdControl` block is folded in so its values are not lost.
 */
export function mergeOpdServiceToggles(
  settings: unknown,
  patch: Partial<OpdServiceToggles>,
): UnknownRecord {
  const base: UnknownRecord = isRecord(settings) ? settings : {};
  const appointmentSettings: UnknownRecord = isRecord(base.appointmentSettings)
    ? base.appointmentSettings
    : {};
  const legacy = isRecord(appointmentSettings.opdControl) ? appointmentSettings.opdControl : {};
  const current = isRecord(appointmentSettings.opdControls) ? appointmentSettings.opdControls : {};
  const cleanPatch: Partial<OpdServiceToggles> = {};
  for (const key of OPD_SERVICE_TOGGLE_KEYS) {
    const value = patch[key];
    if (typeof value === "boolean") cleanPatch[key] = value;
  }
  return {
    ...base,
    appointmentSettings: {
      ...appointmentSettings,
      opdControls: { ...legacy, ...current, ...cleanPatch },
    },
  };
}

/**
 * The smallest `settings` patch for `PUT /clinics/:id` that sets the given switches. The backend
 * merges settings one level deep, so `appointmentSettings` keys are merged but `opdControls` is
 * replaced as a whole: the patch therefore carries the full, merged `opdControls` block.
 */
export function buildOpdServiceTogglesPatch(
  settings: unknown,
  patch: Partial<OpdServiceToggles>,
): { appointmentSettings: { opdControls: UnknownRecord } } {
  const merged = mergeOpdServiceToggles(settings, patch);
  const appointmentSettings = merged.appointmentSettings as UnknownRecord;
  return { appointmentSettings: { opdControls: appointmentSettings.opdControls as UnknownRecord } };
}

/**
 * True when a check-in refusal means the clinic turned QR self check-in off. The backend maps
 * this reason to the public code `OTHER`, so the message is matched as well as the code.
 */
export function isQrCheckInDisabledError(error: unknown): boolean {
  const record: UnknownRecord = isRecord(error) ? error : {};
  const code = typeof record.code === "string" ? record.code : "";
  if (code === "QR_CHECK_IN_DISABLED") return true;
  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : typeof record.message === "string"
          ? record.message
          : typeof record.error === "string"
            ? record.error
            : "";
  return /qr check-?in is (turned )?off/i.test(message);
}

/** Copy for the three switches, shared by the clinic-admin and super-admin screens. */
export const OPD_SERVICE_TOGGLE_COPY: Readonly<
  Record<OpdServiceToggleKey, { label: string; description: string }>
> = Object.freeze({
  qrCheckInEnabled: {
    label: "QR self check-in",
    description:
      "Patients scan the clinic QR to check themselves in. When off, reception checks patients in from the queue.",
  },
  videoConsultationEnabled: {
    label: "Video consultations",
    description: "Patients and staff can book video visits. When off, video booking is hidden.",
  },
  generalConsultationEnabled: {
    label: "In-person consultations",
    description: "In-clinic visits can be booked. When off, new in-person bookings are refused.",
  },
});

/** Shown in booking when neither consultation type can be booked. */
export const BOOKING_PAUSED_COPY = Object.freeze({
  title: "Online booking is paused at this clinic",
  description: "Please contact the clinic to arrange a visit.",
});
