import { asRecordOrEmpty, asString } from "@/lib/utils/coerce";

export interface PharmacistProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  specialization: string;
  experience: string;
}

export const EMPTY_PHARMACIST_PROFILE: PharmacistProfileForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  specialization: "",
  experience: "",
};

export const PHARMACIST_PROFILE_TABS = ["personal", "security"] as const;
export type PharmacistProfileTab = (typeof PHARMACIST_PROFILE_TABS)[number];

/** Form values from the profile the API returns (`GET /users/profile`). */
export function toPharmacistProfileForm(profile: unknown): PharmacistProfileForm {
  const source = asRecordOrEmpty(profile);
  const experience = source.experience;
  return {
    firstName: asString(source.firstName),
    lastName: asString(source.lastName),
    email: asString(source.email),
    phone: asString(source.phone),
    address: asString(source.address),
    city: asString(source.city),
    state: asString(source.state),
    zipCode: asString(source.zipCode),
    specialization: asString(source.specialization),
    experience: typeof experience === "number" || typeof experience === "string" ? String(experience) : "",
  };
}

/** Photo and "verified" flag for the summary card. */
export function readPharmacistProfileMeta(profile: unknown): { photoUrl?: string; isVerified: boolean } {
  const source = asRecordOrEmpty(profile);
  const photoUrl = asString(source.avatar) || asString(source.profilePicture);
  return { ...(photoUrl ? { photoUrl } : {}), isVerified: source.isVerified === true };
}

/**
 * What the save sends: the form, with years of experience as a number (left out when empty).
 * The email is read-only here; an empty one is left out because the API rejects "" as an email.
 */
export function toPharmacistProfilePayload(form: PharmacistProfileForm): Record<string, unknown> {
  const years = form.experience ? parseInt(form.experience, 10) : undefined;
  const { email, ...rest } = form;
  return {
    ...rest,
    ...(email.trim() ? { email: email.trim() } : {}),
    experience: Number.isFinite(years) ? years : undefined,
  };
}

export function pharmacistInitials(form: Pick<PharmacistProfileForm, "firstName" | "lastName">): string {
  return `${form.firstName.trim().charAt(0)}${form.lastName.trim().charAt(0)}`.toUpperCase() || "P";
}
