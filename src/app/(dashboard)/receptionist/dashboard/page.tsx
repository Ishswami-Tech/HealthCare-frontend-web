"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ClipboardCheck, ListOrdered, MapPin, UserPlus, Users, Wallet, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  IconBox,
  InitialsAvatar,
  ListRow,
  LoadErrorNote,
  Pill,
  SectionTitle,
  StatTile,
  Surface,
  TbdPage,
} from "@/components/tbd";
import { useAuth } from "@/hooks/auth/useAuth";
import { ReceptionVisitList, ReceptionStatus } from "@/components/receptionist/ReceptionVisitList";
import { NoClinicalRecordsNote } from "@/components/receptionist/ReceptionNotes";
import { ReceptionDeskBoard } from "@/components/receptionist/ReceptionDeskBoard";
import { countByStage, hasArrived, minutesSince, startsInLabel } from "@/components/receptionist/reception.logic";
import {
  RECEPTION_ROUTES,
  todayKey,
  useReceptionCheckIn,
  useReceptionLocation,
  useReceptionVisits,
} from "@/components/receptionist/useReceptionDesk";

/** Quick actions of the desk. No "Book video visit": patients book video visits themselves. */
const QUICK_ACTIONS: Array<{ href: string; title: string; text: string; icon: LucideIcon }> = [
  { href: RECEPTION_ROUTES.checkIn, title: "Check in", text: "Today's in-clinic patients", icon: ClipboardCheck },
  { href: RECEPTION_ROUTES.walkIn(), title: "Walk-in", text: "Add someone to the queue", icon: UserPlus },
  { href: RECEPTION_ROUTES.register, title: "Register patient", text: "New patient, signs in by OTP", icon: Users },
  { href: RECEPTION_ROUTES.collect(), title: "Collect payment", text: "Plan status and open bills", icon: Wallet },
];

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** RecDashboard: today at the reception location: arrivals, the queue, the doctor and what is next. */
export default function ReceptionDashboardPage() {
  const { session } = useAuth();
  const today = todayKey();
  const { visits, locationName, isLoading, error, refetch, truncated } = useReceptionVisits({ from: today });
  const { desk } = useReceptionLocation();
  const { checkIn, pendingId } = useReceptionCheckIn({ openSuccess: true });
  const now = Date.now();

  const loadedCounts = useMemo(() => countByStage(visits), [visits]);
  // A day busier than one list batch: the in-clinic board's server counts are the true numbers
  // (video visits are added from what was loaded).
  const counts = useMemo(() => {
    if (!truncated || !desk) return loadedCounts;
    const video = countByStage(visits.filter((visit) => visit.kind === "video"));
    return {
      ...loadedCounts,
      all: (desk.total ?? desk.visits.length) + video.all,
      checked_in: desk.counts.checkedIn + video.checked_in,
      with_doctor: desk.counts.withDoctor + video.with_doctor,
      completed: desk.counts.completed + video.completed,
      missed: desk.counts.noShow + video.missed,
    };
  }, [truncated, desk, visits, loadedCounts]);
  // Cancelled and expired visits are not expected any more. On a busy day the total is the desk
  // board's server count, which the loaded cancelled count does not describe, so it stays as sent.
  const expectedToday = Math.max(0, counts.all - (truncated && desk ? 0 : counts.cancelled));
  const clinicVisits = visits.filter((visit) => visit.kind === "clinic");
  const videoVisits = visits.filter((visit) => visit.kind === "video");
  const waiting = visits
    .filter((visit) => visit.stage === "checked_in")
    .sort((left, right) => Number(right.isUrgent) - Number(left.isUrgent) || (left.checkedInAtMs ?? 0) - (right.checkedInAtMs ?? 0));
  const withDoctor = visits.filter((visit) => visit.stage === "with_doctor");
  const arrivingNext = clinicVisits.filter((visit) => visit.canCheckIn).slice(0, 5);
  const checkedInCount = clinicVisits.filter(hasArrived).length;
  const longest = waiting.reduce<{ name: string; minutes: number } | null>((max, visit) => {
    const minutes = minutesSince(visit.checkedInAtMs, now);
    return minutes !== null && (!max || minutes > max.minutes) ? { name: visit.patientName, minutes } : max;
  }, null);
  const firstName = String(session?.user?.firstName ?? session?.user?.name ?? "").split(" ")[0];

  return (
    <TbdPage
      title={`${greeting(new Date().getHours())}${firstName ? `, ${firstName}` : ""}`}
      description="Today at the front desk. Video visits are joined online and never appear in the queue."
      actions={
        <Pill tone="clinic">
          <MapPin className="size-3" aria-hidden="true" /> {locationName}
        </Pill>
      }
    >
      {error && visits.length > 0 ? (
        <LoadErrorNote title="The list may be out of date." message={error.message} onRetry={() => void refetch()} />
      ) : null}
      {truncated ? (
        <p className="m-0 text-[13px] text-ink-muted">
          A very busy day: the counts are the clinic&apos;s totals, the lists below show the first {visits.length} visits.{" "}
          <Link href={RECEPTION_ROUTES.appointments} className="font-bold text-brand">
            Page through all appointments
          </Link>
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile value={expectedToday} label="Expected today" href={RECEPTION_ROUTES.appointments} />
        <StatTile value={counts.checked_in} label="Waiting" tone="amber" href={RECEPTION_ROUTES.queue} />
        <StatTile value={counts.with_doctor} label="With doctor" tone="blue" />
        <StatTile value={counts.completed} label="Done" tone="brand" />
        <StatTile value={counts.missed} label="Missed" tone="rose" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatTile
          value={`${checkedInCount} of ${clinicVisits.length}`}
          label="Checked in"
          hint="In-clinic visits today"
        />
        <StatTile
          value={longest ? `${longest.minutes} min` : "—"}
          label="Longest wait"
          hint={longest ? longest.name : "Nobody waiting"}
          tone={longest && longest.minutes >= 30 ? "rose" : "ink"}
        />
        <StatTile
          value={videoVisits.length}
          label="Video visits"
          hint={`${videoVisits.filter((visit) => visit.stage === "completed").length} done · joined online`}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Surface flush as="section" aria-label="Waiting now" className="gap-0">
            <div className="px-5 pb-2 pt-5">
              <SectionTitle
                title="Waiting now"
                count={waiting.length}
                description="Checked in and waiting for the doctor. Urgent patients go first, then the longest wait."
                action={
                  <Button asChild variant="outline" size="md">
                    <Link href={RECEPTION_ROUTES.queue}>
                      <ListOrdered aria-hidden="true" /> Open queue
                    </Link>
                  </Button>
                }
              />
            </div>
            {waiting.length === 0 && !isLoading ? (
              <p className="m-0 px-5 pb-5 text-[13px] text-ink-muted">Nobody is waiting right now.</p>
            ) : (
              <div className="px-5 pb-2">
                {waiting.map((visit) => (
                  <ListRow
                    key={visit.id}
                    href={RECEPTION_ROUTES.appointment(visit.id)}
                    left={<InitialsAvatar name={visit.patientName} size={36} />}
                    title={visit.patientName}
                    description={[visit.tokenLabel, visit.checkedInLabel ? `checked in ${visit.checkedInLabel}` : ""].filter(Boolean).join(" · ")}
                    right={
                      <span className="flex items-center gap-2">
                        <span className="text-xs font-bold text-ink-muted">{minutesSince(visit.checkedInAtMs, now) ?? 0} min</span>
                        <ReceptionStatus visit={visit} />
                      </span>
                    }
                  />
                ))}
              </div>
            )}
            {withDoctor.length > 0 ? (
              <div className="border-t border-hair px-5 py-3">
                <span className="text-xs font-extrabold uppercase tracking-[0.6px] text-ink-muted">With the doctor now</span>
                {withDoctor.map((visit) => (
                  <ListRow
                    key={visit.id}
                    border={false}
                    left={<InitialsAvatar name={visit.patientName} size={34} />}
                    title={visit.patientName}
                    description={[visit.doctorName, visit.tokenLabel].filter(Boolean).join(" · ")}
                    right={<Pill tone="blue">In progress</Pill>}
                  />
                ))}
              </div>
            ) : null}
          </Surface>

          <Surface flush as="section" aria-label="Arriving next" className="gap-0">
            <div className="px-5 pb-2 pt-5">
              <SectionTitle
                title="Arriving next"
                description="In-clinic visits that have not checked in yet."
                action={
                  <Link href={RECEPTION_ROUTES.checkIn} className="text-[13px] font-bold text-brand">
                    All check-ins
                  </Link>
                }
              />
            </div>
            <ReceptionVisitList
              visits={arrivingNext}
              isLoading={isLoading}
              error={error}
              onRetry={() => void refetch()}
              showType={false}
              onCheckIn={(visit) => void checkIn(visit)}
              checkingInId={pendingId}
              emptyTitle="Nobody left to arrive"
              emptyDescription="Every in-clinic patient for today has checked in."
              renderMore={(visit) => (
                <span className="text-xs font-semibold text-ink-muted">{startsInLabel(visit.startsAtMs, now)}</span>
              )}
            />
          </Surface>

          <ReceptionDeskBoard />
        </div>

        <div className="flex flex-col gap-5">
          <Surface as="section" aria-label="Quick actions">
            <SectionTitle title="Quick actions" />
            <div className="flex flex-col gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 rounded-[14px] border border-line px-3.5 py-3 transition-colors hover:bg-mint-soft"
                >
                  <IconBox icon={action.icon} tone="mint" size={38} />
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-bold text-ink">{action.title}</span>
                    <span className="text-xs text-ink-muted">{action.text}</span>
                  </span>
                </Link>
              ))}
            </div>
          </Surface>
          <NoClinicalRecordsNote />
        </div>
      </div>
    </TbdPage>
  );
}
