/**
 * Device position for the patient check-in.
 *
 * A typed desk code (the plain code printed under the QR) can be read off a photo from anywhere,
 * so the backend requires the device position with it (400 LOCATION_REQUIRED / 403 TOO_FAR).
 * A scanned signed poster is its own presence proof: the position is attached only when the
 * browser already has permission, and never blocks the scan.
 */

export interface DeviceFix {
  lat: number;
  lng: number;
  /** Accuracy radius in metres (the backend allows a capped GPS allowance with it). */
  accuracy?: number;
}

export type LocationFailure = "denied" | "unavailable" | "timeout" | "unsupported";

export type DeviceFixResult = { ok: true; fix: DeviceFix } | { ok: false; failure: LocationFailure };

/** How long a typed desk code waits for a high-accuracy fix. */
export const DESK_CODE_LOCATION_TIMEOUT_MS = 15_000;

/** The scanned-poster path never waits long for an (optional) position. */
const OPTIONAL_FIX_TIMEOUT_MS = 5_000;

/**
 * True for the plain printed desk code (anything that is not the signed poster JSON
 * `{ type: "LOCATION_CHECK_IN", locationId, ... }`). Same rule the backend uses.
 */
export function isTypedDeskCode(text: string): boolean {
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      const record = parsed as { type?: unknown; locationId?: unknown };
      return !(record.type === "LOCATION_CHECK_IN" && typeof record.locationId === "string");
    }
  } catch {
    // not JSON: the printed desk code
  }
  return true;
}

function toFix(position: GeolocationPosition): DeviceFix {
  const { latitude, longitude, accuracy } = position.coords;
  return Number.isFinite(accuracy) && accuracy >= 0
    ? { lat: latitude, lng: longitude, accuracy: Math.round(accuracy) }
    : { lat: latitude, lng: longitude };
}

function failureOf(error: GeolocationPositionError): LocationFailure {
  if (error.code === error.PERMISSION_DENIED) return "denied";
  if (error.code === error.TIMEOUT) return "timeout";
  return "unavailable";
}

function hasGeolocation(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

/** Ask for the position (prompts for permission when needed). Never rejects. */
export function requestDeviceFix(timeoutMs: number = DESK_CODE_LOCATION_TIMEOUT_MS): Promise<DeviceFixResult> {
  return new Promise((resolve) => {
    if (!hasGeolocation()) {
      resolve({ ok: false, failure: "unsupported" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ ok: true, fix: toFix(position) }),
      (error) => resolve({ ok: false, failure: failureOf(error) }),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30_000 },
    );
  });
}

/** The position only when location permission is already granted (no prompt, short wait). */
export async function readFixIfGranted(): Promise<DeviceFix | null> {
  if (!hasGeolocation() || typeof navigator.permissions?.query !== "function") return null;
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    if (status.state !== "granted") return null;
  } catch {
    return null;
  }
  const result = await requestDeviceFix(OPTIONAL_FIX_TIMEOUT_MS);
  return result.ok ? result.fix : null;
}
