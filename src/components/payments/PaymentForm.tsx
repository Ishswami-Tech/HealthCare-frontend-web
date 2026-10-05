"use client";

import React from "react";
import { Note, SectionTitle, Surface } from "@/components/tbd";
import { Button } from "@/components/ui/button";
import { PaymentButton } from "@/components/payments/PaymentButton";
import { PaymentDisclosure } from "@/components/payments/PaymentDisclosure";
import { formatAmountFromMinorUnits } from "@/lib/utils";

interface PaymentFormProps {
  invoiceId?: string;
  amount: number;
  currency?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentForm({
  invoiceId,
  amount,
  currency: _currency = "INR",
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  return (
    <Surface as="section" className="gap-4">
      <SectionTitle
        title="Payment Details"
        description={`Complete your payment of Rs ${formatAmountFromMinorUnits(amount)} using the live payment gateway.`}
      />
      <Note tone="blue">
        This checkout creates a real backend payment intent and then redirects to the configured provider.
      </Note>
      <PaymentDisclosure />
      <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <PaymentButton
          amount={amount}
          size="md"
          className="flex-1"
          onSuccess={() => onSuccess?.()}
          {...(invoiceId ? { invoiceId } : {})}
        >
          Pay Rs {formatAmountFromMinorUnits(amount)}
        </PaymentButton>
      </div>
    </Surface>
  );
}
