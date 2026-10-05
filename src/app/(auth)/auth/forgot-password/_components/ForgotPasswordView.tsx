"use client";

/** "Forgot password" card. Presentational: the page owns the form and the request. */

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
  authBackLinkClass,
  authInputClass,
  authLabelClass,
} from "@/components/auth/AuthFrame";
import { ROUTES } from "@/lib/config/routes";
import type { forgotPasswordSchema } from "@/lib/schema";

export interface ForgotPasswordViewProps {
  form: UseFormReturn<z.infer<typeof forgotPasswordSchema>> & {
    onFormSubmit: (event?: React.FormEvent) => Promise<void>;
  };
  isRequestingReset: boolean;
}

export function ForgotPasswordView({ form, isRequestingReset }: ForgotPasswordViewProps) {
  return (
    <AuthCard>
      <AuthCardHeader
        title="Forgot password"
        description="Enter your email and we'll send you instructions to set a new password."
      />

      <Form {...form}>
        <form onSubmit={form.onFormSubmit} className="flex flex-col gap-3.5 sm:gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="gap-1.5">
                <FormLabel className={authLabelClass}>Email address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    disabled={isRequestingReset}
                    className={authInputClass}
                    {...field}
                  />
                </FormControl>
                <FormMessage role="alert" className="text-xs font-semibold" />
              </FormItem>
            )}
          />

          <Button type="submit" size="xl" className="w-full" disabled={isRequestingReset}>
            {isRequestingReset ? (
              <>
                <Loader2 className="size-[18px] animate-spin" aria-hidden="true" />
                Sending…
              </>
            ) : (
              "Send instructions"
            )}
          </Button>
        </form>
      </Form>

      <Link href={ROUTES.LOGIN} prefetch={false} className={authBackLinkClass}>
        <ChevronLeft className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
        Back to sign in
      </Link>
    </AuthCard>
  );
}
