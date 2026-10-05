"use client";

import type { ReactNode } from "react";
import { FileText, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pill, statusLabel, statusTone } from "@/components/tbd";
import type { Invoice } from "@/types/billing.types";
import type { RenderPayAction } from "./BillingInvoicesTable";
import { formatBillingDate, formatRupees, invoiceOrderId } from "./billing.logic";

interface BillingInvoiceDialogProps {
  /** The invoice to show; null = closed. */
  invoice: Invoice | null;
  onClose: () => void;
  onOpenPdf: (invoice: Invoice) => void;
  openPdfPending?: boolean;
  /** Given only to roles that may send an invoice on WhatsApp. */
  onSendWhatsApp?: ((invoice: Invoice) => void) | undefined;
  sendWhatsAppPending?: boolean;
  /** The pay control for a pending invoice (the container supplies the real payment button). */
  renderPayAction?: RenderPayAction | undefined;
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-[14px] border border-line px-3.5 py-3">
      <dt className="text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted">{label}</dt>
      <dd className="m-0 flex min-h-6 items-center text-[15px] font-bold text-ink">{children}</dd>
    </div>
  );
}

/** Invoice details: who, how much, status, due date, the lines, and the PDF. Props only. */
export function BillingInvoiceDialog({
  invoice,
  onClose,
  onOpenPdf,
  openPdfPending = false,
  onSendWhatsApp,
  sendWhatsAppPending = false,
  renderPayAction,
}: BillingInvoiceDialogProps) {
  const payAction = invoice && invoice.status === "PENDING" && renderPayAction ? renderPayAction(invoice, "dialog") : null;

  return (
    <Dialog open={!!invoice} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[600px]">
        <DialogHeader className="gap-0.5 px-6 pt-[22px] pb-3.5 text-left">
          <DialogTitle>{invoice?.invoiceNumber ? `Invoice ${invoice.invoiceNumber}` : "Invoice Details"}</DialogTitle>
          <DialogDescription>{invoice ? `Order Id: ${invoiceOrderId(invoice)}` : "Invoice details"}</DialogDescription>
        </DialogHeader>

        {invoice ? (
          <>
            <div className="flex flex-col gap-4 overflow-y-auto px-6 pt-1 pb-5">
              <dl className="m-0 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Detail label="Patient">
                  <span className="truncate">{invoice.patientName || "Unknown"}</span>
                </Detail>
                <Detail label="Status">
                  <Pill tone={statusTone(invoice.status)}>{statusLabel(invoice.status)}</Pill>
                </Detail>
                <Detail label="Amount">{formatRupees(invoice.amount)}</Detail>
                <Detail label="Due Date">{formatBillingDate(invoice.dueDate)}</Detail>
              </dl>

              <section className="flex flex-col overflow-hidden rounded-[14px] border border-line" aria-labelledby="invoice-lines-title">
                <h3 id="invoice-lines-title" className="m-0 border-b border-hair px-4 py-3 text-sm font-bold text-ink">
                  Line Items
                </h3>
                {invoice.items.length > 0 ? (
                  <ul className="m-0 list-none p-0">
                    {invoice.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-4 border-b border-hair px-4 py-3 last:border-b-0"
                      >
                        <span className="flex min-w-0 flex-col gap-px">
                          <span className="text-sm font-semibold text-ink">{item.description}</span>
                          <span className="text-[13px] text-ink-muted">
                            Qty {item.quantity} x {formatRupees(item.unitPrice)}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-bold text-ink">{formatRupees(item.total)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="m-0 px-4 py-6 text-sm text-ink-muted">No line items available.</p>
                )}
              </section>
            </div>

            <div className="flex flex-col-reverse gap-2.5 border-t border-hair bg-[#f8fafc] px-6 py-3.5 sm:flex-row sm:justify-end dark:bg-white/5">
              {onSendWhatsApp ? (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => onSendWhatsApp(invoice)}
                  disabled={sendWhatsAppPending}
                >
                  <MessageCircle className="text-brand" />
                  WhatsApp
                </Button>
              ) : null}
              {/* One main button: the amber pay button when the invoice is pending, otherwise the PDF. */}
              <Button
                variant={payAction ? "outline" : "default"}
                size="md"
                onClick={() => onOpenPdf(invoice)}
                disabled={openPdfPending}
              >
                {openPdfPending ? <Loader2 className="animate-spin" /> : <FileText />}
                Open PDF
              </Button>
              {payAction}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
