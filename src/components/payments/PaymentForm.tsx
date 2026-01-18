"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreatePayment } from "@/hooks/query/useBilling";
import { CreditCard, Smartphone, Building2, Wallet } from "lucide-react";
import { showSuccessToast, showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  currency = "INR",
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const createPayment = useCreatePayment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const paymentData = {
        invoiceId: invoiceId || "",
        amount,
        currency,
        method: paymentMethod,
        ...(paymentMethod === "UPI" && { upiId }),
        ...(paymentMethod === "CARD" && {
          cardNumber: cardNumber.replace(/\s/g, ""),
          cardName,
          cardExpiry,
          cardCvv,
        }),
      };

      await createPayment.mutateAsync(paymentData as any);

      showSuccessToast("Payment processed successfully!", {
        id: TOAST_IDS.PAYMENT.SUCCESS,
      });
      onSuccess?.();
    } catch (error: any) {
      showErrorToast(error.message || "Payment failed. Please try again.", {
        id: TOAST_IDS.PAYMENT.ERROR,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>
          Complete your payment of ₹{amount.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              {[
                { value: "UPI", label: "UPI", icon: Smartphone },
                { value: "CARD", label: "Credit/Debit Card", icon: CreditCard },
                { value: "NET_BANKING", label: "Net Banking", icon: Building2 },
                { value: "WALLET", label: "Wallet", icon: Wallet },
              ].map((method) => {
                const Icon = method.icon;
                return (
                  <div
                    key={method.value}
                    className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  >
                    <RadioGroupItem value={method.value} id={method.value} />
                    <Label
                      htmlFor={method.value}
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <Icon className="h-4 w-4" />
                      {method.label}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* UPI Payment Fields */}
          {paymentMethod === "UPI" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  type="text"
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Card Payment Fields */}
          {paymentMethod === "CARD" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s/g, "");
                    const formatted =
                      value.match(/.{1,4}/g)?.join(" ") || value;
                    setCardNumber(formatted.slice(0, 19));
                  }}
                  maxLength={19}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  type="text"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cardExpiry">Expiry Date</Label>
                  <Input
                    id="cardExpiry"
                    type="text"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      const formatted =
                        value.length > 2
                          ? `${value.slice(0, 2)}/${value.slice(2, 4)}`
                          : value;
                      setCardExpiry(formatted);
                    }}
                    maxLength={5}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cardCvv">CVV</Label>
                  <Input
                    id="cardCvv"
                    type="text"
                    placeholder="123"
                    value={cardCvv}
                    onChange={(e) =>
                      setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))
                    }
                    maxLength={3}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Net Banking / Wallet - Simple message */}
          {(paymentMethod === "NET_BANKING" || paymentMethod === "WALLET") && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                You will be redirected to complete your payment via{" "}
                {paymentMethod === "NET_BANKING" ? "Net Banking" : "Wallet"}
              </p>
            </div>
          )}

          {/* Action Buttons */}
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
            <Button type="submit" className="flex-1" disabled={isProcessing}>
              {isProcessing
                ? "Processing..."
                : `Pay ₹${amount.toLocaleString()}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
