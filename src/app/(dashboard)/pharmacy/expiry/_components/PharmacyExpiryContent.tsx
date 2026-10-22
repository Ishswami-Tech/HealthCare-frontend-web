"use client";

import { useMemo, useState } from "react";
import { CalendarClock, History, PackageX, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CellTitle,
  EmptyBlock,
  FilterChips,
  GridHead,
  GridRow,
  LoadError,
  Pill,
  SectionTitle,
  SkeletonRows,
  StatTile,
  Surface,
  TbdPage,
} from "@/components/tbd";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useMedicines, useStockBatches, useSuppliers } from "@/hooks/query/usePharmacy";
import { useBatchAction, useBatchMovementAudit } from "@/hooks/query/usePharmacyOps";
import { usePharmacyPermissions } from "@/hooks/utils/useRBAC";
import { buildExpiryRows, countByBucket, type ExpiryRow } from "@/lib/pharmacy/pharmacy-ops.logic";
import { formatRupees } from "@/lib/utils/currency";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { textOf, unwrapRecords } from "@/lib/utils/coerce";
import { dateTimeLabel, dayLabel } from "@/app/(dashboard)/pharmacy/_components/pharmacy-inventory.logic";
import { BatchActionDialog, type BatchActionRequest } from "./BatchActionDialog";

type ExpiryFilter = "within90" | "watch" | "expired" | "all";
const COLUMNS = "minmax(0,1.6fr) 150px 120px 260px";

const MOVEMENT_LABEL: Record<string, string> = {
  PURCHASE_IN: "Stock received",
  DISPENSE: "Dispensed",
  ADJUSTMENT: "Corrected",
  RETURN_TO_SUPPLIER: "Returned to supplier",
  DISCARD_WRITE_OFF: "Discarded",
  EXPIRED_WRITE_OFF: "Written off (expired)",
  REVERSAL: "Dispense reversed",
};

/** Movements that take units out of the batch (the API may send them as positive numbers). */
const OUTGOING = new Set(["DISPENSE", "RETURN_TO_SUPPLIER", "DISCARD_WRITE_OFF", "EXPIRED_WRITE_OFF"]);

function signedQuantity(movementType: string, quantity: number): string {
  const outgoing = OUTGOING.has(movementType) || quantity < 0;
  return `${outgoing ? "−" : "+"}${Math.abs(quantity)}`;
}

function matches(row: ExpiryRow, filter: ExpiryFilter): boolean {
  if (filter === "all") return true;
  if (filter === "within90") return row.bucket === "within30" || row.bucket === "within90";
  return row.bucket === filter;
}

/**
 * PhExpiry: batches that expire within 180 days (or already have), soonest first, with Return to
 * supplier / Discard and each batch's audit trail. Pharmacist and clinic admin.
 */
