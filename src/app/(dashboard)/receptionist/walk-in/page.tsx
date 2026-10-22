"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, CalendarClock, Loader2, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ChoiceChip,
  EmptyBlock,
  Field,
  InitialsAvatar,
  Note,
  Pill,
  SearchBox,
  SectionTitle,
  SkeletonRows,
  Surface,
  TbdPage,
} from "@/components/tbd";
import { QUEUE_PRIORITY_OPTIONS, type QueuePriority } from "@/app/(dashboard)/queue/_components/queue-roles.logic";
import { CheckInRefusedError, useInPersonWalkIn } from "@/hooks/query/useInPerson";
import { useSetQueuePriority } from "@/hooks/query/useQueue";
import { useCreateAppointment } from "@/hooks/query/useAppointments";
import { useDoctors } from "@/hooks/query/useDoctors";
import { usePatient } from "@/hooks/query/usePatients";
import { usePatientDirectory } from "@/hooks/query/usePatientDirectory";
import { showErrorToast, showSuccessToast, showWarningToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import {
  ageGenderLabel,
  nextSlotLabel,
  readPatientContact,
  type PatientContact,
} from "@/components/receptionist/reception.logic";
import type { WalkInNextAvailable } from "@/types/in-person.types";
import { RECEPTION_ROUTES, useReceptionLocation } from "@/components/receptionist/useReceptionDesk";
import { PatientPlanStatus } from "@/components/billing/PatientPlanStatus";

/** "HH:mm" (IST, as the visit stores it) -> "02:35 pm"; "" when it is not a time. */
function slotTimeLabel(time: string | null | undefined): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(time ?? "").trim());
  if (!match) return "";
  const hours = Number(match[1]);
  if (!Number.isInteger(hours) || hours > 23) return "";
  const suffix = hours >= 12 ? "pm" : "am";
  return `${String(hours % 12 || 12).padStart(2, "0")}:${match[2]} ${suffix}`;
}

