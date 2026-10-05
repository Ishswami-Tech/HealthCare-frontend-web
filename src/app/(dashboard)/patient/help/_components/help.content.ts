import { APPOINTMENT_MAX_RESCHEDULES } from "@/lib/utils/appointmentUtils";

/**
 * Help & support content. There is no help-desk, FAQ or ticket API, so the questions are written
 * here, in plain words, and only about things the patient app really does.
 */

export interface HelpFaqLink {
  label: string;
  href: string;
}

export interface HelpFaq {
  id: string;
  /** Colour of the dot in front of the question. */
  tone: "green" | "orange" | "blue";
  question: string;
  answer: string;
  links?: HelpFaqLink[];
}

export const HELP_FAQS: HelpFaq[] = [
  {
    id: "book-video",
    tone: "green",
    question: "How do I book a video visit?",
    answer:
      "Open Appointments and choose Book appointment. Pick Video, then your doctor, a date and a time. You pay the fee at the end. The visit is confirmed once the payment goes through.",
    links: [{ label: "Book an appointment", href: "/patient/appointments?openBooking=1" }],
  },
  {
    id: "join-video",
    tone: "green",
    question: "When can I join my video visit?",
    answer:
      "The Join button opens 15 minutes before your time. You will find it on Home and in Appointments. Allow the camera and microphone when your browser asks.",
    links: [{ label: "Open Appointments", href: "/patient/appointments" }],
  },
  {
    id: "reschedule",
    tone: "orange",
    question: "Can I change or cancel a visit?",
    answer: `You can move a visit to a new time up to ${APPOINTMENT_MAX_RESCHEDULES} times, from Appointments. A video visit cannot be cancelled and its fee is not refunded, so move it if you cannot make it. If you miss it, you need to book a new one.`,
    links: [{ label: "Open Appointments", href: "/patient/appointments" }],
  },
  {
    id: "check-in",
    tone: "green",
    question: "How do I check in at the clinic?",
    answer:
      "When you reach the clinic, open Check in and scan the QR code at the front desk. You then get your place in the queue and can follow it on your phone. Check-in is only for in-clinic visits.",
    links: [{ label: "Check in", href: "/patient/check-in" }],
  },
  {
    id: "pay",
    tone: "blue",
    question: "How do I pay a bill?",
    answer:
      "Open Payments to see what is due. Choose Pay on the bill and finish the payment online. Your paid bills and receipts stay there.",
    links: [{ label: "Open Payments", href: "/patient/payments" }],
  },
  {
    id: "records",
    tone: "green",
    question: "Where are my prescriptions and reports?",
    answer:
      "Prescriptions are under Health, in Medicines. Lab reports and the files you upload are under Health, in Reports.",
    links: [
      { label: "Medicines", href: "/patient/health/medicines" },
      { label: "Reports", href: "/patient/health/reports" },
    ],
  },
];

// ── Ways to reach the clinic ───────────────────────────────────────────────

export interface HelpContact {
  key: "whatsapp" | "call" | "email";
  label: string;
  /** The number or address, as the clinic publishes it. */
  detail: string;
  href: string;
}

export interface ClinicContactDetails {
  /** Phone numbers from the public contact page, first one first. */
  phones: string[];
  whatsapp: string;
  email: string;
}

const digits = (value: string) => value.replace(/\D/g, "");

/**
 * `wa.me` needs the country code. The clinic's WhatsApp number is stored without one, so the code
 * is read from the clinic's own published phone numbers — never guessed.
 */
function whatsappNumber(whatsapp: string, phones: string[]): string {
  const local = digits(whatsapp);
  if (local.length !== 10) return local;
  const published = phones.map(digits).filter((phone) => phone.length > 10);
  const same = published.find((phone) => phone.endsWith(local));
  if (same) return same;
  const countryCode = published[0]?.slice(0, -10);
  return countryCode ? `${countryCode}${local}` : "";
}

/** The contact rows of the help card. A route is left out when the clinic has not published it. */
export function buildHelpContacts({ phones, whatsapp, email }: ClinicContactDetails): HelpContact[] {
  const contacts: HelpContact[] = [];
  const chat = whatsappNumber(whatsapp, phones);
  if (chat) {
    const shown = phones.find((phone) => digits(phone) === chat) ?? `+${chat}`;
    contacts.push({ key: "whatsapp", label: "Chat on WhatsApp", detail: shown, href: `https://wa.me/${chat}` });
  }
  const phone = phones.find((entry) => digits(entry).length >= 10);
  if (phone) {
    contacts.push({ key: "call", label: "Call the clinic", detail: phone, href: `tel:+${digits(phone)}` });
  }
  if (email.includes("@")) {
    contacts.push({ key: "email", label: "Email", detail: email, href: `mailto:${email}` });
  }
  return contacts;
}
