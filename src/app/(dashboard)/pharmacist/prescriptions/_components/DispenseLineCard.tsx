"use client";

import { useState } from "react";
import { Check, CircleAlert, Clock, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Pill } from "@/components/tbd";
import { cn } from "@/lib/utils";
import {
  dateLabel,
  describeLine,
  getEffectiveStock,
  getRemainingQuantity,
  relativeDateTimeLabel,
  type CatalogMedicine,
  type DispenseBatchRow,
  type DispenseLineState,
} from "./pharmacist-prescriptions.logic";
import type { LineField } from "./usePharmacistPrescriptionsState";

interface DispenseLineCardProps {
  /** Position of the medicine on the prescription, from 0. */
  index: number;
  line: DispenseLineState;
  /** Show the "Given" number (the prescription was partly dispensed before). */
  showGiven: boolean;
  catalog: CatalogMedicine[];
  catalogById: Map<string, CatalogMedicine>;
  disabled?: boolean;
  onBatchChange: (batchIndex: number, field: keyof Omit<DispenseBatchRow, "id">, value: string) => void;
  onAddBatch: () => void;
  onRemoveBatch: (batchIndex: number) => void;
  onLineFieldChange: (field: LineField, value: string) => void;
  onClearSubstitute: () => void;
}

const FIELD_LABEL = "text-[11px] font-bold text-ink-muted";
const FIELD_INPUT = "h-[42px] rounded-[11px] px-3 text-sm font-bold md:text-sm";
const CHECK_TONE = {
  ok: "text-brand",
  warn: "text-[#b45309] dark:text-amber-300",
  error: "text-[#e11d48] dark:text-rose-300",
  muted: "text-ink-muted",
} as const;

