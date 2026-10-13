"use client";

import { useDeferredValue, useId, useMemo, useReducer, useState, type KeyboardEvent, type UIEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronsUpDown,
  CircleAlert,
  CircleCheck,
  Clock,
  Info,
  Leaf,
  Loader2,
  Plus,
  Search,
  Star,
  X,
} from "lucide-react";
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
import { useCompleteAppointment } from "@/hooks/query/useAppointments";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useCreatePrescription, useMedicines } from "@/hooks/query/usePharmacy";
import type { Medicine } from "@/types/pharmacy.types";
import { prescriptionReference } from "@/lib/utils/labels";
import { asRecord, trimmedString } from "@/lib/utils/coerce";

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

/** The pharmacy list can hold thousands of medicines: render this many at a time and load more on scroll. */
const MEDICINE_PAGE_SIZE = 40;

/** What a new medicine starts with; the doctor changes it only when it differs. */
const DEFAULT_FREQUENCY = "Twice a day, after food";
const DEFAULT_DAYS = "10";

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
  frequency: DEFAULT_FREQUENCY,
  days: DEFAULT_DAYS,
  quantity: "1",
  when: "",
});

/** One choice for how often and when: the pharmacy line has a single frequency field. */
const FREQUENCY_OPTIONS = [
  "Once a day, after food",
  "Once a day, before food",
  "Once a day, in the morning",
  "Once a day, at night",
  "Twice a day, after food",
  "Twice a day, before food",
  "Twice a day",
  "Three times a day, after food",
  "Three times a day, before food",
  "Three times a day",
  "Four times a day",
  "At bedtime",
  "On an empty stomach",
  "When needed",
];

/** "Paracetamol 500 mg": the name, plus the strength when the name does not already say it. */
function medicineTitle(medicine: Medicine): string {
  const name = String(medicine.name || "").trim();
  const strength = String(medicine.strength || "").trim();
  if (!strength || name.toLowerCase().includes(strength.toLowerCase())) {
    return readableName(name);
  }
  return readableName(`${name} ${strength}`);
}

/** Combination formulations are stored as "a+b+c": show them as "a + b + c" so each ingredient reads on its own. */
function readableName(name: string): string {
  return name.replace(/\s*\+\s*/g, " + ").replace(/\s{2,}/g, " ").trim();
}

/** The words a doctor typed, split on spaces and "+" so they can come in any order. */
function searchTerms(query: string): string[] {
  return query.toLowerCase().split(/[\s+]+/).filter(Boolean);
}

/**
 * How well a medicine matches every typed word, or -1 when one word is missing.
 * A match at the start of the name ranks highest, then the start of a word, then anywhere.
 */
