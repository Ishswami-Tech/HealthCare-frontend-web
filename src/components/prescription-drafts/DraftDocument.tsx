import type { ReactNode } from "react";
import { Kv, Surface } from "@/components/tbd";
import type { RxDraft, RxDraftItem } from "@/types/rx-drafts.types";
import { draftTimeLabel } from "./rx-drafts.logic";

/** Medicines of a draft as a read-only table (#, medicine, dose, frequency, duration, timing, qty). */
export function DraftItemsTable({ items, caption }: { items: readonly RxDraftItem[]; caption?: ReactNode }) {
  if (items.length === 0) {
    return <p className="m-0 rounded-2xl border border-dashed border-line px-4 py-5 text-center text-sm text-ink-muted">No medicines in this draft.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-hair text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted">
            <th className="px-3.5 py-2.5">#</th>
            <th className="px-3.5 py-2.5">Medicine</th>
            <th className="px-3.5 py-2.5">Dose</th>
            <th className="px-3.5 py-2.5">Freq.</th>
            <th className="px-3.5 py-2.5">Duration</th>
            <th className="px-3.5 py-2.5">Timing</th>
            <th className="px-3.5 py-2.5 text-right">Qty</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id || index} className="border-b border-hair last:border-b-0">
              <td className="px-3.5 py-2.5 text-ink-muted">{index + 1}</td>
              <td className="px-3.5 py-2.5 font-bold text-ink">{item.medicineName || "Medicine"}</td>
              <td className="px-3.5 py-2.5 text-ink">{item.dosage || "-"}</td>
              <td className="px-3.5 py-2.5 text-ink">{item.frequency || "-"}</td>
              <td className="px-3.5 py-2.5 text-ink">{item.duration || "-"}</td>
              <td className="px-3.5 py-2.5 text-ink">{item.instructions || "-"}</td>
              <td className="px-3.5 py-2.5 text-right font-bold text-ink">{item.quantity ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The draft as a prescription sheet, watermarked "Draft – not valid" until the doctor approves.
 * Used by the assistant preview and the doctor's review.
 */
export function DraftDocument({ draft, doctorName }: { draft: RxDraft; doctorName?: string }) {
  const approved = String(draft.status).toUpperCase() === "PENDING" || Boolean(draft.approvedAt);
  return (
    <Surface as="article" className="relative gap-5 overflow-hidden p-6" aria-label="Prescription draft">
      {!approved ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-6 top-6 rotate-[-8deg] rounded-lg border-2 border-dashed border-[#fca5a5] px-3 py-1 text-xs font-extrabold uppercase tracking-[1px] text-[#be123c] dark:border-rose-800 dark:text-rose-300"
        >
          Draft – not valid
        </span>
      ) : null}
      <div className="flex flex-col gap-0.5 border-b border-hair pb-4">
        <span className="text-[11px] font-extrabold uppercase tracking-[1.2px] text-brand">Prescription</span>
        <h2 className="m-0 text-lg font-extrabold text-ink">{doctorName || "Treating doctor"}</h2>
        <span className="text-xs text-ink-muted">
          {draft.prescriptionNumber ? `${draft.prescriptionNumber} · ` : ""}
          {draft.draftedByName ? `Prepared by ${draft.draftedByName} (assistant)` : "Prepared by the assistant"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kv label="Patient" value={draft.patientName || "Patient"} />
        <Kv label="Saved" value={draftTimeLabel(draft.submittedAt) || "-"} />
        <Kv label="Diagnosis" value={draft.diagnosis || "Not written yet"} strong={Boolean(draft.diagnosis)} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-extrabold text-ink">Rx · Medicines</span>
        <DraftItemsTable items={draft.items} caption="Medicines" />
      </div>
      {draft.notes ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-ink-muted">Advice</span>
          <p className="m-0 whitespace-pre-line text-sm text-ink">{draft.notes}</p>
        </div>
      ) : null}
      <p className="m-0 border-t border-hair pt-4 text-xs text-ink-muted">
        {approved
          ? `Approved by ${doctorName || "the doctor"}${draft.approvedAt ? ` · ${draftTimeLabel(draft.approvedAt)}` : ""}.`
          : `Draft for doctor review only. Not a valid prescription until ${doctorName || "the doctor"} approves it. The patient and the pharmacy cannot see it.`}
      </p>
    </Surface>
  );
}
