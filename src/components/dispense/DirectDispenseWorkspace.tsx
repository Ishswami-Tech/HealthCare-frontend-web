"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ClipboardList, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DialogError, Field, Note, SectionTitle, StatTile, Surface, showUndoToast } from "@/components/tbd";
import { usePatientDirectoryEntry } from "@/hooks/query/usePatientDirectory";
import {
  useCreateDirectDispense,
  useDirectDispenses,
  useDispenseStock,
  useUndoDirectDispense,
} from "@/hooks/query/useDirectDispense";
import { formatDateKeyInIST } from "@/lib/utils/date-time";
import {
  buildDispenseRequest,
  clampQuantity,
  dispenseBlocker,
  draftLineFromStock,
  linesFromPrescription,
  totalUnits,
  type DirectDispense,
  type DispenseDraftLine,
  type DispenseRecipient,
} from "@/lib/dispense/direct-dispense";
import { useDoctorPrescriptionDetail } from "@/app/(dashboard)/doctor/prescriptions/_components/useDoctorPrescriptionDetail";
import { DispensePatientPicker } from "./DispensePatientPicker";
import { DispenseStockPicker } from "./DispenseStockPicker";
import { DispenseHandoverList } from "./DispenseHandoverList";
import { RecentDispensesCard } from "./RecentDispensesCard";
import { plural } from "@/lib/utils/labels";

const NOTE_LIMIT = 300;
const MATCH_STOCK_LIMIT = 200;

export interface DirectDispenseWorkspaceProps {
  clinicId: string;
  currentUserId: string;
  todayKey: string;
  /** "DOCTOR": the dispense is final. "ASSISTANT_DOCTOR": it is visible to the doctor. "PHARMACIST": over the counter. */
  dispenserRole: "DOCTOR" | "ASSISTANT_DOCTOR" | "PHARMACIST";
  /** Pre-selects this patient (Patient-record id), for example when opened from a visit. */
  initialPatientId?: string;
  /** Links the hand-over to this prescription and offers "Load from prescription". */
  prescriptionId?: string;
  locationId?: string;
  locationLabel?: string;
  onDispensed?: (dispense: DirectDispense) => void;
}

/**
 * Hand medicines from clinic stock to any patient, with or without a prescription (SPEC2 §5).
 * Shared by the doctor and the assistant doctor. Stock counts only, never prices; the server
 * picks the batches (FEFO), deducts stock and sends the record to billing.
 */
