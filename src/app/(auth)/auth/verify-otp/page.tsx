"use client";

import { Suspense, useEffect, useCallback, useRef, useMemo, useReducer } from "react";
import { useRouter as useRouterAlias, useSearchParams } from "next/navigation";
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

const RESEND_COOLDOWN_SECONDS = 60;

type VerifyOTPState = {
  email: string;
  successPhase: "none" | "alert" | "redirecting";
  formError: string | null;
  attemptsRemaining: number | null;
  countdown: number;
};

type VerifyOTPAction =
  | { type: "setEmail"; value: string }
  | { type: "setSuccessPhase"; value: VerifyOTPState["successPhase"] }
  | { type: "setFormError"; value: string | null }
  | { type: "setAttemptsRemaining"; value: number | null }
  | {
      type: "setCountdown";
      value: number | ((prev: number) => number);
    };

const initialVerifyOTPState: VerifyOTPState = {
  email: "",
  successPhase: "none",
  formError: null,
  attemptsRemaining: null,
  countdown: RESEND_COOLDOWN_SECONDS,
};

function verifyOTPReducer(
  state: VerifyOTPState,
  action: VerifyOTPAction
): VerifyOTPState {
  switch (action.type) {
    case "setEmail":
      return { ...state, email: action.value };
    case "setSuccessPhase":
      return { ...state, successPhase: action.value };
    case "setFormError":
      return { ...state, formError: action.value };
    case "setAttemptsRemaining":
      return { ...state, attemptsRemaining: action.value };
    case "setCountdown":
      return {
        ...state,
        countdown:
          typeof action.value === "function"
            ? action.value(state.countdown)
            : action.value,
      };
    default:
      return state;
  }
}

function VerifyOTPPageContent() {
  const { push } = useRouterAlias();
  const searchParams = useSearchParams();
  const getSearchParam = useMemo(() => searchParams.get.bind(searchParams), [searchParams]);
  // Read clinicId from query param first, then fall back to cookie
  const queryClinicId = getSearchParam("clinicId");
  const cookieClinicId = typeof document !== 'undefined'
    ? document.cookie.match(/clinic_id=([^;]+)/)?.[1]
    : undefined;
  const clinicId = queryClinicId || cookieClinicId;
  const { verifyOTP, requestOTP, isVerifyingOTP, isRequestingOTP } = useAuth();
  const [
    {
      email,
      successPhase,
      formError,
      attemptsRemaining,
      countdown,
    },
    dispatch,
  ] = useReducer(verifyOTPReducer, initialVerifyOTPState);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const setEmail = (value: string) => dispatch({ type: "setEmail", value });
  const setSuccessPhase = (value: VerifyOTPState["successPhase"]) =>
    dispatch({ type: "setSuccessPhase", value });
  const setFormError = (value: string | null) =>
    dispatch({ type: "setFormError", value });
  const setAttemptsRemaining = (value: number | null) =>
    dispatch({ type: "setAttemptsRemaining", value });
  const setCountdown = (value: number | ((prev: number) => number)) =>
    dispatch({ type: "setCountdown", value });

  const triggerSuccessFlow = useCallback(() => {
    setFormError(null);
    setSuccessPhase("alert");
    setTimeout(() => setSuccessPhase("redirecting"), 1500);
  }, []);

  // âœ… Use unified auth form hook for consistent patterns
  const { executeAuthOperation } = useAuthForm({
    toastId: TOAST_IDS.AUTH.OTP,
    loadingMessage: "Verifying OTP...",
    successMessage: "OTP verified successfully! Redirecting…",
    errorMessage: "OTP verification failed. Please try again.",
    showToast: false,
    onError: (error) => {
      // Handle specific error cases
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('locked') || errorMsg.includes('too many') || errorMsg.includes('minutes')) {
        // Account locked - show the lockout message
        setFormError(error.message);
      } else if (errorMsg.includes('user not found') || errorMsg.includes('invalid otp')) {
        setFormError("Invalid OTP. Please check and try again.");
      } else if (errorMsg.includes('expired')) {
        setFormError("OTP has expired. Please request a new one.");
      } else {
        setFormError(error.message);
      }
    },
    // Don't redirect - AuthLayout will handle it
  });

  useEffect(() => {
    const emailParam = getSearchParam("email");
    if (!emailParam) {
      push(ROUTES.LOGIN);
      return;
    }
    dispatch({ type: "setEmail", value: emailParam });
  }, [dispatch, getSearchParam, push]);

  const form = useZodForm(
    otpSchema,
    async (data: OTPFormData) => {
      const result = await executeAuthOperation(async () => {
      return await verifyOTP({
        ...data,
        clinicId: clinicId,
      });
      });
      if (!result) {
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

  // âœ… Use unified auth form hook for OTP resend
  const { executeAuthOperation: executeOTPResend } = useAuthForm({
    toastId: TOAST_IDS.AUTH.OTP,
    loadingMessage: "Sending OTP...",
    successMessage: "A new OTP has been sent to your email.",
    errorMessage: "Failed to resend OTP. Please try again.",
    showToast: false,
    onError: (error) => {
      setFormError(error.message);
    },
    onSuccess: () => {
      form.setValue("otp", "");
      form.clearErrors("otp");
    },
  });

  const handleResendOTP = async () => {
    if (countdown > 0) return; // Don't allow during cooldown

    const result = await executeOTPResend(async () => {
      return await requestOTP({
        identifier: email,
        clinicId: clinicId,
      });
    });
    if (!result) {
      return;
    }
    restartCountdown(); // Start cooldown after successful request
  };

  const startCountdownTimer = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const restartCountdown = useCallback(() => {
    setCountdown(RESEND_COOLDOWN_SECONDS);
    startCountdownTimer();
  }, [startCountdownTimer]);

  useEffect(() => {
    startCountdownTimer();
    const intervalId = countdownRef.current;
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [startCountdownTimer]);

  // Redirecting overlay
  if (successPhase === "redirecting") {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg px-4 sm:px-0">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-5">
          <div className="relative flex items-center justify-center">
            <div className="size-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
            </div>
            <Loader2 className="absolute size-20 animate-spin text-green-500/40" />
          </div>
          <div className="text-center gap-y-1">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Successfully signed in!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Redirectingâ€¦</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg px-4 sm:px-0">
      <CardHeader className="px-4 sm:px-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-center">
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
            <div className="size-5 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-red-600 dark:text-red-300">!</span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300">{formError}</p>
          </div>
        )}
        {successPhase === "alert" && (
          <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="size-5 text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">OTP verified!</p>
              <p className="text-xs text-green-600 dark:text-green-400">Redirecting to the next stepâ€¦</p>
            </div>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.onFormSubmit} className="gap-y-6">
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
                  {attemptsRemaining !== null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {attemptsRemaining} attempts remaining
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="gap-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isVerifyingOTP || (otpValue || "").length !== 6 || successPhase !== "none"}
              >
                {isVerifyingOTP ? (
                  <div className="flex items-center justify-center">
                    <div className="size-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2" />
                    Verifying…
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
                disabled={isRequestingOTP || successPhase !== "none" || countdown > 0}
              >
                {isRequestingOTP ? (
                  <div className="flex items-center justify-center">
                    <div className="size-5 border-t-2 border-b-2 border-current rounded-full animate-spin mr-2" />
                    Sending…
                  </div>
                ) : countdown > 0 ? (
                  `Resend in ${countdown}s`
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

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOTPPageContent />
    </Suspense>
  );
}




