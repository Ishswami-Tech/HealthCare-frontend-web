"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarDays, Mail, MapPin, Phone, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LoadError,
  SectionTitle,
  SkeletonRows,
  Surface,
  TbdPage,
  type TbdIcon,
} from "@/components/tbd";
import { usePatient } from "@/hooks/query/usePatients";
import { formatDateInIST } from "@/lib/utils/date-time";
import { ReceptionVisitList } from "@/components/receptionist/ReceptionVisitList";
import { ReceptionRowActions } from "@/components/receptionist/ReceptionRowActions";
import { NoClinicalRecordsNote } from "@/components/receptionist/ReceptionNotes";
import { ageGenderLabel, readPatientContact, shiftDayKey } from "@/components/receptionist/reception.logic";
import {
  RECEPTION_ROUTES,
  todayKey,
  useReceptionCheckIn,
  useReceptionLocation,
  useReceptionVisits,
} from "@/components/receptionist/useReceptionDesk";

function ContactLine({ icon: Icon, value, label }: { icon: TbdIcon; value: string; label: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={2} aria-hidden="true" />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-bold text-ink">{value || "Not added"}</span>
        <span className="text-xs text-ink-muted">{label}</span>
      </span>
    </div>
  );
}

/**
 * RecPatientDetail: contact details and visits (dates, doctors and statuses only).
 * Case notes, prescriptions, vitals and reports are never loaded here.
 */
export default function ReceptionPatientDetailPage() {
  const params = useParams<{ id: string }>();
  // The route id is the patient's USER id (what `GET /patients/:id` expects); appointments are
  // filtered by the Patient-record id read from that response.
  const patientUserId = String(params?.id ?? "");
  const { clinicId } = useReceptionLocation();
  const patient = usePatient(clinicId, patientUserId);
  const contact = useMemo(() => readPatientContact(patient.data), [patient.data]);
  const patientRecordId = contact?.patientId ?? "";
  const today = todayKey();
  const { visits, isLoading, error, refetch } = useReceptionVisits(
    {
      from: shiftDayKey(today, -730),
      to: shiftDayKey(today, 120),
      patientId: patientRecordId,
    },
    { enabled: Boolean(patientRecordId) },
  );
  const { checkIn, pendingId } = useReceptionCheckIn({ openSuccess: true });
  const now = Date.now();
  const upcoming = visits.filter(
    (visit) => (visit.stage === "booked" || visit.stage === "checked_in" || visit.stage === "with_doctor") && (visit.startsAtMs ?? now) >= now - 6 * 60 * 60 * 1000,
  );
  const past = visits.filter((visit) => !upcoming.includes(visit)).reverse();

  return (
    <TbdPage
      title={contact?.name ?? "Patient"}
      description={contact ? [contact.uhid ? `Patient ID ${contact.uhid}` : "", ageGenderLabel(contact)].filter(Boolean).join(" · ") : undefined}
      backHref={RECEPTION_ROUTES.patients}
      backLabel="Patients"
      actions={
        <Button asChild size="md">
          <Link href={RECEPTION_ROUTES.walkIn(patientUserId)}>
            <UserPlus aria-hidden="true" /> Walk-in
          </Link>
        </Button>
      }
    >
      {patient.isPending ? (
        <SkeletonRows rows={4} />
      ) : patient.error || !contact ? (
        <Surface flush>
          <LoadError
            title="This patient could not be loaded"
            message={patient.error instanceof Error ? patient.error.message : undefined}
            onRetry={() => void patient.refetch()}
          />
        </Surface>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-5">
            <Surface flush as="section" aria-label="Upcoming visits" className="gap-0">
              <div className="px-5 pb-2 pt-5">
                <SectionTitle title="Upcoming visits" count={upcoming.length} />
              </div>
              <ReceptionVisitList
                visits={upcoming}
                isLoading={isLoading}
                error={error}
                onRetry={() => void refetch()}
                showDate
                onCheckIn={(visit) => void checkIn(visit)}
                checkingInId={pendingId}
                renderMore={(visit) => <ReceptionRowActions visit={visit} />}
                emptyTitle="No upcoming visits"
                emptyDescription="Add a walk-in for today. Video visits are booked by the patient in the app."
              />
            </Surface>
            <Surface flush as="section" aria-label="Past visits" className="gap-0">
              <div className="px-5 pb-2 pt-5">
                <SectionTitle
                  title="Past visits"
                  count={past.length}
                  description="Dates and doctors only. Reception cannot see what was discussed."
                />
              </div>
              <ReceptionVisitList
                visits={past.slice(0, 10)}
                isLoading={isLoading}
                showDate
                emptyTitle="No past visits"
              />
            </Surface>
          </div>
          <div className="flex flex-col gap-5">
            <Surface as="section" aria-label="Contact">
              <SectionTitle title="Contact" />
              <ContactLine icon={Phone} value={contact.phone} label="Mobile · signs in by OTP" />
              <ContactLine icon={Mail} value={contact.email} label="Email" />
              <ContactLine icon={MapPin} value={contact.address} label="Address" />
              <ContactLine
                icon={CalendarDays}
                value={contact.registeredAt ? formatDateInIST(contact.registeredAt) : ""}
                label="Registered"
              />
            </Surface>
            <NoClinicalRecordsNote />
          </div>
        </div>
      )}
    </TbdPage>
  );
}
