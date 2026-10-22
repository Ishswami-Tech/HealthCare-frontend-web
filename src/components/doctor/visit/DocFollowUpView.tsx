"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck2, Hospital } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChoiceChip, DateField, EmptyBlock, Field, Note, SectionTitle, SkeletonRows, Surface, TbdPage } from "@/components/tbd";
import { BookingSlotGroups, buildSlotPeriods } from "@/components/appointments/booking";
import { useCreateAppointment, useDoctorAvailability } from "@/hooks/query/useAppointments";
import { extractAvailabilitySlots, groupSlotsByPeriod } from "@/lib/utils/availabilitySlots";
import { useDoctorVisit } from "./useDoctorVisit";
import { VisitGate, VisitPatientCard } from "./VisitParts";
import { visitHref } from "./visit-routes";
import { addDaysToKey, followUpPresets, followUpQuery, shortDayLabel } from "./visit-flow.logic";

const NOTE_LIMIT = 500;

/** Id of the appointment the booking call returns, whatever wrapper it comes in. */
function createdId(value: unknown): string {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const nested = record.appointment && typeof record.appointment === "object" ? (record.appointment as Record<string, unknown>) : record;
  return typeof nested.id === "string" ? nested.id : "";
}

function FollowUpForm({ appointmentId }: { appointmentId: string }) {
  const visit = useDoctorVisit(appointmentId);
  const router = useRouter();
  const presets = useMemo(() => followUpPresets(visit.todayKey), [visit.todayKey]);
  const [date, setDate] = useState(presets[0]?.dateKey ?? "");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const create = useCreateAppointment(visit.clinicId);
  const doctorId = String(visit.raw?.doctorId ?? "");

  const slotsQuery = useDoctorAvailability(visit.clinicId, doctorId, date, visit.locationId || undefined, "IN_PERSON", {
    enabled: Boolean(doctorId && date),
  });
  const periods = useMemo(
    () => buildSlotPeriods(groupSlotsByPeriod(extractAvailabilitySlots(slotsQuery.data)), [], 0),
    [slotsQuery.data],
  );
  const openCount = periods.reduce((sum, period) => sum + period.openCount, 0);
  const backToComplete = visitHref(appointmentId, "complete");

  const pickDate = (value: string) => {
    setDate(value);
    setTime("");
  };

  const confirm = async () => {
    if (!visit.patientId || !doctorId || !date || !time) return;
    const trimmed = note.trim().slice(0, NOTE_LIMIT);
    try {
      const created = await create.mutateAsync({
        patientId: visit.patientId,
        doctorId,
        date,
        time,
        type: "IN_PERSON",
        clinicId: visit.clinicId,
        ...(visit.locationId ? { locationId: visit.locationId } : {}),
        notes: trimmed ? `Follow-up: ${trimmed}` : "Follow-up visit",
      });
      const id = createdId(created);
      router.push(`${backToComplete}?${followUpQuery({ date, time, ...(id ? { appointmentId: id } : {}) })}`);
    } catch {
      // The booking hook shows the error.
    }
  };

  return (
    <VisitGate visit={visit}>
      <VisitPatientCard visit={visit} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <Surface>
            <SectionTitle title={`When should ${visit.appointment?.patientName ?? "the patient"} come back?`} />
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <ChoiceChip key={preset.key} active={date === preset.dateKey} onClick={() => pickDate(preset.dateKey)}>
                  {preset.label} · {shortDayLabel(preset.dateKey)}
                </ChoiceChip>
              ))}
            </div>
            <Field label="Or pick a date" htmlFor="follow-up-date">
              <DateField id="follow-up-date" value={date} onChange={pickDate} min={addDaysToKey(visit.todayKey, 1)} />
            </Field>
            <Note tone="green" icon={Hospital}>
              <strong>In clinic{visit.locationName ? ` · ${visit.locationName}` : ""}.</strong> Same QR check-in and queue as
              today. Video visits are booked by patients themselves.
            </Note>
          </Surface>

          <Surface>
            <SectionTitle
              title={`Pick a slot · ${shortDayLabel(date)}`}
              description={slotsQuery.isPending ? "Loading free slots…" : `${openCount} free`}
            />
            {!doctorId || !date ? (
              <EmptyBlock title="Choose a day first" className="py-6" />
            ) : slotsQuery.isPending ? (
              <SkeletonRows rows={2} />
            ) : slotsQuery.error ? (
              <Note tone="rose">The free slots could not be loaded. Pick another day or try again.</Note>
            ) : openCount === 0 ? (
              <EmptyBlock title="No free slots that day" description="Pick another day." className="py-6" />
            ) : (
              <BookingSlotGroups periods={periods} selected={time} onSelect={setTime} timeStyle="12h" columnsClassName="grid-cols-3 sm:grid-cols-6" />
            )}
          </Surface>

          <Surface>
            <Field label="Note to patient" htmlFor="follow-up-note" hint={`${note.length}/${NOTE_LIMIT}`}>
              <Textarea
                id="follow-up-note"
                value={note}
                maxLength={NOTE_LIMIT}
                rows={3}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Bring the blood test reports. Come earlier if the fever lasts beyond 3 days."
              />
            </Field>
          </Surface>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Surface>
            <SectionTitle title="Follow-up summary" icon={CalendarCheck2} />
            <p className="m-0 text-lg font-extrabold text-ink">
              {shortDayLabel(date) || "No day"}
              {time ? `, ${time}` : ""}
            </p>
            <p className="m-0 text-[13px] text-ink-muted">
              In clinic{visit.locationName ? ` · ${visit.locationName}` : ""} · review visit
            </p>
            <p className="m-0 text-xs text-ink-muted">The patient is notified and sees the visit in their app.</p>
            <Button size="xl" disabled={!time || create.isPending} onClick={() => void confirm()}>
              Confirm follow-up
            </Button>
            <Button variant="outline" size="md" asChild>
              <Link href={backToComplete}>No follow-up needed</Link>
            </Button>
            <p className="m-0 text-xs text-ink-muted">Returns to Complete visit with this slot attached.</p>
          </Surface>
        </div>
      </div>
    </VisitGate>
  );
}

/** DocFollowUp: book the in-clinic review from the visit (same location, first free slot). */
export function DocFollowUpView({ appointmentId }: { appointmentId: string }) {
  return (
    <TbdPage
      title="Book follow-up"
      {...(appointmentId ? { backHref: visitHref(appointmentId, "complete"), backLabel: "Complete visit" } : {})}
    >
      {appointmentId ? (
        <FollowUpForm appointmentId={appointmentId} />
      ) : (
        <Surface flush>
          <EmptyBlock
            icon={CalendarCheck2}
            title="Open a visit to book its follow-up"
            description="Follow-ups are booked from a visit, so the patient, location and doctor are already set."
            action={
              <Button asChild>
                <Link href="/doctor/appointments">Go to appointments</Link>
              </Button>
            }
          />
        </Surface>
      )}
    </TbdPage>
  );
}
