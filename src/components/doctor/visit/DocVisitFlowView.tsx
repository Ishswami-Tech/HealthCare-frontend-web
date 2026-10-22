"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardList, FilePenLine, FlaskConical, PackageCheck, Play, Printer, Stethoscope, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyBlock, Note, Pill, SectionTitle, Surface, TbdPage } from "@/components/tbd";
import { QuickPrescriptionModal } from "@/components/doctor/QuickPrescriptionModal";
import { buildVideoSessionRoute } from "@/lib/utils/video-session-route";
import { dispenseItemsLabel } from "@/lib/dispense/direct-dispense";
import { formatClock } from "@/app/(dashboard)/doctor/dashboard/_components/doctor-dashboard.logic";
import { RxLinesTable } from "@/app/(dashboard)/doctor/prescriptions/_components/RxLinesTable";
import { useDoctorVisit, type DoctorVisitData } from "./useDoctorVisit";
import { VisitGate, VisitPatientCard, VisitQueueCard, VisitStageList } from "./VisitParts";
import { diagnosisHref, dispenseHref, investigationsHref, rxHref, visitHref } from "./visit-routes";

/** The one action card: what the doctor does next with this visit. */
function NextActionCard({ visit, onPrescribe }: { visit: DoctorVisitData; onPrescribe: () => void }) {
  const id = visit.appointment?.id ?? "";
  const queueStatus = String(visit.queueEntry?.status ?? "").toUpperCase();
  const alreadyCalled = queueStatus === "CALLED" || queueStatus === "IN_PROGRESS";

  switch (visit.nextAction) {
    case "WAIT_CHECK_IN":
      return (
        <Note tone="amber">
          <strong>Not checked in yet.</strong> You consult only patients who have checked in at the clinic (QR scan at the
          booked location, or check-in at the front desk). The visit joins your queue as soon as they do.
        </Note>
      );
    case "START":
      return (
        <ActionShell description="The patient is checked in and waiting. Call them in, then start the consult.">
          {visit.queueEntry ? (
            <Button
              variant="outline"
              size="md"
              disabled={alreadyCalled || visit.callPending}
              onClick={() => void visit.callPatient(id).catch(() => undefined)}
            >
              {alreadyCalled ? "Patient called" : "Call patient"}
            </Button>
          ) : null}
          {/* Calling the patient in already starts the consult (IN_PROGRESS), so no second start. */}
          {queueStatus === "IN_PROGRESS" ? null : (
            <Button size="md" disabled={visit.startPending} onClick={() => void visit.startConsult().catch(() => undefined)}>
              <Play aria-hidden="true" />
              Start consult
            </Button>
          )}
        </ActionShell>
      );
    case "JOIN_VIDEO":
      return (
        <ActionShell description="Video visits have no queue. The room opens 15 minutes before the slot.">
          <Button variant="action" size="md" asChild>
            <Link href={buildVideoSessionRoute(id)}>
              <Video aria-hidden="true" />
              Join video visit
            </Link>
          </Button>
        </ActionShell>
      );
    case "PRESCRIBE":
      return (
        <ActionShell description="Review the case sheet, then write the prescription. Saving it sends the medicines to the pharmacy and completes the visit.">
          <Button variant="outline" size="md" asChild>
            <Link href={visitHref(id, "summary")}>
              <ClipboardList aria-hidden="true" />
              Review case sheet
            </Link>
          </Button>
          <Button variant="outline" size="md" asChild>
            <Link href={diagnosisHref(id, visit.patientId)}>
              <Stethoscope aria-hidden="true" />
              Diagnosis
            </Link>
          </Button>
          <Button variant="outline" size="md" asChild>
            <Link href={investigationsHref(id, visit.patientId)}>
              <FlaskConical aria-hidden="true" />
              Order tests
            </Link>
          </Button>
          <Button variant="outline" size="md" asChild>
            <Link href={visitHref(id, "complete")}>Complete without medicines</Link>
          </Button>
          <Button size="md" onClick={onPrescribe}>
            <FilePenLine aria-hidden="true" />
            Write prescription
          </Button>
        </ActionShell>
      );
    case "COMPLETE":
      return (
        <ActionShell description="The prescription is with the pharmacy. Hand over any medicines from clinic stock, then complete the visit.">
          <Button variant="outline" size="md" asChild>
            <Link
              href={dispenseHref({
                patientId: visit.patientId,
                appointmentId: id,
                ...(visit.prescription ? { prescriptionId: visit.prescription.id } : {}),
              })}
            >
              <PackageCheck aria-hidden="true" />
              Dispense from stock
            </Link>
          </Button>
          <Button size="md" asChild>
            <Link href={visitHref(id, "complete")}>Complete visit</Link>
          </Button>
        </ActionShell>
      );
    case "DONE":
      return (
        <Note tone="green">
          <strong>Visit completed.</strong> Billing is handled by reception. Call the next checked-in patient from the queue.
        </Note>
      );
    default:
      return <Note tone="rose">This visit was cancelled, missed or has expired. Nothing more can be done here.</Note>;
  }
}

function ActionShell({ description, children }: { description: string; children: ReactNode }) {
  return (
    <Surface className="border-l-4 border-l-[#047857]">
      <SectionTitle title="Your next action" description={description} />
      <div className="flex flex-wrap items-center justify-end gap-2.5">{children}</div>
      <p className="m-0 text-xs text-ink-muted">Only you can call the patient, start and complete the visit.</p>
    </Surface>
  );
}

