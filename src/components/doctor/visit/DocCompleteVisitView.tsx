"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, CheckCircle2, PackageCheck, Printer, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Kv, Note, Pill, SectionTitle, Surface, TbdPage } from "@/components/tbd";
import { useCompleteAppointment } from "@/hooks/query/useAppointments";
import { dispenseItemsLabel } from "@/lib/dispense/direct-dispense";
import { rxLineSummary } from "@/app/(dashboard)/doctor/prescriptions/_components/doctor-prescriptions.logic";
import { RxLinesTable } from "@/app/(dashboard)/doctor/prescriptions/_components/RxLinesTable";
import { useDoctorVisit } from "./useDoctorVisit";
import { VisitGate, VisitPatientCard } from "./VisitParts";
import { dispenseHref, followUpHref, rxHref, visitHref } from "./visit-routes";
import { isVisitClosed, isVisitCompleted, minutesBetween, shortDayLabel } from "./visit-flow.logic";

/** Longest text the complete-visit request keeps per field. */
const VISIT_TEXT_LIMIT = 4000;

/** DocCompleteVisit: confirm what is saved, then close the visit (doctor only); optionally call the next patient. */
export function DocCompleteVisitView({ appointmentId }: { appointmentId: string }) {
  const visit = useDoctorVisit(appointmentId);
  const router = useRouter();
  const searchParams = useSearchParams();
  const complete = useCompleteAppointment();
  const [printAfter, setPrintAfter] = useState(false);

  const followUpDate = searchParams.get("followUpDate") ?? "";
  const followUpTime = searchParams.get("followUpTime") ?? "";
  const appointment = visit.appointment;
  const rx = visit.prescription;
  const nextLine = visit.waitingLines[0] ?? null;
  const status = String(appointment?.statusEnum ?? "");
  const done = isVisitCompleted(status);
  const closed = isVisitClosed(status);
  const canComplete = Boolean(appointment) && !done && !closed && (appointment?.isVideo || Boolean(appointment?.checkedInAt));

  const submit = async (callNext: boolean) => {
    if (!appointment) return;
    const prescriptionText = (rx?.lines ?? [])
      .map((line) => [line.name, rxLineSummary(line)].filter(Boolean).join(" · "))
      .join("\n");
    try {
      await complete.mutateAsync({
        id: appointment.id,
        data: {
          ...(rx?.diagnosis ? { diagnosis: rx.diagnosis.slice(0, VISIT_TEXT_LIMIT) } : {}),
          ...(prescriptionText ? { prescription: prescriptionText.slice(0, VISIT_TEXT_LIMIT) } : {}),
          ...(followUpDate ? { followUpDate } : {}),
          metadata: {
            source: "doctor-visit-flow",
            prescriptionIssued: Boolean(rx),
            medicineSkipped: !rx,
            sentToPharmacy: Boolean(rx),
            ...(rx ? { pharmacyPrescriptionReference: rx.reference, prescriptionId: rx.id, pharmacyMedicineCount: rx.lines.length } : {}),
            directDispenseIds: visit.todaysDispenses.map((row) => row.id),
            ...(followUpDate ? { followUpDate, followUpTime } : {}),
          },
        },
      });
    } catch {
      return; // The mutation hook shows the error.
    }
    if (callNext && nextLine) {
      try {
        await visit.callPatient(nextLine.appointmentId);
        router.push(visitHref(nextLine.appointmentId));
        return;
      } catch {
        // Completed, but the call failed: stay on this visit (the hook showed the error).
      }
    }
    router.push(printAfter && rx ? rxHref(rx.id, "print") : visitHref(appointment.id));
  };

  return (
    <TbdPage title="Complete visit" backHref={visitHref(appointmentId)} backLabel="Back to visit">
      <VisitGate visit={visit}>
        <VisitPatientCard visit={visit} />
        {done ? (
          <Note tone="green" icon={CheckCircle2}>
            <strong>This visit is completed.</strong> Billing is handled by reception.
          </Note>
        ) : closed ? (
          <Note tone="rose">This visit was cancelled, missed or has expired and cannot be completed.</Note>
        ) : !canComplete ? (
          <Note tone="amber">The patient has not checked in, so the visit cannot be completed yet.</Note>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-5">
            <Surface>
              <SectionTitle
                title={`Complete visit · ${appointment?.patientName ?? ""}`}
                description={[
                  visit.token,
                  visit.opdNumber ? `OPD ${visit.opdNumber}` : "",
                  appointment?.startedAt ? `in consult ${minutesBetween(appointment.startedAt, Date.now())} min` : "",
                  visit.locationName,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
              <Kv label="Diagnosis" value={rx?.diagnosis || "Not recorded on a prescription"} />
            </Surface>

            <Surface>
              <SectionTitle
                title={rx ? `Prescription · ${rx.reference}` : "Prescription"}
                icon={Stethoscope}
                action={rx?.pharmacy ? <Pill tone={rx.pharmacy.tone}>Pharmacy: {rx.pharmacy.label}</Pill> : undefined}
              />
              {rx ? (
                <RxLinesTable lines={rx.lines} variant="compact" />
              ) : (
                <p className="m-0 text-sm text-ink-muted">
                  No prescription in this visit. Completing now closes the visit without medicines.
                </p>
              )}
            </Surface>

            <Surface>
              <SectionTitle
                title="Dispensed from clinic stock"
                icon={PackageCheck}
                action={
                  <Button variant="outline" size="compact" asChild>
                    <Link
                      href={dispenseHref({
                        patientId: visit.patientId,
                        appointmentId,
                        ...(rx ? { prescriptionId: rx.id } : {}),
                      })}
                    >
                      Dispense
                    </Link>
                  </Button>
                }
              />
              {visit.todaysDispenses.length > 0 ? (
                <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm text-ink">
                  {visit.todaysDispenses.map((row) => (
                    <li key={row.id}>{dispenseItemsLabel(row.items)}</li>
                  ))}
                </ul>
              ) : (
                <p className="m-0 text-sm text-ink-muted">Nothing handed over from stock in this visit.</p>
              )}
              <p className="m-0 text-xs text-ink-muted">Dispense records go to billing automatically.</p>
            </Surface>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <Surface>
              <SectionTitle
                title="Follow-up"
                icon={CalendarClock}
                action={
                  done ? undefined : (
                    <Link href={followUpHref(appointmentId)} className="text-[13px] font-bold text-brand hover:underline">
                      {followUpDate ? "Change" : "Book follow-up"}
                    </Link>
                  )
                }
              />
              <p className="m-0 text-sm text-ink">
                {followUpDate
                  ? `${shortDayLabel(followUpDate)}${followUpTime ? `, ${followUpTime}` : ""} · booked`
                  : "No follow-up booked"}
              </p>
            </Surface>

            {rx && !done ? (
              <Surface>
                <label className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 flex-col">
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-ink">
                      <Printer className="size-4 text-brand" aria-hidden="true" />
                      Print a copy after completing
                    </span>
                    <span className="text-xs text-ink-muted">Opens the print preview (A4 / A5)</span>
                  </span>
                  <Switch checked={printAfter} onCheckedChange={setPrintAfter} aria-label="Print a copy after completing" />
                </label>
              </Surface>
            ) : null}

            <Surface>
              <p className="m-0 text-xs text-ink-muted">
                Billing is handled by reception once the visit is completed.
                {nextLine ? ` Next in line: ${nextLine.patientName}.` : ""}
              </p>
              {canComplete ? (
                <>
                  {nextLine ? (
                    <Button size="xl" disabled={complete.isPending || visit.callPending} onClick={() => void submit(true)}>
                      Complete visit &amp; call {nextLine.patientName}
                    </Button>
                  ) : null}
                  <Button
                    size={nextLine ? "md" : "xl"}
                    variant={nextLine ? "outline" : "default"}
                    disabled={complete.isPending}
                    onClick={() => void submit(false)}
                  >
                    Complete visit{nextLine ? " only" : ""}
                  </Button>
                </>
              ) : rx ? (
                <Button variant="outline" size="md" asChild>
                  <Link href={rxHref(rx.id, "print")}>Print prescription</Link>
                </Button>
              ) : null}
              <Button variant="ghost" size="md" asChild>
                <Link href={visitHref(appointmentId)}>Back to visit</Link>
              </Button>
            </Surface>
          </div>
        </div>
      </VisitGate>
    </TbdPage>
  );
}
