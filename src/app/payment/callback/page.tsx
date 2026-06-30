"use client";

import { Suspense } from "react";
import { useEffect, useMemo, useReducer } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@/hooks/core";
import { getAppointmentStatsQueryKey } from "@/lib/query/appointment-query-keys";
import { API_ENDPOINTS } from "@/lib/config/config";
import { clinicApiClient } from "@/lib/api/client";
import { syncAppointmentInCache } from "@/lib/utils/appointment-cache";

type VerifyState = "loading" | "success" | "failed";
const ALLOWED_PROVIDERS = new Set([
  "cashfree",
  "razorpay",
  "phonepe",
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
  | { type: "FAILED"; message: string }
  | { type: "SUCCESS"; message: string; secondsLeft: number }
  | { type: "TICK" }
  | { type: "RESET_SECONDS" };

const initialCallbackState: CallbackState = {
  state: "loading",
  message: "Verifying payment...",
  secondsLeft: null,
};

function callbackReducer(state: CallbackState, action: CallbackAction): CallbackState {
  switch (action.type) {
    case "FAILED":
      return {
        state: "failed",
        message: action.message,
        secondsLeft: null,
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
  const { replace } = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [{ state, message, secondsLeft }, dispatch] = useReducer(callbackReducer, initialCallbackState);
  const getSearchParam = useMemo(
    () => searchParams.get.bind(searchParams),
    [searchParams]
  );

  const params = useMemo(() => {
    const orderId =
      getSearchParam("orderId") ||
      getSearchParam("order_id") ||
      getSearchParam("cf_order_id") ||
      "";
    const paymentId =
      getSearchParam("paymentId") ||
      getSearchParam("payment_id") ||
      orderId;
    const rawProvider = (getSearchParam("provider") || "cashfree").toLowerCase();
    const provider = ALLOWED_PROVIDERS.has(rawProvider) ? rawProvider : "cashfree";
    const clinicId = getSearchParam("clinicId") || "";
    const appointmentId = getSearchParam("appointmentId") || "";
    const appointmentType = (getSearchParam("appointmentType") || "").toUpperCase();
    return { orderId, paymentId, provider, clinicId, appointmentId, appointmentType };
  }, [getSearchParam]);

  const redirectPath =
    params.appointmentType === "VIDEO_CALL"
      ? "/patient/appointments"
      : params.appointmentId
        ? "/patient/appointments"
        : "/patient/payments?tab=payments";

  useEffect(() => {
    const verify = async () => {
      if (!params.orderId) {
        dispatch({ type: "FAILED", message: "Missing order ID in callback URL." });
        return;
      }

      if (!params.clinicId) {
        dispatch({ type: "FAILED", message: "Missing clinic context for payment verification." });
        return;
      }

      try {
        const queryParams = new URLSearchParams({
          clinicId: params.clinicId,
          paymentId: params.paymentId || params.orderId,
          orderId: params.orderId,
          provider: params.provider,
        });

        const response = await clinicApiClient.publicRequest<Record<string, unknown>>(
          `${API_ENDPOINTS.BILLING.PAYMENTS.CALLBACK}?${queryParams.toString()}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Clinic-ID": params.clinicId,
            },
            body: JSON.stringify({ orderId: params.orderId }),
          }
        );

        if (!response.success) {
          throw new Error(response.error || response.message || "Payment verification failed");
        }

        const appointmentSnapshot =
          ((response as any).appointment as Record<string, unknown> | undefined) ??
          ((response.data as { appointment?: Record<string, unknown> } | undefined)?.appointment) ??
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

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["myAppointments"], exact: false }),
          queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false }),
          queryClient.invalidateQueries({ queryKey: ["video-appointments"], exact: false }),
          queryClient.invalidateQueries({ queryKey: ["video-appointment"], exact: false }),
          queryClient.invalidateQueries({
            queryKey: getAppointmentStatsQueryKey(params.clinicId || undefined),
            exact: false,
          }),
          queryClient.invalidateQueries({ queryKey: ["userUpcomingAppointments"], exact: false }),
          queryClient.invalidateQueries({ queryKey: ["invoices"], exact: false }),
          queryClient.invalidateQueries({ queryKey: ["payments"], exact: false }),
          queryClient.invalidateQueries({ queryKey: ["subscriptions"], exact: false }),
          queryClient.invalidateQueries({ queryKey: ["active-subscription"], exact: false }),
          queryClient.invalidateQueries({ queryKey: ["billing-analytics"], exact: false }),
        ]);

        dispatch({
          type: "SUCCESS",
          message: "Payment verified. Redirecting shortly...",
          secondsLeft: 3,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        dispatch({
          type: "FAILED",
          message: error instanceof Error ? error.message : "Unable to verify payment.",
        });
      }
    };

    verify();
  }, [params, queryClient]);

  useEffect(() => {
    if (state !== "success") {
      if (secondsLeft !== null) {
        dispatch({ type: "RESET_SECONDS" });
      }
      return;
    }

    if (secondsLeft === null) {
      return;
    }

    if (secondsLeft <= 0) {
      replace(redirectPath);
      return;
    }

    const timer = window.setTimeout(() => {
      dispatch({ type: "TICK" });
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [replace, redirectPath, secondsLeft, state]);

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
        {state === "success" && (
          <div className="flex flex-col gap-y-3">
            <p className="text-sm font-medium text-primary">
              Payment is confirmed. You will be redirected in {secondsLeft ?? 0} seconds.
            </p>
            <Button
              className="w-full"
              onClick={() => replace(redirectPath)}
            >
              Go to {params.appointmentType === "VIDEO_CALL" ? "video appointments" : params.appointmentId ? "appointments" : "billing"}
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


