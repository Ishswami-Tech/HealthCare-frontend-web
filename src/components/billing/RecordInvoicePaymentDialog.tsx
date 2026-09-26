"use client";

import { useEffect, useState } from "react";
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
import { runSave } from "@/components/patient/case-sheet/run-save";
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
  const recordPayment = useRecordInvoicePayment();

  useEffect(() => {
    if (open) {
      setMethod("CASH");
      setAmount(balance > 0 ? String(balance) : "");
      setTransactionId("");
      setNote("");
    }
  }, [open, balance]);

  const parsedAmount = Number(amount);
  const canSubmit = Number.isFinite(parsedAmount) && parsedAmount > 0 && !recordPayment.isPending;

  const submit = async () => {
    const ok = await runSave(() =>
      recordPayment.mutateAsync({
        clinicId,
        invoiceId,
        input: {
          method,
          amount: parsedAmount,
          ...(transactionId.trim() ? { transactionId: transactionId.trim() } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        },
      }),
    );
    if (ok) {
      onOpenChange(false);
      onRecorded?.();
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
              onChange={(event) => setAmount(event.target.value)}
            />
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
