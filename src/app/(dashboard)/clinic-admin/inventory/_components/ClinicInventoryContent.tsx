"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, ClipboardList, IndianRupee, Package, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CellTitle,
  EmptyBlock,
  FilterChips,
  GridHead,
  GridRow,
  Kpi,
  LoadError,
  Pill,
  SearchBox,
  SectionTitle,
  SkeletonRows,
  Surface,
  TbdPage,
} from "@/components/tbd";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useInventoryCounts, useMedicines, usePharmacyOrders, useSuppliers } from "@/hooks/query/usePharmacy";
import { useReorderEvaluation } from "@/hooks/query/usePharmacyOps";
import { routeFor } from "@/lib/config/tbdRoutes";
import { buildReorderLines } from "@/lib/pharmacy/pharmacy-ops.logic";
import { formatRupees } from "@/lib/utils/currency";
import {
  STATUS_LABEL,
  STATUS_TONE,
  buildInventoryOverview,
  buildOrders,
  dayLabel,
  expiryMonthLabel,
  medicineSubline,
  orderTone,
  supplierNameMap,
  type MedicineRow,
} from "@/app/(dashboard)/pharmacy/_components/pharmacy-inventory.logic";

type ListFilter = "all" | "low" | "expiring";
const COLUMNS = "minmax(0,1.6fr) minmax(0,1fr) 120px 120px";

function errorText(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "Please try again.";
}

/**
 * CaInventory: the clinic admin's view of the clinic stock (the same medicines the pharmacy
 * dispenses from): what is low, what expires soon, what to reorder and the latest purchase
 * orders. Stock is edited in the pharmacy inventory (`/pharmacy`); costs are shown to the admin only.
 */
