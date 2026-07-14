"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { API_ENDPOINTS } from "@/lib/config/config";
import {
  DEFAULT_PAYMENT_PROVIDER,
  ENABLED_PAYMENT_PROVIDERS,
  isPaymentProviderEnabled,
  type PaymentProvider,
} from "@/lib/payments/providers";
import { formatAmountFromMinorUnits } from "@/lib/utils";
import { getClinicId } from "@/lib/utils/token-manager";
import { syncAppointmentInCache } from "@/lib/utils/appointment-cache";
import { clinicApiClient } from "@/lib/api/client";

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
  ["patientDashboardSummary"],
] as const;

// Fast timeouts for better UX
const CASHFREE_LOAD_TIMEOUT_MS = 8000;
const CASHFREE_CHECKOUT_TIMEOUT_MS = 10000;
const RAZORPAY_SCRIPT_ID = "razorpay-checkout-script";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler?: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: () => void) => void;
}

interface PaymentButtonProps {
  invoiceId?: string;
  appointmentId?: string;
  appointmentType?: "VIDEO_CALL" | "IN_PERSON" | "HOME_VISIT";
  subscriptionId?: string;
  prescriptionId?: string;
  amount: number;
  currency?: string;
  description?: string;
  clinicId?: string;
  /** Optional: force a specific provider (cashfree|razorpay|phonepe|zoho|easebuzz|paytm|payu). */
  provider?: PaymentProvider;
  autoStart?: boolean;
  disabled?: boolean;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

type PaymentIntentResponse = {
  success: boolean;
  data?: {
    paymentIntent?: Record<string, unknown>;
  };
  paymentIntent?: Record<string, unknown>;
  error?: string;
  message?: string;
};

type PaymentBridgePayload = {
  provider: PaymentProvider;
  amount: number;
  displayAmount?: string;
  currency: string;
  description?: string;
  clinicId: string;
  appointmentId?: string;
  subscriptionId?: string;
  invoiceId?: string;
  prescriptionId?: string;
  appointmentType?: "VIDEO_CALL" | "IN_PERSON" | "HOME_VISIT";
  callbackUrl?: string;
  orderId?: string;
  paymentId?: string;
  paymentSessionId?: string;
  paymentLink?: string;
  gatewayRedirectUrl?: string;
  razorpayKeyId?: string;
  paymentIntentId?: string;
  handoffToken?: string;
  handoffCallbackUrl?: string;
};

function encodeBridgePayload(payload: PaymentBridgePayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return window
    .btoa(binary)
    .replace(/=+$/u, "")
    .replace(/\+/gu, "-")
    .replace(/\//gu, "_");
}

function decodeBridgeUrl(baseUrl: string): URL | null {
  const trimmed = baseUrl.trim().replace(/\/+$/u, "");
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed);
  } catch {
    try {
      return new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }
}

function ensureBridgePreconnect(targetUrl: string): void {
  if (typeof document === "undefined" || !targetUrl) {
    return;
  }

  try {
    const origin = new URL(targetUrl).origin;
    const existing = document.head.querySelector<HTMLLinkElement>(
      `link[rel="preconnect"][href="${origin}"]`,
    );
    if (existing) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = origin;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  } catch {
    // Ignore invalid bridge URLs and continue without preconnect.
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
  disabled = false,
  onSuccess,
  onError,
  className,
  children,
}: PaymentButtonProps) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const hasAutoStartedRef = useRef(false);
  const cashfreeSdkPromiseRef = useRef<Promise<Awaited<
    ReturnType<typeof load>
  > | null> | null>(null);
  const userRole = (session?.user?.role || "").toUpperCase();
  const normalizedCandidates = [provider, DEFAULT_PAYMENT_PROVIDER].reduce<
    string[]
  >((candidates, value) => {
    if (typeof value === "string") {
      const normalizedValue = value.trim().toLowerCase();
      if (normalizedValue) {
        candidates.push(normalizedValue);
      }
    }
    return candidates;
  }, []);
  const resolvedProviderGuess = normalizedCandidates.find((value) =>
    isPaymentProviderEnabled(value),
  );
  const effectiveProvider: PaymentProvider = isPaymentProviderEnabled(
    resolvedProviderGuess || "",
  )
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
  const paymentBridgeUrl = APP_CONFIG.PAYMENT.BRIDGE_URL.trim();

