/**
 * View models for the patient Home screen. The page container (`patient/dashboard/page.tsx`)
 * turns API data into these shapes; the components in this folder only draw them.
 */

export type HomeVisitKind = "video" | "clinic";

/** Where an in-clinic visit stands: not checked in yet, waiting in the queue, or with the doctor. */
export type HomeClinicStage = "upcoming" | "queue" | "in_progress";

export interface HomeVisit {
  id: string;
  kind: HomeVisitKind;
  doctorName: string;
  doctorPhotoUrl?: string;
  /** Second line under the doctor's name, for example "General Consultation". */
  visitLabel: string;
  /** Third line, for example "MBBS, MD · 15+ years". Left out when the API has neither. */
  doctorDetail?: string;
  /** "Mon, 28 Sept 2026" */
  dateLabel: string;
  /** "10:00 AM" */
  timeLabel: string;
  /** ISO start time, or null when the visit has no time yet. */
  startsAt: string | null;
  isToday: boolean;
  /** Clinic name and address line. In-clinic visits only. */
  locationLabel?: string;
  statusCode: string;
  statusLabel: string;
  confirmationExpiresAt?: string | null;
  confirmationWindowMinutes?: number | null;

  // ── video ──
  /** Paid, and inside the join window (or already started by the doctor). */
  canJoin: boolean;
  /** "resume" = the doctor has started the visit and the patient can go back in. */
  joinAction: "join" | "resume" | null;
  /** Why joining is not possible yet, in plain words. */
  joinBlockedReason?: string | null;
  awaitingPayment: boolean;
  /** From the existing reschedule rules. A patient can never cancel a video visit. */
  canReschedule: boolean;

  // ── in clinic ──
  clinicStage: HomeClinicStage;
  clinicPhone?: string;
  directionsUrl?: string;
  /** Queue token, when the visit carries one. */
  tokenLabel?: string;
}

/** Live queue numbers for a checked-in visit. Every field is null until the API provides it. */
export interface HomeQueue {
  /** 1 = next. */
  position: number | null;
  /** People waiting before the patient, from `GET queue/me`. Left out, it is worked out from the position. */
  patientsAhead?: number | null;
  estimatedWaitMinutes: number | null;
  totalInQueue: number | null;
  isLoading: boolean;
}

export type HomeStatKey = "appointments" | "medicines" | "records" | "payments";

export interface HomeStat {
  key: HomeStatKey;
  label: string;
  value: number;
  href: string;
}

export type HomeLibraryTab = "articles" | "videos" | "guides" | "courses";

export interface HomeLibraryItem {
  id: string;
  title: string;
  /** "Cardiology · 6 min read" */
  meta: string;
  coverImageUrl?: string | null;
  isVideo: boolean;
}

export type HomeWorkspaceTab = "all" | "video" | "clinic";
