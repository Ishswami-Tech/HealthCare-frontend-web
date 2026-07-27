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
import { clinicApiClient } from "@/lib/api/client";
import { API_ENDPOINTS, APP_CONFIG } from "@/lib/config/config";
import {
  DEFAULT_PAYMENT_PROVIDER,
  isPaymentProviderEnabled,
  type PaymentProvider,
} from "@/lib/payments/providers";
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

function isIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isWebKit = /WebKit/.test(ua);
  const isOtherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|Mercury/.test(ua);
  return isIOS && isWebKit && !isOtherBrowser;
}

function resolveCashfreeMode(
  metadata: Record<string, unknown>
): "sandbox" | "production" {
  const fromBackend =
    (typeof metadata.mode === "string" && metadata.mode) ||
    (typeof metadata.environment === "string" && metadata.environment);
  if (fromBackend === "production" || fromBackend === "sandbox") {
    return fromBackend;
  }
  if (process.env.NEXT_PUBLIC_CASHFREE_MODE === "production") return "production";
  if (process.env.NEXT_PUBLIC_CASHFREE_MODE === "sandbox") return "sandbox";
  return process.env.NODE_ENV === "production" ? "production" : "sandbox";
}

/**
 * Cashfree's recommended iOS / WebView path: POST payment_session_id to the
 * hosted sessions checkout endpoint. Avoids SDK script / modal issues on iPhone Safari.
 */
function redirectToCashfreeCheckout(
  paymentSessionId: string,
  mode: "sandbox" | "production"
): void {
  const action =
    mode === "production"
      ? "https://api.cashfree.com/pg/view/sessions/checkout"
      : "https://sandbox.cashfree.com/pg/view/sessions/checkout";

  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  form.style.display = "none";
  form.setAttribute("accept-charset", "UTF-8");

  const sessionInput = document.createElement("input");
  sessionInput.type = "hidden";
  sessionInput.name = "payment_session_id";
  sessionInput.value = paymentSessionId;
  form.appendChild(sessionInput);

  const platformInput = document.createElement("input");
  platformInput.type = "hidden";
  platformInput.name = "platform";
  platformInput.value = "web";
  form.appendChild(platformInput);

  try {
    const meta = {
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    };
    const browserMeta = document.createElement("input");
    browserMeta.type = "hidden";
    browserMeta.name = "browser_meta";
    browserMeta.value = btoa(JSON.stringify(meta));
    form.appendChild(browserMeta);
  } catch {
    // browser_meta is optional; checkout still works without it
  }

  document.body.appendChild(form);
  form.submit();
}

function isGatewayCheckoutUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return (
      host.endsWith("cashfree.com") ||
      host.includes("payments.cashfree.com") ||
      host.includes("sandbox.cashfree.com")
    );
  } catch {
    return false;
  }
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

  const invalidateSuccessfulPaymentQueries = () => {
    BILLING_QUERY_KEYS.forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey, exact: false });
    });

    if (appointmentId) {
      if (userRole === "PATIENT") {
        queryClient.invalidateQueries({ queryKey: ["myAppointments"], exact: false });
        queryClient.refetchQueries({ queryKey: ["myAppointments"], exact: false, type: "active" });
      } else {
        queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false });
        queryClient.refetchQueries({ queryKey: ["appointments"], exact: false, type: "active" });
      }
      queryClient.invalidateQueries({ queryKey: ["appointment", appointmentId], exact: false });
      queryClient.refetchQueries({ queryKey: ["appointment", appointmentId], exact: false, type: "active" });
      queryClient.invalidateQueries({ queryKey: ["video-appointments"], exact: false });
      queryClient.refetchQueries({ queryKey: ["video-appointments"], exact: false, type: "active" });
      queryClient.invalidateQueries({ queryKey: ["video-appointment", appointmentId], exact: false });
      queryClient.refetchQueries({ queryKey: ["video-appointment", appointmentId], exact: false, type: "active" });
      queryClient.invalidateQueries({ queryKey: ["userUpcomingAppointments"], exact: false });
      queryClient.refetchQueries({ queryKey: ["userUpcomingAppointments"], exact: false, type: "active" });
    }

    if (prescriptionId) {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["patientPrescriptions"], exact: false });
    }
  };

  const getPaymentIntent = async () => {
    let paymentIntentUrl: string;
    const body: Record<string, unknown> = {};
    const providerQuery = `?provider=${effectiveProvider}`;

    if (subscriptionId) {
      paymentIntentUrl =
        API_ENDPOINTS.BILLING.SUBSCRIPTIONS.PROCESS_PAYMENT(subscriptionId) +
        providerQuery;
    } else if (appointmentId) {
      paymentIntentUrl =
        API_ENDPOINTS.BILLING.APPOINTMENT_PAYMENTS.PROCESS_PAYMENT(appointmentId) +
        providerQuery;
      if (appointmentType) {
        body.appointmentType = appointmentType;
      }
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
    // Prefer real Cashfree gateway URL — never fall back to unpaid app callback.
    const gatewayRedirectUrl =
      (metadata?.gatewayRedirectUrl as string) ||
      (isGatewayCheckoutUrl(metadata?.redirectUrl as string)
        ? (metadata.redirectUrl as string)
        : undefined) ||
      (isGatewayCheckoutUrl(paymentIntent?.redirectUrl as string)
        ? (paymentIntent.redirectUrl as string)
        : undefined);
    const cashfreeMode = resolveCashfreeMode(metadata);
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

    if (!paymentSessionId && !gatewayRedirectUrl) {
      throw new Error("Cashfree payment session is missing");
    }

    // Prefer Cashfree's official form-POST checkout on iOS Safari.
    // SDK script injection + Dialog/_self navigation commonly fail with "Load failed".
    if (paymentSessionId && isIOSSafari()) {
      try {
        redirectToCashfreeCheckout(paymentSessionId, cashfreeMode);
        return;
      } catch {
        // Fall through to SDK / gateway URL paths
      }
    }

    try {
      if (paymentSessionId) {
        const cashfree = await load({ mode: cashfreeMode });

        if (cashfree) {
          const result = await cashfree.checkout({
            paymentSessionId,
            // _top escapes Radix dialogs / iframes that break iOS navigation
            redirectTarget: "_top",
          });

          if (result?.error?.message) {
            throw new Error(result.error.message);
          }

          if (result?.redirectUrl) {
            window.location.assign(result.redirectUrl);
            return;
          }

          if (result?.redirect) {
            return;
          }

          // Popup/inline completion path (rare for our redirect flow)
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
          return;
        }
      }

      // SDK unavailable: use official form POST or gateway URL
      if (paymentSessionId) {
        redirectToCashfreeCheckout(paymentSessionId, cashfreeMode);
        return;
      }

      if (gatewayRedirectUrl) {
        window.location.assign(gatewayRedirectUrl);
        return;
      }

      throw new Error("Cashfree SDK is not available");
    } catch (error) {
      // Last-resort gateway redirect — never send users to unpaid callback
      if (paymentSessionId) {
        try {
          redirectToCashfreeCheckout(paymentSessionId, cashfreeMode);
          return;
        } catch {
          // continue
        }
      }

      if (gatewayRedirectUrl) {
        window.location.assign(gatewayRedirectUrl);
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Payment was not completed. Please try again.";
      showErrorToast(message, { id: TOAST_IDS.PAYMENT.ERROR });
      onError?.(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const paymentIntent = await getPaymentIntent();
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
      // Safari surfaces network failures as "Load failed"
      const friendly =
        /load failed|failed to fetch|networkerror/i.test(message)
          ? "Unable to start payment. Please check your connection and try again."
          : message;
      showErrorToast(friendly, { id: TOAST_IDS.PAYMENT.ERROR });
      onError?.(friendly);
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
