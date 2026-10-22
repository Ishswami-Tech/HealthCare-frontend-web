"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyBlock, GridHead, GridRow, LoadError, Pill, SearchBox, SkeletonRows } from "@/components/tbd";
import { expiryLabel, type DispenseStockItem } from "@/lib/dispense/direct-dispense";

const COLUMNS = "minmax(0,2fr) 90px 110px 96px";

/** Clinic stock to pick from: stock counts and earliest expiry only, never a price. */
export function DispenseStockPicker({
  search,
  onSearch,
  items,
  loading,
  failed,
  onRetry,
  addedIds,
  onAdd,
  locationLabel,
}: {
  search: string;
  onSearch: (value: string) => void;
  items: readonly DispenseStockItem[];
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  addedIds: ReadonlySet<string>;
  onAdd: (item: DispenseStockItem) => void;
  locationLabel?: string | undefined;
}) {
  return (
    <div className="flex flex-col gap-3">
      <SearchBox
        value={search}
        onChange={onSearch}
        placeholder={`Search brand, generic or strength${locationLabel ? ` in ${locationLabel} stock` : ""}`}
        ariaLabel="Search clinic stock"
      />
      <div className="overflow-hidden rounded-2xl border border-line" role="table" aria-label="Clinic stock">
        <GridHead columns={COLUMNS} labels={["Medicine", "Expiry (FEFO)", "In stock", ""]} />
        {loading ? (
          <SkeletonRows rows={3} />
        ) : failed ? (
          <LoadError title="Stock could not be loaded" onRetry={onRetry} />
        ) : items.length === 0 ? (
          <EmptyBlock title="Nothing in stock matches" description="Try the generic name or the strength." className="py-6" />
        ) : (
          items.map((item) => {
            const added = addedIds.has(item.medicineId);
            return (
              <GridRow key={item.medicineId} columns={COLUMNS}>
                <span role="cell" className="flex min-w-0 flex-col">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-bold text-ink">{item.name}</span>
                    {item.status === "LOW" ? <Pill tone="amber">Low stock</Pill> : null}
                    {item.status === "OUT" ? <Pill tone="rose">Out of stock</Pill> : null}
                    {item.expiringSoon ? <Pill tone="rose">Near expiry</Pill> : null}
                  </span>
                  <span className="truncate text-xs text-ink-muted">
                    {[item.manufacturer, item.category].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span role="cell" className="text-ink-soft">
                  {expiryLabel(item.nearestExpiry) || "-"}
                </span>
                <span role="cell" className="font-semibold text-ink">
                  {item.quantityOnHand} {item.unit}
                </span>
                <span role="cell" className="lg:text-right">
                  {added ? (
                    <Pill tone="green">Added</Pill>
                  ) : (
                    <Button size="compact" variant="soft" disabled={item.quantityOnHand <= 0} onClick={() => onAdd(item)}>
                      <Plus aria-hidden="true" />
                      Add
                    </Button>
                  )}
                </span>
              </GridRow>
            );
          })
        )}
      </div>
    </div>
  );
}
