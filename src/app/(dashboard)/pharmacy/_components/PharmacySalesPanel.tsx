"use client";

import { Activity, CircleAlert, FileText, IndianRupee, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonList } from "@/components/ui/loading";
import { EmptyBlock, GridHead, GridRow, IconBox, Kpi, Note, SegTabs, Surface } from "@/components/tbd";
import type { PharmacySalesGroupBy, PharmacySalesReport } from "@/types/pharmacy.types";
import { formatRupees, todayKey } from "./pharmacy-inventory.logic";
import { keyLabel } from "./pharmacy-stock.logic";

const BAR_AREA = 140;
const DAY_COLUMNS = "minmax(0, 1fr) 140px 140px 140px";
const MEDICINE_COLUMNS = "minmax(0, 1fr) 140px 140px 140px";

export interface SalesRange {
  from: string;
  to: string;
  groupBy: PharmacySalesGroupBy;
}

export interface PharmacySalesPanelProps {
  range: SalesRange;
  onRangeChange: (range: SalesRange) => void;
  /** Why the chosen range cannot be requested; null when it can. */
  rangeProblem: string | null;
  report: PharmacySalesReport | undefined;
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

/**
 * Sales report of the pharmacy: what was dispensed between two days, with revenue from paid pharmacy
 * invoices. `GET /pharmacy/sales` answers it; the totals, the daily bars and the table are all the
 * server's numbers.
 */
export function PharmacySalesPanel({
  range,
  onRangeChange,
  rangeProblem,
  report,
  loading = false,
  errorMessage = null,
  onRetry,
}: PharmacySalesPanelProps) {
  const rows = report?.breakdown ?? [];
  const peak = Math.max(1, ...rows.map((row) => row.revenue));
  const byDay = (report?.groupBy ?? range.groupBy) === "day";

  return (
    <Surface as="section" className="gap-4" aria-label="Sales report">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <IconBox icon={IndianRupee} tone="mint" size={38} />
        <span className="flex min-w-0 flex-1 basis-[200px] flex-col gap-px">
          <h2 className="m-0 text-base font-bold text-ink">Sales report</h2>
          <span className="text-[13px] font-medium text-ink-muted">
            Medicines handed over, with revenue from paid pharmacy invoices.
          </span>
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-bold text-ink-soft">
          From
          <Input
            type="date"
            value={range.from}
            max={range.to || todayKey()}
            onChange={(event) => onRangeChange({ ...range, from: event.target.value })}
            className="w-[168px]"
            aria-invalid={rangeProblem ? true : undefined}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-ink-soft">
          To
          <Input
            type="date"
            value={range.to}
            min={range.from || undefined}
            max={todayKey()}
            onChange={(event) => onRangeChange({ ...range, to: event.target.value })}
            className="w-[168px]"
            aria-invalid={rangeProblem ? true : undefined}
          />
        </label>
        <SegTabs
          ariaLabel="Group sales by"
          value={range.groupBy}
          onChange={(groupBy) => onRangeChange({ ...range, groupBy })}
          options={[
            { value: "day", label: "By day" },
            { value: "medicine", label: "By medicine" },
          ]}
        />
      </div>

      {rangeProblem ? (
        <Note tone="amber" icon={CircleAlert}>
          <span role="alert">{rangeProblem}</span>
        </Note>
      ) : loading ? (
        <div aria-busy="true">
          <SkeletonList items={4} />
        </div>
      ) : errorMessage ? (
        <EmptyBlock
          icon={CircleAlert}
          title="The sales report could not be loaded"
          description={errorMessage}
          action={
            onRetry ? (
              <Button variant="outline" size="md" onClick={onRetry}>
                Try again
              </Button>
            ) : undefined
          }
        />
      ) : report ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Kpi
              label="Prescriptions dispensed"
              value={report.totals.prescriptions}
              hint={`${keyLabel(report.from)} to ${keyLabel(report.to)}`}
              icon={FileText}
              tone="video"
            />
            <Kpi label="Units dispensed" value={report.totals.quantity} hint="All medicines" icon={Package} tone="amber" />
            <Kpi
              label="Revenue"
              value={formatRupees(report.totals.revenue)}
              hint="Paid pharmacy invoices"
              icon={IndianRupee}
              tone="mint"
            />
          </div>

          {rows.length === 0 ? (
            <EmptyBlock
              icon={Activity}
              title="Nothing was dispensed in this period"
              description="Pick other dates, or come back once prescriptions are handed over."
            />
          ) : (
            <>
              {byDay && rows.length > 1 ? (
                <div className="flex flex-col gap-2">
                  <ul
                    className="m-0 flex h-[176px] list-none items-end gap-1 overflow-x-auto border-b border-line p-0"
                    aria-label="Revenue per day"
                  >
                    {rows.map((row) => (
                      <li
                        key={row.date}
                        className="flex min-w-[10px] flex-1 flex-col items-center justify-end"
                        title={`${keyLabel(row.date ?? "")}: ${formatRupees(row.revenue)}`}
                      >
                        <span
                          className="w-full max-w-8 rounded-t bg-[#047857] dark:bg-emerald-500"
                          style={{ height: Math.max(3, Math.round((row.revenue / peak) * BAR_AREA)) }}
                          aria-hidden="true"
                        />
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between text-xs text-ink-muted" aria-hidden="true">
                    <span>{keyLabel(rows[0]?.date ?? report.from)}</span>
                    <span>{keyLabel(rows[rows.length - 1]?.date ?? report.to)}</span>
                  </div>
                </div>
              ) : null}

              <div role="table" aria-label={byDay ? "Sales by day" : "Sales by medicine"} className="rounded-[14px] border border-line">
                <GridHead
                  columns={byDay ? DAY_COLUMNS : MEDICINE_COLUMNS}
                  labels={[byDay ? "Day" : "Medicine", "Prescriptions", "Units", byDay ? "Revenue" : "Estimated revenue"]}
                />
                {rows.map((row, index) => (
                  <GridRow key={row.date ?? row.medicineId ?? index} columns={byDay ? DAY_COLUMNS : MEDICINE_COLUMNS}>
                    <span className="truncate font-bold text-ink">
                      {byDay ? keyLabel(row.date ?? "") : (row.medicineName ?? "Medicine")}
                    </span>
                    <span className="text-ink-soft">
                      <span className="mr-1.5 text-xs text-ink-muted lg:hidden">Prescriptions</span>
                      {row.prescriptions}
                    </span>
                    <span className="text-ink-soft">
                      <span className="mr-1.5 text-xs text-ink-muted lg:hidden">Units</span>
                      {row.quantity}
                    </span>
                    <span className="font-bold text-ink">
                      <span className="mr-1.5 text-xs font-medium text-ink-muted lg:hidden">Revenue</span>
                      {formatRupees(row.revenue)}
                    </span>
                  </GridRow>
                ))}
              </div>
              {!byDay ? (
                <p className="m-0 text-xs text-ink-muted">
                  Revenue per medicine is an estimate: units dispensed times the medicine&apos;s current price. The total above
                  comes from paid invoices.
                </p>
              ) : null}
            </>
          )}
        </>
      ) : null}
    </Surface>
  );
}
