import { PurchaseOrderContent } from "../../_components/PurchaseOrderContent";

// CaPurchaseOrder (B9): one purchase order as a document, with send / WhatsApp / print.
export default async function CaPurchaseOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PurchaseOrderContent orderId={id} />;
}
