import { formatDateInIST } from "@/lib/utils/date-time";
import type { DoctorProfileProfessionalInfo, DoctorReview } from "./doctor-profile.types";

/**
 * Pure helpers for the doctor profile screen: reading optional profile fields and
 * turning the payload of `useDoctorReviews` into the rows and summary the Reviews tab
 * renders. No React, no fetching.
 */

type Raw = Record<string, unknown>;

export function asRecord(value: unknown): Raw {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
}

/** A list of names from an array or a comma-separated string. */
export function stringList(value: unknown): string[] {
  const entries = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  return entries.map((entry) => text(entry)).filter(Boolean);
}

/** Education rows from the profile: a list of `{ degree, institution, year }`, or one qualification text. */
export function educationList(value: unknown, qualification?: unknown): DoctorProfileProfessionalInfo["education"] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === "string") return { degree: entry.trim(), institution: "", year: "" };
        const item = asRecord(entry);
        return {
          degree: text(item.degree) || text(item.title) || text(item.name),
          institution: text(item.institution) || text(item.college) || text(item.university),
          year: text(item.year),
        };
      })
      .filter((item) => item.degree);
  }
  // The doctor record stores education as one text line; show it as a single entry.
  const stored = typeof value === "string" ? value.trim() : "";
  if (stored) return [{ degree: stored, institution: "", year: "" }];
  const single = text(qualification);
  return single ? [{ degree: single, institution: "", year: "" }] : [];
}

// ── Reviews ────────────────────────────────────────────────────────────────

/** The reviews endpoint answers with a list, or a list wrapped in `data` / `reviews` / `items`. */
function reviewEntries(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  for (const key of ["reviews", "items", "data"]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
    const nested = asRecord(value);
    if (Array.isArray(nested.reviews)) return nested.reviews;
    if (Array.isArray(nested.items)) return nested.items;
    if (Array.isArray(nested.data)) return nested.data;
  }
  return [];
}

export function normalizeDoctorReviews(payload: unknown): DoctorReview[] {
  return reviewEntries(payload).reduce<DoctorReview[]>((reviews, entry, index) => {
    const raw = asRecord(entry);
    const rating = Math.round(Number(raw.rating ?? raw.stars ?? 0));
    if (!Number.isFinite(rating) || rating < 1) return reviews;

    const patient = asRecord(raw.patient);
    const patientUser = asRecord(patient.user);
    const reviewer = asRecord(raw.user);
    const fullName = `${text(patientUser.firstName) || text(patient.firstName)} ${text(patientUser.lastName) || text(patient.lastName)}`.trim();
    const date = text(raw.date) || text(raw.createdAt);

    reviews.push({
      id: text(raw.id) || `${date}-${index}`,
      patientName:
        text(raw.patientName) || text(raw.reviewerName) || text(patientUser.name) || text(patient.name) || text(reviewer.name) || fullName || "Patient",
      rating: Math.min(5, rating),
      review: text(raw.review) || text(raw.comment) || text(raw.text) || text(raw.feedback),
      date,
    });
    return reviews;
  }, []);
}

export interface ReviewSummary {
  count: number;
  /** Average rating, one decimal ("4.7"). */
  average: string;
  /** Rounded average, for the star row. */
  stars: number;
  /** Reviews per star, 5 first. */
  breakdown: Array<{ stars: number; count: number; percent: number }>;
}

/** Rating summary over the loaded reviews; null when there are none. */
export function summarizeReviews(reviews: DoctorReview[]): ReviewSummary | null {
  if (reviews.length === 0) return null;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  const average = total / reviews.length;
  return {
    count: reviews.length,
    average: average.toFixed(1),
    stars: Math.round(average),
    breakdown: [5, 4, 3, 2, 1].map((stars) => {
      const count = reviews.filter((review) => review.rating === stars).length;
      return { stars, count, percent: Math.round((count / reviews.length) * 100) };
    }),
  };
}

/** "28 Sept 2026" */
export function reviewDateLabel(date: string): string {
  if (!date) return "";
  return formatDateInIST(date, { day: "numeric", month: "short", year: "numeric" });
}

/** "14 years experience" from whatever the doctor typed ("14", "14 years"). */
export function experienceLabel(experience: string): string {
  const value = experience.trim();
  if (!value) return "";
  if (/^\d+$/.test(value)) return `${value} ${value === "1" ? "year" : "years"} experience`;
  return `${value} experience`;
}
