"use client";

import { useId, useMemo, useReducer, useState } from "react";
import { Check, CircleAlert, CircleCheck, Info, Loader2, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InitialsAvatar, Note, Pill, SearchBox, statusLabel, statusTone } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { useCompleteAppointment, useUpdateAppointment } from "@/hooks/query/useAppointments";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useCreatePrescription, useMedicines } from "@/hooks/query/usePharmacy";
import type { Medicine } from "@/types/pharmacy.types";

/** What was really saved. The caller uses it for its confirmation message. */
export interface PrescriptionSavedResult {
  appointmentId?: string;
  /** True when the appointment was completed as part of this save. */
  appointmentCompleted: boolean;
  patientName: string;
  /** Medicines saved to the pharmacy prescription. */
  pharmacyMedicineCount: number;
  /** Medicines that are not in pharmacy stock: written in the visit notes only. */
  outsideMedicineCount: number;
  prescriptionNumber: string | null;
  followUpDate: string | null;
}

interface QuickPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Omit when prescribing directly from a patient record with no active appointment. */
  appointmentId?: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  /** "38 years · Female" — shown under the patient name. */
  patientSummary?: string;
  /** "In-clinic · 12:00 pm" — the visit this prescription belongs to. */
  visitLabel?: string;
  /** Appointment status code, for the status tag. */
  visitStatus?: string;
  /** Notes the doctor wrote during the consultation; saved with the visit. */
  consultationNotes?: string;
  onSaved?: (result: PrescriptionSavedResult) => void | Promise<void>;
}

export interface PrescriptionMedicationRow {
  id: string;
  /** Empty for a medicine that is not in pharmacy stock. */
  medicineId: string;
  name: string;
  dosage: string;
  frequency: string;
  days: string;
  quantity: string;
  when: string;
}

export interface PrescriptionFormValues {
  diagnosis: string;
  advice: string;
  followUpDate: string;
  followUpNotes: string;
  medicineSearch: string;
  inStockOnly: boolean;
  medications: PrescriptionMedicationRow[];
}

type PrescriptionFormAction =
  | { type: "setField"; field: "diagnosis" | "advice" | "followUpDate" | "followUpNotes" | "medicineSearch"; value: string }
  | { type: "setInStockOnly"; value: boolean }
  | { type: "addMedication"; value: PrescriptionMedicationRow }
  | { type: "removeMedication"; id: string }
  | { type: "updateMedication"; id: string; field: keyof PrescriptionMedicationRow; value: string }
  | { type: "reset" };

const emptyPrescriptionForm = (): PrescriptionFormValues => ({
  diagnosis: "",
  advice: "",
  followUpDate: "",
  followUpNotes: "",
  medicineSearch: "",
  inStockOnly: true,
  medications: [],
});

function prescriptionFormReducer(state: PrescriptionFormValues, action: PrescriptionFormAction): PrescriptionFormValues {
  switch (action.type) {
    case "setField":
      return { ...state, [action.field]: action.value };
    case "setInStockOnly":
      return { ...state, inStockOnly: action.value };
    case "addMedication":
      return { ...state, medications: [...state.medications, action.value] };
    case "removeMedication":
      return { ...state, medications: state.medications.filter((medication) => medication.id !== action.id) };
    case "updateMedication":
      return {
        ...state,
        medications: state.medications.map((medication) =>
          medication.id === action.id ? { ...medication, [action.field]: action.value } : medication
        ),
      };
    case "reset":
      return emptyPrescriptionForm();
    default:
      return state;
  }
}

