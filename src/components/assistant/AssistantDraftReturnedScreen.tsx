"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CornerUpLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { InitialsAvatar, LoadError, Note, Pill, SectionTitle, SkeletonRows, Surface, TbdPage } from "@/components/tbd";
import { DraftItemsTable } from "@/components/prescription-drafts/DraftDocument";
import { DraftEditForm } from "@/components/prescription-drafts/DraftEditForm";
import { draftTimeLabel, isReturned, snapshotItems } from "@/components/prescription-drafts/rx-drafts.logic";
import { useDraftEditor } from "@/components/prescription-drafts/useDraftEditor";
import { useClinicContext } from "@/hooks/query/useClinics";
import { usePrescriberDoctor } from "@/hooks/query/usePrescriberDoctor";
import { useResubmitRxDraft, useRxDraft } from "@/hooks/query/useRxDrafts";
import type { RxDraft } from "@/types/rx-drafts.types";
import { ASSISTANT_ROUTES } from "./assistant-routes";

function RevisePanel({ clinicId, draft, doctor }: { clinicId: string; draft: RxDraft; doctor: string }) {
  const router = useRouter();
  const sent = snapshotItems(draft.returnedSnapshot);
  const baseline = sent.length > 0 ? sent : draft.items;
  const editor = useDraftEditor(clinicId, draft, baseline);
  const resubmit = useResubmitRxDraft();
  const [note, setNote] = useState("");
  const noteId = useId();
  const busy = editor.saving || resubmit.isPending;
  // A returned draft goes back only with a change (against what was sent) or a note for the doctor.
  const hasChange = editor.diff.changeCount > 0 || editor.dirty || note.trim().length > 0;
  const resubmitBlocker = hasChange ? null : `Change the draft or add a note for ${doctor} before resubmitting.`;

  const handleResubmit = async () => {
    if (resubmitBlocker) return;
    if (!(await editor.save())) return;
    try {
      await resubmit.mutateAsync({ clinicId, draftId: draft.id, ...(note.trim() ? { note: note.trim() } : {}) });
      router.push(ASSISTANT_ROUTES.draft(draft.id));
    } catch {
      // The mutation hook shows the error.
    }
  };

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Surface className="gap-3">
        <SectionTitle title="What you sent" description={draftTimeLabel(draft.submittedAt)} action={<Pill tone="slate">Read only</Pill>} />
        <DraftItemsTable items={baseline} caption="Medicines you sent" />
        {draft.diagnosis ? <p className="m-0 text-xs text-ink-muted">Diagnosis: {draft.diagnosis}</p> : null}
      </Surface>
      <Surface className="gap-4">
        <SectionTitle title="Your revised draft" description="Only what the doctor asked for. Nothing reaches the patient until it is approved." />
        <DraftEditForm clinicId={clinicId} editor={editor} showChanges />
        <div className="flex flex-col gap-1.5">
          <label htmlFor={noteId} className="text-xs font-bold text-ink-soft">
            Note for {doctor} (required if nothing else changed)
          </label>
          <Textarea
            id={noteId}
            value={note}
            maxLength={500}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What you changed, for example: reduced the dose as asked."
            rows={2}
          />
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button size="md" disabled={busy || Boolean(resubmitBlocker)} title={resubmitBlocker ?? undefined} onClick={() => void handleResubmit()}>
            <Send />
            {resubmit.isPending ? "Resubmitting…" : `Resubmit to ${doctor}`}
          </Button>
          <Button size="md" variant="outline" disabled={busy || !editor.dirty} onClick={() => void editor.save()}>
            {editor.saving ? "Saving…" : "Save draft"}
          </Button>
        </div>
        {resubmitBlocker ? <p className="m-0 text-xs font-semibold text-ink-muted">{resubmitBlocker}</p> : null}
        <p className="m-0 text-xs text-ink-muted">You can resubmit only. {doctor} approves the prescription and completes the visit.</p>
      </Surface>
    </div>
  );
}

/** AsDraftReturned: the doctor's change request next to what was sent, and the revised draft. */
export function AssistantDraftReturnedScreen({ draftId }: { draftId: string }) {
  const { clinicId } = useClinicContext();
  const clinic = clinicId || "";
  const { doctorName } = usePrescriberDoctor(clinic);
  const draftQuery = useRxDraft(clinic, draftId);
  const draft = draftQuery.data;
  const doctor = doctorName || "the doctor";

  return (
    <TbdPage title="Returned draft" backHref={ASSISTANT_ROUTES.drafts} backLabel="All drafts">
      {draftQuery.error && !draft ? (
        <Surface flush>
          <LoadError title="This draft could not be opened" onRetry={() => void draftQuery.refetch()} />
        </Surface>
      ) : !draft ? (
        <Surface flush>
          <SkeletonRows rows={5} />
        </Surface>
      ) : !isReturned(draft) ? (
        <Note tone="green">
          This draft is not waiting for changes any more.{" "}
          <Link className="font-bold underline" href={ASSISTANT_ROUTES.draft(draft.id)}>
            Open the draft
          </Link>
        </Note>
      ) : (
        <>
          <Surface className="gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <InitialsAvatar name={draft.patientName} size={44} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-[11px] font-extrabold uppercase tracking-[1px] text-[#be123c] dark:text-rose-300">
                  Returned, changes asked · {draftTimeLabel(draft.returnedAt)}
                </span>
                <span className="text-lg font-extrabold text-ink">{draft.patientName || "Patient"}</span>
                {draft.diagnosis ? <span className="text-xs text-ink-muted">{draft.diagnosis}</span> : null}
              </div>
              <Button asChild variant="outline" size="md">
                <Link href={ASSISTANT_ROUTES.patient(draft.patientId)}>Open patient record</Link>
              </Button>
            </div>
            <Note tone="rose" icon={CornerUpLeft}>
              <strong className="font-bold">{doctor} asks for changes:</strong> &ldquo;{draft.returnNote || "No note"}&rdquo;
            </Note>
          </Surface>
          <RevisePanel key={draft.id} clinicId={clinic} draft={draft} doctor={doctor} />
        </>
      )}
    </TbdPage>
  );
}
