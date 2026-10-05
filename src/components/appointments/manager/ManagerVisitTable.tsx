"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Pill, Surface } from "@/components/tbd";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VisitAvatar, VisitTypeChip } from "./ManagerVisitCard";
import type { ManagerPayRenderer, ManagerVisit, ManagerVisitActions } from "./types";

const PAST_COLUMNS = "@3xl:grid-cols-[minmax(0,1fr)_180px_180px_110px]";
const CLOSED_COLUMNS = "@3xl:grid-cols-[minmax(0,1fr)_120px_120px_110px_150px]";
const ROW = "flex flex-col gap-2.5 border-b border-hair py-3 text-ink last:border-b-0 @3xl:grid @3xl:items-center @3xl:gap-4";

function VisitCell({ visit, description }: { visit: ManagerVisit; description: string }) {
  return (
    <span className="flex min-w-0 items-center gap-3.5">
      <VisitAvatar visit={visit} size={44} />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-bold text-ink">{visit.visitTitle}</span>
        <span className="line-clamp-2 text-xs text-ink-muted @3xl:line-clamp-1">{description}</span>
      </span>
    </span>
  );
}

function who(visit: ManagerVisit): string {
  return visit.title === visit.doctorName ? visit.doctorName : `${visit.title} · ${visit.doctorName}`;
}

function Head({ columns, labels }: { columns: string; labels: string[] }) {
  return (
    // Column labels for wide screens. Every row says the same things in its own text.
    <div
      aria-hidden="true"
      className={cn("hidden gap-4 border-b border-hair pb-2 text-xs font-semibold text-ink-muted @3xl:grid", columns)}
    >
      {labels.map((label, index) => (
        <span key={index}>{label}</span>
      ))}
    </div>
  );
}

/** Completed visits: what it was, video or clinic, when, and a link to the summary. */
export function ManagerPastTable({ visits, footer }: { visits: ManagerVisit[]; footer?: ReactNode }) {
  return (
    <Surface className="gap-0 pb-2">
      <Head columns={PAST_COLUMNS} labels={["Visit", "Type", "Date", ""]} />
      {visits.map((visit) => {
        const cells = (
          <>
            <VisitCell visit={visit} description={who(visit)} />
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5 @3xl:contents">
              <span>
                <VisitTypeChip visit={visit} short />
              </span>
              <span className="text-[13px] text-ink-muted">{visit.dateLabel}</span>
              {visit.summaryHref ? (
                <span className="ml-auto inline-flex items-center justify-end gap-1 text-[13px] font-bold text-brand @3xl:ml-0">
                  {visit.summaryLabel}
                  <ChevronRight className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
                </span>
              ) : (
                <span aria-hidden="true" />
              )}
            </span>
          </>
        );
        return visit.summaryHref ? (
          <Link
            key={visit.id}
            href={visit.summaryHref}
            className={cn(
              ROW,
              PAST_COLUMNS,
              "rounded-sm hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
            )}
          >
            {cells}
          </Link>
        ) : (
          <div key={visit.id} className={cn(ROW, PAST_COLUMNS)}>
            {cells}
          </div>
        );
      })}
      {footer}
    </Surface>
  );
}

/** Cancelled, missed and expired visits. An expired visit has no actions. */
export function ManagerClosedTable({
  visits,
  actions,
  renderPay,
  footer,
}: {
  visits: ManagerVisit[];
  actions: ManagerVisitActions;
  renderPay: ManagerPayRenderer;
  footer?: ReactNode;
}) {
  return (
    <Surface className="gap-0 pb-2">
      <Head columns={CLOSED_COLUMNS} labels={["Visit", "Type", "Date", "Status", ""]} />
      {visits.map((visit) => (
        <div key={visit.id} className={cn(ROW, CLOSED_COLUMNS)}>
          <VisitCell visit={visit} description={[who(visit), visit.closedNote].filter(Boolean).join(" · ")} />
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5 @3xl:contents">
            <span>
              <VisitTypeChip visit={visit} short />
            </span>
            <span className="text-[13px] text-ink-muted">{visit.dateLabel}</span>
            <span>
              <Pill tone={visit.statusTone}>{visit.statusLabel}</Pill>
            </span>
            <span className="ml-auto flex justify-end @3xl:ml-0">
              {visit.canRetryPayment ? (
                renderPay(visit, "retry")
              ) : visit.canBookAgain ? (
                <Button variant="outline" onClick={() => actions.onBookAgain(visit.id)}>
                  Book again
                </Button>
              ) : null}
            </span>
          </span>
        </div>
      ))}
      {footer}
    </Surface>
  );
}
