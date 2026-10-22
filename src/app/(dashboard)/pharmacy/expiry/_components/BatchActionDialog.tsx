"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DialogActions, DialogBody, DialogError, DialogShell, Field, Note } from "@/components/tbd";
import type { ExpiryRow } from "@/lib/pharmacy/pharmacy-ops.logic";
import type { BatchAction } from "@/types/pharmacy-ops.types";

export interface BatchActionRequest {
  row: ExpiryRow;
  action: BatchAction;
}

const batchActionSchema = (max: number) =>
  z.object({
    quantity: z
      .number()
      .int("Enter a whole number of units.")
      .min(1, "At least 1 unit.")
      .max(max, `This batch has ${max} in stock.`),
    reason: z.string().trim().min(3, "Say why, in a few words.").max(300),
    supplierId: z.string().optional(),
  });

/** Return-to-supplier / discard for one batch: quantity, reason, supplier (returns only). */
export function BatchActionDialog({
  request,
  suppliers,
  isPending,
  error,
  onSubmit,
  onClose,
}: {
  request: BatchActionRequest | null;
  suppliers: Array<{ id: string; name: string }>;
  isPending: boolean;
  error: string | null;
  onSubmit: (request: BatchActionRequest, values: { quantity: number; reason: string; supplierId?: string }) => void;
  onClose: () => void;
}) {
  const isReturn = request?.action === "RETURN_TO_SUPPLIER";
  return (
    <DialogShell
      open={!!request}
      onClose={onClose}
      busy={isPending}
      title={isReturn ? "Return to supplier" : "Discard stock"}
      description={request ? `${request.row.medicineName} · batch ${request.row.lotNumber}` : undefined}
      width={480}
    >
      {request ? (
        <BatchActionForm
          key={`${request.row.batchId}:${request.action}`}
          request={request}
          suppliers={suppliers}
          isPending={isPending}
          error={error}
          onSubmit={onSubmit}
          onClose={onClose}
        />
      ) : null}
    </DialogShell>
  );
}

function BatchActionForm({
  request,
  suppliers,
  isPending,
  error,
  onSubmit,
  onClose,
}: {
  request: BatchActionRequest;
  suppliers: Array<{ id: string; name: string }>;
  isPending: boolean;
  error: string | null;
  onSubmit: (request: BatchActionRequest, values: { quantity: number; reason: string; supplierId?: string }) => void;
  onClose: () => void;
}) {
  const isReturn = request.action === "RETURN_TO_SUPPLIER";
  const [quantity, setQuantity] = useState(String(request.row.onHand));
  const [reason, setReason] = useState(isReturn ? "Near expiry, requesting a credit note" : "");
  const [supplierId, setSupplierId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const units = quantity.trim() === "" ? Number.NaN : Number(quantity);
    if (!Number.isFinite(units)) {
      setFieldErrors({ quantity: "Enter how many units." });
      return;
    }
    const parsed = batchActionSchema(request.row.onHand).safeParse({ quantity: units, reason, supplierId: supplierId || undefined });
    if (!parsed.success) {
      setFieldErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }
    setFieldErrors({});
    onSubmit(request, {
      quantity: parsed.data.quantity,
      reason: parsed.data.reason,
      ...(isReturn && parsed.data.supplierId ? { supplierId: parsed.data.supplierId } : {}),
    });
  };

  return (
    <>
      <DialogBody>
        <Field label="Quantity" htmlFor="batch-action-quantity" required error={fieldErrors.quantity} hint={`${request.row.onHand} in stock`}>
          <Input
            id="batch-action-quantity"
            inputMode="numeric"
            value={quantity}
            disabled={isPending}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </Field>
        {isReturn && suppliers.length > 0 ? (
          <Field label="Supplier" htmlFor="batch-action-supplier">
            <Select value={supplierId} onValueChange={setSupplierId} disabled={isPending}>
              <SelectTrigger id="batch-action-supplier" className="w-full">
                <SelectValue placeholder="The supplier of this batch" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : null}
        <Field label={isReturn ? "Note for the supplier" : "Reason"} htmlFor="batch-action-reason" required error={fieldErrors.reason}>
          <Textarea
            id="batch-action-reason"
            value={reason}
            maxLength={300}
            disabled={isPending}
            placeholder={isReturn ? "Near expiry, requesting a credit note" : "Damaged, expired, recalled…"}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
        <Note tone="amber">The units leave stock, doctors stop seeing them, and the action is saved in the batch audit trail.</Note>
        <DialogError message={error} />
      </DialogBody>
      <DialogActions>
        <Button variant="outline" size="md" disabled={isPending} onClick={onClose}>
          Cancel
        </Button>
        <Button variant={isReturn ? "default" : "danger"} size="md" disabled={isPending} onClick={submit}>
          {isPending ? "Saving…" : isReturn ? "Confirm return" : "Mark discarded"}
        </Button>
      </DialogActions>
    </>
  );
}
