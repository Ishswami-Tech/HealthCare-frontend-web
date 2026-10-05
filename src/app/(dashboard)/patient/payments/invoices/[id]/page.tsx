"use client";

import { useParams } from "next/navigation";
import { PatientInvoiceContent } from "../../_components/PatientInvoiceContent";

/** /patient/payments/invoices/[id] — one invoice of the signed-in patient. */
export default function PatientInvoicePage() {
  const params = useParams<{ id?: string }>();
  const invoiceId = String(params?.id || "").trim();

  return <PatientInvoiceContent key={invoiceId} invoiceId={invoiceId} />;
}
