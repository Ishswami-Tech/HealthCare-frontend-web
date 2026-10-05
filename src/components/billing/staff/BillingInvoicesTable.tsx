"use client";

import type { ReactNode } from "react";
import { AlertCircle, FileText, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CellTitle, EmptyBlock, InitialsAvatar, Pill, Surface, statusLabel, statusTone } from "@/components/tbd";
import { cn } from "@/lib/utils";
import type { Invoice } from "@/types/billing.types";
import { BillingPager, useBillingPaging } from "./BillingPager";
import { formatBillingDate, formatRupees, invoiceNumberLabel, invoiceOrderId } from "./billing.logic";

/**
 * One line per invoice on a wide card (invoice, patient, amount, status, actions).
 * On a narrow card the cells stack: number and status first, then patient and amount, then the buttons.
 * `@4xl` / `@5xl` are container widths, so the layout follows the card, not the window.
 */
const ROW_BASE = "grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 px-5";
const ROW_COLUMNS = {
  // View invoice + Pay
  basic: "@4xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)_80px_100px_264px] @4xl:items-center @4xl:gap-x-4",
  // ... plus Mark paid and WhatsApp for the roles that manage billing
  wide: "@5xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_80px_100px_400px] @5xl:items-center @5xl:gap-x-4",
} as const;
const AUTO = { basic: "@4xl:col-auto @4xl:row-auto", wide: "@5xl:col-auto @5xl:row-auto" } as const;
const HEAD = { basic: "@4xl:grid", wide: "@5xl:grid" } as const;
const ROW_HEIGHT = { basic: "@4xl:min-h-[76px] @4xl:py-2", wide: "@5xl:min-h-[76px] @5xl:py-2" } as const;

/** `placement` picks the button height: 36 px in a table row, 44 px in the dialog footer. */
export type RenderPayAction = (invoice: Invoice, placement: "row" | "dialog") => ReactNode;

export interface BillingInvoiceActions {
  onViewInvoice: (invoice: Invoice) => void;
  /** The pay control for a pending invoice (the container supplies the real payment button). */
  renderPayAction?: RenderPayAction | undefined;
  /** Given only to roles that may mark an invoice as paid. */
  onMarkPaid?: ((invoice: Invoice) => void) | undefined;
  markingPaidId?: string | null | undefined;
  markPaidPending?: boolean | undefined;
  /** Given only to roles that may send an invoice on WhatsApp. */
  onSendWhatsApp?: ((invoice: Invoice) => void) | undefined;
  sendWhatsAppPending?: boolean | undefined;
  /** True while an invoice PDF is being prepared. */
  viewDisabled?: boolean | undefined;
}

interface BillingInvoicesTableProps extends BillingInvoiceActions {
  invoices: Invoice[];
  /** Changes when the filters change; the table goes back to page 1. */
  resetKey: string;
  loading?: boolean;
  /** The list could not be loaded (the page shows the reason above). */
  failed?: boolean;
  /** True when a filter or search is narrowing the list (changes the empty text). */
  filtered?: boolean;
}

export function InvoiceRowActions({
  invoice,
  onViewInvoice,
  renderPayAction,
  onMarkPaid,
  markingPaidId,
  markPaidPending = false,
  onSendWhatsApp,
  sendWhatsAppPending = false,
  viewDisabled = false,
}: BillingInvoiceActions & { invoice: Invoice }) {
  const isPending = invoice.status === "PENDING";
  const number = invoiceNumberLabel(invoice);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        onClick={() => onViewInvoice(invoice)}
        disabled={viewDisabled}
        aria-label={`View invoice ${number}`}
      >
        <FileText />
        View Invoice
      </Button>
      {isPending && renderPayAction ? renderPayAction(invoice, "row") : null}
      {isPending && onMarkPaid ? (
        <Button
          variant="outline"
          onClick={() => onMarkPaid(invoice)}
          disabled={markingPaidId === invoice.id || markPaidPending}
          aria-label={`Mark invoice ${number} as paid`}
        >
          {markingPaidId === invoice.id ? "Marking..." : "Mark Paid"}
        </Button>
      ) : null}
      {onSendWhatsApp ? (
        <Button
          variant="outline"
          onClick={() => onSendWhatsApp(invoice)}
          disabled={sendWhatsAppPending}
          aria-label={`Send invoice ${number} on WhatsApp`}
        >
          <MessageCircle className="text-brand" />
          WhatsApp
        </Button>
      ) : null}
    </div>
  );
}

