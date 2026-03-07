"use client";

import { useMemo, useState } from "react";
import { Invoice } from "@/types/billing.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useCreateInvoice } from "@/hooks/query/useBilling";

interface InvoiceFormProps {
  invoice?: Invoice;
  onSuccess?: (invoice: Invoice) => void;
  onCancel?: () => void;
}

export function InvoiceForm({ invoice, onSuccess, onCancel }: InvoiceFormProps) {
  const { session } = useAuth();
  const { clinicId: contextClinicId } = useClinicContext();
  const createInvoice = useCreateInvoice();

  const userId = session?.user?.id || invoice?.userId || "";
  const clinicId = contextClinicId || session?.user?.clinicId || invoice?.clinicId || "";

  const [amount, setAmount] = useState<number>(invoice?.amount || 0);
  const [description, setDescription] = useState<string>(invoice?.items?.[0]?.description || "");
  const [dueDate, setDueDate] = useState<string>(
    invoice?.dueDate ? invoice.dueDate.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [quantity, setQuantity] = useState<number>(invoice?.items?.[0]?.quantity || 1);
  const [unitPrice, setUnitPrice] = useState<number>(invoice?.items?.[0]?.unitPrice || 0);

  const lineTotal = useMemo(() => quantity * unitPrice, [quantity, unitPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !clinicId) return;

    const payload = {
      userId,
      clinicId,
      amount,
      dueDate,
      items: [
        {
          id: invoice?.items?.[0]?.id || `item-${Date.now()}`,
          description: description || "Consultation Charges",
          quantity,
          unitPrice,
          total: lineTotal || amount,
        },
      ],
    };

    const created = await createInvoice.mutateAsync(payload as any);
    if (created && onSuccess) onSuccess(created as Invoice);
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Consultation Charges"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>Unit Price</Label>
              <Input
                type="number"
                min={0}
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Total Amount</Label>
            <Input
              type="number"
              min={0}
              value={amount || lineTotal}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
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
              {createInvoice.isPending ? "Saving..." : "Save Invoice"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
