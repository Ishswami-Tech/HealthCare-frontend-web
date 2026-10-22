"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ListOrdered, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EmptyBlock,
  FactTile,
  IconBox,
  InitialsAvatar,
  LoadError,
  Pill,
  SectionTitle,
  SkeletonRows,
  Surface,
  TbdPage,
  VisitTypeChip,
} from "@/components/tbd";
import { useAppointment } from "@/hooks/query/useAppointments";
import { asRow } from "@/components/patient/home/homeData";
import { toReceptionVisit } from "@/components/receptionist/reception.logic";
import { RECEPTION_ROUTES, useReceptionLocation } from "@/components/receptionist/useReceptionDesk";

/** After a check-in: product rules v2, no vitals stage. */
const NEXT_STEPS = [
  { title: "Waiting in the queue", text: "The patient waits for the doctor in token order. Urgent patients may go first." },
  { title: "Called in", text: "Only the doctor calls the next patient. The patient app shows “You're next”." },
  { title: "Billing at the desk", text: "When the doctor completes the visit, collect the payment here." },
];

function CheckInSuccess() {
  const appointmentId = useSearchParams().get("id") ?? "";
  const { locationName } = useReceptionLocation();
  const { data, isPending, error, refetch } = useAppointment(appointmentId);
  const visit = useMemo(() => {
    const row = asRow(data);
    return row ? toReceptionVisit(row, Date.now()) : null;
  }, [data]);

  if (!appointmentId) {
    return (
      <Surface flush>
        <EmptyBlock
          icon={UserCheck}
          title="No check-in to show"
          description="Open the check-in list to check a patient in."
          action={
            <Button asChild size="md">
              <Link href={RECEPTION_ROUTES.checkIn}>Open check-in</Link>
            </Button>
          }
        />
      </Surface>
    );
  }
  if (isPending) return <SkeletonRows rows={3} />;
  if (error || !visit) {
    return (
      <Surface flush>
        <LoadError
          title="The appointment could not be loaded"
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      </Surface>
    );
  }

  const checkedIn = visit.stage === "checked_in" || visit.stage === "with_doctor";

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Surface as="section" aria-label="Check-in" className="gap-5">
        <div className="flex flex-wrap items-center gap-4">
          <IconBox icon={CheckCircle2} tone={checkedIn ? "mint" : "amber"} size={56} solid={checkedIn} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.6px] text-brand">
              {checkedIn ? "Check-in complete" : "Not checked in yet"}
            </span>
            <h2 className="m-0 text-xl font-extrabold text-ink">
              {checkedIn ? `${visit.patientName} is checked in` : `${visit.patientName} is not checked in`}
            </h2>
            <span className="text-[13px] text-ink-muted">
              {[visit.whenLabel, locationName, visit.checkedInLabel ? `checked in ${visit.checkedInLabel}` : ""]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
          {visit.tokenLabel ? (
            <div className="flex flex-col items-center rounded-2xl bg-mint-soft px-5 py-3">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.6px] text-brand-dark">Token</span>
              <span className="text-[28px] font-extrabold leading-tight text-brand-dark">{visit.tokenLabel}</span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-line px-4 py-3.5">
          <InitialsAvatar name={visit.patientName} size={42} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-bold text-ink">{visit.patientName}</span>
            <span className="truncate text-xs text-ink-muted">{visit.patientPhone || "No phone"}</span>
          </div>
          <VisitTypeChip type="IN_PERSON" variant="chip" />
          <Pill tone={visit.statusTone}>{visit.statusLabel}</Pill>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FactTile label="Doctor" value={visit.doctorName} />
          <FactTile label="Slot" value={visit.whenLabel} />
          <FactTile label="Location" value={locationName} />
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button asChild size="md">
            <Link href={RECEPTION_ROUTES.queue}>
              <ListOrdered aria-hidden="true" /> Next: open queue
            </Link>
          </Button>
          <Button asChild variant="outline" size="md">
            <Link href={RECEPTION_ROUTES.checkIn}>Check in another</Link>
          </Button>
        </div>
      </Surface>

      <Surface as="aside" aria-label="What happens next">
        <SectionTitle title="What happens next" />
        <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
          {NEXT_STEPS.map((step, index) => (
            <li key={step.title} className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-mint text-xs font-extrabold text-brand-dark">
                {index + 1}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-ink">{step.title}</span>
                <span className="text-[13px] text-ink-muted">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </Surface>
    </div>
  );
}

/** RecCheckInSuccess: the confirmation after a desk check-in (`?id=<appointmentId>`). */
export default function ReceptionCheckInSuccessPage() {
  return (
    <TbdPage title="Checked in" backHref={RECEPTION_ROUTES.checkIn} backLabel="Check-in">
      <Suspense fallback={<SkeletonRows rows={3} />}>
        <CheckInSuccess />
      </Suspense>
    </TbdPage>
  );
}
