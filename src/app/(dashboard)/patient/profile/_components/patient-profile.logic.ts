import { z } from "zod";
import { normalizeAppointmentStatus } from "@/lib/utils/appointmentUtils";

/**
 * Pure helpers for the patient account screens (profile hub, personal details, language & privacy).
 * The containers call them with live data, the preview calls them with fixtures.
 */

export const PROFILE_HUB_ROUTE = "/patient/profile";
export const PROFILE_EDIT_ROUTE = "/patient/profile/edit";
export const PROFILE_SETTINGS_ROUTE = "/patient/profile/settings";
export const HELP_ROUTE = "/patient/help";

type Raw = Record<string, unknown>;

function asRecord(value: unknown): Raw {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// ── Old deep links ─────────────────────────────────────────────────────────

/**
 * `/patient/profile` used to be one page with tabs kept in the URL hash (`#preferences`), with
 * `?tab=` accepted as a fallback. Each old tab now lives on its own screen.
 */
const LEGACY_TAB_ROUTES: Record<string, string> = {
  personal: PROFILE_EDIT_ROUTE,
  preferences: PROFILE_SETTINGS_ROUTE,
  ayurveda: "/patient/health",
  medical: "/patient/health",
  lifestyle: "/patient/health",
  documents: "/patient/health/reports",
};

/** Where an old `/patient/profile#tab` or `?tab=` link should land now, or `null` for the hub. */
export function legacyProfileTabRoute(hash: string, search: string): string | null {
  const fromHash = hash.replace(/^#/, "").trim().toLowerCase().split("/")[0] ?? "";
  let fromQuery = "";
  try {
    fromQuery = (new URLSearchParams(search).get("tab") ?? "").trim().toLowerCase();
  } catch {
    fromQuery = "";
  }
  return LEGACY_TAB_ROUTES[fromHash || fromQuery] ?? null;
}

// ── Profile form ───────────────────────────────────────────────────────────

export const GENDER_OPTIONS = [
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
  { value: "OTHER", label: "Other" },
] as const;

export type PatientGender = (typeof GENDER_OPTIONS)[number]["value"];

export interface PatientProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  /** `YYYY-MM-DD`, as the date input and the API both use. */
  dateOfBirth: string;
  gender: PatientGender | "";
  address: string;
  city: string;
  state: string;
  zipCode: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
}

export type PatientProfileField = keyof PatientProfileForm;
export type PatientProfileErrors = Partial<Record<PatientProfileField, string>>;

export const EMPTY_PATIENT_PROFILE: PatientProfileForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  emergencyName: "",
  emergencyRelationship: "",
  emergencyPhone: "",
};

function toDateInput(value: unknown): string {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  const raw = text(value);
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function toGender(value: unknown): PatientGender | "" {
  const upper = text(value).toUpperCase();
  return GENDER_OPTIONS.some((option) => option.value === upper) ? (upper as PatientGender) : "";
}

/**
 * Form values from the profile the API returns (`GET /user/profile`).
 * `fallback` is the signed-in user from the session, used until the profile has a name.
 * The profile does not carry the emergency contact, so those fields start empty.
 */
export function toPatientProfileForm(
  profile: unknown,
  fallback?: { firstName?: string | null; lastName?: string | null; email?: string | null },
): PatientProfileForm {
  const source = asRecord(profile);
  return {
    ...EMPTY_PATIENT_PROFILE,
    firstName: text(source.firstName) || text(fallback?.firstName),
    lastName: text(source.lastName) || text(fallback?.lastName),
    phone: text(source.phone),
    email: text(source.email) || text(fallback?.email),
    dateOfBirth: toDateInput(source.dateOfBirth),
    gender: toGender(source.gender),
    address: text(source.address),
    city: text(source.city),
    state: text(source.state),
    zipCode: text(source.zipCode),
  };
}

export interface PatientProfileMeta {
  photoUrl?: string;
  phoneVerified: boolean;
}

export function readPatientProfileMeta(profile: unknown): PatientProfileMeta {
  const source = asRecord(profile);
  const photoUrl = text(source.profilePicture) || text(source.avatar);
  return { ...(photoUrl ? { photoUrl } : {}), phoneVerified: source.phoneVerified === true };
}

export function patientDisplayName(form: Pick<PatientProfileForm, "firstName" | "lastName">): string {
  return [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" ");
}

const PHONE_PATTERN = /^[\d\s\-+()]+$/;
const digitCount = (value: string) => value.replace(/\D/g, "").length;
const isPhone = (value: string) => PHONE_PATTERN.test(value) && digitCount(value) >= 10 && digitCount(value) <= 15;

const profileSchema = z
  .object({
    firstName: z.string().trim().min(1, "Enter your first name").max(60, "First name is too long"),
    lastName: z.string().trim().min(1, "Enter your last name").max(60, "Last name is too long"),
    phone: z.string().trim(),
    email: z.string().trim(),
    dateOfBirth: z.string().trim(),
    gender: z.enum(["FEMALE", "MALE", "OTHER", ""]),
    address: z.string().trim().max(250, "Address is too long"),
    city: z.string().trim().max(80, "City is too long"),
    state: z.string().trim().max(80, "State is too long"),
    zipCode: z.string().trim().max(12, "PIN code is too long"),
    emergencyName: z.string().trim().max(80, "Name is too long"),
    emergencyRelationship: z.string().trim().max(40, "Relationship is too long"),
    emergencyPhone: z.string().trim(),
  })
  .superRefine((value, context) => {
    const add = (field: PatientProfileField, message: string) =>
      context.addIssue({ code: "custom", path: [field], message });

    if (value.phone && !isPhone(value.phone)) add("phone", "Enter a valid mobile number");
    if (value.email && !z.email().safeParse(value.email).success) add("email", "Enter a valid email address");

    if (value.dateOfBirth) {
      const date = new Date(`${value.dateOfBirth}T00:00:00`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value.dateOfBirth) || Number.isNaN(date.getTime())) {
        add("dateOfBirth", "Enter a valid date");
      } else if (date.getTime() > Date.now()) {
        add("dateOfBirth", "Date of birth cannot be in the future");
      } else if (date.getFullYear() < 1900) {
        add("dateOfBirth", "Enter a valid date");
      }
    }

    // The emergency contact is saved as one record: all three parts or none.
    const emergency = [value.emergencyName, value.emergencyRelationship, value.emergencyPhone];
    if (emergency.some(Boolean)) {
      if (!value.emergencyName) add("emergencyName", "Enter the contact's name");
      if (!value.emergencyRelationship) add("emergencyRelationship", "Enter how they are related to you");
      if (!value.emergencyPhone) add("emergencyPhone", "Enter the contact's phone number");
      else if (!isPhone(value.emergencyPhone)) add("emergencyPhone", "Enter a valid phone number");
    }
  });

