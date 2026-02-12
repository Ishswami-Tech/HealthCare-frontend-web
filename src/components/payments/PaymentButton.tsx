"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
  TOAST_IDS,
} from "@/hooks/utils/use-toast";
import { clinicApiClient } from "@/lib/api/client";
import { API_ENDPOINTS, APP_CONFIG } from "@/lib/config/config";

export type PaymentProvider = "razorpay" | "cashfree" | "phonepe";

// Razorpay is declared in RazorpayPaymentButton.tsx
declare global {
  interface Window {
    Cashfree?: (
      options: { mode: string }
    ) => {
      checkout: (options: {
        paymentSessionId?: string;
        orderId?: string;
      }) => Promise<{ redirectUrl?: string }>;
    };
  }
}

interface PaymentButtonProps {
  invoiceId?: string;
  appointmentId?: string;
  subscriptionId?: string;
  amount: number;
  currency?: string;
  description?: string;
  clinicId?: string;
  /** Optional: force specific provider. When omitted, backend uses primary + fallback. */
  provider?: PaymentProvider;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function PaymentButton({
  invoiceId,
  appointmentId,
  subscriptionId,
  amount,
  currency = "INR",
  description,
  clinicId = APP_CONFIG.CLINIC.ID,
  provider,
  onSuccess,
  onError,
  className,
  children,
}: PaymentButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const getPaymentIntent = async () => {
    let paymentIntentUrl: string;
    let body: Record<string, unknown> = {};
    const providerQuery = provider ? `?provider=${provider}` : "";

    if (subscriptionId) {
      paymentIntentUrl =
        API_ENDPOINTS.BILLING.SUBSCRIPTIONS.PROCESS_PAYMENT(subscriptionId) +
        providerQuery;
    } else if (appointmentId) {
      paymentIntentUrl =
        API_ENDPOINTS.BILLING.APPOINTMENT_PAYMENTS.PROCESS_PAYMENT(appointmentId) +
        providerQuery;
      body = { amount, appointmentType: "VIDEO_CALL" };
    } else if (invoiceId) {
      paymentIntentUrl = API_ENDPOINTS.BILLING.PAYMENTS.CREATE;
      body = {
        invoiceId,
        amount,
        currency,
        method: provider
          ? provider === "razorpay"
            ? "RAZORPAY"
            : provider === "cashfree"
              ? "CASHFREE"
              : "PHONEPE"
          : "RAZORPAY",
      };
    } else {
      throw new Error(
        "Either invoiceId, appointmentId, or subscriptionId is required"
      );
    }

    const response = await clinicApiClient.post(
      paymentIntentUrl,
      Object.keys(body).length > 0 ? body : {}
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to create payment intent");
    }

    const paymentData = response.data as Record<string, unknown>;
    const paymentIntent =
      (paymentData?.paymentIntent as Record<string, unknown>) || paymentData;
    return paymentIntent;
  };

  const verifyPayment = async (
    usedProvider: PaymentProvider,
    params: {
      orderId: string;
      paymentId?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    }
  ) => {
    const baseUrl = APP_CONFIG.API.BASE_URL;
    const callbackUrl = `${baseUrl}${API_ENDPOINTS.BILLING.PAYMENTS.CALLBACK}`;
    const queryParams = new URLSearchParams({
      clinicId,
      paymentId: params.paymentId || params.orderId,
      orderId: params.orderId,
      provider: usedProvider,
    });
    const body =
      usedProvider === "razorpay"
        ? {
            razorpay_order_id: params.razorpay_order_id,
            razorpay_payment_id: params.razorpay_payment_id,
            razorpay_signature: params.razorpay_signature,
            orderId: params.orderId,
            invoiceId,
            appointmentId,
            subscriptionId,
          }
        : { orderId: params.orderId };
    const verifyResponse = await clinicApiClient.post(
      `${callbackUrl}?${queryParams.toString()}`,
      body
    );
    if (!verifyResponse.success) {
      throw new Error(
        (verifyResponse as { message?: string }).message ||
          "Payment verification failed"
      );
    }
    return verifyResponse;
  };

  const handleRazorpayPayment = async (paymentIntent: Record<string, unknown>) => {
    const loadScript = (): Promise<void> =>
      new Promise((resolve, reject) => {
        if (window.Razorpay) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Razorpay script"));
        document.body.appendChild(script);
      });

    await loadScript();
    const orderId =
      (paymentIntent?.orderId as string) || (paymentIntent?.id as string);
    const razorpayKey =
      (paymentIntent?.metadata as Record<string, unknown>)?.razorpayKey as string ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY ||
      APP_CONFIG.SERVICES.RAZORPAY_KEY;

    if (!orderId || !razorpayKey) {
      throw new Error("Razorpay not configured or order ID missing");
    }

    const razorpay = new window.Razorpay!({
      key: razorpayKey,
      amount: (paymentIntent?.amount as number) || amount * 100,
      currency: (paymentIntent?.currency as string) || currency,
      name: "Healthcare App",
      description:
        description ||
        ((paymentIntent?.metadata as Record<string, unknown>)
          ?.description as string) ||
        "Payment for services",
      order_id: orderId,
      handler: async (resp: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        try {
          await verifyPayment("razorpay", {
            orderId,
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          });
          showSuccessToast("Payment successful!", {
            id: TOAST_IDS.PAYMENT.SUCCESS,
          });
          onSuccess?.(resp.razorpay_payment_id);
        } catch (err) {
          showErrorToast(
            (err as Error).message || "Payment verification failed",
            { id: TOAST_IDS.PAYMENT.ERROR }
          );
          onError?.((err as Error).message);
        } finally {
          setIsProcessing(false);
        }
      },
      prefill: {
        name: ((paymentIntent?.metadata as Record<string, unknown>)
          ?.customerName as string) || "",
        email: ((paymentIntent?.metadata as Record<string, unknown>)
          ?.customerEmail as string) || "",
        contact: ((paymentIntent?.metadata as Record<string, unknown>)
          ?.customerPhone as string) || "",
      },
      theme: { color: "#2563eb" },
      modal: {
        ondismiss: () => {
          setIsProcessing(false);
          showInfoToast("Payment cancelled", {
            id: TOAST_IDS.PAYMENT.CANCELLED,
          });
        },
      },
    });
    razorpay.on("payment.failed", (resp: { error?: { description?: string } }) => {
      setIsProcessing(false);
      const msg = resp.error?.description || "Payment failed";
      showErrorToast(msg, { id: TOAST_IDS.PAYMENT.ERROR });
      onError?.(msg);
    });
    razorpay.open();
  };

  const handleCashfreePayment = async (paymentIntent: Record<string, unknown>) => {
    const orderId =
      (paymentIntent?.orderId as string) ||
      (paymentIntent?.paymentId as string) ||
      (paymentIntent?.id as string);
    const redirectUrl = (paymentIntent?.metadata as Record<string, unknown>)
      ?.redirectUrl as string | undefined;

    if (!orderId) {
      throw new Error("Order ID not received from server");
    }

    if (redirectUrl) {
      window.location.href = redirectUrl;
      return;
    }

    const loadScript = (): Promise<void> =>
      new Promise((resolve, reject) => {
        if (window.Cashfree) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error("Failed to load Cashfree script"));
        document.body.appendChild(script);
      });

    await loadScript();
    const cashfree = window.Cashfree!({
      mode: process.env.NODE_ENV === "production" ? "production" : "sandbox",
    });

    try {
      const result = await cashfree.checkout({
        paymentSessionId: orderId,
        orderId,
      });
      if (result?.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        await verifyPayment("cashfree", { orderId, paymentId: orderId });
        showSuccessToast("Payment successful!", {
          id: TOAST_IDS.PAYMENT.SUCCESS,
        });
        onSuccess?.(orderId);
      }
    } catch {
      await verifyPayment("cashfree", { orderId, paymentId: orderId });
      showSuccessToast("Payment successful!", {
        id: TOAST_IDS.PAYMENT.SUCCESS,
      });
      onSuccess?.(orderId);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePhonePePayment = async (paymentIntent: Record<string, unknown>) => {
    const redirectUrl = (paymentIntent?.metadata as Record<string, unknown>)
      ?.redirectUrl as string | undefined;
    if (!redirectUrl) {
      throw new Error("PhonePe redirect URL not received from server");
    }
    window.location.href = redirectUrl;
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const paymentIntent = await getPaymentIntent();
      const usedProvider = (provider ||
        (paymentIntent?.provider as string) ||
        "razorpay") as PaymentProvider;

      switch (usedProvider) {
        case "razorpay":
          await handleRazorpayPayment(paymentIntent);
          break;
        case "cashfree":
          await handleCashfreePayment(paymentIntent);
          break;
        case "phonepe":
          await handlePhonePePayment(paymentIntent);
          break;
        default:
          throw new Error(`Unsupported payment provider: ${usedProvider}`);
      }
    } catch (error) {
      setIsProcessing(false);
      const message =
        error instanceof Error ? error.message : "Failed to initiate payment";
      showErrorToast(message, { id: TOAST_IDS.PAYMENT.ERROR });
      onError?.(message);
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
