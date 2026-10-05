import { z } from "zod";
import type { CreateMyFamilyMemberInput, UpdateMyFamilyMemberInput } from "@/hooks/query/useMyFamilyMembers";
import type { FamilyMember } from "@/types/patient-visit.types";

/**
 * Pure helpers and the form schema for the patient's Family Members screens.
 * The form asks only for what `POST /family-members/me` stores (`CreateMyFamilyMemberDto`):
 * first name, last name, relation, gender, date of birth, phone and notes.
 */

// ── Dates and age ──────────────────────────────────────────────────────────

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"] as const;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Today as `YYYY-MM-DD` on this device. */
export function todayKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * The calendar day of a stored date. Birthdays come back as UTC midnight
 * ("2018-04-12T00:00:00.000Z"), so the first ten characters are the day that was entered.
 */
export function dateKey(value?: string | null): string {
  const key = String(value ?? "").slice(0, 10);
  return DATE_KEY.test(key) ? key : "";
}

function parts(key: string): { year: number; month: number; day: number } {
  const [year = 0, month = 1, day = 1] = key.split("-").map(Number);
  return { year, month, day };
}

/** "58 yrs", "1 yr", "7 months", "Newborn". Empty when the date is missing or in the future. */
export function ageLabel(dateOfBirth?: string | null, now: Date = new Date()): string {
  const key = dateKey(dateOfBirth);
  if (!key || key > todayKey(now)) return "";
  const born = parts(key);
  const today = parts(todayKey(now));
  let months = (today.year - born.year) * 12 + (today.month - born.month);
  if (today.day < born.day) months -= 1;
  if (months < 1) return "Newborn";
  if (months < 12) return months === 1 ? "1 month" : `${months} months`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 yr" : `${years} yrs`;
}

/** "12 Apr 1968". Empty when there is no valid date. */
export function dateLabel(value?: string | null): string {
  const key = dateKey(value);
  if (!key) return "";
  const { year, month, day } = parts(key);
  const name = MONTHS[month - 1];
  return name ? `${day} ${name} ${year}` : "";
}

// ── Gender ─────────────────────────────────────────────────────────────────

/** The backend stores gender in upper case ("MALE"). */
export const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
] as const;

export function genderLabel(gender?: string | null): string {
  const code = String(gender ?? "").trim().toUpperCase();
  if (!code) return "";
  const known = GENDER_OPTIONS.find((option) => option.value === code);
  return known ? known.label : code.charAt(0) + code.slice(1).toLowerCase();
}

// ── Names ──────────────────────────────────────────────────────────────────

export function memberName(member: Pick<FamilyMember, "name" | "firstName" | "lastName">): string {
  return member.name?.trim() || `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || "Family member";
}

// ── Form ───────────────────────────────────────────────────────────────────

export const familyMemberSchema = z.object({
  firstName: z.string().trim().min(1, "Enter the first name.").max(100, "Use 100 characters or fewer."),
  lastName: z.string().trim().min(1, "Enter the last name.").max(100, "Use 100 characters or fewer."),
  relation: z.string().trim().min(1, "Enter how they are related to you.").max(50, "Use 50 characters or fewer."),
  /** "" = not set. */
  gender: z.string().max(20),
  /** "" = not set, otherwise `YYYY-MM-DD`. */
  dateOfBirth: z
    .string()
    .refine((value) => value === "" || DATE_KEY.test(value), "Choose a date.")
    .refine((value) => value === "" || value <= todayKey(), "The date of birth is in the future.")
    .refine((value) => value === "" || value >= "1900-01-01", "Check the year."),
  phone: z
    .string()
    .trim()
    .max(20, "Use 20 characters or fewer.")
    .refine(
      (value) => value === "" || (/^\+?[\d\s-]+$/.test(value) && value.replace(/\D/g, "").length >= 7),
      "Enter a phone number, for example +91 98765 43210.",
    ),
  notes: z.string().trim().max(500, "Use 500 characters or fewer."),
});

export type FamilyMemberFormValues = z.infer<typeof familyMemberSchema>;

export const EMPTY_FAMILY_MEMBER: FamilyMemberFormValues = {
  firstName: "",
  lastName: "",
  relation: "",
  gender: "",
  dateOfBirth: "",
  phone: "",
  notes: "",
};

/** Form values for editing a member. */
export function toFormValues(member: FamilyMember): FamilyMemberFormValues {
  const gender = String(member.gender ?? "").trim().toUpperCase();
  return {
    firstName: member.firstName ?? "",
    lastName: member.lastName ?? "",
    relation: member.relation ?? "",
    gender,
    dateOfBirth: dateKey(member.dateOfBirth),
    phone: member.phone ?? "",
    notes: member.notes ?? "",
  };
}

/** Body of `POST /family-members/me`. Optional fields that are empty are left out. */
export function toCreateInput(values: FamilyMemberFormValues): CreateMyFamilyMemberInput {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    relation: values.relation.trim(),
    ...(values.gender ? { gender: values.gender } : {}),
    ...(values.dateOfBirth ? { dateOfBirth: values.dateOfBirth } : {}),
    ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
    ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
  };
}

/**
 * Body of `PATCH /family-members/me/:id`. Every field is sent so a cleared field is cleared
 * on the record too: the backend turns an empty text into "not set", and takes `null` for
 * the date of birth.
 */
export function toUpdateInput(values: FamilyMemberFormValues): UpdateMyFamilyMemberInput {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    relation: values.relation.trim(),
    gender: values.gender,
    dateOfBirth: values.dateOfBirth || null,
    phone: values.phone.trim(),
    notes: values.notes.trim(),
  };
}

export function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "";
}