/**
 * Checks the form before it is sent. `required` lists fields the saved profile already has:
 * the API keeps the old value when one of them is sent empty, so an empty field would look saved
 * while nothing changed.
 */
export function validatePatientProfile(
  form: PatientProfileForm,
  required: { phone?: boolean; email?: boolean } = {},
): PatientProfileErrors {
  const errors: PatientProfileErrors = {};
  const result = profileSchema.safeParse(form);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0] as PatientProfileField | undefined;
      if (field && !errors[field]) errors[field] = issue.message;
    }
  }
  if (required.phone && !form.phone.trim() && !errors.phone) errors.phone = "Enter your mobile number";
  if (required.email && !form.email.trim() && !errors.email) errors.email = "Enter your email address";
  return errors;
}

/**
 * Body of `POST /profile/completion/update` (`UpdateProfileRequestDto`). The API rejects unknown
 * keys, so only its own fields are sent; empty phone, email, date and gender are left out
 * because it does not accept them blank.
 */
export function toPatientProfilePayload(form: PatientProfileForm): Record<string, unknown> {
  const phone = form.phone.trim();
  const email = form.email.trim();
  const emergency = {
    name: form.emergencyName.trim(),
    relationship: form.emergencyRelationship.trim(),
    phone: form.emergencyPhone.trim(),
  };
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    ...(phone ? { phone } : {}),
    ...(email ? { email } : {}),
    ...(form.dateOfBirth ? { dateOfBirth: form.dateOfBirth } : {}),
    ...(form.gender ? { gender: form.gender } : {}),
    address: form.address.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    zipCode: form.zipCode.trim(),
    ...(emergency.name && emergency.relationship && emergency.phone ? { emergencyContact: emergency } : {}),
  };
}

const SERVER_FIELD_ALIASES: Record<string, PatientProfileField> = {
  emergencyContact: "emergencyName",
  "emergencyContact.name": "emergencyName",
  "emergencyContact.relationship": "emergencyRelationship",
  "emergencyContact.phone": "emergencyPhone",
};

/** Field errors from a failed save (`validationErrors: [{ field, constraints }]`). */
export function serverFieldErrors(result: unknown): PatientProfileErrors {
  const list = asRecord(result).validationErrors;
  if (!Array.isArray(list)) return {};
  const errors: PatientProfileErrors = {};
  for (const entry of list) {
    const row = asRecord(entry);
    const name = text(row.field);
    const field = SERVER_FIELD_ALIASES[name] ?? (name in EMPTY_PATIENT_PROFILE ? (name as PatientProfileField) : undefined);
    const message = Object.values(asRecord(row.constraints)).find((value) => typeof value === "string");
    if (field && typeof message === "string" && !errors[field]) errors[field] = message;
  }
  return errors;
}

// ── Hub numbers ────────────────────────────────────────────────────────────

/**
 * Completed visits from `useMyAppointments`. `null` when the list on hand is only one page of a
 * longer history, so a partial count is never shown as the total.
 */
export function countCompletedVisits(data: unknown): number | null {
  const source = asRecord(data);
  const list = Array.isArray(source.appointments) ? source.appointments : Array.isArray(data) ? data : null;
  if (!list) return null;
  const visits = [
    ...new Map(list.map((visit, index) => [text(asRecord(visit).id) || `row-${index}`, asRecord(visit)])).values(),
  ];
  const total = asRecord(source.meta).total;
  if (typeof total === "number" && total !== visits.length) return null;
  return visits.filter((visit) => normalizeAppointmentStatus(text(visit.status)) === "COMPLETED").length;
}

// ── Notification preferences ───────────────────────────────────────────────

const CHANNELS = [
  ["emailEnabled", "Email"],
  ["smsEnabled", "SMS"],
  ["pushEnabled", "Push"],
  ["whatsappEnabled", "WhatsApp"],
] as const;

/** "Email, WhatsApp" / "Off" for the hub row; `undefined` while the preferences are not known. */
export function notificationChannelSummary(preferences: unknown): string | undefined {
  const outer = asRecord(preferences);
  const source = CHANNELS.some(([key]) => typeof outer[key] === "boolean") ? outer : asRecord(outer.data);
  if (!CHANNELS.some(([key]) => typeof source[key] === "boolean")) return undefined;
  const enabled = CHANNELS.filter(([key]) => source[key] === true).map(([, label]) => label);
  if (enabled.length === 0) return "Off";
  return enabled.length === CHANNELS.length ? "All on" : enabled.join(", ");
}
