"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, Download, Pencil, Printer, Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InitialsAvatar,
  Kv,
  LoadError,
  Note,
  Pill,
  SectionTitle,
  SkeletonRows,
  Surface,
  TbdPage,
  statusLabel,
  statusTone,
} from "@/components/tbd";
import { rxHref } from "@/components/doctor/visit/visit-routes";
import { formatClock } from "@/app/(dashboard)/doctor/dashboard/_components/doctor-dashboard.logic";
import {
  isFullyDispensed,
  prescriptionDateLabel,
  type DoctorPrescriptionDetail,
} from "./doctor-prescriptions.logic";
import { RxLinesTable } from "./RxLinesTable";
import { useDoctorPrescriptionDetail } from "./useDoctorPrescriptionDetail";
import { showErrorToast } from "@/hooks/utils/use-toast";
import { downloadPrescriptionPdf } from "@/lib/utils/prescription-pdf-download";
import { plural } from "@/lib/utils/labels";

/** Avatar, name, status and the one line of facts at the top of the prescription screens. */
export function RxPatientHeader({ rx, actions }: { rx: DoctorPrescriptionDetail; actions?: ReactNode }) {
  const facts = [rx.patientMeta, rx.locationName, prescriptionDateLabel(rx.date), rx.diagnosis].filter(Boolean).join(" · ");
  return (
    <Surface className="gap-4 md:flex-row md:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <InitialsAvatar name={rx.patientName} size={48} />
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="m-0 text-lg font-extrabold text-ink">{rx.patientName}</h2>
            <Pill tone={statusTone(rx.status)}>{statusLabel(rx.status)}</Pill>
            {rx.pharmacy ? <Pill tone={rx.pharmacy.tone}>Pharmacy: {rx.pharmacy.label}</Pill> : null}
          </div>
          <p className="m-0 text-[13px] text-ink-muted">
            <span className="font-bold text-ink">{rx.reference}</span>
            {facts ? ` · ${facts}` : ""}
          </p>
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </Surface>
  );
}

/** Loading / error frame shared by the prescription screens. */
export function RxGate({
  state,
  children,
}: {
  state: ReturnType<typeof useDoctorPrescriptionDetail>;
  children: (rx: DoctorPrescriptionDetail) => ReactNode;
}) {
  if (state.loading) {
    return (
      <Surface flush aria-busy="true">
        <SkeletonRows rows={4} />
      </Surface>
    );
  }
  if (!state.detail) {
    return (
      <Surface flush>
        <LoadError
          title="This prescription could not be loaded"
          message={state.error ? "Check the connection and try again." : "It was not found in this clinic."}
          onRetry={state.retry}
        />
      </Surface>
    );
  }
  return <>{children(state.detail)}</>;
}

/** "New prescription" route of B6, pre-filled from this one (repeat). */
const repeatHref = (rx: DoctorPrescriptionDetail) =>
  `/doctor/prescriptions/new?${new URLSearchParams({ patientId: rx.patientId, repeatFrom: rx.id }).toString()}`;

