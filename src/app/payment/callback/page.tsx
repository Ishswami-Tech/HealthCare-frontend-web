"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useQueryClient } from "@/hooks/core";
import { API_ENDPOINTS } from "@/lib/config/config";
import { clinicApiClient } from "@/lib/api/client";
import { getAppointmentStatsQueryKey } from "@/lib/query/appointment-query-keys";

type VerifyState = "loading" | "success" | "failed";
const ALLOWED_PROVIDERS = new Set(["cashfree"]);

export default function PaymentCallbackPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("Verifying payment...");

  const params = useMemo(() => {
    const orderId =
      searchParams.get("orderId") ||
      searchParams.get("order_id") ||
      searchParams.get("cf_order_id") ||
      "";
    const paymentId =
      searchParams.get("paymentId") ||
      searchParams.get("payment_id") ||
      orderId;
    const rawProvider = (searchParams.get("provider") || "cashfree").toLowerCase();
    const provider = ALLOWED_PROVIDERS.has(rawProvider) ? rawProvider : "cashfree";
    const clinicId = searchParams.get("clinicId") || "";
    const appointmentId = searchParams.get("appointmentId") || "";
    return { orderId, paymentId, provider, clinicId, appointmentId };
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;
    const verify = async () => {
      if (!params.orderId) {
        setState("failed");
        setMessage("Missing order ID in callback URL.");
        return;
      }

      if (!params.clinicId) {
        setState("failed");
        setMessage("Missing clinic context for payment verification.");
        return;
      }

      try {
        const query = new URLSearchParams({
          clinicId: params.clinicId,
          paymentId: params.paymentId || params.orderId,
          orderId: params.orderId,
          provider: params.provider,
        });

        const response = await clinicApiClient.publicRequest<{
          success?: boolean;
          message?: string;
        }>(`${API_ENDPOINTS.BILLING.PAYMENTS.CALLBACK}?${query.toString()}`, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            "X-Clinic-ID": params.clinicId,
          },
          body: JSON.stringify({ orderId: params.orderId }),
        });

        if (!response.data?.success) {
          throw new Error(response.data?.message || "Payment verification failed");
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

        setState("success");
        setMessage("Payment verified successfully.");
        redirectTimer = setTimeout(() => {
          router.replace(params.appointmentId ? "/patient/appointments" : "/patient/billing");
        }, 1500);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setState("failed");
        setMessage(
          error instanceof Error ? error.message : "Unable to verify payment."
        );
      }
    };

    verify();
    return () => {
      controller.abort();
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [params, queryClient, router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center space-y-4">
        {state === "loading" && (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        )}
        {state === "success" && (
          <CheckCircle2 className="mx-auto h-8 w-8 text-green-600" />
        )}
        {state === "failed" && (
          <XCircle className="mx-auto h-8 w-8 text-red-600" />
        )}

        <h1 className="text-lg font-semibold">Payment Callback</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        {state === "success" && (
          <p className="text-sm font-medium text-primary">
            Redirecting to {params.appointmentId ? "appointments" : "billing"}...
          </p>
        )}
      </div>
    </div>
  );
}
