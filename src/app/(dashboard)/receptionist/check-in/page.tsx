"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Activity, MapPin, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FilterChips,
  InitialsAvatar,
  ListRow,
  LoadError,
  Note,
  Pill,
  SearchBox,
  SectionTitle,
  SegTabs,
  SkeletonRows,
  Surface,
  TbdPage,
} from "@/components/tbd";
import { useCheckInHistory } from "@/hooks/query/useAppointments";
import { formatDateTimeLabel } from "@/lib/utils/date-time";
import { ReceptionVisitList } from "@/components/receptionist/ReceptionVisitList";
import { checkInRows, hasArrived, readCheckInHistory, type CheckInFilter } from "@/components/receptionist/reception.logic";
import {
  RECEPTION_ROUTES,
  todayKey,
  useReceptionCheckIn,
  useReceptionVisits,
} from "@/components/receptionist/useReceptionDesk";

/** Earlier check-ins (QR scans and desk check-ins), newest first. */
function CheckInHistory() {
  const history = useCheckInHistory();
  const entries = useMemo(() => readCheckInHistory(history.data).slice(0, 100), [history.data]);
  if (history.isPending) return <SkeletonRows rows={4} />;
  if (history.error && entries.length === 0) {
    return (
      <LoadError
        title="Check-in history could not be loaded"
        message={history.error instanceof Error ? history.error.message : undefined}
        onRetry={() => void history.refetch()}
      />
    );
  }
  if (entries.length === 0) return <p className="m-0 px-5 pb-5 text-[13px] text-ink-muted">No check-ins yet.</p>;
  return (
    <div className="px-5 pb-2">
      {entries.map((entry) => (
        <ListRow
          key={entry.id}
          href={RECEPTION_ROUTES.appointment(entry.id)}
          left={<InitialsAvatar name={entry.patientName} size={34} />}
          title={entry.patientName}
          description={[entry.doctorName, entry.locationName].filter(Boolean).join(" · ")}
          right={
            <span className="flex items-center gap-2">
              <Pill tone={entry.methodLabel === "QR" ? "green" : "slate"}>{entry.methodLabel}</Pill>
              <span className="text-xs font-semibold text-ink-muted">
                {entry.checkedInAtMs ? formatDateTimeLabel(new Date(entry.checkedInAtMs)) : ""}
              </span>
            </span>
          }
        />
      ))}
    </div>
  );
}

/**
 * RecCheckIn: every in-clinic appointment of the reception location today, checked in or not,
 * with one-click "Check in" (the same confirmation as the patient's QR scan). No QR scanning at the
 * desk; video visits are joined online and never need a check-in.
 */
export default function ReceptionCheckInPage() {
  const today = todayKey();
  const { visits, locationName, isLoading, error, refetch } = useReceptionVisits({ from: today });
  const { checkIn, pendingId } = useReceptionCheckIn({ openSuccess: true });
  const [filter, setFilter] = useState<CheckInFilter>("waiting");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"today" | "history">("today");

  const all = useMemo(() => checkInRows(visits, today, "all"), [visits, today]);
  const rows = useMemo(() => checkInRows(visits, today, filter, search), [visits, today, filter, search]);
  const arrived = all.filter(hasArrived);
  const recent = useMemo(
    () =>
      arrived
        .filter((visit) => visit.checkedInAtMs !== null)
        .sort((left, right) => (right.checkedInAtMs ?? 0) - (left.checkedInAtMs ?? 0))
        .slice(0, 6),
    [arrived],
  );

  return (
    <TbdPage
      title="Check-in"
      description="Every in-clinic appointment at your location today. Check a patient in with one click: they join the queue straight away."
      actions={
        <>
          <Pill tone="clinic">
            <MapPin className="size-3" aria-hidden="true" /> {locationName}
          </Pill>
          <Button asChild variant="outline" size="md">
            <Link href={RECEPTION_ROUTES.walkIn()}>
              <UserPlus aria-hidden="true" /> Walk-in
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Surface flush as="section" aria-label="Check-in" className="gap-0">
          <div className="px-5 pt-5">
            <SegTabs
              ariaLabel="View"
              value={view}
              onChange={setView}
              options={[
                { value: "today", label: "Today", count: all.length },
                { value: "history", label: "History" },
              ]}
            />
          </div>
          {view === "history" ? (
            <div className="pt-3">
              <CheckInHistory />
            </div>
          ) : (
          <>
          <div className="flex flex-col gap-3.5 px-5 pb-3.5 pt-5">
            <SectionTitle
              title="Today's expected patients"
              count={all.length}
              description="In-clinic visits only. Patients who scanned the clinic QR show as checked in."
            />
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <FilterChips
                ariaLabel="Check-in status"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "waiting", label: "Not checked in", count: all.length - arrived.length },
                  { value: "done", label: "Checked in", count: arrived.length },
                  { value: "all", label: "All", count: all.length },
                ]}
              />
              <SearchBox
                value={search}
                onChange={setSearch}
                placeholder="Search name, phone or booking id"
                className="md:max-w-[320px]"
              />
            </div>
          </div>
          <ReceptionVisitList
            visits={rows}
            isLoading={isLoading}
            error={error}
            onRetry={() => void refetch()}
            showType={false}
            onCheckIn={(visit) => void checkIn(visit)}
            checkingInId={pendingId}
            emptyTitle={filter === "waiting" ? "Everyone has checked in" : "No in-clinic visits"}
            emptyDescription={
              filter === "waiting"
                ? "There is nobody left to check in for today."
                : "No in-clinic appointments match at this location today."
            }
          />
          </>
          )}
        </Surface>

        <div className="flex flex-col gap-5">
          <Surface as="section" aria-label="Recent check-ins">
            <SectionTitle
              title="Recent check-ins"
              description="Today so far."
              action={
                <Link href={RECEPTION_ROUTES.queue} className="text-[13px] font-bold text-brand">
                  Open queue
                </Link>
              }
            />
            {recent.length === 0 ? (
              <p className="m-0 text-[13px] text-ink-muted">Nobody has checked in yet today.</p>
            ) : (
              <div>
                {recent.map((visit) => (
                  <ListRow
                    key={visit.id}
                    href={RECEPTION_ROUTES.appointment(visit.id)}
                    left={<InitialsAvatar name={visit.patientName} size={34} />}
                    title={visit.patientName}
                    description={[visit.doctorName, visit.tokenLabel ? `token ${visit.tokenLabel}` : ""].filter(Boolean).join(" · ")}
                    right={<span className="text-xs font-semibold text-ink-muted">{visit.checkedInLabel}</span>}
                  />
                ))}
              </div>
            )}
          </Surface>
          <Note tone="blue" icon={Activity}>
            Video visits do not appear here. The patient joins online at the visit time.
          </Note>
        </div>
      </div>
    </TbdPage>
  );
}
