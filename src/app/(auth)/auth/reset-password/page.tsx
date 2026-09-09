"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/auth/useAuth";
import Link from "next/link";

import { resetPasswordSchema } from "@/lib/schema";
import type { ResetPasswordFormData } from "@/types/auth.types";
import useZodForm from "@/hooks/utils/useZodForm";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { ERROR_MESSAGES } from "@/lib/config/config";
import { useAuthForm } from "@/hooks/auth/useAuth";
import { TOAST_IDS } from "@/hooks/utils/use-toast";
import { ROUTES } from "@/lib/config/routes";
import { Loader2 } from "lucide-react";

function ResetPasswordPageContent() {
  const searchParams = useSearchParams();
  const getSearchParam = useMemo(() => searchParams.get.bind(searchParams), [searchParams]);
  const token = getSearchParam("token");
  const safeToken = token || "";
  const { resetPassword, isResettingPassword } = useAuth();

  // ✅ Use unified auth form hook for consistent patterns
  const { executeAuthOperation } = useAuthForm({
    toastId: TOAST_IDS.AUTH.RESET_PASSWORD,
    loadingMessage: "Resetting password...",
    successMessage: "Password has been reset successfully.",
    errorMessage: ERROR_MESSAGES.RESET_PASSWORD_FAILED,
    redirectUrl: ROUTES.LOGIN,
    showToast: true,
  });

  const form = useZodForm(
    resetPasswordSchema,
    async (data: ResetPasswordFormData) => {
      // ✅ Use unified pattern - consistent across all auth pages
      await executeAuthOperation(async () => {
        return await resetPassword({
          token: data.token,
          newPassword: data.password,
        });
      });
    },
    {
      password: "",
      confirmPassword: "",
      token: safeToken,
    }
  );

  if (!safeToken) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg px-4 sm:px-0 border border-[#e2e5df] bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-[0_18px_45px_rgba(0,0,0,.5)] transition-colors">
        <CardHeader className="px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-center text-[#075735] dark:text-emerald-400">
            Invalid Reset Link
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center mt-2">
            The password reset link is invalid or has expired.
          </p>
        </CardHeader>
        <CardFooter className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="w-full text-center">
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              prefetch={false}
              className="text-[#08743e] hover:underline transition-colors text-xs sm:text-sm dark:text-emerald-400 font-medium"
            >
              Request a new reset link
            </Link>
          </div>
        </CardFooter>
      </Card>
    );
  }

  // ✅ Overlay clearing is handled by auth layout - no need to clear here
  // This prevents race conditions and ensures consistent behavior

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg px-4 sm:px-0 border border-[#e2e5df] bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-[0_18px_45px_rgba(0,0,0,.5)] transition-colors">
      <CardHeader className="px-4 sm:px-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-center text-[#075735] dark:text-emerald-400">
          Reset Password
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center mt-2">
          Enter your new password below
        </p>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Form {...form}>
          <form onSubmit={form.onFormSubmit} className="flex flex-col gap-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="New Password"
                      className="dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm New Password"
                      className="dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-[#08743e] hover:bg-[#075f35] text-white dark:bg-emerald-600 dark:hover:bg-emerald-500"
              disabled={isResettingPassword}
            >
              {isResettingPassword ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Resetting…
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="w-full text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Remember your password?{" "}
          <Link
            href={ROUTES.LOGIN}
            prefetch={false}
            className="text-[#08743e] hover:underline transition-colors dark:text-emerald-400 font-medium"
          >
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}


