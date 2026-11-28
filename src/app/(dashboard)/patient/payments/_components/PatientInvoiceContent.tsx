"use client";

import dynamic from "next/dynamic";
import { useInvoices, usePayments } from "@/hooks/query/useBilling";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import type { RenderInvoicePay } from "./BillingOverviewCards";
import { PatientInvoiceView, type PatientInvoiceState } from "./PatientInvoiceView";
import { InvoicePayAction, refetchAroundWindowClose } from "./InvoicePayAction";
import { invoicePaymentInfo, invoiceTotal } from "./patientBilling.logic";
import { usePatientBillingIdentity } from "./usePatientBilling";
import { formatRupees } from "@/lib/utils/currency";
import { useInvoicePdfDownload } from "@/hooks/query/useInvoicePdfDownload";
import { useClinicBrandName } from "@/hooks/query/useClinicBrandName";

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
  const clinic = useClinicBrandName();

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

  // The one way to pay from this screen: the shared PaymentButton (amber).
  // `amount` is in rupees, the invoice total the backend charges; the label shows the same rupees.
  const refetchBilling = () => {
    void refetchInvoices();
    void refetchPayments();
  };
  const renderPay: RenderInvoicePay = (pending) => (
    <InvoicePayAction invoice={pending} onExpired={() => refetchAroundWindowClose(refetchBilling)}>
      <PaymentButton invoiceId={pending.id} amount={invoiceTotal(pending)} size="md" onSuccess={refetchBilling}>
        Pay {formatRupees(invoiceTotal(pending), { currency: pending.currency })}
      </PaymentButton>
    </InvoicePayAction>
  );

  return (
    <PatientInvoiceView
      state={state}
      invoice={invoice}
      billedTo={userName}
      clinicName={clinic.name}
      payment={invoice ? invoicePaymentInfo(invoice, payments) : null}
      renderPay={renderPay}
      onDownloadPdf={(id) => void downloadPdf(id)}
      downloadingPdf={!!invoice && downloadingPdfId === invoice.id}
      onRetry={() => void refetchInvoices()}
    />
  );
}
