"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { useLanguage } from "@/lib/i18n/context";
import { PatientHelpView } from "./PatientHelpView";
import { HELP_FAQS, buildHelpContacts, buildSupportContacts } from "./help.content";
import { useMyClinic } from "@/hooks/query/useClinics";
import { clinicHoursLines } from "./clinic-hours";

/**
 * Help & support. The clinic's phone, WhatsApp, email and address come from the patient's own
 * clinic record (`GET /clinics/my-clinic`), never from the public marketing site's static
 * translations — those name a different clinic/doctor for a patient on another clinic. Clinic
 * hours come from the same record: the working hours of the clinic's locations.
 */
export function PatientHelpContent() {
  const { session } = useAuth();
  const { data: myClinic } = useMyClinic();
  const hoursLines = clinicHoursLines(myClinic);

  const contacts = buildHelpContacts({
    phones: [myClinic?.phone].filter((phone): phone is string => Boolean(phone)),
    whatsapp: myClinic?.phone ?? "",
    email: myClinic?.email ?? "",
  });
  const supportContacts = buildSupportContacts(myClinic?.supportPhone, myClinic?.supportEmail);

  const firstName =
    String(session?.user?.firstName || "").trim() || String(session?.user?.name || "").trim().split(/\s+/)[0] || "";

  return (
    <PatientHelpView
      firstName={firstName || undefined}
      contacts={contacts}
      supportContacts={supportContacts}
      address={myClinic?.address || undefined}
      hours={hoursLines.length > 0 ? hoursLines.join("\n") : undefined}
      contactPageHref="/contact"
      backHref="/patient/profile"
      faqs={HELP_FAQS}
    />
  );
}
