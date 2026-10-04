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

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Form values from the profile the API returns (`GET /users/profile`). */
export function toPharmacistProfileForm(profile: unknown): PharmacistProfileForm {
  const source = profile && typeof profile === "object" ? (profile as Record<string, unknown>) : {};
  const experience = source.experience;
  return {
    firstName: text(source.firstName),
    lastName: text(source.lastName),
    email: text(source.email),
    phone: text(source.phone),
    address: text(source.address),
    city: text(source.city),
    state: text(source.state),
    zipCode: text(source.zipCode),
    specialization: text(source.specialization),
    experience: typeof experience === "number" || typeof experience === "string" ? String(experience) : "",
  };
}

/** Photo and "verified" flag for the summary card. */
export function readPharmacistProfileMeta(profile: unknown): { photoUrl?: string; isVerified: boolean } {
  const source = profile && typeof profile === "object" ? (profile as Record<string, unknown>) : {};
  const photoUrl = text(source.avatar) || text(source.profilePicture);
  return { ...(photoUrl ? { photoUrl } : {}), isVerified: source.isVerified === true };
}

/** What the save sends: the form, with years of experience as a number (left out when empty). */
export function toPharmacistProfilePayload(form: PharmacistProfileForm): Record<string, unknown> {
  const years = form.experience ? parseInt(form.experience, 10) : undefined;
  return { ...form, experience: Number.isFinite(years) ? years : undefined };
}

export function pharmacistInitials(form: Pick<PharmacistProfileForm, "firstName" | "lastName">): string {
  return `${form.firstName.trim().charAt(0)}${form.lastName.trim().charAt(0)}`.toUpperCase() || "P";
}