  const invalidateSuccessfulPaymentQueries = () => {
    BILLING_QUERY_KEYS.forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey, exact: false });
    });

    if (appointmentId) {
      if (userRole === "PATIENT") {
        queryClient.invalidateQueries({
          queryKey: ["myAppointments"],
          exact: false,
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: ["appointments"],
          exact: false,
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["appointment", appointmentId],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["video-appointments"],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["video-appointment", appointmentId],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["userUpcomingAppointments"],
        exact: false,
      });
    }

    if (prescriptionId) {
      queryClient.invalidateQueries({
        queryKey: ["prescriptions"],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["patientPrescriptions"],
        exact: false,
      });
    }
  };

  const buildProviderAttemptOrder = (): PaymentProvider[] => {
    if (paymentBridgeUrl) {
      return provider && isPaymentProviderEnabled(provider)
        ? [provider]
        : [DEFAULT_PAYMENT_PROVIDER];
    }

    const attempts: PaymentProvider[] = [];
    const addAttempt = (candidate?: string | null) => {
      if (!candidate) {
        return;
      }
      const normalized = candidate.trim().toLowerCase();
      if (!isPaymentProviderEnabled(normalized)) {
        return;
      }
      const typed = normalized as PaymentProvider;
      if (!attempts.includes(typed)) {
        attempts.push(typed);
      }
    };

    if (provider) {
      addAttempt(provider);
    }

    for (const candidate of ENABLED_PAYMENT_PROVIDERS) {
      if (candidate !== "cashfree") {
        addAttempt(candidate);
      }
    }

    if (!attempts.length || !attempts.includes("cashfree")) {
      addAttempt("cashfree");
    }

    return attempts;
  };

  const getPaymentIntent = async (
    requestedProvider: PaymentProvider,
  ): Promise<PaymentIntentResponse> => {
    const providerQuery = `?provider=${requestedProvider}`;
    if (subscriptionId) {
      return await clinicApiClient.request<PaymentIntentResponse>(
        `${API_ENDPOINTS.BILLING.SUBSCRIPTIONS.BASE}/${subscriptionId}/process-payment${providerQuery}`,
        { method: "POST" },
      );
    } else if (appointmentId) {
      return await clinicApiClient.request<PaymentIntentResponse>(
        `${API_ENDPOINTS.BILLING.APPOINTMENT_PAYMENTS.PROCESS_PAYMENT(appointmentId)}${providerQuery}`,
        {
          method: "POST",
          ...(appointmentType
            ? { body: JSON.stringify({ appointmentType }) }
            : {}),
        },
      );
    } else if (invoiceId) {
      return await clinicApiClient.request<PaymentIntentResponse>(
        `${API_ENDPOINTS.BILLING.INVOICES.PROCESS_PAYMENT(invoiceId)}${providerQuery}`,
        { method: "POST" },
      );
    } else if (prescriptionId) {
      return await clinicApiClient.request<PaymentIntentResponse>(
        `${API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.PROCESS_PAYMENT(prescriptionId)}${providerQuery}`,
        { method: "POST" },
      );
    } else {
      throw new Error(
        "Either invoiceId, appointmentId, subscriptionId, or prescriptionId is required",
      );
    }
  };

  const preloadCashfreeSdk = () => {
    if (paymentBridgeUrl) {
      return Promise.resolve(null);
    }
    if (cashfreeSdkPromiseRef.current) {
      return cashfreeSdkPromiseRef.current;
    }

    cashfreeSdkPromiseRef.current = load({ mode: cashfreeMode }).catch(
      (error) => {
        cashfreeSdkPromiseRef.current = null;
        throw error;
      },
    );

    return cashfreeSdkPromiseRef.current;
  };

  const buildPaymentBridgeLaunchUrl = (
    payload: PaymentBridgePayload,
  ): string => {
    const bridgeBase = decodeBridgeUrl(paymentBridgeUrl);

    if (!bridgeBase) {
      return "";
    }

    bridgeBase.pathname = bridgeBase.pathname.replace(/\/+$/u, "");
    if (!bridgeBase.pathname || bridgeBase.pathname === "/") {
      bridgeBase.pathname = "/payments/start";
    }
    bridgeBase.searchParams.set("payload", encodeBridgePayload(payload));
    return bridgeBase.toString();
  };

  const launchPaymentBridge = (payload: PaymentBridgePayload): boolean => {
    if (!paymentBridgeUrl) {
      return false;
    }

    const bridgeLaunchUrl = buildPaymentBridgeLaunchUrl(payload);
    if (!bridgeLaunchUrl) {
      return false;
    }

    ensureBridgePreconnect(bridgeLaunchUrl);
    try {
      setIsProcessing(false);
      window.location.assign(bridgeLaunchUrl);
      return true;
    } catch (error) {
      console.warn("[PaymentButton] Bridge navigation failed", error);
      setIsProcessing(false);
      return false;
    }
  };

  const buildBridgePayload = (
    resolvedClinicId: string,
    paymentIntent?: Record<string, unknown>,
  ): PaymentBridgePayload => {
    const metadata = (paymentIntent?.metadata as Record<string, unknown>) || {};
    const providerResponse =
      (paymentIntent?.providerResponse as Record<string, unknown>) || {};
    const normalizedAppointmentType = String(
      paymentIntent?.appointmentType || appointmentType || "",
    ).toUpperCase();
    const appointmentTypeValue =
      normalizedAppointmentType === "VIDEO_CALL" ||
      normalizedAppointmentType === "IN_PERSON" ||
      normalizedAppointmentType === "HOME_VISIT"
        ? (normalizedAppointmentType as PaymentBridgePayload["appointmentType"])
        : undefined;
    const callbackUrl =
      (metadata.handoffCallbackUrl as string) ||
      (metadata.callbackUrl as string) ||
      (paymentIntent?.handoffCallbackUrl as string) ||
      (paymentIntent?.callbackUrl as string) ||
      (typeof window !== "undefined"
        ? `${window.location.origin}/payment/callback`
        : `${(APP_CONFIG.APP.URL || "").replace(/\/+$/u, "") || "https://www.viddhakarma.com"}/payment/callback`);

    return {
      provider: (
        String(paymentIntent?.provider || effectiveProvider) ||
        effectiveProvider
      ).toLowerCase() as PaymentProvider,
      amount: Number(paymentIntent?.amount || amount),
      displayAmount:
        String(
          paymentIntent?.displayAmount ||
            metadata.displayAmount ||
            providerResponse.displayAmount ||
            "",
        ) || undefined,
      currency: String(paymentIntent?.currency || currency || "INR"),
      description: String(paymentIntent?.description || description || ""),
      clinicId: resolvedClinicId,
      appointmentId: String(
        paymentIntent?.appointmentId || appointmentId || "",
      ),
      subscriptionId: String(
        paymentIntent?.subscriptionId || subscriptionId || "",
      ),
      invoiceId: String(paymentIntent?.invoiceId || invoiceId || ""),
      prescriptionId: String(
        paymentIntent?.prescriptionId || prescriptionId || "",
      ),
      appointmentType: appointmentTypeValue,
      callbackUrl,
      orderId:
        (paymentIntent?.orderId as string) ||
        (paymentIntent?.paymentId as string) ||
        (paymentIntent?.paymentIntentId as string) ||
        (metadata.orderId as string) ||
        (providerResponse.order_id as string) ||
        (providerResponse.orderId as string) ||
        "",
      paymentId:
        (paymentIntent?.paymentId as string) ||
        (paymentIntent?.transactionId as string) ||
        (metadata.paymentId as string) ||
        "",
      paymentSessionId:
        (paymentIntent?.paymentSessionId as string) ||
        (metadata.paymentSessionId as string) ||
        (providerResponse.payment_session_id as string) ||
        (providerResponse.paymentSessionId as string) ||
        "",
      paymentLink:
        (paymentIntent?.paymentLink as string) ||
        (metadata.paymentLink as string) ||
        (providerResponse.payment_link as string) ||
        (providerResponse.paymentLink as string) ||
        "",
      gatewayRedirectUrl:
        (paymentIntent?.gatewayRedirectUrl as string) ||
        (metadata.gatewayRedirectUrl as string) ||
        (metadata.redirectUrl as string) ||
        (providerResponse.redirectUrl as string) ||
        (providerResponse.redirect_url as string) ||
        "",
      razorpayKeyId:
        (paymentIntent?.razorpayKeyId as string) ||
        (metadata.razorpayKeyId as string) ||
        (providerResponse.razorpay_key_id as string) ||
        (providerResponse.key_id as string) ||
        "",
      paymentIntentId:
        (paymentIntent?.paymentIntentId as string) ||
        (metadata.paymentIntentId as string) ||
        (paymentIntent?.orderId as string) ||
        "",
      handoffToken:
        (paymentIntent?.handoffToken as string) ||
        (metadata.handoffToken as string) ||
        "",
      handoffCallbackUrl:
        (paymentIntent?.handoffCallbackUrl as string) ||
        (metadata.handoffCallbackUrl as string) ||
        callbackUrl,
    };
  };

  const loadRazorpayScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }
      if (document.getElementById(RAZORPAY_SCRIPT_ID)) {
        const check = setInterval(() => {
          if (window.Razorpay) {
            clearInterval(check);
            resolve();
          }
        }, 100);
        return;
      }
      const script = document.createElement("script");
      script.id = RAZORPAY_SCRIPT_ID;
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
      document.body.appendChild(script);
    });
  };

  const preloadRazorpayScript = () => {
    if (effectiveProvider !== "razorpay" || disabled) {
      return;
    }
    void loadRazorpayScript().catch((err) =>
      console.warn("[PaymentButton] Razorpay script preload failed", err),
    );
  };

  const warmUpPaymentResources = useCallback(() => {
    if (disabled) {
      return;
    }

    if (paymentBridgeUrl) {
      ensureBridgePreconnect(paymentBridgeUrl);
      return;
    }

    if (effectiveProvider === "cashfree") {
      void preloadCashfreeSdk();
    } else if (effectiveProvider === "razorpay") {
      preloadRazorpayScript();
    }
  }, [disabled, effectiveProvider, paymentBridgeUrl]);

  const verifyPayment = async (
    usedProvider: PaymentProvider,
    params: {
      orderId: string;
      paymentId?: string;
      clinicId: string;
    },
  ) => {
    const queryParams = new URLSearchParams({
      clinicId: params.clinicId,
      paymentId: params.paymentId || params.orderId,
      orderId: params.orderId,
      provider: usedProvider,
    });
    const verifyResponse = await clinicApiClient.publicRequest<
      Record<string, unknown>
    >(`${API_ENDPOINTS.BILLING.PAYMENTS.CALLBACK}?${queryParams.toString()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Clinic-ID": params.clinicId,
      },
      body: JSON.stringify({ orderId: params.orderId }),
    });
    if (!verifyResponse.success) {
      throw new Error(
        verifyResponse.error ||
          (verifyResponse as any).message ||
          "Payment verification failed",
      );
    }
    return verifyResponse;
  };

  const finalizeSuccessfulPayment = async (
    usedProvider: PaymentProvider,
    orderId: string,
    resolvedClinicId: string,
  ) => {
    await verifyPayment(usedProvider, {
      orderId,
      paymentId: orderId,
      clinicId: resolvedClinicId,
    });
    if (appointmentId) {
      syncAppointmentInCache(
        queryClient,
        { id: appointmentId, status: "CONFIRMED" },
        {
          appointmentStatus: "CONFIRMED",
          queryKeys: [
            ["myAppointments"],
            ["appointments"],
            ["userUpcomingAppointments"],
            ["appointment", appointmentId],
            ["video-appointments"],
            ["video-appointment", appointmentId],
          ],
        },
      );
    }
    invalidateSuccessfulPaymentQueries();
    showSuccessToast("Payment verified.", {
      id: TOAST_IDS.PAYMENT.SUCCESS,
    });
    onSuccess?.(orderId);
  };

  const resolveCashfreeCheckoutUrl = (
    paymentIntent: Record<string, unknown>,
    metadata: Record<string, unknown>,
  ) => {
    const providerResponse =
      (paymentIntent?.providerResponse as Record<string, unknown>) || {};
    const providerResponseMeta =
      (providerResponse?.order_meta as Record<string, unknown>) ||
      (providerResponse?.orderMeta as Record<string, unknown>) ||
      {};

    return (
      (paymentIntent?.paymentLink as string) ||
      (providerResponse?.payment_link as string) ||
      (providerResponse?.paymentLink as string) ||
      (providerResponseMeta?.payment_link as string) ||
      (metadata?.paymentLink as string) ||
      ""
    );
  };

  const withTimeout = async <T,>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string,
  ): Promise<T> => {
    let timeoutId: number | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timeoutId = window.setTimeout(
            () => reject(new Error(timeoutMessage)),
            timeoutMs,
          );
        }),
      ]);
    } finally {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    }
  };

  const handleCashfreePayment = async (
    paymentIntent: Record<string, unknown>,
    usedProvider: PaymentProvider,
    preloadedCashfree?: Awaited<ReturnType<typeof load>> | null,
  ) => {
    const paymentMetadata =
      (paymentIntent?.metadata as Record<string, unknown>) || {};
    const metadata = (paymentIntent?.metadata as Record<string, unknown>) || {};
    const providerResponse =
      (paymentIntent?.providerResponse as Record<string, unknown>) || {};
    const providerResponseMeta =
      (providerResponse?.order_meta as Record<string, unknown>) ||
      (providerResponse?.orderMeta as Record<string, unknown>) ||
      {};
    const checkoutUrl = resolveCashfreeCheckoutUrl(paymentIntent, metadata);
    const orderId =
      (paymentIntent?.orderId as string) ||
      (paymentIntent?.paymentId as string) ||
      (paymentIntent?.id as string) ||
      (providerResponse?.order_id as string) ||
      (providerResponse?.orderId as string) ||
      (metadata?.orderId as string) ||
      (providerResponseMeta?.order_id as string);
    const paymentSessionId =
      (paymentIntent?.paymentSessionId as string) ||
      (metadata?.paymentSessionId as string) ||
      (providerResponse?.payment_session_id as string) ||
      (providerResponse?.paymentSessionId as string);
    const redirectUrl =
      (paymentIntent?.redirectUrl as string) ||
      (metadata?.redirectUrl as string) ||
      (providerResponseMeta?.payment_link as string) ||
      (providerResponse?.payment_link as string);
    let resolvedClinicId =
      clinicId ||
      (paymentIntent?.clinicId as string) ||
      (paymentMetadata?.clinicId as string) ||
      APP_CONFIG.CLINIC.ID;

    if (!orderId) {
      throw new Error("Order ID not received from server");
    }

    if (!resolvedClinicId) {
      resolvedClinicId = (await getClinicId()) || APP_CONFIG.CLINIC.ID;
    }

    if (!resolvedClinicId) {
      throw new Error("Clinic context is required for payment verification");
    }

    if (
      launchPaymentBridge(buildBridgePayload(resolvedClinicId, paymentIntent))
    ) {
      setIsProcessing(false);
      return;
    }

    console.info("[PaymentButton] Cashfree checkout diagnostics", {
      usedProvider,
      cashfreeMode,
      orderId,
      hasPaymentSessionId: Boolean(paymentSessionId),
      hasCheckoutUrl: Boolean(checkoutUrl),
      hasRedirectUrl: Boolean(redirectUrl),
      resolvedClinicId,
    });

    try {
      const cashfreePromise = preloadedCashfree
        ? Promise.resolve(preloadedCashfree)
        : preloadCashfreeSdk();

      const cashfree = await withTimeout(
        cashfreePromise,
        CASHFREE_LOAD_TIMEOUT_MS,
        `Cashfree SDK load timed out in ${cashfreeMode} mode`,
      );

      if (!cashfree) {
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
          return;
        }
        throw new Error(
          `Cashfree SDK is not available in ${cashfreeMode} mode`,
        );
      }

      if (!paymentSessionId) {
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
          return;
        }
        throw new Error(
          "Cashfree payment session is missing and no hosted checkout link was returned",
        );
      }

      const result = await withTimeout(
        cashfree.checkout({
          paymentSessionId,
          orderId,
          redirectTarget: "_self",
        }),
        CASHFREE_CHECKOUT_TIMEOUT_MS,
        "Cashfree checkout timed out",
      );

      if (result?.error?.message) {
        throw new Error(result.error.message);
      }

      if (result?.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }

      if (result?.redirect) {
        return;
      }

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      await finalizeSuccessfulPayment(usedProvider, orderId, resolvedClinicId);
      return;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Payment was not completed. Please try again.";

      console.error("[PaymentButton] Cashfree checkout failed", {
        error: message,
        orderId,
        checkoutUrl,
        redirectUrl,
        cashfreeMode,
        usedProvider,
      });

      showErrorToast(message, { id: TOAST_IDS.PAYMENT.ERROR });
      onError?.(message);

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRazorpayPayment = async (
    paymentIntent: Record<string, unknown>,
    usedProvider: PaymentProvider,
    resolvedClinicId: string,
  ) => {
    if (
      launchPaymentBridge(buildBridgePayload(resolvedClinicId, paymentIntent))
    ) {
      return;
    }

    const metadata = (paymentIntent?.metadata as Record<string, unknown>) || {};
    const providerResponse =
      (paymentIntent?.providerResponse as Record<string, unknown>) || {};
    const orderId =
      (paymentIntent?.orderId as string) ||
      (paymentIntent?.paymentId as string) ||
      (paymentIntent?.id as string) ||
      (providerResponse?.razorpay_order_id as string) ||
      (metadata?.orderId as string) ||
      "";
    const razorpayKey =
      (providerResponse?.razorpay_key_id as string) ||
      (metadata?.razorpayKeyId as string) ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      "";
    const paymentAmount =
      (paymentIntent?.amount as number) ||
      (metadata?.amount as number) ||
      amount;

    if (!orderId) {
      throw new Error("Order ID not received from server");
    }

    await loadRazorpayScript();

    return new Promise<void>((resolve, reject) => {
      const rz = new window.Razorpay({
        key: razorpayKey,
        amount: paymentAmount,
        currency: currency,
        name: "Healthcare Payment",
        description: description || "Appointment Payment",
        order_id: orderId,
        prefill: {},
        theme: { color: "#0B5E45" },
        handler: async (response) => {
          try {
            await verifyPayment(usedProvider, {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              clinicId: resolvedClinicId,
            });
            if (appointmentId) {
              syncAppointmentInCache(
                queryClient,
                { id: appointmentId, status: "CONFIRMED" },
                {
                  appointmentStatus: "CONFIRMED",
                  queryKeys: [
                    ["myAppointments"],
                    ["appointments"],
                    ["userUpcomingAppointments"],
                    ["appointment", appointmentId],
                    ["video-appointments"],
                    ["video-appointment", appointmentId],
                  ],
                },
              );
            }
            invalidateSuccessfulPaymentQueries();
            showSuccessToast("Payment verified.", {
              id: TOAST_IDS.PAYMENT.SUCCESS,
            });
            onSuccess?.(response.razorpay_payment_id);
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        modal: {
          ondismiss: () => {
            reject(new Error("Payment cancelled"));
          },
        },
      });

      rz.on("payment.failed", () => {
        reject(new Error("Payment failed"));
      });

      rz.open();
    });
  };

  const handleRedirectPayment = async (
    paymentIntent: Record<string, unknown>,
    usedProvider: PaymentProvider,
  ) => {
    const metadata = (paymentIntent?.metadata as Record<string, unknown>) || {};
    const providerResponse =
      (paymentIntent?.providerResponse as Record<string, unknown>) || {};
    const fallbackClinicId =
      (paymentIntent?.clinicId as string) ||
      (metadata?.clinicId as string) ||
      APP_CONFIG.CLINIC.ID;

    if (
      launchPaymentBridge(buildBridgePayload(fallbackClinicId, paymentIntent))
    ) {
      return;
    }

    const redirectUrl =
      (paymentIntent?.gatewayRedirectUrl as string) ||
      (metadata?.gatewayRedirectUrl as string) ||
      (paymentIntent?.redirectUrl as string) ||
      (paymentIntent?.paymentLink as string) ||
      (providerResponse?.payment_link as string) ||
      (providerResponse?.redirectUrl as string) ||
      (providerResponse?.redirect_url as string) ||
      (providerResponse?.checkoutUrl as string) ||
      (providerResponse?.url as string) ||
      (metadata?.callbackUrl as string) ||
      (metadata?.redirectUrl as string) ||
      (metadata?.paymentLink as string) ||
      "";

    if (!redirectUrl) {
      throw new Error(
        `No redirect URL returned for provider '${usedProvider}'`,
      );
    }

    window.location.assign(redirectUrl);
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const providerAttempts = buildProviderAttemptOrder();
      let lastError: unknown = null;

      for (let index = 0; index < providerAttempts.length; index += 1) {
        const attemptedProvider = providerAttempts[index]!;
        try {
          const paymentResponse = await getPaymentIntent(attemptedProvider);
          const paymentIntentResponse =
            paymentResponse as PaymentIntentResponse;
          const paymentIntentData =
            paymentIntentResponse.paymentIntent ||
            paymentIntentResponse.data?.paymentIntent;

          if (!paymentResponse.success || !paymentIntentData) {
            throw new Error(
              paymentResponse.error ||
                paymentResponse.message ||
                "Failed to create payment intent",
            );
          }

          const paymentIntent = paymentIntentData as Record<string, unknown>;
          const providerFromIntent =
            typeof paymentIntent?.provider === "string"
              ? paymentIntent.provider.toLowerCase()
              : undefined;
          const usedProvider =
            providerFromIntent && isPaymentProviderEnabled(providerFromIntent)
              ? (providerFromIntent as PaymentProvider)
              : attemptedProvider;

          const paymentMetadata =
            (paymentIntent?.metadata as Record<string, unknown>) || {};
          let resolvedClinicId =
            clinicId ||
            (paymentIntent?.clinicId as string) ||
            (paymentMetadata?.clinicId as string) ||
            APP_CONFIG.CLINIC.ID;
          if (!resolvedClinicId) {
            resolvedClinicId = (await getClinicId()) || APP_CONFIG.CLINIC.ID;
          }
          if (!resolvedClinicId) {
            throw new Error(
              "Clinic context is required for payment verification",
            );
          }

          if (
            launchPaymentBridge(
              buildBridgePayload(resolvedClinicId, paymentIntent),
            )
          ) {
            return;
          }

          switch (usedProvider) {
            case "cashfree": {
              const cashfreeClient = await preloadCashfreeSdk();
              await handleCashfreePayment(
                paymentIntent,
                usedProvider,
                cashfreeClient,
              );
              break;
            }
            case "razorpay": {
              await handleRazorpayPayment(
                paymentIntent,
                usedProvider,
                resolvedClinicId,
              );
              break;
            }
            default: {
              // PhonePe, Easebuzz, Paytm, PayU — redirect-based
              await handleRedirectPayment(paymentIntent, usedProvider);
              break;
            }
          }

          return;
        } catch (error) {
          lastError = error;
          const message =
            error instanceof Error
              ? error.message
              : "Failed to initiate payment";
          const normalizedMessage = message.toLowerCase();
          const isUserCancelled =
            normalizedMessage.includes("payment cancelled") ||
            normalizedMessage.includes("payment canceled") ||
            normalizedMessage.includes("cancelled") ||
            normalizedMessage.includes("canceled") ||
            normalizedMessage.includes("dismissed");

          if (isUserCancelled || index === providerAttempts.length - 1) {
            throw error;
          }

          console.warn(
            "[PaymentButton] Payment provider attempt failed, trying next",
            {
              attemptedProvider,
              message,
            },
          );
        }
      }
    } catch (error) {
      setIsProcessing(false);
      const message =
        error instanceof Error ? error.message : "Failed to initiate payment";
      showErrorToast(message, { id: TOAST_IDS.PAYMENT.ERROR });
      onError?.(message);
    }
  };

  const handlePaymentRef = useRef(handlePayment);

  useEffect(() => {
    handlePaymentRef.current = handlePayment;
  });

  useEffect(() => {
    warmUpPaymentResources();
  }, [warmUpPaymentResources]);

  useEffect(() => {
    if (!appointmentId || !autoStart || disabled || hasAutoStartedRef.current) {
      return;
    }
    hasAutoStartedRef.current = true;
    void handlePaymentRef.current();
  }, [autoStart, disabled, appointmentId]);

  return (
    <Button
      type="button"
      onClick={handlePayment}
      onPointerEnter={warmUpPaymentResources}
      onFocus={warmUpPaymentResources}
      disabled={isProcessing || disabled}
      className={className}
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Processing…
        </>
      ) : (
        children || `Pay ₹${formatAmountFromMinorUnits(amount)}`
      )}
    </Button>
  );
}
