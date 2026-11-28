"use client";

import { useState } from "react";
import Link from "next/link";
import { Mic, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterChips, Note, SegTabs, StatTile, Surface, TbdPage } from "@/components/tbd";
import { DraftsTable } from "@/components/prescription-drafts/DraftsTable";
import { countDrafts, filterDrafts, isReturned, type DraftFilter } from "@/components/prescription-drafts/rx-drafts.logic";
import { useClinicContext } from "@/hooks/query/useClinics";
import { usePrescriberDoctor } from "@/hooks/query/usePrescriberDoctor";
import { useRxDrafts } from "@/hooks/query/useRxDrafts";
import { ASSISTANT_ROUTES } from "./assistant-routes";

/** AsDrafts: the assistant's own drafts, waiting for the doctor or returned with changes. */
export function AssistantDraftsScreen() {
  const { clinicId } = useClinicContext();
  const clinic = clinicId || "";
  const { doctorName } = usePrescriberDoctor(clinic);
  const draftsQuery = useRxDrafts(clinic);
  // Recently approved drafts (own, last 30 days; contract 18.9), loaded only when that tab is open.
  const [view, setView] = useState<"OPEN" | "APPROVED">("OPEN");
  const approvedQuery = useRxDrafts(clinic, { status: "APPROVED", days: 30, enabled: view === "APPROVED" });
  const [filter, setFilter] = useState<DraftFilter>("ALL");
  const drafts = draftsQuery.data ?? [];
  const approved = approvedQuery.data ?? [];
  const counts = countDrafts(drafts);
  const doctor = doctorName || "the doctor";

  return (
    <TbdPage
      title="Prescription drafts"
      description={`Drafts you have prepared for ${doctor}. Nothing reaches a patient until the doctor reviews and approves it.`}
      actions={
        <>
          <Button asChild variant="outline" size="md">
            <Link href={ASSISTANT_ROUTES.quickRx()}>
              <Mic />
              Quick Rx
            </Link>
          </Button>
          <Button asChild size="md">
            <Link href={ASSISTANT_ROUTES.prescribe()}>
              <Plus />
              New draft
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatTile value={draftsQuery.isPending ? "–" : counts.awaiting} label="Awaiting doctor" hint="Sent for review" tone="amber" />
        <StatTile value={draftsQuery.isPending ? "–" : counts.returned} label="Changes requested" hint="Needs your edit" tone="rose" />
        <StatTile value={draftsQuery.isPending ? "–" : counts.all} label="Open drafts" hint="Approved drafts leave this list" />
      </div>

      <Surface flush>
        <div className="flex flex-wrap items-center gap-3 border-b border-hair px-5 py-3.5">
          <SegTabs
            ariaLabel="Drafts list"
            value={view}
            onChange={setView}
            options={[
              { value: "OPEN", label: "Open" },
              { value: "APPROVED", label: "Approved (30 days)" },
            ]}
          />
          {view === "OPEN" ? (
            <FilterChips<DraftFilter>
              ariaLabel="Filter drafts"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "ALL", label: "All", count: counts.all },
                { value: "DRAFT", label: "Awaiting doctor", count: counts.awaiting },
                { value: "RETURNED", label: "Changes requested", count: counts.returned },
              ]}
            />
          ) : null}
        </div>
        {view === "OPEN" ? (
          <DraftsTable
            drafts={filterDrafts(drafts, filter)}
            loading={Boolean(clinic) && draftsQuery.isPending}
            error={Boolean(draftsQuery.error) && !draftsQuery.data}
            onRetry={() => void draftsQuery.refetch()}
            hrefFor={(draft) => (isReturned(draft) ? ASSISTANT_ROUTES.returnedDraft(draft.id) : ASSISTANT_ROUTES.draft(draft.id))}
            actionLabelFor={(draft) => (isReturned(draft) ? "Revise" : "Open")}
            emptyTitle={filter === "ALL" ? "No open drafts" : "Nothing in this list"}
            emptyDescription="Prepare a prescription draft for a patient in the clinic; it waits here until the doctor approves it."
          />
        ) : (
          <DraftsTable
            drafts={approved}
            loading={Boolean(clinic) && approvedQuery.isPending}
            error={Boolean(approvedQuery.error) && !approvedQuery.data}
            onRetry={() => void approvedQuery.refetch()}
            hrefFor={(draft) => ASSISTANT_ROUTES.draft(draft.id)}
            actionLabelFor={() => "Open"}
            emptyTitle="No approved drafts"
            emptyDescription="Drafts the doctor approved in the last 30 days show here."
          />
        )}
      </Surface>

      <Note tone="green">
        Approved drafts become prescriptions only after {doctor} approves them. You never see fees or billing details on a prescription.
      </Note>
    </TbdPage>
  );
}
