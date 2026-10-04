import { z } from "zod";
import { DOSAGE_FORMS, todayKey, type DosageFormValue } from "./pharmacy-inventory.logic";

/**
 * Form schemas for the inventory dialogs. Inputs keep what the pharmacist typed (strings);
 * the `to…Payload` helpers turn valid values into the numbers the hooks expect.
 * Only fields the backend stores are asked for.
 */

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const wholeNumber = (label: string, min: number, max = 1_000_000) =>
  z
    .string()
    .trim()
    .min(1, `Enter ${label}.`)
    .refine((value) => /^\d+$/.test(value), "Use a whole number.")
    .refine((value) => Number(value) >= min, min === 1 ? "Must be at least 1." : `Must be ${min} or more.`)
    .refine((value) => Number(value) <= max, `Must be ${max.toLocaleString("en-IN")} or less.`);

const rupees = (label: string, allowZero: boolean) =>
  z
    .string()
    .trim()
    .min(1, `Enter ${label}.`)
    .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), "Use a number such as 7 or 7.50.")
    .refine((value) => (allowZero ? Number(value) >= 0 : Number(value) > 0), "Must be more than 0.")
    .refine((value) => Number(value) <= 10_000_000, "This amount is too large.");

const dosageFormValues = DOSAGE_FORMS.map((form) => form.value) as [DosageFormValue, ...DosageFormValue[]];

// ── Add medicine ───────────────────────────────────────────────────────────

export const addMedicineSchema = z.object({
  name: z.string().trim().min(2, "Enter the medicine name.").max(120, "Use 120 characters or fewer."),
  manufacturer: z.string().trim().min(2, "Enter the manufacturer.").max(120, "Use 120 characters or fewer."),
  dosageForm: z.enum(dosageFormValues, { message: "Choose a dosage form." }),
  /** "" = no supplier. */
  supplierId: z.string(),
  expiryDate: z
    .string()
    .regex(DATE_KEY, "Choose the expiry date.")
    .refine((value) => value >= todayKey(), "The expiry date is in the past."),
  unitPrice: rupees("the price per unit", false),
  stockQuantity: wholeNumber("the opening stock", 0),
  minStockLevel: wholeNumber("the minimum stock level", 0),
  description: z.string().trim().max(500, "Use 500 characters or fewer."),
  instructions: z.string().trim().max(200, "Use 200 characters or fewer."),
});

export type AddMedicineValues = z.infer<typeof addMedicineSchema>;

export const ADD_MEDICINE_DEFAULTS: AddMedicineValues = {
  name: "",
  manufacturer: "",
  dosageForm: "TABLET",
  supplierId: "",
  expiryDate: "",
  unitPrice: "",
  stockQuantity: "",
  minStockLevel: "10",
  description: "",
  instructions: "",
};

/** The variables of `useCreateMedicine` (without `clinicId`). */
export function toCreateMedicinePayload(values: AddMedicineValues) {
  return {
    name: values.name.trim(),
    manufacturer: values.manufacturer.trim(),
    dosageForm: values.dosageForm,
    unitPrice: Number(values.unitPrice),
    stockQuantity: Number(values.stockQuantity),
    minStockLevel: Number(values.minStockLevel),
    expiryDate: values.expiryDate,
    description: values.description.trim(),
    ...(values.instructions.trim() ? { instructions: values.instructions.trim() } : {}),
    ...(values.supplierId ? { supplierId: values.supplierId } : {}),
  };
}

// ── Edit medicine (price and stock count) ──────────────────────────────────

export const editMedicineSchema = z.object({
  unitPrice: rupees("the price per unit", false),
  stockQuantity: wholeNumber("the stock quantity", 0),
});

export type EditMedicineValues = z.infer<typeof editMedicineSchema>;

/**
 * The `updates` of `useUpdateMedicine`: the backend moves stock by a difference, so the new
 * count is sent as `quantityChange`. Returns null when nothing changed.
 */
export function toUpdateMedicinePayload(
  values: EditMedicineValues,
  current: { stock: number; price: number },
): { unitPrice?: number; quantityChange?: number } | null {
  const price = Number(values.unitPrice);
  const quantityChange = Number(values.stockQuantity) - current.stock;
  const updates = {
    ...(price !== current.price ? { unitPrice: price } : {}),
    ...(quantityChange !== 0 ? { quantityChange } : {}),
  };
  return Object.keys(updates).length > 0 ? updates : null;
}

