"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentButton } from "@/components/payments/PaymentButton";

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
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>
          Complete your payment of Rs {amount.toLocaleString()} using the live payment gateway.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
            This checkout creates a real backend payment intent and then redirects to the configured provider.
          </div>
          <div className="flex gap-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <PaymentButton
              amount={amount}
              className="flex-1"
              onSuccess={() => onSuccess?.()}
              {...(invoiceId ? { invoiceId } : {})}
            >
              Pay Rs {amount.toLocaleString()}
            </PaymentButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