function SkeletonRows({ layout, rows = 5 }: { layout: keyof typeof ROW_COLUMNS; rows?: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={cn(ROW_BASE, ROW_COLUMNS[layout], ROW_HEIGHT[layout], "items-center gap-y-2.5 border-b border-hair py-3.5 last:border-b-0")}
        >
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-32 rounded" />
            <Skeleton className="h-3 w-44 max-w-full rounded" />
          </div>
          <div className={cn("col-[1] row-[2] flex items-center gap-3", AUTO[layout])}>
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-3.5 w-28 rounded" />
          </div>
          <div className={cn("col-[2] row-[2]", AUTO[layout])}>
            <Skeleton className="h-3.5 w-12 rounded" />
          </div>
          <div className={cn("col-[2] row-[1]", AUTO[layout])}>
            <Skeleton className="h-[22px] w-16 rounded-lg" />
          </div>
          <div className={cn("col-[1/-1] row-[3]", AUTO[layout])}>
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Invoices tab: grid table with its own paging. Props only. */
export function BillingInvoicesTable({
  invoices,
  resetKey,
  loading = false,
  failed = false,
  filtered = false,
  ...actions
}: BillingInvoicesTableProps) {
  const paging = useBillingPaging(invoices, resetKey);
  const layout: keyof typeof ROW_COLUMNS = actions.onMarkPaid || actions.onSendWhatsApp ? "wide" : "basic";

  return (
    <Surface flush as="section" className="@container" aria-label="Invoices">
      <div role="table" aria-label="Invoices" aria-busy={loading}>
        <div
          role="row"
          className={cn(
            ROW_BASE,
            ROW_COLUMNS[layout],
            HEAD[layout],
            "hidden border-b border-hair py-3 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted",
          )}
        >
          <span role="columnheader">Invoice</span>
          <span role="columnheader">Patient</span>
          <span role="columnheader">Amount</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Actions</span>
        </div>

        {loading ? (
          <SkeletonRows layout={layout} />
        ) : paging.pageRows.length === 0 ? (
          <div role="row">
            <div role="cell">
              {failed ? (
                <EmptyBlock
                  icon={AlertCircle}
                  tone="rose"
                  title="Invoices could not be loaded"
                  description="Press Sync Data to try again."
                />
              ) : (
                <EmptyBlock
                  icon={FileText}
                  title="No invoices found"
                  description={
                    filtered
                      ? "No invoice matches these filters. Change them or press Reset."
                      : "Invoices will show here once they are created."
                  }
                />
              )}
            </div>
          </div>
        ) : (
          paging.pageRows.map((invoice) => (
            <div
              key={invoice.id}
              role="row"
              className={cn(
                ROW_BASE,
                ROW_COLUMNS[layout],
                ROW_HEIGHT[layout],
                "items-start gap-y-2.5 border-b border-hair py-3.5 text-sm last:border-b-0",
              )}
            >
              <div role="cell" className="flex min-w-0 flex-col gap-px">
                <span className="truncate text-sm font-bold text-ink">{invoiceNumberLabel(invoice)}</span>
                <span className="truncate text-xs text-ink-muted">Order ID: {invoiceOrderId(invoice)}</span>
                <span className="text-xs text-ink-muted">Due: {formatBillingDate(invoice.dueDate)}</span>
              </div>
              <div role="cell" className={cn("col-[1] row-[2] min-w-0", AUTO[layout])}>
                <CellTitle
                  left={<InitialsAvatar name={invoice.patientName} size={32} />}
                  title={invoice.patientName || "Unknown"}
                />
              </div>
              <div role="cell" className={cn("col-[2] row-[2] min-w-0 self-center text-right font-bold text-ink", AUTO[layout], layout === "wide" ? "@5xl:text-left" : "@4xl:text-left")}>
                {formatRupees(invoice.amount)}
              </div>
              <div role="cell" className={cn("col-[2] row-[1] min-w-0 justify-self-end", AUTO[layout], layout === "wide" ? "@5xl:justify-self-start" : "@4xl:justify-self-start")}>
                <Pill tone={statusTone(invoice.status)}>{statusLabel(invoice.status)}</Pill>
              </div>
              <div role="cell" className={cn("col-[1/-1] row-[3] min-w-0", AUTO[layout])}>
                <InvoiceRowActions invoice={invoice} {...actions} />
              </div>
            </div>
          ))
        )}
      </div>

      {loading || failed ? null : <BillingPager paging={paging} id="billing-invoices" />}
    </Surface>
  );
}
