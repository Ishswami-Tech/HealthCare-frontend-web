"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import type { OTPFormData } from "@/types/auth.types";
import { otpSchema } from "@/types/auth.types";
import useZodForm from "@/hooks/useZodForm";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOTP, requestOTP, isVerifyingOTP, isRequestingOTP } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (!emailParam) {
      router.push("/auth/login");
      return;
    }
    setEmail(emailParam);
  }, [searchParams, router]);

  const form = useZodForm(
    otpSchema,
    async (data: OTPFormData) => {
      await verifyOTP(data);
      toast.success("OTP verified successfully! Redirecting...");
      // The AuthLayout component will handle the redirection based on role
    },
    {
      email: email,
      otp: "",
    }
  );

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
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

  const handleResendOTP = async () => {
    try {
      await requestOTP(email);
      toast.success("A new OTP has been sent to your email.");
      // Reset OTP input fields
      setOtp(["", "", "", "", "", ""]);
      form.setValue("otp", "");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to resend OTP. Please try again."
      );
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <h2 className="text-2xl font-bold text-center">Verify OTP</h2>
        <p className="text-sm text-gray-600 text-center mt-2">
          Enter the 6-digit code sent to {email}
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.onFormSubmit} className="space-y-6">
            <FormField
              control={form.control}
              name="otp"
              render={() => (
                <FormItem>
                  <FormControl>
                    <div className="flex justify-center space-x-2">
                      {otp.map((digit, index) => (
                        <Input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          className="w-12 h-12 text-center text-lg"
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
