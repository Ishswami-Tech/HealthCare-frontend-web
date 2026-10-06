/**
 * Homepage CTA destinations and contact-link helpers.
 * Booking routes mirror the ones used by the /drdeshmukh page so the
 * homepage, doctor page, and patient dashboard all open the same flow.
 */
export const HOME_LINKS = {
  videoBooking: "/patient/appointments?openBooking=1&mode=VIDEO",
  booking: "/drdeshmukh",
  treatments: "/treatments",
  panchakarma: "/treatments/panchakarma",
  agnikarma: "/treatments/agnikarma",
  viddhaKarma: "/treatments/viddha-karma",
  gallery: "/gallery",
  about: "/about",
  contact: "/contact",
  privacyPolicy: "/privacy-policy",
  youtube: "http://www.youtube.com/@viddhakarma",
} as const;

export const HEALTH_ASSESSMENT_SECTION_ID = "health-assessment";
export const HEALTH_ASSESSMENT_HREF = `#${HEALTH_ASSESSMENT_SECTION_ID}`;

/** Builds a `tel:` href from a human-readable phone string such as "+91 98603 70961". */
export function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Builds a WhatsApp deep link; 10-digit numbers are assumed to be Indian. */
export function toWhatsAppHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const withCountryCode = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountryCode}`;
}

/** Returns the first entry of a comma-separated phone list. */
export function firstPhone(phoneList: string): string {
  const [first] = phoneList.split(",");
  return (first ?? phoneList).trim();
}