function Stat({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return (
    <span className="whitespace-nowrap text-xs text-ink-muted">
      {label}{" "}
      <span className={cn("text-sm font-extrabold", alert ? "text-[#e11d48] dark:text-rose-300" : "text-ink")}>
        {value}
      </span>
    </span>
  );
}

/** One medicine of the dispense form: quantity, batch rows, optional substitute. */
export function DispenseLineCard({
  index,
  line,
  showGiven,
  catalog,
  catalogById,
  disabled = false,
  onBatchChange,
  onAddBatch,
  onRemoveBatch,
  onLineFieldChange,
  onClearSubstitute,
}: DispenseLineCardProps) {
  const substituted = Boolean(line.substituteMedicineId);
  // The substitute panel also opens before a substitute is picked.
  const [panelOpen, setPanelOpen] = useState(substituted);
  const showPanel = panelOpen || substituted;

  const remaining = getRemainingQuantity(line);
  const stock = getEffectiveStock(line, catalogById);
  const ownStock = Number(catalogById.get(line.medicineId)?.stock ?? line.availableStock);
  const check = describeLine(line, catalogById);
  const substitute = substituted ? catalogById.get(line.substituteMedicineId) : undefined;
  const given = line.dispensedQuantity > 0 ? (line.dispenseBatchHistory ?? []) : [];
  const several = line.batches.length > 1;
  const CheckIcon = check.tone === "ok" ? Check : check.tone === "muted" ? Clock : CircleAlert;

  return (
    <section
      aria-label={line.name}
      className="flex flex-col gap-3 rounded-2xl border border-line bg-[#fbfdfc] px-3.5 py-3.5 sm:px-4 dark:bg-white/[0.03]"
    >
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <span
          className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-mint text-xs font-extrabold text-brand-dark"
          aria-hidden="true"
        >
          {index + 1}
        </span>
        <span className="flex min-w-0 flex-1 basis-[180px] flex-col gap-px">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-extrabold text-ink">{line.name}</span>
            {substituted ? <Pill tone="blue">Substituted</Pill> : null}
          </span>
          {line.directions ? <span className="text-xs text-ink-muted">{line.directions}</span> : null}
        </span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Stat label="Prescribed" value={line.prescribedQuantity} />
          {showGiven ? <Stat label="Given" value={line.dispensedQuantity} /> : null}
          <Stat label="In stock" value={ownStock} alert={ownStock < remaining} />
        </span>
      </div>

      {given.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
          <span className="inline-flex items-center gap-[5px] font-bold">
            <Clock className="size-[13px] text-ink-muted" strokeWidth={2.2} aria-hidden="true" />
            Given earlier
          </span>
          {given.map((entry, entryIndex) => (
            <span
              key={`${line.prescriptionItemId}-${entryIndex}`}
              className="rounded-[8px] bg-well px-[9px] py-1 font-semibold"
            >
              {[
                String(entry.quantity),
                entry.batchNumber ? `batch ${entry.batchNumber}` : "",
                entry.expiryDate ? `exp ${dateLabel(entry.expiryDate)}` : "",
                relativeDateTimeLabel(entry.dispensedAt),
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          ))}
        </div>
      ) : null}

      {remaining > 0 && showPanel ? (
        <div className="grid grid-cols-1 items-start gap-3 rounded-[14px] border border-[#dbeafe] bg-[#eff6ff] p-3 sm:grid-cols-2 dark:border-blue-900/60 dark:bg-blue-950/30">
          <div className="flex min-w-0 flex-col gap-1">
            <label
              htmlFor={`substitute-${index}`}
              className="text-[11px] font-bold text-[#1e40af] dark:text-blue-300"
            >
              Give this medicine instead
            </label>
            <Select
              value={line.substituteMedicineId}
              onValueChange={(value) => onLineFieldChange("substituteMedicineId", value)}
              disabled={disabled}
            >
              <SelectTrigger
                id={`substitute-${index}`}
                className="h-[42px] w-full rounded-[11px] border-[#bfdbfe] px-3 text-sm font-bold data-[size=default]:h-[42px] dark:border-blue-900"
              >
                <SelectValue placeholder="Choose a medicine" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-72">
                {catalog
                  .filter((medicine) => medicine.id && medicine.id !== line.medicineId)
                  .map((medicine) => (
                    <SelectItem
                      key={medicine.id}
                      value={medicine.id}
                      description={`${medicine.stock ?? 0} in stock`}
                    >
                      {[medicine.name, medicine.manufacturer].filter(Boolean).join(" · ")}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <span className="mt-1 flex justify-between gap-2.5 text-xs font-bold">
              <span
                className={cn(
                  substitute && stock <= 0
                    ? "text-[#e11d48] dark:text-rose-300"
                    : "text-[#065f46] dark:text-emerald-300",
                )}
              >
                {substitute ? `${stock} in stock` : ""}
              </span>
              <button
                type="button"
                className="text-brand hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50"
                disabled={disabled}
                onClick={() => {
                  onClearSubstitute();
                  setPanelOpen(false);
                }}
              >
                Use the original medicine
              </button>
            </span>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <label
              htmlFor={`substitution-reason-${index}`}
              className="text-[11px] font-bold text-[#1e40af] dark:text-blue-300"
            >
              Reason for the substitution · required
            </label>
            <Textarea
              id={`substitution-reason-${index}`}
              value={line.substitutionReason}
              onChange={(event) => onLineFieldChange("substitutionReason", event.target.value)}
              placeholder="Why the prescribed medicine is not given"
              disabled={disabled}
              className="min-h-[76px] rounded-[11px] border-[#bfdbfe] px-3 py-[9px] text-[13px] leading-[1.45] md:text-[13px] dark:border-blue-900"
            />
          </div>
        </div>
      ) : null}

      {remaining > 0 ? (
        <div className="flex flex-col gap-2">
          {line.batches.map((batch, batchIndex) => {
            const labelClass = cn(FIELD_LABEL, batchIndex > 0 && "sm:sr-only");
            return (
              <div
                key={batch.id}
                className={cn(
                  "grid grid-cols-2 items-end gap-2.5",
                  several
                    ? "sm:grid-cols-[150px_minmax(0,1fr)_190px_42px]"
                    : "sm:grid-cols-[150px_minmax(0,1fr)_190px]",
                )}
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <label htmlFor={`batch-quantity-${index}-${batchIndex}`} className={labelClass}>
                    Quantity to dispense
                  </label>
                  <Input
                    id={`batch-quantity-${index}-${batchIndex}`}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    max={String(line.prescribedQuantity)}
                    value={batch.quantity}
                    onChange={(event) => onBatchChange(batchIndex, "quantity", event.target.value)}
                    placeholder="0"
                    disabled={disabled}
                    className={FIELD_INPUT}
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <label htmlFor={`batch-number-${index}-${batchIndex}`} className={labelClass}>
                    Batch number
                  </label>
                  <Input
                    id={`batch-number-${index}-${batchIndex}`}
                    value={batch.batchNumber}
                    onChange={(event) => onBatchChange(batchIndex, "batchNumber", event.target.value)}
                    placeholder="Enter batch number"
                    autoComplete="off"
                    disabled={disabled}
                    className={FIELD_INPUT}
                  />
                </div>
                <div className="col-span-2 flex min-w-0 items-end gap-2.5 sm:contents">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <label htmlFor={`batch-expiry-${index}-${batchIndex}`} className={labelClass}>
                      Expiry date
                    </label>
                    <Input
                      id={`batch-expiry-${index}-${batchIndex}`}
                      type="date"
                      value={batch.expiryDate}
                      onChange={(event) => onBatchChange(batchIndex, "expiryDate", event.target.value)}
                      disabled={disabled}
                      className={FIELD_INPUT}
                    />
                  </div>
                  {several ? (
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-[42px] shrink-0 rounded-[11px] text-ink-muted"
                      onClick={() => onRemoveBatch(batchIndex)}
                      disabled={disabled}
                      aria-label={`Remove batch ${batchIndex + 1} of ${line.name}`}
                      title="Remove batch"
                    >
                      <Trash2 className="size-[15px]" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <span
          className={cn("inline-flex min-w-0 items-start gap-1.5 text-[13px] font-bold", CHECK_TONE[check.tone])}
          aria-live="polite"
        >
          <CheckIcon className="mt-[3px] size-3.5 shrink-0" strokeWidth={2.6} aria-hidden="true" />
          <span>{check.message}</span>
        </span>
        {remaining > 0 ? (
          <span className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 px-2.5 text-xs font-bold has-[>svg]:px-2.5"
              onClick={onAddBatch}
              disabled={disabled}
            >
              <Plus className="size-[13px] text-brand" strokeWidth={2.4} aria-hidden="true" />
              Add batch
            </Button>
            {showPanel ? null : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 px-2.5 text-xs font-bold has-[>svg]:px-2.5"
                onClick={() => setPanelOpen(true)}
                disabled={disabled}
              >
                <RotateCcw className="size-[13px] text-brand" strokeWidth={2.4} aria-hidden="true" />
                Substitute
              </Button>
            )}
          </span>
        ) : null}
      </div>
    </section>
  );
}
