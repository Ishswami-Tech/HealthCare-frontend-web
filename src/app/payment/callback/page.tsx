"use client";

import { Suspense } from "react";
import { useEffect, useMemo, useReducer } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@/hooks/core";
import { getAppointmentStatsQueryKey } from "@/lib/query/appointment-query-keys";
import type { PaymentProvider } from "@/lib/payments/providers";
import { verifyPaymentCallback as verifyPaymentCallbackServerAction } from "@/lib/actions/billing.server";
import { syncAppointmentInCache } from "@/lib/utils/appointment-cache";

type VerifyState = "loading" | "success" | "failed";
const ALLOWED_PROVIDERS = new Set([
  "cashfree",
  "razorpay",
  "phonepe",
  "zoho",
  "easebuzz",
  "paytm",
  "payu",
]);

type CallbackState = {
  state: VerifyState;
  message: string;
  secondsLeft: number | null;
};

type CallbackAction =
  | { type: "FAILED"; message: string; secondsLeft?: number }
  | { type: "SUCCESS"; message: string; secondsLeft: number }
  | { type: "TICK" }
  | { type: "RESET_SECONDS" };

const initialCallbackState: CallbackState = {
  state: "loading",
  message: "Verifying payment...",
  secondsLeft: null,
};

function normalizeBaseUrl(rawUrl: string, fallback: string): string {
  const value = (rawUrl || fallback || "").trim().replace(/\/+$/u, "");
  return value || fallback;
}

