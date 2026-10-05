"use client";

import type { ReactNode } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Divider, Note, Pill, SummaryLine, statusLabel, statusTone } from "@/components/tbd";
import {
  PHARMACY_STATE,
  canPay,
  dayLabel,
  formatRupees,
  type PatientPrescription,
} from "./patient-health.logic";

export interface PrescriptionDetailsDialogProps {
  prescription: PatientPrescription | null;
  onClose: () => void;
  /** The amber Pay button (the existing payment flow). Drawn only while an amount is due. */
  renderPay: (prescription: PatientPrescription, placement: "card" | "dialog") => ReactNode;
  /** Opens the bill PDF. Left out when the caller cannot download bills. */
  onDownloadBill?: (invoiceId: string) => void;
  downloadingBillId?: string | null;
}

/** One prescription in full: medicines with dose and schedule, the doctor's note, and what is due. */
export function PrescriptionDetailsDialog({
  prescription,
  onClose,
  renderPay,
  onDownloadBill,
  downloadingBillId = null,
}: PrescriptionDetailsDialogProps) {
  const state = prescription ? PHARMACY_STATE[prescription.state] : null;

  return (
    <Dialog open={prescription !== null} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[560px]">
        {prescription && state ? (
          <>
            <DialogHeader>
              <DialogTitle>{prescription.number}</DialogTitle>
              <DialogDescription>
                {[prescription.doctorName ? `Prescribed by ${prescription.doctorName}` : "", prescription.dateLabel]
                  .filter(Boolean)
                  .join(" · ") || "Prescription"}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={state.tone}>{state.label}</Pill>
                {prescription.queueLabel ? <Pill tone="slate">{prescription.queueLabel}</Pill> : null}
                {prescription.diagnosis ? (
                  <span className="text-[13px] text-ink-muted">For {prescription.diagnosis}</span>
                ) : null}
              </div>

              <section aria-label="Medicines" className="flex flex-col">
                <h3 className="m-0 text-[13px] font-bold text-ink-muted">Medicines</h3>
                {prescription.lines.length === 0 ? (
                  <p className="m-0 py-3 text-[13px] text-ink-muted">No medicines are listed on this prescription.</p>
                ) : (
                  <ul className="m-0 flex list-none flex-col p-0">
                    {prescription.lines.map((line) => (
                      <li key={line.id} className="flex flex-col gap-1 border-b border-hair py-3 last:border-b-0">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <span className="text-sm font-bold text-ink">{line.name}</span>
                          <span className="text-xs font-semibold text-ink-muted">{line.supplyLabel}</span>
                        </div>
                        <span className="text-[13px] text-ink">
                          {[line.dosage, line.frequency, line.duration].filter(Boolean).join(" · ") ||
                            "Follow your doctor's instructions"}
                        </span>
                        {line.instructions ? <span className="text-xs text-ink-muted">{line.instructions}</span> : null}
                        {line.category || line.description ? (
                          <span className="text-xs text-ink-muted">
                            {[line.category, line.description].filter(Boolean).join(" · ")}
                          </span>
                        ) : null}
                        {line.batches ? <span className="text-xs text-ink-muted">Batches: {line.batches}</span> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {prescription.notes ? (
                <Note tone="blue">
                  <span className="font-bold">Doctor&apos;s instructions.</span> {prescription.notes}
                </Note>
              ) : null}

              <div className="flex flex-col gap-2 rounded-2xl bg-well px-4 py-3.5">
                <SummaryLine label="Total" value={formatRupees(prescription.totalAmount)} />
                {prescription.paidAmount > 0 ? (
                  <SummaryLine label="Paid" value={formatRupees(prescription.paidAmount)} />
                ) : null}
                <SummaryLine
                  label="Payment"
                  value={<Pill tone={statusTone(prescription.paymentStatus)}>{statusLabel(prescription.paymentStatus)}</Pill>}
                />
                {prescription.validUntil ? (
                  <SummaryLine label="Valid until" value={dayLabel(prescription.validUntil)} />
                ) : null}
                {prescription.pendingAmount > 0 ? (
                  <>
                    <Divider />
                    <SummaryLine bold label="To pay" value={formatRupees(prescription.pendingAmount)} />
                  </>
                ) : null}
              </div>

              {canPay(prescription) ? (
                <p className="m-0 text-[13px] text-ink-muted">
                  Medicines are handed over after the payment is received.
                </p>
              ) : null}
            </div>

            <DialogFooter>
              <Button variant="outline" size="md" onClick={onClose}>
                Close
              </Button>
              {prescription.pdfUrl ? (
                <Button variant="outline" size="md" asChild>
                  <a href={prescription.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Download aria-hidden="true" />
                    Download prescription
                  </a>
                </Button>
              ) : null}
              {prescription.invoiceId && onDownloadBill ? (
                <Button
                  variant="outline"
                  size="md"
                  disabled={downloadingBillId === prescription.invoiceId}
                  onClick={() => {
                    if (prescription.invoiceId) onDownloadBill(prescription.invoiceId);
                  }}
                >
                  {downloadingBillId === prescription.invoiceId ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Download aria-hidden="true" />
                  )}
                  Download bill
                </Button>
              ) : null}
              {canPay(prescription) ? renderPay(prescription, "dialog") : null}
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