const createMedicationRow = (medicine?: Medicine): PrescriptionMedicationRow => ({
  id: globalThis.crypto?.randomUUID?.() || `med-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  medicineId: medicine?.id ?? "",
  name: medicine ? medicineTitle(medicine) : "",
  dosage: "",
  frequency: "",
  days: "",
  quantity: "1",
  when: "",
});

const FREQUENCY_OPTIONS = [
  "Once a day",
  "Twice a day",
  "Three times a day",
  "Four times a day",
  "Once in the morning",
  "Once at night",
  "When needed",
];

const WHEN_OPTIONS = ["After food", "Before food", "With food", "On an empty stomach", "At bedtime", "Any time"];

/** "Paracetamol 500 mg": the name, plus the strength when the name does not already say it. */
function medicineTitle(medicine: Medicine): string {
  const name = String(medicine.name || "").trim();
  const strength = String(medicine.strength || "").trim();
  if (!strength || name.toLowerCase().includes(strength.toLowerCase())) {
    return name;
  }
  return `${name} ${strength}`;
}

function medicineForm(medicine: Medicine): string {
  const form = String(medicine.dosageForm || "").trim();
  return form ? form.charAt(0).toUpperCase() + form.slice(1).toLowerCase() : "Medicine";
}

function stockOf(medicine: Medicine): number {
  const stock = Number(medicine.stockQuantity);
  return Number.isFinite(stock) ? Math.max(0, stock) : 0;
}

function isLowStock(medicine: Medicine): boolean {
  const stock = stockOf(medicine);
  const threshold = Math.max(Number(medicine.minStockLevel) || 0, Number(medicine.reorderPoint) || 0);
  return stock > 0 && threshold > 0 && stock <= threshold;
}

function quantityOf(medication: PrescriptionMedicationRow): number {
  return Math.max(1, Number.parseInt(medication.quantity, 10) || 1);
}

function durationOf(medication: PrescriptionMedicationRow): string {
  const days = Number.parseInt(medication.days, 10);
  if (!Number.isFinite(days) || days <= 0) return "";
  return days === 1 ? "1 day" : `${days} days`;
}

/** "Twice a day, after food": the pharmacy line has no separate field for when to take it. */
function frequencyOf(medication: PrescriptionMedicationRow): string {
  const frequency = medication.frequency.trim();
  const when = medication.when.trim();
  if (!when || when === "Any time") return frequency;
  return frequency ? `${frequency}, ${when.charAt(0).toLowerCase()}${when.slice(1)}` : when;
}

/** A stock medicine needs its dose, how often and days before it can go to the pharmacy. */
function isMedicationComplete(medication: PrescriptionMedicationRow): boolean {
  if (!medication.medicineId) {
    return medication.name.trim() !== "";
  }
  return medication.dosage.trim() !== "" && medication.frequency.trim() !== "" && durationOf(medication) !== "";
}

const formatMedicationSummary = (medication: PrescriptionMedicationRow) =>
  [
    medication.name.trim(),
    medication.dosage.trim() ? `Dose: ${medication.dosage.trim()}` : "",
    frequencyOf(medication) ? `Freq: ${frequencyOf(medication)}` : "",
    durationOf(medication) ? `Duration: ${durationOf(medication)}` : "",
    medication.quantity.trim() ? `Qty: ${quantityOf(medication)}` : "",
    medication.medicineId ? "" : "Outside medicine",
  ]
    .filter(Boolean)
    .join(" | ");

/**
 * The reference the pharmacy desk shows for a prescription: the number the server gives, or
 * "RX-" plus the first eight characters of its id (the same rule as the pharmacy screens).
 */
function readPrescriptionReference(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const outer = result as Record<string, unknown>;
  const record = (outer.data && typeof outer.data === "object" ? outer.data : outer) as Record<string, unknown>;
  for (const key of ["prescriptionNumber", "referenceNumber"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  const compact = typeof record.id === "string" ? record.id.replace(/[^a-zA-Z0-9]/g, "") : "";
  return compact ? `RX-${compact.slice(0, 8).toUpperCase()}` : null;
}

const FIELD_LABEL = "text-[11px] font-bold text-ink-muted";
const SMALL_FIELD = "h-[38px] rounded-[10px] px-2.5 text-[13px] font-semibold md:text-[13px]";

export interface PrescriptionDialogViewProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientSummary?: string;
  visitLabel?: string;
  visitStatus?: string;
  /** "complete": saving also completes the appointment. "save": prescription only. */
  mode: "complete" | "save";
  medicines: Medicine[];
  isLoadingMedicines: boolean;
  /** Why the stock list cannot be shown (no clinic, or the request failed). */
  stockMessage?: string | null;
  isSubmitting: boolean;
  /** Shown above the buttons when a step failed. */
  errorMessage?: string | null;
  /** True after the medicines reached the pharmacy: they can no longer be changed here. */
  medicinesLocked?: boolean;
  /** Starting values (the form is empty by default). */
  initialValues?: PrescriptionFormValues;
  /** Saves the form. Resolves true when everything was saved. */
  onSubmit: (values: PrescriptionFormValues) => Promise<boolean>;
}

/** The prescribing dialog. Props only: the data hooks live in `QuickPrescriptionModal`. */
export function PrescriptionDialogView({
  isOpen,
  onClose,
  patientName,
  patientSummary,
  visitLabel,
  visitStatus,
  mode,
  medicines,
  isLoadingMedicines,
  stockMessage,
  isSubmitting,
  errorMessage,
  medicinesLocked = false,
  initialValues,
  onSubmit,
}: PrescriptionDialogViewProps) {
  const [form, dispatch] = useReducer(prescriptionFormReducer, initialValues, (initial) => initial ?? emptyPrescriptionForm());
  const fieldId = useId();

  const medicinesById = useMemo(() => new Map(medicines.map((medicine) => [medicine.id, medicine])), [medicines]);
  const addedIds = useMemo(
    () => new Set(form.medications.map((medication) => medication.medicineId).filter(Boolean)),
    [form.medications]
  );

  const inStockCount = useMemo(() => medicines.filter((medicine) => stockOf(medicine) > 0).length, [medicines]);

  const visibleMedicines = useMemo(() => {
    const query = form.medicineSearch.trim().toLowerCase();
    return medicines
      .filter((medicine) => {
        // A medicine that was already added stays in the list so it can be seen as "Added".
        if (form.inStockOnly && stockOf(medicine) <= 0 && !addedIds.has(medicine.id)) {
          return false;
        }
        if (!query) {
          return true;
        }
        const haystack = [
          medicine.name,
          medicine.genericName,
          medicine.manufacturer,
          medicine.category,
          medicine.strength,
          medicine.dosageForm,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
      .toSorted((a, b) => Number(addedIds.has(b.id)) - Number(addedIds.has(a.id)));
  }, [addedIds, form.inStockOnly, form.medicineSearch, medicines]);

  const stockRows = form.medications.filter((medication) => medication.medicineId);
  const outsideRows = form.medications.filter((medication) => !medication.medicineId);
  const namedOutsideRows = outsideRows.filter((medication) => medication.name.trim());
  const incompleteCount = form.medications.filter((medication) => !isMedicationComplete(medication)).length;
  const shortCount = stockRows.filter((medication) => {
    const medicine = medicinesById.get(medication.medicineId);
    return medicine ? quantityOf(medication) > stockOf(medicine) : false;
  }).length;

  const hasContent =
    mode === "complete"
      ? Boolean(form.diagnosis.trim() || form.advice.trim() || stockRows.length > 0 || namedOutsideRows.length > 0)
      : stockRows.length > 0;
  const canSubmit = hasContent && incompleteCount === 0 && !isSubmitting;

  const medicineWord = (count: number) => `${count} ${count === 1 ? "medicine" : "medicines"}`;
  let footerText: string;
  let footerWarn = false;
  if (incompleteCount > 0) {
    footerText =
      outsideRows.length > namedOutsideRows.length && incompleteCount === outsideRows.length - namedOutsideRows.length
        ? "Write the name of the outside medicine."
        : `Set the dose, how often and days for ${incompleteCount === 1 ? "1 medicine" : `${incompleteCount} medicines`}.`;
    footerWarn = true;
  } else if (form.medications.length === 0) {
    footerText = mode === "complete" ? "No medicines added. Nothing goes to the pharmacy." : "Add at least one medicine from the stock list.";
  } else {
    const parts: string[] = [];
    if (stockRows.length > 0) {
      parts.push(
        shortCount > 0
          ? `${medicineWord(stockRows.length)} · ${shortCount === 1 ? "1 needs" : `${shortCount} need`} more than the pharmacy has`
          : `${medicineWord(stockRows.length)}, ${stockRows.length === 1 ? "in stock" : stockRows.length === 2 ? "both in stock" : "all in stock"}`
      );
      footerWarn = shortCount > 0;
    }
    if (namedOutsideRows.length > 0) {
      parts.push(`${medicineWord(namedOutsideRows.length)} from outside, kept in the visit notes`);
    }
    footerText = `${parts.join(" · ")}.`;
  }

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }
    const saved = await onSubmit(form);
    if (saved) {
      dispatch({ type: "reset" });
    }
  };

  const tooltipId = `${fieldId}-save-help`;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <DialogContent
        className="flex max-h-[92vh] w-[calc(100vw-1rem)] max-w-[1040px] flex-col gap-0 overflow-hidden p-0 focus-visible:outline-hidden sm:w-[calc(100vw-2rem)] sm:max-w-[1040px]"
        onOpenAutoFocus={(event) => {
          // Focus the dialog itself, not its first control (which would be the stock switch).
          event.preventDefault();
          (event.currentTarget as HTMLElement | null)?.focus();
        }}
      >
        <DialogHeader className="gap-0.5 px-6 pb-3.5 pt-[22px] text-left">
          <DialogTitle>Prescription</DialogTitle>
          <DialogDescription>
            {mode === "complete"
              ? "Pick medicines the pharmacy has in stock, then set the dose and days."
              : "Pick medicines the pharmacy has in stock. The prescription is saved to the patient's record."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-5 pt-1 sm:px-6">
          <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-hair bg-[#f8fafc] px-3.5 py-2.5 dark:bg-white/5">
            <InitialsAvatar name={patientName} size={38} />
            <span className="flex min-w-[140px] flex-1 flex-col">
              <span className="truncate text-[15px] font-extrabold text-ink">{patientName || "Patient"}</span>
              {patientSummary ? <span className="text-xs text-ink-muted">{patientSummary}</span> : null}
            </span>
            {visitLabel ? (
              <Pill tone={/video/i.test(visitLabel) ? "video" : "clinic"}>{visitLabel}</Pill>
            ) : mode === "save" ? (
              <Pill tone="slate">No visit</Pill>
            ) : null}
            {visitStatus ? (
              <Pill tone={statusTone(visitStatus)} dot>
                {statusLabel(visitStatus)}
              </Pill>
            ) : null}
          </div>

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
            {/* Pharmacy stock */}
            <section
              aria-label="Pharmacy stock"
              className="flex flex-col gap-2.5 rounded-[18px] border border-line bg-[#f8fafc] p-3.5 dark:bg-white/5"
            >
              <div className="flex items-center justify-between gap-2.5">
                <h3 className="m-0 text-[15px] font-extrabold text-ink">Pharmacy stock</h3>
                <label
                  htmlFor={`${fieldId}-in-stock`}
                  className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap text-xs font-bold text-ink-soft"
                >
                  In stock only
                  <Switch
                    id={`${fieldId}-in-stock`}
                    checked={form.inStockOnly}
                    onCheckedChange={(checked) => dispatch({ type: "setInStockOnly", value: checked })}
                  />
                </label>
              </div>
              <SearchBox
                value={form.medicineSearch}
                onChange={(value) => dispatch({ type: "setField", field: "medicineSearch", value })}
                placeholder="Search medicine or strength"
              />

              {isLoadingMedicines ? (
                <span className="inline-flex items-center gap-2 py-3 text-xs text-ink-muted" role="status">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  Loading pharmacy stock
                </span>
              ) : stockMessage ? (
                <Note tone="amber" icon={CircleAlert} className="px-3 py-2.5 text-xs">
                  {stockMessage}
                </Note>
              ) : (
                <>
                  <span className="text-xs text-ink-muted">
                    {inStockCount} {inStockCount === 1 ? "medicine" : "medicines"} available now
                    {form.medicineSearch.trim() ? ` · ${visibleMedicines.length} match your search` : ""}
                  </span>
                  {visibleMedicines.length === 0 ? (
                    <span className="rounded-[14px] border border-dashed border-line bg-card px-3 py-4 text-center text-xs text-ink-muted">
                      {medicines.length === 0
                        ? "The pharmacy has no medicines in its stock list yet."
                        : "No medicine matches. Try another name, or turn off In stock only."}
                    </span>
                  ) : (
                    <ul className="m-0 flex max-h-[460px] list-none flex-col gap-2.5 overflow-y-auto p-0">
                      {visibleMedicines.map((medicine) => {
                        const stock = stockOf(medicine);
                        const added = addedIds.has(medicine.id);
                        const title = medicineTitle(medicine);
                        return (
                          <li
                            key={medicine.id}
                            className={cn(
                              "flex items-center gap-2.5 rounded-[14px] border px-3 py-2.5",
                              added
                                ? "border-[#a7f3d0] bg-[#ecfdf5] dark:border-emerald-800 dark:bg-emerald-950/30"
                                : "border-hair bg-card",
                              stock <= 0 && !added && "opacity-60",
                            )}
                          >
                            <span className="flex min-w-0 flex-1 flex-col gap-px">
                              <span className="truncate text-sm font-bold text-ink" title={title}>
                                {title}
                              </span>
                              <span className="text-xs text-ink-muted">
                                {medicineForm(medicine)} ·{" "}
                                {stock <= 0 ? (
                                  <span className="font-bold text-[#e11d48] dark:text-rose-300">Out of stock</span>
                                ) : isLowStock(medicine) ? (
                                  <span className="font-bold text-[#b45309] dark:text-amber-300">{stock} in stock · low</span>
                                ) : (
                                  <span className="font-bold text-brand">{stock} in stock</span>
                                )}
                              </span>
                            </span>
                            {added ? (
                              <span className="inline-flex min-h-8 items-center gap-[5px] rounded-[10px] bg-[#d1fae5] px-2.5 text-xs font-extrabold text-[#065f46] dark:bg-emerald-500/15 dark:text-emerald-300">
                                <Check className="size-[13px]" strokeWidth={2.8} aria-hidden="true" />
                                Added
                              </span>
                            ) : stock <= 0 ? (
                              <span className="whitespace-nowrap px-1.5 text-xs font-bold text-ink-muted">Not available</span>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl px-3.5 text-sm"
                                disabled={medicinesLocked}
                                aria-label={`Add ${title}`}
                                onClick={() => dispatch({ type: "addMedication", value: createMedicationRow(medicine) })}
                              >
                                <Plus aria-hidden="true" />
                                Add
                              </Button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}

              {mode === "complete" ? (
                <button
                  type="button"
                  disabled={medicinesLocked}
                  className="self-start rounded-md px-1 py-0.5 text-left text-xs font-bold text-brand hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50"
                  onClick={() => dispatch({ type: "addMedication", value: createMedicationRow() })}
                >
                  Not in stock? Add an outside medicine
                </button>
              ) : null}
            </section>

            {/* The prescription */}
            <div className="flex min-w-0 flex-col gap-3.5">
              <div className="flex min-w-0 flex-col gap-1.5">
                <label htmlFor={`${fieldId}-diagnosis`} className="text-xs font-bold text-ink-soft">
                  Diagnosis
                </label>
                <Input
                  id={`${fieldId}-diagnosis`}
                  value={form.diagnosis}
                  maxLength={1000}
                  placeholder="For example: post-viral cough"
                  onChange={(event) => dispatch({ type: "setField", field: "diagnosis", value: event.target.value })}
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="m-0 text-[15px] font-extrabold text-ink">Medicines · {form.medications.length}</h3>
                  <span className="text-right text-xs text-ink-muted">Add from the stock list</span>
                </div>

                {form.medications.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-[13px] text-ink-muted">
                    No medicines added yet. Press Add next to a medicine in the pharmacy stock.
                  </div>
                ) : (
                  form.medications.map((medication, index) => {
                    const medicine = medication.medicineId ? medicinesById.get(medication.medicineId) : undefined;
                    const stock = medicine ? stockOf(medicine) : 0;
                    const left = stock - quantityOf(medication);
                    const rowId = `${fieldId}-${medication.id}`;
                    const update = (field: keyof PrescriptionMedicationRow) => (value: string) =>
                      dispatch({ type: "updateMedication", id: medication.id, field, value });

                    return (
                      <fieldset
                        key={medication.id}
                        disabled={medicinesLocked}
                        className="m-0 flex min-w-0 flex-col gap-2.5 rounded-2xl border border-line bg-[#fbfdfc] p-3.5 dark:bg-white/5"
                      >
                        <legend className="sr-only">Medicine {index + 1}</legend>
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#d1fae5] text-xs font-extrabold text-[#065f46] dark:bg-emerald-500/15 dark:text-emerald-300">
                            {index + 1}
                          </span>
                          {medication.medicineId ? (
                            <span className="min-w-0 flex-1 truncate text-[15px] font-extrabold text-ink">{medication.name}</span>
                          ) : (
                            <Input
                              aria-label={`Name of outside medicine ${index + 1}`}
                              className="h-[38px] min-w-0 flex-1 rounded-[10px] px-2.5 text-sm font-bold"
                              placeholder="Medicine name and strength"
                              value={medication.name}
                              onChange={(event) => update("name")(event.target.value)}
                            />
                          )}
                          <span className="hidden whitespace-nowrap text-xs text-ink-muted sm:inline">
                            {medicine ? `${medicineForm(medicine)} · ${stock} in stock` : "Outside medicine"}
                          </span>
                          <button
                            type="button"
                            aria-label={`Remove ${medication.name || `medicine ${index + 1}`}`}
                            className="inline-flex size-[30px] shrink-0 items-center justify-center rounded-[9px] border border-line bg-card text-ink-soft hover:bg-well focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50"
                            onClick={() => dispatch({ type: "removeMedication", id: medication.id })}
                          >
                            <X className="size-[13px]" strokeWidth={2.6} aria-hidden="true" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[0.9fr_1.5fr_0.7fr_0.9fr_1.3fr]">
                          <div className="flex min-w-0 flex-col gap-1">
                            <label htmlFor={`${rowId}-dose`} className={FIELD_LABEL}>
                              Dose
                            </label>
                            <Input
                              id={`${rowId}-dose`}
                              className={SMALL_FIELD}
                              placeholder="1 tablet"
                              value={medication.dosage}
                              onChange={(event) => update("dosage")(event.target.value)}
                            />
                          </div>
                          <div className="flex min-w-0 flex-col gap-1">
                            <label htmlFor={`${rowId}-frequency`} className={FIELD_LABEL}>
                              How often
                            </label>
                            <Select value={medication.frequency} onValueChange={update("frequency")}>
                              <SelectTrigger id={`${rowId}-frequency`} className={cn(SMALL_FIELD, "w-full data-[size=default]:h-[38px]")}>
                                <SelectValue placeholder="Choose" />
                              </SelectTrigger>
                              <SelectContent>
                                {FREQUENCY_OPTIONS.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex min-w-0 flex-col gap-1">
                            <label htmlFor={`${rowId}-days`} className={FIELD_LABEL}>
                              Days
                            </label>
                            <Input
                              id={`${rowId}-days`}
                              type="number"
                              inputMode="numeric"
                              min={1}
                              step={1}
                              className={SMALL_FIELD}
                              placeholder="5"
                              value={medication.days}
                              onChange={(event) => update("days")(event.target.value)}
                            />
                          </div>
                          <div className="flex min-w-0 flex-col gap-1">
                            <label htmlFor={`${rowId}-quantity`} className={FIELD_LABEL}>
                              Quantity
                            </label>
                            <Input
                              id={`${rowId}-quantity`}
                              type="number"
                              inputMode="numeric"
                              min={1}
                              step={1}
                              className={SMALL_FIELD}
                              placeholder="1"
                              value={medication.quantity}
                              onChange={(event) => update("quantity")(event.target.value)}
                            />
                          </div>
                          <div className="col-span-2 flex min-w-0 flex-col gap-1 sm:col-span-1">
                            <label htmlFor={`${rowId}-when`} className={FIELD_LABEL}>
                              When
                            </label>
                            <Select value={medication.when} onValueChange={update("when")}>
                              <SelectTrigger id={`${rowId}-when`} className={cn(SMALL_FIELD, "w-full data-[size=default]:h-[38px]")}>
                                <SelectValue placeholder="Choose" />
                              </SelectTrigger>
                              <SelectContent>
                                {WHEN_OPTIONS.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {medicine ? (
                          left >= 0 ? (
                            <span className="inline-flex items-center gap-[5px] text-xs font-semibold text-brand">
                              <Check className="size-3" strokeWidth={2.8} aria-hidden="true" />
                              {left} left in stock after this
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-[5px] text-xs font-semibold text-[#b45309] dark:text-amber-300">
                              <CircleAlert className="size-3" strokeWidth={2.6} aria-hidden="true" />
                              Only {stock} in stock. The pharmacy cannot give {quantityOf(medication)}.
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-[5px] text-xs font-semibold text-ink-muted">
                            <Info className="size-3" strokeWidth={2.6} aria-hidden="true" />
                            Not sent to the pharmacy. It is saved in the visit notes for the patient to buy outside.
                          </span>
                        )}
                      </fieldset>
                    );
                  })
                )}
              </div>

              <div className="flex min-w-0 flex-col gap-1.5">
                <label htmlFor={`${fieldId}-advice`} className="text-xs font-bold text-ink-soft">
                  Advice to patient
                </label>
                <Textarea
                  id={`${fieldId}-advice`}
                  value={form.advice}
                  maxLength={1000}
                  placeholder="Diet, rest, what to avoid, when to come back"
                  className="min-h-[96px] border-line"
                  onChange={(event) => dispatch({ type: "setField", field: "advice", value: event.target.value })}
                />
              </div>

              {mode === "complete" ? (
                <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <label htmlFor={`${fieldId}-follow-up-date`} className="text-xs font-bold text-ink-soft">
                      Follow-up date
                    </label>
                    <Input
                      id={`${fieldId}-follow-up-date`}
                      type="date"
                      value={form.followUpDate}
                      onChange={(event) => dispatch({ type: "setField", field: "followUpDate", value: event.target.value })}
                    />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <label htmlFor={`${fieldId}-follow-up-note`} className="text-xs font-bold text-ink-soft">
                      Follow-up note
                    </label>
                    <Input
                      id={`${fieldId}-follow-up-note`}
                      value={form.followUpNotes}
                      maxLength={1000}
                      placeholder="What to review at the next visit"
                      onChange={(event) => dispatch({ type: "setField", field: "followUpNotes", value: event.target.value })}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {errorMessage ? (
            <Note tone="rose" icon={CircleAlert}>
              <span role="alert">{errorMessage}</span>
            </Note>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-hair bg-[#f8fafc] px-4 py-3.5 dark:bg-white/5 sm:px-6">
          <span
            className={cn(
              "inline-flex min-w-[200px] flex-1 items-center gap-2 text-[13px]",
              footerWarn ? "font-semibold text-[#b45309] dark:text-amber-300" : "text-ink-muted",
            )}
            role="status"
          >
            {footerWarn ? (
              <CircleAlert className="size-[15px] shrink-0" strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <Info className="size-[15px] shrink-0 text-brand" strokeWidth={2.2} aria-hidden="true" />
            )}
            {footerText}
          </span>
          <Button size="md" variant="outline" disabled={isSubmitting} onClick={onClose}>
            Cancel
          </Button>
          <span className="group relative inline-flex">
            {mode === "complete" ? (
              <span
                id={tooltipId}
                role="tooltip"
                className="pointer-events-none absolute bottom-[calc(100%+12px)] right-0 z-10 hidden w-[290px] flex-col gap-1.5 rounded-[14px] bg-[#0f1b2d] px-3.5 py-3 text-left text-xs font-medium leading-[1.45] text-white shadow-[0_16px_34px_rgba(15,27,45,0.35)] group-focus-within:flex group-hover:flex dark:border dark:border-white/10"
              >
                <span className="text-[13px] font-extrabold">One click does three things</span>
                {[
                  "Completes this appointment",
                  stockRows.length > 0
                    ? `Sends the ${medicineWord(stockRows.length)} to the pharmacy`
                    : "Sends nothing to the pharmacy (no stock medicine added)",
                  "Saves the prescription in the patient's record",
                ].map((line) => (
                  <span key={line} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-[13px] shrink-0 text-[#6ee7b7]" strokeWidth={2.8} aria-hidden="true" />
                    <span>{line}</span>
                  </span>
                ))}
                <span className="absolute -bottom-1.5 right-14 size-3 rotate-45 rounded-[2px] bg-[#0f1b2d]" aria-hidden="true" />
              </span>
            ) : null}
            <Button
              size="md"
              disabled={!canSubmit}
              aria-describedby={mode === "complete" ? tooltipId : undefined}
              onClick={() => void handleSubmit()}
            >
              {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CircleCheck aria-hidden="true" />}
              {isSubmitting ? "Saving…" : mode === "complete" ? "Save and complete" : "Save prescription"}
            </Button>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Steps that already succeeded, so a retry does not send the medicines twice. */
interface SaveProgress {
  pharmacy: { reference: string | null; medicineCount: number } | null;
  appointmentSaved: boolean;
}

function QuickPrescriptionSession({
  isOpen,
  onClose,
  appointmentId,
  patientId,
  patientName,
  doctorId,
  patientSummary,
  visitLabel,
  visitStatus,
  consultationNotes,
  onSaved,
}: QuickPrescriptionModalProps) {
  const { clinicId } = useClinicContext();
  const [progress, setProgress] = useState<SaveProgress>({ pharmacy: null, appointmentSaved: false });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateAppointment = useUpdateAppointment();
  const completeAppointment = useCompleteAppointment();
  const createPharmacyPrescription = useCreatePrescription();
  const {
    data: medicinesData,
    isPending: medicinesLoading,
    error: medicinesError,
  } = useMedicines(clinicId || "", {
    limit: 200,
    inStock: false,
  });

  const inventoryMedicines = useMemo(() => {
    const data = medicinesData as unknown;

    if (Array.isArray(data)) {
      return data as Medicine[];
    }

    if (data && typeof data === "object") {
      const record = data as Record<string, unknown>;
      if (Array.isArray(record.medicines)) {
        return record.medicines as Medicine[];
      }

      if (Array.isArray(record.data)) {
        return record.data as Medicine[];
      }

      if (Array.isArray(record.items)) {
        return record.items as Medicine[];
      }
    }

    return [];
  }, [medicinesData]);

  const handleSubmit = async (form: PrescriptionFormValues): Promise<boolean> => {
    const cleanMedications = form.medications.reduce<PrescriptionMedicationRow[]>((acc, medication) => {
      const normalized = {
        ...medication,
        medicineId: medication.medicineId.trim(),
        name: medication.name.trim(),
        dosage: medication.dosage.trim(),
        frequency: medication.frequency.trim(),
        quantity: medication.quantity.trim(),
      };

      if (normalized.name || normalized.medicineId) {
        acc.push(normalized);
      }

      return acc;
    }, []);

    const diagnosis = form.diagnosis.trim();
    const advice = form.advice.trim();
    const notes = (consultationNotes || "").trim();
    const followUpDate = form.followUpDate;
    const followUpNotes = form.followUpNotes.trim();

    if (!diagnosis && !advice && cleanMedications.length === 0) {
      return false;
    }

    const structuredMedications = cleanMedications
      .filter((medication) => medication.medicineId)
      .map((medication) => ({
        medicineId: medication.medicineId,
        dosage: medication.dosage || medication.name,
        frequency: frequencyOf(medication),
        duration: durationOf(medication),
        quantity: quantityOf(medication),
      }));
    const outsideMedicineCount = cleanMedications.length - structuredMedications.length;

    const prescriptionText = cleanMedications
      .flatMap((medication) => {
        const summary = formatMedicationSummary(medication);
        return summary ? [summary] : [];
      })
      .join("\n");

    setErrorMessage(null);
    let saved = progress;
    let step: "pharmacy" | "appointment" | "complete" = "pharmacy";

    try {
      // 1. The pharmacy prescription: only medicines picked from pharmacy stock go to the pharmacy.
      if (!saved.pharmacy && structuredMedications.length > 0) {
        if (!clinicId) {
          setErrorMessage("No clinic is selected, so the medicines cannot be sent to the pharmacy.");
          return false;
        }
        const created = await createPharmacyPrescription.mutateAsync({
          clinicId,
          patientId,
          doctorId,
          medications: structuredMedications,
          ...(diagnosis ? { diagnosis } : {}),
          ...(advice ? { notes: advice } : {}),
          ...(followUpDate ? { validUntil: followUpDate } : {}),
        });
        saved = {
          ...saved,
          pharmacy: { reference: readPrescriptionReference(created), medicineCount: structuredMedications.length },
        };
        setProgress(saved);
      }

      const metadata = {
        prescriptionIssued: cleanMedications.length > 0,
        medicineSkipped: cleanMedications.length === 0,
        medicineCount: cleanMedications.length,
        sentToPharmacy: Boolean(saved.pharmacy),
        pharmacyMedicineCount: saved.pharmacy?.medicineCount ?? 0,
        ...(saved.pharmacy?.reference ? { pharmacyPrescriptionReference: saved.pharmacy.reference } : {}),
        consultationDraft: {
          diagnosis: diagnosis || null,
          notes: notes || null,
          treatmentPlan: advice || notes || null,
          medicationCount: cleanMedications.length,
          savedAt: new Date().toISOString(),
          savedBy: doctorId,
        },
      };

      // No active appointment to attach consultation notes to when prescribing
      // directly from a patient record (e.g. a walk-in with no visit booked).
      if (appointmentId) {
        // 2. The visit record: diagnosis, advice and the written prescription.
        if (!saved.appointmentSaved) {
          step = "appointment";
          await updateAppointment.mutateAsync({
            id: appointmentId,
            data: {
              // Empty fields are left out so they do not wipe what the visit already has
              // (the booking note, for example).
              ...(diagnosis ? { diagnosis } : {}),
              ...(notes ? { notes } : {}),
              ...(advice || notes ? { treatmentPlan: advice || notes } : {}),
              metadata,
              ...(prescriptionText ? { prescription: prescriptionText } : {}),
              ...(followUpDate ? { followUpDate } : {}),
              ...(followUpNotes ? { followUpNotes } : {}),
            },
          });
          saved = { ...saved, appointmentSaved: true };
          setProgress(saved);
        }

        // 3. Complete the visit.
        step = "complete";
        await completeAppointment.mutateAsync({
          id: appointmentId,
          data: {
            ...(diagnosis ? { diagnosis } : {}),
            ...(notes || advice ? { notes: (notes || advice).slice(0, 1000) } : {}),
            ...(followUpDate ? { followUpDate } : {}),
            ...(followUpNotes ? { followUpNotes } : {}),
            metadata: { ...metadata, source: "doctor-dashboard" },
          },
        });
      }

      const result: PrescriptionSavedResult = {
        ...(appointmentId ? { appointmentId } : {}),
        appointmentCompleted: Boolean(appointmentId),
        patientName,
        pharmacyMedicineCount: saved.pharmacy?.medicineCount ?? 0,
        outsideMedicineCount,
        prescriptionNumber: saved.pharmacy?.reference ?? null,
        followUpDate: followUpDate || null,
      };
      setProgress({ pharmacy: null, appointmentSaved: false });
      onClose();
      await onSaved?.(result);
      return true;
    } catch (error) {
      console.error("Failed to save prescription:", { step, error });
      setErrorMessage(
        step === "pharmacy"
          ? "The medicines could not be sent to the pharmacy. Nothing was saved. Please try again."
          : saved.pharmacy
            ? "The medicines reached the pharmacy, but the visit is not completed yet. Press Save and complete again to finish."
            : "The visit could not be completed. Please try again."
      );
      return false;
    }
  };

  const isSubmitting =
    updateAppointment.isPending || createPharmacyPrescription.isPending || completeAppointment.isPending;

  return (
    <PrescriptionDialogView
      isOpen={isOpen}
      onClose={onClose}
      patientName={patientName}
      patientSummary={patientSummary}
      visitLabel={visitLabel}
      visitStatus={visitStatus}
      mode={appointmentId ? "complete" : "save"}
      medicines={inventoryMedicines}
      isLoadingMedicines={Boolean(clinicId) && medicinesLoading}
      stockMessage={
        !clinicId
          ? "No clinic is selected, so the pharmacy stock cannot be shown."
          : medicinesError
            ? "The pharmacy stock could not be loaded. Close this and try again."
            : null
      }
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      medicinesLocked={Boolean(progress.pharmacy)}
      onSubmit={handleSubmit}
    />
  );
}

/**
 * Prescribing dialog. With an appointment, "Save and complete" sends the stock medicines to
 * the pharmacy, saves the prescription on the visit and completes the appointment. Without one
 * (from a patient record) it saves the pharmacy prescription only.
 */
export function QuickPrescriptionModal(props: QuickPrescriptionModalProps) {
  // A new key per patient and visit gives each prescription its own empty form.
  return <QuickPrescriptionSession key={`${props.appointmentId || "direct"}:${props.patientId}`} {...props} />;
}
