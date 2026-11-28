"use client";

import Link from "next/link";
import { CircleCheck, Printer, RotateCcw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InitialsAvatar, LoadError, Note, Pill, SectionTitle, SkeletonRows, SoftCard, Surface, TbdPage } from "@/components/tbd";
import { draftTimeLabel } from "@/components/prescription-drafts/rx-drafts.logic";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useDirectDispense, useUndoDirectDispense } from "@/hooks/query/useDirectDispense";
import { usePrescriberDoctor } from "@/hooks/query/usePrescriberDoctor";
import { useCountdown } from "@/hooks/utils/useCountdown";
import { expiryLabel, type DirectDispense } from "@/lib/dispense/direct-dispense";
import { ASSISTANT_ROUTES } from "./assistant-routes";

function UndoBanner({ dispense }: { dispense: DirectDispense }) {
  const countdown = useCountdown(dispense.canUndo ? dispense.undoUntil : null);
  const undo = useUndoDirectDispense();
  if (!dispense.canUndo || countdown.isExpired) return null;
  return (
    <Note tone="amber" icon={Undo2} className="[&>div]:flex-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>
          <strong className="font-bold">Wrong patient or quantity? Undo within {countdown.formatted}.</strong> Undo puts every unit back into clinic stock. After that, ask the doctor or the pharmacist for a correction.
        </span>
        <Button variant="outline" disabled={undo.isPending} onClick={() => undo.mutate({ id: dispense.id })}>
          <RotateCcw />
          {undo.isPending ? "Undoing…" : "Undo hand-over"}
        </Button>
      </div>
    </Note>
  );
}

/** AsDispenseSuccess: what was handed over, the undo window, and where to go next. */
export function AssistantDispenseSuccessScreen({ dispenseId }: { dispenseId: string }) {
  const { clinicId } = useClinicContext();
  const clinic = clinicId || "";
  const { doctorName } = usePrescriberDoctor(clinic);
  const dispenseQuery = useDirectDispense(clinic, dispenseId);
  const dispense = dispenseQuery.data;
  const reversed = String(dispense?.status ?? "").toUpperCase() === "REVERSED";
  const units = dispense?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <TbdPage title={reversed ? "Hand-over undone" : "Handed over"} backHref={ASSISTANT_ROUTES.dispense} backLabel="Dispense">
      {dispenseQuery.error && !dispense ? (
        <Surface flush>
          <LoadError title="This hand-over could not be opened" onRetry={() => void dispenseQuery.refetch()} />
        </Surface>
      ) : !dispense ? (
        <Surface flush>
          <SkeletonRows rows={4} />
        </Surface>
      ) : (
        <>
          <SoftCard className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[1.2px] text-brand">
              <CircleCheck className="size-4" aria-hidden="true" />
              {reversed ? "Undone" : `Hand-over completed · ${draftTimeLabel(dispense.createdAt)}`}
            </span>
            <h2 className="m-0 text-2xl font-extrabold text-ink">
              {reversed ? `The medicines for ${dispense.patientName} went back to stock` : `Medicines handed to ${dispense.patientName}`}
            </h2>
            <p className="m-0 text-sm text-ink-muted">
              {dispense.items.length} {dispense.items.length === 1 ? "item" : "items"} · {units} {units === 1 ? "unit" : "units"}
              {reversed ? " returned to clinic stock" : " left clinic stock"} · visible to {doctorName || "the doctor"}
            </p>
          </SoftCard>

          {reversed ? null : <UndoBanner dispense={dispense} />}

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Surface className="gap-3">
              <div className="flex items-center gap-3">
                <InitialsAvatar name={dispense.patientName} size={40} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-bold text-ink">{dispense.patientName}</span>
                  <span className="truncate text-xs text-ink-muted">
                    Dispensed by {dispense.dispensedByName} · {dispense.prescriptionId ? "linked prescription" : "no linked prescription"}
                  </span>
                </span>
                {reversed ? <Pill tone="rose">Undone</Pill> : <Pill tone="green">Handed over</Pill>}
              </div>
              <ul className="m-0 flex list-none flex-col divide-y divide-hair rounded-2xl border border-line p-0">
                {dispense.items.map((item) => (
                  <li key={item.medicineId} className="flex flex-wrap items-center gap-3 px-3.5 py-3">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-bold text-ink">{item.medicineName}</span>
                      <span className="truncate text-xs text-ink-muted">
                        {item.batches.map((batch) => `Batch ${batch.lotNumber}${expiryLabel(batch.expiryDate) ? ` · Exp ${expiryLabel(batch.expiryDate)}` : ""}`).join(" · ") ||
                          "Batch recorded by the system"}
                      </span>
                    </span>
                    <span className="text-sm font-extrabold text-ink">× {item.quantity}</span>
                  </li>
                ))}
              </ul>
              {dispense.note ? <p className="m-0 text-sm text-ink-soft">Note: {dispense.note}</p> : null}
            </Surface>
            <aside className="flex flex-col gap-5">
              <Surface className="gap-3">
                <SectionTitle title="What happens next" />
                <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-5 text-sm text-ink">
                  <li>Billing picks up the hand-over; reception collects. You never enter amounts.</li>
                  <li>{doctorName || "The doctor"} sees the dispense in the patient&apos;s history.</li>
                  <li>Stock counts update for everyone at once.</li>
                </ol>
              </Surface>
              <div className="flex flex-col gap-2.5">
                <Button asChild size="md">
                  <Link href={ASSISTANT_ROUTES.dispense}>Dispense to next patient</Link>
                </Button>
                <Button asChild size="md" variant="outline">
                  <Link href={ASSISTANT_ROUTES.queue}>Back to queue</Link>
                </Button>
                <Button asChild size="md" variant="outline">
                  <Link href={ASSISTANT_ROUTES.stock}>View clinic stock</Link>
                </Button>
                <Button size="md" variant="outline" onClick={() => window.print()}>
                  <Printer />
                  Print hand-over slip
                </Button>
              </div>
            </aside>
          </div>
        </>
      )}
    </TbdPage>
  );
}
