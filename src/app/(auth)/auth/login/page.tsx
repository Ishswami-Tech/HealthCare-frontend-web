"use client";

import { Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { showErrorToast } from "@/hooks/utils/use-toast";
import useZodForm from "@/hooks/utils/useZodForm";
import { otpSchema } from "@/lib/schema";
import { APP_CONFIG } from "@/lib/config/config";
import type { AuthResponse, OTPFormData } from "@/types/auth.types";
import { z } from "zod";
import { LoginAuthCard } from "./_components/LoginAuthCard";
import { LoginSuccessRedirectCard } from "./_components/LoginSuccessRedirectCard";

type OtpMethod = "email" | "phone";
type SuccessPhase = "none" | "alert" | "redirecting";

type LoginIdentifierState = {
  email: string;
  phone: string;
};

type LoginIdentifierAction =
  | { type: "set_email"; value: string }
  | { type: "set_phone"; value: string };

const initialLoginIdentifierState: LoginIdentifierState = {
  email: "",
  phone: "",
};

function loginIdentifierReducer(state: LoginIdentifierState, action: LoginIdentifierAction): LoginIdentifierState {
  switch (action.type) {
    case "set_email":
      return { ...state, email: action.value };
    case "set_phone":
      return { ...state, phone: action.value };
    default:
      return state;
  }
}

function LoginPageContent() {
  const { replace } = useRouter();
  const searchParams = useSearchParams();
  const getSearchParam = useMemo(() => searchParams.get.bind(searchParams), [searchParams]);
  const sessionExpired = getSearchParam("reason") === "session-expired";
  const defaultClinicId = APP_CONFIG.CLINIC.ID;

  const [loginFlow, setLoginFlow] = useState<{ showOTPInput: boolean; otpMethod: OtpMethod }>({
    showOTPInput: false,
    otpMethod: "phone",
  });
  const [successPhase, setSuccessPhase] = useState<SuccessPhase>("none");
  const [isRestoringSession, setIsRestoringSession] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const requestOtpLockRef = useRef(false);

  const { showOTPInput, otpMethod } = loginFlow;

  const [loginIdentifiers, dispatchLoginIdentifiers] = useReducer(
    loginIdentifierReducer,
    initialLoginIdentifierState
  );

  const {
    requestOTP,
    verifyOTP,
    isVerifyingOTP,
    isGoogleLoggingIn,
    session,
    refreshSession,
    getRedirectPath,
  } = useAuth();

  const isFormDisabled = isGoogleLoggingIn || successPhase !== "none";

  const triggerSuccessFlow = useCallback(() => {
    setAuthError(null);
    setSuccessPhase("alert");
    setTimeout(() => setSuccessPhase("redirecting"), 1500);
  }, []);

  useEffect(() => {
    if (!sessionExpired || session?.user || isRestoringSession || isGoogleLoggingIn || successPhase !== "none") {
      return;
    }

    let cancelled = false;
    const restoreSession = async () => {
      setIsRestoringSession(true);
      const restoredSession = await refreshSession(true);
      if (cancelled) return;
      if (restoredSession?.user) {
        replace(getRedirectPath(restoredSession.user));
        return;
      }
      setIsRestoringSession(false);
    };

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [getRedirectPath, isRestoringSession, isGoogleLoggingIn, refreshSession, replace, session?.user, sessionExpired, successPhase]);

  const otpMutation = async (data: z.infer<typeof otpSchema>): Promise<AuthResponse> => {
    setAuthError(null);
    try {
      const result = await verifyOTP({ ...data, clinicId: defaultClinicId } as OTPFormData);
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
        } else if (lowerMsg.includes("locked") || lowerMsg.includes("too many attempts")) {
          setAuthError(errorMsg);
        } else if (lowerMsg.includes("user_already_exists")) {
          setAuthError("User already exists. Please log in instead.");
          showErrorToast("User already exists");
        } else if (lowerMsg.includes("user_not_found")) {
          setAuthError("User not found. Please check your details or sign up first.");
          showErrorToast("User not found");
        } else if (lowerMsg.includes("clinic_not_found") || lowerMsg.includes("clinic_id")) {
          setAuthError("Clinic not found. Please check your clinic selection.");
        } else if (lowerMsg.includes("expired") || lowerMsg.includes("session")) {
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

  const otpForm = useZodForm(otpSchema, otpMutation, {
    identifier: otpMethod === "phone" ? loginIdentifiers.phone : loginIdentifiers.email,
    otp: "",
    rememberMe: false,
  });

  const handleRequestOTP = async (identifier: string) => {
    if (requestOtpLockRef.current || isSendingOtp) return;
    requestOtpLockRef.current = true;
    setIsSendingOtp(true);
    try {
      setAuthError(null);
      const result = await requestOTP({ identifier, clinicId: defaultClinicId });
      if (!result.success) {
        throw new Error(result.message || 'Failed to request OTP');
      }
      setLoginFlow((current) => ({ ...current, showOTPInput: true }));
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Failed to request OTP");
    } finally {
      requestOtpLockRef.current = false;
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOTP = async (data: z.infer<typeof otpSchema>) => {
    setAuthError(null);
    try {
      await verifyOTP({ ...data, clinicId: defaultClinicId } as OTPFormData);
      triggerSuccessFlow();
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
        } else if (lowerMsg.includes("locked") || lowerMsg.includes("too many attempts")) {
          setAuthError(errorMsg);
        } else if (lowerMsg.includes("user_already_exists")) {
          setAuthError("User already exists. Please log in instead.");
          showErrorToast("User already exists");
        } else if (lowerMsg.includes("user_not_found")) {
          setAuthError("User not found. Please check your details or sign up first.");
          showErrorToast("User not found");
        } else if (lowerMsg.includes("clinic_not_found") || lowerMsg.includes("clinic_id")) {
          setAuthError("Clinic not found. Please check your clinic selection.");
        } else if (lowerMsg.includes("expired") || lowerMsg.includes("session")) {
          setAuthError("OTP has expired. Please request a new one.");
        } else {
          // Show the actual error message for unknown errors
          setAuthError(errorMsg);
        }
      } else {
        setAuthError("Failed to verify OTP");
      }
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
        loginIdentifiers={loginIdentifiers}
        otpForm={otpForm}
      defaultClinicId={defaultClinicId}
      onBack={() => {
        setLoginFlow((current) => ({ ...current, showOTPInput: false }));
        setAuthError(null);
        otpForm.setValue("otp", "");
      }}
      onSwitchOtpMethod={(method) => setLoginFlow((current) => ({ ...current, otpMethod: method }))}
      onRequestOTP={handleRequestOTP}
      onVerifyOTP={handleVerifyOTP}
      onOtpChange={(value) => {
        setAuthError(null);
        if (value.length === 6) {
          otpForm.handleSubmit(handleVerifyOTP)();
        }
      }}
      onSocialSuccess={triggerSuccessFlow}
      onSocialError={(error) => setAuthError(error.message)}
      onPhoneChange={(value) => dispatchLoginIdentifiers({ type: "set_phone", value })}
      onEmailChange={(value) => dispatchLoginIdentifiers({ type: "set_email", value })}
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
