"use client";

import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AuthBrandLogo } from "@/components/auth/AuthLeftPanel";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import PhoneInput from "@/components/ui/phone-input";
import { SocialLogin } from "@/components/auth/social-login";
import { OtpCodeInput } from "@/components/auth/otp-code-input";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Smartphone,
  Mail,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Phone,
} from "lucide-react";

type OtpMethod = "email" | "phone";

interface LoginAuthCardProps {
  uiState: {
    sessionExpired: boolean;
    isRestoringSession: boolean;
    showOTPInput: boolean;
    isFormDisabled: boolean;
    isRequestingOTP: boolean;
    isVerifyingOTP: boolean;
  };
  successPhase: "none" | "alert" | "redirecting";
  otpMethod: OtpMethod;
  authError: string | null;
  otpForm: any;
  defaultClinicId: string;
  getCachedIdentifier: (method: OtpMethod) => string;
  onBack: () => void;
  onSwitchOtpMethod: (method: OtpMethod) => void;
  onRequestOTP: (identifier: string) => void;
  onOtpChange: (value: string) => void;
  onSocialSuccess: () => void;
  onSocialError: (error: Error) => void;
  isSocialLoading?: boolean;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-4 shrink-0 fill-current", className)}
      viewBox="0 0 24 24"
    >
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export function LoginAuthCard({
  uiState,
  successPhase,
  otpMethod,
  authError,
  otpForm,
  defaultClinicId,
  getCachedIdentifier,
  onBack,
  onSwitchOtpMethod,
  onRequestOTP,
  onOtpChange,
  onSocialSuccess,
  onSocialError,
  isSocialLoading,
  onPhoneChange,
  onEmailChange,
}: LoginAuthCardProps) {
  const {
    sessionExpired,
    isRestoringSession,
    showOTPInput,
    isFormDisabled,
    isRequestingOTP,
    isVerifyingOTP,
  } = uiState;
  const lastAutoSubmittedOtpRef = useRef<string>("");
  const otpSubmitLockRef = useRef(false);
  const otpValue = typeof otpForm.watch === "function" ? (otpForm.watch("otp") as string) : "";

  const submitOtpOnce = useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault();

      if (!showOTPInput || isFormDisabled || isVerifyingOTP || otpSubmitLockRef.current) {
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
        await otpForm.onFormSubmit();
      } finally {
        otpSubmitLockRef.current = false;
      }
    },
    [isFormDisabled, isVerifyingOTP, otpForm, otpValue, showOTPInput],
  );

  useEffect(() => {
    if (!showOTPInput || isFormDisabled || isVerifyingOTP) {
      return;
    }

    if (otpValue.length !== 6) {
      if (lastAutoSubmittedOtpRef.current !== otpValue) {
        lastAutoSubmittedOtpRef.current = "";
      }
      return;
    }

    void submitOtpOnce();
  }, [isFormDisabled, isVerifyingOTP, otpValue, showOTPInput, submitOtpOnce]);

  return (
    <div className="relative mx-auto w-full max-w-[588px]">
      {/* Dynamic Background Glow */}
      <Card className="relative overflow-hidden rounded-[28px] border border-[#e0ad54] bg-[#fffcf5]/86 py-0 shadow-[0_18px_45px_rgba(112,73,12,.14)] backdrop-blur-xl transition-colors lg:rounded-[26px] lg:bg-[#fffcf5]/94 lg:py-6 dark:border-slate-800 dark:bg-slate-900/88 dark:shadow-[0_18px_45px_rgba(0,0,0,.5)]">

        <CardHeader className={cn("px-8 pb-3 pt-6", !showOTPInput && "hidden lg:block")}>
          {showOTPInput && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-7 h-8 rounded-full px-2.5 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
              onClick={onBack}
            >
              <ArrowLeft className="mr-1 size-3.5" />
              Back
            </Button>
          )}

          <div className="space-y-1.5 text-center">
            {/* Brand Shield Icon */}
            <div className="mx-auto mb-1 flex size-[68px] items-center justify-center rounded-full border border-[#e7bd70] bg-[#fffaf0]/90 p-1 shadow-xs dark:border-emerald-800/50 dark:bg-emerald-950/80">
              <AuthBrandLogo className="size-[56px]" imgClassName="size-full rounded-full" />
            </div>

            <h2 className="font-serif text-[34px] font-bold tracking-tight text-[#075735] dark:text-emerald-400">
              {showOTPInput ? "Verify Code" : "Welcome"}
            </h2>
            <p className="mx-auto max-w-[310px] text-[15px] leading-relaxed text-[#263248] dark:text-slate-300">
              {showOTPInput ? (
                otpMethod === "phone" ? (
                  <span className="inline-flex items-center justify-center flex-wrap gap-1">
                    <span>Code sent via</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-100/80 dark:text-emerald-300 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded-md border border-emerald-300/80 dark:border-emerald-700/60 shadow-2xs">
                      <WhatsAppIcon className="size-3 text-emerald-600 dark:text-emerald-400" />
                      WhatsApp
                    </span>
                    <span>to your phone</span>
                  </span>
                ) : (
                  `Code sent to your ${otpMethod}`
                )
              ) : (
                <>Sign in to manage your appointments<br />and access your health records.</>
              )}
            </p>
          </div>
        </CardHeader>

        <CardContent className="px-[18px] pb-2 pt-3.5 sm:px-6 lg:px-8 lg:pb-7 lg:pt-3">
          {sessionExpired && !isRestoringSession && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
              Session expired. Please sign in again.
            </div>
          )}

          {/* Success Notification Alert */}
          {successPhase === "alert" && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3 animate-in fade-in zoom-in-95 duration-300 dark:border-emerald-800/60 dark:bg-emerald-950/40">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Authentication successful! Redirecting…
              </span>
            </div>
          )}

          {!showOTPInput && (
            <SocialLogin
              showDivider={true}
              className="gap-1.5 lg:gap-3 [&_button]:h-10 lg:[&_button]:h-[50px]"
              clinicId={defaultClinicId}
              isLoading={isSocialLoading}
              onSuccess={onSocialSuccess}
              onError={onSocialError}
            />
          )}

          <Form {...otpForm}>
            <form onSubmit={submitOtpOnce} className="mt-0 space-y-2.5 lg:mt-2 lg:space-y-3.5">
              {!showOTPInput && (
                <div className="grid grid-cols-2 gap-3 dark:border-slate-800 dark:bg-slate-950/60 transition-colors">
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchOtpMethod("phone");
                      otpForm.setValue("identifier", getCachedIdentifier("phone"));
                      otpForm.clearErrors("identifier");
                    }}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all duration-200 lg:py-3",
                      otpMethod === "phone"
                        ? "border-[#0c6b45] bg-[#fffdf8] text-[#075735] shadow-sm dark:border-emerald-600/70 dark:bg-emerald-950/90 dark:text-emerald-300 dark:shadow-sm"
                        : "border-[#eeddbd] bg-[#fbf1dc] text-slate-600 hover:text-slate-800 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400 dark:hover:text-slate-200",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-5 items-center justify-center rounded-md transition-colors",
                        otpMethod === "phone"
                          ? "bg-[#edf5e8] text-[#087241] dark:bg-emerald-900/60 dark:text-emerald-300"
                          : "bg-transparent text-slate-400 dark:text-slate-500",
                      )}
                    >
                      <Smartphone className="size-3.5" />
                    </div>
                    <span>Phone</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchOtpMethod("email");
                      otpForm.setValue("identifier", getCachedIdentifier("email"));
                      otpForm.clearErrors("identifier");
                    }}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all duration-200 lg:py-3",
                      otpMethod === "email"
                        ? "border-[#0c6b45] bg-[#fffdf8] text-[#075735] shadow-sm dark:border-emerald-600/70 dark:bg-emerald-950/90 dark:text-emerald-300 dark:shadow-sm"
                        : "border-[#eeddbd] bg-[#fbf1dc] text-slate-600 hover:text-slate-800 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400 dark:hover:text-slate-200",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-5 items-center justify-center rounded-md transition-colors",
                        otpMethod === "email"
                          ? "bg-[#edf5e8] text-[#087241] dark:bg-emerald-900/60 dark:text-emerald-300"
                          : "bg-transparent text-slate-400 dark:text-slate-500",
                      )}
                    >
                      <Mail className="size-3.5" />
                    </div>
                    <span>Email</span>
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <FormField
                  control={otpForm.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormControl>
                        {otpMethod === "phone" ? (
                          <div
                            className={cn(
                              "overflow-hidden rounded-xl border border-[#eadfc9] bg-white/90 p-0.5 transition-all duration-200",
                              "dark:border-slate-700/80 dark:bg-slate-950/60",
                              "focus-within:border-[#08743e] focus-within:ring-2 focus-within:ring-[#08743e]/20 focus-within:bg-white dark:focus-within:bg-slate-900 dark:focus-within:border-emerald-500 dark:focus-within:ring-emerald-500/30",
                              "shadow-2xs",
                            )}
                          >
                            <PhoneInput
                              placeholder="Enter mobile number"
                              defaultCountry="IN"
                              disabled={isFormDisabled || showOTPInput}
                              value={field.value}
                              authStyle
                              onChange={(value: string) => {
                                onPhoneChange(value);
                                field.onChange(value);
                              }}
                              className="border-none bg-transparent shadow-none focus-within:ring-0 max-lg:[&_button]:h-10 max-lg:[&_.PhoneInputInput]:h-10 [&_input]:border-none [&_input]:bg-transparent [&_input]:text-sm [&_input]:shadow-none [&_input]:text-slate-900 dark:[&_input]:text-slate-100"
                            />
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "overflow-hidden rounded-xl border border-[#eadfc9] bg-white/90 transition-all duration-200",
                              "dark:border-slate-700/80 dark:bg-slate-950/60",
                              "focus-within:border-[#08743e] focus-within:ring-2 focus-within:ring-[#08743e]/20 focus-within:bg-white dark:focus-within:bg-slate-900 dark:focus-within:border-emerald-500 dark:focus-within:ring-emerald-500/30",
                              "shadow-2xs",
                            )}
                          >
                            <Input
                              type="email"
                              placeholder="name@example.com"
                              value={field.value}
                              onChange={(e) => {
                                onEmailChange(e.target.value);
                                field.onChange(e.target.value);
                              }}
                              disabled={isFormDisabled || showOTPInput}
                              autoComplete="email"
                              className="h-11 rounded-xl border-none bg-transparent px-3.5 text-sm text-slate-900 dark:text-slate-100 shadow-none transition-all focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                          </div>
                        )}
                      </FormControl>
                      <FormMessage className="ml-1 animate-in fade-in slide-in-from-top-1 text-xs duration-200" />
                    </FormItem>
                  )}
                />

                {otpMethod === "phone" && !showOTPInput ? (
                  <div className="flex items-center gap-3 rounded-xl border border-transparent bg-[#f3f3df] p-0.5 text-xs text-[#075735] lg:p-3 dark:border-emerald-900/40 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#12b949] text-white">
                      <WhatsAppIcon className="size-3" />
                    </div>
                    <p className="text-[11.5px] font-medium leading-snug">
                      We will send a WhatsApp message with your login code.
                    </p>
                  </div>
                ) : null}
              </div>

              {showOTPInput && (
                <div className="animate-in fade-in zoom-in-95 duration-300 space-y-3">
                  <FormField
                    control={otpForm.control}
                    name="otp"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex justify-center py-1">
                            <OtpCodeInput
                              value={field.value}
                              onChange={(value) => {
                                field.onChange(value);
                                onOtpChange(value);
                              }}
                              disabled={isFormDisabled}
                              invalid={
                                !!fieldState.error ||
                                !!otpForm.formState?.errors?.otp
                              }
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="animate-in fade-in slide-in-from-top-1 text-center text-xs duration-200" />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span>Didn&apos;t receive a code?</span>
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto px-0 text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                      onClick={() => {
                        const id = otpForm.getValues("identifier");
                        if (!id || isRequestingOTP) {
                          return;
                        }
                        onRequestOTP(id);
                      }}
                      disabled={isFormDisabled || isRequestingOTP}
                    >
                      {isRequestingOTP
                        ? "Sending WhatsApp code..."
                        : "Resend OTP"}
                    </Button>
                  </div>
                </div>
              )}

              {authError && (
                <div className="animate-in fade-in slide-in-from-top-2 rounded-xl border border-red-200 bg-red-50/90 p-3 text-xs font-semibold text-red-600 duration-300 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                  {authError}
                </div>
              )}

              {!showOTPInput ? (
                <Button
                  type="button"
                  className="group relative -mt-2 h-10 w-full overflow-hidden rounded-xl bg-[#075735] text-[16px] font-semibold text-white shadow-md shadow-[#0d7040]/20 transition-all hover:bg-[#06452b] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 lg:mt-0 lg:h-[52px] lg:text-[18px] dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-emerald-950/50"
                  onClick={() => {
                    const id = otpForm.getValues("identifier");
                    if (!id) {
                      otpForm.setError("identifier", {
                        message: "Please enter your email or phone",
                      });
                      return;
                    }
                    onRequestOTP(id);
                  }}
                  disabled={isFormDisabled || isRequestingOTP}
                >
                  {isRequestingOTP ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Sending WhatsApp code...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {otpMethod === "phone" && <WhatsAppIcon className="size-4 text-emerald-100" />}
                      <span>{otpMethod === "phone" ? "Send OTP" : "Send Email OTP"}</span>
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  )}
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="h-11.5 w-full rounded-xl bg-[#08743e] hover:bg-[#075f35] text-[14.5px] font-semibold text-white shadow-md shadow-[#0d7040]/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-emerald-950/50"
                  disabled={isFormDisabled || isVerifyingOTP}
                >
                  {isVerifyingOTP ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Verifying…
                    </span>
                  ) : (
                    "Verify & Sign In"
                  )}
                </Button>
              )}

            </form>
          </Form>

          <div className="mt-3 border-t border-slate-200 pt-3 text-center lg:mt-4.5 lg:pt-4 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              New user?{" "}
              <span className="font-semibold text-[#08743e] dark:text-emerald-400">
                We&apos;ll create an account for you
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Helpline Contact Capsule */}
      <div className="mt-4 text-center">
        <a
          href="tel:+917218378311"
          className="inline-flex items-center gap-2 rounded-full border border-[#ead8b5] bg-[#fffcf5]/95 px-5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-[#d49a35] hover:text-[#075735] dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-300"
        >
          <div className="flex size-4.5 items-center justify-center rounded-full bg-amber-50 text-[#d38700] dark:bg-emerald-950 dark:text-emerald-400">
            <Phone className="size-2.5" />
          </div>
          <span>Need help?&nbsp; Call us</span>
          <span className="font-bold text-slate-900 dark:text-emerald-300">+91 7218378311</span>
        </a>
      </div>
    </div>
  );
}
