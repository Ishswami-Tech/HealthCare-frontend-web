"use client";

import { useId, useMemo, useReducer, useState, type ReactNode } from "react";
import { Check, CircleAlert, CircleCheck, Info, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InitialsAvatar, Note, Pill, statusLabel, statusTone, TBD_SURFACE } from "@/components/tbd";
import { cn } from "@/lib/utils";
import type { Medicine } from "@/types/pharmacy.types";
import type { useMedicineFavourites, useRxKits } from "@/hooks/query/useDoctorFavourites";
import { DiagnosisPicker } from "./DiagnosisPicker";
import { MedicineCatalogue } from "./MedicineCatalogue";
import { PrescriptionLines } from "./PrescriptionLines";
import { RxShortcutsDrawer } from "./RxShortcutsDrawer";
import { DictationButton, useVoiceMedicineInput } from "./VoiceInput";
import {
  createMedicationRow,
  emptyPrescriptionForm,
  isMedicationComplete,
  prescriptionFormReducer,
  quantityOf,
  stockOf,
  type PrescriptionFormValues,
  type PrescriptionMedicationRow,
} from "./rx-form.logic";
import type { RxKit } from "./rx-shortcuts.logic";

/**
 * "complete": saving also completes the appointment. "save": prescription only (no visit).
 * "draft": the assistant's draft for the doctor. "edit": changes a saved, not-yet-dispensed prescription.
 */
export type PrescriptionEditorMode = "complete" | "save" | "draft" | "edit";

/** Favourites, recent medicines and kits of the signed-in prescriber (from `QuickPrescriptionModal`). */
export interface PrescriptionShortcuts {
  favourites: ReturnType<typeof useMedicineFavourites>;
  kits: ReturnType<typeof useRxKits>;
  recentIds: readonly string[];
}

export interface PrescriptionEditorProps {
  /** "dialog" (quick Rx over the current screen) or "page" (new / edit prescription pages). */
  presentation?: "dialog" | "page";
  /** Dialog only. */
  isOpen?: boolean;
  onClose: () => void;
  patientName: string;
  patientSummary?: string;
  visitLabel?: string;
  visitStatus?: string;
  mode: PrescriptionEditorMode;
  medicines: Medicine[];
  isLoadingMedicines: boolean;
  stockMessage?: string | null;
  isSubmitting: boolean;
  errorMessage?: string | null;
  /** True after the medicines reached the pharmacy: they can no longer be changed here. */
  medicinesLocked?: boolean;
  initialValues?: PrescriptionFormValues;
  /** Saves the form. Resolves true when everything was saved. */
  onSubmit: (values: PrescriptionFormValues) => Promise<boolean>;
  onSearchChange?: (value: string) => void;
  isSearching?: boolean;
  shortcuts: PrescriptionShortcuts;
}

const medicineWord = (count: number) => `${count} ${count === 1 ? "medicine" : "medicines"}`;

const SUBMIT_LABEL: Record<PrescriptionEditorMode, string> = {
  complete: "Save and complete",
  save: "Save prescription",
  draft: "Save draft",
  edit: "Save changes",
};

