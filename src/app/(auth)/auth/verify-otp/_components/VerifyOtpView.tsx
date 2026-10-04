"use client";

/**
 * "Enter your code" card for /auth/verify-otp. Presentational: the page owns the form,
 * the verify / resend calls, the cooldown timer and the redirect.
 */

import type { FormEvent } from "react";
import Link from "next/link";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { ChevronLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AuthCard,
  AuthCardHeader,
  AuthNote,
  AuthSentTo,
  authBackLinkClass,
  authLinkClass,
  formatAuthIdentifier,
} from "@/components/auth/AuthFrame";
import { OtpCodeInput } from "@/components/auth/otp-code-input";
import { ROUTES } from "@/lib/config/routes";
import type { otpSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";

export interface VerifyOtpViewProps {
  form: UseFormReturn<z.infer<typeof otpSchema>>;
  onSubmit: (event?: FormEvent) => void;
  /** The email or phone number the code was sent to. */
  email: string;
  isPhoneFlow: boolean;
  otpValue: string;
  formError: string | null;
  attemptsRemaining: number | null;
  successPhase: "none" | "alert" | "redirecting";
  /** Seconds left before the code can be sent again. */
  countdown: number;
  isVerifyingOTP: boolean;
  isRequestingOTP: boolean;
  /** Called on every keystroke in the code boxes, before the form value changes. */
  onOtpInput: () => void;
  onResend: () => void;
}

export function VerifyOtpView({
  form,
  onSubmit,
  email,
  isPhoneFlow,
  otpValue,
  formError,
  attemptsRemaining,
  successPhase,
  countdown,
  isVerifyingOTP,
  isRequestingOTP,
  onOtpInput,
  onResend,
}: VerifyOtpViewProps) {
  return (
    <AuthCard>
      <AuthCardHeader title="Enter your code" description="Type the 6-digit code to continue." />

      <AuthSentTo
        channel={isPhoneFlow ? "whatsapp" : "email"}
        identifier={formatAuthIdentifier(email)}
        action={
          <Link href={ROUTES.LOGIN} prefetch={false} className={authLinkClass}>
            Change
          </Link>
        }
      />

      {successPhase === "alert" && (
        <AuthNote tone="green">
          <span className="font-bold">OTP verified!</span> Redirecting to the next step
        </AuthNote>
      )}

      <Form {...form}>
        <form onSubmit={onSubmit} className="flex flex-col gap-3.5 sm:gap-4">
          <FormField
            control={form.control}
            name="otp"
            render={({ field, fieldState }) => (
              <FormItem className="gap-2">
                <FormLabel className="sr-only">6-digit code</FormLabel>
                <FormControl>
                  <OtpCodeInput
                    autoFocus
                    value={field.value}
                    onChange={(value) => {
                      onOtpInput();
                      field.onChange(value);
                    }}
                    disabled={isVerifyingOTP || successPhase !== "none"}
                    invalid={!!fieldState.error || !!formError}
                  />
                </FormControl>
                <FormMessage role="alert" className="text-center text-xs font-semibold" />
              </FormItem>
            )}
          />

          {formError && (
            <AuthNote tone="rose">
              {formError}
              {attemptsRemaining !== null && (
                <span className="mt-0.5 block font-semibold">
                  {attemptsRemaining} attempts remaining
                </span>
              )}
            </AuthNote>
          )}
          {!formError && attemptsRemaining !== null && (
            <p className="m-0 text-center text-xs text-ink-muted" role="status">
              {attemptsRemaining} attempts remaining
            </p>
          )}

          <Button
            type="submit"
            size="xl"
            className="w-full"
            disabled={isVerifyingOTP || (otpValue || "").length !== 6 || successPhase !== "none"}
          >
            {isVerifyingOTP ? (
              <>
                <Loader2 className="size-[18px] animate-spin" aria-hidden="true" />
                Verifying…
              </>
            ) : (
              "Verify OTP"
            )}
          </Button>

          <p className="m-0 text-center text-[13px] text-ink-soft">
            <span>Didn&apos;t receive a code?</span>{" "}
            <Button
              type="button"
              variant="link"
              className={cn(
                "h-auto p-0 text-[13px] disabled:text-ink-muted disabled:opacity-100 disabled:no-underline",
                authLinkClass,
              )}
              onClick={onResend}
              disabled={isRequestingOTP || successPhase !== "none" || countdown > 0}
            >
              {isRequestingOTP ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  {isPhoneFlow ? "Sending WhatsApp code..." : "Sending…"}
                </>
              ) : countdown > 0 ? (
                isPhoneFlow ? (
                  `Resend WhatsApp OTP in ${countdown}s`
                ) : (
                  `Resend OTP in ${countdown}s`
                )
              ) : isPhoneFlow ? (
                "Resend WhatsApp OTP"
              ) : (
                "Resend OTP"
              )}
            </Button>
          </p>

          <Link href={ROUTES.LOGIN} prefetch={false} className={authBackLinkClass}>
            <ChevronLeft className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
            Back to sign in
          </Link>
        </form>
      </Form>
    </AuthCard>
  );
}
