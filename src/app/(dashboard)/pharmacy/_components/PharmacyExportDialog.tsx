"use client";

import { useId } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download, FileText, IndianRupee, Package, Pill as PillIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TbdIcon } from "@/components/tbd";
import { cn } from "@/lib/utils";
import {
  DialogError,
  Field,
  PharmacyDialog,
  PharmacyDialogActions,
  PharmacyDialogBody,
  fieldAria,
} from "./PharmacyDialogParts";
import { todayKey } from "./pharmacy-inventory.logic";
import {
  EXPORTABLE_FORMATS,
  EXPORTABLE_TYPES,
  exportSchema,
  type ExportFormat,
  type ExportType,
  type ExportValues,
} from "./pharmacy-inventory.schemas";

const TYPE_OPTIONS: { value: ExportType; label: string; icon: TbdIcon; about: string }[] = [
  { value: "medicines", label: "Medicines", icon: PillIcon, about: "Every medicine with its maker, type and price." },
  { value: "inventory", label: "Inventory", icon: Package, about: "Stock, minimum level, expiry date and stock value of every medicine." },
  { value: "prescriptions", label: "Prescriptions", icon: FileText, about: "Prescriptions sent to the pharmacy, with their medicines and payment status." },
  { value: "sales", label: "Sales", icon: IndianRupee, about: "Prescriptions, units and paid revenue for each day." },
];

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [{ value: "csv", label: "CSV" }];

/** One choice of a single-select row (radio semantics). */
function Choice({
  selected,
  disabled,
  icon: Icon,
  onSelect,
  children,
}: {
  selected: boolean;
  disabled: boolean;
  icon?: TbdIcon;
  onSelect: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      title={disabled ? `${children} is not available yet` : undefined}
      onClick={onSelect}
      className={cn(
        "inline-flex min-h-11 min-w-0 flex-1 basis-[120px] items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm transition-colors",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-[1.5px] border-[#047857] bg-mint-soft font-bold text-[#065f46] dark:text-emerald-300"
          : "border border-line bg-card font-semibold text-ink hover:bg-mint-soft",
      )}
    >
      {Icon ? <Icon className="size-4 shrink-0" strokeWidth={2.2} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

interface PharmacyExportDialogProps {
  open: boolean;
  isExporting?: boolean;
  errorMessage?: string | null;
  onSubmit: (values: ExportValues) => void;
  onClose: () => void;
}

/**
 * Board `PhInventoryExport`. The file is built from the lists and reports the API serves, and it is
 * always CSV (opens in Excel and Google Sheets): medicines, inventory, prescriptions or daily sales.
 */
export function PharmacyExportDialog({
  open,
  isExporting = false,
  errorMessage = null,
  onSubmit,
  onClose,
}: PharmacyExportDialogProps) {
  return (
    <PharmacyDialog
      open={open}
      onClose={onClose}
      busy={isExporting}
      title="Reports"
      description="Download pharmacy data as a file."
      width={600}
    >
      {open ? (
        <ExportForm isExporting={isExporting} errorMessage={errorMessage} onSubmit={onSubmit} onClose={onClose} />
      ) : null}
    </PharmacyDialog>
  );
}

function ExportForm({
  isExporting,
  errorMessage,
  onSubmit,
  onClose,
}: {
  isExporting: boolean;
  errorMessage: string | null;
  onSubmit: (values: ExportValues) => void;
  onClose: () => void;
}) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ExportValues>({
    resolver: zodResolver(exportSchema),
    defaultValues: { type: "inventory", format: "csv", startDate: "", endDate: "" },
    mode: "onTouched",
  });
  const type = useWatch({ control, name: "type" });
  const about = TYPE_OPTIONS.find((option) => option.value === type)?.about ?? "";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <PharmacyDialogBody>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <div className="flex min-w-0 flex-col gap-1.5">
              <span id={id("type")} className="text-xs font-bold text-ink-soft">
                What to export
              </span>
              <div role="radiogroup" aria-labelledby={id("type")} className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map((option) => (
                  <Choice
                    key={option.value}
                    icon={option.icon}
                    selected={field.value === option.value}
                    disabled={!EXPORTABLE_TYPES.includes(option.value)}
                    onSelect={() => field.onChange(option.value)}
                  >
                    {option.label}
                  </Choice>
                ))}
              </div>
              <span className="text-xs text-ink-muted">{about}</span>
            </div>
          )}
        />

        <Controller
          control={control}
          name="format"
          render={({ field }) => (
            <div className="flex min-w-0 flex-col gap-1.5">
              <span id={id("format")} className="text-xs font-bold text-ink-soft">
                File type
              </span>
              <div role="radiogroup" aria-labelledby={id("format")} className="flex flex-wrap gap-2">
                {FORMAT_OPTIONS.map((option) => (
                  <Choice
                    key={option.value}
                    selected={field.value === option.value}
                    disabled={!EXPORTABLE_FORMATS.includes(option.value)}
                    onSelect={() => field.onChange(option.value)}
                  >
                    {option.label}
                  </Choice>
                ))}
              </div>
              <span className="text-xs text-ink-muted">CSV opens in Excel and Google Sheets.</span>
            </div>
          )}
        />

        {type === "prescriptions" || type === "sales" ? (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field
              label="From"
              htmlFor={id("startDate")}
              hint={type === "sales" ? "Leave empty for the 1st of this month" : "Leave empty for all dates"}
              error={errors.startDate?.message}
            >
              <Input
                type="date"
                max={todayKey()}
                {...register("startDate")}
                {...fieldAria(id("startDate"), errors.startDate?.message)}
              />
            </Field>
            <Field label="To" htmlFor={id("endDate")} error={errors.endDate?.message}>
              <Input
                type="date"
                max={todayKey()}
                {...register("endDate")}
                {...fieldAria(id("endDate"), errors.endDate?.message)}
              />
            </Field>
          </div>
        ) : null}

        <DialogError lead="The file was not created." message={errorMessage} />
      </PharmacyDialogBody>

      <PharmacyDialogActions>
        <Button size="md" variant="outline" onClick={onClose} disabled={isExporting}>
          Cancel
        </Button>
        <Button size="md" type="submit" disabled={isExporting}>
          <Download aria-hidden="true" />
          {isExporting ? "Exporting…" : "Export"}
        </Button>
      </PharmacyDialogActions>
    </form>
  );
}
