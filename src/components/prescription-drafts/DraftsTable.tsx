"use client";

import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CellTitle, EmptyBlock, GridHead, GridRow, InitialsAvatar, LoadError, Pill, SkeletonRows } from "@/components/tbd";
import type { RxDraft } from "@/types/rx-drafts.types";
import { draftMedicineSummary, draftStatusMeta, draftTimeLabel, isReturned } from "./rx-drafts.logic";

export function DraftStatusPill({ status }: { status: string }) {
  const meta = draftStatusMeta(status);
  return <Pill tone={meta.tone}>{meta.label}</Pill>;
}

const COLUMNS = "minmax(200px,1.3fr) minmax(220px,1.6fr) 70px 150px 110px";

/**
 * Draft list rows: patient, medicines, item count, status, one action.
 * The assistant (AsDrafts) and the doctor (DocDraftReview inbox) pass their own links and labels.
 */
export function DraftsTable({
  drafts,
  loading,
  error,
  onRetry,
  hrefFor,
  actionLabelFor,
  showAuthor = false,
  emptyTitle,
  emptyDescription,
}: {
  drafts: readonly RxDraft[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  hrefFor: (draft: RxDraft) => string;
  actionLabelFor: (draft: RxDraft) => string;
  /** Doctor view: "Prepared by Dr. S. Patil" under the patient. */
  showAuthor?: boolean;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (error) return <LoadError title="The drafts could not be loaded" message="Check your connection and try again." onRetry={onRetry} />;
  if (loading) return <SkeletonRows rows={4} />;
  if (drafts.length === 0) return <EmptyBlock icon={ClipboardCheck} title={emptyTitle} description={emptyDescription} />;

  return (
    <div role="table" aria-label="Prescription drafts">
      <GridHead columns={COLUMNS} labels={["Patient", "Medicines", "Items", "Status", ""]} />
      {drafts.map((draft) => {
        const when = isReturned(draft)
          ? `returned ${draftTimeLabel(draft.returnedAt)}`
          : `saved ${draftTimeLabel(draft.submittedAt)}`;
        const second = [draft.diagnosis, showAuthor && draft.draftedByName ? `by ${draft.draftedByName}` : "", when]
          .filter((part) => part && part.trim())
          .join(" · ");
        return (
          <GridRow key={draft.id} columns={COLUMNS}>
            <CellTitle left={<InitialsAvatar name={draft.patientName} size={36} />} title={draft.patientName || "Patient"} description={second} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm text-ink">{draftMedicineSummary(draft.items)}</span>
              {isReturned(draft) && draft.returnNote ? (
                <span className="truncate text-xs font-semibold text-[#be123c] dark:text-rose-300">Doctor: {draft.returnNote}</span>
              ) : null}
            </div>
            <span className="text-sm font-bold text-ink">{draft.items.length}</span>
            <div>
              <DraftStatusPill status={draft.status} />
            </div>
            <div className="lg:text-right">
              <Button asChild size="compact" variant={isReturned(draft) ? "default" : "outline"}>
                <Link href={hrefFor(draft)}>{actionLabelFor(draft)}</Link>
              </Button>
            </div>
          </GridRow>
        );
      })}
    </div>
  );
}
