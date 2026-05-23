"use client";

import { Suspense, useState, useRef, useEffect, useCallback, useReducer, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { SocialLogin } from "@/components/auth/social-login";
import { OtpCodeInput } from "@/components/auth/otp-code-input";
import { Loader2, Smartphone, Mail, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { showErrorToast } from "@/hooks/utils/use-toast";
import useZodForm from "@/hooks/utils/useZodForm";
import { otpSchema } from "@/lib/schema";
import { AuthResponse, OTPFormData } from "@/types/auth.types";
import { cn } from "@/lib/utils";
import { z } from "zod";
import PhoneInput from "@/components/ui/phone-input";
import { APP_CONFIG } from "@/lib/config/config";

// NOTE: For single-clinic deployment, APP_CONFIG.CLINIC.ID is used as the default clinic.
// This is acceptable for deployments where there is only one clinic.
// If multi-clinic support is needed, clinicId should be resolved from domain/subdomain
// or passed explicitly via query parameters.
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

function loginIdentifierReducer(
  state: LoginIdentifierState,
  action: LoginIdentifierAction
): LoginIdentifierState {
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
    otpMethod: "email",
  });
  const [successPhase, setSuccessPhase] = useState<SuccessPhase>("none");
  const [isRestoringSession, setIsRestoringSession] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
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
    isRequestingOTP,
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
    return () => { cancelled = true; };
  }, [getRedirectPath, isRestoringSession, isGoogleLoggingIn, refreshSession, replace, session?.user, sessionExpired, successPhase]);

  const otpMutation = async (data: z.infer<typeof otpSchema>): Promise<AuthResponse> => {
    setAuthError(null);
    try {
      const result = await verifyOTP({ ...data, clinicId: defaultClinicId } as OTPFormData);
      triggerSuccessFlow();
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to verify OTP";
      const lowerMsg = errorMsg.toLowerCase();
      if (lowerMsg.includes('locked') || lowerMsg.includes('too many')) {
        setAuthError(errorMsg);
      } else if (lowerMsg.includes('user not found') || lowerMsg.includes('not found')) {
        setAuthError("User not found. Please check your details or sign up first.");
        showErrorToast("User not found");
      } else if (lowerMsg.includes('invalid') || lowerMsg.includes('incorrect')) {
        setAuthError("Invalid OTP. Please check and try again.");
      } else if (lowerMsg.includes('expired')) {
        setAuthError("OTP has expired. Please request a new one.");
      } else {
        setAuthError(errorMsg);
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
    if (requestOtpLockRef.current || isRequestingOTP) return;
    requestOtpLockRef.current = true;
    try {
      setAuthError(null);
      await requestOTP({ identifier, clinicId: defaultClinicId });
      setLoginFlow((current) => ({ ...current, showOTPInput: true }));
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Failed to request OTP");
    } finally {
      requestOtpLockRef.current = false;
    }
  };

  const handleVerifyOTP = async (data: z.infer<typeof otpSchema>) => {
    setAuthError(null);
    try {
      await verifyOTP({ ...data, clinicId: defaultClinicId } as OTPFormData);
      triggerSuccessFlow();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to verify OTP";
      const lowerMsg = errorMsg.toLowerCase();
      if (lowerMsg.includes('locked') || lowerMsg.includes('too many')) {
        setAuthError(errorMsg);
      } else if (lowerMsg.includes('user not found') || lowerMsg.includes('not found')) {
        setAuthError("User not found. Please check your details or sign up first.");
        showErrorToast("User not found");
      } else if (lowerMsg.includes('invalid') || lowerMsg.includes('incorrect')) {
        setAuthError("Invalid OTP. Please check and try again.");
      } else if (lowerMsg.includes('expired')) {
        setAuthError("OTP has expired. Please request a new one.");
      } else {
        setAuthError(errorMsg);
      }
    }
  };

  // Success redirect overlay
  if (successPhase === "redirecting") {
    return (
      <div className="w-full max-w-[380px] mx-auto">
        <Card className="shadow-lg border-0 bg-white dark:bg-slate-900 rounded-lg overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="relative">
              <div className="size-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="size-7 text-green-600 dark:text-green-400" />
              </div>
              <Loader2 className="absolute inset-0 m-auto size-18 animate-spin text-green-500/30" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-900 dark:text-white">Signed in!</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Redirecting…</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[380px] mx-auto relative">
      <Card className="relative shadow-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg overflow-hidden">

        <CardHeader className="px-6 pt-2 pb-0">
          {showOTPInput && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-5 h-8 px-2 text-xs text-muted-foreground hover:text-foreground rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => {
                setLoginFlow((current) => ({ ...current, showOTPInput: false }));
                setAuthError(null);
                otpForm.setValue("otp", "");
              }}
            >
              <ArrowLeft className="size-4 mr-1.5" />
              Back
            </Button>
          )}
          <div className="text-center space-y-1">
            <h2 className="text-[22px] font-semibold text-slate-800 dark:text-white tracking-tight">
              {showOTPInput ? "Verify Code" : "Welcome"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              {showOTPInput ? `Code sent to your ${otpMethod}` : "Log in or sign up to continue"}
            </p>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6 pt-0">
          {/* Session expired notice */}
          {sessionExpired && !isRestoringSession && !session?.user && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-sm text-amber-700 dark:text-amber-300 font-medium">
              Session expired. Please sign in again.
            </div>
          )}

          {/* Success alert */}
          {successPhase === "alert" && (
            <div className="mb-4 p-3 rounded-lg bg-green-50/80 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
              <div className="size-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-semibold text-green-700 dark:text-green-300">Authentication successful!</span>
            </div>
          )}

          {/* Social Login */}
          {!showOTPInput && (
            <SocialLogin
              showDivider={true}
              clinicId={defaultClinicId}
              onSuccess={triggerSuccessFlow}
              onError={(error) => setAuthError(error.message)}
            />
          )}

          <Form {...otpForm}>
            <form onSubmit={otpForm.onFormSubmit} className="space-y-3 mt-2">
              {/* Phone/Email Toggle with Premium Exact Styling */}
              {!showOTPInput && (
                <div className="flex gap-2 p-1.5 bg-gray-50 border border-gray-200 dark:border-slate-800 dark:bg-slate-800/50 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginFlow((current) => ({ ...current, otpMethod: "phone" }));
                      otpForm.setValue("identifier", loginIdentifiers.phone);
                      otpForm.clearErrors("identifier");
                    }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-3 p-2 rounded-lg border transition-all duration-300 ease-out",
                      otpMethod === "phone"
                        ? "border-purple-500 bg-purple-50 dark:bg-slate-900 shadow-sm"
                        : "border-transparent bg-transparent hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500",
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center size-8 rounded-full transition-colors",
                      otpMethod === "phone"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                        : "bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-gray-400"
                    )}>
                      <Smartphone className="size-4" />
                    </div>
                    <span className={cn("text-sm font-bold", otpMethod === "phone" ? "text-purple-800 dark:text-purple-300" : "text-gray-500 font-medium")}>Phone</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginFlow((current) => ({ ...current, otpMethod: "email" }));
                      otpForm.setValue("identifier", loginIdentifiers.email);
                      otpForm.clearErrors("identifier");
                    }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-3 p-2 rounded-lg border transition-all duration-300 ease-out",
                      otpMethod === "email"
                        ? "border-blue-500 bg-blue-50 dark:bg-slate-900 shadow-sm"
                        : "border-transparent bg-transparent hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500",
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center size-8 rounded-full transition-colors",
                      otpMethod === "email"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                        : "bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-gray-400"
                    )}>
                      <Mail className="size-4" />
                    </div>
                    <span className={cn("text-sm font-bold", otpMethod === "email" ? "text-blue-800 dark:text-blue-300" : "text-gray-500 font-medium")}>Email</span>
                  </button>
                </div>
              )}

              {/* Identifier Input */}
              <div>
                <FormField
                  control={otpForm.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        {otpMethod === "phone" ? (
                          <div className={cn(
                            "rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 transition-all duration-300 animate-in fade-in zoom-in-95",
                            "focus-within:ring-2 focus-within:ring-offset-1 focus-within:ring-emerald-500/50"
                          )}>
                              <PhoneInput
                              placeholder="Phone Number"
                              defaultCountry="IN"
                              disabled={isFormDisabled || showOTPInput}
                              value={loginIdentifiers.phone}
                              onChange={(value: string) => {
                                dispatchLoginIdentifiers({ type: "set_phone", value });
                                field.onChange(value);
                              }}
                              className="border-none bg-transparent shadow-none focus-within:ring-0 [&_input]:h-[42px] [&_input]:text-sm [&_input]:border-none [&_input]:bg-transparent [&_input]:shadow-none"
                            />
                          </div>
                        ) : (
                          <div className={cn(
                            "rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 transition-all duration-300 animate-in fade-in zoom-in-95",
                            "focus-within:ring-2 focus-within:ring-offset-1 focus-within:ring-emerald-500/50"
                          )}>
                            <Input
                              type="email"
                              placeholder="Email Address"
                              value={loginIdentifiers.email}
                              onChange={(e) => {
                                dispatchLoginIdentifiers({ type: "set_email", value: e.target.value });
                                field.onChange(e.target.value);
                              }}
                              disabled={isFormDisabled || showOTPInput}
                              autoComplete="email"
                              className="h-[42px] text-sm rounded-lg border-none bg-transparent shadow-none px-4 transition-all focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                          </div>
                        )}
                      </FormControl>
                      <FormMessage className="text-xs ml-1 animate-in fade-in slide-in-from-top-1 duration-200" />
                    </FormItem>
                  )}
                />
              </div>

              {/* OTP Input */}
              {showOTPInput && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                  <FormField
                    control={otpForm.control}
                    name="otp"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex justify-center">
                            <OtpCodeInput
                              value={field.value}
                              onChange={(value) => {
                                setAuthError(null);
                                field.onChange(value);
                                if (value.length === 6) {
                                  otpForm.handleSubmit(handleVerifyOTP)();
                                }
                              }}
                              disabled={isFormDisabled}
                              invalid={!!fieldState.error || !!authError}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-center animate-in fade-in slide-in-from-top-1 duration-200" />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Error message above button */}
              {authError && (
                <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-600 dark:text-red-400 font-semibold animate-in fade-in slide-in-from-top-2 duration-300">
                  {authError}
                </div>
              )}

              {/* Submit Button */}
              {!showOTPInput ? (
                <Button
                  type="button"
                  className="w-full h-11 text-[15px] font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all duration-300 active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-md group"
                  onClick={() => {
                    const id = otpForm.getValues("identifier");
                    if (!id) {
                      otpForm.setError("identifier", { message: "Please enter your email or phone" });
                      return;
                    }
                    handleRequestOTP(id);
                  }}
                  disabled={isFormDisabled || isRequestingOTP || requestOtpLockRef.current}
                >
                  {isRequestingOTP ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Sending Code…
                    </>
                  ) : (
                    <span className="flex items-center">
                      Request OTP
                      <ArrowRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  )}
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="w-full h-11 text-[15px] font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all duration-300 active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-md"
                  disabled={isFormDisabled || isVerifyingOTP}
                >
                  {isVerifyingOTP ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Verify & Sign In"
                  )}
                </Button>
              )}

              {/* Remember Me */}
              {!showOTPInput && (
                <FormField
                  control={otpForm.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 gap-y-0 mt-1 pl-1">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isFormDisabled}
                          className="size-[18px] rounded-full border-gray-300 text-emerald-600 focus:ring-emerald-600 dark:border-slate-600 transition-all data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        />
                      </FormControl>
                      <label htmlFor="rememberMe" className="text-[13px] font-medium text-gray-500 cursor-pointer select-none hover:text-gray-800 transition-colors ml-1">
                        Remember me for 30 days
                      </label>
                    </FormItem>
                  )}
                />
              )}
            </form>
          </Form>
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-800">
            <p className="text-[13px] text-center text-gray-500 font-medium">
              New user? <span className="text-emerald-600 dark:text-emerald-400 font-semibold">We'll create an account for you.</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