function HistoryCard({ rx }: { rx: DoctorPrescriptionDetail }) {
  const handedOver = rx.lines.filter((line) => line.dispensedQuantity > 0).length;
  const events = [
    { label: rx.approvedAt ? "Approved and sent" : "Written and sent to the pharmacy", at: rx.approvedAt || rx.date },
    ...(handedOver > 0
      ? [{ label: `Medicines handed over · ${handedOver} of ${plural(rx.lines.length, "item")}`, at: "" }]
      : []),
  ];
  return (
    <Surface>
      <SectionTitle title="History of this prescription" />
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {events.map((event) => (
          <li key={event.label} className="flex items-baseline justify-between gap-3 text-sm text-ink">
            <span className="font-semibold">{event.label}</span>
            {event.at ? (
              <span className="shrink-0 text-xs text-ink-muted">
                {prescriptionDateLabel(event.at)} {formatClock(event.at)}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      {rx.draftedByName ? <p className="m-0 text-xs text-ink-muted">Prepared by {rx.draftedByName}</p> : null}
    </Surface>
  );
}

/** DocRxDetail: one prescription, read-only, with reprint, edit and prescribe again. */
export function DoctorRxDetailView({ prescriptionId }: { prescriptionId: string }) {
  const state = useDoctorPrescriptionDetail(prescriptionId);
  return (
    <TbdPage title="Prescription" backHref="/doctor/prescriptions" backLabel="Prescriptions">
      <RxGate state={state}>
        {(rx) => (
          <>
            <RxPatientHeader
              rx={rx}
              actions={
                <>
                  <Button variant="outline" size="md" asChild>
                    <Link href={rxHref(rx.id, "print")}>
                      <Printer aria-hidden="true" />
                      Reprint
                    </Link>
                  </Button>
                  {rx.pdfUrl ? (
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => {
                        const pdfUrl = rx.pdfUrl;
                        if (!pdfUrl) return;
                        void downloadPrescriptionPdf(pdfUrl, { reference: rx.reference, patientName: rx.patientName }).catch(
                          (error: unknown) => {
                            showErrorToast(error instanceof Error ? error.message : "The prescription PDF could not be downloaded.");
                          },
                        );
                      }}
                    >
                      <Download aria-hidden="true" />
                      PDF
                    </Button>
                  ) : null}
                  {!isFullyDispensed(rx) && rx.status === "active" ? (
                    <Button variant="outline" size="md" asChild>
                      <Link href={`/doctor/prescriptions/${encodeURIComponent(rx.id)}/edit`}>
                        <Pencil aria-hidden="true" />
                        Edit
                      </Link>
                    </Button>
                  ) : null}
                  <Button size="md" asChild>
                    <Link href={repeatHref(rx)}>
                      <Repeat2 aria-hidden="true" />
                      Prescribe again
                    </Link>
                  </Button>
                </>
              }
            />
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
              <div className="flex min-w-0 flex-col gap-5">
                <Surface flush>
                  <div className="px-5 pt-5">
                    <SectionTitle
                      title={`Medicines · ${rx.lines.length}`}
                      description={`Prescribed ${prescriptionDateLabel(rx.date)}, ${formatClock(rx.date)}${rx.doctorName ? ` by ${rx.doctorName}` : ""}`}
                    />
                  </div>
                  <RxLinesTable lines={rx.lines} className="mt-2" />
                </Surface>
                <Surface>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Kv label="Diagnosis" value={rx.diagnosis || "Not recorded"} />
                    <Kv label="Doctor's notes" value={rx.notes || "None"} strong={false} />
                  </div>
                </Surface>
                <HistoryCard rx={rx} />
              </div>
              <div className="flex min-w-0 flex-col gap-5">
                <Surface>
                  <SectionTitle title="Repeat this prescription" />
                  <p className="m-0 text-[13px] text-ink-muted">
                    Opens a new prescription with these medicines filled in. The allergy check runs again before it is sent.
                  </p>
                  <Button size="md" asChild>
                    <Link href={repeatHref(rx)}>Prescribe again · {plural(rx.lines.length, "medicine")}</Link>
                  </Button>
                </Surface>
                <Surface flush>
                  <div className="px-5 pt-5">
                    <SectionTitle title="Patient and record" />
                  </div>
                  <div className="flex flex-col px-5 pb-2">
                    {[
                      { label: "Open patient record", href: `/doctor/patients/${encodeURIComponent(rx.patientId)}` },
                      { label: `All prescriptions`, href: "/doctor/prescriptions" },
                    ].map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center justify-between border-b border-hair py-3 text-sm font-bold text-ink last:border-b-0 hover:text-brand-dark"
                      >
                        {link.label}
                        <ChevronRight className="size-4 text-ink-muted" aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                </Surface>
                <Note tone="blue">This sheet carries no fee or billing details. Dispensing is handled at the medicine desk.</Note>
              </div>
            </div>
          </>
        )}
      </RxGate>
    </TbdPage>
  );
}
