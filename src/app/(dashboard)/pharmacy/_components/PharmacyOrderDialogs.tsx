"use client";

import { useId } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, Plus, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Divider, Kv, Note, Pill, SummaryLine, statusLabel } from "@/components/tbd";
import {
  DialogError,
  Field,
  PharmacyDialog,
  PharmacyDialogActions,
  PharmacyDialogBody,
  RupeeField,
  fieldAria,
} from "./PharmacyDialogParts";
import {
  dateTimeLabel,
  dayLabel,
  formatRupees,
  orderTone,
  todayKey,
  type MedicineRow,
  type OrderRow,
  type SupplierCard,
} from "./pharmacy-inventory.logic";
import { newOrderSchema, type NewOrderValues } from "./pharmacy-inventory.schemas";

const ROW_GRID = "sm:grid-cols-[minmax(0,1fr)_96px_110px_90px_36px]";
const EMPTY_LINE = { medicineId: "", quantity: "", unitPrice: "" };

function stockNote(medicine: MedicineRow): string {
  const stock = medicine.status === "out_of_stock" ? "out of stock" : `${medicine.stock} in stock`;
  return [medicine.category || medicine.typeLabel, medicine.manufacturer, stock].filter(Boolean).join(" · ");
}

/** Line amount, or null while the quantity or the price is not a number yet. */
function lineAmount(quantity: unknown, unitPrice: unknown): number | null {
  const quantityText = String(quantity ?? "").trim();
  const priceText = String(unitPrice ?? "").trim();
  if (!/^\d+$/.test(quantityText) || !/^\d+(\.\d{1,2})?$/.test(priceText)) return null;
  return Number((Number(quantityText) * Number(priceText)).toFixed(2));
}

// ── New order ──────────────────────────────────────────────────────────────

interface PharmacyNewOrderDialogProps {
  open: boolean;
  suppliers: SupplierCard[];
  medicines: MedicineRow[];
  /** Supplier chosen on the Partner Pharmacies tab. */
  initialSupplierId?: string;
  /** Medicine chosen in the stock list. */
  initialMedicineId?: string;
  isPlacing?: boolean;
  errorMessage?: string | null;
  onSubmit: (values: NewOrderValues) => void;
  onClose: () => void;
}

/** Board `PhInventoryNewOrder`: a purchase order to one supplier. "Place order" is the amber action. */
export function PharmacyNewOrderDialog({
  open,
  suppliers,
  medicines,
  initialSupplierId = "",
  initialMedicineId = "",
  isPlacing = false,
  errorMessage = null,
  onSubmit,
  onClose,
}: PharmacyNewOrderDialogProps) {
  return (
    <PharmacyDialog
      open={open}
      onClose={onClose}
      busy={isPlacing}
      title="New order"
      description="Order medicines from a supplier."
      width={780}
    >
      {open ? (
        <NewOrderForm
          suppliers={suppliers}
          medicines={medicines}
          initialSupplierId={initialSupplierId}
          initialMedicineId={initialMedicineId}
          isPlacing={isPlacing}
          errorMessage={errorMessage}
          onSubmit={onSubmit}
          onClose={onClose}
        />
      ) : null}
    </PharmacyDialog>
  );
}

