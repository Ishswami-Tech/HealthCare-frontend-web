"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { RoleBasedBillingDashboard } from "@/components/billing";
import { BillingInvoiceDialog } from "@/components/billing/staff/BillingInvoiceDialog";
import { useClinicInvoices, useClinicPayments } from "@/hooks/query/useBilling";
import { useInvoicePdfDownload } from "@/hooks/query/useInvoicePdfDownload";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { invoiceReceiptFileName } from "@/lib/utils/prescription-pdf-download";

const HEADER = {
  eyebrow: "PHARMACY BILLING",
  title: "Billing Dashboard",
  description: "Invoices and payments for medicines you have dispensed.",
};

/**
 * PhBilling, PhBillingInvoices, PhBillingPayments, PhBillingInvoice: the shared billing dashboard
 * (overview, invoices, payments) on the clinic invoice and payment lists, which the API scopes to
 * pharmacy invoices for the pharmacist. Read only: payment is taken on the prescription.
 * `invoiceId` opens that invoice over the list (the invoice detail route).
 */
export function PharmacyBillingContent({ initialTab, invoiceId }: { initialTab?: string; invoiceId?: string }) {
  useWebSocketQuerySync();
  const router = useRouter();
  const invoicesQuery = useClinicInvoices(true);
  const paymentsQuery = useClinicPayments(undefined, true);
  const { downloadingPdfId, downloadPdf } = useInvoicePdfDownload();

  const invoices = invoicesQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];
  const loadFailure = invoicesQuery.error || paymentsQuery.error;
  const refetch = useCallback(() => {
    void invoicesQuery.refetch();
    void paymentsQuery.refetch();
  }, [invoicesQuery, paymentsQuery]);

  const openInvoice = invoiceId ? (invoices.find((invoice) => invoice.id === invoiceId) ?? null) : null;

  return (
    <>
      <RoleBasedBillingDashboard
        initialTab={initialTab ?? "overview"}
        plans={[]}
        subscriptions={[]}
        invoices={invoices}
        payments={payments}
        isLoading={(invoicesQuery.isPending && invoicesQuery.isFetching) || (paymentsQuery.isPending && paymentsQuery.isFetching)}
        loadError={loadFailure ? loadFailure.message || "Please try again." : null}
        isSyncing={invoicesQuery.isFetching || paymentsQuery.isFetching}
        onRefetch={refetch}
        listsOpen
        headerOverride={HEADER}
      />
      {invoiceId ? (
        <BillingInvoiceDialog
          invoice={openInvoice}
          onClose={() => router.push("/pharmacist/billing/invoices")}
          onOpenPdf={(invoice) => void downloadPdf(invoice.id, invoiceReceiptFileName(invoice.invoiceNumber, invoice.patientName))}
          openPdfPending={downloadingPdfId === openInvoice?.id}
        />
      ) : null}
    </>
  );
}
