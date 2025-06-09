"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import type { OTPFormData } from "@/types/auth.types";
import { otpSchema } from "@/types/auth.types";

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOTP, requestOTP } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
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

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    if (value.match(/^[0-9]$/)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (index < 5 && value !== "") {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    } else if (value === "") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setMessage("Please enter a complete 6-digit OTP");
      setIsLoading(false);
      return;
    }

    try {
      const formData: OTPFormData = {
        email,
        otp: otpValue,
      };

      // Validate the data
      const validationResult = otpSchema.safeParse(formData);
      if (!validationResult.success) {
        setMessage(validationResult.error.errors[0].message);
        return;
      }

      await verifyOTP(formData);
      setMessage("OTP verified successfully! Redirecting...");
      // The AuthLayout component will handle the redirection based on role
    } catch (error) {
      console.error("OTP verification error:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Invalid OTP. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      await requestOTP(email);
      setMessage("A new OTP has been sent to your email.");
      // Reset OTP input fields
      setOtp(["", "", "", "", "", ""]);
    } catch (error) {
      console.error("Resend OTP error:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to resend OTP. Please try again."
      );
    } finally {
      setIsLoading(false);
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
        <form onSubmit={handleSubmit} className="space-y-6">
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
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {message && (
            <div
              className={`p-3 rounded-md ${
                message.includes("success") || message.includes("sent")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          <div className="space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2" />
                  Verifying...
                </div>
              ) : (
                "Verify OTP"
              )}
            </Button>

            <div className="flex flex-col items-center space-y-2">
              <Button
                type="button"
                variant="link"
                onClick={handleResendOTP}
                disabled={isLoading}
              >
                Resend OTP
              </Button>

              <Button
                type="button"
                variant="link"
                onClick={() => router.push("/auth/login")}
                disabled={isLoading}
              >
                Back to Login
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <h2 className="text-2xl font-bold text-center">Loading...</h2>
          </CardHeader>
        </Card>
      }
    >
      <VerifyOTPContent />
    </Suspense>
  );
}
