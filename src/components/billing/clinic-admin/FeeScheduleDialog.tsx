"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogActions, DialogBody, DialogError, DialogShell, Note } from "@/components/tbd";
import { feeSchedulePatch, slugCode, type FeeScheduleItem } from "@/lib/utils/clinic-settings-sections";

interface Row {
  label: string;
  detail: string;
  amount: string;
}

const toRows = (items: FeeScheduleItem[]): Row[] =>
  items.length > 0
    ? items.map((item) => ({ label: item.label, detail: item.detail ?? "", amount: String(item.amount) }))
    : [{ label: "", detail: "", amount: "" }];

/**
 * Edits the clinic fee schedule (`settings.billingSettings.feeSchedule`). The list feeds the
 * "Services & fees" chips of a new invoice. Only the clinic admin opens it.
 */
export function FeeScheduleDialog({
  open,
  onClose,
  items,
  onSave,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  items: FeeScheduleItem[];
  onSave: (patch: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}) {
  return (
    <DialogShell open={open} onClose={onClose} busy={saving} title="Service & procedure fees" description="Extra services offered when you raise an invoice. In-clinic consultations are covered by the patient's monthly plan." width={620}>
      {open ? <FeeForm items={items} onClose={onClose} onSave={onSave} saving={saving} /> : null}
    </DialogShell>
  );
}

function FeeForm({
  items,
  onClose,
  onSave,
  saving,
}: {
  items: FeeScheduleItem[];
  onClose: () => void;
  onSave: (patch: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}) {
  const [rows, setRows] = useState<Row[]>(() => toRows(items));
  const [error, setError] = useState<string | null>(null);

  const update = (index: number, patch: Partial<Row>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const submit = async () => {
    const filled = rows.filter((row) => row.label.trim());
    const invalid = filled.find((row) => !(Number(row.amount) >= 0) || row.amount.trim() === "");
    if (invalid) {
      setError(`Enter a fee for "${invalid.label.trim()}".`);
      return;
    }
    const next: FeeScheduleItem[] = filled.map((row) => ({
      code: slugCode(row.label),
      label: row.label.trim(),
      amount: Number(row.amount),
      ...(row.detail.trim() ? { detail: row.detail.trim() } : {}),
    }));
    try {
      await onSave(feeSchedulePatch(next));
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Fees could not be saved");
    }
  };

  return (
    <>
      <DialogBody>
        <div className="flex flex-col gap-2">
          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_110px_40px] items-center gap-2">
              <Input aria-label="Service" placeholder="In-clinic consultation" value={row.label} onChange={(e) => update(index, { label: e.target.value })} />
              <Input aria-label="Detail" placeholder="First visit" value={row.detail} onChange={(e) => update(index, { detail: e.target.value })} />
              <Input aria-label="Fee in rupees" inputMode="decimal" placeholder="₹" value={row.amount} onChange={(e) => update(index, { amount: e.target.value })} />
              <Button type="button" variant="ghost" size="icon" aria-label="Remove line" onClick={() => setRows((current) => current.filter((_, i) => i !== index))}>
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setRows((current) => [...current, { label: "", detail: "", amount: "" }])}>
            <Plus aria-hidden="true" /> Add fee
          </Button>
        </div>
        <Note tone="blue">Doctors and assistant doctors never see these fees.</Note>
        <DialogError message={error} />
      </DialogBody>
      <DialogActions>
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={() => void submit()} disabled={saving}>{saving ? "Saving…" : "Save fees"}</Button>
      </DialogActions>
    </>
  );
}
