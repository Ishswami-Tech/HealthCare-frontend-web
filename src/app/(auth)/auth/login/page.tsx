"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { showErrorToast } from "@/hooks/utils/use-toast";
import useZodForm from "@/hooks/utils/useZodForm";
import { otpSchema } from "@/lib/schema";
import { APP_CONFIG } from "@/lib/config/config";
import type { AuthResponse, OTPFormData } from "@/types/auth.types";
import { getDashboardByRole, ROUTES } from "@/lib/config/routes";
import { z } from "zod";
import { LoginAuthCard } from "./_components/LoginAuthCard";
import { LoginSuccessRedirectCard } from "./_components/LoginSuccessRedirectCard";

type OtpMethod = "email" | "phone";
type SuccessPhase = "none" | "alert" | "redirecting";

function LoginPageContent() {
  const { replace } = useRouter();
  const searchParams = useSearchParams();
  const getSearchParam = useMemo(
    () => searchParams.get.bind(searchParams),
    [searchParams],
  );
  const sessionExpired = getSearchParam("reason") === "session-expired";
  const defaultClinicId = APP_CONFIG.CLINIC.ID;

  const [loginFlow, setLoginFlow] = useState<{
    showOTPInput: boolean;
    otpMethod: OtpMethod;
  }>({
    showOTPInput: false,
    otpMethod: "phone",
  });
  const [successPhase, setSuccessPhase] = useState<SuccessPhase>("none");
  const [isRestoringSession, setIsRestoringSession] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const requestOtpLockRef = useRef(false);
  const successRedirectTimerRef = useRef<number | null>(null);
  const identifierCacheRef = useRef({ email: "", phone: "" });

  const { showOTPInput, otpMethod } = loginFlow;

  const {
    requestOTP,
    verifyOTP,
    isVerifyingOTP,
    isGoogleLoggingIn,
    session,
    refreshSession,
  } = useAuth();

  // Reset state when user is not authenticated (e.g., after logout)
  // Use a ref to avoid flickering on mobile when session briefly becomes null during re-renders
  const prevSessionRef = useRef(session?.user);
  useEffect(() => {
    // Only reset if session was previously set and is now gone (actual logout)
    // Don't reset on initial mount or transient null states
    if (prevSessionRef.current && !session?.user && !isRestoringSession) {
      setLoginFlow({ showOTPInput: false, otpMethod: "phone" });
      setSuccessPhase("none");
      setAuthError(null);
      setIsSendingOtp(false);
      requestOtpLockRef.current = false;
    }
    prevSessionRef.current = session?.user;
  }, [session?.user, isRestoringSession]);

  const isFormDisabled =
    isGoogleLoggingIn || isSendingOtp || isVerifyingOTP || successPhase !== "none";

  const triggerSuccessFlow = useCallback(() => {
    setAuthError(null);
    setSuccessPhase("alert");
    if (successRedirectTimerRef.current) {
      window.clearTimeout(successRedirectTimerRef.current);
    }
    successRedirectTimerRef.current = window.setTimeout(
      () => setSuccessPhase("redirecting"),
      1500,
    );
  }, []);

  useEffect(() => {
    return () => {
      if (successRedirectTimerRef.current) {
        window.clearTimeout(successRedirectTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      !sessionExpired ||
      session?.user ||
      isRestoringSession ||
      isGoogleLoggingIn ||
      successPhase !== "none"
    ) {
      return;
    }

    let cancelled = false;
    const restoreSession = async () => {
      setIsRestoringSession(true);
      try {
        // Attempt to refresh the session from the server
        const refreshedSession = await refreshSession(true);
        if (cancelled) return;

        if (refreshedSession) {
          // Session restored successfully - the useAuth hook will handle the redirect
          // based on the new session state
        } else {
          // Session couldn't be restored - clear error params and show login
          // The session_expired param will be cleared by the login page on next render
        }
      } finally {
        if (!cancelled) {
          setIsRestoringSession(false);
        }
      }
    };

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [
    isRestoringSession,
    isGoogleLoggingIn,
    refreshSession,
    session?.user,
    sessionExpired,
    successPhase,
  ]);

  const otpMutation = async (
    data: z.infer<typeof otpSchema>,
  ): Promise<AuthResponse> => {
    setAuthError(null);
    try {
      const result = await verifyOTP({
        ...data,
        clinicId: defaultClinicId,
      } as OTPFormData);
      triggerSuccessFlow();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        const errorMsg = error.message;
        const lowerMsg = errorMsg.toLowerCase();

        // Use specific error code matching - order matters (most specific first)
        if (lowerMsg.includes("auth_otp_invalid")) {
          setAuthError("Invalid OTP. Please check and try again.");
        } else if (
          lowerMsg.includes("otp_not_found") ||
          lowerMsg.includes("otp_expired") ||
          lowerMsg.includes("invalid_verification_code")
        ) {
          setAuthError("OTP not found or expired. Please request a new one.");
        } else if (
          lowerMsg.includes("maximum otp attempts exceeded") ||
          lowerMsg.includes("too many otp requests")
        ) {
          setAuthError(
            "Maximum OTP attempts exceeded. Please try again in 1 hour.",
          );
        } else if (lowerMsg.includes("wait") || lowerMsg.includes("cooldown")) {
          // Extract minutes from message like "Please wait 5 minute(s)"
          const minuteMatch = errorMsg.match(/wait\s+(\d+)\s+minute/i);
          const minutes = minuteMatch ? minuteMatch[1] : "";
          setAuthError(
            minutes
              ? `Please wait ${minutes} minute(s) before requesting another OTP.`
              : errorMsg,
          );
        } else if (
          lowerMsg.includes("locked") ||
          lowerMsg.includes("too many attempts")
        ) {
          setAuthError(errorMsg);
        } else if (lowerMsg.includes("user_already_exists")) {
          setAuthError("User already exists. Please log in instead.");
          showErrorToast("User already exists");
        } else if (lowerMsg.includes("user_not_found")) {
          setAuthError(
            "User not found. Please check your details or sign up first.",
          );
          showErrorToast("User not found");
        } else if (
          lowerMsg.includes("clinic_not_found") ||
          lowerMsg.includes("clinic_id")
        ) {
          setAuthError("Clinic not found. Please check your clinic selection.");
        } else if (
          lowerMsg.includes("expired") ||
          lowerMsg.includes("session")
        ) {
          setAuthError("OTP has expired. Please request a new one.");
        } else {
          // Show the actual error message for unknown errors
          setAuthError(errorMsg);
        }
      } else {
        setAuthError("Failed to verify OTP");
      }
      throw error;
    }
  };

  const otpFormDefaults = useMemo(
    () => ({
      identifier: "",
      otp: "",
      rememberMe: false,
    }),
    [],
  ); // Empty deps - only set initial defaults once, form.setValue handles updates

  const otpForm = useZodForm(otpSchema, otpMutation, otpFormDefaults);

  const handleRequestOTP = async (identifier: string) => {
    if (requestOtpLockRef.current || isSendingOtp) return;
    requestOtpLockRef.current = true;
    setIsSendingOtp(true);
    try {
      setAuthError(null);
      const result = await requestOTP({
        identifier,
        clinicId: defaultClinicId,
      });
      if (!result.success) {
        // Display the backend error message (e.g., rate limit, validation errors)
        setAuthError(result.message || "Failed to request OTP");
        return;
      }
      // Request succeeded - show OTP input
      setLoginFlow((current) => ({ ...current, showOTPInput: true }));
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Failed to request OTP",
      );
    } finally {
      setIsSendingOtp(false);
      requestOtpLockRef.current = false;
    }
  };

  if (successPhase === "redirecting") {
    return <LoginSuccessRedirectCard />;
  }

  return (
    <LoginAuthCard
      uiState={{
        sessionExpired,
        isRestoringSession,
        showOTPInput,
        isFormDisabled,
        isRequestingOTP: isSendingOtp,
        isVerifyingOTP,
      }}
      successPhase={successPhase}
      otpMethod={otpMethod}
      authError={authError}
      otpForm={otpForm}
      defaultClinicId={defaultClinicId}
      isSocialLoading={isFormDisabled}
      getCachedIdentifier={(method) =>
        method === "phone"
          ? identifierCacheRef.current.phone
          : identifierCacheRef.current.email
      }
      onBack={() => {
        setLoginFlow((current) => ({ ...current, showOTPInput: false }));
        setAuthError(null);
        otpForm.setValue("otp", "");
      }}
      onSwitchOtpMethod={(method) =>
        setLoginFlow((current) => ({ ...current, otpMethod: method }))
      }
      onRequestOTP={handleRequestOTP}
      onOtpChange={(value) => {
        setAuthError(null);
      }}
      onSocialSuccess={triggerSuccessFlow}
      onSocialError={(error) => setAuthError(error.message)}
      onPhoneChange={(value) => {
        identifierCacheRef.current.phone = value;
      }}
      onEmailChange={(value) => {
        identifierCacheRef.current.email = value;
      }}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
