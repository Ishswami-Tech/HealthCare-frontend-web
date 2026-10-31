/**
 * Browser-tab titles for staff routes (WCAG 2.4.2). Patient routes get theirs from segment
 * `metadata`; staff routes are client pages under one client layout, so their title is built
 * here from the path: "Page - Role - Clinic", e.g. "Prescription print - Doctor - Sunrise Clinic".
 *
 * Pure functions only; the dashboard shell applies the result to `document.title`.
 */

const TITLE_SEPARATOR = " - ";

/** Path words that read badly when only capitalised. */
const SEGMENT_WORDS: Record<string, string> = {
  ehr: "EHR",
  ipd: "IPD",
  qr: "QR",
  "no-show": "Missed appointments",
  "check-in": "Check-in",
  "check-ins": "Check-ins",
  "walk-in": "Walk-in",
  "follow-up": "Follow-ups",
  "lab-bookings": "Lab bookings",
  "alert-settings": "Alert settings",
  "print-settings": "Print settings",
};

/** Role path prefixes and the role name shown in the tab. */
const ROLE_PREFIX_LABELS: Record<string, string> = {
  "assistant-doctor": "Assistant doctor",
  "clinic-admin": "Clinic admin",
  "clinic-location-head": "Location head",
  "finance-billing": "Finance",
  "lab-technician": "Lab technician",
  "super-admin": "Super admin",
  "support-staff": "Support staff",
  counselor: "Counselor",
  diet: "Dietitian",
  doctor: "Doctor",
  nurse: "Nurse",
  pharmacist: "Pharmacist",
  receptionist: "Reception",
  therapist: "Therapist",
};

/** Role code ("CLINIC_ADMIN") as shown in the tab ("Clinic admin"). */
export function roleTitleLabel(role?: string | null): string {
  const key = String(role ?? "").trim().toLowerCase().replace(/[\s_]+/g, "-");
  if (!key) return "";
  if (key === "pharmacist") return "Pharmacy";
  const known = ROLE_PREFIX_LABELS[key];
  if (known) return known;
  const text = key.replace(/-/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** A record id (uuid, number, generated code) rather than a fixed route word. */
function isDynamicSegment(segment: string): boolean {
  return /\d/.test(segment) || segment.length > 24;
}

function humanizeSegment(segment: string): string {
  const known = SEGMENT_WORDS[segment];
  if (known) return known;
  const text = segment.replace(/-/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Page part of the title. `pageName` is the header label the shell already shows; the last
 * fixed path word is added when it says something the header label does not
 * ("/doctor/prescriptions/abc/print" -> "Prescriptions - Print"), so sub-pages stay distinct.
 */
export function staffPageName(pathname: string, pageName?: string | null): string {
  const segments = pathname.split("?")[0]?.split("/").filter(Boolean) ?? [];
  const staticSegments = segments.filter((segment) => !isDynamicSegment(segment));
  const withoutRole = ROLE_PREFIX_LABELS[staticSegments[0] ?? ""] ? staticSegments.slice(1) : staticSegments;
  const base = String(pageName ?? "").trim() || humanizeSegment(withoutRole[0] ?? "dashboard");
  const lastWord = withoutRole.length > 1 ? humanizeSegment(withoutRole[withoutRole.length - 1] ?? "") : "";
  const hasRecord = segments.length !== staticSegments.length && withoutRole.length <= 1;
  const detail = lastWord && !base.toLowerCase().includes(lastWord.toLowerCase()) ? lastWord : hasRecord ? "Details" : "";
  return detail ? `${base}${TITLE_SEPARATOR}${detail}` : base;
}

export interface StaffDocumentTitleInput {
  pathname: string;
  /** Header label for the route (DashboardLayout's resolved page title). */
  pageName?: string | null;
  /** Session role code, e.g. "RECEPTIONIST". */
  role?: string | null;
  /** The signed-in user's clinic; omitted while unknown. */
  clinicName?: string | null;
}

/** "Queue - Reception - Sunrise Clinic". Never includes a person's name. */
export function buildStaffDocumentTitle({ pathname, pageName, role, clinicName }: StaffDocumentTitleInput): string {
  return [staffPageName(pathname, pageName), roleTitleLabel(role), String(clinicName ?? "").trim()]
    .filter(Boolean)
    .join(TITLE_SEPARATOR);
}