export function PharmacyExpiryContent() {
  const { clinicId } = useClinicContext();
  const scopedClinicId = clinicId || "";
  const { canManageInventory } = usePharmacyPermissions();
  const [filter, setFilter] = useState<ExpiryFilter>("within90");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [request, setRequest] = useState<BatchActionRequest | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const batchesQuery = useStockBatches(scopedClinicId);
  const { data: medicinesData } = useMedicines(scopedClinicId, { limit: 500 });
  const { data: suppliersData } = useSuppliers();
  const batchAction = useBatchAction();

  const names = useMemo(
    () => new Map(unwrapRecords(medicinesData, "inventory", "data").map((row) => [textOf(row.id), textOf(row.name)])),
    [medicinesData],
  );
  const suppliers = useMemo(
    () =>
      unwrapRecords(suppliersData, "suppliers", "data")
        .map((row) => ({ id: textOf(row.id), name: textOf(row.name) || "Supplier" }))
        .filter((row) => row.id),
    [suppliersData],
  );
  const rows = useMemo(() => buildExpiryRows(batchesQuery.data, names), [batchesQuery.data, names]);
  const counts = countByBucket(rows);
  const visible = rows.filter((row) => matches(row, filter));
  const selected = rows.find((row) => row.batchId === selectedBatchId) ?? visible[0] ?? null;

  const submitAction = (pending: BatchActionRequest, values: { quantity: number; reason: string; supplierId?: string }) => {
    setActionError(null);
    batchAction
      .mutateAsync({ action: pending.action, batchId: pending.row.batchId, ...values })
      .then(() => {
        setRequest(null);
        setSelectedBatchId(pending.row.batchId);
      })
      .catch((error: unknown) => setActionError(sanitizeErrorMessage(error)));
  };

  return (
    <TbdPage
      title="Expiring stock"
      description="Batches that expire within 90 days, with a full audit trail. Use them first, return them to the supplier or mark them discarded."
      backHref="/pharmacy"
      backLabel="Inventory"
    >
      <section aria-label="Expiry numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile value={counts.expired} label="Already expired" tone={counts.expired > 0 ? "rose" : "ink"} />
        <StatTile value={counts.within30} label="Within 30 days" tone="rose" />
        <StatTile value={counts.within90} label="31 to 90 days" tone="amber" />
        <StatTile value={counts.watch} label="Watch list (91 to 180 days)" tone="blue" />
      </section>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Surface flush as="section" aria-label="Expiring batches">
          <div className="flex flex-col gap-3 border-b border-hair px-5 pb-4 pt-5">
            <SectionTitle icon={CalendarClock} title="Batches" description="Sorted by soonest expiry." />
            <FilterChips
              ariaLabel="Expiry window"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "within90", label: "Within 90 days", count: counts.within30 + counts.within90 },
                { value: "watch", label: "Watch list", count: counts.watch },
                { value: "expired", label: "Expired", count: counts.expired },
                { value: "all", label: "All", count: rows.length },
              ]}
            />
          </div>
          {batchesQuery.isPending && !batchesQuery.data ? (
            <SkeletonRows rows={4} />
          ) : batchesQuery.error ? (
            <LoadError
              title="We could not load the batches"
              message={batchesQuery.error instanceof Error ? batchesQuery.error.message : undefined}
              onRetry={() => void batchesQuery.refetch()}
            />
          ) : visible.length === 0 ? (
            <EmptyBlock icon={CalendarClock} title="Nothing here" description="No batch with stock falls in this window." />
          ) : (
            <div role="table" aria-label="Expiring batches">
              <GridHead columns={COLUMNS} labels={["Medicine · batch", "Expires", "In stock", "Actions"]} />
              {visible.map((row) => (
                <GridRow key={row.batchId} columns={COLUMNS} className={row.batchId === selected?.batchId ? "bg-mint-soft/40" : undefined}>
                  <div role="cell">
                    <CellTitle
                      title={row.medicineName}
                      description={`Batch ${row.lotNumber}${row.costPrice !== null ? ` · ${formatRupees(row.costPrice)} each` : ""}`}
                    />
                  </div>
                  <div role="cell" className="flex flex-col items-start gap-1">
                    <span className="text-[13px] font-semibold text-ink">{dayLabel(row.expiryDate)}</span>
                    <Pill tone={row.tone}>{row.daysLabel}</Pill>
                  </div>
                  <div role="cell" className="flex flex-col">
                    <span className="text-[13px] font-semibold text-ink">{row.onHand} units</span>
                    {row.costPrice !== null ? (
                      <span className="text-xs text-ink-muted">worth {formatRupees(row.costPrice * row.onHand)}</span>
                    ) : null}
                  </div>
                  <div role="cell" className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="compact" onClick={() => setSelectedBatchId(row.batchId)} aria-label={`Audit trail of batch ${row.lotNumber}`}>
                      <History />
                      Audit
                    </Button>
                    {canManageInventory ? (
                      <>
                        <Button
                          variant="soft"
                          size="compact"
                          onClick={() => {
                            setActionError(null);
                            setRequest({ row, action: "RETURN_TO_SUPPLIER" });
                          }}
                        >
                          <Undo2 />
                          Return
                        </Button>
                        <Button
                          variant="danger"
                          size="compact"
                          onClick={() => {
                            setActionError(null);
                            setRequest({ row, action: "DISCARD" });
                          }}
                        >
                          <PackageX />
                          Discard
                        </Button>
                      </>
                    ) : null}
                  </div>
                </GridRow>
              ))}
            </div>
          )}
        </Surface>

        <BatchAuditPanel clinicId={scopedClinicId} row={selected} />
      </div>

      <BatchActionDialog
        request={request}
        suppliers={suppliers}
        isPending={batchAction.isPending}
        error={actionError}
        onSubmit={submitAction}
        onClose={() => setRequest(null)}
      />
    </TbdPage>
  );
}

function BatchAuditPanel({ clinicId, row }: { clinicId: string; row: ExpiryRow | null }) {
  const auditQuery = useBatchMovementAudit(clinicId, row?.batchId ?? "");
  const entries = auditQuery.data ?? [];
  return (
    <Surface as="section" aria-label="Batch audit trail">
      <SectionTitle
        icon={History}
        title="Batch audit trail"
        description={row ? `${row.medicineName} · ${row.lotNumber}` : "Choose a batch to see its history."}
      />
      {!row ? null : auditQuery.isPending && !auditQuery.data ? (
        <SkeletonRows rows={3} />
      ) : auditQuery.error ? (
        <p className="m-0 text-[13px] text-ink-muted">The history could not be loaded.</p>
      ) : entries.length === 0 ? (
        <p className="m-0 text-[13px] text-ink-muted">No movements recorded yet.</p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-0 p-0">
          {entries.map((entry) => {
            const label = MOVEMENT_LABEL[entry.movementType] ?? entry.movementType.replace(/_/g, " ").toLowerCase();
            return (
              <li key={entry.id || entry.at} className="flex flex-col gap-0.5 border-b border-hair py-2.5 last:border-b-0">
                <span className="text-[13px] font-bold text-ink">
                  {label} {signedQuantity(entry.movementType, entry.quantity)}
                </span>
                <span className="text-xs text-ink-muted">
                  {[dateTimeLabel(entry.at), entry.reason, entry.recordedByName].filter(Boolean).join(" · ")}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </Surface>
  );
}