function PrescriptionCard({ visit, onPrescribe }: { visit: DoctorVisitData; onPrescribe: () => void }) {
  const rx = visit.prescription;
  const canWrite = visit.nextAction === "PRESCRIBE";
  if (!rx) {
    return (
      <Surface flush>
        <div className="px-5 pt-5">
          <SectionTitle
            title="Prescription"
            icon={Stethoscope}
            action={
              <Link href="/doctor/drafts" className="text-[13px] font-bold text-brand hover:underline">
                Drafts from the assistant
              </Link>
            }
          />
        </div>
        <EmptyBlock
          title="No prescription yet"
          description="A prescription the assistant drafts for this patient waits for your approval in Rx drafts."
          action={canWrite ? <Button onClick={onPrescribe}>Write prescription</Button> : undefined}
        />
      </Surface>
    );
  }
  return (
    <Surface>
      <SectionTitle
        title="Prescription"
        icon={Stethoscope}
        description={`${rx.reference} · written ${formatClock(rx.date)}`}
        action={
          <>
            {rx.pharmacy ? <Pill tone={rx.pharmacy.tone}>Pharmacy: {rx.pharmacy.label}</Pill> : null}
            <Button variant="outline" size="compact" asChild>
              <Link href={rxHref(rx.id, "print")}>
                <Printer aria-hidden="true" />
                Print
              </Link>
            </Button>
          </>
        }
      />
      {rx.diagnosis ? (
        <p className="m-0 text-sm text-ink">
          <span className="text-xs font-bold text-ink-muted">Diagnosis </span>
          {rx.diagnosis}
        </p>
      ) : null}
      <RxLinesTable lines={rx.lines} variant="compact" />
      <Link href={rxHref(rx.id)} className="self-start text-[13px] font-bold text-brand hover:underline">
        Open prescription
      </Link>
    </Surface>
  );
}

function DispensingCard({ visit }: { visit: DoctorVisitData }) {
  const id = visit.appointment?.id ?? "";
  return (
    <Surface>
      <SectionTitle
        title="Dispensing"
        icon={PackageCheck}
        action={<Pill tone={visit.todaysDispenses.length ? "green" : "slate"}>{visit.todaysDispenses.length ? "Handed over" : "Not started"}</Pill>}
      />
      {visit.todaysDispenses.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {visit.todaysDispenses.map((row) => (
            <li key={row.id} className="text-[13px] text-ink">
              <span className="font-bold">{formatClock(row.createdAt)}</span> · {dispenseItemsLabel(row.items)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 text-[13px] text-ink-muted">
          Hand over medicines from clinic stock if needed. Stock counts only; the record goes to billing automatically.
        </p>
      )}
      <Button variant="soft" asChild>
        <Link
          href={dispenseHref({
            patientId: visit.patientId,
            appointmentId: id,
            ...(visit.prescription ? { prescriptionId: visit.prescription.id } : {}),
          })}
        >
          Open dispensing
        </Link>
      </Button>
    </Surface>
  );
}

/** DocVisitFlow: one in-clinic (or video) visit from check-in to completion. */
export function DocVisitFlowView({ appointmentId }: { appointmentId: string }) {
  const visit = useDoctorVisit(appointmentId);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prescribing, setPrescribing] = useState(() => searchParams.get("prescribe") === "1");
  const appointment = visit.appointment;
  const canPrescribe = visit.nextAction === "PRESCRIBE" && Boolean(visit.doctorEntityId);
  const current = visit.nextAction === "START" || visit.nextAction === "PRESCRIBE" || visit.nextAction === "COMPLETE";

  const callNext = async (nextAppointmentId: string) => {
    try {
      await visit.callPatient(nextAppointmentId);
      router.push(visitHref(nextAppointmentId));
    } catch {
      // The mutation hook shows the error.
    }
  };

  return (
    <TbdPage
      title={visit.token ? `Visit ${visit.token}` : "Visit"}
      description="Checked in → with you → prescription → dispensing → completed"
      backHref="/queue"
      backLabel="Queue"
    >
      <VisitGate visit={visit}>
        <VisitPatientCard visit={visit} />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-5">
            <NextActionCard visit={visit} onPrescribe={() => setPrescribing(true)} />
            <PrescriptionCard visit={visit} onPrescribe={() => setPrescribing(true)} />
          </div>
          <div className="flex min-w-0 flex-col gap-5">
            <Surface>
              <SectionTitle title="Visit progress" />
              <VisitStageList stages={visit.stages} />
            </Surface>
            {appointment && !appointment.isVideo ? <DispensingCard visit={visit} /> : null}
            {appointment && !appointment.isVideo ? (
              <VisitQueueCard
                lines={visit.waitingLines}
                canCall={!current}
                callPending={visit.callPending}
                onCall={(line) => void callNext(line.appointmentId)}
                {...(visit.locationName ? { locationName: visit.locationName } : {})}
              />
            ) : null}
          </div>
        </div>
      </VisitGate>

      {prescribing && canPrescribe && appointment ? (
        <QuickPrescriptionModal
          isOpen
          onClose={() => setPrescribing(false)}
          appointmentId={appointment.id}
          patientId={visit.patientId}
          patientName={appointment.patientName}
          doctorId={visit.doctorEntityId}
          visitStatus={appointment.statusEnum}
          visitLabel={`${appointment.isVideo ? "Video" : "In-clinic"} · ${appointment.timeLabel}`}
          {...(appointment.patientMeta ? { patientSummary: appointment.patientMeta } : {})}
          onSaved={(result) => {
            setPrescribing(false);
            router.push(
              result.prescriptionId
                ? rxHref(result.prescriptionId, "sent", new URLSearchParams({ appointmentId: appointment.id }).toString())
                : visitHref(appointment.id),
            );
          }}
        />
      ) : null}
    </TbdPage>
  );
}
