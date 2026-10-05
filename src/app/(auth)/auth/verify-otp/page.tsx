"use client";

import { Suspense, useEffect, useCallback, useRef, useMemo, useReducer } from "react";
import { useRouter as useRouterAlias, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { otpSchema } from "@/lib/schema";
import type { OtpVerifyFormData as OTPFormData } from "@/types/auth.types";
import useZodForm from "@/hooks/utils/useZodForm";
import { ROUTES } from "@/lib/config/routes";
import { AuthSuccessPanel } from "@/components/auth/AuthFrame";
import { APP_CONFIG } from "@/lib/config/config";
import { VerifyOtpView } from "./_components/VerifyOtpView";

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
  const defaultClinicId = APP_CONFIG.CLINIC.ID;
  // Read clinicId from query param first, then fall back to config
  const queryClinicId = getSearchParam("clinicId");
  const clinicId = queryClinicId || defaultClinicId;
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
  const isPhoneFlow = email.length > 0 && !email.includes("@");
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastAutoSubmittedOtpRef = useRef<string>("");
  const otpSubmitLockRef = useRef(false);
  const toastRedirectTimerRef = useRef<number | null>(null);

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
    // Skip the long "alert" hold — go straight to redirect UI.
    setSuccessPhase("redirecting");
  }, []);

  useEffect(() => {
    return () => {
      if (toastRedirectTimerRef.current) {
        window.clearTimeout(toastRedirectTimerRef.current);
      }
    };
  }, []);

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
      const result = await verifyOTP({
        ...data,
        clinicId,
      });
      if (!result) {
        return;
      }
      // Trigger success flow to show toast/redirect UI
      triggerSuccessFlow();

      // Use the result directly to determine redirect
      // This ensures we use the server response, not stale store state
      const redirectUrl = result?.redirectUrl;
      if (!redirectUrl || redirectUrl.includes("/auth/")) {
        throw new Error("Backend redirectUrl missing or invalid");
      }
      // Wait a bit to let the toast display then redirect
      if (toastRedirectTimerRef.current) {
        window.clearTimeout(toastRedirectTimerRef.current);
      }
      toastRedirectTimerRef.current = window.setTimeout(() => push(redirectUrl), 100);
    },
    {
      identifier: email,
      otp: "",
    }
  );
  const otpValue = form.watch("otp");

  const submitOtpOnce = useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault();

      if (successPhase !== "none" || isVerifyingOTP || otpSubmitLockRef.current) {
        return;
      }

      const normalizedOtp = (otpValue || "").trim();
      if (normalizedOtp.length !== 6) {
        return;
      }

      if (lastAutoSubmittedOtpRef.current === normalizedOtp) {
        return;
      }

      lastAutoSubmittedOtpRef.current = normalizedOtp;
      otpSubmitLockRef.current = true;
      try {
        await form.onFormSubmit();
      } finally {
        otpSubmitLockRef.current = false;
      }
    },
    [form, isVerifyingOTP, otpValue, successPhase],
  );

  useEffect(() => {
    if (successPhase !== "none" || isVerifyingOTP) {
      return;
    }

    if (otpValue.length !== 6) {
      if (lastAutoSubmittedOtpRef.current !== otpValue) {
        lastAutoSubmittedOtpRef.current = "";
      }
      return;
    }

    void submitOtpOnce();
  }, [isVerifyingOTP, otpValue, successPhase, submitOtpOnce]);

  const handleResendOTP = async () => {
    if (countdown > 0) return; // Don't allow during cooldown

    const result = await requestOTP({
      identifier: email,
      clinicId,
    });
    if (!result.success) {
      setFormError(result.message || "Failed to resend OTP. Please try again.");
      return;
    }
    setFormError(null);
    form.setValue("otp", "");
    form.clearErrors("otp");
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
    return <AuthSuccessPanel message="Taking you to the next step." />;
  }

  return (
    <VerifyOtpView
      form={form}
      onSubmit={submitOtpOnce}
      email={email}
      isPhoneFlow={isPhoneFlow}
      otpValue={otpValue}
      formError={formError}
      attemptsRemaining={attemptsRemaining}
      successPhase={successPhase}
      countdown={countdown}
      isVerifyingOTP={isVerifyingOTP}
      isRequestingOTP={isRequestingOTP}
      onOtpInput={() => setFormError(null)}
      onResend={handleResendOTP}
    />
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOTPPageContent />
    </Suspense>
  );
}