// ── Restock ────────────────────────────────────────────────────────────────

export const restockSchema = z.object({
  quantity: wholeNumber("the quantity received", 1, 100_000),
});

export type RestockValues = z.infer<typeof restockSchema>;

// ── New order ──────────────────────────────────────────────────────────────

export const newOrderSchema = z
  .object({
    supplierId: z.string().min(1, "Choose a supplier."),
    /** "" = not set. */
    expectedDeliveryDate: z
      .string()
      .refine((value) => value === "" || DATE_KEY.test(value), "Choose a date.")
      .refine((value) => value === "" || value >= todayKey(), "The delivery date is in the past."),
    items: z
      .array(
        z.object({
          medicineId: z.string().min(1, "Choose a medicine."),
          quantity: wholeNumber("the quantity", 1, 100_000),
          /** "" = price not known yet. */
          unitPrice: z
            .string()
            .trim()
            .refine((value) => value === "" || /^\d+(\.\d{1,2})?$/.test(value), "Use a number such as 11 or 11.50."),
        }),
      )
      .min(1, "Add at least one medicine."),
    notes: z.string().trim().max(500, "Use 500 characters or fewer."),
  })
  .superRefine((values, context) => {
    const seen = new Set<string>();
    values.items.forEach((item, index) => {
      if (!item.medicineId) return;
      if (seen.has(item.medicineId)) {
        context.addIssue({
          code: "custom",
          message: "This medicine is already on the order.",
          path: ["items", index, "medicineId"],
        });
      }
      seen.add(item.medicineId);
    });
  });

export type NewOrderValues = z.infer<typeof newOrderSchema>;

/** The variables of `useCreatePharmacyOrder` (without `clinicId`). */
export function toCreateOrderPayload(values: NewOrderValues) {
  return {
    supplierId: values.supplierId,
    medicines: values.items.map((item) => ({
      medicineId: item.medicineId,
      quantity: Number(item.quantity),
      ...(item.unitPrice.trim() ? { unitPrice: Number(item.unitPrice) } : {}),
    })),
    ...(values.expectedDeliveryDate ? { expectedDeliveryDate: values.expectedDeliveryDate } : {}),
    ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
  };
}

// ── Export ─────────────────────────────────────────────────────────────────

export const EXPORT_TYPES = ["medicines", "inventory", "prescriptions", "sales"] as const;
export const EXPORT_FORMATS = ["csv", "excel", "pdf"] as const;

export type ExportType = (typeof EXPORT_TYPES)[number];
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

/** What `exportPharmacyData` can build today: CSV of medicines, inventory and prescriptions. */
export const EXPORTABLE_TYPES: readonly ExportType[] = ["medicines", "inventory", "prescriptions"];
export const EXPORTABLE_FORMATS: readonly ExportFormat[] = ["csv"];

export const exportSchema = z
  .object({
    type: z.enum(EXPORT_TYPES),
    format: z.enum(EXPORT_FORMATS),
    /** Only used for prescriptions. "" = no limit. */
    startDate: z.string().refine((value) => value === "" || DATE_KEY.test(value), "Choose a date."),
    endDate: z.string().refine((value) => value === "" || DATE_KEY.test(value), "Choose a date."),
  })
  .refine((values) => EXPORTABLE_TYPES.includes(values.type), {
    message: "This cannot be exported yet.",
    path: ["type"],
  })
  .refine((values) => EXPORTABLE_FORMATS.includes(values.format), {
    message: "This file type is not available yet.",
    path: ["format"],
  })
  .refine((values) => !values.startDate || !values.endDate || values.startDate <= values.endDate, {
    message: "The end date is before the start date.",
    path: ["endDate"],
  });

export type ExportValues = z.infer<typeof exportSchema>;

/** The variables of `useExportPharmacyData` (without `clinicId`). */
export function toExportPayload(values: ExportValues) {
  const dated = values.type === "prescriptions";
  return {
    type: values.type,
    format: values.format,
    ...(dated && values.startDate ? { startDate: values.startDate } : {}),
    ...(dated && values.endDate ? { endDate: values.endDate } : {}),
  };
}
