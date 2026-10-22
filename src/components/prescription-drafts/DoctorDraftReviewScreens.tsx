"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CornerUpLeft, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InitialsAvatar, LoadError, Note, ReasonDialog, SectionTitle, SkeletonRows, StatTile, Surface, TbdPage } from "@/components/tbd";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useApproveRxDraft, useReturnRxDraft, useRxDraft, useRxDrafts } from "@/hooks/query/useRxDrafts";
import type { RxDraft } from "@/types/rx-drafts.types";
import { DOCTOR_DRAFT_ROUTES } from "@/components/assistant/assistant-routes";
import { DraftApprovalSteps } from "./DraftApprovalSteps";
import { DraftDocument } from "./DraftDocument";
import { DraftEditForm } from "./DraftEditForm";
import { DraftStatusPill, DraftsTable } from "./DraftsTable";
import { draftTimeLabel, isAwaitingDoctor } from "./rx-drafts.logic";
import { useDraftEditor } from "./useDraftEditor";

const RETURN_PRESETS = ["Change the dose", "Change the duration", "Add timing (before / after food)", "Remove a medicine"];

/** DocDraftReview inbox: the assistant's drafts waiting for the doctor. */
export function DoctorDraftsInboxScreen() {
  const { clinicId } = useClinicContext();
  const clinic = clinicId || "";
  const draftsQuery = useRxDrafts(clinic, { status: "DRAFT" });
  const drafts = draftsQuery.data ?? [];

  return (
    <TbdPage title="Rx drafts" description="Prescriptions your assistant prepared. Nothing reaches the patient or the pharmacy until you approve.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatTile value={draftsQuery.isPending ? "–" : drafts.length} label="Awaiting your review" tone="amber" />
      </div>
      <Surface flush>
        <DraftsTable
          drafts={drafts}
          loading={Boolean(clinic) && draftsQuery.isPending}
          error={Boolean(draftsQuery.error) && !draftsQuery.data}
          onRetry={() => void draftsQuery.refetch()}
          hrefFor={(draft) => DOCTOR_DRAFT_ROUTES.review(draft.id)}
          actionLabelFor={() => "Review"}
          showAuthor
          emptyTitle="No drafts to review"
          emptyDescription="When your assistant prepares a prescription draft it appears here."
        />
      </Surface>
    </TbdPage>
  );
}

function ReviewActions({ clinicId, draft, onReturn }: { clinicId: string; draft: RxDraft; onReturn: () => void }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const editor = useDraftEditor(clinicId, draft);
  const approve = useApproveRxDraft();
  const busy = editor.saving || approve.isPending;

  const handleApprove = async () => {
    if (editing && !(await editor.save())) return;
    try {
      await approve.mutateAsync({ clinicId, draftId: draft.id });
      router.push(DOCTOR_DRAFT_ROUTES.inbox);
    } catch {
      // The mutation hook shows the error.
    }
  };

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        {editing ? (
          <Surface className="gap-4">
            <SectionTitle title="Your version" description="Change lines, add or remove medicines, then approve." />
            <DraftEditForm clinicId={clinicId} editor={editor} showChanges />
          </Surface>
        ) : (
          <DraftDocument draft={draft} />
        )}
      </div>
      <aside className="flex flex-col gap-5">
        <Surface className="gap-3">
          <SectionTitle title="Your decision" />
          <Button size="xl" disabled={busy} onClick={() => void handleApprove()}>
            <Check />
            {approve.isPending ? "Approving…" : editing && editor.dirty ? "Approve with my changes" : "Approve draft as is"}
          </Button>
          {editing ? (
            <Button size="md" variant="outline" disabled={busy} onClick={() => setEditing(false)}>
              Discard my changes
            </Button>
          ) : (
            <Button size="md" variant="outline" disabled={busy} onClick={() => setEditing(true)}>
              <PencilLine />
              Change before approving
            </Button>
          )}
          <Button size="md" variant="danger" disabled={busy} onClick={onReturn}>
            <CornerUpLeft />
            Send back to {draft.draftedByName || "the assistant"}
          </Button>
          <p className="m-0 text-xs text-ink-muted">Approving sends the prescription to the pharmacy. The assistant sees a returned draft in their list and can resubmit.</p>
        </Surface>
        <Surface className="gap-3">
          <SectionTitle title="Approval status" />
          <DraftApprovalSteps draft={draft} doctorName="you" />
        </Surface>
      </aside>
    </div>
  );
}

/** DocDraftReview: one draft, approve as is, approve with changes, or send back with a note. */
export function DoctorDraftReviewScreen({ draftId }: { draftId: string }) {
  const router = useRouter();
  const { clinicId } = useClinicContext();
  const clinic = clinicId || "";
  const draftQuery = useRxDraft(clinic, draftId);
  const returnDraft = useReturnRxDraft();
  const [returning, setReturning] = useState(false);
  const draft = draftQuery.data;

  return (
    <TbdPage title="Review draft" backHref={DOCTOR_DRAFT_ROUTES.inbox} backLabel="Rx drafts" actions={draft ? <DraftStatusPill status={draft.status} /> : null}>
      {draftQuery.error && !draft ? (
        <Surface flush>
          <LoadError title="This draft could not be opened" onRetry={() => void draftQuery.refetch()} />
        </Surface>
      ) : !draft ? (
        <Surface flush>
          <SkeletonRows rows={5} />
        </Surface>
      ) : (
        <>
          <Surface className="flex-row flex-wrap items-center gap-3">
            <InitialsAvatar name={draft.patientName} size={44} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-lg font-extrabold text-ink">{draft.patientName || "Patient"}</span>
              <span className="text-xs text-ink-muted">
                Prepared by {draft.draftedByName || "the assistant"} · {draftTimeLabel(draft.submittedAt)}
              </span>
            </div>
            <Button asChild variant="outline" size="md">
              <Link href={`/doctor/patients/${encodeURIComponent(draft.patientId)}`}>Open EHR</Link>
            </Button>
          </Surface>
          {draft.resubmitNote ? (
            <Note tone="blue">
              <strong className="font-bold">Resubmitted with a note:</strong> &ldquo;{draft.resubmitNote}&rdquo;
            </Note>
          ) : null}
          {isAwaitingDoctor(draft) ? (
            <ReviewActions key={draft.id} clinicId={clinic} draft={draft} onReturn={() => setReturning(true)} />
          ) : (
            <>
              <Note tone="green">This draft has already been handled. It is no longer waiting for your review.</Note>
              <DraftDocument draft={draft} />
            </>
          )}
        </>
      )}

      <ReasonDialog
        open={returning}
        onClose={() => setReturning(false)}
        title="Send the draft back"
        description="Say what to change. The assistant sees your note in their drafts and can resubmit."
        label="What should change"
        presets={RETURN_PRESETS}
        confirmLabel="Return to assistant"
        busyLabel="Sending…"
        busy={returnDraft.isPending}
        onConfirm={(note) =>
          void returnDraft
            .mutateAsync({ clinicId: clinic, draftId, note: note.slice(0, 500) })
            .then(() => router.push(DOCTOR_DRAFT_ROUTES.inbox))
            .catch(() => undefined)
        }
      />
    </TbdPage>
  );
}
