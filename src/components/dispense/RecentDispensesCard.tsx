"use client";

import { Button } from "@/components/ui/button";
import { EmptyBlock, InitialsAvatar, LoadError, Pill, SectionTitle, SkeletonRows, Surface } from "@/components/tbd";
import { formatClock } from "@/app/(dashboard)/doctor/dashboard/_components/doctor-dashboard.logic";
import { formatDateInIST, formatDateKeyInIST } from "@/lib/utils/date-time";
import { dispenseItemsLabel, type DirectDispense } from "@/lib/dispense/direct-dispense";

function whenLabel(iso: string, todayKey: string): string {
  if (!iso) return "";
  return formatDateKeyInIST(iso) === todayKey ? formatClock(iso) : formatDateInIST(iso, { day: "2-digit", month: "short" });
}

/** Recent hand-overs: who dispensed, final (doctor) or visible to the doctor (assistant), undo inside the window. */
export function RecentDispensesCard({
  rows,
  loading,
  failed,
  onRetry,
  todayKey,
  currentUserId,
  onUndo,
  undoPending,
}: {
  rows: readonly DirectDispense[];
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  todayKey: string;
  currentUserId: string;
  onUndo: (row: DirectDispense) => void;
  undoPending: boolean;
}) {
  return (
    <Surface>
      <SectionTitle title="Recent dispenses" />
      {loading ? (
        <SkeletonRows rows={3} />
      ) : failed ? (
        <LoadError title="Recent dispenses could not be loaded" onRetry={onRetry} />
      ) : rows.length === 0 ? (
        <EmptyBlock title="No dispenses yet" className="py-5" />
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {rows.map((row) => {
            const byAssistant = row.dispensedByRole === "ASSISTANT_DOCTOR";
            const reversed = row.status === "REVERSED";
            return (
              <li key={row.id} className="flex items-start gap-3 border-b border-hair py-2.5 last:border-b-0">
                <InitialsAvatar name={row.patientName} size={34} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold text-ink">{row.patientName}</span>
                    <span className="shrink-0 text-xs text-ink-muted">{whenLabel(row.createdAt, todayKey)}</span>
                  </span>
                  <span className="text-xs text-ink-soft">{dispenseItemsLabel(row.items)}</span>
                  <span className="text-xs text-ink-muted">
                    By {row.dispensedByName || "staff"}
                    {byAssistant ? " (assistant)" : ""}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    {reversed ? (
                      <Pill tone="rose">Undone</Pill>
                    ) : (
                      <>
                        <Pill tone={byAssistant ? "blue" : "green"}>{byAssistant ? "Visible to doctor" : "Final"}</Pill>
                        <Pill tone="slate">Sent to billing</Pill>
                      </>
                    )}
                    {!reversed && row.canUndo && row.dispensedByUserId === currentUserId ? (
                      <Button size="sm" variant="outline" disabled={undoPending} onClick={() => onUndo(row)}>
                        Undo
                      </Button>
                    ) : null}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Surface>
  );
}
