import type { PillTone } from "@/components/tbd";

/**
 * View models for the appointments list. The container (`AppointmentManager.tsx`) turns API
 * rows into these shapes with `managerData.ts`; the components in this folder only draw them.
 */

export type ManagerTab = "upcoming" | "past" | "cancelled";

export type ManagerStatusFilter =
  | "ALL"
  | "SCHEDULED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "EXPIRED";

/** Where an in-clinic visit stands: not checked in yet, waiting in the queue, or with the doctor. */
export type ManagerClinicStage = "upcoming" | "queue" | "in_progress";

export interface ManagerVisit {
  /** The appointment id every action is called with. */
  id: string;
  kind: "video" | "clinic";
  tab: ManagerTab;

  /** Doctor for a patient; patient for staff. */
  title: string;
  /** "General Physician · General Consultation", or "with Dr. Rao · General Consultation" for staff. */
  subtitle: string;
  doctorName: string;
  /** Name the initials avatar is drawn from when there is no photo. */
  avatarName: string;
  photoUrl?: string;
  /** Row title in the past and cancelled lists: the reason for the visit, or the visit type. */
  visitTitle: string;

  /** "Today · 02:00 PM" or "Mon, 28 Sept · 10:00 AM · 15 min" (an open video visit shows its length). */
  whenLabel: string;
  /** "12 Sept 2026" */
  dateLabel: string;
  /** "In-Clinic · Sahyadri Clinic" or "Video". */
  typeLabel: string;
  /** ISO start time, or null when the visit has no time yet. */
  startsAt: string | null;
  startsAtMs: number | null;

  statusTone: PillTone;
  statusLabel: string;
  /** Small dot in the tag ("Check-in open"). */
  statusDot: boolean;
  /** The status the status filter matches against. */
  filterStatus: string;
  /** Lower-case text the search box matches against. */
  searchText: string;

  // ── video ──
  /** Paid, and inside the join window (or already started by the doctor). */
  canJoin: boolean;
  /** "resume" = the doctor has started the visit and the patient can go back in. */
  joinAction: "join" | "resume" | null;
  /** Why joining is not possible yet, in plain words. */
  joinBlockedReason: string | null;
  /** An open video visit shows the Join button (disabled outside the join window). */
  showJoin: boolean;
  /** An open video visit that is not paid yet. */
  awaitingPayment: boolean;
  paymentExpiresAt: string | null;
  paymentWindowMinutes: number | null;
  /** The doctor has not picked one of the proposed times yet. */
  awaitingSlot: boolean;
  /** "Mon, 28 Sept · 10:00 AM" for every time proposed. */
  proposedSlots: string[];
  /** The viewer may decline the proposed times (doctors only). */
  canDeclineSlots: boolean;
  confirmationExpiresAt: string | null;
  confirmationWindowMinutes: number | null;

  // ── moving and cancelling ──
  canReschedule: boolean;
  /** "1 of 2 changes left". Null when the visit cannot be moved. */
  rescheduleHint: string | null;
  canCancel: boolean;

  // ── in clinic ──
  clinicStage: ManagerClinicStage;
  directionsUrl?: string;
  /** Today's visit, not checked in yet, seen by the patient. */
  canCheckIn: boolean;
  /** Checked in and waiting: the patient can follow the live queue. */
  canTrackQueue: boolean;

  // ── closed visits ──
  /** One plain sentence about why the visit is closed. */
  closedNote: string | null;
  canBookAgain: boolean;
  /** A video visit cancelled for a missed payment, while its time has not passed. */
  canRetryPayment: boolean;
  /** Where the summary of a completed visit opens. */
  summaryHref: string | null;
  summaryLabel: string;
}

export interface ManagerStats {
  total: number;
  upcoming: number;
  inProgress: number;
  completed: number;
}

export interface ManagerDateRange {
  start: string;
  end: string;
}

export interface ManagerVisitActions {
  onJoin: (visitId: string) => void;
  onReschedule: (visitId: string) => void;
  onCancel: (visitId: string) => void;
  onBookAgain: (visitId: string) => void;
  onDeclineSlots: (visitId: string) => void;
  /** The payment window of an unpaid visit ran out: refresh the list. */
  onPaymentWindowExpired: () => void;
}

/** Draws the pay button of one visit. The container passes the real payment component. */
export type ManagerPayRenderer = (visit: ManagerVisit, intent: "pay" | "retry") => React.ReactNode;
