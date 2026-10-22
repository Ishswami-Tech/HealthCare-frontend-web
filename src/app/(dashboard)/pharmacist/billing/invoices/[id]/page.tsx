import { PharmacyBillingContent } from "../../_components/PharmacyBillingContent";

// PhBillingInvoice (B10): one pharmacy invoice (lines, status, PDF) over the invoices list.
export default async function PhBillingInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PharmacyBillingContent initialTab="invoices" invoiceId={id} />;
}
