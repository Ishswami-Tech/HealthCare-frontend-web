"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChoiceChip, Kv, Note, SectionTitle, Surface, TbdPage } from "@/components/tbd";
import { useClinic, useCurrentClinicId } from "@/hooks/query/useClinics";
import { dispenseHref, rxHref } from "@/components/doctor/visit/visit-routes";
import { formatClock } from "@/app/(dashboard)/doctor/dashboard/_components/doctor-dashboard.logic";
import { prescriptionDateLabel, type DoctorPrescriptionDetail } from "./doctor-prescriptions.logic";
import { RxGate } from "./DoctorRxDetailView";
import { useDoctorPrescriptionDetail } from "./useDoctorPrescriptionDetail";
import { showErrorToast } from "@/hooks/utils/use-toast";
import { downloadPrescriptionPdf } from "@/lib/utils/prescription-pdf-download";
import { plural } from "@/lib/utils/labels";

type Paper = "A4" | "A5";

const PAPER_OPTIONS: { value: Paper; label: string; size: string }[] = [
  { value: "A4", label: "A4", size: "210 × 297 mm" },
  { value: "A5", label: "A5", size: "148 × 210 mm" },
];

type Raw = Record<string, unknown>;
const asRecord = (value: unknown): Raw =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};
const asText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/** Clinic name, address and phone for the letterhead, from GET /clinics/:id. */
function letterhead(clinic: unknown): { name: string; address: string; phone: string; email: string } {
  const record = asRecord(asRecord(clinic).data ?? clinic);
  return {
    name: asText(record.name),
    address: asText(record.address),
    phone: asText(record.phone),
    email: asText(record.email),
  };
}

const DRAFT_CODES = new Set(["DRAFT", "RETURNED"]);

