"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, PackageCheck, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CellTitle,
  EmptyBlock,
  FilterChips,
  GridHead,
  GridRow,
  LoadError,
  Note,
  Pager,
  Pill,
  SearchBox,
  SkeletonRows,
  Surface,
  TbdPage,
  usePagedRows,
} from "@/components/tbd";
import { expiryLabel } from "@/lib/dispense/direct-dispense";
import { countStock, filterStock, sortByAttention, stockStatusMeta, type StockFilter } from "./stock-view.logic";
import { useDebouncedValue } from "@/hooks/core/useDebouncedValue";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useDispenseStock } from "@/hooks/query/useDirectDispense";
import { ASSISTANT_ROUTES } from "./assistant-routes";

const COLUMNS = "minmax(220px,1.8fr) 110px 120px 130px 170px";
const STOCK_LIMIT = 500;

/** AsStockView: what is in clinic stock right now. Read only, counts and expiry, no prices. */
export function AssistantStockScreen() {
  const { clinicId } = useClinicContext();
  const clinic = clinicId || "";
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StockFilter>("ALL");
  const query = useDebouncedValue(search.trim(), 300);
  const stock = useDispenseStock(clinic, { ...(query ? { q: query } : {}), limit: STOCK_LIMIT });
  const all = sortByAttention(stock.data?.items ?? []);
  const counts = countStock(all);
  const rows = filterStock(all, filter);
  const paged = usePagedRows(rows, 10, { resetKey: `${filter}:${query}` });

  return (
    <TbdPage
      title="Clinic stock"
      description="Check availability before you promise a medicine. Counts update the moment anyone dispenses. Prices and purchasing are handled by the clinic admin."
      actions={
        <Button asChild size="md">
          <Link href={ASSISTANT_ROUTES.dispense}>
            <PackageCheck />
            Dispense medicine
          </Link>
        </Button>
      }
    >
      <Surface flush>
        <div className="flex flex-col gap-3 border-b border-hair px-5 py-3.5">
          <SearchBox value={search} onChange={setSearch} placeholder="Search brand, generic or strength" ariaLabel="Search clinic stock" />
          <FilterChips<StockFilter>
            ariaLabel="Filter stock"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "ALL", label: "All items", count: counts.ALL },
              { value: "LOW", label: "Low stock", count: counts.LOW },
              { value: "EXPIRING", label: "Expiring soon", count: counts.EXPIRING },
              { value: "OUT", label: "Out of stock", count: counts.OUT },
            ]}
          />
        </div>
        {stock.error && !stock.data ? (
          <LoadError title="The clinic stock could not be loaded" onRetry={() => void stock.refetch()} />
        ) : stock.isPending ? (
          <SkeletonRows rows={6} />
        ) : rows.length === 0 ? (
          <EmptyBlock icon={PackageSearch} title="Nothing to show" description={query ? `No medicine matches "${query}".` : "No medicine in this list."} />
        ) : (
          <div role="table" aria-label="Clinic stock">
            <GridHead columns={COLUMNS} labels={["Medicine", "Form", "In stock", "Nearest expiry", "Status"]} />
            {paged.pageRows.map((item) => {
              const meta = stockStatusMeta(item);
              return (
                <GridRow key={item.medicineId} columns={COLUMNS}>
                  <CellTitle title={item.name} description={[item.manufacturer, item.category].filter(Boolean).join(" · ")} />
                  <span className="text-sm text-ink">{item.unit || "-"}</span>
                  <span className="text-sm font-extrabold text-ink">{item.quantityOnHand}</span>
                  <span className="text-sm text-ink">{expiryLabel(item.nearestExpiry) || "-"}</span>
                  <div>
                    <Pill tone={meta.tone}>{meta.label}</Pill>
                  </div>
                </GridRow>
              );
            })}
            <Pager paging={paged} noun="items" hideWhenSinglePage />
          </div>
        )}
      </Surface>
      <Note tone="blue" icon={Eye}>
        <strong className="font-bold">View only, by design.</strong> You can see counts, batches and expiry. Adding stock, editing items and prices are done by the clinic admin.
      </Note>
    </TbdPage>
  );
}
