"use client";

import { useId } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save } from "lucide-react";
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
import { MEDICINE_CLASSIFICATIONS } from "@/lib/constants/medicine-types";
import { DOSAGE_FORMS, todayKey, type MedicineRow } from "./pharmacy-inventory.logic";
import {
  ADD_MEDICINE_DEFAULTS,
  NO_CLASSIFICATION,
  addMedicineSchema,
  editMedicineSchema,
  toEditMedicineValues,
  toUpdateMedicinePayload,
  type AddMedicineValues,
  type EditMedicineValues,
} from "./pharmacy-inventory.schemas";

const NO_SUPPLIER = "none";
/** Select value for "no classification" (a Radix select item cannot have an empty value). */
const NO_CLASSIFICATION_OPTION = "none";

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
 * name, manufacturer, dosage form, supplier, expiry date, price, minimum stock level,
 * description and dosage instructions. A new medicine starts with no stock: stock arrives as
 * a batch (Receive stock, or a purchase order receipt).
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
      description="A new medicine for the stock list. Add its stock afterwards with Receive stock."
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

        <FormSectionLabel>Price and reorder level</FormSectionLabel>
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
  /** Suppliers for the supplier list. */
  suppliers: { id: string; name: string }[];
  isSaving?: boolean;
  errorMessage?: string | null;
  onSubmit: (medicine: MedicineRow, values: EditMedicineValues) => void;
  onClose: () => void;
}

/**
 * Board `PhInventoryEditMedicine`. Edits what `PATCH /pharmacy/inventory/:id` stores: name,
 * manufacturer, dosage form, classification, unit, supplier, expiry date, minimum stock level and
 * price. Only the fields that changed are sent. Stock is not edited here: it moves through batches.
 */
export function PharmacyEditMedicineDialog({
  medicine,
  suppliers,
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
      description={medicine ? medicine.name : undefined}
      width={780}
    >
      {medicine ? (
        <EditMedicineForm
          key={medicine.id}
          medicine={medicine}
          suppliers={suppliers}
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
  suppliers,
  isSaving,
  errorMessage,
  onSubmit,
  onClose,
}: {
  medicine: MedicineRow;
  suppliers: { id: string; name: string }[];
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
    defaultValues: toEditMedicineValues(medicine),
    mode: "onTouched",
  });
  const values = useWatch({ control });
  const parsed = editMedicineSchema.safeParse(values);
  const changed = parsed.success ? toUpdateMedicinePayload(parsed.data, medicine) !== null : true;
  // The row's supplier may be one the list no longer has; it stays choosable so nothing is lost.
  const supplierOptions =
    medicine.supplierId && !suppliers.some((supplier) => supplier.id === medicine.supplierId)
      ? [{ id: medicine.supplierId, name: medicine.supplierName || "Current supplier" }, ...suppliers]
      : suppliers;

  return (
    <form onSubmit={handleSubmit((formValues) => onSubmit(medicine, formValues))} noValidate>
      <PharmacyDialogBody>
        <MedicineSummary medicine={medicine} />

        <FormSectionLabel>Medicine</FormSectionLabel>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="Medicine name" htmlFor={id("name")} error={errors.name?.message}>
            <Input {...register("name")} {...fieldAria(id("name"), errors.name?.message)} autoComplete="off" />
          </Field>
          <Field label="Manufacturer" htmlFor={id("manufacturer")} error={errors.manufacturer?.message}>
            <Input
              {...register("manufacturer")}
              {...fieldAria(id("manufacturer"), errors.manufacturer?.message)}
              autoComplete="off"
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
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
          <Field label="Classification" htmlFor={id("classification")} error={errors.classification?.message}>
            <Controller
              control={control}
              name="classification"
              render={({ field }) => (
                <Select
                  value={field.value || NO_CLASSIFICATION_OPTION}
                  onValueChange={(value) => field.onChange(value === NO_CLASSIFICATION_OPTION ? NO_CLASSIFICATION : value)}
                >
                  <SelectTrigger className="w-full" id={id("classification")} onBlur={field.onBlur}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CLASSIFICATION_OPTION}>Not set</SelectItem>
                    {MEDICINE_CLASSIFICATIONS.map((entry) => (
                      <SelectItem key={entry.value} value={entry.value}>
                        {entry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Unit" htmlFor={id("unit")} hint="tablet, ml, gm …" error={errors.unit?.message}>
            <Input {...register("unit")} {...fieldAria(id("unit"), errors.unit?.message)} autoComplete="off" />
          </Field>
        </div>
        <Field
          label="Supplier"
          htmlFor={id("supplierId")}
          hint={supplierOptions.length === 0 ? "No suppliers are set up for this clinic." : undefined}
        >
          <Controller
            control={control}
            name="supplierId"
            render={({ field }) => (
              <Select
                value={field.value || NO_SUPPLIER}
                onValueChange={(value) => field.onChange(value === NO_SUPPLIER ? "" : value)}
                disabled={supplierOptions.length === 0}
              >
                <SelectTrigger className="w-full" id={id("supplierId")} onBlur={field.onBlur}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SUPPLIER}>No supplier</SelectItem>
                  {supplierOptions.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <FormSectionLabel>Price, expiry and reorder level</FormSectionLabel>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
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
          <Field label="Expiry date" htmlFor={id("expiryDate")} error={errors.expiryDate?.message}>
            <Input type="date" {...register("expiryDate")} {...fieldAria(id("expiryDate"), errors.expiryDate?.message)} />
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
              autoComplete="off"
            />
          </Field>
        </div>
        <Note tone="blue">
          Stock is not changed here: use Receive stock for a delivery, or Batches to correct a lot.
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
