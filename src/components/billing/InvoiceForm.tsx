"use client";

import { useReducer } from "react";
import { Invoice } from "@/types/billing.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import { useCreateInvoice } from "@/hooks/query/useBilling";
import { formatISODateInIST } from "@/lib/utils/date-time";

interface InvoiceFormProps {
  invoice?: Invoice;
  onSuccess?: (invoice: Invoice) => void;
  onCancel?: () => void;
}

export function InvoiceForm({ invoice, onSuccess, onCancel }: InvoiceFormProps) {
  const { session } = useAuth();
  const clinicContextId = useCurrentClinicId();
  const createInvoice = useCreateInvoice();

  const userId = session?.user?.id || invoice?.userId || "";
  const clinicId = clinicContextId || invoice?.clinicId || "";

  const [formState, dispatch] = useReducer(
    (
      state: {
        amount: number;
        description: string;
        dueDate: string;
        quantity: number;
        unitPrice: number;
      },
      action:
        | { type: "setAmount"; value: number }
        | { type: "setDescription"; value: string }
        | { type: "setDueDate"; value: string }
        | { type: "setQuantity"; value: number }
        | { type: "setUnitPrice"; value: number }
    ) => {
      switch (action.type) {
        case "setAmount":
          return { ...state, amount: action.value };
        case "setDescription":
          return { ...state, description: action.value };
        case "setDueDate":
          return { ...state, dueDate: action.value };
        case "setQuantity":
          return { ...state, quantity: action.value };
        case "setUnitPrice":
          return { ...state, unitPrice: action.value };
        default:
          return state;
      }
    },
    {
      amount: invoice?.amount || 0,
      description: invoice?.items?.[0]?.description || "",
      dueDate: invoice?.dueDate ? formatISODateInIST(invoice.dueDate) : formatISODateInIST(new Date()),
      quantity: invoice?.items?.[0]?.quantity || 1,
      unitPrice: invoice?.items?.[0]?.unitPrice || 0,
    }
  );
  const { amount, description, dueDate, quantity, unitPrice } = formState;
  const setAmount = (value: number) => dispatch({ type: "setAmount", value });
  const setDescription = (value: string) => dispatch({ type: "setDescription", value });
  const setDueDate = (value: string) => dispatch({ type: "setDueDate", value });
  const setQuantity = (value: number) => dispatch({ type: "setQuantity", value });
  const setUnitPrice = (value: number) => dispatch({ type: "setUnitPrice", value });

  const lineTotal = quantity * unitPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !clinicId) return;

    const payload = {
      userId,
      clinicId,
      amount,
      dueDate,
      description: description || "Consultation Charges",
      lineItems: {
        items: [
          {
            id: invoice?.items?.[0]?.id || `item-${Date.now()}`,
            description: description || "Consultation Charges",
            quantity,
            unitPrice,
            amount: lineTotal || amount,
          },
        ],
      },
    };

    const created = await createInvoice.mutateAsync(payload);
    if (created?.invoice && onSuccess) {
      onSuccess(created.invoice);
    }
  };

  return (
    <Card className="gap-0 rounded-none border-0 bg-transparent py-0 shadow-none dark:border-0">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="invoice-description">Description</Label>
            <Input
              id="invoice-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Consultation Charges"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="invoice-quantity">Quantity</Label>
              <Input
                id="invoice-quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="invoice-unit-price">Unit Price</Label>
              <Input
                id="invoice-unit-price"
                type="number"
                min={0}
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="invoice-total">Total Amount</Label>
            <Input
              id="invoice-total"
              type="number"
              min={0}
              value={amount || lineTotal}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="invoice-due-date">Due Date</Label>
            <Input
              id="invoice-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" size="md" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" size="md" disabled={createInvoice.isPending || !userId || !clinicId}>
              {createInvoice.isPending ? "Saving…" : "Save Invoice"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


