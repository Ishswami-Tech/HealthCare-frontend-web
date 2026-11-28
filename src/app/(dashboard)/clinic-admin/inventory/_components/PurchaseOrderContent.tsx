"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ClipboardList, Copy, MessageCircle, Package, Printer, Send, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CellTitle,
  EmptyBlock,
  GridHead,
  GridRow,
  Kpi,
  Kv,
  LoadError,
  Note,
  Pill,
  SectionTitle,
  SkeletonRows,
  Surface,
  TbdPage,
} from "@/components/tbd";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useMedicines, usePharmacyOrder, useSendPharmacyOrder, useSuppliers } from "@/hooks/query/usePharmacy";
import { showSuccessToast } from "@/hooks/utils/use-toast";
import { purchaseOrderMessage, whatsAppLink } from "@/lib/pharmacy/pharmacy-ops.logic";
import { formatRupees } from "@/lib/utils/currency";
import { asRecordOrEmpty, textOf, unwrapRecords } from "@/lib/utils/coerce";
import {
  buildInventoryOverview,
  buildOrders,
  dayLabel,
  orderTone,
  receivedSummary,
  supplierNameMap,
} from "@/app/(dashboard)/pharmacy/_components/pharmacy-inventory.logic";

const COLUMNS = "minmax(0,1.6fr) 100px 100px 110px 120px";

/** Phone of the order's supplier from the suppliers list ("" when unknown). */
function supplierPhone(suppliersData: unknown, supplierId: string): string {
  const supplier = unwrapRecords(suppliersData, "suppliers", "data").find((row) => textOf(row.id) === supplierId);
  return textOf(asRecordOrEmpty(supplier).phone);
}

/**
 * CaPurchaseOrder: one purchase order as a document (supplier, lines, cost, delivery) with
 * Send to supplier for a draft, a ready WhatsApp message, and Print. Goods are booked in from
 * the Orders tab of the pharmacy inventory, which adds the stock batches.
 */
