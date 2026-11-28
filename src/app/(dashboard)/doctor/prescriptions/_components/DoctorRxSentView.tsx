"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, CheckCircle2, ClipboardCheck, FlaskConical, PackageCheck, Printer, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBox, Pill, SectionTitle, SoftCard, Surface, TbdPage } from "@/components/tbd";
import { useDoctorVisit } from "@/components/doctor/visit/useDoctorVisit";
import { dispenseHref, followUpHref, rxHref, visitHref } from "@/components/doctor/visit/visit-routes";
import { isVisitCompleted } from "@/components/doctor/visit/visit-flow.logic";
import { formatClock } from "@/app/(dashboard)/doctor/dashboard/_components/doctor-dashboard.logic";
import type { DoctorPrescriptionDetail } from "./doctor-prescriptions.logic";
import { RxLinesTable } from "./RxLinesTable";
import { RxGate } from "./DoctorRxDetailView";
import { useDoctorPrescriptionDetail } from "./useDoctorPrescriptionDetail";
import { plural } from "@/lib/utils/labels";

function DeliveryRow({ icon, title, detail, tag }: { icon: typeof Send; title: string; detail: string; tag: { tone: "green" | "amber" | "slate"; label: string } }) {
  return (
    <li className="flex items-center gap-3 border-b border-hair py-3 last:border-b-0">
      <IconBox icon={icon} size={36} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-bold text-ink">{title}</span>
        <span className="text-xs text-ink-muted">{detail}</span>
      </span>
      <Pill tone={tag.tone}>{tag.label}</Pill>
    </li>
  );
}

function SentBody({ rx, appointmentId }: { rx: DoctorPrescriptionDetail; appointmentId: string }) {
  const visit = useDoctorVisit(appointmentId);
  const router = useRouter();
  const visitDone = isVisitCompleted(String(visit.appointment?.statusEnum ?? ""));
  const next = visit.waitingLines[0] ?? null;
  const dispensed = rx.lines.some((line) => line.dispensedQuantity > 0) || visit.todaysDispenses.length > 0;

  const callNext = async () => {
    if (!next) return;
    try {
      await visit.callPatient(next.appointmentId);
      router.push(visitHref(next.appointmentId));
    } catch {
      // The mutation hook shows the error.
    }
  };

  return (
    <>
      <SoftCard className="flex flex-wrap items-center gap-4">
        <IconBox icon={CheckCircle2} size={52} solid />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="m-0 text-xl font-extrabold text-ink">Prescription sent to the pharmacy</h2>
          <p className="m-0 text-sm text-ink-muted">
            {rx.reference} · {rx.patientName}
            {visit.token ? ` · ${visit.token}` : ""} · {plural(rx.lines.length, "medicine")} · {formatClock(rx.approvedAt || rx.date)}
          </p>
        </div>
        <Button variant="outline" size="md" asChild>
          <Link href={rxHref(rx.id)}>View prescription</Link>
        </Button>
      </SoftCard>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <Surface>
            <SectionTitle title="Delivery" />
            <ul className="m-0 flex list-none flex-col p-0">
              <DeliveryRow
                icon={Send}
                title="With the pharmacy"
                detail={rx.pharmacy?.label ?? "Waiting at the medicine desk"}
                tag={{ tone: "green", label: "Sent" }}
              />
              <DeliveryRow
                icon={PackageCheck}
                title="Medicines for hand-over"
                detail={`${plural(rx.lines.length, "item")} · clinic stock · record goes to billing automatically`}
                tag={dispensed ? { tone: "green", label: "Dispensed" } : { tone: "amber", label: "Not dispensed yet" }}
              />
              <DeliveryRow
                icon={ClipboardCheck}
                title={`Saved to the patient record${visit.opdNumber ? ` and OPD ${visit.opdNumber}` : ""}`}
                detail={rx.diagnosis ? `Diagnosis: ${rx.diagnosis}` : "Diagnosis not recorded"}
                tag={{ tone: "green", label: "Saved" }}
              />
            </ul>
          </Surface>
          <Surface>
            <SectionTitle title="Also for this patient" />
            <div className="flex flex-wrap gap-2.5">
              {appointmentId && !visitDone ? (
                <Button variant="outline" size="md" asChild>
                  <Link href={followUpHref(appointmentId)}>
                    <CalendarPlus aria-hidden="true" />
                    Book follow-up
                  </Link>
                </Button>
              ) : null}
              <Button variant="outline" size="md" asChild>
                <Link href={`/doctor/investigations?patientId=${encodeURIComponent(rx.patientId)}`}>
                  <FlaskConical aria-hidden="true" />
                  Order investigations
                </Link>
              </Button>
              <Button variant="outline" size="md" asChild>
                <Link href={rxHref(rx.id, "print")}>
                  <Printer aria-hidden="true" />
                  Print
                </Link>
              </Button>
            </div>
          </Surface>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Surface>
            <SectionTitle title="What next" />
            <Button variant={dispensed ? "outline" : "default"} size="md" asChild>
              <Link
                href={dispenseHref({
                  patientId: rx.patientId,
                  prescriptionId: rx.id,
                  ...(appointmentId ? { appointmentId } : {}),
                })}
              >
                Dispense medicines
              </Link>
            </Button>
            {appointmentId && visit.appointment && !visitDone ? (
              <Button size="md" asChild>
                <Link href={visitHref(appointmentId, "complete")}>Complete visit</Link>
              </Button>
            ) : null}
            {next ? (
              <Button variant="outline" size="md" disabled={!visitDone || visit.callPending} onClick={() => void callNext()}>
                Call next patient · {next.patientName}
              </Button>
            ) : null}
            <p className="m-0 text-xs text-ink-muted">Only you complete the visit. Billing is handled by reception afterwards.</p>
          </Surface>
          <Surface>
            <SectionTitle title="Prescription" />
            <RxLinesTable lines={rx.lines} variant="compact" />
          </Surface>
        </div>
      </div>
    </>
  );
}

/** DocRxSent: the prescription is with the pharmacy; dispense, complete or call the next patient. */
export function DoctorRxSentView({ prescriptionId, appointmentId }: { prescriptionId: string; appointmentId: string }) {
  const state = useDoctorPrescriptionDetail(prescriptionId);
  return (
    <TbdPage
      title="Prescription sent"
      {...(appointmentId ? { backHref: visitHref(appointmentId), backLabel: "Back to visit" } : { backHref: "/doctor/prescriptions", backLabel: "Prescriptions" })}
    >
      <RxGate state={state}>{(rx) => <SentBody rx={rx} appointmentId={appointmentId || rx.appointmentId} />}</RxGate>
    </TbdPage>
  );
}
