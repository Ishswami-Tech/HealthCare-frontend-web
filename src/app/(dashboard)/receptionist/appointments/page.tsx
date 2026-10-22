"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DateField,
  FilterChips,
  Pager,
  Pill,
  SearchBox,
  SegTabs,
  Surface,
  TbdPage,
  usePagedRows,
} from "@/components/tbd";
import { ReceptionVisitList } from "@/components/receptionist/ReceptionVisitList";
import { ReceptionRowActions } from "@/components/receptionist/ReceptionRowActions";
import {
  countByStage,
  dayHeading,
  filterByStage,
  RECEPTION_STATUS_FILTERS,
  shiftDayKey,
  type ReceptionStatusFilter,
} from "@/components/receptionist/reception.logic";
import {
  RECEPTION_ROUTES,
  todayKey,
  useReceptionCheckIn,
  useReceptionVisits,
} from "@/components/receptionist/useReceptionDesk";

type RangeKind = "day" | "week";

/**
 * RecAppointments: all appointments of the reception location (in-clinic and video), by day or
 * week. Check in, reschedule or mark a no-show. Reception does not book video
 * visits: patients book those in the app.
 */
export default function ReceptionAppointmentsPage() {
  const today = todayKey();
  const [day, setDay] = useState(today);
  const [range, setRange] = useState<RangeKind>("day");
  const [status, setStatus] = useState<ReceptionStatusFilter>("all");
  const [search, setSearch] = useState("");
  const to = range === "week" ? shiftDayKey(day, 6) : day;
  // Server batch (RECEPTION_VISITS_BATCH rows each) for ranges busier than one batch.
  const [batch, setBatch] = useState({ key: "", page: 1 });
  const batchKey = `${day}|${range}`;
  const batchPage = batch.key === batchKey ? batch.page : 1;

  const { visits, locationName, isLoading, error, refetch, isFetching, total, truncated, batchCount } = useReceptionVisits({
    from: day,
    to,
    page: batchPage,
  });
  const { checkIn, pendingId } = useReceptionCheckIn({ openSuccess: true });

  const counts = useMemo(() => {
    const loaded = countByStage(visits);
    // The "All" chip shows the server total, not just the rows of this batch.
    return truncated ? { ...loaded, all: Math.max(total, loaded.all) } : loaded;
  }, [visits, truncated, total]);
  const shown = useMemo(() => filterByStage(visits, status, search), [visits, status, search]);
  const paging = usePagedRows(shown, 25, { resetKey: `${day}|${range}|${batchPage}|${status}|${search}` });
  const step = range === "week" ? 7 : 1;

  return (
    <TbdPage
      title="Appointments"
      description="Everything booked at your location. Check patients in, reschedule or mark a no-show."
      actions={
        <>
          <Pill tone="clinic">
            <MapPin className="size-3" aria-hidden="true" /> {locationName}
          </Pill>
          <Button asChild size="md">
            <Link href={RECEPTION_ROUTES.walkIn()}>
              <UserPlus aria-hidden="true" /> Walk-in
            </Link>
          </Button>
        </>
      }
    >
      <Surface flush as="section" aria-label="Appointments" className="gap-0">
        <div className="flex flex-col gap-3.5 px-5 pb-3.5 pt-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="outline" size="icon" aria-label="Earlier" onClick={() => setDay(shiftDayKey(day, -step))}>
              <ChevronLeft aria-hidden="true" />
            </Button>
            <DateField id="reception-appointments-day" value={day} onChange={(value) => setDay(value || today)} className="w-[180px]" />
            <Button variant="outline" size="icon" aria-label="Later" onClick={() => setDay(shiftDayKey(day, step))}>
              <ChevronRight aria-hidden="true" />
            </Button>
            {day !== today ? (
              <Button variant="ghost" size="md" onClick={() => setDay(today)}>
                Today
              </Button>
            ) : (
              <Pill tone="green">Today</Pill>
            )}
            <SegTabs
              ariaLabel="Range"
              value={range}
              onChange={setRange}
              options={[
                { value: "day", label: "Day" },
                { value: "week", label: "Week" },
              ]}
              className="ml-auto"
            />
          </div>
          <span className="text-[13px] font-semibold text-ink-soft">
            {range === "week" ? `${dayHeading(day)} – ${dayHeading(to)}` : dayHeading(day)}
            {isFetching && !isLoading ? <span className="ml-2 text-ink-muted">Updating…</span> : null}
          </span>
          {truncated ? (
            <div className="flex flex-wrap items-center gap-2.5 text-[13px] text-ink-muted">
              <span>
                {total} appointments in this range · batch {batchPage} of {batchCount}. Search and filters apply to this batch.
              </span>
              <Button
                variant="outline"
                size="compact"
                disabled={batchPage <= 1}
                onClick={() => setBatch({ key: batchKey, page: batchPage - 1 })}
              >
                Previous batch
              </Button>
              <Button
                variant="outline"
                size="compact"
                disabled={batchPage >= batchCount}
                onClick={() => setBatch({ key: batchKey, page: batchPage + 1 })}
              >
                Next batch
              </Button>
            </div>
          ) : null}
          <SearchBox value={search} onChange={setSearch} placeholder="Search by patient name, phone or appointment ID" />
          <FilterChips
            ariaLabel="Status"
            value={status}
            onChange={setStatus}
            options={RECEPTION_STATUS_FILTERS.map((option) => ({ ...option, count: counts[option.value] }))}
          />
        </div>
        <ReceptionVisitList
          visits={paging.pageRows}
          isLoading={isLoading}
          error={error}
          onRetry={() => void refetch()}
          showDate={range === "week"}
          onCheckIn={(visit) => void checkIn(visit)}
          checkingInId={pendingId}
          renderMore={(visit) => <ReceptionRowActions visit={visit} />}
          emptyTitle="No appointments"
          emptyDescription={search || status !== "all" ? "Nothing matches these filters." : "Nothing is booked at your location for these days."}
        />
        <Pager paging={paging} noun="appointments" hideWhenSinglePage={false} />
      </Surface>
    </TbdPage>
  );
}
