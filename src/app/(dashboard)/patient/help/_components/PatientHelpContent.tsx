"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { useLanguage } from "@/lib/i18n/context";
import { PatientHelpView } from "./PatientHelpView";
import { HELP_FAQS, buildHelpContacts } from "./help.content";
import { useMyClinic } from "@/hooks/query/useClinics";
import { clinicHoursLines } from "./clinic-hours";
import { SupportChatPanel } from "@/components/support/SupportChatPanel";

/**
 * Help & support. The clinic's phone, WhatsApp, email and address are the same values the public
 * contact page shows (the `clinic.*` and `contact.contactInfo.*` translations). Clinic hours come
 * from the backend: the working hours of the clinic's locations (`GET /clinics/my-clinic`).
 */
export function PatientHelpContent() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const { data: myClinic } = useMyClinic();
  const hoursLines = clinicHoursLines(myClinic);

  /** A translation, or "" when the key is missing (the lookup then returns the key itself). */
  const value = (key: string) => {
    const found = t(key).trim();
    return found && found !== key ? found : "";
  };

  const contacts = buildHelpContacts({
    phones: [value("contact.contactInfo.phoneNumbers.details.0"), value("contact.contactInfo.phoneNumbers.details.1")].filter(
      Boolean,
    ),
    whatsapp: value("clinic.whatsapp"),
    email: value("clinic.email") || value("contact.contactInfo.emailAddresses.details.0"),
  });

  const firstName =
    String(session?.user?.firstName || "").trim() || String(session?.user?.name || "").trim().split(/\s+/)[0] || "";

  return (
    <PatientHelpView
      firstName={firstName || undefined}
      contacts={contacts}
      address={value("clinic.address") || undefined}
      hours={hoursLines.length > 0 ? hoursLines.join("\n") : undefined}
      contactPageHref="/contact"
      backHref="/patient/profile"
      faqs={HELP_FAQS}
      chat={<SupportChatPanel />}
    />
  );
}
