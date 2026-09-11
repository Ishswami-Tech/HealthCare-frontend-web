// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (!dsn) {
  // eslint-disable-next-line no-console
  console.warn("[Sentry] SENTRY_DSN is not set — edge error reporting is disabled.");
}

Sentry.init({
  dsn: dsn || "",

  // Only enable tracing in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Disable sending PII by default (healthcare compliance)
  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },

  // Scrub PHI/PII from all outgoing Sentry events
  beforeSend(event, hint) {
    if (event) {
      sanitizeEvent(event);
    }
    if (hint?.originalException instanceof Error) {
      sanitizeError(hint.originalException);
    }
    return event;
  },
});

// ─── PHI Scrubbing Utilities (shared) ────────────────────────────────────────

const PHI_PATTERNS = [
  // Aadhaar / National ID (12 digits)
  { pattern: /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g, label: "[REDACTED-AADHAAR]" },
  // Indian phone numbers
  { pattern: /\+91[\s\-]?\d{10}\b/g, label: "[REDACTED-PHONE]" },
  { pattern: /\b[6-9]\d{9}\b/g, label: "[REDACTED-PHONE]" },
  // Email addresses
  { pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, label: "[REDACTED-EMAIL]" },
  // Date of birth (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD)
  {
    pattern: /\b(0[1-9]|[12]\d|3[01])[\/\-](0[1-9]|1[0-2])[\/\-](19|20)\d{2}\b/g,
    label: "[REDACTED-DOB]",
  },
  { pattern: /\b(19|20)\d{2}[\/\-](0[1-9]|1[0-2])[\/\-](0[1-9]|[12]\d|3[01])\b/g, label: "[REDACTED-DOB]" },
  // Medical record numbers (alphanumeric, 6-20 chars with dashes)
  { pattern: /\b[Mm][Rr][Nn][:\s\-]*([A-Z0-9\-]{6,20})\b/g, label: "MRN:[REDACTED]" },
  // PAN card (India)
  { pattern: /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g, label: "[REDACTED-PAN]" },
  // Generic OTP / 6-digit codes (common in healthcare SMS)
  { pattern: /\b(?:OTP|code|verification code)[\s:]*\d{4,8}\b/gi, label: "[REDACTED-OTP]" },
];

const PHI_KEYS = new Set([
  "name",
  "fullName",
  "first_name",
  "last_name",
  "email",
  "phone",
  "phoneNumber",
  "mobile",
  "address",
  "dob",
  "dateOfBirth",
  "date_of_birth",
  "medicalRecordNumber",
  "mrn",
  "diagnosis",
  "prescription",
  "aadhaar",
  "pan",
  "ssn",
  "nationalId",
  "userId",
  "patientId",
  "doctorId",
]);

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    let sanitized = value;
    for (const { pattern, label } of PHI_PATTERNS) {
      sanitized = sanitized.replace(pattern, label);
    }
    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (PHI_KEYS.has(key)) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = sanitizeValue(val);
      }
    }
    return sanitized;
  }

  return value;
}

function sanitizeEvent(event: Sentry.Event): void {
  if (event.user) {
    const sanitizedUser: Record<string, unknown> = {};
    if (typeof event.user.id === "string" && event.user.id.length > 0) {
      sanitizedUser.id = event.user.id;
    }
    event.user = sanitizedUser;
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((crumb) => ({
      ...crumb,
      message: crumb.message ? scrubString(crumb.message) : crumb.message,
      data: sanitizeValue(crumb.data),
    }));
  }

  if (event.contexts) {
    event.contexts = sanitizeValue(event.contexts) as Sentry.Event["contexts"];
  }

  if (event.extra) {
    event.extra = sanitizeValue(event.extra) as Sentry.Event["extra"];
  }

  if (event.request) {
    event.request = sanitizeValue(event.request) as Sentry.Event["request"];
  }

  if (event.tags) {
    const sanitizedTags: Record<string, string> = {};
    for (const [key, value] of Object.entries(event.tags)) {
      if (PHI_KEYS.has(key)) {
        sanitizedTags[key] = "[REDACTED]";
      } else {
        sanitizedTags[key] = typeof value === "string" ? scrubString(value) : value;
      }
    }
    event.tags = sanitizedTags;
  }
}

function sanitizeError(error: Error): void {
  if (error.message) {
    error.message = scrubString(error.message);
  }
  if (error.stack) {
    error.stack = scrubString(error.stack);
  }
}

function scrubString(str: string): string {
  let result = str;
  for (const { pattern, label } of PHI_PATTERNS) {
    result = result.replace(pattern, label);
  }
  return result;
}
