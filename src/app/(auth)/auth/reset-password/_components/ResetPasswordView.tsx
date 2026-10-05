"use client";

/** "Reset password" cards. Presentational: the page owns the token, the form and the request. */

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
import { Input } from "@/components/ui/input";
import {
  AuthCard,
  AuthCardHeader,
  AuthNote,
  authBackLinkClass,
  authInputClass,
  authLabelClass,
} from "@/components/auth/AuthFrame";
import { ROUTES } from "@/lib/config/routes";
import type { resetPasswordSchema } from "@/lib/schema";

function BackToSignIn() {
  return (
    <Link href={ROUTES.LOGIN} prefetch={false} className={authBackLinkClass}>
      <ChevronLeft className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
      Back to sign in
    </Link>
  );
}

/** Shown when the page is opened without a reset token. */
export function ResetLinkInvalidView() {
  return (
    <AuthCard>
      <AuthCardHeader title="Reset link not valid" />
      <AuthNote tone="rose">The password reset link is invalid or has expired.</AuthNote>
      <Button asChild size="xl" className="w-full">
        <Link href={ROUTES.FORGOT_PASSWORD} prefetch={false}>
          Request a new reset link
        </Link>
      </Button>
      <BackToSignIn />
    </AuthCard>
  );
}

export interface ResetPasswordViewProps {
  form: UseFormReturn<z.infer<typeof resetPasswordSchema>> & {
    onFormSubmit: (event?: React.FormEvent) => Promise<void>;
  };
  isResettingPassword: boolean;
}

export function ResetPasswordView({ form, isResettingPassword }: ResetPasswordViewProps) {
  return (
    <AuthCard>
      <AuthCardHeader title="Reset password" description="Enter your new password below." />

      <Form {...form}>
        <form onSubmit={form.onFormSubmit} className="flex flex-col gap-3.5 sm:gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="gap-1.5">
                <FormLabel className={authLabelClass}>New password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="New Password"
                    autoComplete="new-password"
                    className={authInputClass}
                    {...field}
                  />
                </FormControl>
                <FormMessage role="alert" className="text-xs font-semibold" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="gap-1.5">
                <FormLabel className={authLabelClass}>Confirm new password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirm New Password"
                    autoComplete="new-password"
                    className={authInputClass}
                    {...field}
                  />
                </FormControl>
                <FormMessage role="alert" className="text-xs font-semibold" />
              </FormItem>
            )}
          />

          <Button type="submit" size="xl" className="w-full" disabled={isResettingPassword}>
            {isResettingPassword ? (
              <>
                <Loader2 className="size-[18px] animate-spin" aria-hidden="true" />
                Resetting…
              </>
            ) : (
              "Reset password"
            )}
          </Button>
        </form>
      </Form>

      <BackToSignIn />
    </AuthCard>
  );
}
