"use client";

import {
  CalendarDays,
  CircleAlert,
  CircleCheck,
  Eye,
  PackageSearch,
  Pill as PillIcon,
  Plus,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkeletonList } from "@/components/ui/loading";
import {
  CellTitle,
  EmptyBlock,
  GridHead,
  GridRow,
  IconBox,
  Kpi,
  Pill,
  SearchBox,
  Surface,
  type IconTone,
  type TbdIcon,
} from "@/components/tbd";
import { cn } from "@/lib/utils";
import {
  EMPTY_FILTERS,
  STATUS_LABEL,
  STATUS_TONE,
  STOCK_FILTER_OPTIONS,
  expiringLine,
  expiryMonthLabel,
  expiryPill,
  filterMedicines,
  formatRupees,
  lowStockLine,
  medicineSubline,
  paginate,
  type InventoryFilters,
  type InventoryOverview,
  type MedicineRow,
  type StockFilter,
} from "./pharmacy-inventory.logic";

const ALL = "all";
const VISIBLE_ALERTS = 5;
const COLUMNS = "minmax(0, 1fr) 112px 118px 64px 116px 64px 208px";

export interface PharmacyInventoryStockTabProps {
  overview: InventoryOverview;
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  filters: InventoryFilters;
  onFiltersChange: (filters: InventoryFilters) => void;
  page: number;
  onPageChange: (page: number) => void;
  /** False hides Restock and Add (no `MANAGE_INVENTORY` permission). */
  canManage: boolean;
  onView: (medicine: MedicineRow) => void;
  onRestock: (medicine: MedicineRow) => void;
  onAddMedicine: () => void;
}

function AlertHead({
  icon,
  tone,
  title,
  description,
  count,
}: {
  icon: TbdIcon;
  tone: IconTone;
  title: string;
  description: string;
  count: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <IconBox icon={icon} tone={tone} size={38} />
      <span className="flex min-w-0 flex-1 basis-[150px] flex-col gap-px">
        <h2 className="m-0 text-base font-bold text-ink">{title}</h2>
        <span className="text-[13px] font-medium text-ink-muted">{description}</span>
      </span>
      {count ? <span className="text-xs font-bold text-ink-soft">{count}</span> : null}
    </div>
  );
}

function MoreButton({ count, label, onClick }: { count: number; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-2 mt-1 inline-flex min-h-9 items-center self-start rounded-lg text-[13px] font-bold text-brand hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      Show {count} more {label}
    </button>
  );
}

function lowStockCount(overview: InventoryOverview): string {
  const { lowCount, outCount } = overview.summary;
  return [lowCount > 0 ? `${lowCount} low` : "", outCount > 0 ? `${outCount} out of stock` : ""]
    .filter(Boolean)
    .join(" · ");
}

