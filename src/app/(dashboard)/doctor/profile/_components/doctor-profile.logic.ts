import type { DoctorProfileProfessionalInfo, DoctorReview } from "./doctor-profile.types";
import { asRecordOrEmpty, textOf } from "@/lib/utils/coerce";
import { personFullName } from "@/lib/utils/display-name";

/**
 * Pure helpers for the doctor profile screen: reading optional profile fields and
 * turning the payload of `useDoctorReviews` into the rows and summary the Reviews tab
 * renders. No React, no fetching.
 */

/** A list of names from an array or a comma-separated string. */
export function stringList(value: unknown): string[] {
  const entries = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  return entries.map((entry) => textOf(entry)).filter(Boolean);
}

/** Education rows from the profile: a list of `{ degree, institution, year }`, or one qualification text. */
export function educationList(value: unknown, qualification?: unknown): DoctorProfileProfessionalInfo["education"] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === "string") return { degree: entry.trim(), institution: "", year: "" };
        const item = asRecordOrEmpty(entry);
        return {
          degree: textOf(item.degree) || textOf(item.title) || textOf(item.name),
          institution: textOf(item.institution) || textOf(item.college) || textOf(item.university),
          year: textOf(item.year),
        };
      })
      .filter((item) => item.degree);
  }
  const single = textOf(qualification);
  return single ? [{ degree: single, institution: "", year: "" }] : [];
}

// ── Reviews ────────────────────────────────────────────────────────────────

/** The reviews endpoint answers with a list, or a list wrapped in `data` / `reviews` / `items`. */
function reviewEntries(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecordOrEmpty(payload);
  for (const key of ["reviews", "items", "data"]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
    const nested = asRecordOrEmpty(value);
    if (Array.isArray(nested.reviews)) return nested.reviews;
    if (Array.isArray(nested.items)) return nested.items;
    if (Array.isArray(nested.data)) return nested.data;
  }
  return [];
}

export function normalizeDoctorReviews(payload: unknown): DoctorReview[] {
  return reviewEntries(payload).reduce<DoctorReview[]>((reviews, entry, index) => {
    const raw = asRecordOrEmpty(entry);
    const rating = Math.round(Number(raw.rating ?? raw.stars ?? 0));
    if (!Number.isFinite(rating) || rating < 1) return reviews;

    const patient = asRecordOrEmpty(raw.patient);
    const patientUser = asRecordOrEmpty(patient.user);
    const reviewer = asRecordOrEmpty(raw.user);
    const fullName = personFullName(patient);
    const date = textOf(raw.date) || textOf(raw.createdAt);

    reviews.push({
      id: textOf(raw.id) || `${date}-${index}`,
      patientName:
        textOf(raw.patientName) || textOf(patientUser.name) || textOf(patient.name) || textOf(reviewer.name) || fullName || "Patient",
      rating: Math.min(5, rating),
      review: textOf(raw.review) || textOf(raw.comment) || textOf(raw.text) || textOf(raw.feedback),
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

/** "14 years experience" from whatever the doctor typed ("14", "14 years"). */
export function experienceLabel(experience: string): string {
  const value = experience.trim();
  if (!value) return "";
  if (/^\d+$/.test(value)) return `${value} ${value === "1" ? "year" : "years"} experience`;
  return `${value} experience`;
}
