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
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="gap-y-4">
          <div className="gap-y-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Consultation Charges"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="gap-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              />
            </div>
            <div className="gap-y-2">
              <Label>Unit Price</Label>
              <Input
                type="number"
                min={0}
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="gap-y-2">
            <Label>Total Amount</Label>
            <Input
              type="number"
              min={0}
              value={amount || lineTotal}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
            />
          </div>
          <div className="gap-y-2">
            <Label>Due Date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={createInvoice.isPending || !userId || !clinicId}>
              {createInvoice.isPending ? "Saving…" : "Save Invoice"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


