"use client";

import { useId } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Note } from "@/components/tbd";
import {
  DialogError,
  Field,
  FormSectionLabel,
  MedicineSummary,
  PharmacyDialog,
  PharmacyDialogActions,
  PharmacyDialogBody,
  RupeeField,
  fieldAria,
} from "./PharmacyDialogParts";
import { DOSAGE_FORMS, todayKey, type MedicineRow } from "./pharmacy-inventory.logic";
import {
  ADD_MEDICINE_DEFAULTS,
  addMedicineSchema,
  editMedicineSchema,
  restockSchema,
  toUpdateMedicinePayload,
  type AddMedicineValues,
  type EditMedicineValues,
  type RestockValues,
} from "./pharmacy-inventory.schemas";

const NO_SUPPLIER = "none";

// ── Add medicine ───────────────────────────────────────────────────────────

interface PharmacyAddMedicineDialogProps {
  open: boolean;
  /** Suppliers for the optional supplier list. */
  suppliers: { id: string; name: string }[];
  /** Prefills the name (a restock link whose medicine is not in the list yet). */
  initialName?: string;
  isSaving?: boolean;
  errorMessage?: string | null;
  onSubmit: (values: AddMedicineValues) => void;
  onClose: () => void;
}

/**
 * Board `PhInventoryAddMedicine`. Asks only for what `POST /pharmacy/inventory` stores:
 * name, manufacturer, dosage form, supplier, expiry date, price, opening stock, minimum
 * stock level, description and dosage instructions.
 */
export function PharmacyAddMedicineDialog({
  open,
  suppliers,
  initialName = "",
  isSaving = false,
  errorMessage = null,
  onSubmit,
  onClose,
}: PharmacyAddMedicineDialogProps) {
  return (
    <PharmacyDialog
      open={open}
      onClose={onClose}
      busy={isSaving}
      title="Add medicine"
      description="A new medicine for the stock list. The doctor can prescribe it once it is saved."
      width={780}
    >
      {open ? (
        <AddMedicineForm
          suppliers={suppliers}
          initialName={initialName}
          isSaving={isSaving}
          errorMessage={errorMessage}
          onSubmit={onSubmit}
          onClose={onClose}
        />
      ) : null}
    </PharmacyDialog>
  );
}

