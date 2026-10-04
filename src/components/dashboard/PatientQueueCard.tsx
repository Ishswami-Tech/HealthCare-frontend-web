"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, ScanQrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveTag, Note, Pill, SectionTitle, Surface } from "@/components/tbd";
import { usePatientQueue } from "@/hooks/query/usePatientQueue";
import { usePatientUiStore } from "@/stores/patient-ui.store";
import {
  formatWait,
  readAppointments,
  selectClinicVisits,
  ticketHeadline,
  toQueueTicket,
} from "@/app/(dashboard)/patient/queue/_components/queueData";

type PatientQueueCardProps = {
  appointmentsData?: unknown;
  isAppointmentsPending?: boolean;
  onBookAppointment?: () => void;
};

const STEPS = ["Book an in-clinic visit", "Reach the clinic", "Scan the QR at the desk"] as const;

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5 rounded-[14px] bg-[#f4faf6] px-2 py-3 text-center dark:bg-emerald-500/10">
      <span className="text-xs text-ink-muted">{label}</span>
      <span className="text-lg font-extrabold leading-tight text-ink">{value}</span>
    </div>
  );
}

/**
 * Compact queue card for a patient: their own place when checked in, or how to join the queue.
 * The place comes from `GET queue/me` (the patient's own entry) and refreshes by itself; the
 * staff queue list is never requested. Check-in is offered only for in-clinic visits.
 */
export function PatientQueueCard({
  appointmentsData,
  isAppointmentsPending = false,
  onBookAppointment,
}: PatientQueueCardProps) {
  const { push } = useRouter();
  const openQrGate = usePatientUiStore((state) => state.openQrGate);
  const [now] = useState(() => Date.now());

  const clinicVisits = useMemo(
    () => selectClinicVisits(readAppointments(appointmentsData), now),
    [appointmentsData, now]
  );
  const hasInPersonAppointment = clinicVisits.length > 0;
  const checkedInVisit = clinicVisits.find(({ visit }) => visit.clinicStage !== "upcoming")?.visit ?? null;

  const { data: queueEntry, isPending: isQueuePending } = usePatientQueue({ enabled: Boolean(checkedInVisit) });

  if (isAppointmentsPending || (checkedInVisit && isQueuePending)) {
    return (
      <Surface aria-busy="true" aria-label="Loading queue status">
        <Skeleton className="h-5 w-40 rounded-md" />
        <Skeleton className="h-[68px] w-full rounded-[14px]" />
      </Surface>
    );
  }

  if (queueEntry) {
    const ticket = toQueueTicket(queueEntry, checkedInVisit?.tokenLabel);
    const headline = ticketHeadline(ticket);
    return (
      <Surface as="section" aria-label="Live queue">
        <SectionTitle
          title="Live queue"
          description={checkedInVisit?.doctorName}
          action={ticket.isWithDoctor ? <Pill tone="blue">In progress</Pill> : <LiveTag>Live</LiveTag>}
        />
        <div className="grid grid-cols-3 gap-2">
          <Figure label={headline.label} value={headline.value} />
          <Figure label="Ahead of you" value={ticket.patientsAhead !== null ? String(ticket.patientsAhead) : "—"} />
          <Figure
            label="Est. wait"
            value={
              ticket.isWithDoctor
                ? "Your turn"
                : ticket.estimatedWaitMinutes !== null
                  ? formatWait(ticket.estimatedWaitMinutes)
                  : "—"
            }
          />
        </div>
        <Button size="md" className="w-full sm:w-auto sm:self-end" asChild>
          <Link href="/patient/queue">
            <Activity aria-hidden="true" />
            Track live queue
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </Surface>
    );
  }

  return (
    <Surface as="section" aria-label="Join the queue">
      <SectionTitle
        title="Join the queue"
        description="The queue is for in-clinic visits."
        action={<Pill tone="slate">{checkedInVisit ? "Checked in" : "Not in a queue"}</Pill>}
      />
      {checkedInVisit ? (
        <Note tone="green" icon={Activity}>
          You are checked in. Open the live queue to see your place.
        </Note>
      ) : (
        <ol className="m-0 grid list-none gap-2 p-0 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step} className="flex items-center gap-2.5 rounded-[14px] bg-well px-3 py-2.5">
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-mint text-[11px] font-extrabold text-brand-dark"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className="text-[13px] font-semibold text-ink">
                <span className="sr-only">Step {index + 1}: </span>
                {step}
              </span>
            </li>
          ))}
        </ol>
      )}
      {checkedInVisit ? (
        <Button size="md" className="w-full sm:w-auto sm:self-end" asChild>
          <Link href="/patient/queue">
            <Activity aria-hidden="true" />
            Track live queue
          </Link>
        </Button>
      ) : (
        <Button
          size="md"
          className="w-full sm:w-auto sm:self-end"
          onClick={() => {
            // Check-in is only for in-clinic visits: without one, explain and offer booking.
            if (!hasInPersonAppointment) {
              openQrGate({
                onBookAppointment: () => {
                  if (onBookAppointment) {
                    onBookAppointment();
                    return;
                  }
                  push("/patient/appointments");
                },
              });
              return;
            }
            push("/patient/check-in");
          }}
        >
          <ScanQrCode aria-hidden="true" />
          Check in at clinic
        </Button>
      )}
    </Surface>
  );
}
