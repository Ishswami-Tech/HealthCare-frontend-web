import { CalendarDays, CalendarRange, Moon, Sun, type LucideIcon } from "lucide-react";
import type { SupportedLanguage } from "@/lib/i18n/config";

/**
 * Contact details are the same in every language, so they are not read from
 * the translations — the hi/mr files still carry an outdated second number.
 */
export const CLINIC_CONTACT = {
  phones: ["+91 9860370961", "+91 79 7254 8944"],
  whatsapp: "+91 79 7254 8944",
  email: "drchandrakumardeshmukh@gmail.com",
} as const;

export interface ClinicSession {
  icon: LucideIcon;
  labelKey: string;
  hoursKey: string;
}

export interface ClinicLocation {
  id: "chinchwad" | "pune" | "dehu" | "nanded";
  isMain?: boolean;
  /** Translation path of the street address; `isList` when it is stored as lines. */
  address?: { key: string; isList?: boolean };
  /** The Google Maps place the clinic shares with patients. */
  mapsHref?: string;
  /** That place's pin, resolved from `mapsHref`, for the embedded map. */
  coordinates?: string;
  sessions: readonly ClinicSession[];
}

const CLINICS = "contact.clinics";

/** A clinic with a fixed address, which can be pinned on the embedded map. */
export type MappedClinic = ClinicLocation & { mapsHref: string; coordinates: string };

/* Hours come from the clinic's published OPD schedule. */
export const MAIN_CLINIC: MappedClinic = {
  id: "chinchwad",
  isMain: true,
  address: { key: "contact.contactInfo.location.details", isList: true },
  mapsHref: "https://maps.app.goo.gl/vUpHxgJ46WuhxacR8",
  coordinates: "18.6287415,73.7800642",
  sessions: [
    { icon: Sun, labelKey: `${CLINICS}.dayOpd`, hoursKey: `${CLINICS}.chinchwad.day` },
    { icon: Moon, labelKey: `${CLINICS}.nightOpd`, hoursKey: `${CLINICS}.chinchwad.night` },
  ],
};

const PUNE_CLINIC: MappedClinic = {
  id: "pune",
  address: { key: "drDeshmukhPage.services.nanapeth.description" },
  mapsHref: "https://maps.app.goo.gl/h32bZgQhb8r8YewX7",
  coordinates: "18.5142044,73.8690825",
  sessions: [{ icon: Moon, labelKey: `${CLINICS}.pune.note`, hoursKey: `${CLINICS}.pune.night` }],
};

/** The clinics that can be shown on the embedded map, main clinic first. */
export const MAPPED_CLINICS: readonly MappedClinic[] = [MAIN_CLINIC, PUNE_CLINIC];

export const CLINIC_LOCATIONS: readonly ClinicLocation[] = [
  ...MAPPED_CLINICS,
  {
    id: "dehu",
    sessions: [{ icon: CalendarDays, labelKey: `${CLINICS}.dehu.schedule`, hoursKey: `${CLINICS}.dehu.hours` }],
  },
  {
    id: "nanded",
    sessions: [{ icon: CalendarRange, labelKey: `${CLINICS}.nanded.schedule`, hoursKey: `${CLINICS}.nanded.hours` }],
  },
];

/** Keyless Google Maps embed centred on a pin, labelled in the page language. */
export function mapEmbedSrc(coordinates: string, language: SupportedLanguage): string {
  return `https://maps.google.com/maps?q=${coordinates}&z=16&hl=${language}&output=embed`;
}

/**
 * WhatsApp deep link with a booking request pre-filled in the visitor's
 * language. The clinic name is passed in from the translations rather than
 * read from `APP_CONFIG`, whose env-backed value differs between the server
 * and the browser and so broke hydration of every link built from it.
 */
export function buildWhatsAppHref(language: SupportedLanguage, clinicName: string): string {
  const message =
    language === "hi"
      ? "नमस्ते! मैं श्री विश्वमूर्ति आयुर्वेदालय में अपॉइंटमेंट बुक करना चाहता हूँ। कृपया उपलब्ध समय बताएं।"
      : language === "mr"
        ? "नमस्कार! मला श्री विश्वमूर्ती आयुर्वेदालयात भेटीची वेळ बुक करायची आहे. कृपया उपलब्ध वेळा सांगा."
        : `Hello! I would like to book an appointment at ${clinicName}. Please let me know the available slots.`;
  const digits = CLINIC_CONTACT.whatsapp.replace(/\D/g, "");

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
