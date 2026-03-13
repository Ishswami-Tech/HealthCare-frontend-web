"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_CONFIG, API_ENDPOINTS } from "@/lib/config/config";

type VerifyState = "loading" | "success" | "failed";
const ALLOWED_PROVIDERS = new Set(["cashfree"]);

export default function PaymentCallbackPage() {
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
    return { orderId, paymentId, provider, clinicId };
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
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

      if (!APP_CONFIG.API.BASE_URL || !/^https?:\/\//.test(APP_CONFIG.API.BASE_URL)) {
        setState("failed");
        setMessage("Payment verification service is not configured.");
        return;
      }

      try {
        const query = new URLSearchParams({
          clinicId: params.clinicId,
          paymentId: params.paymentId || params.orderId,
          orderId: params.orderId,
          provider: params.provider,
        });

        const response = await fetch(
          `${APP_CONFIG.API.BASE_URL}${API_ENDPOINTS.BILLING.PAYMENTS.CALLBACK}?${query.toString()}`,
          {
            method: "POST",
            credentials: "include",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              "X-Clinic-ID": params.clinicId,
            },
            body: JSON.stringify({ orderId: params.orderId }),
          }
        );

        const data = (await response.json().catch(() => ({}))) as {
          success?: boolean;
          message?: string;
        };
        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "Payment verification failed");
        }

        setState("success");
        setMessage("Payment verified successfully.");
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
    };
  }, [params]);

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

        <div className="flex gap-2 justify-center">
          <Button asChild variant="default">
            <Link href="/patient/appointments">Go To Appointments</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/patient/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
