/**
 * PHI-safe URL handling for product analytics (PostHog).
 *
 * Analytics events must not carry patient identifiers. URLs in this app put record ids, clinic
 * codes and invite tokens in the path and search/filter text (names, phones) in the query string,
 * so every URL-like property is reduced to origin + path with id-like segments replaced by `:id`
 * before an event leaves the browser.
 */

const ID_PLACEHOLDER = ":id";

const ID_LIKE_SEGMENT: ReadonlyArray<RegExp> = [
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, // UUID
  /^\+?\d{3,}$/, // numeric ids, phone numbers
  /^[a-z]{1,5}\d{3,}$/i, // codes such as CL0002, LOC0001, UID123
  /@/, // email addresses
  /^(?=.*\d)[a-z0-9_-]{16,}$/i, // opaque tokens (long, contain a digit)
];

/** Property keys that hold a URL, path or referrer. */
const URL_PROPERTY = /(url|pathname|referrer)$/i;

interface AnalyticsEventLike {
  properties?: Record<string, unknown> | undefined;
  $set?: Record<string, unknown> | undefined;
  $set_once?: Record<string, unknown> | undefined;
}

function scrubSegment(segment: string): string {
  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    // keep the raw segment
  }
  return ID_LIKE_SEGMENT.some((pattern) => pattern.test(decoded))
    ? ID_PLACEHOLDER
    : segment;
}

/** `/patient/records/104233` → `/patient/records/:id`. */
export function sanitizeAnalyticsPath(path: string): string {
  return path.split("/").map(scrubSegment).join("/");
}

/**
 * Absolute URL → origin + scrubbed path; path → scrubbed path. Query string and hash are always
 * dropped. Anything else (e.g. PostHog's `$direct` referrer marker) is returned unchanged.
 */
export function sanitizeAnalyticsUrl(value: string): string {
  if (value.startsWith("/")) {
    return sanitizeAnalyticsPath(value.split(/[?#]/)[0] ?? "/");
  }
  if (!/^https?:\/\//i.test(value)) {
    return value;
  }
  try {
    const url = new URL(value);
    return `${url.origin}${sanitizeAnalyticsPath(url.pathname)}`;
  } catch {
    return "";
  }
}

function scrubProperties(
  properties: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!properties) {
    return properties;
  }
  return Object.fromEntries(
    Object.entries(properties).map(([key, value]) => [
      key,
      URL_PROPERTY.test(key) && typeof value === "string"
        ? sanitizeAnalyticsUrl(value)
        : value,
    ]),
  );
}

/** PostHog `before_send` hook: returns a copy with every URL-like property scrubbed. */
export function sanitizeAnalyticsEvent<T extends AnalyticsEventLike>(
  event: T,
): T {
  return {
    ...event,
    properties: scrubProperties(event.properties),
    ...(event.$set ? { $set: scrubProperties(event.$set) } : {}),
    ...(event.$set_once ? { $set_once: scrubProperties(event.$set_once) } : {}),
  };
}