/** The prescribing screen: stock list on the left, the prescription on the right, the save bar below. */
export function PrescriptionEditor({
  presentation = "dialog",
  isOpen = true,
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
  onSearchChange,
  isSearching = false,
  shortcuts,
}: PrescriptionEditorProps) {
  const [form, dispatch] = useReducer(prescriptionFormReducer, initialValues, (initial) => initial ?? emptyPrescriptionForm());
  const [managing, setManaging] = useState(false);
  const fieldId = useId();

  const medicinesById = useMemo(() => new Map(medicines.map((medicine) => [medicine.id, medicine])), [medicines]);
  const addedIds = useMemo(() => new Set(form.medications.map((medication) => medication.medicineId).filter(Boolean)), [form.medications]);
  const stockTracked = useMemo(() => medicines.some((medicine) => stockOf(medicine) > 0), [medicines]);
  const allowOutside = mode === "complete";

  const addMedicine = (medicine: Medicine) =>
    dispatch({ type: "addMedication", value: createMedicationRow(medicine, shortcuts.favourites.presetFor(medicine.id)) });
  const addRows = (rows: PrescriptionMedicationRow[]) => dispatch({ type: "addMedications", value: rows });
  const addKit = (kit: RxKit) =>
    addRows(
      kit.items.map((item) =>
        createMedicationRow(medicinesById.get(item.medicineId) ?? { id: item.medicineId, name: item.name, strength: "" }, item),
      ),
    );
  // Voice: mic + language sit inside the medicine search box; what was heard shows below it.
  const voiceInput = useVoiceMedicineInput({
    medicines,
    kits: shortcuts.kits.kits,
    disabled: medicinesLocked,
    onAddRows: addRows,
    onAddKit: addKit,
  });

  const stockRows = form.medications.filter((medication) => medication.medicineId);
  const outsideRows = form.medications.filter((medication) => !medication.medicineId);
  const namedOutsideRows = outsideRows.filter((medication) => medication.name.trim());
  const incompleteCount = form.medications.filter((medication) => !isMedicationComplete(medication)).length;
  const shortCount = stockRows.filter((medication) => {
    const medicine = medicinesById.get(medication.medicineId);
    return medicine ? quantityOf(medication) > stockOf(medicine) : false;
  }).length;

  // Without a visit, a diagnosis or advice alone is saved in the patient's record (EHR); with one,
  // outside medicines count too because they travel in the visit notes.
  const hasNote = Boolean(form.diagnosis.trim() || form.advice.trim());
  const hasContent =
    mode === "draft" || mode === "edit"
      ? stockRows.length > 0
      : mode === "complete"
        ? hasNote || stockRows.length > 0 || namedOutsideRows.length > 0
        : hasNote || stockRows.length > 0;
  const canSubmit = hasContent && incompleteCount === 0 && !isSubmitting;

  let footerText: string;
  let footerWarn = false;
  if (incompleteCount > 0) {
    footerText =
      outsideRows.length > namedOutsideRows.length && incompleteCount === outsideRows.length - namedOutsideRows.length
        ? "Write the name of the outside medicine."
        : `Set the dose, how often and days for ${incompleteCount === 1 ? "1 medicine" : `${incompleteCount} medicines`}.`;
    footerWarn = true;
  } else if (form.medications.length === 0) {
    footerText =
      mode === "draft"
        ? "Add at least one medicine from the stock list. The doctor reviews the draft before it reaches the pharmacy."
        : mode === "edit"
          ? "Keep at least one medicine from the stock list on the prescription."
          : mode === "complete"
            ? "No medicines added. Nothing goes to the pharmacy."
            : hasNote
              ? "No medicines added. The diagnosis and advice are saved in the patient's record; nothing goes to the pharmacy."
              : "Add a medicine from the stock list, or write a diagnosis or advice, to save this prescription.";
  } else {
    const parts: string[] = [];
    if (stockRows.length > 0) {
      parts.push(
        shortCount > 0
          ? `${medicineWord(stockRows.length)} · ${shortCount === 1 ? "1 needs" : `${shortCount} need`} more than the pharmacy has`
          : `${medicineWord(stockRows.length)}, ${stockRows.length === 1 ? "in stock" : stockRows.length === 2 ? "both in stock" : "all in stock"}`,
      );
      footerWarn = shortCount > 0;
    }
    if (namedOutsideRows.length > 0) {
      parts.push(`${medicineWord(namedOutsideRows.length)} from outside, kept in the visit notes`);
    }
    footerText = `${parts.join(" · ")}.${mode === "draft" ? " Saved as a draft for the doctor to approve." : ""}`;
  }

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const saved = await onSubmit(form);
    if (saved && presentation === "dialog") dispatch({ type: "reset" });
  };

  const tooltipId = `${fieldId}-save-help`;
  const appendTo = (field: "advice", text: string) =>
    dispatch({ type: "setField", field, value: form[field].trim() ? `${form[field].trim()} ${text}` : text });

  const title = mode === "draft" ? "Prescription draft" : mode === "edit" ? "Edit prescription" : "Prescription";
  const description =
    mode === "draft"
      ? "The doctor reviews and approves this draft before it reaches the pharmacy."
      : mode === "edit"
        ? "Change the medicines, diagnosis or advice. The pharmacy sees the update."
        : "Find medicines by name, add kits or speak them. Review before saving.";

  const body = (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-4", presentation === "dialog" && "overflow-y-auto px-4 pb-5 pt-1 sm:px-6")}>
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

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <MedicineCatalogue
          medicines={medicines}
          isLoading={isLoadingMedicines}
          stockMessage={stockMessage ?? null}
          search={form.medicineSearch}
          onSearchChange={(value) => {
            dispatch({ type: "setField", field: "medicineSearch", value });
            onSearchChange?.(value);
          }}
          isSearching={isSearching}
          inStockOnly={form.inStockOnly}
          onInStockOnlyChange={(value) => dispatch({ type: "setInStockOnly", value })}
          addedIds={addedIds}
          locked={medicinesLocked}
          onAdd={addMedicine}
          favouriteIds={shortcuts.favourites.ids}
          onToggleFavourite={shortcuts.favourites.toggle}
          recentIds={shortcuts.recentIds}
          kits={shortcuts.kits.kits}
          onAddKit={addKit}
          onManageShortcuts={() => setManaging(true)}
          {...(allowOutside ? { onAddOutside: () => dispatch({ type: "addMedication", value: createMedicationRow() }) } : {})}
          voice={voiceInput.panel}
          voiceControls={voiceInput.controls}
        />

        <div className="flex min-w-0 flex-col gap-3.5">
          <DiagnosisPicker value={form.diagnosis} onChange={(value) => dispatch({ type: "setField", field: "diagnosis", value })} />

          <div className="flex flex-col gap-2.5">
            <h3 className="m-0 inline-flex items-center gap-2.5 text-lg font-extrabold text-ink">
              Prescription
              <span className="rounded-full bg-[#d1fae5] px-2.5 py-0.5 text-xs font-bold text-[#065f46] dark:bg-emerald-500/15 dark:text-emerald-300">
                {medicineWord(form.medications.length)}
              </span>
            </h3>
            <PrescriptionLines
              medications={form.medications}
              medicinesById={medicinesById}
              stockTracked={stockTracked}
              locked={medicinesLocked}
              onUpdate={(id, field, value) => dispatch({ type: "updateMedication", id, field, value })}
              onRemove={(id) => dispatch({ type: "removeMedication", id })}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={`${fieldId}-advice`} className="text-xs font-bold text-ink-soft">
                Advice to patient
              </label>
              <DictationButton onText={(text) => appendTo("advice", text)} />
            </div>
            <Textarea
              id={`${fieldId}-advice`}
              value={form.advice}
              maxLength={1000}
              placeholder="Diet, rest, precautions..."
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
  );

  const footer = (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-2.5 border-t border-hair bg-[#f8fafc] px-4 py-3.5 dark:bg-white/5 sm:px-6",
        presentation === "page" && "sticky bottom-0 z-10 rounded-b-[20px]",
      )}
    >
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
              stockRows.length > 0 ? `Sends the ${medicineWord(stockRows.length)} to the pharmacy` : "Sends nothing to the pharmacy (no stock medicine added)",
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
        <Button size="md" disabled={!canSubmit} aria-describedby={mode === "complete" ? tooltipId : undefined} onClick={() => void handleSubmit()}>
          {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CircleCheck aria-hidden="true" />}
          {isSubmitting ? "Saving…" : SUBMIT_LABEL[mode]}
        </Button>
      </span>
    </div>
  );

  const drawer: ReactNode = (
    <RxShortcutsDrawer
      open={managing}
      onClose={() => setManaging(false)}
      medicines={medicines}
      favourites={shortcuts.favourites}
      kits={shortcuts.kits}
    />
  );

  if (presentation === "page") {
    return (
      <section aria-label={title} className={cn(TBD_SURFACE, "flex min-w-0 flex-col")}>
        <div className="flex flex-col gap-4 p-4 sm:p-5">{body}</div>
        {footer}
        {drawer}
      </section>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting && !managing) onClose();
      }}
    >
      <DialogContent
        className="flex max-h-[92vh] w-[calc(100vw-1rem)] max-w-[1040px] flex-col gap-0 overflow-hidden p-0 focus-visible:outline-hidden sm:w-[calc(100vw-2rem)] sm:max-w-[1040px] xl:max-w-[1440px]"
        onOpenAutoFocus={(event) => {
          // Focus the dialog itself, not its first control (which would be the stock switch).
          event.preventDefault();
          (event.currentTarget as HTMLElement | null)?.focus();
        }}
      >
        <DialogHeader className="gap-0.5 px-6 pb-3.5 pt-[22px] text-left">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {body}
        {footer}
      </DialogContent>
      {drawer}
    </Dialog>
  );
}