function AddMedicineForm({
  suppliers,
  initialName,
  isSaving,
  errorMessage,
  onSubmit,
  onClose,
}: Required<Pick<PharmacyAddMedicineDialogProps, "suppliers" | "initialName" | "isSaving" | "onSubmit" | "onClose">> & {
  errorMessage: string | null;
}) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddMedicineValues>({
    resolver: zodResolver(addMedicineSchema),
    defaultValues: { ...ADD_MEDICINE_DEFAULTS, name: initialName },
    mode: "onTouched",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <PharmacyDialogBody>
        <FormSectionLabel>Medicine</FormSectionLabel>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="Medicine name" htmlFor={id("name")} error={errors.name?.message}>
            <Input
              {...register("name")}
              {...fieldAria(id("name"), errors.name?.message)}
              placeholder="Amoxicillin 500 mg"
              autoComplete="off"
            />
          </Field>
          <Field label="Manufacturer" htmlFor={id("manufacturer")} error={errors.manufacturer?.message}>
            <Input
              {...register("manufacturer")}
              {...fieldAria(id("manufacturer"), errors.manufacturer?.message)}
              placeholder="Cipla"
              autoComplete="off"
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="Dosage form" htmlFor={id("dosageForm")} error={errors.dosageForm?.message}>
            <Controller
              control={control}
              name="dosageForm"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    className="w-full"
                    onBlur={field.onBlur}
                    {...fieldAria(id("dosageForm"), errors.dosageForm?.message)}
                  >
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOSAGE_FORMS.map((form) => (
                      <SelectItem key={form.value} value={form.value}>
                        {form.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field
            label="Supplier (optional)"
            htmlFor={id("supplierId")}
            hint={suppliers.length === 0 ? "No suppliers are set up for this clinic." : undefined}
          >
            <Controller
              control={control}
              name="supplierId"
              render={({ field }) => (
                <Select
                  value={field.value || NO_SUPPLIER}
                  onValueChange={(value) => field.onChange(value === NO_SUPPLIER ? "" : value)}
                  disabled={suppliers.length === 0}
                >
                  <SelectTrigger className="w-full" id={id("supplierId")} onBlur={field.onBlur}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SUPPLIER}>No supplier</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>

        <FormSectionLabel>Price and stock</FormSectionLabel>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="Expiry date" htmlFor={id("expiryDate")} error={errors.expiryDate?.message}>
            <Input
              type="date"
              min={todayKey()}
              {...register("expiryDate")}
              {...fieldAria(id("expiryDate"), errors.expiryDate?.message)}
            />
          </Field>
          <Field label="Price per unit" htmlFor={id("unitPrice")} error={errors.unitPrice?.message}>
            <RupeeField>
              <Input
                inputMode="decimal"
                {...register("unitPrice")}
                {...fieldAria(id("unitPrice"), errors.unitPrice?.message)}
                placeholder="7"
                autoComplete="off"
              />
            </RupeeField>
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="Opening stock" htmlFor={id("stockQuantity")} error={errors.stockQuantity?.message}>
            <Input
              inputMode="numeric"
              {...register("stockQuantity")}
              {...fieldAria(id("stockQuantity"), errors.stockQuantity?.message)}
              placeholder="100"
              autoComplete="off"
            />
          </Field>
          <Field
            label="Minimum stock level"
            htmlFor={id("minStockLevel")}
            hint="Low stock warning at or below this"
            error={errors.minStockLevel?.message}
          >
            <Input
              inputMode="numeric"
              {...register("minStockLevel")}
              {...fieldAria(id("minStockLevel"), errors.minStockLevel?.message)}
              placeholder="20"
              autoComplete="off"
            />
          </Field>
        </div>

        <FormSectionLabel>More details (optional)</FormSectionLabel>
        <Field label="Description" htmlFor={id("description")} error={errors.description?.message}>
          <Textarea
            {...register("description")}
            {...fieldAria(id("description"), errors.description?.message)}
            className="min-h-16"
            placeholder="Antibiotic for chest, ear and throat infections."
          />
        </Field>
        <Field
          label="Dosage instructions"
          htmlFor={id("instructions")}
          hint="How it is usually taken"
          error={errors.instructions?.message}
        >
          <Input
            {...register("instructions")}
            {...fieldAria(id("instructions"), errors.instructions?.message)}
            placeholder="1 capsule three times a day, after food"
            autoComplete="off"
          />
        </Field>

        <DialogError lead="The medicine was not saved." message={errorMessage} />
      </PharmacyDialogBody>

      <PharmacyDialogActions>
        <Button size="md" variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button size="md" type="submit" disabled={isSaving}>
          <Plus aria-hidden="true" />
          {isSaving ? "Saving…" : "Add medicine"}
        </Button>
      </PharmacyDialogActions>
    </form>
  );
}

// ── Edit medicine ──────────────────────────────────────────────────────────

interface PharmacyEditMedicineDialogProps {
  /** The medicine to edit; null closes the dialog. */
  medicine: MedicineRow | null;
  isSaving?: boolean;
  errorMessage?: string | null;
  onSubmit: (medicine: MedicineRow, values: EditMedicineValues) => void;
  onClose: () => void;
}

/**
 * Board `PhInventoryEditMedicine`. `PATCH /pharmacy/inventory/:id` can change the price and
 * the stock count only, so those are the two fields; the rest of the record is shown, not edited.
 */
export function PharmacyEditMedicineDialog({
  medicine,
  isSaving = false,
  errorMessage = null,
  onSubmit,
  onClose,
}: PharmacyEditMedicineDialogProps) {
  return (
    <PharmacyDialog
      open={medicine !== null}
      onClose={onClose}
      busy={isSaving}
      title="Edit medicine"
      description={medicine ? `${medicine.name} · price and stock count` : undefined}
      width={640}
    >
      {medicine ? (
        <EditMedicineForm
          key={medicine.id}
          medicine={medicine}
          isSaving={isSaving}
          errorMessage={errorMessage}
          onSubmit={onSubmit}
          onClose={onClose}
        />
      ) : null}
    </PharmacyDialog>
  );
}

function EditMedicineForm({
  medicine,
  isSaving,
  errorMessage,
  onSubmit,
  onClose,
}: {
  medicine: MedicineRow;
  isSaving: boolean;
  errorMessage: string | null;
  onSubmit: (medicine: MedicineRow, values: EditMedicineValues) => void;
  onClose: () => void;
}) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EditMedicineValues>({
    resolver: zodResolver(editMedicineSchema),
    defaultValues: {
      unitPrice: medicine.price > 0 ? String(medicine.price) : "",
      stockQuantity: String(medicine.stock),
    },
    mode: "onTouched",
  });
  const values = useWatch({ control });
  const parsed = editMedicineSchema.safeParse(values);
  const changed = parsed.success ? toUpdateMedicinePayload(parsed.data, medicine) !== null : true;
  const difference = parsed.success ? Number(parsed.data.stockQuantity) - medicine.stock : 0;

  return (
    <form onSubmit={handleSubmit((formValues) => onSubmit(medicine, formValues))} noValidate>
      <PharmacyDialogBody>
        <MedicineSummary medicine={medicine} />
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="Price per unit" htmlFor={id("unitPrice")} error={errors.unitPrice?.message}>
            <RupeeField>
              <Input
                inputMode="decimal"
                {...register("unitPrice")}
                {...fieldAria(id("unitPrice"), errors.unitPrice?.message)}
                autoComplete="off"
              />
            </RupeeField>
          </Field>
          <Field
            label="Stock quantity"
            htmlFor={id("stockQuantity")}
            hint={
              difference === 0
                ? `What is on the shelf now, in ${medicine.unit}`
                : `${Math.abs(difference)} ${medicine.unit} ${difference > 0 ? "more" : "fewer"} than the ${medicine.stock} recorded`
            }
            error={errors.stockQuantity?.message}
          >
            <Input
              inputMode="numeric"
              {...register("stockQuantity")}
              {...fieldAria(id("stockQuantity"), errors.stockQuantity?.message)}
              autoComplete="off"
            />
          </Field>
        </div>
        <Note tone="blue">
          Only the price and the stock count can be changed here for now. To record a delivery, use Restock.
        </Note>
        <DialogError lead="The changes were not saved." message={errorMessage} />
      </PharmacyDialogBody>

      <PharmacyDialogActions>
        <Button size="md" variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button size="md" type="submit" disabled={isSaving || !changed}>
          <Save aria-hidden="true" />
          {isSaving ? "Saving…" : "Save changes"}
        </Button>
      </PharmacyDialogActions>
    </form>
  );
}

// ── Restock ────────────────────────────────────────────────────────────────

interface PharmacyRestockDialogProps {
  /** The medicine to restock; null closes the dialog. */
  medicine: MedicineRow | null;
  isSaving?: boolean;
  errorMessage?: string | null;
  /** `quantity` is the number of units received. */
  onSubmit: (medicine: MedicineRow, quantity: number) => void;
  onClose: () => void;
}

/** Board `PhInventoryRestock`: stock now + quantity received = new stock. */
export function PharmacyRestockDialog({
  medicine,
  isSaving = false,
  errorMessage = null,
  onSubmit,
  onClose,
}: PharmacyRestockDialogProps) {
  return (
    <PharmacyDialog
      open={medicine !== null}
      onClose={onClose}
      busy={isSaving}
      title="Restock medicine"
      description="Enter what you received. The new stock shows on the doctor's prescription screen."
      width={640}
    >
      {medicine ? (
        <RestockForm
          key={medicine.id}
          medicine={medicine}
          isSaving={isSaving}
          errorMessage={errorMessage}
          onSubmit={onSubmit}
          onClose={onClose}
        />
      ) : null}
    </PharmacyDialog>
  );
}

function StockBox({ tone, value, unit }: { tone: "now" | "short" | "new"; value: number; unit: string }) {
  return (
    <span
      className={
        tone === "new"
          ? "flex min-h-11 items-center gap-2 rounded-xl bg-mint-soft px-3.5 text-base font-extrabold text-[#065f46] dark:text-emerald-300"
          : tone === "short"
            ? "flex min-h-11 items-center gap-2 rounded-xl bg-well px-3.5 text-base font-extrabold text-[#b45309] dark:text-amber-300"
            : "flex min-h-11 items-center gap-2 rounded-xl bg-well px-3.5 text-base font-extrabold text-ink"
      }
    >
      {value}
      <span className="text-xs font-medium text-ink-muted">{unit}</span>
    </span>
  );
}

function RestockForm({
  medicine,
  isSaving,
  errorMessage,
  onSubmit,
  onClose,
}: {
  medicine: MedicineRow;
  isSaving: boolean;
  errorMessage: string | null;
  onSubmit: (medicine: MedicineRow, quantity: number) => void;
  onClose: () => void;
}) {
  const uid = useId();
  const inputId = `${uid}-quantity`;
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RestockValues>({
    resolver: zodResolver(restockSchema),
    defaultValues: { quantity: "" },
    mode: "onTouched",
  });
  const typed = useWatch({ control, name: "quantity" });
  const received = /^\d+$/.test(String(typed ?? "").trim()) ? Number(typed) : 0;

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(medicine, Number(values.quantity)))} noValidate>
      <PharmacyDialogBody>
        <MedicineSummary medicine={medicine} />
        <div className="grid grid-cols-1 items-start gap-2.5 sm:grid-cols-[minmax(0,1fr)_18px_minmax(0,1fr)_18px_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-xs font-bold text-ink-soft">In stock now</span>
            <StockBox tone={medicine.status === "in_stock" ? "now" : "short"} value={medicine.stock} unit={medicine.unit} />
          </div>
          <span className="mt-[22px] hidden h-11 items-center justify-center text-ink-muted sm:flex" aria-hidden="true">
            <Plus className="size-[18px]" />
          </span>
          <Field label="Quantity received" htmlFor={inputId} error={errors.quantity?.message}>
            <Input
              inputMode="numeric"
              {...register("quantity")}
              {...fieldAria(inputId, errors.quantity?.message)}
              placeholder="100"
              autoComplete="off"
            />
          </Field>
          <span className="mt-[22px] hidden h-11 items-center justify-center text-ink-muted sm:flex" aria-hidden="true">
            <ArrowRight className="size-[18px]" />
          </span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-xs font-bold text-ink-soft">New stock</span>
            <output htmlFor={inputId} aria-live="polite">
              <StockBox tone="new" value={medicine.stock + received} unit={medicine.unit} />
            </output>
          </div>
        </div>
        {medicine.minStock > 0 ? (
          <p className="m-0 text-xs text-ink-muted">
            Minimum stock level: {medicine.minStock} {medicine.unit}.
          </p>
        ) : null}
        <DialogError lead="The stock was not updated." message={errorMessage} />
      </PharmacyDialogBody>

      <PharmacyDialogActions>
        <Button size="md" variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button size="md" type="submit" disabled={isSaving}>
          <Check aria-hidden="true" />
          {isSaving ? "Updating…" : "Update stock"}
        </Button>
      </PharmacyDialogActions>
    </form>
  );
}
