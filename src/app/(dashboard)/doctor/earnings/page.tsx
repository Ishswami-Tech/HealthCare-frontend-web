"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CircleAlert, IndianRupee, RefreshCw, Stethoscope } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { DateField } from "@/components/appointments/manager/ManagerFilters";
import { Button } from "@/components/ui/button";
import { EmptyBlock, Kpi, ListRow, PageHero, SectionTitle, Surface } from "@/components/tbd";
import { useMyDoctorEarnings } from "@/hooks/query/useDoctors";
import { formatDateInIST, formatISODateInIST } from "@/lib/utils/date-time";
import { asEarnings, formatInr } from "./earnings.logic";

type Range = { from: string; to: string };

/** This month so far, in IST: the 1st up to today. */
function currentMonthRange(): Range {
  const today = formatISODateInIST(new Date());
  return { from: `${today.slice(0, 8)}01`, to: today };
}

export default function DoctorEarnings() {
  // Set after mount so the server and the browser agree on "today".
  const [range, setRange] = useState<Range>({ from: "", to: "" });
  useEffect(() => setRange(currentMonthRange()), []);

  const { data, isPending, error, refetch } = useMyDoctorEarnings(range);
  const earnings = useMemo(() => asEarnings(data), [data]);
  const rangeInvalid = Boolean(range.from && range.to && range.from > range.to);
  const loading = !range.from || (isPending && !error);

  return (
    <DashboardPageShell>
      <PageHero
        eyebrow="Doctor Earnings"
        title="Earnings"
        description="Paid consultations booked with you, by visit day. Refunds are taken off."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <DateField
              value={range.from}
              placeholder="From"
              ariaLabel="From date"
              onChange={(from) => setRange((previous) => ({ ...previous, from }))}
            />
            <DateField
              value={range.to}
              placeholder="To"
              ariaLabel="To date"
              onChange={(to) => setRange((previous) => ({ ...previous, to }))}
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
      ) : error ? (
        <Surface>
          <EmptyBlock
            icon={CircleAlert}
            tone="rose"
            title="Earnings are not available right now"
            description="They could not be loaded. Try again in a moment."
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
          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            <Kpi label="Total earned" value={formatInr(earnings.total)} icon={IndianRupee} tone="mint" />
            <Kpi label="Paid consultations" value={earnings.consultations} icon={Stethoscope} tone="blue" />
          </div>
          <Surface as="section" aria-label="Earnings by day">
            <SectionTitle icon={CalendarDays} title="By day" />
            {earnings.daily.length === 0 ? (
              <EmptyBlock
                icon={IndianRupee}
                title="No paid consultations in this period"
                description="Pick other dates to see earlier visits."
              />
            ) : (
              <div className="flex flex-col">
                {earnings.daily.map((day) => (
                  <ListRow
                    key={day.date}
                    title={formatDateInIST(day.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    description={`${day.consultations} ${day.consultations === 1 ? "consultation" : "consultations"}`}
                    right={<span className="text-sm font-extrabold text-ink">{formatInr(day.total)}</span>}
                  />
                ))}
              </div>
            )}
          </Surface>
        </>
      )}
    </DashboardPageShell>
  );
}
