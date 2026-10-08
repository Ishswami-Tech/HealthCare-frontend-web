"use client";

import { useId } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PackageCheck, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Note, Pill, statusLabel } from "@/components/tbd";
import {
  DialogError,
  PharmacyDialog,
  PharmacyDialogActions,
  PharmacyDialogBody,
  RupeeField,
} from "./PharmacyDialogParts";
import { formatRupees, orderTone, tomorrowKey, type OrderRow } from "./pharmacy-inventory.logic";
import {
  receiveOrderSchema,
  type ReceiveOrderRow,
  type ReceiveOrderValues,
} from "./pharmacy-inventory.schemas";

/** One empty row for every order line that still has goods to arrive. */
export function receiveOrderRows(order: OrderRow): ReceiveOrderRow[] {
  return order.lines
    .filter((line) => line.outstanding > 0)
    .map((line) => ({
      itemId: line.id,
      name: line.name,
      outstanding: line.outstanding,
      extra: false,
      quantity: "",
      batchNumber: "",
      expiryDate: "",
      unitCost: "",
    }));
}

/**
 * Identity of the form: the order plus what is still to arrive on each line. A fresher copy of the
 * order with different outstanding quantities starts the rows over; an identical one keeps what was typed.
 */
export function receiveOrderFormKey(order: OrderRow): string {
  const outstanding = order.lines.map((line) => `${line.id}:${line.outstanding}`).join("|");
  return `${order.id}#${outstanding}`;
}

export interface PharmacyReceiveOrderDialogProps {
  /** The order goods arrived for (a fresh record: outstanding quantities must be current); null closes the dialog. */
  order: OrderRow | null;
  isSaving?: boolean;
  errorMessage?: string | null;
  onSubmit: (order: OrderRow, values: ReceiveOrderValues) => void;
  onClose: () => void;
}

/**
 * Books goods in against a sent purchase order. Each line that has not fully arrived gets a row for
 * the batch that came (quantity, lot number, expiry date, cost per unit). Leave a line empty when it
 * did not arrive. The server turns each row into a stock batch and moves the order to Partially
 * received or Received.
 */
export function PharmacyReceiveOrderDialog({
  order,
  isSaving = false,
  errorMessage = null,
  onSubmit,
  onClose,
}: PharmacyReceiveOrderDialogProps) {
  return (
    <PharmacyDialog
      open={order !== null}
      onClose={onClose}
      busy={isSaving}
      title={order ? `Receive goods · ${order.reference}` : "Receive goods"}
      description={order ? `From ${order.supplierName || "the supplier"}. Enter what arrived, batch by batch.` : undefined}
      width={900}
    >
      {order ? (
        <ReceiveOrderForm
          key={receiveOrderFormKey(order)}
          order={order}
          isSaving={isSaving}
          errorMessage={errorMessage}
          onSubmit={onSubmit}
          onClose={onClose}
        />
      ) : null}
    </PharmacyDialog>
  );
}

