"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOTP, requestOTP, isVerifyingOTP, isRequestingOTP } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");

  // ✅ Use unified auth form hook for consistent patterns
  const { executeAuthOperation } = useAuthForm({
    toastId: TOAST_IDS.AUTH.OTP,
    loadingMessage: "Verifying OTP...",
    successMessage: "OTP verified successfully! Redirecting...",
    errorMessage: "OTP verification failed. Please try again.",
    showToast: true,
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
      // ✅ Use unified pattern - consistent across all auth pages
      await executeAuthOperation(async () => {
        return await verifyOTP(data);
      });
      // The AuthLayout component will handle the redirection based on role
    },
    {
      identifier: email,
      otp: "",
    }
  );

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0] || "";
    }

    if (value.match(/^[0-9]$/)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Update form value
      form.setValue("otp", newOtp.join(""));

      // Auto-focus next input
      if (index < 5 && value !== "") {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    } else if (value === "") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);

      // Update form value
      form.setValue("otp", newOtp.join(""));

      // Auto-focus previous input on backspace
      if (index > 0) {
        const prevInput = document.getElementById(`otp-${index - 1}`);
        prevInput?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // ✅ Use unified auth form hook for OTP resend
  const { executeAuthOperation: executeOTPResend } = useAuthForm({
    toastId: TOAST_IDS.AUTH.OTP,
    loadingMessage: "Sending OTP...",
    successMessage: "A new OTP has been sent to your email.",
    errorMessage: "Failed to resend OTP. Please try again.",
    showToast: true,
    onSuccess: () => {
      // Reset OTP input fields
      setOtp(["", "", "", "", "", ""]);
      form.setValue("otp", "");
    },
  });

  const handleResendOTP = async () => {
    // ✅ Use unified pattern - consistent across all auth pages
    await executeOTPResend(async () => {
      return await requestOTP({ identifier: email });
    });
  };

  // ✅ Overlay clearing is handled by auth layout - no need to clear here
  // This prevents race conditions and ensures consistent behavior

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
        <Form {...form}>
          <form onSubmit={form.onFormSubmit} className="space-y-6">
            <FormField
              control={form.control}
              name="otp"
              render={() => (
                <FormItem>
                  <FormControl>
                    <div className="flex justify-center gap-2 sm:gap-3">
                      {otp.map((digit, index) => (
                        <Input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          className="w-10 h-10 sm:w-12 sm:h-12 text-center text-base sm:text-lg font-semibold"
                          value={digit}
                          onChange={(e) =>
                            handleOtpChange(index, e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          autoFocus={index === 0}
                          disabled={isVerifyingOTP}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isVerifyingOTP || otp.join("").length !== 6}
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
                disabled={isRequestingOTP}
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