export function PurchaseOrderContent({ orderId }: { orderId: string }) {
  const { clinicId } = useClinicContext();
  const scopedClinicId = clinicId || "";
  const orderQuery = usePharmacyOrder(scopedClinicId, orderId);
  const { data: medicinesData } = useMedicines(scopedClinicId, { limit: 500 });
  const { data: suppliersData } = useSuppliers();
  const sendOrder = useSendPharmacyOrder();

  const supplierNames = useMemo(() => supplierNameMap(suppliersData), [suppliersData]);
  const rows = useMemo(() => buildInventoryOverview(medicinesData ?? [], supplierNames).rows, [medicinesData, supplierNames]);
  const order = useMemo(
    () => (orderQuery.data ? (buildOrders({ orders: [orderQuery.data] }, rows, supplierNames)?.[0] ?? null) : null),
    [orderQuery.data, rows, supplierNames],
  );

  const backProps = { backHref: "/clinic-admin/inventory", backLabel: "Inventory" };

  if (orderQuery.isPending && !orderQuery.data) {
    return (
      <TbdPage title="Purchase order" {...backProps}>
        <Surface flush>
          <SkeletonRows rows={4} />
        </Surface>
      </TbdPage>
    );
  }
  if (orderQuery.error || !order) {
    return (
      <TbdPage title="Purchase order" {...backProps}>
        <Surface flush role="alert">
          <LoadError
            title="We could not load this purchase order"
            message={orderQuery.error instanceof Error ? orderQuery.error.message : "It may have been removed."}
            onRetry={() => void orderQuery.refetch()}
          />
        </Surface>
      </TbdPage>
    );
  }

  const expectedLabel = dayLabel(order.expectedAt);
  const message = purchaseOrderMessage({
    reference: order.reference,
    supplierName: order.supplierName,
    expectedLabel,
    lines: order.lines,
  });
  const whatsApp = whatsAppLink(supplierPhone(suppliersData, order.supplierId), message);
  const copyMessage = () => {
    void navigator.clipboard?.writeText(message).then(() => showSuccessToast("Message copied"));
  };

  return (
    <TbdPage
      title={`${order.reference}`}
      description={[order.supplierName, dayLabel(order.orderedAt)].filter(Boolean).join(" · ")}
      {...backProps}
      actions={
        <>
          <Button variant="outline" size="md" onClick={() => window.print()}>
            <Printer />
            Print
          </Button>
          {order.canSend ? (
            <Button
              size="md"
              disabled={sendOrder.isPending}
              onClick={() => void sendOrder.mutateAsync({ clinicId: scopedClinicId, orderId: order.id }).then(() => orderQuery.refetch())}
            >
              <Send />
              {sendOrder.isPending ? "Sending…" : "Send to supplier"}
            </Button>
          ) : null}
          {order.canReceive ? (
            <Button asChild size="md">
              <Link href="/pharmacy#orders">
                <Truck />
                Receive goods
              </Link>
            </Button>
          ) : null}
        </>
      }
    >
      <section aria-label="Order numbers" className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <Kpi label="Status" value={<Pill tone={orderTone(order.status)}>{order.status.replace(/_/g, " ")}</Pill>} icon={ClipboardList} tone="blue" />
        <Kpi label="Lines" value={order.lines.length} icon={Package} tone="mint" hint={receivedSummary(order) || undefined} />
        <Kpi label="Order total" value={order.total !== null ? formatRupees(order.total) : "—"} tone="amber" />
      </section>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Surface flush as="section" aria-label="Order lines">
          <div className="border-b border-hair px-5 pb-4 pt-5">
            <SectionTitle icon={Package} title="Items" count={order.lines.length} />
          </div>
          {order.lines.length === 0 ? (
            <EmptyBlock icon={Package} title="No items on this order" />
          ) : (
            <div role="table" aria-label="Items">
              <GridHead columns={COLUMNS} labels={["Item", "Ordered", "Received", "Unit cost", "Line total"]} />
              {order.lines.map((line) => (
                <GridRow key={line.id} columns={COLUMNS}>
                  <div role="cell">
                    <CellTitle title={line.name} />
                  </div>
                  <div role="cell" className="text-[13px] font-semibold text-ink">{line.quantity}</div>
                  <div role="cell" className="text-[13px] text-ink-soft">{line.received}</div>
                  <div role="cell" className="text-[13px] text-ink-soft">
                    {line.unitPrice !== null ? formatRupees(line.unitPrice) : "—"}
                  </div>
                  <div role="cell" className="text-[13px] font-bold text-ink">
                    {line.unitPrice !== null ? formatRupees(line.unitPrice * line.quantity) : "—"}
                  </div>
                </GridRow>
              ))}
            </div>
          )}
        </Surface>

        <div className="flex min-w-0 flex-col gap-5">
          <Surface as="section" aria-label="Order details">
            <SectionTitle title="Order details" />
            <div className="grid grid-cols-1 gap-3">
              <Kv label="Supplier" value={order.supplierName || "—"} />
              <Kv label="Expected delivery" value={expectedLabel || "Not set"} />
              <Kv label="Sent" value={dayLabel(order.sentAt) || "Not sent yet"} />
              {order.notes ? <Kv label="Notes" value={order.notes} /> : null}
            </div>
            <Note tone="blue">Costs are visible to the clinic admin and the pharmacy only. Stock is added when the order is received.</Note>
          </Surface>

          <Surface as="section" aria-label="Message to supplier">
            <SectionTitle icon={MessageCircle} title="Message to supplier" />
            <p className="m-0 rounded-[12px] bg-well px-3.5 py-3 text-[13px] leading-relaxed text-ink">{message}</p>
            <div className="flex flex-wrap gap-2">
              {whatsApp ? (
                <Button asChild>
                  <a href={whatsApp} target="_blank" rel="noopener noreferrer">
                    <MessageCircle />
                    Send on WhatsApp
                  </a>
                </Button>
              ) : null}
              <Button variant="outline" onClick={copyMessage}>
                <Copy />
                Copy message
              </Button>
            </div>
          </Surface>
        </div>
      </div>
    </TbdPage>
  );
}
