"use client";

import { Suspense } from "react";
import { useEffect, useMemo, useReducer } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@/hooks/core";
import { useAuth } from "@/hooks/auth/useAuth";
import { getAppointmentStatsQueryKey } from "@/lib/query/appointment-query-keys";
import { API_ENDPOINTS } from "@/lib/config/config";
import { Role } from "@/types/auth.types";
import { clinicApiClient } from "@/lib/api/client";
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
  | { type: "FAILED"; message: string }
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

function callbackReducer(
  state: CallbackState,
  action: CallbackAction,
): CallbackState {
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

function getRoleAppointmentRoute(role?: string | null): string {
  const normalized = String(role || "").toUpperCase();
  if (normalized === Role.DOCTOR || normalized === Role.ASSISTANT_DOCTOR) {
    return "/doctor/appointments";
  }
  if (normalized === Role.RECEPTIONIST) {
    return "/receptionist/appointments";
  }
  if (normalized === Role.CLINIC_ADMIN || normalized === Role.SUPER_ADMIN) {
    return "/appointments";
  }
  return "/patient/appointments";
}

function getRolePaymentsRoute(role?: string | null): string {
  const normalized = String(role || "").toUpperCase();
  if (normalized === Role.DOCTOR || normalized === Role.ASSISTANT_DOCTOR) {
    return "/doctor/appointments";
  }
  if (normalized === Role.CLINIC_ADMIN || normalized === Role.SUPER_ADMIN || normalized === Role.FINANCE_BILLING) {
    return "/billing";
  }
  if (normalized === Role.RECEPTIONIST) {
    return "/receptionist/appointments";
  }
  return "/patient/payments?tab=payments";
}

function PaymentCallbackPageContent() {
  const { user } = useAuth();
  const { replace } = useRouter();
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
      ? rawProvider
      : undefined;
    const clinicId = getSearchParam("clinicId") || "";
    const appointmentId = getSearchParam("appointmentId") || "";
    const appointmentType = (
      getSearchParam("appointmentType") || ""
    ).toUpperCase();
    const handoffToken = getSearchParam("handoff_token") || "";
    return {
      orderId,
      paymentId,
      provider,
      clinicId,
      appointmentId,
      appointmentType,
      handoffToken,
    };
  }, [getSearchParam]);

  const redirectPath = useMemo(() => {
    if (params.appointmentType === "VIDEO_CALL" || params.appointmentId) {
      return getRoleAppointmentRoute(user?.role);
    }
    return getRolePaymentsRoute(user?.role);
  }, [user?.role, params.appointmentId, params.appointmentType]);

  useEffect(() => {
    const verify = async () => {
      try {
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

        const queryParams = new URLSearchParams();
        if (isHandoff) {
          queryParams.set("handoff_token", params.handoffToken);
          if (params.orderId) {
            queryParams.set("order_id", params.orderId);
          }
          if (params.paymentId) {
            queryParams.set("payment_id", params.paymentId);
          }
          if (params.provider) {
            queryParams.set("provider", params.provider);
          }
        } else {
          queryParams.set("clinicId", params.clinicId);
          queryParams.set("paymentId", params.paymentId || params.orderId);
          queryParams.set("orderId", params.orderId);
          if (params.provider) {
            queryParams.set("provider", params.provider);
          }
        }

        const response = isHandoff
          ? await clinicApiClient.publicRequest<Record<string, unknown>>(
              `${API_ENDPOINTS.BILLING.PAYMENTS.CALLBACK}/handoff?${queryParams.toString()}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(params.clinicId
                    ? { "X-Clinic-ID": params.clinicId }
                    : {}),
                },
                body: JSON.stringify({ orderId: params.orderId }),
              },
            )
          : await clinicApiClient.publicRequest<Record<string, unknown>>(
              `${API_ENDPOINTS.BILLING.PAYMENTS.CALLBACK}?${queryParams.toString()}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Clinic-ID": params.clinicId,
                },
                body: JSON.stringify({ orderId: params.orderId }),
              },
            );

        if (!response.success) {
          throw new Error(
            response.error || response.message || "Payment verification failed",
          );
        }

        const appointmentSnapshot =
          ((response as any).appointment as
            Record<string, unknown> | undefined) ??
          (
            response.data as
              { appointment?: Record<string, unknown> } | undefined
          )?.appointment ??
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
          replace(targetUrl.toString());
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
        {state === "failed" && (
          <div className="flex flex-col gap-y-3">
            <p className="text-sm text-red-600">
              The payment could not be verified. Please review the error above
              and try again.
            </p>
            <Button className="w-full" onClick={() => replace(redirectPath)}>
              Go back
            </Button>
          </div>
        )}
        {state === "success" && (
          <div className="flex flex-col gap-y-3">
            <p className="text-sm font-medium text-primary">
              Payment is confirmed. You will be redirected in {secondsLeft ?? 0}{" "}
              seconds.
            </p>
            <Button className="w-full" onClick={() => replace(redirectPath)}>
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
