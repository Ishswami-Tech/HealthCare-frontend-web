"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleAlert, Coins, HandCoins, IndianRupee, RefreshCw, Stethoscope } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { DateField } from "@/components/appointments/manager/ManagerFilters";
import { Button } from "@/components/ui/button";
import { EmptyBlock, Kpi, PageHero, Surface } from "@/components/tbd";
import { useEarningsSplit } from "@/hooks/query/useDoctors";
import {
  currentMonthRange,
  formatInr,
  inclusiveDayCount,
  MAX_EARNINGS_RANGE_DAYS,
  type EarningsRange,
} from "@/lib/utils/earnings-range";
import { DoctorFeesCard } from "./DoctorFeesCard";
import { DoctorSplitTable } from "./DoctorSplitTable";
import { PaidNotCompletedTable } from "./PaidNotCompletedTable";
import { asEarningsSplit } from "./earnings-split.logic";

/**
 * Earnings split for SUPER_ADMIN (/super-admin/earnings) and CLINIC_ADMIN (/clinic-admin/earnings):
 * gross, doctor share and convenience fee, who has paid but not been completed, and the fixed
 * doctor fees. Never rendered for a doctor.
 */
export function AdminEarningsContent() {
  // Set after mount so the server and the browser agree on "today".
  const [range, setRange] = useState<EarningsRange>({ from: "", to: "" });
  useEffect(() => setRange(currentMonthRange()), []);

  const rangeInvalid = Boolean(range.from && range.to && range.from > range.to);
  const dayCount = range.from && range.to && !rangeInvalid ? inclusiveDayCount(range.from, range.to) : null;
  const rangeTooLong = dayCount !== null && dayCount > MAX_EARNINGS_RANGE_DAYS;
  // An impossible range is not sent: the route would answer 400.
  const { data, isPending, error, refetch } = useEarningsSplit(
    rangeInvalid || rangeTooLong ? { from: "", to: "" } : range,
  );
  const split = useMemo(() => asEarningsSplit(data), [data]);
  const loading = !range.from || (isPending && !error);

  return (
    <DashboardPageShell>
      <PageHero
        eyebrow="Earnings"
        title="Earnings split"
        description="Gross paid, the doctors' share and the convenience fee for completed paid video consultations. Refunds are taken off."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <DateField
              value={range.from}
              placeholder="From"
              ariaLabel="From date"
              onChange={(from) => {
                // Clearing a day would switch the query off for good; keep the last valid day.
                if (from) setRange((previous) => ({ ...previous, from }));
              }}
            />
            <DateField
              value={range.to}
              placeholder="To"
              ariaLabel="To date"
              onChange={(to) => {
                if (to) setRange((previous) => ({ ...previous, to }));
              }}
            />
          </div>
        }
      />

      {rangeInvalid ? (
        <Surface>
          <EmptyBlock
            icon={CircleAlert}
            tone="amber"
            title="Check the dates"
            description="The first day must come before the last day."
          />
        </Surface>
      ) : rangeTooLong ? (
        <Surface>
          <EmptyBlock
            icon={CircleAlert}
            tone="amber"
            title="Pick a shorter range"
            description={`Earnings can be shown for up to ${MAX_EARNINGS_RANGE_DAYS} days at a time.`}
          />
        </Surface>
      ) : error ? (
        <Surface role="alert">
          <EmptyBlock
            icon={CircleAlert}
            tone="rose"
            title="The earnings split is not available right now"
            description="It could not be loaded. Try again in a moment."
            action={
              <Button size="md" variant="outline" onClick={() => void refetch()}>
                <RefreshCw aria-hidden="true" />
                Try again
              </Button>
            }
          />
        </Surface>
      ) : loading ? (
        <Surface>
          <span className="sr-only" role="status">
            Loading earnings…
          </span>
          <div className="h-20 animate-pulse rounded-2xl bg-well" aria-hidden="true" />
        </Surface>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <Kpi label="Gross" value={formatInr(split.totals.grossAmount)} icon={IndianRupee} tone="mint" />
            <Kpi label="Doctor share" value={formatInr(split.totals.doctorShareAmount)} icon={HandCoins} tone="blue" />
            <Kpi
              label="Convenience fee"
              value={formatInr(split.totals.convenienceFeeAmount)}
              icon={Coins}
              tone="amber"
            />
            <Kpi label="Consultations" value={split.totals.consultations} icon={Stethoscope} tone="mint" />
          </div>
          <DoctorSplitTable doctors={split.doctors} />
          <PaidNotCompletedTable rows={split.paidNotCompleted} />
          <DoctorFeesCard settings={split.feeSettings} />
        </>
      )}
    </DashboardPageShell>
  );
}