function ReceiveOrderForm({
  order,
  isSaving,
  errorMessage,
  onSubmit,
  onClose,
}: {
  order: OrderRow;
  isSaving: boolean;
  errorMessage: string | null;
  onSubmit: (order: OrderRow, values: ReceiveOrderValues) => void;
  onClose: () => void;
}) {
  const uid = useId();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReceiveOrderValues>({
    resolver: zodResolver(receiveOrderSchema),
    defaultValues: { rows: receiveOrderRows(order) },
    mode: "onTouched",
  });
  const { fields, insert, remove } = useFieldArray({ control, name: "rows" });
  const rootError = errors.rows?.root?.message ?? errors.rows?.message;
  const priceOf = new Map(order.lines.map((line) => [line.id, line.unitPrice]));

  if (fields.length === 0) {
    return (
      <>
        <PharmacyDialogBody>
          <Note tone="green">Every line of this order has already arrived.</Note>
        </PharmacyDialogBody>
        <PharmacyDialogActions>
          <Button size="md" variant="outline" onClick={onClose}>
            Close
          </Button>
        </PharmacyDialogActions>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(order, values))} noValidate>
      <PharmacyDialogBody>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={orderTone(order.status)}>{statusLabel(order.status)}</Pill>
          <span className="text-xs text-ink-muted">
            Leave a line empty if it has not arrived. The order becomes Received when every line is complete.
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {fields.map((row, index) => {
            const rowErrors = errors.rows?.[index];
            const price = priceOf.get(row.itemId) ?? null;
            const label = (name: string) => `${name} for ${row.name}${row.extra ? " (another batch)" : ""}`;
            return (
              <div key={row.id} className="flex flex-col gap-2 rounded-[14px] border border-hair bg-[#f8fafc] p-3.5 dark:bg-white/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-extrabold text-ink">
                    {row.name}
                    {row.extra ? <span className="ml-2 text-xs font-semibold text-ink-muted">Another batch</span> : null}
                  </span>
                  <span className="text-xs text-ink-muted">
                    {row.outstanding} still to arrive{price !== null ? ` · ordered at ${formatRupees(price)}` : ""}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[88px_minmax(0,1fr)_148px_120px_auto]">
                  <Input
                    inputMode="numeric"
                    placeholder="Qty"
                    autoComplete="off"
                    aria-label={label("Quantity received")}
                    aria-invalid={rowErrors?.quantity ? true : undefined}
                    {...register(`rows.${index}.quantity`)}
                  />
                  <Input
                    placeholder="Lot number"
                    autoComplete="off"
                    aria-label={label("Lot number")}
                    aria-invalid={rowErrors?.batchNumber ? true : undefined}
                    {...register(`rows.${index}.batchNumber`)}
                  />
                  <Input
                    type="date"
                    min={tomorrowKey()}
                    aria-label={label("Expiry date")}
                    aria-invalid={rowErrors?.expiryDate ? true : undefined}
                    {...register(`rows.${index}.expiryDate`)}
                  />
                  <RupeeField>
                    <Input
                      inputMode="decimal"
                      placeholder={price !== null ? String(price) : "Cost"}
                      autoComplete="off"
                      aria-label={label("Cost per unit")}
                      aria-invalid={rowErrors?.unitCost ? true : undefined}
                      {...register(`rows.${index}.unitCost`)}
                    />
                  </RupeeField>
                  {row.extra ? (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      aria-label={label("Remove the batch")}
                      className="flex size-10 items-center justify-center justify-self-end rounded-[10px] bg-well text-ink-soft transition-colors hover:bg-line focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => insert(index + 1, {
                          itemId: row.itemId,
                          name: row.name,
                          outstanding: row.outstanding,
                          extra: true,
                          quantity: "",
                          batchNumber: "",
                          expiryDate: "",
                          unitCost: "",
                        })}
                      className="inline-flex min-h-10 items-center gap-1 justify-self-end whitespace-nowrap rounded-lg px-1 text-[13px] font-bold text-brand hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
                    >
                      <Plus className="size-3.5" strokeWidth={2.6} aria-hidden="true" />
                      Split
                    </button>
                  )}
                </div>
                {rowErrors ? (
                  <span role="alert" id={`${uid}-row-${index}-error`} className="text-xs font-semibold text-[#be123c] dark:text-rose-300">
                    {rowErrors.quantity?.message ??
                      rowErrors.batchNumber?.message ??
                      rowErrors.expiryDate?.message ??
                      rowErrors.unitCost?.message}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>

        {rootError ? (
          <span role="alert" className="text-xs font-semibold text-[#be123c] dark:text-rose-300">
            {rootError}
          </span>
        ) : null}
        <p className="m-0 text-xs text-ink-muted">
          Columns: quantity received, lot number, expiry date, cost per unit (empty = the ordered price). Use Split when a
          line arrived in more than one lot.
        </p>
        <DialogError lead="The goods were not received." message={errorMessage} />
      </PharmacyDialogBody>

      <PharmacyDialogActions>
        <Button size="md" variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button size="md" type="submit" disabled={isSaving}>
          <PackageCheck aria-hidden="true" />
          {isSaving ? "Receiving…" : "Receive goods"}
        </Button>
      </PharmacyDialogActions>
    </form>
  );
}