function matchScore(medicine: Medicine, terms: string[]): number {
  const name = medicine.name.toLowerCase();
  const text = medicine.strength ? `${name} ${String(medicine.strength).toLowerCase()}` : name;
  let score = 0;
  for (const term of terms) {
    const at = text.indexOf(term);
    if (at < 0) return -1;
    score += at === 0 ? 3 : /[\s+(]/.test(text.charAt(at - 1)) ? 2 : 1;
  }
  return score;
}

/** The medicine name with the typed words highlighted. */
function HighlightedName({ text, terms }: { text: string; terms: string[] }) {
  if (terms.length === 0) return <>{text}</>;
  const lower = text.toLowerCase();
  const marked: boolean[] = Array.from({ length: text.length }, () => false);
  for (const term of terms) {
    const at = lower.indexOf(term);
    if (at >= 0) for (let index = at; index < at + term.length; index += 1) marked[index] = true;
  }
  const parts: { text: string; on: boolean }[] = [];
  for (let index = 0; index < text.length; index += 1) {
    const char = text.charAt(index);
    const on = marked[index] === true;
    const last = parts[parts.length - 1];
    if (last && last.on === on) last.text += char;
    else parts.push({ text: char, on });
  }
  return (
    <>
      {parts.map((part, index) =>
        part.on ? (
          <mark key={index} className="rounded-[3px] bg-[#fff0a8] px-px text-inherit dark:bg-yellow-700/50">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
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
  const outer = asRecord(result);
  if (!outer) return null;
  const record = asRecord(outer.data) ?? outer;
  return prescriptionReference(trimmedString(record.id), record) || null;
}

/** Favourite and recently used medicines are remembered on this device, per browser profile. */
const FAVOURITES_KEY = "rx-favourite-medicines";
const RECENT_KEY = "rx-recent-medicines";
const RECENT_LIMIT = 30;
const ALL_OPTION = "__all";

function readStoredIds(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeStoredIds(key: string, ids: string[]): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // Storage can be full or blocked; the lists then last only for this visit.
  }
}

type CatalogueTab = "all" | "favourites" | "recent";

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

  // With no stock recorded at all, "in stock only" would hide the whole catalogue, so it does not apply.
  const stockTracked = inStockCount > 0;
  const stockOnly = form.inStockOnly && stockTracked;

  const [tab, setTab] = useState<CatalogueTab>("all");
  const [formFilter, setFormFilter] = useState(ALL_OPTION);
  const [brandFilter, setBrandFilter] = useState(ALL_OPTION);
  const [favouriteIds, setFavouriteIds] = useState<string[]>(() => readStoredIds(FAVOURITES_KEY));
  const [recentIds, setRecentIds] = useState<string[]>(() => readStoredIds(RECENT_KEY));
  const [shown, setShown] = useState(MEDICINE_PAGE_SIZE);
  const [activeIndex, setActiveIndex] = useState(0);
  const deferredSearch = useDeferredValue(form.medicineSearch);
  const terms = useMemo(() => searchTerms(deferredSearch), [deferredSearch]);

  const formOptions = useMemo(
    () => [...new Set(medicines.map((medicine) => String(medicine.dosageForm || "").trim()).filter(Boolean))].sort(),
    [medicines]
  );
  const brandOptions = useMemo(
    () => [...new Set(medicines.map((medicine) => String(medicine.manufacturer || "").trim()).filter(Boolean))].sort(),
    [medicines]
  );
  const favouriteSet = useMemo(() => new Set(favouriteIds), [favouriteIds]);
  const recentRank = useMemo(() => new Map(recentIds.map((id, index) => [id, index])), [recentIds]);

  const toggleFavourite = (medicineId: string) => {
    setFavouriteIds((current) => {
      const next = current.includes(medicineId) ? current.filter((id) => id !== medicineId) : [medicineId, ...current];
      writeStoredIds(FAVOURITES_KEY, next);
      return next;
    });
  };

  const matchingMedicines = useMemo(() => {
    const ranked: { medicine: Medicine; score: number }[] = [];
    for (const medicine of medicines) {
      // A medicine that was already added stays in the list so it can be seen as "Added".
      if (stockOnly && stockOf(medicine) <= 0 && !addedIds.has(medicine.id)) continue;
      if (tab === "favourites" && !favouriteSet.has(medicine.id)) continue;
      if (tab === "recent" && !recentRank.has(medicine.id)) continue;
      if (formFilter !== ALL_OPTION && String(medicine.dosageForm || "").trim() !== formFilter) continue;
      if (brandFilter !== ALL_OPTION && String(medicine.manufacturer || "").trim() !== brandFilter) continue;
      const score = terms.length > 0 ? matchScore(medicine, terms) : 0;
      if (score < 0) continue;
      ranked.push({ medicine, score });
    }
    ranked.sort((a, b) => {
      if (tab === "recent") return (recentRank.get(a.medicine.id) ?? 0) - (recentRank.get(b.medicine.id) ?? 0);
      if (b.score !== a.score) return b.score - a.score;
      if (stockTracked) {
        const byStock = Number(stockOf(b.medicine) > 0) - Number(stockOf(a.medicine) > 0);
        if (byStock !== 0) return byStock;
      }
      return a.medicine.name.localeCompare(b.medicine.name);
    });
    return ranked.map((entry) => entry.medicine);
  }, [addedIds, brandFilter, favouriteSet, formFilter, medicines, recentRank, stockOnly, stockTracked, tab, terms]);

  const visibleMedicines = useMemo(() => matchingMedicines.slice(0, shown), [matchingMedicines, shown]);
  const activeMedicine = visibleMedicines[Math.min(activeIndex, Math.max(0, visibleMedicines.length - 1))];

  /** Back to the top of the list whenever the search or a filter changes. */
  const resetList = () => {
    setShown(MEDICINE_PAGE_SIZE);
    setActiveIndex(0);
  };
  const addMedicine = (medicine: Medicine) => {
    dispatch({ type: "addMedication", value: createMedicationRow(medicine) });
    setRecentIds((current) => {
      const next = [medicine.id, ...current.filter((id) => id !== medicine.id)].slice(0, RECENT_LIMIT);
      writeStoredIds(RECENT_KEY, next);
      return next;
    });
  };
  const onSearchKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      const count = visibleMedicines.length;
      if (count === 0) return;
      const next = (activeIndex + step + count) % count;
      setActiveIndex(next);
      const nextMedicine = visibleMedicines[next];
      if (nextMedicine) document.getElementById(`${fieldId}-med-${nextMedicine.id}`)?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter") {
      // Enter adds the highlighted medicine instead of submitting the form.
      event.preventDefault();
      if (activeMedicine && !medicinesLocked && !addedIds.has(activeMedicine.id)) addMedicine(activeMedicine);
    }
  };
  const onListScroll = (event: UIEvent<HTMLUListElement>) => {
    const list = event.currentTarget;
    if (list.scrollTop + list.clientHeight > list.scrollHeight - 80 && shown < matchingMedicines.length) {
      setShown((count) => count + MEDICINE_PAGE_SIZE);
    }
  };

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
        className="flex max-h-[92vh] w-[calc(100vw-1rem)] max-w-[1040px] flex-col gap-0 overflow-hidden p-0 focus-visible:outline-hidden sm:w-[calc(100vw-2rem)] sm:max-w-[1040px] xl:max-w-[1440px]"
        onOpenAutoFocus={(event) => {
          // Focus the dialog itself, not its first control (which would be the stock switch).
          event.preventDefault();
          (event.currentTarget as HTMLElement | null)?.focus();
        }}
      >
        <DialogHeader className="gap-0.5 px-6 pb-3.5 pt-[22px] text-left">
          <DialogTitle>Prescription</DialogTitle>
          <DialogDescription>
            Find medicines quickly. Review before saving.
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

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            {/* Medicine catalogue */}
            <section
              aria-label="Medicine catalogue"
              className="flex min-w-0 flex-col gap-3 rounded-[18px] border border-line bg-card p-4"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="m-0 text-lg font-extrabold text-ink">Medicine catalogue</h3>
                <span className="rounded-full bg-well px-2.5 py-0.5 text-xs font-bold text-ink-soft">
                  {medicines.length.toLocaleString("en-IN")} medicines
                </span>
              </div>
              <div onKeyDown={onSearchKeyDown} className="flex flex-col gap-1">
                <SearchBox
                  value={form.medicineSearch}
                  onChange={(value) => {
                    dispatch({ type: "setField", field: "medicineSearch", value });
                    resetList();
                  }}
                  placeholder="Search by name, brand or ingredient"
                />
                <span className="text-xs text-ink-muted">Search by name, brand or ingredient</span>
              </div>

              <div className="grid grid-cols-3 gap-1 rounded-[12px] bg-well p-1" role="tablist" aria-label="Medicine list">
                {(
                  [
                    { value: "all", label: "All medicines", icon: Leaf },
                    { value: "favourites", label: "Favourites", icon: Star },
                    { value: "recent", label: "Recent", icon: Clock },
                  ] as const
                ).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={tab === value}
                    className={cn(
                      "inline-flex h-9 items-center justify-center gap-2 rounded-[10px] text-sm font-bold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
                      tab === value ? "bg-card text-ink shadow-sm ring-1 ring-brand/40" : "text-ink-soft hover:text-ink",
                    )}
                    onClick={() => {
                      setTab(value);
                      resetList();
                    }}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 items-center gap-2.5 sm:grid-cols-[1fr_1fr_auto]">
                <Select
                  value={formFilter}
                  onValueChange={(value) => {
                    setFormFilter(value);
                    resetList();
                  }}
                >
                  <SelectTrigger aria-label="Filter by form" className={cn(SMALL_FIELD, "w-full data-[size=default]:h-[38px]")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_OPTION}>All forms</SelectItem>
                    {formOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={brandFilter}
                  onValueChange={(value) => {
                    setBrandFilter(value);
                    resetList();
                  }}
                >
                  <SelectTrigger aria-label="Filter by brand" className={cn(SMALL_FIELD, "w-full data-[size=default]:h-[38px]")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_OPTION}>All brands</SelectItem>
                    {brandOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label
                  htmlFor={`${fieldId}-in-stock`}
                  className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm font-semibold text-ink-soft"
                >
                  <Switch
                    id={`${fieldId}-in-stock`}
                    checked={stockOnly}
                    disabled={!stockTracked}
                    onCheckedChange={(checked) => dispatch({ type: "setInStockOnly", value: checked })}
                  />
                  In stock only
                </label>
              </div>

              {isLoadingMedicines ? (
                <span className="inline-flex items-center gap-2 py-3 text-xs text-ink-muted" role="status">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  Loading the medicine catalogue
                </span>
              ) : stockMessage ? (
                <Note tone="amber" icon={CircleAlert} className="px-3 py-2.5 text-xs">
                  {stockMessage}
                </Note>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="m-0 text-base font-extrabold text-ink">
                      {terms.length > 0 ? `Matches for \u201c${deferredSearch.trim()}\u201d` : tab === "all" ? "All medicines" : tab === "favourites" ? "Favourites" : "Recently used"}
                    </h4>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
                      {terms.length > 0 ? "Best match first" : "A to Z"}
                      <ChevronsUpDown className="size-3.5" aria-hidden="true" />
                    </span>
                  </div>
                  {matchingMedicines.length === 0 ? (
                    <span className="rounded-[14px] border border-dashed border-line bg-card px-3 py-4 text-center text-xs text-ink-muted">
                      {medicines.length === 0
                        ? "The pharmacy has no medicines in its stock list yet."
                        : tab === "favourites"
                          ? "No favourites yet. Press the star next to a medicine to keep it here."
                          : tab === "recent"
                            ? "Medicines you add will show up here."
                            : "No medicine matches. Check the spelling, clear a filter, or turn off In stock only."}
                    </span>
                  ) : (
                    <ul
                      className="m-0 grid max-h-[420px] list-none grid-cols-1 content-start gap-2 overflow-y-auto overscroll-contain p-0 sm:grid-cols-2"
                      onScroll={onListScroll}
                    >
                      {visibleMedicines.map((medicine, index) => {
                        const stock = stockOf(medicine);
                        const added = addedIds.has(medicine.id);
                        const title = medicineTitle(medicine);
                        const favourite = favouriteSet.has(medicine.id);
                        return (
                          <li
                            key={medicine.id}
                            id={`${fieldId}-med-${medicine.id}`}
                            className={cn(
                              "flex min-w-0 items-center gap-2 rounded-[12px] border px-3 py-2",
                              added
                                ? "border-[#a7f3d0] bg-[#ecfdf5] dark:border-emerald-800 dark:bg-emerald-950/30"
                                : "border-hair bg-card",
                              index === activeIndex && !added && "ring-2 ring-brand/60",
                              stockTracked && stock <= 0 && !added && "opacity-60",
                            )}
                          >
                            <span className="min-w-0 flex-1 break-words text-sm font-bold leading-snug text-ink">
                              <HighlightedName text={title} terms={terms} />
                              {stockTracked && stock <= 0 ? (
                                <span className="ml-1.5 whitespace-nowrap text-xs font-bold text-[#e11d48] dark:text-rose-300">Out of stock</span>
                              ) : stockTracked && isLowStock(medicine) ? (
                                <span className="ml-1.5 whitespace-nowrap text-xs font-bold text-[#b45309] dark:text-amber-300">{stock} left</span>
                              ) : null}
                            </span>
                            <button
                              type="button"
                              aria-pressed={favourite}
                              aria-label={favourite ? `Remove ${title} from favourites` : `Add ${title} to favourites`}
                              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:text-ink focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
                              onClick={() => toggleFavourite(medicine.id)}
                            >
                              <Star
                                className={cn("size-[18px]", favourite && "fill-amber-400 text-amber-500")}
                                aria-hidden="true"
                              />
                            </button>
                            {added ? (
                              <span className="inline-flex min-h-8 shrink-0 items-center gap-[5px] rounded-[10px] bg-[#d1fae5] px-2.5 text-xs font-extrabold text-[#065f46] dark:bg-emerald-500/15 dark:text-emerald-300">
                                <Check className="size-[13px]" strokeWidth={2.8} aria-hidden="true" />
                                Added
                              </span>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="shrink-0 rounded-xl px-3 text-sm"
                                disabled={medicinesLocked}
                                aria-label={`Add ${title}`}
                                onClick={() => addMedicine(medicine)}
                              >
                                <Plus aria-hidden="true" />
                                Add
                              </Button>
                            )}
                          </li>
                        );
                      })}
                      {matchingMedicines.length > visibleMedicines.length ? (
                        <li className="py-2 text-center text-xs text-ink-muted sm:col-span-2">
                          Scroll for more · {matchingMedicines.length - visibleMedicines.length} left
                        </li>
                      ) : null}
                    </ul>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
                    {!stockTracked ? (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-[#b45309] dark:text-amber-300">
                        <CircleAlert className="size-3.5" aria-hidden="true" />
                        Stock levels have not been recorded
                      </span>
                    ) : (
                      <span>
                        {inStockCount.toLocaleString("en-IN")} of {medicines.length.toLocaleString("en-IN")} in stock now
                        {terms.length > 0 || tab !== "all" ? ` \u00b7 ${matchingMedicines.length.toLocaleString("en-IN")} match` : ""}
                      </span>
                    )}
                    <span className="hidden items-center gap-1.5 sm:inline-flex" aria-hidden="true">
                      <ArrowUp className="size-3.5 rounded border border-line p-px" />
                      <ArrowDown className="size-3.5 rounded border border-line p-px" />
                      Navigate
                      <kbd className="rounded border border-line bg-well px-1.5 py-0.5 font-sans text-[11px]">Enter</kbd>
                      Add
                    </span>
                  </div>
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
                  placeholder="Enter diagnosis"
                  onChange={(event) => dispatch({ type: "setField", field: "diagnosis", value: event.target.value })}
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="m-0 inline-flex items-center gap-2.5 text-lg font-extrabold text-ink">
                    Prescription
                    <span className="rounded-full bg-[#d1fae5] px-2.5 py-0.5 text-xs font-bold text-[#065f46] dark:bg-emerald-500/15 dark:text-emerald-300">
                      {medicineWord(form.medications.length)}
                    </span>
                  </h3>
                </div>

                {form.medications.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-[13px] text-ink-muted">
                    No medicines added yet. Press Add next to a medicine in the pharmacy stock.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                  {form.medications.map((medication, index) => {
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
                        <div className="flex items-start gap-2.5">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#d1fae5] text-xs font-extrabold text-[#065f46] dark:bg-emerald-500/15 dark:text-emerald-300">
                            {index + 1}
                          </span>
                          {medication.medicineId ? (
                            <span className="min-w-0 flex-1 break-words text-[15px] font-extrabold leading-snug text-ink">{medication.name}</span>
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
                            {medicine ? (stockTracked ? `${stock} in stock` : "") : "Outside medicine"}
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

                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[1fr_1.7fr_0.6fr_0.6fr]">
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
                              Frequency
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
                              placeholder="10"
                              value={medication.days}
                              onChange={(event) => update("days")(event.target.value)}
                            />
                          </div>
                          <div className="flex min-w-0 flex-col gap-1">
                            <label htmlFor={`${rowId}-quantity`} className={FIELD_LABEL}>
                              Qty
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
                        </div>

                        {medicine ? (
                          !stockTracked ? (
                            <span className="inline-flex items-center gap-[5px] text-xs font-semibold text-ink-muted">
                              <Info className="size-3" strokeWidth={2.6} aria-hidden="true" />
                              The pharmacy has not recorded stock for this medicine yet. It is saved on the prescription.
                            </span>
                          ) : left >= 0 ? (
                            <span className="inline-flex items-center gap-[5px] text-xs font-semibold text-brand">
                              <Check className="size-3" strokeWidth={2.8} aria-hidden="true" />
                              {left} left in stock after this
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-[5px] text-xs font-semibold text-[#b45309] dark:text-amber-300">
                              <CircleAlert className="size-3" strokeWidth={2.6} aria-hidden="true" />
                              {stock <= 0
                                ? "Not in stock. It is saved on the prescription; the pharmacy can give it once stock is added."
                                : `Only ${stock} in stock. The pharmacy cannot give ${quantityOf(medication)} yet.`}
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
                  })}
                  </div>
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

/** The step that already succeeded, so a retry does not send the medicines twice. */
interface SaveProgress {
  pharmacy: { reference: string | null; medicineCount: number } | null;
}

/** The longest text the complete-visit request accepts in one field. */
const VISIT_TEXT_LIMIT = 1000;

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
  const [progress, setProgress] = useState<SaveProgress>({ pharmacy: null });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    let step: "pharmacy" | "complete" = "pharmacy";

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

      // The visit record. The appointment has no diagnosis or prescription columns: the
      // backend keeps this text in the appointment metadata, and completing a visit merges
      // the metadata it is given. So the record is saved by the same request that completes
      // the visit, and there is no step in between that could fail on its own.
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
          prescription: prescriptionText || null,
          followUpDate: followUpDate || null,
          followUpNotes: followUpNotes || null,
          medicationCount: cleanMedications.length,
          savedAt: new Date().toISOString(),
          savedBy: doctorId,
        },
        source: "doctor-dashboard",
      };

      // No active appointment to attach consultation notes to when prescribing
      // directly from a patient record (e.g. a walk-in with no visit booked).
      if (appointmentId) {
        // 2. Complete the visit and save its record. Only fields the complete-visit request
        // accepts are sent; the follow-up note travels in the metadata above.
        step = "complete";
        await completeAppointment.mutateAsync({
          id: appointmentId,
          data: {
            ...(diagnosis ? { diagnosis } : {}),
            ...(notes || advice ? { notes: (notes || advice).slice(0, VISIT_TEXT_LIMIT) } : {}),
            ...(prescriptionText ? { prescription: prescriptionText.slice(0, VISIT_TEXT_LIMIT) } : {}),
            ...(followUpDate ? { followUpDate } : {}),
            metadata,
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
      setProgress({ pharmacy: null });
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

  const isSubmitting = createPharmacyPrescription.isPending || completeAppointment.isPending;

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
 * the pharmacy, then completes the appointment and saves the visit record with it. Without one
 * (from a patient record) it saves the pharmacy prescription only.
 */
export function QuickPrescriptionModal(props: QuickPrescriptionModalProps) {
  // A new key per patient and visit gives each prescription its own empty form.
  return <QuickPrescriptionSession key={`${props.appointmentId || "direct"}:${props.patientId}`} {...props} />;
}
