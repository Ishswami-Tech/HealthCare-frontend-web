"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { otpSchema } from "@/lib/schema";
import type { OtpVerifyFormData as OTPFormData } from "@/types/auth.types";
import useZodForm from "@/hooks/utils/useZodForm";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useAuthForm } from "@/hooks/auth/useAuth";
import { TOAST_IDS } from "@/hooks/utils/use-toast";
import { ROUTES } from "@/lib/config/routes";
import { OtpCodeInput } from "@/components/auth/otp-code-input";

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClinicId = searchParams.get("clinicId") || undefined;
  const isRegistration =
    searchParams.get("isRegistration") === "true" ||
    searchParams.get("isRegistration") === "1";
  const { verifyOTP, requestOTP, isVerifyingOTP, isRequestingOTP } = useAuth();
  const [email, setEmail] = useState("");
  const [successPhase, setSuccessPhase] = useState<"none" | "alert" | "redirecting">("none");
  const [formError, setFormError] = useState<string | null>(null);

  const triggerSuccessFlow = useCallback(() => {
    setFormError(null);
    setSuccessPhase("alert");
    setTimeout(() => setSuccessPhase("redirecting"), 1500);
  }, []);

  // ✅ Use unified auth form hook for consistent patterns
  const { executeAuthOperation } = useAuthForm({
    toastId: TOAST_IDS.AUTH.OTP,
    loadingMessage: "Verifying OTP...",
    successMessage: "OTP verified successfully! Redirecting...",
    errorMessage: "OTP verification failed. Please try again.",
    showToast: false,
    // Don't redirect - AuthLayout will handle it
  });

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (!emailParam) {
      router.push(ROUTES.LOGIN);
      return;
    }
    setEmail(emailParam);
  }, [searchParams, router]);

  const form = useZodForm(
    otpSchema,
    async (data: OTPFormData) => {
      const result = await executeAuthOperation(async () => {
      return await verifyOTP({
        ...data,
        clinicId: queryClinicId,
        isRegistration,
      });
      });
      if (!result) {
        setFormError("OTP verification failed. Please try again.");
        return;
      }
      triggerSuccessFlow();
    },
    {
      identifier: email,
      otp: "",
    }
  );
  const otpValue = form.watch("otp");

  // ✅ Use unified auth form hook for OTP resend
  const { executeAuthOperation: executeOTPResend } = useAuthForm({
    toastId: TOAST_IDS.AUTH.OTP,
    loadingMessage: "Sending OTP...",
    successMessage: "A new OTP has been sent to your email.",
    errorMessage: "Failed to resend OTP. Please try again.",
    showToast: false,
    onSuccess: () => {
      form.setValue("otp", "");
      form.clearErrors("otp");
    },
  });

  const handleResendOTP = async () => {
    // ✅ Use unified pattern - consistent across all auth pages
    const result = await executeOTPResend(async () => {
      return await requestOTP({
        identifier: email,
        clinicId: queryClinicId,
        isRegistration,
      });
    });
    if (!result) {
      setFormError("Failed to resend OTP. Please try again.");
    }
  };

  // ✅ Overlay clearing is handled by auth layout - no need to clear here
  // This prevents race conditions and ensures consistent behavior

  // Redirecting overlay
  if (successPhase === "redirecting") {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg px-4 sm:px-0">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-5">
          <div className="relative flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <Loader2 className="absolute h-20 w-20 animate-spin text-green-500/40" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Successfully signed in!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to dashboard…</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg px-4 sm:px-0">
      <CardHeader className="px-4 sm:px-6">
        <h2 className="text-xl sm:text-2xl font-bold text-center">
          Verify OTP
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 text-center mt-2 break-words">
          Enter the 6-digit code sent to{" "}
          <span className="font-medium">{email}</span>
        </p>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {/* Success alert */}
        {formError && (
          <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="h-5 w-5 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-red-600 dark:text-red-300">!</span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300">{formError}</p>
          </div>
        )}
        {successPhase === "alert" && (
          <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">OTP verified!</p>
              <p className="text-xs text-green-600 dark:text-green-400">Redirecting to your dashboard…</p>
            </div>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.onFormSubmit} className="space-y-6">
            <FormField
              control={form.control}
              name="otp"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormControl>
                    <OtpCodeInput
                      value={field.value}
                      onChange={(value) => {
                        setFormError(null);
                        field.onChange(value);
                      }}
                      disabled={isVerifyingOTP || successPhase !== "none"}
                      invalid={!!fieldState.error || !!formError}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isVerifyingOTP || (otpValue || "").length !== 6 || successPhase !== "none"}
              >
                {isVerifyingOTP ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2" />
                    Verifying...
                  </div>
                ) : (
                  "Verify OTP"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResendOTP}
                disabled={isRequestingOTP || successPhase !== "none"}
              >
                {isRequestingOTP ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-b-2 border-current rounded-full animate-spin mr-2" />
                    Sending...
                  </div>
                ) : (
                  "Resend OTP"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