function NewOrderForm({
  suppliers,
  medicines,
  initialSupplierId,
  initialMedicineId,
  isPlacing,
  errorMessage,
  onSubmit,
  onClose,
}: {
  suppliers: SupplierCard[];
  medicines: MedicineRow[];
  initialSupplierId: string;
  initialMedicineId: string;
  isPlacing: boolean;
  errorMessage: string | null;
  onSubmit: (values: NewOrderValues) => void;
  onClose: () => void;
}) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const startingMedicine = medicines.find((medicine) => medicine.id === initialMedicineId);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NewOrderValues>({
    resolver: zodResolver(newOrderSchema),
    defaultValues: {
      supplierId:
        initialSupplierId ||
        (startingMedicine && suppliers.some((supplier) => supplier.id === startingMedicine.supplierId)
          ? startingMedicine.supplierId
          : suppliers.length === 1
            ? (suppliers[0]?.id ?? "")
            : ""),
      expectedDeliveryDate: "",
      items: [{ ...EMPTY_LINE, medicineId: startingMedicine?.id ?? "" }],
      notes: "",
    },
    mode: "onTouched",
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const lines = useWatch({ control, name: "items" });
  const supplierId = useWatch({ control, name: "supplierId" });
  const supplier = suppliers.find((entry) => entry.id === supplierId);
  const supplierHint = supplier ? [supplier.contactPerson, supplier.phone].filter(Boolean).join(" · ") : "";

  const amounts = (lines ?? []).map((line) => lineAmount(line?.quantity, line?.unitPrice));
  const priced = amounts.filter((value): value is number => value !== null);
  const total = priced.reduce((sum, value) => sum + value, 0);
  const itemsError = errors.items?.root?.message ?? errors.items?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <PharmacyDialogBody>
        {suppliers.length === 0 ? (
          <Note tone="amber">
            No suppliers are set up for this clinic yet, so an order cannot be placed. A clinic admin can add
            suppliers.
          </Note>
        ) : null}

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Field
            label="Supplier"
            htmlFor={id("supplierId")}
            hint={supplierHint || undefined}
            error={errors.supplierId?.message}
          >
            <Controller
              control={control}
              name="supplierId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={suppliers.length === 0}>
                  <SelectTrigger
                    className="w-full"
                    onBlur={field.onBlur}
                    {...fieldAria(id("supplierId"), errors.supplierId?.message)}
                  >
                    <SelectValue placeholder="Choose a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((entry) => (
                      <SelectItem key={entry.id} value={entry.id}>
                        {entry.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field
            label="Expected delivery date (optional)"
            htmlFor={id("expectedDeliveryDate")}
            error={errors.expectedDeliveryDate?.message}
          >
            <Input
              type="date"
              min={todayKey()}
              {...register("expectedDeliveryDate")}
              {...fieldAria(id("expectedDeliveryDate"), errors.expectedDeliveryDate?.message)}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-2.5 rounded-[14px] border border-hair bg-[#f8fafc] p-3.5 dark:bg-white/5">
          <div
            className={`hidden gap-2.5 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted sm:grid ${ROW_GRID}`}
            aria-hidden="true"
          >
            <span>Medicine</span>
            <span>Quantity</span>
            <span>Unit price</span>
            <span className="text-right">Amount</span>
            <span />
          </div>

          {fields.map((fieldRow, index) => {
            const rowErrors = errors.items?.[index];
            const chosen = medicines.find((medicine) => medicine.id === lines?.[index]?.medicineId);
            const rowAmount = amounts[index] ?? null;
            const rowError =
              rowErrors?.medicineId?.message ?? rowErrors?.quantity?.message ?? rowErrors?.unitPrice?.message;
            return (
              <div key={fieldRow.id} className="flex flex-col gap-1.5">
                <div className={`grid grid-cols-2 items-center gap-2.5 ${ROW_GRID}`}>
                  <div className="col-span-2 min-w-0 sm:col-span-1">
                    <Controller
                      control={control}
                      name={`items.${index}.medicineId`}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger
                            aria-label={`Medicine ${index + 1}`}
                            aria-invalid={rowErrors?.medicineId ? true : undefined}
                            onBlur={field.onBlur}
                            className="w-full data-[size=default]:h-auto data-[size=default]:min-h-12 py-1.5 text-left"
                          >
                            <SelectValue placeholder="Choose a medicine">
                              {chosen ? (
                                <span className="flex min-w-0 flex-col text-left">
                                  <span className="truncate font-bold text-ink">{chosen.name}</span>
                                  <span className="truncate text-xs font-medium text-ink-muted">
                                    {stockNote(chosen)}
                                  </span>
                                </span>
                              ) : undefined}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {medicines.map((medicine) => (
                              <SelectItem key={medicine.id} value={medicine.id} description={stockNote(medicine)}>
                                {medicine.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <Input
                    inputMode="numeric"
                    aria-label={`Quantity of medicine ${index + 1}`}
                    aria-invalid={rowErrors?.quantity ? true : undefined}
                    placeholder="Qty"
                    autoComplete="off"
                    className="h-12"
                    {...register(`items.${index}.quantity`)}
                  />
                  <RupeeField>
                    <Input
                      inputMode="decimal"
                      aria-label={`Unit price of medicine ${index + 1}`}
                      aria-invalid={rowErrors?.unitPrice ? true : undefined}
                      placeholder="Price"
                      autoComplete="off"
                      className="h-12"
                      {...register(`items.${index}.unitPrice`)}
                    />
                  </RupeeField>
                  <span className="text-sm font-bold text-ink sm:text-right">
                    <span className="mr-1.5 text-xs font-medium text-ink-muted sm:hidden">Amount</span>
                    {rowAmount !== null ? formatRupees(rowAmount) : "—"}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    aria-label={`Remove medicine ${index + 1}`}
                    className="flex size-9 items-center justify-center justify-self-end rounded-[10px] bg-well text-ink-soft transition-colors hover:bg-line focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-40"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
                {rowError ? (
                  <span role="alert" className="text-xs font-semibold text-[#be123c] dark:text-rose-300">
                    {rowError}
                  </span>
                ) : null}
              </div>
            );
          })}

          {itemsError ? (
            <span role="alert" className="text-xs font-semibold text-[#be123c] dark:text-rose-300">
              {itemsError}
            </span>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => append({ ...EMPTY_LINE })}
              disabled={fields.length >= medicines.length}
              className="inline-flex min-h-9 items-center gap-1 rounded-lg text-[13px] font-bold text-brand hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-50"
            >
              <Plus className="size-3.5" strokeWidth={2.6} aria-hidden="true" />
              Add medicine
            </button>
            <span className="text-[15px] font-extrabold text-ink" aria-live="polite">
              Total {priced.length > 0 ? formatRupees(total) : "—"}
            </span>
          </div>
        </div>

        <Field label="Notes (optional)" htmlFor={id("notes")} error={errors.notes?.message}>
          <Textarea
            {...register("notes")}
            {...fieldAria(id("notes"), errors.notes?.message)}
            className="min-h-16"
            placeholder="Anything the supplier should know"
          />
        </Field>

        <DialogError lead="The order was not placed." message={errorMessage} />
      </PharmacyDialogBody>

      <PharmacyDialogActions>
        <Button size="md" variant="outline" onClick={onClose} disabled={isPlacing}>
          Cancel
        </Button>
        <Button size="md" variant="action" type="submit" disabled={isPlacing || suppliers.length === 0}>
          <Truck aria-hidden="true" />
          {isPlacing ? "Placing order…" : "Place order"}
        </Button>
      </PharmacyDialogActions>
    </form>
  );
}

// ── Order details ──────────────────────────────────────────────────────────

/** Everything the API holds about one purchase order. */
export function PharmacyOrderDetailsDialog({ order, onClose }: { order: OrderRow | null; onClose: () => void }) {
  return (
    <PharmacyDialog
      open={order !== null}
      onClose={onClose}
      title={order ? `Order ${order.reference}` : "Order"}
      description={order ? `For clinic stock${order.supplierName ? ` · from ${order.supplierName}` : ""}` : undefined}
      width={600}
    >
      {order ? (
        <>
          <PharmacyDialogBody>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={orderTone(order.status)}>{statusLabel(order.status)}</Pill>
            </div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Kv label="Order date" value={dateTimeLabel(order.orderedAt) || "—"} strong={false} />
              <Kv label="Expected" value={dayLabel(order.expectedAt) || "Not set"} />
            </div>
            <div className="flex flex-col gap-2.5 rounded-[14px] border border-line px-4 py-3.5">
              {order.lines.map((line) => (
                <SummaryLine
                  key={line.id}
                  label={
                    line.unitPrice !== null
                      ? `${line.name} · ${line.quantity} × ${formatRupees(line.unitPrice)}`
                      : `${line.name} · ${line.quantity}`
                  }
                  value={line.unitPrice !== null ? formatRupees(line.quantity * line.unitPrice) : "—"}
                />
              ))}
              {order.lines.length > 0 ? <Divider /> : null}
              <SummaryLine bold label="Total" value={order.total !== null ? formatRupees(order.total) : "—"} />
            </div>
            {order.notes ? <Kv label="Notes" value={order.notes} strong={false} /> : null}
          </PharmacyDialogBody>
          <PharmacyDialogActions>
            <Button size="md" variant="outline" onClick={onClose}>
              Close
            </Button>
          </PharmacyDialogActions>
        </>
      ) : null}
    </PharmacyDialog>
  );
}

// ── Supplier details ───────────────────────────────────────────────────────

interface PharmacySupplierDetailsDialogProps {
  supplier: SupplierCard | null;
  canManage: boolean;
  onOrder: (supplier: SupplierCard) => void;
  onClose: () => void;
}

/** Contact details of one partner pharmacy and the medicines it supplies. */
export function PharmacySupplierDetailsDialog({
  supplier,
  canManage,
  onOrder,
  onClose,
}: PharmacySupplierDetailsDialogProps) {
  return (
    <PharmacyDialog
      open={supplier !== null}
      onClose={onClose}
      title={supplier?.name ?? "Partner pharmacy"}
      description="Partner pharmacy"
      width={560}
    >
      {supplier ? (
        <>
          <PharmacyDialogBody>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Kv label="Contact person" value={supplier.contactPerson || "Not given"} />
              <Kv label="Phone" value={supplier.phone || "Not given"} />
              <Kv label="Email" value={supplier.email || "Not given"} className="[&>span:last-child]:break-all" />
              <Kv label="Address" value={supplier.address || "Not given"} strong={false} />
            </div>
            <Divider />
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-ink-muted">Medicines from this supplier</span>
              {supplier.medicines.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {supplier.medicines.map((medicine) => (
                    <span
                      key={medicine.id}
                      className="rounded-lg bg-mint-soft px-[9px] py-[5px] text-xs font-semibold text-[#065f46] dark:text-emerald-300"
                    >
                      {medicine.name}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[13px] text-ink-muted">No medicine in the stock list names this supplier.</span>
              )}
            </div>
          </PharmacyDialogBody>
          <PharmacyDialogActions>
            {supplier.email ? (
              <Button asChild size="md" variant="outline">
                <a href={`mailto:${supplier.email}`}>
                  <Mail aria-hidden="true" />
                  Email
                </a>
              </Button>
            ) : null}
            {supplier.phone ? (
              <Button asChild size="md" variant="outline">
                <a href={`tel:${supplier.phone.replace(/[^\d+]/g, "")}`}>
                  <Phone aria-hidden="true" />
                  Call
                </a>
              </Button>
            ) : null}
            {canManage ? (
              <Button size="md" onClick={() => onOrder(supplier)}>
                <Truck aria-hidden="true" />
                Order
              </Button>
            ) : null}
          </PharmacyDialogActions>
        </>
      ) : null}
    </PharmacyDialog>
  );
}