/** "Medicine Inventory" tab of board `PhInventory`: numbers, the two alert lists and the stock list. */
export function PharmacyInventoryStockTab({
  overview,
  loading = false,
  errorMessage = null,
  onRetry,
  filters,
  onFiltersChange,
  page,
  onPageChange,
  canManage,
  onView,
  onRestock,
  onAddMedicine,
}: PharmacyInventoryStockTabProps) {
  const { summary, rows } = overview;
  const filtered = filterMedicines(rows, filters);
  const paged = paginate(filtered, page);
  const filtering =
    filters.search.trim() !== "" || filters.type !== "" || filters.category !== "" || filters.stock !== "all";
  const blank = "—";
  const setFilters = (patch: Partial<InventoryFilters>) => {
    onFiltersChange({ ...filters, ...patch });
    onPageChange(1);
  };
  const hasCategories = overview.categoryOptions.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Total Medicines"
          value={loading ? blank : summary.totalMedicines}
          hint={loading ? "Loading" : `${summary.inStock} in stock now`}
          icon={PillIcon}
          tone="aqua"
        />
        <Kpi
          label="Low Stock"
          value={loading ? blank : summary.lowCount}
          hint={
            loading
              ? "Loading"
              : summary.outCount > 0
                ? `And ${summary.outCount} out of stock`
                : "At or below minimum"
          }
          icon={CircleAlert}
          tone="amber"
        />
        <Kpi
          label="Expiring Soon"
          value={loading ? blank : overview.expiring.length}
          hint={loading ? "Loading" : "Within 90 days"}
          icon={CalendarDays}
          tone="rose"
        />
        <Kpi
          label="Total Value"
          value={loading ? blank : formatRupees(Math.round(overview.totalValue))}
          hint={loading ? "Loading" : "Current stock"}
          icon={Wallet}
          tone="blue"
        />
      </div>

      {!loading && !errorMessage && rows.length > 0 ? (
        <Surface flush as="section" aria-label="Stock alerts">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <div className="flex flex-col px-5 pb-3 pt-5 lg:pr-[22px]">
              <AlertHead
                icon={CircleAlert}
                tone="amber"
                title="Low stock"
                description="At or below the minimum level"
                count={lowStockCount(overview)}
              />
              {overview.lowStock.length === 0 ? (
                <EmptyBlock
                  icon={CircleCheck}
                  title="All stock levels are fine"
                  description="No medicine is at or below its minimum level."
                  className="px-0 py-6"
                />
              ) : (
                <ul className="m-0 mt-1.5 flex list-none flex-col p-0">
                  {overview.lowStock.slice(0, VISIBLE_ALERTS).map((medicine) => (
                    <li
                      key={medicine.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-hair py-[11px] last:border-b-0"
                    >
                      <span className="flex min-w-0 flex-1 basis-[180px] flex-col gap-px">
                        <span className="truncate text-sm font-bold text-ink">{medicine.name}</span>
                        <span className="text-xs font-medium text-ink-muted">{lowStockLine(medicine)}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2.5">
                        <Pill tone={STATUS_TONE[medicine.status]}>{STATUS_LABEL[medicine.status]}</Pill>
                        {canManage ? (
                          <Button
                            variant="soft"
                            className="h-[34px]"
                            onClick={() => onRestock(medicine)}
                            aria-label={`Restock ${medicine.name}`}
                          >
                            <Plus aria-hidden="true" />
                            Restock
                          </Button>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {overview.lowStock.length > VISIBLE_ALERTS ? (
                <MoreButton
                  count={overview.lowStock.length - VISIBLE_ALERTS}
                  label="in the list"
                  onClick={() => {
                    onFiltersChange({ ...EMPTY_FILTERS, stock: "restock" });
                    onPageChange(1);
                  }}
                />
              ) : null}
            </div>

            <div className="flex flex-col border-t border-hair px-5 pb-3 pt-5 lg:border-l lg:border-t-0 lg:pl-[22px]">
              <AlertHead
                icon={CalendarDays}
                tone="rose"
                title="Expiring soon"
                description="Expiry date within the next 90 days"
                count={
                  overview.expiring.length > 0
                    ? `${overview.expiring.length} ${overview.expiring.length === 1 ? "medicine" : "medicines"}`
                    : ""
                }
              />
              {overview.expiring.length === 0 ? (
                <EmptyBlock
                  icon={CircleCheck}
                  title="Nothing expires soon"
                  description="No medicine has an expiry date in the next 90 days."
                  className="px-0 py-6"
                />
              ) : (
                <ul className="m-0 mt-1.5 flex list-none flex-col p-0">
                  {overview.expiring.slice(0, VISIBLE_ALERTS).map((medicine) => {
                    const pill = expiryPill(medicine);
                    return (
                      <li
                        key={medicine.id}
                        className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-hair py-[11px] last:border-b-0"
                      >
                        <span className="flex min-w-0 flex-1 basis-[160px] flex-col gap-px">
                          <span className="truncate text-sm font-bold text-ink">{medicine.name}</span>
                          <span className="text-xs font-medium text-ink-muted">{expiringLine(medicine)}</span>
                        </span>
                        <Pill tone={pill.tone}>{pill.label}</Pill>
                      </li>
                    );
                  })}
                </ul>
              )}
              {overview.expiring.length > VISIBLE_ALERTS ? (
                <MoreButton
                  count={overview.expiring.length - VISIBLE_ALERTS}
                  label="in the list"
                  onClick={() => {
                    onFiltersChange({ ...EMPTY_FILTERS, stock: "expiring" });
                    onPageChange(1);
                  }}
                />
              ) : null}
            </div>
          </div>
        </Surface>
      ) : null}

      <Surface flush as="section" aria-label="Medicine stock list">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-hair px-5 py-4">
          <SearchBox
            value={filters.search}
            onChange={(search) => setFilters({ search })}
            placeholder={
              hasCategories
                ? "Search medicines by name, category or manufacturer"
                : "Search medicines by name, type or manufacturer"
            }
            className="min-w-[220px] flex-1 basis-[280px]"
          />
          {overview.typeOptions.length > 1 ? (
            <Select value={filters.type || ALL} onValueChange={(value) => setFilters({ type: value === ALL ? "" : value })}>
              <SelectTrigger aria-label="Filter by type" className="w-full sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All types</SelectItem>
                {overview.typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {overview.categoryOptions.length > 1 ? (
            <Select
              value={filters.category || ALL}
              onValueChange={(value) => setFilters({ category: value === ALL ? "" : value })}
            >
              <SelectTrigger aria-label="Filter by category" className="w-full sm:w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All categories</SelectItem>
                {overview.categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Select value={filters.stock} onValueChange={(value) => setFilters({ stock: value as StockFilter })}>
            <SelectTrigger aria-label="Filter by stock status" className="w-full sm:w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STOCK_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="p-5" aria-busy="true">
            <SkeletonList items={6} />
          </div>
        ) : errorMessage && rows.length === 0 ? (
          <EmptyBlock
            icon={CircleAlert}
            title="The stock list could not be loaded"
            description={errorMessage}
            action={
              onRetry ? (
                <Button variant="outline" size="md" onClick={onRetry}>
                  Try again
                </Button>
              ) : undefined
            }
          />
        ) : rows.length === 0 ? (
          <EmptyBlock
            icon={PackageSearch}
            title="No medicines in the stock list yet"
            description="Add the medicines the clinic keeps. The doctor can prescribe a medicine once it is saved."
            action={
              canManage ? (
                <Button size="md" onClick={onAddMedicine}>
                  <Plus aria-hidden="true" />
                  Add Medicine
                </Button>
              ) : undefined
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyBlock
            icon={PackageSearch}
            title="No medicine matches"
            description="Try another name or clear the filters."
            action={
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  onFiltersChange(EMPTY_FILTERS);
                  onPageChange(1);
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div role="table" aria-label="Medicines" aria-rowcount={filtered.length}>
              <GridHead
                columns={COLUMNS}
                labels={[
                  "Medicine",
                  hasCategories ? "Category" : "Type",
                  "Expiry",
                  "Stock",
                  "Status",
                  "Price",
                  "Actions",
                ]}
              />
              {paged.items.map((medicine) => {
                const soon = medicine.expiringSoon;
                return (
                  <GridRow key={medicine.id} columns={COLUMNS}>
                    <div role="cell">
                      <CellTitle title={medicine.name} description={medicineSubline(medicine) || undefined} />
                    </div>
                    <div role="cell" className="text-[13px] text-ink-soft">
                      <span className="mr-1.5 text-xs text-ink-muted lg:hidden">{hasCategories ? "Category" : "Type"}</span>
                      {medicine.category || medicine.typeLabel || blank}
                    </div>
                    <div role="cell" className="flex flex-col gap-px">
                      <span
                        className={cn(
                          "inline-flex items-center gap-[5px] whitespace-nowrap text-sm font-bold",
                          soon ? "text-[#e11d48] dark:text-rose-300" : "text-ink",
                        )}
                      >
                        <span className="mr-1 text-xs font-normal text-ink-muted lg:hidden">Expiry</span>
                        {soon ? <CircleAlert className="size-3.5 shrink-0" strokeWidth={2.4} aria-hidden="true" /> : null}
                        {expiryMonthLabel(medicine.expiryDate) || blank}
                        {soon ? <span className="sr-only"> (expiring soon)</span> : null}
                      </span>
                      {medicine.batchNumber ? (
                        <span className="truncate text-xs text-ink-muted">Batch {medicine.batchNumber}</span>
                      ) : null}
                    </div>
                    <div role="cell" className="flex flex-col gap-px">
                      <span
                        className={cn(
                          "whitespace-nowrap text-sm font-bold",
                          medicine.status === "out_of_stock"
                            ? "text-[#e11d48] dark:text-rose-300"
                            : medicine.status === "low_stock"
                              ? "text-[#b45309] dark:text-amber-300"
                              : "text-ink",
                        )}
                      >
                        <span className="mr-1 text-xs font-normal text-ink-muted lg:hidden">Stock</span>
                        {medicine.stock}
                      </span>
                      {medicine.minStock > 0 ? (
                        <span className="whitespace-nowrap text-xs text-ink-muted">Min {medicine.minStock}</span>
                      ) : null}
                    </div>
                    <div role="cell">
                      <Pill tone={STATUS_TONE[medicine.status]}>{STATUS_LABEL[medicine.status]}</Pill>
                    </div>
                    <div role="cell" className="whitespace-nowrap font-bold text-ink">
                      <span className="mr-1 text-xs font-normal text-ink-muted lg:hidden">Price</span>
                      {medicine.price > 0 ? formatRupees(medicine.price) : blank}
                    </div>
                    <div role="cell" className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                      {canManage ? (
                        <Button
                          variant="soft"
                          onClick={() => onRestock(medicine)}
                          aria-label={`Restock ${medicine.name}`}
                        >
                          <Plus aria-hidden="true" />
                          Restock
                        </Button>
                      ) : null}
                      <Button variant="outline" onClick={() => onView(medicine)} aria-label={`View ${medicine.name}`}>
                        <Eye aria-hidden="true" />
                        View
                      </Button>
                    </div>
                  </GridRow>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hair px-5 py-3 text-[13px] text-ink-muted">
              <span aria-live="polite">
                Showing {paged.from}–{paged.to} of {paged.total} {paged.total === 1 ? "medicine" : "medicines"}
                {filtering ? ` (${rows.length} in all)` : ""}
              </span>
              <span className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="h-[34px]"
                  onClick={() => onPageChange(paged.page - 1)}
                  disabled={paged.page <= 1}
                >
                  Previous
                </Button>
                <span>
                  Page {paged.page} of {paged.pageCount}
                </span>
                <Button
                  variant="outline"
                  className="h-[34px]"
                  onClick={() => onPageChange(paged.page + 1)}
                  disabled={paged.page >= paged.pageCount}
                >
                  Next
                </Button>
              </span>
            </div>
          </>
        )}
      </Surface>
    </div>
  );
}
