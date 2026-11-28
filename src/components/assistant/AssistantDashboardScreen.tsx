"use client";

import Link from "next/link";
import { Activity, ClipboardCheck, ClipboardPen, Package, PackageCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyBlock, InitialsAvatar, ListRow, LiveTag, MiniStat, PageHero, Pill, SectionTitle, SkeletonRows, Surface } from "@/components/tbd";
import { DraftStatusPill } from "@/components/prescription-drafts/DraftsTable";
import { draftMedicineSummary, draftTimeLabel, isReturned } from "@/components/prescription-drafts/rx-drafts.logic";
import { useRxDrafts } from "@/hooks/query/useRxDrafts";
import { useAuth } from "@/hooks/auth/useAuth";
import { AssistantAppointmentsTable } from "./AssistantAppointmentsTable";
import { assistantDayCounts } from "./assistant-day.logic";
import { ASSISTANT_ROUTES } from "./assistant-routes";
import { useAssistantDay } from "./useAssistantDay";

const TODAY_ROWS = 7;

function greeting(now: Date): string {
  const hour = Number(now.toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

const QUICK_ACTIONS = [
  { label: "Prepare a prescription draft", href: ASSISTANT_ROUTES.prescribe(), icon: ClipboardPen },
  { label: "Patient directory", href: ASSISTANT_ROUTES.patients, icon: Users },
  { label: "Clinic medicine stock", href: ASSISTANT_ROUTES.stock, icon: Package },
  { label: "Dispense from clinic stock", href: ASSISTANT_ROUTES.dispense, icon: PackageCheck },
] as const;

/** AsDashboard: today at a glance for the assistant doctor. No billing anywhere. */
export function AssistantDashboardScreen() {
  const { session } = useAuth();
  const firstName = String(session?.user?.firstName || session?.user?.name || "").split(" ")[0] ?? "";
  const day = useAssistantDay();
  const drafts = useRxDrafts(day.clinicId);
  const openDrafts = drafts.data ?? [];
  const counts = assistantDayCounts(day.appointments, day.queue);
  const next = day.queue.find((row) => row.stage === "IN_QUEUE") ?? null;
  const doctor = day.doctor.doctorName || "the doctor";
  const todayLabel = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" });

  return (
    <div className="flex min-w-0 flex-col gap-5 pt-1">
      <PageHero
        eyebrow={todayLabel}
        title={`${greeting(new Date())}${firstName ? `, ${firstName}` : ""}`}
        description={`Supporting ${doctor}. Prepare drafts and dispense from clinic stock; the doctor approves every prescription and completes each visit.`}
      >
        <div className="flex flex-wrap gap-2.5">
          <MiniStat value={day.appointmentsLoading ? "–" : counts.today} label="Today" />
          <MiniStat value={day.queueLoading ? "–" : counts.inQueue} label="In queue" />
          <MiniStat value={day.queueLoading ? "–" : counts.withDoctor} label="With doctor" />
          <MiniStat value={drafts.isPending ? "–" : openDrafts.length} label="Drafts" />
        </div>
      </PageHero>

      {next ? (
        <Surface className="flex-row flex-wrap items-center gap-4">
          <InitialsAvatar name={next.patientName} size={48} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[11px] font-extrabold uppercase tracking-[1px] text-brand">
              Next in queue{next.token ? ` · Token ${next.token}` : ""}
            </span>
            <span className="text-lg font-extrabold text-ink">{next.patientName}</span>
            <span className="text-xs text-ink-muted">
              Checked in{next.waitMinutes !== null ? ` ${next.waitMinutes} min ago` : ""}. In the queue for {doctor}; you can prepare the Rx draft now.
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {next.patientId ? (
              <Button asChild size="md">
                <Link href={ASSISTANT_ROUTES.prescribe({ patientId: next.patientId, ...(next.appointmentId ? { appointmentId: next.appointmentId } : {}) })}>Prepare Rx draft</Link>
              </Button>
            ) : null}
            {next.patientId ? (
              <Button asChild size="md" variant="outline">
                <Link href={ASSISTANT_ROUTES.patient(next.patientId)}>Open EHR</Link>
              </Button>
            ) : null}
          </div>
        </Surface>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Surface flush>
          <div className="px-5 pt-5">
            <SectionTitle
              title="Today's appointments"
              count={day.appointments.length}
              action={
                <Button asChild size="compact" variant="outline">
                  <Link href={ASSISTANT_ROUTES.appointments}>All appointments</Link>
                </Button>
              }
            />
          </div>
          <div className="mt-3">
            <AssistantAppointmentsTable
              appointments={day.appointments.slice(0, TODAY_ROWS)}
              loading={day.appointmentsLoading}
              error={day.appointmentsError}
              onRetry={day.refetch}
              emptyDescription="Nothing is booked for today."
            />
          </div>
        </Surface>

        <div className="flex flex-col gap-5">
          <Surface className="gap-2">
            <SectionTitle
              icon={Activity}
              title="Live queue"
              action={<LiveTag>Live</LiveTag>}
              description="In-clinic patients, in order."
            />
            {day.queueLoading ? (
              <SkeletonRows rows={3} />
            ) : day.queue.length === 0 ? (
              <p className="m-0 text-sm text-ink-muted">No one is in the queue.</p>
            ) : (
              <div>
                {day.queue.slice(0, 6).map((row) => (
                  <ListRow
                    key={row.key}
                    {...(row.appointmentId ? { href: ASSISTANT_ROUTES.visit(row.appointmentId) } : {})}
                    left={<span className="w-12 shrink-0 font-mono text-xs font-bold text-ink-soft">{row.token || `#${row.position}`}</span>}
                    title={row.patientName}
                    description={row.stage === "WITH_DOCTOR" ? "With doctor" : "Checked in"}
                    right={row.waitMinutes !== null ? <span className="text-xs font-semibold text-ink-muted">{row.waitMinutes} min</span> : null}
                  />
                ))}
              </div>
            )}
            <Button asChild size="compact" variant="outline" className="self-start">
              <Link href={ASSISTANT_ROUTES.queue}>Open queue</Link>
            </Button>
          </Surface>

          <Surface className="gap-2">
            <SectionTitle icon={ClipboardCheck} title={`Drafts for ${doctor}`} count={openDrafts.length} />
            {drafts.isPending ? (
              <SkeletonRows rows={2} />
            ) : openDrafts.length === 0 ? (
              <EmptyBlock title="No open drafts" className="py-4" />
            ) : (
              <div>
                {openDrafts.slice(0, 4).map((draft) => (
                  <ListRow
                    key={draft.id}
                    href={isReturned(draft) ? ASSISTANT_ROUTES.returnedDraft(draft.id) : ASSISTANT_ROUTES.draft(draft.id)}
                    title={draft.patientName || "Patient"}
                    description={`${draftMedicineSummary(draft.items, 2)} · ${draftTimeLabel(isReturned(draft) ? draft.returnedAt : draft.submittedAt)}`}
                    right={<DraftStatusPill status={draft.status} />}
                  />
                ))}
              </div>
            )}
            <Button asChild size="compact" variant="outline" className="self-start">
              <Link href={ASSISTANT_ROUTES.drafts}>View all drafts</Link>
            </Button>
          </Surface>

          <Surface className="gap-2">
            <SectionTitle title="Quick actions" />
            <div className="grid grid-cols-1 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3 text-sm font-bold text-ink hover:bg-mint-soft"
                >
                  <action.icon className="size-[18px] text-brand" aria-hidden="true" />
                  {action.label}
                </Link>
              ))}
            </div>
          </Surface>
        </div>
      </div>
      <p className="m-0 text-xs text-ink-muted">
        <Pill tone="slate">Note</Pill> Video visits do not use a queue; the join link opens 15 minutes before the slot.
      </p>
    </div>
  );
}
