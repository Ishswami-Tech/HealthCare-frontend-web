/**
 * In-person flow V2 wire types (API_CONTRACT "In-person flow V2"). Shared by the patient check-in,
 * live queue and booking screens; reception / doctor screens may reuse them.
 */

/** BOOKED (not in queue) -> CHECKED_IN (in queue, token) -> WITH_DOCTOR -> COMPLETED | NO_SHOW | EXPIRED | CANCELLED. */
export type InPersonStage =
  | "BOOKED"
  | "CHECKED_IN"
  | "WITH_DOCTOR"
  | "COMPLETED"
  | "NO_SHOW"
  | "EXPIRED"
  | "CANCELLED";

export type CheckInWindowState = "TOO_EARLY" | "OPEN" | "CLOSED";

export interface InPersonVisit {
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  locationId: string | null;
  locationName: string | null;
  /** YYYY-MM-DD (IST). */
  date: string;
  /** HH:mm (IST). */
  time: string;
  durationMinutes: number;
  stage: InPersonStage;
  appointmentStatus: string;
  checkedInAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  tokenNumber: number | null;
  /** "K-014" */
  token: string | null;
  position: number | null;
  peopleAhead: number | null;
  etaMinutes: number | null;
  /** Checked in and nobody waiting ahead. */
  isNext: boolean;
  nowServingToken: string | null;
  checkInWindow: { opensAt: string; closesAt: string; state: CheckInWindowState } | null;
  priority: string | null;
}

/** Why the backend refused a check-in (`code` of the 4xx body). */
export type CheckInFailureCode =
  | "WRONG_LOCATION"
  | "TOO_EARLY"
  | "EXPIRED"
  | "NOT_BOOKED"
  | "VIDEO_VISIT"
  | "NOT_TODAY"
  | "INVALID_QR"
  | "EXPIRED_QR"
  | "LOCATION_INACTIVE"
  | "QR_REQUIRED"
  | "QR_NOT_FOR_STAFF"
  | "APPOINTMENT_REQUIRED"
  | "RECEPTION_WRONG_LOCATION"
  /** Typed desk code sent without the device position (400). */
  | "LOCATION_REQUIRED"
  /** Typed desk code from outside the location radius (403; the message carries the distance). */
  | "TOO_FAR"
  | "UNKNOWN";

export type InPersonCheckInResult =
  | { result: "CHECKED_IN"; alreadyCheckedIn: boolean; visit: InPersonVisit }
  | { result: "SELECT_APPOINTMENT"; candidates: InPersonVisit[] };

/** Reception walk-in (contract 18.5): an IN_PERSON visit for now at the desk's location, checked in. */
export interface InPersonWalkInRequest {
  patientId: string;
  /** Ignored for a receptionist (the server uses the allotted location). */
  locationId?: string;
  /** Required by the desk in multi-doctor clinics; omit it for a single-doctor clinic (server auto-assigns). */
  doctorId?: string;
  durationMinutes?: number;
  notes?: string;
}

/**
 * The next free in-person slot the server offers when a walk-in finds today full (409
 * `WALK_IN_NO_SLOT_TODAY`). `date` is the IST day (YYYY-MM-DD), `time` IST "HH:mm". Nothing is
 * booked until the desk books it.
 */
export interface WalkInNextAvailable {
  date: string;
  time: string;
  doctorId: string;
  locationId: string;
}

/**
 * Set by the server when the patient had no active plan and the clinic's walk-in rule let the visit
 * go ahead (clinic settings: walkInWithoutPlan). `label` is the desk copy from the server, e.g.
 * "Desk fee ₹300 — collect at counter"; `invoiceId` is the PENDING desk bill (desk-fee rule only).
 */
export interface WalkInPlanWaiver {
  policy: "ALLOW_WITH_DESK_FEE" | "ALLOW_FREE";
  deskFee: number | null;
  invoiceId: string | null;
  label: string;
}

/** The check-in result plus whether a new appointment was created (false = today's open visit reused). */
export type InPersonWalkInResult = InPersonCheckInResult & { created?: boolean; planWaiver?: WalkInPlanWaiver | null };

export interface InPersonCheckInRequest {
  /** Patient: the scanned poster text or the printed desk code. */
  qrCode?: string;
  /** Required for reception; a patient sends it to pick one of several bookings. */
  appointmentId?: string;
  /** Required with a typed desk code; optional with a scanned poster. Accuracy in metres. */
  coordinates?: { lat: number; lng: number; accuracy?: number };
}

export interface BookingLocation {
  locationId: string;
  name: string;
  address: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceMeters: number | null;
  isNearest: boolean;
  checkInEnabled: boolean;
}

export interface InPersonDeskBoard {
  locationId: string;
  locationName: string | null;
  date: string;
  counts: Record<
    "booked" | "checkedIn" | "withDoctor" | "completed" | "noShow" | "expired" | "cancelled",
    number
  >;
  visits: InPersonVisit[];
  /** Appointments of the location/day (equals visits.length unless `truncated`). */
  total?: number;
  /** true when the day has more visits than the board returns: `counts` then cover `visits` only. */
  truncated?: boolean;
  /**
   * Present only when the board was asked for one page (`?page=&limit=`): `visits` is that page,
   * while `counts` and `total` still cover the whole day. Absent on an older backend.
   */
  page?: number;
  limit?: number;
  totalPages?: number;
}
