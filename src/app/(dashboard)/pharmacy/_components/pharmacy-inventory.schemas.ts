import { z } from "zod";
import { DOSAGE_FORMS, todayKey, type DosageFormValue } from "./pharmacy-inventory.logic";

/**
 * Form schemas for the inventory dialogs. Inputs keep what the pharmacist typed (strings);
 * the `to…Payload` helpers turn valid values into the numbers the hooks expect.
 * Only fields the backend stores are asked for. Stock is never typed in as a bare number:
 * it arrives as a batch (purchase order receipt or "Receive stock"), the only stock dispensing uses.
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
    minStockLevel: Number(values.minStockLevel),
    expiryDate: values.expiryDate,
    description: values.description.trim(),
    ...(values.instructions.trim() ? { instructions: values.instructions.trim() } : {}),
    ...(values.supplierId ? { supplierId: values.supplierId } : {}),
  };
}

// ── Edit medicine (price) ──────────────────────────────────────────────────

export const editMedicineSchema = z.object({
  unitPrice: rupees("the price per unit", false),
});

export type EditMedicineValues = z.infer<typeof editMedicineSchema>;

/**
 * The `updates` of `useUpdateMedicine`: the price only. Stock is not editable here, because a
 * bare stock number would move `Medicine.stock` without a batch behind it. Returns null when
 * nothing changed.
 */
export function toUpdateMedicinePayload(
  values: EditMedicineValues,
  current: { price: number },
): { unitPrice: number } | null {
  const price = Number(values.unitPrice);
  return price !== current.price ? { unitPrice: price } : null;
}

// ── Receive stock (a batch that did not come through a purchase order) ─────

export const receiveBatchSchema = z
  .object({
    lotNumber: z.string().trim().min(1, "Enter the lot number on the pack.").max(100, "Use 100 characters or fewer."),
    manufactureDate: z
      .string()
      .regex(DATE_KEY, "Choose the manufacture date.")
      .refine((value) => value <= todayKey(), "The manufacture date cannot be in the future."),
    expiryDate: z
      .string()
      .regex(DATE_KEY, "Choose the expiry date.")
      .refine((value) => value > todayKey(), "The expiry date must be in the future."),
    quantity: wholeNumber("the quantity received", 1),
    /** "" = cost not known. */
    costPrice: z
      .string()
      .trim()
      .refine((value) => value === "" || /^\d+(\.\d{1,2})?$/.test(value), "Use a number such as 7 or 7.50."),
  })
  .refine((values) => values.manufactureDate < values.expiryDate, {
    message: "The expiry date is before the manufacture date.",
    path: ["expiryDate"],
  });

export type ReceiveBatchValues = z.infer<typeof receiveBatchSchema>;

export const RECEIVE_BATCH_DEFAULTS: ReceiveBatchValues = {
  lotNumber: "",
  manufactureDate: "",
  expiryDate: "",
  quantity: "",
  costPrice: "",
};

/** The variables of `useReceiveStockBatch` (without `clinicId`). */
export function toReceiveBatchPayload(medicine: { id: string; name: string }, values: ReceiveBatchValues) {
  return {
    productId: medicine.id,
    lotNumber: values.lotNumber.trim(),
    manufactureDate: values.manufactureDate,
    expiryDate: values.expiryDate,
    quantity: Number(values.quantity),
    medicineName: medicine.name,
    ...(values.costPrice.trim() ? { costPrice: Number(values.costPrice) } : {}),
  };
}

// ── Correct a batch ────────────────────────────────────────────────────────

/** `onHand` is the quantity left in the lot: a correction cannot take more than that. */
export function adjustBatchSchema(onHand: number) {
  return z.object({
    change: z
      .string()
      .trim()
      .refine((value) => /^[+-]?\d+$/.test(value), "Use a whole number such as 5 or -3.")
      .refine((value) => Number(value) !== 0, "Enter a change other than 0.")
      .refine((value) => onHand + Number(value) >= 0, `The lot only has ${onHand} left.`)
      .refine((value) => Math.abs(Number(value)) <= 1_000_000, "This number is too large."),
    reason: z.string().trim().min(3, "Say why the quantity is corrected.").max(500, "Use 500 characters or fewer."),
  });
}

export type AdjustBatchValues = z.infer<ReturnType<typeof adjustBatchSchema>>;

// ── Suppliers ──────────────────────────────────────────────────────────────

