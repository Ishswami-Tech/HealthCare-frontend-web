"use client";

import { useDeferredValue, useId, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FIELD_LABEL_SMALL, Pill } from "@/components/tbd";
import { DispenseStockPicker } from "@/components/dispense/DispenseStockPicker";
import { useDispenseStock } from "@/hooks/query/useDirectDispense";
import type { DispenseStockItem } from "@/lib/dispense/direct-dispense";
import { cn } from "@/lib/utils";
import type { RxDraftLine } from "@/types/rx-drafts.types";
import { newDraftLine, type LineChange } from "./rx-drafts.logic";

const FREQUENCY_PRESETS = ["1-0-1", "1-1-1", "1-0-0", "0-0-1", "SOS"] as const;
const DURATION_PRESETS = ["3 days", "5 days", "7 days", "14 days", "30 days"] as const;
const TIMING_PRESETS = ["After food", "Before food", "Empty stomach", "Bedtime"] as const;

const CHANGE_TAGS: Record<LineChange, { label: string; tone: "slate" | "amber" | "blue" }> = {
  UNCHANGED: { label: "Unchanged", tone: "slate" },
  EDITED: { label: "Edited", tone: "amber" },
  ADDED: { label: "Added", tone: "blue" },
};

type EditableField = "dosage" | "frequency" | "duration" | "quantity" | "instructions";

function Presets({ values, current, onPick, label }: { values: readonly string[]; current: string; onPick: (value: string) => void; label: string }) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label={label}>
      {values.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onPick(value)}
          aria-pressed={current === value}
          className={cn(
            "rounded-lg px-2 py-0.5 text-[11px] font-bold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
            current === value ? "bg-brand text-white" : "bg-well text-ink-soft hover:bg-mint-soft",
          )}
        >
          {value}
        </button>
      ))}
    </div>
  );
}

function LineRow({
  line,
  change,
  changedFields,
  onFieldChange,
  onRemove,
}: {
  line: RxDraftLine;
  change?: LineChange | undefined;
  changedFields?: string[] | undefined;
  onFieldChange: (field: EditableField, value: string) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const tag = change ? CHANGE_TAGS[change] : null;
  const field = (name: EditableField, label: string, placeholder: string, inputMode?: "numeric") => (
    <label className="flex min-w-0 flex-col gap-1" htmlFor={`${id}-${name}`}>
      <span className={FIELD_LABEL_SMALL}>{label}</span>
      <Input
        id={`${id}-${name}`}
        value={line[name]}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={(event) => onFieldChange(name, event.target.value)}
        className="h-10"
      />
    </label>
  );

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-line p-4">
      <div className="flex items-start gap-3">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-bold text-ink">{line.medicineName || "Medicine"}</span>
          {changedFields && changedFields.length > 0 ? (
            <span className="text-xs text-ink-muted">Changed: {changedFields.join(", ")}</span>
          ) : null}
        </span>
        {tag ? <Pill tone={tag.tone}>{tag.label}</Pill> : null}
        <Button size="icon-sm" variant="danger" onClick={onRemove} aria-label={`Remove ${line.medicineName || "medicine"}`}>
          <Trash2 />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {field("dosage", "Dose", "e.g. 1 tablet")}
        {field("frequency", "Frequency", "1-0-1")}
        {field("duration", "Duration", "5 days")}
        {field("quantity", "Quantity", "10", "numeric")}
        {field("instructions", "Timing", "After food")}
      </div>
      <div className="flex flex-col gap-1.5">
        <Presets label="Frequency presets" values={FREQUENCY_PRESETS} current={line.frequency} onPick={(value) => onFieldChange("frequency", value)} />
        <Presets label="Duration presets" values={DURATION_PRESETS} current={line.duration} onPick={(value) => onFieldChange("duration", value)} />
        <Presets label="Timing presets" values={TIMING_PRESETS} current={line.instructions} onPick={(value) => onFieldChange("instructions", value)} />
      </div>
    </li>
  );
}

/** Search clinic stock (the dispense screens' picker) and add one medicine to the draft. */
function AddFromStock({
  clinicId,
  pickedIds,
  onPick,
}: {
  clinicId: string;
  pickedIds: readonly string[];
  onPick: (item: DispenseStockItem) => void;
}) {
  const [search, setSearch] = useState("");
  const term = useDeferredValue(search.trim());
  const stock = useDispenseStock(clinicId, { q: term, limit: 20 }, { enabled: term.length >= 2 });
  const added = useMemo(() => new Set(pickedIds), [pickedIds]);
  const searching = term.length >= 2;
  return (
    <div className="flex flex-col gap-1.5">
      <DispenseStockPicker
        search={search}
        onSearch={setSearch}
        items={searching ? (stock.data?.items ?? []) : []}
        loading={searching && stock.isPending}
        failed={searching && Boolean(stock.error)}
        onRetry={() => void stock.refetch()}
        addedIds={added}
        onAdd={onPick}
      />
      {searching ? null : <p className="m-0 text-xs text-ink-muted">Type at least 2 letters to search the clinic stock.</p>}
    </div>
  );
}

/**
 * Edit the medicine lines of a draft: dose, frequency, duration, quantity, timing; remove a line;
 * add a medicine from clinic stock. Controlled: the parent holds the lines and saves them.
 * `changes` (from `diffDraftLines`) tags each line Unchanged / Edited / Added.
 */
export function DraftLinesEditor({
  clinicId,
  lines,
  onChange,
  changes,
}: {
  clinicId: string;
  lines: readonly RxDraftLine[];
  onChange: (lines: RxDraftLine[]) => void;
  changes?: ReadonlyMap<string, { change: LineChange; fields: string[] }>;
}) {
  const [adding, setAdding] = useState(false);
  const update = (key: string, field: EditableField, value: string) =>
    onChange(lines.map((line) => (line.key === key ? { ...line, [field]: value } : line)));

  return (
    <div className="flex flex-col gap-3">
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {lines.map((line) => (
          <LineRow
            key={line.key}
            line={line}
            change={changes?.get(line.key)?.change}
            changedFields={changes?.get(line.key)?.fields}
            onFieldChange={(field, value) => update(line.key, field, value)}
            onRemove={() => onChange(lines.filter((entry) => entry.key !== line.key))}
          />
        ))}
      </ul>
      {adding ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-line p-4">
          <AddFromStock
            clinicId={clinicId}
            pickedIds={lines.map((line) => line.medicineId)}
            onPick={(item) => {
              onChange([...lines, newDraftLine(item.medicineId, item.name)]);
              setAdding(false);
            }}
          />
          <Button variant="outline" size="compact" className="self-start" onClick={() => setAdding(false)}>
            Close search
          </Button>
        </div>
      ) : (
        <Button variant="soft" size="md" className="self-start" onClick={() => setAdding(true)}>
          <Plus />
          Add medicine from stock
        </Button>
      )}
    </div>
  );
}
