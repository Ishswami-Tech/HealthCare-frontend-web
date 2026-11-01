"use client";

import { useState } from "react";
import { CircleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  AS_DIRECTED_DOSE,
  DOSE_UNITS,
  doseConflictWarning,
  doseRuleFor,
  formatDose,
  parseAmount,
  parseDose,
  type DoseRule,
  type DoseUnitValue,
} from "./dose-units.logic";

const OTHER_OPTION = "__other";
const AS_DIRECTED_OPTION = "__as_directed";

interface DoseDraft {
  mode: "units" | "asDirected" | "other";
  amount: string;
  unit: DoseUnitValue;
  text: string;
}

function draftFrom(dosage: string, rule: DoseRule, form: unknown): DoseDraft {
  const parsed = parseDose(dosage, form);
  const unit = rule.units[0] ?? "tablet";
  if (parsed.mode === "units") return { mode: "units", amount: parsed.amount, unit: parsed.unit, text: "" };
  if (parsed.mode === "asDirected") return { mode: "asDirected", amount: "1", unit, text: "" };
  // A blank dose (a new injection line) starts on the usual unit with the amount to type.
  if (!parsed.text) return { mode: "units", amount: "", unit, text: "" };
  return { mode: "other", amount: "", unit, text: parsed.text };
}

function doseOf(draft: DoseDraft): string {
  if (draft.mode === "asDirected") return AS_DIRECTED_DOSE;
  if (draft.mode === "other") return draft.text;
  return formatDose(draft.amount, draft.unit);
}

export interface DoseFieldProps {
  id: string;
  /** The dose as stored on the line ("2 g", "1 tablet", or free text). */
  dosage: string;
  /** The medicine's dosage form (`Medicine.dosageForm` / category); no rule keeps free text. */
  dosageForm: unknown;
  onChange: (dosage: string) => void;
  /** Classes for each input / trigger, so the field matches the row it sits in. */
  fieldClassName?: string;
  /** Id of the element that shows the unit warning, for aria-describedby. */
  warningId?: string;
}

/**
 * The dose of one medicine: an amount plus a unit valid for its dosage form (a churna in g /
 * teaspoon / pinch, a vati in tablets...). "Other" keeps free text for a real edge case; a
 * medicine without a recorded form keeps the free-text dose it always had.
 */
export function DoseField({ id, dosage, dosageForm, onChange, fieldClassName, warningId }: DoseFieldProps) {
  const rule = doseRuleFor(dosageForm);
  const hasWarning = Boolean(warningId && doseConflictWarning(dosage, dosageForm));

  if (!rule) {
    return (
      <Input
        id={id}
        className={fieldClassName}
        placeholder="e.g. 1 tablet"
        value={dosage}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }
  return (
    <StructuredDose
      id={id}
      dosage={dosage}
      dosageForm={dosageForm}
      rule={rule}
      onChange={onChange}
      fieldClassName={fieldClassName}
      describedBy={hasWarning ? warningId : undefined}
    />
  );
}

function StructuredDose({
  id,
  dosage,
  dosageForm,
  rule,
  onChange,
  fieldClassName,
  describedBy,
}: {
  id: string;
  dosage: string;
  dosageForm: unknown;
  rule: DoseRule;
  onChange: (dosage: string) => void;
  fieldClassName?: string | undefined;
  describedBy?: string | undefined;
}) {
  const [draft, setDraft] = useState<DoseDraft>(() => draftFrom(dosage, rule, dosageForm));
  const [seenDosage, setSeenDosage] = useState(dosage);
  // The line's dose changed from outside (a kit, voice, a reloaded prescription): read it again,
  // unless it is just what this field wrote.
  if (dosage !== seenDosage) {
    setSeenDosage(dosage);
    if (dosage !== doseOf(draft)) setDraft(draftFrom(dosage, rule, dosageForm));
  }

  const commit = (next: DoseDraft) => {
    setDraft(next);
    const value = doseOf(next);
    setSeenDosage(value);
    onChange(value);
  };

  const chooseUnit = (value: string) => {
    if (value === OTHER_OPTION) {
      commit({ ...draft, mode: "other", text: draft.mode === "other" ? draft.text : doseOf(draft) });
      return;
    }
    if (value === AS_DIRECTED_OPTION) {
      commit({ ...draft, mode: "asDirected" });
      return;
    }
    const amount = draft.amount.trim() || "1";
    commit({ ...draft, mode: "units", unit: value as DoseUnitValue, amount });
  };

  const selected = draft.mode === "other" ? OTHER_OPTION : draft.mode === "asDirected" ? AS_DIRECTED_OPTION : draft.unit;
  const amountInvalid = draft.mode === "units" && draft.amount.trim() !== "" && parseAmount(draft.amount) === null;
  const amountId = `${id}-amount`;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex min-w-0 gap-1.5">
        {draft.mode === "units" ? (
          <Input
            id={id}
            aria-label="Dose amount"
            inputMode="decimal"
            className={cn(fieldClassName, "w-[3.75rem] shrink-0 text-center")}
            placeholder="1"
            value={draft.amount}
            aria-invalid={amountInvalid || undefined}
            aria-describedby={amountInvalid ? amountId : describedBy}
            onChange={(event) => commit({ ...draft, amount: event.target.value })}
          />
        ) : null}
        <Select value={selected} onValueChange={chooseUnit}>
          <SelectTrigger
            {...(draft.mode === "units" ? {} : { id })}
            aria-label="Dose unit"
            className={cn(fieldClassName, "min-w-0 flex-1 data-[size=default]:h-[38px]", draft.mode === "other" && "max-w-[6.5rem]")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {rule.units.map((unit) => (
              <SelectItem key={unit} value={unit}>
                {DOSE_UNITS[unit].label}
              </SelectItem>
            ))}
            {rule.asDirected ? <SelectItem value={AS_DIRECTED_OPTION}>As directed</SelectItem> : null}
            <SelectItem value={OTHER_OPTION}>Other (type)</SelectItem>
          </SelectContent>
        </Select>
        {draft.mode === "other" ? (
          <Input
            aria-label="Dose (free text)"
            className={cn(fieldClassName, "min-w-0 flex-1")}
            placeholder="Type the dose"
            value={draft.text}
            aria-describedby={describedBy}
            onChange={(event) => commit({ ...draft, text: event.target.value })}
          />
        ) : null}
      </div>
      {amountInvalid ? (
        <span id={amountId} className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive">
          <CircleAlert className="size-3" strokeWidth={2.6} aria-hidden="true" />
          Use a number like 1, 1/2 or 2.5
        </span>
      ) : null}
    </div>
  );
}
