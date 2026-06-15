"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
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

  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      <Card className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="px-6 pb-0 pt-2">
          {showOTPInput && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-5 h-8 rounded-full px-2 text-xs text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800"
              onClick={onBack}
            >
              <ArrowLeft className="mr-1.5 size-4" />
              Back
            </Button>
          )}
          <div className="space-y-1 text-center">
            <h2 className="text-[22px] font-semibold tracking-tight text-slate-800 dark:text-white">
              {showOTPInput ? "Verify Code" : "Welcome"}
            </h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {showOTPInput
                ? otpMethod === "phone"
                  ? "Code sent via WhatsApp to your phone"
                  : `Code sent to your ${otpMethod}`
                : "Log in or sign up to continue"}
            </p>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6 pt-0">
          {sessionExpired && !isRestoringSession && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm font-medium text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
              Session expired. Please sign in again.
            </div>
          )}

          {/* Show "Authentication successful!" ONLY when login succeeds (successPhase === "alert") */}
          {successPhase === "alert" && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50/80 p-3 animate-in fade-in zoom-in duration-300 dark:border-green-800 dark:bg-green-900/20">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                Authentication successful!
              </span>
            </div>
          )}

          {!showOTPInput && (
            <SocialLogin
              showDivider={true}
              clinicId={defaultClinicId}
              onSuccess={onSocialSuccess}
              onError={onSocialError}
            />
          )}

          <Form {...otpForm}>
            <form onSubmit={otpForm.onFormSubmit} className="mt-2 space-y-3">
              {!showOTPInput && (
                <div className="flex gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1.5 dark:border-slate-800 dark:bg-slate-800/50">
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchOtpMethod("phone");
                      otpForm.setValue("identifier", getCachedIdentifier("phone"));
                      otpForm.clearErrors("identifier");
                    }}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-3 rounded-lg border p-2 transition-all duration-300 ease-out",
                      otpMethod === "phone"
                        ? "border-purple-500 bg-purple-50 shadow-sm dark:bg-slate-900"
                        : "border-transparent bg-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full transition-colors",
                        otpMethod === "phone"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                          : "bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-gray-400",
                      )}
                    >
                      <Smartphone className="size-4" />
                    </div>
                    <span
                      className={cn(
                        "text-sm font-bold",
                        otpMethod === "phone"
                          ? "text-purple-800 dark:text-purple-300"
                          : "font-medium text-gray-500",
                      )}
                    >
                      Phone
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchOtpMethod("email");
                      otpForm.setValue("identifier", getCachedIdentifier("email"));
                      otpForm.clearErrors("identifier");
                    }}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-3 rounded-lg border p-2 transition-all duration-300 ease-out",
                      otpMethod === "email"
                        ? "border-blue-500 bg-blue-50 shadow-sm dark:bg-slate-900"
                        : "border-transparent bg-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full transition-colors",
                        otpMethod === "email"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                          : "bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-gray-400",
                      )}
                    >
                      <Mail className="size-4" />
                    </div>
                    <span
                      className={cn(
                        "text-sm font-bold",
                        otpMethod === "email"
                          ? "text-blue-800 dark:text-blue-300"
                          : "font-medium text-gray-500",
                      )}
                    >
                      Email
                    </span>
                  </button>
                </div>
              )}

              <div>
                <FormField
                  control={otpForm.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        {otpMethod === "phone" ? (
                          <div
                            className={cn(
                              "animate-in fade-in zoom-in-95 rounded-lg border border-gray-200 bg-gray-50/50 transition-all duration-300 dark:border-slate-800 dark:bg-slate-800/30",
                              "focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:ring-offset-1",
                            )}
                          >
                            <PhoneInput
                              placeholder="Phone Number"
                              defaultCountry="IN"
                              disabled={isFormDisabled || showOTPInput}
                              value={field.value}
                              authStyle
                              onChange={(value: string) => {
                                onPhoneChange(value);
                                field.onChange(value);
                              }}
                              className="border-none bg-transparent shadow-none focus-within:ring-0 [&_input]:border-none [&_input]:bg-transparent [&_input]:text-sm [&_input]:shadow-none"
                            />
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "animate-in fade-in zoom-in-95 rounded-lg border border-gray-200 bg-gray-50/50 transition-all duration-300 dark:border-slate-800 dark:bg-slate-800/30",
                              "focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:ring-offset-1",
                            )}
                          >
                            <Input
                              type="email"
                              placeholder="Email Address"
                              value={field.value}
                              onChange={(e) => {
                                onEmailChange(e.target.value);
                                field.onChange(e.target.value);
                              }}
                              disabled={isFormDisabled || showOTPInput}
                              autoComplete="email"
                              className="h-11 rounded-lg border-none bg-transparent px-4 text-sm shadow-none transition-all focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                          </div>
                        )}
                      </FormControl>
                      <FormMessage className="ml-1 animate-in fade-in slide-in-from-top-1 text-xs duration-200" />
                    </FormItem>
                  )}
                />
                {otpMethod === "phone" && !showOTPInput ? (
                  <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    WhatsApp message only. We will send your login code to the
                    phone number above.
                  </p>
                ) : null}
              </div>

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
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <span>Didn&apos;t receive a code?</span>
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto px-0 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
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
                <div className="animate-in fade-in slide-in-from-top-2 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm font-semibold text-red-600 duration-300 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                  {authError}
                </div>
              )}

              {!showOTPInput ? (
                <Button
                  type="button"
                  className="group h-11 w-full rounded-lg bg-emerald-600 text-[15px] font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md active:scale-[0.98]"
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
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Sending WhatsApp code...
                    </>
                  ) : (
                    <span className="flex items-center">
                      Request WhatsApp OTP
                      <ArrowRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  )}
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="h-11 w-full rounded-lg bg-emerald-600 text-[15px] font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md active:scale-[0.98]"
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

              {!showOTPInput && (
                <FormField
                  control={otpForm.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="mt-1 flex items-center gap-2 gap-y-0 pl-1">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isFormDisabled}
                          className="size-[18px] rounded-full border-gray-300 text-emerald-600 transition-all data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600 focus:ring-emerald-600 dark:border-slate-600"
                        />
                      </FormControl>
                      <label
                        htmlFor="rememberMe"
                        className="ml-1 cursor-pointer select-none text-[13px] font-medium text-gray-500 transition-colors hover:text-gray-800"
                      >
                        Remember me for 30 days
                      </label>
                    </FormItem>
                  )}
                />
              )}
            </form>
          </Form>
          <div className="mt-5 border-t border-gray-100 pt-4 dark:border-slate-800">
            <p className="text-center text-[13px] font-medium text-gray-500">
              New user?{" "}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                We'll create an account for you.
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