/** Advice lines: one per non-empty line, list markers stripped (same rule as the server PDF). */
function adviceLines(notes: string): string[] {
  return notes
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

function doctorTitle(name: string): string {
  const trimmed = name.trim() || "Doctor";
  return /^dr\.?\s/i.test(trimmed) ? trimmed : `Dr. ${trimmed}`;
}

/** Brand tile of the letterhead (same mark as the server-rendered PDF). */
function RxLogoTile() {
  return (
    <svg className="rx-logo" viewBox="0 0 46 46" aria-hidden="true">
      <rect width="46" height="46" rx="11" fill="currentColor" />
      <g transform="translate(6.8 8.1) scale(1.353)">
        <path
          d="M12 22 C 4 16 0 12 0 7 C 0 3 3 0 6.5 0 C 9 0 11 1.5 12 3.5 C 13 1.5 15 0 17.5 0 C 21 0 24 3 24 7 C 24 12 20 16 12 22 Z"
          fill="#ffffff"
        />
        <path
          d="M1 10 L7 10 L9.5 5.5 L13 15 L15.5 10 L23 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

function RxCell({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="rx-label">{label}</div>
      <div className={danger ? "font-bold text-[#dc2626]" : "font-bold"}>{value || "-"}</div>
    </div>
  );
}

/** The printable sheet (same layout as the server PDF). No fee or billing details, ever. */
function RxSheet({ rx, paper, clinic }: { rx: DoctorPrescriptionDetail; paper: Paper; clinic: ReturnType<typeof letterhead> }) {
  const draft = DRAFT_CODES.has(rx.statusCode.toUpperCase());
  const advice = adviceLines(rx.notes || "");
  return (
    <article id="rx-print-root" className="rx-sheet" data-paper={paper} data-draft={draft || undefined} aria-label="Prescription sheet">
      <header className="rx-keep flex flex-wrap items-start justify-between gap-4 pb-3">
        <div className="flex min-w-0 items-start gap-3">
          <RxLogoTile />
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="rx-clinic">{clinic.name || "Clinic"}</h1>
            {clinic.address ? <span className="text-[12px] text-[#64748b]">{clinic.address}</span> : null}
            {clinic.phone || clinic.email ? (
              <span className="text-[12px] text-[#64748b]">{[clinic.phone, clinic.email].filter(Boolean).join(" · ")}</span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5 text-right">
          <h2 className="text-[15px] font-extrabold">{rx.doctorName || "Doctor"}</h2>
          {rx.doctorQualification ? <span className="text-[12px] text-[#0f766e]">{rx.doctorQualification}</span> : null}
          {rx.doctorRegistration ? <span className="text-[12px] text-[#64748b]">Reg. No. {rx.doctorRegistration}</span> : null}
        </div>
      </header>
      <div className="rx-rule" />

      <section className="rx-keep mt-3 grid grid-cols-3 gap-x-6 gap-y-3 border-b border-[#e2e8f0] pb-3">
        <RxCell label="Patient" value={rx.patientName} />
        <RxCell label="Age / sex" value={rx.patientMeta} />
        <RxCell label="Date" value={prescriptionDateLabel(rx.date)} />
        <RxCell label="Patient ID" value={rx.patientUhid || rx.reference} />
      </section>

      {rx.diagnosis ? (
        <section className="rx-keep mt-3">
          <div className="rx-label">Diagnosis</div>
          <div className="font-bold">{rx.diagnosis}</div>
        </section>
      ) : null}

      <section className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="rx-symbol">Rx</span>
          <span className="rx-label">Medicines</span>
        </div>
        <table className="rx-table mt-1.5">
          <thead>
            <tr>
              <th>#</th>
              <th>Medicine</th>
              <th>Dose</th>
              <th>Freq.</th>
              <th>Duration</th>
              <th>Timing / instructions</th>
            </tr>
          </thead>
          <tbody>
            {rx.lines.map((line, index) => (
              <tr key={line.id}>
                <td className="text-[#64748b]">{index + 1}</td>
                <td>
                  <div className="font-bold">{line.name}</div>
                  {line.quantity ? <div className="text-[11px] text-[#64748b]">Qty {line.quantity}</div> : null}
                </td>
                <td>{line.dosage || "-"}</td>
                <td>{line.frequency || "-"}</td>
                <td>{line.duration || "-"}</td>
                <td>{line.instructions || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {advice.length ? (
        <section className="rx-keep mt-4">
          <div className="rx-label">Advice</div>
          <ul className="rx-bullets">
            {advice.map((line, index) => (
              <li key={`${index}-${line}`}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {rx.validUntil ? (
        <p className="rx-keep mt-3 text-[12px] font-bold text-[#64748b]">Valid until {prescriptionDateLabel(rx.validUntil)}</p>
      ) : null}

      <footer className="rx-keep mt-10 flex items-end justify-between gap-6">
        <span className="max-w-[300px] text-[11px] text-[#64748b]">
          {draft
            ? "Awaiting doctor approval."
            : `Issued ${prescriptionDateLabel(rx.approvedAt || rx.date)}, ${formatClock(rx.approvedAt || rx.date)}. The downloaded PDF carries a verification QR.`}
        </span>
        <span className="flex min-w-[200px] flex-col items-end text-right">
          <span className="text-[11px] text-[#64748b]">Prescribed by</span>
          <span className="font-bold">{doctorTitle(rx.doctorName)}</span>
          {rx.doctorQualification ? <span className="text-[11px] text-[#64748b]">{rx.doctorQualification}</span> : null}
        </span>
      </footer>
      <p className="rx-keep mt-3 text-center text-[11px] text-[#64748b]">
        This is a digitally generated prescription and does not require a signature.
      </p>
    </article>
  );
}

/** DocRxPrint: print preview with A4 / A5 choice; only the sheet goes to paper. */
export function DoctorRxPrintView({ prescriptionId }: { prescriptionId: string }) {
  const state = useDoctorPrescriptionDetail(prescriptionId);
  const clinicId = useCurrentClinicId() || "";
  const { data: clinic } = useClinic(clinicId);
  const [paper, setPaper] = useState<Paper>("A4");
  const head = letterhead(clinic);

  return (
    <TbdPage title="Print preview" backHref={rxHref(prescriptionId)} backLabel="Prescription">
      {/* The page size depends on the choice, so it cannot live in rx-print.css. */}
      <style>{`@media print { @page { size: ${paper}; margin: ${paper === "A4" ? "14mm" : "10mm"}; } }`}</style>
      <RxGate state={state}>
        {(rx) => (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 overflow-x-auto rounded-[20px] bg-well p-4 sm:p-6">
              <RxSheet rx={rx} paper={paper} clinic={head} />
            </div>
            <div className="no-print flex min-w-0 flex-col gap-5">
              <Surface>
                <SectionTitle title="Print options" />
                <div className="flex flex-col gap-2" role="group" aria-label="Paper size">
                  <span className="text-xs font-bold text-ink-soft">Paper size</span>
                  <div className="flex flex-wrap gap-2">
                    {PAPER_OPTIONS.map((option) => (
                      <ChoiceChip key={option.value} active={paper === option.value} onClick={() => setPaper(option.value)}>
                        {option.label} · {option.size}
                      </ChoiceChip>
                    ))}
                  </div>
                </div>
                <Button size="xl" onClick={() => window.print()}>
                  <Printer aria-hidden="true" />
                  Print
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
                    Download PDF
                  </Button>
                ) : null}
              </Surface>
              <Surface>
                <SectionTitle title="Next step" />
                <Button variant="soft" asChild>
                  <Link href={dispenseHref({ patientId: rx.patientId, prescriptionId: rx.id })}>Dispense from clinic stock</Link>
                </Button>
              </Surface>
              <Surface>
                <SectionTitle title="Prescription details" />
                <div className="grid grid-cols-2 gap-3">
                  {rx.draftedByName ? <Kv label="Prepared by" value={rx.draftedByName} /> : null}
                  <Kv label="Written" value={`${prescriptionDateLabel(rx.date)}, ${formatClock(rx.date)}`} />
                  <Kv label="Medicines" value={plural(rx.lines.length, "item")} />
                </div>
              </Surface>
              <Note tone="blue">The printed sheet carries no fee or billing details.</Note>
            </div>
          </div>
        )}
      </RxGate>
    </TbdPage>
  );
}