export function ClinicInventoryContent() {
  const { clinicId } = useClinicContext();
  const scopedClinicId = clinicId || "";
  const [filter, setFilter] = useState<ListFilter>("all");
  const [search, setSearch] = useState("");

  const medicinesQuery = useMedicines(scopedClinicId, { limit: 500 });
  // Server counts (one definition: low = 0 < stock <= reorder level, out = stock <= 0).
  const { data: counts } = useInventoryCounts(scopedClinicId);
  const { data: suppliersData } = useSuppliers();
  const { data: ordersData } = usePharmacyOrders(scopedClinicId, { limit: 5 });
  const { data: ruleSuggestions = [] } = useReorderEvaluation(scopedClinicId);

  const supplierNames = useMemo(() => supplierNameMap(suppliersData), [suppliersData]);
  const overview = useMemo(
    () => buildInventoryOverview(medicinesQuery.data ?? [], supplierNames),
    [medicinesQuery.data, supplierNames],
  );
  const orders = useMemo(
    () => buildOrders(ordersData, overview.rows, supplierNames) ?? [],
    [ordersData, overview.rows, supplierNames],
  );
  const reorderLines = useMemo(
    () => buildReorderLines(overview.lowStock, ruleSuggestions).slice(0, 6),
    [overview.lowStock, ruleSuggestions],
  );
  const reorderTotal = reorderLines.reduce((sum, line) => sum + line.cost, 0);

  const visibleRows = useMemo(() => {
    const base: MedicineRow[] =
      filter === "low" ? overview.lowStock : filter === "expiring" ? overview.expiring : overview.rows;
    const needle = search.trim().toLowerCase();
    return needle ? base.filter((row) => `${row.name} ${row.manufacturer}`.toLowerCase().includes(needle)) : base;
  }, [filter, overview, search]);

  return (
    <TbdPage
      title="Inventory"
      description="Clinic stock across locations: what is low, what expires soon and what to order. Costs are visible to the clinic admin only."
      actions={
        <>
          <Button asChild variant="outline" size="md">
            <Link href="/pharmacy/expiry">
              <CalendarClock />
              Expiring stock
            </Link>
          </Button>
          <Button asChild size="md">
            <Link href="/pharmacy">
              <ClipboardList />
              Manage stock
            </Link>
          </Button>
        </>
      }
    >
      <section aria-label="Stock numbers" className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Items tracked" value={counts?.total ?? overview.rows.length} icon={Package} tone="blue" />
        <Kpi
          label="Low stock"
          value={counts?.lowStock ?? overview.summary.lowCount}
          icon={AlertTriangle}
          tone="amber"
          hint={`${counts?.outOfStock ?? overview.summary.outCount} out of stock · reorder this week`}
        />
        <Kpi label="Expiring in 90 days" value={counts?.expiringSoon ?? overview.expiring.length} icon={CalendarClock} tone="rose" hint="Use or return first" />
        <Kpi label="Stock value" value={formatRupees(counts?.totalValue ?? overview.totalValue)} icon={IndianRupee} tone="mint" hint="At listed price" />
      </section>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Surface flush as="section" aria-label="Stock list">
          <div className="flex flex-col gap-3 border-b border-hair px-5 pb-4 pt-5">
            <SearchBox value={search} onChange={setSearch} placeholder="Search medicine or manufacturer" ariaLabel="Search stock" />
            <FilterChips
              ariaLabel="Stock filter"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "All", count: overview.rows.length },
                { value: "low", label: "Low or out of stock", count: overview.lowStock.length },
                { value: "expiring", label: "Expiring", count: overview.expiring.length },
              ]}
            />
          </div>
          {medicinesQuery.isPending && !medicinesQuery.data ? (
            <SkeletonRows rows={5} />
          ) : medicinesQuery.error ? (
            <LoadError title="We could not load the stock" message={errorText(medicinesQuery.error)} onRetry={() => void medicinesQuery.refetch()} />
          ) : visibleRows.length === 0 ? (
            <EmptyBlock icon={Package} title="Nothing to show" description="No medicines match this filter." />
          ) : (
            <div role="table" aria-label="Stock">
              <GridHead columns={COLUMNS} labels={["Item", "Stock vs reorder", "Expiry", "Status"]} />
              {visibleRows.slice(0, 50).map((row) => (
                <GridRow key={row.id} columns={COLUMNS}>
                  <div role="cell">
                    <CellTitle title={row.name} description={medicineSubline(row) || row.unit} />
                  </div>
                  <div role="cell" className="text-[13px] font-semibold text-ink-soft">
                    {row.minStock > 0 ? `${row.stock} of ${row.minStock} ${row.unit}` : `${row.stock} ${row.unit}`}
                  </div>
                  <div role="cell" className="text-[13px] text-ink-soft">
                    {expiryMonthLabel(row.expiryDate) || "N/A"}
                  </div>
                  <div role="cell">
                    {row.expiringSoon && row.status === "in_stock" ? (
                      <Pill tone="amber">Expiring</Pill>
                    ) : (
                      <Pill tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Pill>
                    )}
                  </div>
                </GridRow>
              ))}
            </div>
          )}
        </Surface>

        <div className="flex min-w-0 flex-col gap-5">
          <Surface as="section" aria-label="Suggested reorder">
            <SectionTitle icon={ShoppingCart} title="Suggested reorder" description="Medicines at or below their reorder level." />
            {reorderLines.length === 0 ? (
              <p className="m-0 text-[13px] text-ink-muted">Nothing is below its reorder level.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col p-0">
                {reorderLines.map((line) => (
                  <li key={line.id} className="flex items-center justify-between gap-3 border-b border-hair py-2.5 last:border-b-0">
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-bold text-ink">{line.name}</span>
                      <span className="text-xs text-ink-muted">
                        Order {line.quantity} · {line.stock} left of {line.minStock}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-ink">{line.cost > 0 ? formatRupees(line.cost) : "—"}</span>
                  </li>
                ))}
              </ul>
            )}
            {reorderLines.length > 0 ? (
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-ink-muted">Estimated total</span>
                <span className="font-extrabold text-ink">{formatRupees(reorderTotal)}</span>
              </div>
            ) : null}
            <Button asChild variant="action">
              <Link href="/pharmacy#orders">Create purchase order</Link>
            </Button>
          </Surface>

          <Surface as="section" aria-label="Expiring soon">
            <SectionTitle icon={CalendarClock} title="Expiring soon" count={overview.expiring.length} />
            {overview.expiring.length === 0 ? (
              <p className="m-0 text-[13px] text-ink-muted">Nothing expires in the next 90 days.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col p-0">
                {overview.expiring.slice(0, 4).map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-3 border-b border-hair py-2.5 last:border-b-0">
                    <span className="truncate text-sm font-semibold text-ink">{row.name}</span>
                    <Pill tone={(row.daysToExpiry ?? 0) <= 30 ? "rose" : "amber"}>
                      {(row.daysToExpiry ?? 0) < 0 ? "Expired" : `${row.daysToExpiry} days`}
                    </Pill>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline">
              <Link href="/pharmacy/expiry">Review expiring stock</Link>
            </Button>
          </Surface>

          <Surface as="section" aria-label="Recent orders">
            <SectionTitle icon={ClipboardList} title="Recent orders" />
            {orders.length === 0 ? (
              <p className="m-0 text-[13px] text-ink-muted">No purchase orders yet.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col p-0">
                {orders.map((order) => (
                  <li key={order.id} className="border-b border-hair py-2.5 last:border-b-0">
                    <Link
                      href={routeFor("/clinic-admin/inventory/orders/[id]", { id: order.id })}
                      className="flex items-center justify-between gap-3 hover:underline"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-bold text-ink">{order.reference}</span>
                        <span className="truncate text-xs text-ink-muted">
                          {[order.supplierName, dayLabel(order.orderedAt)].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <Pill tone={orderTone(order.status)}>{order.status.replace(/_/g, " ")}</Pill>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
        </div>
      </div>
    </TbdPage>
  );
}
