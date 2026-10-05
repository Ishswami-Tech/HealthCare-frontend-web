"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, AlertCircle, Ban, CheckCircle2, Clock, Download, FileText, Loader2, Share2 } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { EmptyBlock, IconBox, Kv, PageHead, Surface } from "@/components/tbd";
import { invoiceNumberLabel, invoiceOrderId, paymentMethodLabel } from "@/components/billing/staff/billing.logic";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Invoice } from "@/types/billing.types";
import type { RenderInvoicePay } from "./BillingOverviewCards";
import {
  BILLING_ROUTE,
  HELP_ROUTE,
  formatAmountExact,
  formatDate,
  formatDateTime,
  invoiceDiscount,
  invoiceIssuedAt,
  invoiceLines,
  invoicePaidAt,
  invoiceTax,
  invoiceTotal,
  isPaidInvoice,
  isPayableInvoice,
  type InvoicePaymentInfo,
} from "./patientBilling.logic";

export type PatientInvoiceState = "loading" | "ready" | "missing" | "error";

export interface PatientInvoiceViewProps {
  state: PatientInvoiceState;
  invoice?: Invoice | undefined;
  /** The patient's name. */
  billedTo: string;
  /** How the invoice was paid, when it is paid and the payment is known. */
  payment: InvoicePaymentInfo | null;
  /** The pay control for a pending invoice (the container supplies the real payment button). */
  renderPay: RenderInvoicePay;
  onDownloadPdf: (invoiceId: string) => void;
  downloadingPdf: boolean;
  onShare: () => void;
  onRetry: () => void;
}

const STAMPS = {
  PAID: { text: "Paid", className: "border-[#047857] text-[#047857] dark:border-emerald-400 dark:text-emerald-300" },
  PENDING: { text: "Due", className: "border-[#b45309] text-[#b45309] dark:border-amber-400 dark:text-amber-300" },
  VOID: { text: "Void", className: "border-[#64748b] text-[#64748b] dark:border-slate-400 dark:text-slate-300" },
} as const;

function Shell({ actions, children }: { actions?: ReactNode; children: ReactNode }) {
  return (
    <DashboardPageShell className="mx-auto max-w-[720px]">
      <PageHead backHref={BILLING_ROUTE} backLabel="Billing & Payments" title="Invoice" actions={actions} />
      {children}
    </DashboardPageShell>
  );
}

