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
import { useQueryClient } from "@/hooks/core";
import { useAuth } from "@/hooks/auth/useAuth";
import { APP_CONFIG } from "@/lib/config/config";
import {
  DEFAULT_PAYMENT_PROVIDER,
  isPaymentProviderEnabled,
  type PaymentProvider,
} from "@/lib/payments/providers";
import {
  createPaymentIntent,
  verifyPaymentCallback,
} from "@/lib/actions/billing.server";
import { getClinicId } from "@/lib/utils/token-manager";

const BILLING_QUERY_KEYS = [
  ["invoices"],
  ["clinic-invoices"],
  ["payments"],
  ["clinic-payments"],
  ["subscriptions"],
  ["clinic-subscriptions"],
  ["active-subscription"],
  ["clinic-ledger"],
  ["billing-analytics"],
] as const;

interface PaymentButtonProps {
  invoiceId?: string;
  appointmentId?: string;
  appointmentType?: 'VIDEO_CALL' | 'IN_PERSON' | 'HOME_VISIT';
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
  appointmentType,
  autoStart = false,
  onSuccess,
  onError,
  className,
  children,
}: PaymentButtonProps) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const hasAutoStartedRef = useRef(false);
  const userRole = (session?.user?.role || "").toUpperCase();
  const normalizedCandidates = [provider, DEFAULT_PAYMENT_PROVIDER].reduce<string[]>(
    (candidates, value) => {
      if (typeof value === "string") {
        const normalizedValue = value.trim().toLowerCase();
        if (normalizedValue) {
          candidates.push(normalizedValue);
        }
      }
      return candidates;
    },
    []
  );
  const resolvedProviderGuess = normalizedCandidates.find((value) =>
    isPaymentProviderEnabled(value)
  );
  const effectiveProvider: PaymentProvider = isPaymentProviderEnabled(resolvedProviderGuess || "")
    ? (resolvedProviderGuess as PaymentProvider)
    : DEFAULT_PAYMENT_PROVIDER;
  const cashfreeMode =
    process.env.NEXT_PUBLIC_CASHFREE_MODE === "production"
      ? "production"
      : process.env.NEXT_PUBLIC_CASHFREE_MODE === "sandbox"
        ? "sandbox"
        : process.env.NODE_ENV === "production"
          ? "production"
          : "sandbox";

  const invalidateSuccessfulPaymentQueries = () => {
    BILLING_QUERY_KEYS.forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey, exact: false });
    });

    if (appointmentId) {
      if (userRole === "PATIENT") {
        queryClient.invalidateQueries({ queryKey: ["myAppointments"], exact: false });
      } else {
        queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false });
      }
      queryClient.invalidateQueries({ queryKey: ["appointment", appointmentId], exact: false });
      queryClient.invalidateQueries({ queryKey: ["video-appointments"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["video-appointment", appointmentId], exact: false });
      queryClient.invalidateQueries({ queryKey: ["userUpcomingAppointments"], exact: false });
    }

    if (prescriptionId) {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["patientPrescriptions"], exact: false });
    }
  };

  const getPaymentIntent = async () => {
    if (subscriptionId) {
      return await createPaymentIntent({
        subscriptionId,
        provider: effectiveProvider,
      });
    } else if (appointmentId) {
      return appointmentType
        ? await createPaymentIntent({
            appointmentId,
            appointmentType,
            provider: effectiveProvider,
          })
        : await createPaymentIntent({
            appointmentId,
            provider: effectiveProvider,
          });
    } else if (invoiceId) {
      return await createPaymentIntent({
        invoiceId,
        provider: effectiveProvider,
      });
    } else if (prescriptionId) {
      return await createPaymentIntent({
        prescriptionId,
        provider: effectiveProvider,
      });
    } else {
      throw new Error(
        "Either invoiceId, appointmentId, subscriptionId, or prescriptionId is required"
      );
    }
  };

  const verifyPayment = async (
    usedProvider: PaymentProvider,
    params: {
      orderId: string;
      paymentId?: string;
      clinicId: string;
    }
  ) => {
    const verifyResponse = await verifyPaymentCallback({
      clinicId: params.clinicId,
      paymentId: params.paymentId || params.orderId,
      orderId: params.orderId,
      provider: usedProvider,
    });
    if (!verifyResponse.success) {
      throw new Error(verifyResponse.error || verifyResponse.message || "Payment verification failed");
    }
    return verifyResponse;
  };

  const handleCashfreePayment = async (
    paymentIntent: Record<string, unknown>,
    usedProvider: PaymentProvider
  ) => {
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

    try {
      const cashfree = await load({
        mode: cashfreeMode,
      });

      if (!cashfree) {
        if (redirectUrl) {
          window.location.href = redirectUrl;
          return;
        }
        throw new Error("Cashfree SDK is not available");
      }

      if (!paymentSessionId) {
        if (redirectUrl) {
          window.location.href = redirectUrl;
          return;
        }
        throw new Error("Cashfree payment session is missing");
      }

      let fallbackRedirectTriggered = false;
      const checkoutFallbackTimer =
        redirectUrl
          ? window.setTimeout(() => {
              fallbackRedirectTriggered = true;
              window.location.href = redirectUrl;
            }, 1800)
          : null;

      const result = await cashfree.checkout({
        paymentSessionId,
        orderId,
        redirectTarget: "_self",
      });

      if (checkoutFallbackTimer !== null) {
        window.clearTimeout(checkoutFallbackTimer);
      }

      if (fallbackRedirectTriggered) {
        return;
      }

      if (result?.error?.message) {
        throw new Error(result.error.message);
      }

      if (result?.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else if (result?.redirect) {
        return;
      } else {
        await verifyPayment(usedProvider, {
          orderId,
          paymentId: orderId,
          clinicId: resolvedClinicId,
        });
        invalidateSuccessfulPaymentQueries();
        showSuccessToast("Payment verified.", {
          id: TOAST_IDS.PAYMENT.SUCCESS,
        });
        onSuccess?.(orderId);
      }
    } catch (error) {
      try {
        if (redirectUrl) {
          window.location.href = redirectUrl;
          return;
        }

        await verifyPayment(usedProvider, {
          orderId,
          paymentId: orderId,
          clinicId: resolvedClinicId,
        });
        invalidateSuccessfulPaymentQueries();
        showSuccessToast("Payment verified.", {
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
      const paymentResponse = await getPaymentIntent();
      if (!paymentResponse.success || !paymentResponse.paymentIntent) {
        throw new Error(paymentResponse.error || paymentResponse.message || "Failed to create payment intent");
      }
      const paymentIntent = paymentResponse.paymentIntent as Record<string, unknown>;
      const providerFromIntent =
        typeof paymentIntent?.provider === "string"
          ? paymentIntent.provider.toLowerCase()
          : undefined;
      const usedProvider = providerFromIntent && isPaymentProviderEnabled(providerFromIntent)
        ? (providerFromIntent as PaymentProvider)
        : effectiveProvider;
      if (!isPaymentProviderEnabled(usedProvider)) {
        throw new Error(`Payment provider '${usedProvider}' is not enabled`);
      }
      if (usedProvider !== "cashfree") {
        throw new Error(`Provider '${usedProvider}' is enabled but SDK handler is not implemented yet`);
      }
      await handleCashfreePayment(paymentIntent, usedProvider);
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
      type="button"
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
        children || `Pay INR ${amount.toLocaleString("en-IN")}`
      )}
    </Button>
  );
}
