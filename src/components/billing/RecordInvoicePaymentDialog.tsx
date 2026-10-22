"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRecordInvoicePayment } from "@/hooks/query/usePatientBilling";
import type { CollectionMethod } from "@/types/billing.types";

const METHODS: { value: CollectionMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "NET_BANKING", label: "Net banking" },
];

interface RecordInvoicePaymentDialogProps {
  clinicId: string;
  invoiceId: string;
  invoiceNumber?: string | null;
  balance: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecorded?: () => void;
}

/**
 * Collects a manual (cash/UPI/card/net-banking) payment against an invoice
 * from the Bill History tab. Backend: POST /billing/invoices/:id/record-payment
 */
export function RecordInvoicePaymentDialog({
  clinicId,
  invoiceId,
  invoiceNumber,
  balance,
  open,
  onOpenChange,
  onRecorded,
}: RecordInvoicePaymentDialogProps) {
  const [method, setMethod] = useState<CollectionMethod>("CASH");
  const [amount, setAmount] = useState(String(balance || ""));
  const [transactionId, setTransactionId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const recordPayment = useRecordInvoicePayment();

  useEffect(() => {
    if (open) {
      setMethod("CASH");
      setAmount(balance > 0 ? String(balance) : "");
      setTransactionId("");
      setNote("");
      setError(null);
    }
  }, [open, balance]);

  const parsedAmount = Number(amount);
  const overBalance = balance > 0 && Number.isFinite(parsedAmount) && parsedAmount > balance;
  const canSubmit = Number.isFinite(parsedAmount) && parsedAmount > 0 && !overBalance && !recordPayment.isPending;

  const submit = async () => {
    // Single flight: a double click must not post the payment twice.
    if (submitting.current || !canSubmit) return;
    submitting.current = true;
    setError(null);
    try {
      await recordPayment.mutateAsync({
        clinicId,
        invoiceId,
        input: {
          method,
          amount: parsedAmount,
          ...(transactionId.trim() ? { transactionId: transactionId.trim() } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        },
      });
      onOpenChange(false);
      onRecorded?.();
    } catch (caught) {
      // The toast also reports it; the dialog keeps the backend wording in view while it is open.
      setError(caught instanceof Error && caught.message ? caught.message : "The payment could not be recorded.");
    } finally {
      submitting.current = false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Collect payment</DialogTitle>
          <DialogDescription>
            {invoiceNumber ? `Bill ${invoiceNumber}` : "Record a manual payment"} — balance ₹
            {balance.toLocaleString("en-IN")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-1">
            <Label>Method</Label>
            <Select value={method} onValueChange={(value) => setMethod(value as CollectionMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-y-1">
            <Label htmlFor="collect-amount">Amount</Label>
            <Input
              id="collect-amount"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              aria-invalid={overBalance || undefined}
              aria-describedby={overBalance ? "collect-amount-error" : undefined}
              onChange={(event) => {
                setAmount(event.target.value);
                setError(null);
              }}
            />
            {overBalance ? (
              <p id="collect-amount-error" className="text-sm text-destructive">
                Amount exceeds the remaining balance of ₹{balance.toLocaleString("en-IN")}.
              </p>
            ) : null}
          </div>

          {method !== "CASH" ? (
            <div className="flex flex-col gap-y-1">
              <Label htmlFor="collect-transaction-id">Transaction ID (optional)</Label>
              <Input
                id="collect-transaction-id"
                value={transactionId}
                onChange={(event) => setTransactionId(event.target.value)}
                placeholder="UTR / reference number"
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-y-1">
            <Label htmlFor="collect-note">Note (optional)</Label>
            <Input
              id="collect-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Collected at reception desk"
            />
          </div>
        </div>

        {error ? (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={recordPayment.isPending}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={!canSubmit}>
            {recordPayment.isPending ? "Recording..." : "Record payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
