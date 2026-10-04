"use client";

import { useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  AuthCard,
  AuthCardHeader,
  AuthHint,
  AuthNote,
  AuthSentTo,
  WhatsAppBadge,
  WhatsAppIcon,
  authBackLinkClass,
  authFieldShellClass,
  authLabelClass,
  authLinkClass,
  formatAuthIdentifier,
} from "@/components/auth/AuthFrame";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import PhoneInput from "@/components/ui/phone-input";
import { SocialLogin } from "@/components/auth/social-login";
import { OtpCodeInput } from "@/components/auth/otp-code-input";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronLeft, Loader2, Mail, Phone } from "lucide-react";

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
  /** Preview only: replaces the Google sign-in block so fixtures never load Google. */
  socialSlot?: ReactNode;
}

const methodTabClass =
  "flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-[11px] text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50";
const methodTabOn =
  "bg-white font-bold text-[#075735] shadow-[0_1px_3px_rgba(15,27,45,0.14)] dark:bg-slate-950 dark:text-emerald-300";
const methodTabOff = "font-semibold text-ink-soft hover:text-ink";

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
  socialSlot,
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

  const identifierValue =
    typeof otpForm.watch === "function" ? ((otpForm.watch("identifier") as string) ?? "") : "";
  const identifierError = otpForm.formState?.errors?.identifier?.message as string | undefined;

  return (
    <AuthCard data-auth-view={showOTPInput ? "otp" : "identifier"}>
      <AuthCardHeader
        title={showOTPInput ? "Enter your code" : "Welcome"}
        description={
          showOTPInput
            ? "Type the 6-digit code to sign in."
            : "Sign in to manage your appointments and access your health records."
        }
        mobileHidden={!showOTPInput}
      />

      {sessionExpired && !isRestoringSession && (
        <AuthNote tone="blue">Session expired. Please sign in again.</AuthNote>
      )}

      {/* Success Notification Alert */}
      {successPhase === "alert" && (
        <AuthNote tone="green">Signed in. Taking you to your portal…</AuthNote>
      )}

      <Form {...otpForm}>
        <form onSubmit={submitOtpOnce} className="flex flex-col gap-3.5 sm:gap-4">
          {!showOTPInput && (
            <div
              role="group"
              aria-label="Sign-in method"
              className="flex gap-1 rounded-[14px] bg-[#f1ede2] p-1 dark:bg-slate-800"
            >
              <button
                type="button"
                aria-pressed={otpMethod === "phone"}
                onClick={() => {
                  onSwitchOtpMethod("phone");
                  otpForm.setValue("identifier", getCachedIdentifier("phone"));
                  otpForm.clearErrors("identifier");
                }}
                className={cn(methodTabClass, otpMethod === "phone" ? methodTabOn : methodTabOff)}
              >
                <Phone className="size-4" strokeWidth={2.2} aria-hidden="true" />
                <span>Phone</span>
              </button>
              <button
                type="button"
                aria-pressed={otpMethod === "email"}
                onClick={() => {
                  onSwitchOtpMethod("email");
                  otpForm.setValue("identifier", getCachedIdentifier("email"));
                  otpForm.clearErrors("identifier");
                }}
                className={cn(methodTabClass, otpMethod === "email" ? methodTabOn : methodTabOff)}
              >
                <Mail className="size-4" strokeWidth={2.2} aria-hidden="true" />
                <span>Email</span>
              </button>
            </div>
          )}

          {/* The identifier field stays mounted on the code step (hidden) so the form keeps its value. */}
          <div className={cn("flex flex-col gap-3.5 sm:gap-4", showOTPInput && "hidden")}>
            <FormField
              control={otpForm.control}
              name="identifier"
              render={({ field }) => (
                <FormItem className="gap-1.5">
                  <FormLabel className={authLabelClass}>
                    {otpMethod === "phone" ? "Mobile number" : "Email address"}
                  </FormLabel>
                  {otpMethod === "phone" ? (
                    <div className={cn(authFieldShellClass, "px-0.5")}>
                      <FormControl>
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
                          className="border-none bg-transparent shadow-none focus-within:ring-0 [&_input]:border-none [&_input]:bg-transparent [&_input]:text-[17px] [&_input]:font-bold [&_input]:tracking-[0.4px] [&_input]:shadow-none [&_input]:text-ink [&_input]:placeholder:text-sm [&_input]:placeholder:font-medium [&_input]:placeholder:tracking-normal"
                        />
                      </FormControl>
                    </div>
                  ) : (
                    <div className={cn(authFieldShellClass, "gap-2.5 pl-3.5")}>
                      <Mail
                        className="size-[18px] shrink-0 text-ink-muted"
                        strokeWidth={2.1}
                        aria-hidden="true"
                      />
                      <FormControl>
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
                          className="h-full rounded-none border-none bg-transparent px-0 pr-3.5 text-base font-semibold text-ink shadow-none placeholder:font-medium focus-visible:ring-0 focus-visible:ring-offset-0 md:text-base dark:bg-transparent"
                        />
                      </FormControl>
                    </div>
                  )}
                  <FormMessage
                    role="alert"
                    className="animate-in fade-in slide-in-from-top-1 text-xs font-semibold duration-200"
                  />
                </FormItem>
              )}
            />

            {otpMethod === "phone" ? (
              <AuthHint icon={<WhatsAppBadge />}>
                We&apos;ll send a 6-digit login code on WhatsApp
              </AuthHint>
            ) : (
              <AuthHint
                icon={<Mail className="size-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />}
              >
                We&apos;ll email you a 6-digit login code
              </AuthHint>
            )}
          </div>

          {showOTPInput && (
            <div className="flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-300 sm:gap-4">
              <AuthSentTo
                channel={otpMethod === "phone" ? "whatsapp" : "email"}
                identifier={formatAuthIdentifier(identifierValue)}
                action={
                  <button type="button" onClick={onBack} className={authLinkClass}>
                    Change
                  </button>
                }
              />
              {identifierError ? <AuthNote tone="rose">{identifierError}</AuthNote> : null}
              <FormField
                control={otpForm.control}
                name="otp"
                render={({ field, fieldState }) => (
                  <FormItem className="gap-2">
                    <FormLabel className="sr-only">6-digit code</FormLabel>
                    <FormControl>
                      <OtpCodeInput
                        autoFocus
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value);
                          onOtpChange(value);
                        }}
                        disabled={isFormDisabled}
                        invalid={
                          !!fieldState.error ||
                          !!otpForm.formState?.errors?.otp ||
                          !!authError
                        }
                      />
                    </FormControl>
                    <FormMessage
                      role="alert"
                      className="animate-in fade-in slide-in-from-top-1 text-center text-xs font-semibold duration-200"
                    />
                  </FormItem>
                )}
              />
            </div>
          )}

          {authError && <AuthNote tone="rose">{authError}</AuthNote>}

          {!showOTPInput ? (
            <Button
              type="button"
              size="xl"
              className="group w-full"
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
                  <Loader2 className="size-[18px] animate-spin" aria-hidden="true" />
                  {otpMethod === "phone" ? "Sending WhatsApp code..." : "Sending email code..."}
                </>
              ) : (
                <>
                  {otpMethod === "phone" ? (
                    <WhatsAppIcon className="size-[18px]" />
                  ) : (
                    <Mail className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
                  )}
                  <span>{otpMethod === "phone" ? "Send OTP" : "Send Email OTP"}</span>
                  <ArrowRight
                    className="size-[18px] transition-transform duration-300 group-hover:translate-x-1"
                    strokeWidth={2.4}
                    aria-hidden="true"
                  />
                </>
              )}
            </Button>
          ) : (
            <Button
              type="submit"
              size="xl"
              className="w-full"
              disabled={isFormDisabled || isVerifyingOTP || (otpValue || "").length !== 6}
            >
              {isVerifyingOTP ? (
                <>
                  <Loader2 className="size-[18px] animate-spin" aria-hidden="true" />
                  Verifying…
                </>
              ) : (
                "Verify & Sign In"
              )}
            </Button>
          )}

          {showOTPInput && (
            <>
              <p className="m-0 text-center text-[13px] text-ink-soft">
                <span>Didn&apos;t receive a code?</span>{" "}
                <Button
                  type="button"
                  variant="link"
                  className={cn("h-auto p-0 text-[13px]", authLinkClass)}
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
                    ? otpMethod === "phone"
                      ? "Sending WhatsApp code..."
                      : "Sending email code..."
                    : otpMethod === "phone"
                      ? "Resend WhatsApp OTP"
                      : "Resend OTP"}
                </Button>
              </p>
              <button type="button" onClick={onBack} className={authBackLinkClass}>
                <ChevronLeft className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
                Back to sign in
              </button>
            </>
          )}
        </form>
      </Form>

      {!showOTPInput &&
        (socialSlot ?? (
          <SocialLogin
            showDivider={true}
            clinicId={defaultClinicId}
            isLoading={isSocialLoading}
            onSuccess={onSocialSuccess}
            onError={onSocialError}
          />
        ))}

      {!showOTPInput && (
        <div className="flex flex-col gap-1.5 border-t border-hair pt-3.5 text-center text-[13px] text-ink-soft">
          <p className="m-0">
            New here?{" "}
            <b className="font-bold text-[#075735] dark:text-emerald-300">
              We&apos;ll create your account for you.
            </b>
          </p>
          <p className="m-0 text-xs text-ink-muted">
            Doctors and clinic staff sign in here too. By continuing you agree to the{" "}
            <Link href="/terms" prefetch={false} className={authLinkClass}>
              Terms
            </Link>
            .
          </p>
        </div>
      )}
    </AuthCard>
  );
}
