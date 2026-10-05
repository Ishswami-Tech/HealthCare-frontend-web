"use client";

import dynamic from "next/dynamic";
import { invoiceNumberLabel } from "@/components/billing/staff/billing.logic";
import { useInvoices, usePayments } from "@/hooks/query/useBilling";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { showErrorToast, showSuccessToast } from "@/hooks/utils/use-toast";
import type { RenderInvoicePay } from "./BillingOverviewCards";
import { PatientInvoiceView, type PatientInvoiceState } from "./PatientInvoiceView";
import { formatAmount, invoicePaymentInfo, invoiceTotal } from "./patientBilling.logic";
import { useInvoicePdfDownload, usePatientBillingIdentity } from "./usePatientBilling";

const PaymentButton = dynamic(
  () => import("@/components/payments/PaymentButton").then((module) => module.PaymentButton),
  { ssr: false },
);

/**
 * Data container for one invoice. The invoice is read from the patient's own invoice list
 * (`useInvoices`), so an id that is not theirs shows "Invoice not found".
 */
export function PatientInvoiceContent({ invoiceId }: { invoiceId: string }) {
  const { userId, clinicId, userName } = usePatientBillingIdentity();
  const { downloadingPdfId, downloadPdf } = useInvoicePdfDownload();

  useWebSocketQuerySync();

  const {
    data: invoices = [],
    isPending: invoicesPending,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useInvoices(userId, clinicId);
  const { data: payments = [], refetch: refetchPayments } = usePayments(userId, clinicId);

  const invoice = invoices.find((candidate) => candidate.id === invoiceId);
  const state: PatientInvoiceState = invoice
    ? "ready"
    : invoicesPending
      ? "loading"
      : invoicesError
        ? "error"
        : "missing";

  const handleShare = async () => {
    if (!invoice) return;
    const title = `Invoice ${invoiceNumberLabel(invoice)}`;
    const url = window.location.href;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, text: `${title} · ${formatAmount(invoiceTotal(invoice), invoice.currency)}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showSuccessToast("Invoice link copied");
    } catch (error) {
      // Closing the share sheet is not an error.
      if (error instanceof DOMException && error.name === "AbortError") return;
      showErrorToast("The invoice link could not be shared.");
    }
  };

  // The one way to pay from this screen: the shared PaymentButton (amber).
  // `amount` is in rupees, the invoice total the backend charges; the label shows the same rupees.
  const renderPay: RenderInvoicePay = (pending) => (
    <PaymentButton
      invoiceId={pending.id}
      amount={invoiceTotal(pending)}
      size="md"
      onSuccess={() => {
        void refetchInvoices();
        void refetchPayments();
      }}
    >
      Pay {formatAmount(invoiceTotal(pending), pending.currency)}
    </PaymentButton>
  );

  return (
    <PatientInvoiceView
      state={state}
      invoice={invoice}
      billedTo={userName}
      payment={invoice ? invoicePaymentInfo(invoice, payments) : null}
      renderPay={renderPay}
      onDownloadPdf={(id) => void downloadPdf(id)}
      downloadingPdf={!!invoice && downloadingPdfId === invoice.id}
      onShare={() => void handleShare()}
      onRetry={() => void refetchInvoices()}
    />
  );
}