/** One invoice: header with the amount, who and what, the lines, the total and how it was paid. Props only. */
export function PatientInvoiceView({
  state,
  invoice,
  billedTo,
  payment,
  renderPay,
  onDownloadPdf,
  downloadingPdf,
  onShare,
  onRetry,
}: PatientInvoiceViewProps) {
  if (state === "loading") {
    return (
      <Shell>
        <Surface flush className="rounded-[24px]" aria-busy="true" aria-label="Loading invoice">
          <div className="flex flex-col gap-4 bg-mint-soft px-6 py-7 sm:px-8">
            <Skeleton className="h-9 w-44 rounded-xl" />
            <Skeleton className="h-9 w-40 rounded-lg" />
            <Skeleton className="h-3.5 w-48 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-4 px-6 py-[22px] sm:grid-cols-4 sm:px-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-9 rounded-lg" />
            ))}
          </div>
          <div className="flex flex-col gap-3.5 px-6 pb-8 sm:px-8">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-6 w-full rounded" />
          </div>
        </Surface>
      </Shell>
    );
  }

  if (state === "error") {
    return (
      <Shell>
        <Surface flush>
          <EmptyBlock
            icon={AlertCircle}
            tone="rose"
            title="This invoice could not be loaded"
            description="Check your connection and try again."
            action={
              <Button variant="outline" size="md" onClick={onRetry}>
                Try again
              </Button>
            }
          />
        </Surface>
      </Shell>
    );
  }

  if (state === "missing" || !invoice) {
    return (
      <Shell>
        <Surface flush>
          <EmptyBlock
            icon={FileText}
            tone="slate"
            title="Invoice not found"
            description="This invoice is not in your account, or it was cancelled."
            action={
              <Button size="md" asChild>
                <Link href={BILLING_ROUTE}>Back to Billing & Payments</Link>
              </Button>
            }
          />
        </Surface>
      </Shell>
    );
  }

  const paid = isPaidInvoice(invoice);
  const payable = isPayableInvoice(invoice);
  const currency = invoice.currency;
  const total = invoiceTotal(invoice);
  const tax = invoiceTax(invoice);
  const discount = invoiceDiscount(invoice);
  const lines = invoiceLines(invoice);
  const stamp = STAMPS[paid ? "PAID" : payable ? "PENDING" : "VOID"];
  const paidWhen = payment?.date ?? invoicePaidAt(invoice) ?? null;
  const method = payment?.method ? paymentMethodLabel(payment.method) : "";
  const number = invoiceNumberLabel(invoice);

  return (
    <Shell
      actions={
        <Button variant="outline" className="h-10" onClick={onShare}>
          <Share2 aria-hidden="true" />
          Share
        </Button>
      }
    >
      <article
        aria-label={`Invoice ${number}`}
        className="overflow-hidden rounded-[24px] bg-card text-card-foreground shadow-[0_10px_30px_rgba(15,27,45,0.08)] dark:border dark:border-border/70 dark:shadow-none"
      >
        <header className="tbd-hero !rounded-none !border-0 !shadow-none flex flex-col gap-4 px-6 py-7 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2.5">
              <span className="flex size-[38px] items-center justify-center rounded-xl bg-white dark:bg-white/10">
                <Activity className="size-5 text-brand" strokeWidth={2.4} aria-hidden="true" />
              </span>
              <span className="text-[17px] font-extrabold text-ink">TestByDoctor</span>
            </span>
            <span
              className={cn(
                "-rotate-6 rounded-[8px] border-2 px-3 py-1 text-[13px] font-extrabold uppercase tracking-[1px]",
                stamp.className,
              )}
            >
              {stamp.text}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] text-ink-muted">{paid ? "Amount paid" : payable ? "Amount due" : "Amount"}</span>
            <span className="text-[30px] font-extrabold leading-[1.2] tracking-[-0.5px] text-ink">
              {formatAmountExact(total, currency)}
            </span>
            <span className="text-[13px] text-ink-muted">
              {paid
                ? paidWhen
                  ? formatDateTime(paidWhen)
                  : "Paid"
                : payable
                  ? `Due ${formatDate(invoice.dueDate)}`
                  : `Issued ${formatDate(invoiceIssuedAt(invoice))}`}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4 px-6 py-[22px] sm:grid-cols-4 sm:px-8">
          <Kv label="Invoice no." value={<span className="break-words">{number}</span>} />
          <Kv label="Order ID" value={<span className="break-all">{invoiceOrderId(invoice)}</span>} />
          <Kv label="Billed to" value={<span className="break-words">{billedTo || invoice.patientName || "You"}</span>} />
          <Kv label="Issued" value={formatDate(invoiceIssuedAt(invoice))} />
        </div>

        <div className="mx-6 border-t-2 border-dashed border-line sm:mx-8" role="separator" />

        <div className="flex flex-col gap-3.5 px-6 py-[22px] text-sm text-ink sm:px-8">
          <ul className="m-0 flex list-none flex-col gap-3.5 p-0" aria-label="Items">
            {lines.map((line) => (
              <li key={line.key} className="flex justify-between gap-3">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="break-words font-bold">{line.description}</span>
                  {line.quantity !== 1 ? (
                    <span className="text-xs text-ink-muted">
                      Qty {line.quantity} × {formatAmountExact(line.unitPrice, currency)}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 font-bold">{formatAmountExact(line.total, currency)}</span>
              </li>
            ))}
          </ul>
          {discount > 0 ? (
            <div className="flex justify-between gap-3 font-semibold text-brand">
              <span>Discount</span>
              <span>−{formatAmountExact(discount, currency)}</span>
            </div>
          ) : null}
          {tax > 0 ? (
            <div className="flex justify-between gap-3 text-[13px] text-ink-muted">
              <span>Tax</span>
              <span>{formatAmountExact(tax, currency)}</span>
            </div>
          ) : null}
          <div className="flex justify-between gap-3 border-t border-hair pt-3.5 text-lg font-extrabold">
            <span>Total</span>
            <span>{formatAmountExact(total, currency)}</span>
          </div>
        </div>

        <div className="mx-6 mb-8 flex items-center gap-4 rounded-2xl bg-[#f8fafc] p-4 sm:mx-8 dark:bg-white/5">
          <IconBox
            icon={paid ? CheckCircle2 : payable ? Clock : Ban}
            tone={paid ? "mint" : payable ? "amber" : "slate"}
            size={48}
          />
          <div className="flex min-w-0 flex-col gap-[3px] text-[13px] text-ink-muted">
            <span className="text-sm font-bold text-ink">
              {paid ? (method && method !== "-" ? `Paid via ${method}` : "Paid") : payable ? "Not paid yet" : "This invoice was cancelled"}
            </span>
            {paid ? (
              <>
                {payment?.transactionId ? <span className="break-all">Txn ID {payment.transactionId}</span> : null}
                {paidWhen ? <span>{formatDateTime(paidWhen)}</span> : null}
              </>
            ) : payable ? (
              <span>Due {formatDate(invoice.dueDate)}</span>
            ) : (
              <span>No payment is needed.</span>
            )}
          </div>
        </div>
      </article>

      <div className="flex flex-wrap items-center gap-3">
        {payable ? renderPay(invoice, "page") : null}
        <Button
          variant={payable ? "outline" : "default"}
          size="md"
          onClick={() => onDownloadPdf(invoice.id)}
          disabled={downloadingPdf}
        >
          {downloadingPdf ? <Loader2 className="animate-spin" /> : <Download aria-hidden="true" />}
          Download PDF
        </Button>
        <span className="flex-1" />
        <Link
          href={HELP_ROUTE}
          className="inline-flex items-center gap-1 rounded-[8px] text-[13px] font-bold text-brand hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          Need help with this bill?
        </Link>
      </div>
    </Shell>
  );
}
