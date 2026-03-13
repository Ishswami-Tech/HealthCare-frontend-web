"use client";

import { useEffect, useRef, useState } from "react";
import { load } from "@cashfreepayments/cashfree-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  showSuccessToast,
  showErrorToast,
  TOAST_IDS,
} from "@/hooks/utils/use-toast";
import { clinicApiClient } from "@/lib/api/client";
import { API_ENDPOINTS, APP_CONFIG } from "@/lib/config/config";
import {
  DEFAULT_PAYMENT_PROVIDER,
  isPaymentProviderEnabled,
  type PaymentProvider,
} from "@/lib/payments/providers";
import { getClinicId } from "@/lib/utils/token-manager";

interface PaymentButtonProps {
  invoiceId?: string;
  appointmentId?: string;
  subscriptionId?: string;
  prescriptionId?: string;
  amount: number;
  currency?: string;
  description?: string;
  clinicId?: string;
  /** Optional: force provider (cashfree only). */
  provider?: PaymentProvider;
  autoStart?: boolean;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function PaymentButton({
  invoiceId,
  appointmentId,
  subscriptionId,
  prescriptionId,
  amount,
  currency = "INR",
  description,
  clinicId,
  provider,
  autoStart = false,
  onSuccess,
  onError,
  className,
  children,
}: PaymentButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const hasAutoStartedRef = useRef(false);
  const effectiveProvider: PaymentProvider = DEFAULT_PAYMENT_PROVIDER;
  const cashfreeMode =
    process.env.NEXT_PUBLIC_CASHFREE_MODE === "production"
      ? "production"
      : process.env.NEXT_PUBLIC_CASHFREE_MODE === "sandbox"
        ? "sandbox"
        : process.env.NODE_ENV === "production"
          ? "production"
          : "sandbox";

  const getPaymentIntent = async () => {
    let paymentIntentUrl: string;
    let body: Record<string, unknown> = {};
    const providerQuery = `?provider=${effectiveProvider}`;

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
      paymentIntentUrl =
        API_ENDPOINTS.BILLING.INVOICES.PROCESS_PAYMENT(invoiceId) + providerQuery;
    } else if (prescriptionId) {
      paymentIntentUrl =
        API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.PROCESS_PAYMENT(prescriptionId) + providerQuery;
    } else {
      throw new Error(
        "Either invoiceId, appointmentId, subscriptionId, or prescriptionId is required"
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
      clinicId: string;
    }
  ) => {
    const queryParams = new URLSearchParams({
      clinicId: params.clinicId,
      paymentId: params.paymentId || params.orderId,
      orderId: params.orderId,
      provider: usedProvider,
    });
    const body = { orderId: params.orderId };
    const verifyResponse = await clinicApiClient.post(
      `${API_ENDPOINTS.BILLING.PAYMENTS.CALLBACK}?${queryParams.toString()}`,
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

  const handleCashfreePayment = async (paymentIntent: Record<string, unknown>) => {
    const metadata = (paymentIntent?.metadata as Record<string, unknown>) || {};
    const orderId =
      (paymentIntent?.orderId as string) ||
      (paymentIntent?.paymentId as string) ||
      (paymentIntent?.id as string);
    const paymentSessionId =
      (paymentIntent?.paymentSessionId as string) ||
      (metadata?.paymentSessionId as string);
    const redirectUrl =
      (paymentIntent?.redirectUrl as string) ||
      (metadata?.redirectUrl as string);
    const resolvedClinicId =
      clinicId ||
      (paymentIntent?.clinicId as string) ||
      (metadata?.clinicId as string) ||
      (await getClinicId()) ||
      APP_CONFIG.CLINIC.ID;

    if (!orderId) {
      throw new Error("Order ID not received from server");
    }

    if (!resolvedClinicId) {
      throw new Error("Clinic context is required for payment verification");
    }

    if (redirectUrl && !paymentSessionId) {
      window.location.href = redirectUrl;
      return;
    }

    const cashfree = await load({
      mode: cashfreeMode,
    });

    if (!cashfree) {
      throw new Error("Cashfree SDK is not available");
    }

    try {
      if (!paymentSessionId) {
        throw new Error("Cashfree payment session is missing");
      }

      const result = await cashfree.checkout({ paymentSessionId, orderId });
      if (result?.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        await verifyPayment("cashfree", {
          orderId,
          paymentId: orderId,
          clinicId: resolvedClinicId,
        });
        showSuccessToast("Payment successful!", {
          id: TOAST_IDS.PAYMENT.SUCCESS,
        });
        onSuccess?.(orderId);
      }
    } catch (error) {
      try {
        await verifyPayment("cashfree", {
          orderId,
          paymentId: orderId,
          clinicId: resolvedClinicId,
        });
        showSuccessToast("Payment verified successfully!", {
          id: TOAST_IDS.PAYMENT.SUCCESS,
        });
        onSuccess?.(orderId);
      } catch {
        const message =
          error instanceof Error
            ? error.message
            : "Payment was not completed. Please try again.";
        showErrorToast(message, { id: TOAST_IDS.PAYMENT.ERROR });
        onError?.(message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const paymentIntent = await getPaymentIntent();
      const usedProvider = String(provider || paymentIntent?.provider || DEFAULT_PAYMENT_PROVIDER).toLowerCase();
      if (!isPaymentProviderEnabled(usedProvider)) {
        throw new Error(`Payment provider '${usedProvider}' is not enabled`);
      }
      if (usedProvider !== "cashfree") {
        throw new Error(`Provider '${usedProvider}' is enabled but SDK handler is not implemented yet`);
      }
      await handleCashfreePayment(paymentIntent);
    } catch (error) {
      setIsProcessing(false);
      const message =
        error instanceof Error ? error.message : "Failed to initiate payment";
      showErrorToast(message, { id: TOAST_IDS.PAYMENT.ERROR });
      onError?.(message);
    }
  };

  useEffect(() => {
    if (!autoStart || hasAutoStartedRef.current || isProcessing) {
      return;
    }

    hasAutoStartedRef.current = true;
    void handlePayment();
  }, [autoStart, isProcessing]);

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
