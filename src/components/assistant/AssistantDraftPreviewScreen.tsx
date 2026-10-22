"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, PencilLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, LoadError, Note, SectionTitle, SkeletonRows, Surface, TbdPage } from "@/components/tbd";
import { DraftApprovalSteps } from "@/components/prescription-drafts/DraftApprovalSteps";
import { DraftDocument } from "@/components/prescription-drafts/DraftDocument";
import { DraftEditForm } from "@/components/prescription-drafts/DraftEditForm";
import { DraftStatusPill } from "@/components/prescription-drafts/DraftsTable";
import { isAwaitingDoctor, isReturned } from "@/components/prescription-drafts/rx-drafts.logic";
import { useDraftEditor } from "@/components/prescription-drafts/useDraftEditor";
import { useClinicContext } from "@/hooks/query/useClinics";
import { usePrescriberDoctor } from "@/hooks/query/usePrescriberDoctor";
import { useDiscardRxDraft, useRxDraft } from "@/hooks/query/useRxDrafts";
import type { RxDraft } from "@/types/rx-drafts.types";
import { ASSISTANT_ROUTES } from "./assistant-routes";

function EditPanel({ clinicId, draft, onDone }: { clinicId: string; draft: RxDraft; onDone: () => void }) {
  const editor = useDraftEditor(clinicId, draft);
  return (
    <Surface className="gap-4">
      <SectionTitle title="Edit draft" description="The doctor sees your latest version." />
      <DraftEditForm clinicId={clinicId} editor={editor} />
      <div className="flex flex-wrap gap-2.5">
        <Button size="md" disabled={editor.saving} onClick={() => void editor.save().then((saved) => saved && onDone())}>
          {editor.saving ? "Saving…" : "Save draft"}
        </Button>
        <Button size="md" variant="outline" disabled={editor.saving} onClick={onDone}>
          Cancel
        </Button>
      </div>
    </Surface>
  );
}

/** AsRxDraftPreview: the draft as a sheet, its approval status, edit and discard. */
export function AssistantDraftPreviewScreen({ draftId }: { draftId: string }) {
  const router = useRouter();
  const { clinicId } = useClinicContext();
  const clinic = clinicId || "";
  const { doctorName } = usePrescriberDoctor(clinic);
  const draftQuery = useRxDraft(clinic, draftId);
  const discard = useDiscardRxDraft();
  const [editing, setEditing] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const draft = draftQuery.data;
  const doctor = doctorName || "the doctor";

  return (
    <TbdPage title="Draft prescription" backHref={ASSISTANT_ROUTES.drafts} backLabel="All drafts" actions={draft ? <DraftStatusPill status={draft.status} /> : null}>
      {draftQuery.error && !draft ? (
        <Surface flush>
          <LoadError title="This draft could not be opened" message="It may have been discarded, or the link is wrong." onRetry={() => void draftQuery.refetch()} />
        </Surface>
      ) : !draft ? (
        <Surface flush>
          <SkeletonRows rows={5} />
        </Surface>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-5">
            {isAwaitingDoctor(draft) ? (
              <Note tone="amber" icon={FileText}>
                <strong className="font-bold">Awaiting {doctor}&apos;s approval.</strong> This preview is not valid, cannot be printed or shared, and the patient cannot see it until the doctor approves it.
              </Note>
            ) : null}
            {isReturned(draft) ? (
              <Note tone="rose">
                <strong className="font-bold">{doctor} asked for changes:</strong> {draft.returnNote || "see the note"}{" "}
                <Link className="font-bold underline" href={ASSISTANT_ROUTES.returnedDraft(draft.id)}>
                  Revise the draft
                </Link>
              </Note>
            ) : null}
            {editing ? <EditPanel key={draft.id} clinicId={clinic} draft={draft} onDone={() => setEditing(false)} /> : <DraftDocument draft={draft} doctorName={doctorName} />}
          </div>
          <aside className="flex flex-col gap-5">
            <Surface className="gap-3">
              <SectionTitle title="Draft actions" />
              {isAwaitingDoctor(draft) ? (
                <Button size="md" variant="outline" onClick={() => setEditing(true)} disabled={editing}>
                  <PencilLine />
                  Edit draft
                </Button>
              ) : null}
              {isReturned(draft) ? (
                <Button asChild size="md">
                  <Link href={ASSISTANT_ROUTES.returnedDraft(draft.id)}>Revise and resubmit</Link>
                </Button>
              ) : null}
              <Button asChild size="md" variant="outline">
                <Link href={ASSISTANT_ROUTES.patient(draft.patientId)}>View EHR</Link>
              </Button>
              {isAwaitingDoctor(draft) || isReturned(draft) ? (
                <Button size="md" variant="danger" onClick={() => setConfirmDiscard(true)}>
                  <Trash2 />
                  Discard draft
                </Button>
              ) : null}
              <p className="m-0 text-xs text-ink-muted">Print, PDF and WhatsApp are available after the doctor approves.</p>
            </Surface>
            <Surface className="gap-3">
              <SectionTitle title="Approval status" />
              <DraftApprovalSteps draft={draft} doctorName={doctorName} />
            </Surface>
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        title="Discard this draft?"
        description="The doctor will no longer see it. This cannot be undone."
        confirmLabel="Discard draft"
        busyLabel="Discarding…"
        tone="danger"
        busy={discard.isPending}
        onConfirm={() =>
          void discard
            .mutateAsync({ clinicId: clinic, draftId })
            .then(() => router.push(ASSISTANT_ROUTES.drafts))
            .catch(() => setConfirmDiscard(false))
        }
      />
    </TbdPage>
  );
}