export function DirectDispenseWorkspace({
  clinicId,
  currentUserId,
  todayKey,
  dispenserRole,
  initialPatientId = "",
  prescriptionId = "",
  locationId,
  locationLabel,
  onDispensed,
}: DirectDispenseWorkspaceProps) {
  const [recipient, setRecipient] = useState<DispenseRecipient | null>(null);
  const [lines, setLines] = useState<DispenseDraftLine[]>([]);
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [missing, setMissing] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const term = useDeferredValue(search.trim());

  const initialEntry = usePatientDirectoryEntry(clinicId, initialPatientId);
  useEffect(() => {
    if (initialPatientId && initialEntry.data?.name && !recipient) {
      setRecipient({ kind: "patient", patientId: initialPatientId, name: initialEntry.data.name });
    }
  }, [initialEntry.data?.name, initialPatientId, recipient]);

  const allStock = useDispenseStock(clinicId, { limit: MATCH_STOCK_LIMIT });
  const searched = useDispenseStock(clinicId, { q: term, limit: 30 }, { enabled: term.length >= 2 });
  const stockView = term.length >= 2 ? searched : allStock;
  const stockItems = useMemo(() => stockView.data?.items ?? [], [stockView.data]);
  const allItems = useMemo(() => allStock.data?.items ?? [], [allStock.data]);

  const { detail: prescription } = useDoctorPrescriptionDetail(prescriptionId);

  const recent = useDirectDispenses(clinicId, { limit: 8 });
  const create = useCreateDirectDispense();
  const undo = useUndoDirectDispense();

  const addedIds = useMemo(() => new Set(lines.map((line) => line.medicineId)), [lines]);
  const blocker = dispenseBlocker(recipient, lines);
  const dispensedToday = (recent.data ?? []).filter(
    (row) => row.status === "DISPENSED" && row.createdAt && formatDateKeyInIST(row.createdAt) === todayKey,
  ).length;
  const lowCount = allItems.filter((item) => item.status === "LOW").length;
  const expiringCount = allItems.filter((item) => item.expiringSoon).length;

  const loadFromPrescription = () => {
    if (!prescription) return;
    const result = linesFromPrescription(
      prescription.lines.map((line) => ({ medicineId: line.medicineId, name: line.name, quantity: line.quantity })),
      allItems,
    );
    setLines(result.lines);
    setMissing(result.missing);
  };

  const setQuantity = (medicineId: string, quantity: number) =>
    setLines((current) =>
      current.map((line) => (line.medicineId === medicineId ? { ...line, quantity: clampQuantity(quantity, line.quantityOnHand) } : line)),
    );

  const undoDispense = (row: DirectDispense) => {
    undo.mutate({ id: row.id });
  };

  const confirm = async () => {
    if (!recipient || blocker) return;
    setSubmitError(null);
    try {
      const dispense = await create.mutateAsync(
        buildDispenseRequest(recipient, lines, {
          prescriptionId: prescriptionId || undefined,
          locationId,
          note: note.slice(0, NOTE_LIMIT),
        }),
      );
      setLines([]);
      setNote("");
      setMissing([]);
      if (dispense.canUndo) {
        showUndoToast({
          message: `Handed over to ${dispense.patientName}`,
          onUndo: () => undo.mutate({ id: dispense.id }),
          durationMs: 8000,
        });
      }
      onDispensed?.(dispense);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "The hand-over could not be recorded.");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-3">
        <StatTile value={dispensedToday} label="Dispensed today" />
        <StatTile value={lowCount} label="Low-stock items" tone={lowCount ? "amber" : "ink"} />
        <StatTile value={expiringCount} label="Near expiry" tone={expiringCount ? "rose" : "ink"} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <Surface>
            <SectionTitle title="1 · Who is this for?" />
            <DispensePatientPicker clinicId={clinicId} recipient={recipient} onChange={setRecipient} />
            {prescription ? (
              <Note tone="blue" icon={ClipboardList}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>
                    Prescription <strong>{prescription.reference}</strong> · {plural(prescription.lines.length, "medicine")}
                  </span>
                  <Button size="compact" variant="outline" disabled={allStock.isPending} onClick={loadFromPrescription}>
                    Load from prescription
                  </Button>
                </div>
              </Note>
            ) : null}
          </Surface>

          <Surface>
            <SectionTitle
              title={`2 · Pick medicines${locationLabel ? ` from ${locationLabel} stock` : " from clinic stock"}`}
              description="Batch and expiry are picked automatically, earliest expiry first."
            />
            <DispenseStockPicker
              search={search}
              onSearch={setSearch}
              items={stockItems}
              loading={stockView.isPending}
              failed={Boolean(stockView.error)}
              onRetry={() => void stockView.refetch()}
              addedIds={addedIds}
              onAdd={(item) => setLines((current) => [...current, draftLineFromStock(item)])}
              locationLabel={locationLabel}
            />
          </Surface>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Surface>
            <SectionTitle
              title="3 · Hand-over list"
              icon={PackageCheck}
              description={`${plural(lines.length, "item")} · ${plural(totalUnits(lines), "unit")}`}
            />
            <DispenseHandoverList
              lines={lines}
              onQuantity={setQuantity}
              onRemove={(medicineId) => setLines((current) => current.filter((line) => line.medicineId !== medicineId))}
            />
            {missing.length > 0 ? (
              <Note tone="amber">Not in clinic stock: {missing.join(", ")}. The patient buys these outside.</Note>
            ) : null}
            <Field label="Note (optional)" htmlFor="dispense-note">
              <Textarea id="dispense-note" rows={2} maxLength={NOTE_LIMIT} value={note} onChange={(event) => setNote(event.target.value)} />
            </Field>
            {submitError ? <DialogError message={submitError} /> : null}
            <p className="m-0 text-xs text-ink-muted">
              {recipient ? `${recipient.name} · ` : ""}
              Sent to billing automatically ·{" "}
              {dispenserRole === "DOCTOR"
                ? "doctor dispenses are final"
                : dispenserRole === "PHARMACIST"
                  ? "stock is deducted at once"
                  : "visible to the doctor"}
            </p>
            <Button size="xl" disabled={Boolean(blocker) || create.isPending} onClick={() => void confirm()} title={blocker ?? undefined}>
              Confirm hand-over
            </Button>
            {blocker ? <p className="m-0 text-xs text-ink-muted">{blocker}</p> : null}
          </Surface>

          <RecentDispensesCard
            rows={recent.data ?? []}
            loading={recent.isPending}
            failed={Boolean(recent.error)}
            onRetry={() => void recent.refetch()}
            todayKey={todayKey}
            currentUserId={currentUserId}
            onUndo={undoDispense}
            undoPending={undo.isPending}
          />

          <Note tone="blue">
            Stock is deducted the moment you confirm. Billing and the front desk receive the record and handle the amount.
            Dispenses by the assistant doctor are visible to the doctor; the doctor&apos;s are final.
          </Note>
        </div>
      </div>
    </div>
  );
}