export const supplierSchema = z.object({
  name: z.string().trim().min(2, "Enter the supplier name.").max(120, "Use 120 characters or fewer."),
  contactPerson: z.string().trim().max(120, "Use 120 characters or fewer."),
  phone: z
    .string()
    .trim()
    .max(30, "Use 30 characters or fewer.")
    .refine((value) => value === "" || /^\+?[\d\s()-]{6,}$/.test(value), "Enter a valid phone number."),
  email: z
    .string()
    .trim()
    .max(120, "Use 120 characters or fewer.")
    .refine((value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Enter a valid email address."),
  address: z.string().trim().max(300, "Use 300 characters or fewer."),
});

export type SupplierValues = z.infer<typeof supplierSchema>;

export const SUPPLIER_DEFAULTS: SupplierValues = { name: "", contactPerson: "", phone: "", email: "", address: "" };

/** A new supplier: only the fields that were filled in. */
export function toCreateSupplierPayload(values: SupplierValues) {
  return {
    name: values.name.trim(),
    ...(values.contactPerson.trim() ? { contactPerson: values.contactPerson.trim() } : {}),
    ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
    ...(values.email.trim() ? { email: values.email.trim() } : {}),
    ...(values.address.trim() ? { address: values.address.trim() } : {}),
  };
}

/** An edit: every field is sent, so a cleared field is cleared on the server. */
export function toUpdateSupplierPayload(values: SupplierValues) {
  return {
    name: values.name.trim(),
    contactPerson: values.contactPerson.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
    address: values.address.trim(),
  };
}

// ── Receive goods against a purchase order ─────────────────────────────────

const receiveRowSchema = z.object({
  /** Purchase order line id. */
  itemId: z.string(),
  name: z.string(),
  /** Units of the line that have not arrived yet (before this form). */
  outstanding: z.number(),
  /** A second batch of the same line. */
  extra: z.boolean(),
  quantity: z.string().trim(),
  batchNumber: z.string().trim(),
  expiryDate: z.string(),
  /** "" = the order's unit price. */
  unitCost: z.string().trim(),
});

export type ReceiveOrderRow = z.infer<typeof receiveRowSchema>;

/**
 * One row per line that still has goods to arrive. A row left empty is skipped (that line did not
 * arrive); a row with anything typed in must be complete. The batches of one line together cannot
 * exceed what is still outstanding.
 */
export const receiveOrderSchema = z
  .object({ rows: z.array(receiveRowSchema) })
  .superRefine((values, context) => {
    let filled = 0;
    const received = new Map<string, number>();
    const lastRowOf = new Map<string, number>();

    values.rows.forEach((row, index) => {
      if (!row.quantity && !row.batchNumber && !row.expiryDate) return;
      filled += 1;
      const problem = (field: string, message: string) =>
        context.addIssue({ code: "custom", message, path: ["rows", index, field] });

      if (!/^\d+$/.test(row.quantity) || Number(row.quantity) < 1) {
        problem("quantity", "Enter how many arrived.");
      } else {
        received.set(row.itemId, (received.get(row.itemId) ?? 0) + Number(row.quantity));
        lastRowOf.set(row.itemId, index);
      }
      if (!row.batchNumber) problem("batchNumber", "Enter the lot number.");
      else if (row.batchNumber.length > 100) problem("batchNumber", "Use 100 characters or fewer.");
      if (!DATE_KEY.test(row.expiryDate)) problem("expiryDate", "Choose the expiry date.");
      else if (row.expiryDate <= todayKey()) problem("expiryDate", "The expiry date must be in the future.");
      if (row.unitCost && !/^\d+(\.\d{1,2})?$/.test(row.unitCost)) problem("unitCost", "Use a number such as 7 or 7.50.");
    });

    for (const [itemId, total] of received) {
      const index = lastRowOf.get(itemId) ?? 0;
      const outstanding = values.rows[index]?.outstanding ?? 0;
      if (total > outstanding) {
        context.addIssue({
          code: "custom",
          message: `Only ${outstanding} still to arrive for this line.`,
          path: ["rows", index, "quantity"],
        });
      }
    }

    if (filled === 0) {
      context.addIssue({ code: "custom", message: "Fill in at least one batch that arrived.", path: ["rows"] });
    }
  });

export type ReceiveOrderValues = z.infer<typeof receiveOrderSchema>;

/** The batches of `useReceivePharmacyOrder`: the rows that were filled in. */
export function toReceiveOrderPayload(values: ReceiveOrderValues) {
  return values.rows
    .filter((row) => row.quantity || row.batchNumber || row.expiryDate)
    .map((row) => ({
      itemId: row.itemId,
      quantityReceived: Number(row.quantity),
      batchNumber: row.batchNumber,
      expiryDate: row.expiryDate,
      ...(row.unitCost ? { unitCost: Number(row.unitCost) } : {}),
    }));
}

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
export const EXPORT_FORMATS = ["csv"] as const;

export type ExportType = (typeof EXPORT_TYPES)[number];
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

/** What `exportPharmacyData` builds: CSV of medicines, inventory, prescriptions and daily sales. */
export const EXPORTABLE_TYPES: readonly ExportType[] = ["medicines", "inventory", "prescriptions", "sales"];
export const EXPORTABLE_FORMATS: readonly ExportFormat[] = ["csv"];

export const exportSchema = z
  .object({
    type: z.enum(EXPORT_TYPES),
    format: z.enum(EXPORT_FORMATS),
    /** Used for prescriptions and sales. "" = no limit (sales: the 1st of this month). */
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
  const dated = values.type === "prescriptions" || values.type === "sales";
  return {
    type: values.type,
    format: values.format,
    ...(dated && values.startDate ? { startDate: values.startDate } : {}),
    ...(dated && values.endDate ? { endDate: values.endDate } : {}),
  };
}