function PatientPicker({
  clinicId,
  selected,
  onSelect,
}: {
  clinicId: string;
  selected: PatientContact | null;
  onSelect: (patient: PatientContact | null) => void;
}) {
  const [search, setSearch] = useState("");
  const term = search.trim();
  const directory = usePatientDirectory(clinicId, { search: term, pageSize: 10 }, { enabled: term.length >= 2 });
  const rows = term.length >= 2 ? (directory.data?.rows ?? []) : [];

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-brand bg-mint-soft px-4 py-3">
        <InitialsAvatar name={selected.name} size={40} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-bold text-ink">{selected.name}</span>
          <span className="truncate text-xs text-ink-muted">
            {[ageGenderLabel(selected), selected.phone || "No phone"].join(" · ")}
          </span>
        </span>
        <Button variant="outline" size="md" onClick={() => onSelect(null)}>
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <SearchBox value={search} onChange={setSearch} placeholder="Find patient by name or phone" />
      {term.length >= 2 ? (
        directory.isPending ? (
          <SkeletonRows rows={2} />
        ) : rows.length === 0 ? (
          <p className="m-0 text-[13px] text-ink-muted">No patient matches “{term}”.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0" aria-label="Matching patients">
            {rows.map((row) => {
              const contact = readPatientContact(row, row.patientId);
              if (!contact) return null;
              return (
                <li key={row.patientId}>
                  <button
                    type="button"
                    onClick={() => onSelect(contact)}
                    className="flex w-full items-center gap-3 rounded-xl border border-line px-3.5 py-2.5 text-left hover:bg-mint-soft focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    <InitialsAvatar name={contact.name} size={34} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-bold text-ink">{contact.name}</span>
                      <span className="truncate text-xs text-ink-muted">
                        {[ageGenderLabel(contact), contact.phone || "No phone", row.uhid].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )
      ) : (
        <p className="m-0 text-xs text-ink-muted">Type at least 2 letters or digits.</p>
      )}
      <p className="m-0 text-[13px] text-ink-muted">
        Not in the list?{" "}
        <Link href={`${RECEPTION_ROUTES.register}?next=walk-in`} className="font-bold text-brand">
          Register a new patient
        </Link>
      </p>
    </div>
  );
}

/** Today is full: the next free slot the server offered, booked as a normal visit in one click. */
function NextSlotOffer({
  message,
  slot,
  booking,
  onBook,
}: {
  message: string;
  slot: WalkInNextAvailable | null;
  booking: boolean;
  onBook: () => void;
}) {
  if (!slot) {
    return (
      <Note tone="amber" icon={CalendarClock}>
        {message || "No free slot left today, and none in the next 14 days. Book the patient for a later day."}
      </Note>
    );
  }
  const label = nextSlotLabel(slot.date, slot.time);
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#fcd34d] bg-[#fffbeb] px-4 py-3.5 dark:border-amber-800 dark:bg-amber-950/30">
      <p className="m-0 flex items-start gap-2 text-[13px] font-bold text-[#92400e] dark:text-amber-200">
        <CalendarClock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>No free slot left today. Next available: {label}.</span>
      </p>
      <Button size="md" className="self-start" disabled={booking} onClick={onBook}>
        {booking ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CalendarCheck aria-hidden="true" />}
        {booking ? "Booking…" : `Book for ${label}`}
      </Button>
    </div>
  );
}

/** The future visit booked from the offer: no check-in or token until the patient comes that day. */
function BookedForLater({ label, onDone }: { label: string; onDone: () => void }) {
  return (
    <Note tone="green" icon={CalendarCheck}>
      <span className="flex flex-col gap-2">
        <span className="font-bold">Booked for {label}.</span>
        <span>The patient checks in at the desk on that day; no token is given now.</span>
        <span>
          <Button variant="outline" size="md" onClick={onDone}>
            Add another walk-in
          </Button>
        </span>
      </span>
    </Note>
  );
}

function WalkInForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const presetPatientId = useSearchParams().get("patientId") ?? "";
  const { clinicId, locationId, locationName } = useReceptionLocation();
  const presetPatient = usePatient(clinicId, presetPatientId);
  const presetContact = useMemo(
    () => (presetPatientId ? readPatientContact(presetPatient.data) : null),
    [presetPatient.data, presetPatientId],
  );
  const [picked, setPicked] = useState<PatientContact | null | undefined>(undefined);
  const patient = picked === undefined ? presetContact : picked;
  const [priority, setPriority] = useState<QueuePriority>("NORMAL");
  const [notes, setNotes] = useState("");
  const [doctorId, setDoctorId] = useState("");
  // A full day (409) offers the next free slot; kept per patient so a new pick clears it.
  const [offer, setOffer] = useState<{ patientId: string; message: string; slot: WalkInNextAvailable | null } | null>(null);
  const [bookedLabel, setBookedLabel] = useState("");

  // Multi-doctor clinics: the desk must pick who sees the walk-in. With a single active doctor the
  // server auto-assigns, so no doctorId is sent at all.
  const doctorsQuery = useDoctors(clinicId, { isActive: true, ...(locationId ? { locationId } : {}) }, { enabled: Boolean(clinicId) });
  const doctors = useMemo(
    () => (Array.isArray(doctorsQuery.data) ? (doctorsQuery.data as Array<{ id?: string; name?: string; specialization?: string }>) : []).filter(
      (doctor): doctor is { id: string; name?: string; specialization?: string } => Boolean(doctor.id),
    ),
    [doctorsQuery.data],
  );
  const needsDoctor = doctors.length > 1;
  const chosenDoctorId = needsDoctor && doctors.some((doctor) => doctor.id === doctorId) ? doctorId : "";

  // One call (contract 18.5): the server creates the visit for now at the desk's location, assigns
  // the chosen doctor (or the clinic's single doctor) and checks the patient in (same service as
  // the QR scan). Idempotent.
  const walkIn = useInPersonWalkIn();
  const setQueuePriority = useSetQueuePriority();
  const createAppointment = useCreateAppointment(clinicId);
  const activeOffer = offer && patient && offer.patientId === patient.patientId ? offer : null;
  const ready =
    Boolean(patient && locationId) && !walkIn.isPending && !doctorsQuery.isPending && (!needsDoctor || Boolean(chosenDoctorId));

  const choosePatient = (next: PatientContact | null) => {
    setOffer(null);
    setBookedLabel("");
    setPicked(next);
  };

  // Books the offered slot through the normal staff booking (POST /appointments, in person, plan
  // covered like any desk booking). A future visit: no check-in and no token now.
  const bookOffer = async () => {
    const slot = activeOffer?.slot;
    if (!patient || !slot) return;
    const label = nextSlotLabel(slot.date, slot.time);
    try {
      await createAppointment.mutateAsync({
        patientId: patient.patientId,
        doctorId: slot.doctorId,
        locationId: slot.locationId,
        date: slot.date,
        time: slot.time,
        type: "IN_PERSON",
        priority: "NORMAL",
        // Only the desk's own words: a system line reached the doctor as the patient's remark.
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      setOffer(null);
      setBookedLabel(label);
      showSuccessToast(`Booked for ${label}`, { id: TOAST_IDS.APPOINTMENT.CREATE });
    } catch {
      // useCreateAppointment already shows the server's reason (e.g. the slot was just taken).
    }
  };

  const submit = async () => {
    if (!patient || !locationId) return;
    if (needsDoctor && !chosenDoctorId) return;
    setOffer(null);
    setBookedLabel("");
    try {
      const result = await walkIn.mutateAsync({
        patientId: patient.patientId,
        locationId,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        ...(chosenDoctorId ? { doctorId: chosenDoctorId } : {}),
      });
      const visit = result.result === "CHECKED_IN" ? result.visit : null;
      if (!visit) {
        showErrorToast("The walk-in was added but could not be checked in. Check it in from the list.", {
          id: TOAST_IDS.APPOINTMENT.CHECK_IN,
        });
        router.push(RECEPTION_ROUTES.checkIn);
        return;
      }
      // The server books the next free slot of the day, not literally "now": say which one.
      const slot = slotTimeLabel(visit.time);
      showSuccessToast(
        [visit.token ? `Checked in · token ${visit.token}` : "Checked in", slot ? `slot ${slot}` : ""].filter(Boolean).join(" · "),
        { id: TOAST_IDS.APPOINTMENT.CHECK_IN },
      );
      // No plan, allowed by the clinic walk-in rule: tell the desk what to collect (server copy).
      if (result.planWaiver?.label) {
        if (result.planWaiver.policy === "ALLOW_WITH_DESK_FEE") {
          showWarningToast(result.planWaiver.label, { duration: 12000 });
        } else {
          showSuccessToast(result.planWaiver.label, { duration: 6000 });
        }
      }
      if (priority !== "NORMAL") {
        // The check-in already succeeded; a priority failure must not undo or hide that.
        await setQueuePriority.mutateAsync({ appointmentId: visit.appointmentId, priority }).catch(() => {
          showWarningToast("Checked in, but priority was not applied — set it from the queue", { duration: 8000 });
        });
      }
      // Drop any partial copy (a realtime snapshot of the new visit) so the success page loads the
      // full record instead of showing placeholders.
      queryClient.removeQueries({ queryKey: ["appointment", visit.appointmentId], exact: true });
      router.push(RECEPTION_ROUTES.checkInSuccess(visit.appointmentId));
    } catch (error) {
      if (error instanceof CheckInRefusedError && error.failure.nextAvailable !== undefined) {
        setOffer({ patientId: patient.patientId, message: error.failure.error, slot: error.failure.nextAvailable });
        return;
      }
      const message =
        error instanceof CheckInRefusedError && error.failure.reason === "RECEPTION_WRONG_LOCATION"
          ? "Your desk has no location yet. Ask the clinic admin to assign your location."
          : error instanceof Error
            ? error.message
            : "The walk-in could not be added.";
      showErrorToast(message, { id: TOAST_IDS.APPOINTMENT.CHECK_IN });
    }
  };

  if (!locationId) {
    return (
      <Surface flush>
        <EmptyBlock
          icon={Users}
          tone="amber"
          title="This desk has no location"
          description="A walk-in joins the queue of the reception location. Ask the clinic admin to assign your location."
        />
      </Surface>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Surface as="section" aria-label="Walk-in" className="gap-5">
        <section className="flex flex-col gap-2.5" aria-label="Patient">
          <SectionTitle title="1. Patient" />
          {presetPatientId && presetPatient.isPending && picked === undefined ? (
            <SkeletonRows rows={1} />
          ) : (
            <PatientPicker clinicId={clinicId} selected={patient ?? null} onSelect={choosePatient} />
          )}
          {/* In-clinic visits are covered by the monthly in-person plan; the check-in enforces it. */}
          {patient?.userId ? <PatientPlanStatus clinicId={clinicId} patientUserId={patient.userId} /> : null}
        </section>

        {needsDoctor ? (
          <section className="flex flex-col gap-2.5" aria-label="Doctor">
            <SectionTitle title="2. Doctor" description="Required: this clinic has more than one doctor." />
            <div className="flex flex-wrap gap-2" role="group" aria-label="Doctor (required)">
              {doctors.map((doctor) => (
                <ChoiceChip key={doctor.id} active={chosenDoctorId === doctor.id} onClick={() => {
                    setOffer(null);
                    setDoctorId(doctor.id);
                  }}>
                  {doctor.name || "Doctor"}
                  {doctor.specialization ? ` · ${doctor.specialization}` : ""}
                </ChoiceChip>
              ))}
            </div>
            {!chosenDoctorId ? <p className="m-0 text-xs text-ink-muted">Choose the doctor who will see this patient.</p> : null}
          </section>
        ) : null}

        <section className="flex flex-col gap-2.5" aria-label="Priority">
          <SectionTitle title={needsDoctor ? "3. Priority" : "2. Priority"} description="Senior, pregnant and emergency patients move ahead in the queue." />
          <div className="flex flex-wrap gap-2">
            {QUEUE_PRIORITY_OPTIONS.map((option) => (
              <ChoiceChip key={option.value} active={priority === option.value} onClick={() => setPriority(option.value)}>
                {option.label}
              </ChoiceChip>
            ))}
          </div>
        </section>

        <Field label="Note for the desk (optional)" htmlFor="walk-in-notes">
          <Textarea
            id="walk-in-notes"
            value={notes}
            maxLength={300}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="For example: came without an appointment"
          />
        </Field>

        {activeOffer ? (
          <NextSlotOffer
            message={activeOffer.message}
            slot={activeOffer.slot}
            booking={createAppointment.isPending}
            onBook={() => void bookOffer()}
          />
        ) : null}
        {bookedLabel ? <BookedForLater label={bookedLabel} onDone={() => choosePatient(null)} /> : null}

        <div className="flex flex-wrap justify-end gap-2.5 border-t border-hair pt-4">
          <Button asChild variant="outline" size="md">
            <Link href={RECEPTION_ROUTES.dashboard}>Cancel</Link>
          </Button>
          <Button size="md" disabled={!ready} onClick={() => void submit()}>
            {walkIn.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <UserPlus aria-hidden="true" />}
            {walkIn.isPending ? "Adding…" : "Add to queue"}
          </Button>
        </div>
      </Surface>

      <Surface as="aside" aria-label="Summary">
        <SectionTitle title="Summary" />
        <dl className="m-0 flex flex-col gap-2.5 text-[13px]">
          {[
            ["Patient", patient?.name ?? "Not chosen"],
            ...(needsDoctor ? [["Doctor", doctors.find((doctor) => doctor.id === chosenDoctorId)?.name ?? "Not chosen"]] : []),
            ["Location", locationName],
            ["Time", "Next free slot"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3">
              <dt className="text-ink-muted">{label}</dt>
              <dd className="m-0 text-right font-bold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        <Pill tone={priority === "NORMAL" ? "slate" : "rose"} className="self-start">
          {QUEUE_PRIORITY_OPTIONS.find((option) => option.value === priority)?.label ?? "Normal"}
        </Pill>
        <p className="m-0 text-xs text-ink-muted">
          The patient is booked into the next free slot of the day, checked in straight away and joins this
          location&apos;s queue. The slot time is shown once they are added.
        </p>
      </Surface>
    </div>
  );
}

/** RecWalkIn: someone came without an appointment: one call books them now at this location and checks them in. */
export default function ReceptionWalkInPage() {
  return (
    <TbdPage
      title="Walk-in"
      description="Add a patient who came without an appointment to the in-clinic queue."
      backHref={RECEPTION_ROUTES.dashboard}
      backLabel="Dashboard"
    >
      <Suspense fallback={<SkeletonRows rows={4} />}>
        <WalkInForm />
      </Suspense>
    </TbdPage>
  );
}