function decodeBase64UrlJson(rawValue: string): Record<string, unknown> | null {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  try {
    const decoded =
      typeof window === "undefined"
        ? Buffer.from(padded, "base64").toString("utf-8")
        : atob(padded);
    const parsed = JSON.parse(decoded) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizePaymentStatus(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function isVerifiedPaymentStatus(value: unknown): boolean {
  const status = normalizePaymentStatus(value);
  return [
    "completed",
    "confirmed",
    "paid",
    "success",
    "succeeded",
  ].includes(status);
}

function callbackReducer(
  state: CallbackState,
  action: CallbackAction,
): CallbackState {
  switch (action.type) {
    case "FAILED":
      return {
        state: "failed",
        message: action.message,
        secondsLeft: action.secondsLeft ?? 5,
      };
    case "SUCCESS":
      return {
        state: "success",
        message: action.message,
        secondsLeft: action.secondsLeft,
      };
    case "TICK":
      return {
        ...state,
        secondsLeft: state.secondsLeft === null ? null : state.secondsLeft - 1,
      };
    case "RESET_SECONDS":
      return {
        ...state,
        secondsLeft: null,
      };
    default:
      return state;
  }
}

function PaymentCallbackPageContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [{ state, message, secondsLeft }, dispatch] = useReducer(
    callbackReducer,
    initialCallbackState,
  );
  const getSearchParam = useMemo(
    () => searchParams.get.bind(searchParams),
    [searchParams],
  );

  const bridgePayload = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const searchPayload = searchParams.get("payload") || "";
    const hashPayload = new URLSearchParams(
      window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash,
    ).get("payload");
    const rawPayload = searchPayload || hashPayload || "";

    if (!rawPayload) {
      return null;
    }

    return decodeBase64UrlJson(rawPayload);
  }, [searchParams]);

  const params = useMemo(() => {
    const orderId =
      getSearchParam("orderId") ||
      getSearchParam("order_id") ||
      getSearchParam("cf_order_id") ||
      "";
    const rawProvider = (getSearchParam("provider") || "").toLowerCase();
    const paymentId =
      rawProvider === "zoho"
        ? getSearchParam("payments_session_id") ||
          getSearchParam("payment_session_id") ||
          getSearchParam("payment_id") ||
          orderId
        : getSearchParam("paymentId") ||
          getSearchParam("payment_id") ||
          orderId;
    const provider = ALLOWED_PROVIDERS.has(rawProvider)
      ? (rawProvider as PaymentProvider)
      : undefined;
    const clinicId = getSearchParam("clinicId") || "";
    const appointmentId = getSearchParam("appointmentId") || "";
    const appointmentType = (
      getSearchParam("appointmentType") || ""
    ).toUpperCase();
    const handoffToken = getSearchParam("handoff_token") || "";
    const paymentError = getSearchParam("paymentError") || "";
    const payloadClinicId =
      typeof bridgePayload?.clinicId === "string"
        ? bridgePayload.clinicId
        : typeof bridgePayload?.clinic_id === "string"
          ? bridgePayload.clinic_id
          : "";
    const payloadAppointmentId =
      typeof bridgePayload?.appointmentId === "string"
        ? bridgePayload.appointmentId
        : typeof bridgePayload?.appointment_id === "string"
          ? bridgePayload.appointment_id
          : "";
    const payloadAppointmentType =
      typeof bridgePayload?.appointmentType === "string"
        ? bridgePayload.appointmentType
        : typeof bridgePayload?.appointment_type === "string"
          ? bridgePayload.appointment_type
          : "";
    const payloadProvider =
      typeof bridgePayload?.provider === "string"
        ? bridgePayload.provider
        : typeof bridgePayload?.paymentProvider === "string"
          ? bridgePayload.paymentProvider
          : "";
    const payloadHandoffToken =
      typeof bridgePayload?.handoffToken === "string"
        ? bridgePayload.handoffToken
        : typeof bridgePayload?.handoff_token === "string"
          ? bridgePayload.handoff_token
          : "";
    const payloadPaymentId =
      typeof bridgePayload?.paymentId === "string"
        ? bridgePayload.paymentId
        : typeof bridgePayload?.payment_id === "string"
          ? bridgePayload.payment_id
          : "";
    return {
      orderId: orderId || (typeof bridgePayload?.orderId === "string" ? bridgePayload.orderId : ""),
      paymentId: paymentId || payloadPaymentId,
      provider: provider || (ALLOWED_PROVIDERS.has(String(payloadProvider).toLowerCase()) ? (String(payloadProvider).toLowerCase() as PaymentProvider) : undefined),
      clinicId: clinicId || payloadClinicId,
      appointmentId: appointmentId || payloadAppointmentId,
      appointmentType: appointmentType || payloadAppointmentType,
      handoffToken: handoffToken || payloadHandoffToken,
      paymentError: paymentError || (typeof bridgePayload?.paymentError === "string" ? bridgePayload.paymentError : ""),
    };
  }, [bridgePayload, getSearchParam]);

  const rawPayload = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return (
      searchParams.get("payload") ||
      new URLSearchParams(
        window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : window.location.hash,
      ).get("payload") ||
      ""
    );
  }, [searchParams]);

  const invalidPayloadMessage =
    params.paymentError === "invalid_payload" ||
    (Boolean(rawPayload) &&
      !params.handoffToken &&
      !bridgePayload &&
      !(params.orderId && params.clinicId))
      ? "Invalid payment payload. Please reopen the payment link."
      : "";
  const invalidPayloadDetails =
    invalidPayloadMessage
      ? "The payment payload could not be decoded from the URL."
      : "";

  const redirectPath = useMemo(() => {
    if (params.appointmentType === "VIDEO_CALL" || params.appointmentId) {
      return "/patient/appointments";
    }
    return "/patient/payments?tab=payments";
  }, [params.appointmentId, params.appointmentType]);

  const hardRedirect = (url: string) => {
    if (typeof window === "undefined") {
      return;
    }

    window.location.replace(url);
  };

  useEffect(() => {
    const verify = async () => {
      try {
        if (invalidPayloadMessage) {
          dispatch({
            type: "FAILED",
            message: invalidPayloadMessage,
          });
          return;
        }

        const isHandoff = Boolean(params.handoffToken);
        if (!isHandoff) {
          if (!params.orderId) {
            dispatch({
              type: "FAILED",
              message: "Missing order ID in callback URL.",
            });
            return;
          }

          if (!params.clinicId) {
            dispatch({
              type: "FAILED",
              message: "Missing clinic context for payment verification.",
            });
            return;
          }
        }

        const response = await verifyPaymentCallbackServerAction({
          clinicId: isHandoff ? params.clinicId || undefined : params.clinicId,
          orderId: params.orderId,
          paymentId: params.paymentId || undefined,
          provider: params.provider,
          ...(isHandoff ? { handoffToken: params.handoffToken } : {}),
        });

        if (!response.success) {
          throw new Error(
            response.error || response.message || "Payment verification failed",
          );
        }

        const responsePayment =
          (response.payment as Record<string, unknown> | undefined) || null;
        const verifiedStatus =
          responsePayment?.["status"] ||
          responsePayment?.["paymentStatus"] ||
          undefined;

        if (!isVerifiedPaymentStatus(verifiedStatus)) {
          const statusLabel = verifiedStatus ? String(verifiedStatus) : "pending";
          throw new Error(
            `Payment is not verified yet. Current status: ${statusLabel}.`,
          );
        }

        const appointmentSnapshot =
          (response.appointment as Record<string, unknown> | undefined) ??
          (params.appointmentId
            ? {
                id: params.appointmentId,
                appointmentId: params.appointmentId,
                status: "CONFIRMED",
                paymentCompleted: true,
                paymentPending: false,
                paymentStatus: "PAID",
                updatedAt: new Date().toISOString(),
              }
            : undefined);

        if (appointmentSnapshot) {
          syncAppointmentInCache(queryClient, appointmentSnapshot, {
            appointmentStatus: "CONFIRMED",
            queryKeys: [
              ["myAppointments"],
              ["appointments"],
              ["userUpcomingAppointments"],
              ["appointment", params.appointmentId],
              ["video-appointments"],
              ["video-appointment", params.appointmentId],
            ],
          });
        }

        void Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["myAppointments"],
            exact: false,
          }),
          queryClient.invalidateQueries({
            queryKey: ["appointments"],
            exact: false,
          }),
          queryClient.invalidateQueries({
            queryKey: ["video-appointments"],
            exact: false,
          }),
          queryClient.invalidateQueries({
            queryKey: ["video-appointment"],
            exact: false,
          }),
          queryClient.invalidateQueries({
            queryKey: getAppointmentStatsQueryKey(params.clinicId || undefined),
            exact: false,
          }),
          queryClient.invalidateQueries({
            queryKey: ["userUpcomingAppointments"],
            exact: false,
          }),
          queryClient.invalidateQueries({
            queryKey: ["invoices"],
            exact: false,
          }),
          queryClient.invalidateQueries({
            queryKey: ["payments"],
            exact: false,
          }),
          queryClient.invalidateQueries({
            queryKey: ["subscriptions"],
            exact: false,
          }),
          queryClient.invalidateQueries({
            queryKey: ["active-subscription"],
            exact: false,
          }),
          queryClient.invalidateQueries({
            queryKey: ["billing-analytics"],
            exact: false,
          }),
        ]).catch(() => undefined);

        dispatch({
          type: "SUCCESS",
          message: "Payment verified. Redirecting now...",
          secondsLeft: 1,
        });

        if (isHandoff) {
          const appBaseUrl = normalizeBaseUrl(
            process.env.NEXT_PUBLIC_APP_URL || "",
            "https://www.viddhakarma.com",
          );
          const targetUrl = new URL(`${appBaseUrl}${redirectPath}`);
          targetUrl.searchParams.set("paymentVerified", "1");
          if (params.appointmentId) {
            targetUrl.searchParams.set("appointmentId", params.appointmentId);
          }
          if (params.orderId) {
            targetUrl.searchParams.set("orderId", params.orderId);
          }
          if (params.provider) {
            targetUrl.searchParams.set("provider", params.provider);
          }
          hardRedirect(targetUrl.toString());
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        dispatch({
          type: "FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Unable to verify payment.",
        });
      }
    };

    verify();
  }, [invalidPayloadMessage, params, queryClient]);

  useEffect(() => {
    if (state !== "success" && state !== "failed") {
      if (secondsLeft !== null) {
        dispatch({ type: "RESET_SECONDS" });
      }
      return;
    }

    if (secondsLeft === null) {
      return;
    }

    if (secondsLeft <= 0) {
      hardRedirect(redirectPath);
      return;
    }

    const timer = window.setTimeout(() => {
      dispatch({ type: "TICK" });
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [redirectPath, secondsLeft, state]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="flex w-full max-w-md flex-col gap-y-4 rounded-xl border bg-card p-6 text-center">
        {state === "loading" && (
          <Loader2 className="mx-auto size-8 animate-spin text-primary" />
        )}
        {state === "success" && (
          <CheckCircle2 className="mx-auto size-8 text-green-600" />
        )}
        {state === "failed" && (
          <XCircle className="mx-auto size-8 text-red-600" />
        )}

        <h1 className="text-lg font-semibold">Payment Callback</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        {state === "failed" && (
          <div className="flex flex-col gap-y-3">
            <p className="text-sm text-red-600">
              {invalidPayloadDetails
                ? `${invalidPayloadDetails} Redirecting to ${redirectPath.includes("/appointments") ? "appointments" : "billing"} within ${secondsLeft ?? 5} seconds.`
                : `Payment failed or could not be verified. Redirecting to ${redirectPath.includes("/appointments") ? "appointments" : "billing"} within ${secondsLeft ?? 5} seconds.`}
            </p>
            <Button className="w-full" onClick={() => hardRedirect(redirectPath)}>
              Go to {redirectPath.includes("/appointments") ? "appointments" : "billing"} now
            </Button>
          </div>
        )}
        {state === "success" && (
          <div className="flex flex-col gap-y-3">
            <p className="text-sm font-medium text-primary">
              Payment is confirmed. You will be redirected in {secondsLeft ?? 0}{" "}
              seconds.
            </p>
            <Button className="w-full" onClick={() => hardRedirect(redirectPath)}>
              Go to{" "}
              {params.appointmentType === "VIDEO_CALL"
                ? "video appointments"
                : params.appointmentId
                  ? "appointments"
                  : "billing"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={null}>
      <PaymentCallbackPageContent />
    </Suspense>
  );
}
