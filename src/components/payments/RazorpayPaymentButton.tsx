"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authenticatedApi } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayPaymentButtonProps {
  invoiceId?: string;
  appointmentId?: string;
  subscriptionId?: string;
  amount: number;
  currency?: string;
  description?: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function RazorpayPaymentButton({
  invoiceId,
  appointmentId,
  subscriptionId,
  amount,
  currency = "INR",
  description,
  onSuccess,
  onError,
  className,
  children,
}: RazorpayPaymentButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const loadRazorpayScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Failed to load Razorpay script"));
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Load Razorpay script
      await loadRazorpayScript();

      // Determine which endpoint to call
      let paymentIntentUrl: string;
      let paymentIntentData: any = {};

      if (subscriptionId) {
        paymentIntentUrl =
          API_ENDPOINTS.BILLING.SUBSCRIPTIONS.PROCESS_PAYMENT(subscriptionId);
        paymentIntentData = { provider: "razorpay" };
      } else if (appointmentId) {
        paymentIntentUrl =
          API_ENDPOINTS.BILLING.APPOINTMENT_PAYMENTS.PROCESS_PAYMENT(
            appointmentId
          );
        paymentIntentData = { provider: "razorpay" };
      } else if (invoiceId) {
        // For invoice payments, we'll need to create a payment intent
        // This might require a different endpoint or we use the appointment endpoint
        paymentIntentUrl = API_ENDPOINTS.BILLING.PAYMENTS.CREATE;
        paymentIntentData = {
          invoiceId,
          amount,
          currency,
          method: "RAZORPAY",
        };
      } else {
        throw new Error(
          "Either invoiceId, appointmentId, or subscriptionId is required"
        );
      }

      // Create payment intent via backend
      const response = await authenticatedApi(paymentIntentUrl, {
        method: "POST",
        ...(Object.keys(paymentIntentData).length > 0 && {
          body: JSON.stringify(paymentIntentData),
        }),
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to create payment intent");
      }

      const paymentIntent = response.data?.paymentIntent || response.data;
      const orderId = paymentIntent?.orderId || paymentIntent?.id;
      // Razorpay key should come from backend or environment
      const razorpayKey =
        paymentIntent?.metadata?.razorpayKey ||
        response.data?.razorpayKey ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY;

      if (!orderId) {
        throw new Error("Payment order ID not received from server");
      }

      if (!razorpayKey) {
        throw new Error("Razorpay key not configured");
      }

      // Open Razorpay checkout
      const options = {
        key: razorpayKey,
        amount: paymentIntent?.amount || amount * 100, // Convert to paise
        currency: paymentIntent?.currency || currency,
        name: "Healthcare App",
        description:
          description ||
          paymentIntent?.metadata?.description ||
          "Payment for services",
        order_id: orderId,
        handler: async (response: any) => {
          try {
            // Verify payment with backend
            const verifyResponse = await authenticatedApi(
              API_ENDPOINTS.BILLING.PAYMENTS.CALLBACK,
              {
                method: "POST",
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: orderId,
                  invoiceId,
                  appointmentId,
                  subscriptionId,
                }),
              }
            );

            if (verifyResponse.success) {
              toast.success("Payment successful!");
              onSuccess?.(response.razorpay_payment_id);
            } else {
              throw new Error(
                verifyResponse.message || "Payment verification failed"
              );
            }
          } catch (error: any) {
            toast.error(error.message || "Payment verification failed");
            onError?.(error.message);
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: paymentIntent?.metadata?.customerName || "",
          email: paymentIntent?.metadata?.customerEmail || "",
          contact: paymentIntent?.metadata?.customerPhone || "",
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.info("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (response: any) => {
        setIsProcessing(false);
        toast.error(
          `Payment failed: ${response.error.description || "Unknown error"}`
        );
        onError?.(response.error.description || "Payment failed");
      });

      razorpay.open();
    } catch (error: any) {
      setIsProcessing(false);
      toast.error(error.message || "Failed to initiate payment");
      onError?.(error.message || "Failed to initiate payment");
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={isProcessing}
      className={className}
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        children || `Pay ₹${amount.toLocaleString()}`
      )}
    </Button>
  );
}
