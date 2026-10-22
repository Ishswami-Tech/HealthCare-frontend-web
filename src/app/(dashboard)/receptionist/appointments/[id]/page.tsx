"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarClock, User, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FactTile,
  InitialsAvatar,
  ListRow,
  LoadError,
  Note,
  Pill,
  SectionTitle,
  SkeletonRows,
  Surface,
  TbdPage,
  VisitTypeChip,
} from "@/components/tbd";
import { useAppointment } from "@/hooks/query/useAppointments";
import { asRow } from "@/components/patient/home/homeData";
import { APPOINTMENT_MAX_RESCHEDULES } from "@/lib/utils/appointmentUtils";
import { CheckInCell, ReceptionStatus } from "@/components/receptionist/ReceptionVisitList";
import { ReceptionRowActions } from "@/components/receptionist/ReceptionRowActions";
import { ReceptionStageTrack } from "@/components/receptionist/ReceptionStageTrack";
import { NoClinicalRecordsNote } from "@/components/receptionist/ReceptionNotes";
import { shiftDayKey, toReceptionVisit, type ReceptionVisit } from "@/components/receptionist/reception.logic";
import {
  RECEPTION_ROUTES,
  todayKey,
  useReceptionCheckIn,
  useReceptionLocation,
  useReceptionVisits,
} from "@/components/receptionist/useReceptionDesk";

function ruleText(visit: ReceptionVisit): string {
  const move = visit.canReschedule
    ? `It can still be rescheduled (${visit.rescheduleHint}).`
    : `It can no longer be rescheduled (at most ${APPOINTMENT_MAX_RESCHEDULES} times, only while it is open).`;
  if (visit.kind === "video") {
    return `The patient joins online; the video link opens 15 minutes before the visit. A video visit stays open for 5 hours from its start. ${move} Reception cannot book or cancel video visits.`;
  }
  return `The patient checks in at the desk or by scanning this location's QR. ${move}`;
}

function PastVisits({ patientId, currentId }: { patientId: string; currentId: string }) {
  const today = todayKey();
  const { visits, isLoading } = useReceptionVisits({ from: shiftDayKey(today, -365), to: shiftDayKey(today, 60), patientId });
  const others = visits.filter((visit) => visit.id !== currentId).reverse().slice(0, 5);
  return (
    <Surface as="section" aria-label="Other visits with this patient">
      <SectionTitle title="Other visits" description="Dates and doctors only." />
      {isLoading ? (
        <SkeletonRows rows={2} />
      ) : others.length === 0 ? (
        <p className="m-0 text-[13px] text-ink-muted">No other visits at this location.</p>
      ) : (
        <div>
          {others.map((visit) => (
            <ListRow
              key={visit.id}
              href={RECEPTION_ROUTES.appointment(visit.id)}
              title={`${visit.whenLabel} · ${visit.kind === "video" ? "Video" : "In-clinic"}`}
              description={visit.doctorName}
              right={<Pill tone={visit.statusTone}>{visit.statusLabel}</Pill>}
            />
          ))}
        </div>
      )}
    </Surface>
  );
}

/** RecAppointmentDetail: one appointment at the desk (no clinical content). */
export default function ReceptionAppointmentDetailPage() {
  const params = useParams<{ id: string }>();
  const appointmentId = String(params?.id ?? "");
  const { locationName } = useReceptionLocation();
  const { data, isPending, error, refetch } = useAppointment(appointmentId);
  const { checkIn, pendingId } = useReceptionCheckIn({ openSuccess: true });
  const visit = useMemo(() => {
    const row = asRow(data);
    return row ? toReceptionVisit(row, Date.now()) : null;
  }, [data]);

  return (
    <TbdPage
      title={visit ? visit.patientName : "Appointment"}
      description={visit ? `Appointment ${visit.id.slice(0, 8).toUpperCase()}` : undefined}
      backHref={RECEPTION_ROUTES.appointments}
      backLabel="Appointments"
    >
      {isPending ? (
        <SkeletonRows rows={4} />
      ) : error || !visit ? (
        <Surface flush>
          <LoadError
            title="The appointment could not be loaded"
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => void refetch()}
          />
        </Surface>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-5">
            <Surface as="section" aria-label="Appointment" className="gap-5">
              <div className="flex flex-wrap items-center gap-3.5">
                <InitialsAvatar name={visit.patientName} size={48} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-base font-extrabold text-ink">{visit.patientName}</span>
                  <span className="truncate text-[13px] text-ink-muted">{visit.patientPhone || "No phone"}</span>
                </div>
                <VisitTypeChip type={visit.kind === "video" ? "VIDEO_CALL" : "IN_PERSON"} variant="chip" />
                <ReceptionStatus visit={visit} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <FactTile label="When" value={visit.whenLabel} />
                <FactTile label="Doctor" value={visit.doctorName} />
                <FactTile label="Visit type" value={visit.kind === "video" ? "Video visit" : "In-clinic visit"} />
                <FactTile label="Location" value={visit.kind === "video" ? "Online" : locationName} />
              </div>
              <ReceptionStageTrack stage={visit.stage} kind={visit.kind} />
              <Note tone="blue" icon={CalendarClock}>
                {ruleText(visit)}
              </Note>
            </Surface>
            {visit.patientId ? <PastVisits patientId={visit.patientId} currentId={visit.id} /> : null}
          </div>

          <div className="flex flex-col gap-5">
            <Surface as="section" aria-label="Actions">
              <SectionTitle title="Actions" />
              <div className="flex flex-wrap items-center gap-2.5">
                <CheckInCell visit={visit} onCheckIn={(row) => void checkIn(row)} pending={pendingId === visit.id} />
                {visit.canReschedule ? (
                  <Button asChild variant="outline" size="md">
                    <Link href={RECEPTION_ROUTES.reschedule(visit.id)}>
                      <CalendarClock aria-hidden="true" /> Reschedule
                    </Link>
                  </Button>
                ) : null}
                {visit.stage === "completed" && visit.kind === "clinic" ? (
                  <Button asChild size="md">
                    <Link href={RECEPTION_ROUTES.collect(visit.patientUserId, visit.id)}>
                      <Wallet aria-hidden="true" /> Collect payment
                    </Link>
                  </Button>
                ) : null}
                <ReceptionRowActions visit={visit} onChanged={() => void refetch()} />
              </div>
              {!visit.canMarkNoShow && visit.stage === "booked" && visit.kind === "clinic" && (visit.startsAtMs ?? 0) > Date.now() ? (
                <p className="m-0 text-xs text-ink-muted">A no-show can be marked once the visit time has passed.</p>
              ) : null}
              {visit.patientUserId ? (
                <Button asChild variant="ghost" size="md" className="self-start">
                  <Link href={RECEPTION_ROUTES.patient(visit.patientUserId)}>
                    <User aria-hidden="true" /> View patient
                  </Link>
                </Button>
              ) : null}
            </Surface>
            <NoClinicalRecordsNote />
          </div>
        </div>
      )}
    </TbdPage>
  );
}
