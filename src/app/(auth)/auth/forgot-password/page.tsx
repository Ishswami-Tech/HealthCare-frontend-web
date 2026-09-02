"use client";

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
import { forgotPasswordSchema } from "@/lib/schema";
import type { ForgotPasswordFormData } from "@/types/auth.types";
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

export default function ForgotPasswordPage() {
  const { forgotPassword, isRequestingReset } = useAuth();

  // ✅ Use unified auth form hook for consistent patterns
  const { executeAuthOperation } = useAuthForm({
    toastId: TOAST_IDS.AUTH.FORGOT_PASSWORD,
    loadingMessage: "Sending instructions...",
    successMessage: "Password reset instructions have been sent to your email.",
    errorMessage: ERROR_MESSAGES.FORGOT_PASSWORD_FAILED,
    redirectUrl: ROUTES.LOGIN,
    showToast: true,
  });

  const form = useZodForm(
    forgotPasswordSchema,
    async (data: ForgotPasswordFormData) => {
      // ✅ Use unified pattern - consistent across all auth pages
      await executeAuthOperation(async () => {
        return await forgotPassword(data.email);
      });
    },
    {
      email: "",
    }
  );

  // ✅ Overlay clearing is handled by auth layout - no need to clear here
  // This prevents race conditions and ensures consistent behavior

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg px-4 sm:px-0 border border-[#e2e5df] bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-[0_18px_45px_rgba(0,0,0,.5)] transition-colors">
      <CardHeader className="px-4 sm:px-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-center text-[#075735] dark:text-emerald-400">
          Forgot Password
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center mt-2">
          Enter your email to receive password reset instructions
        </p>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Form {...form}>
          <form onSubmit={form.onFormSubmit} className="flex flex-col gap-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Email"
                      disabled={isRequestingReset}
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
              disabled={isRequestingReset}
            >
              Send Instructions
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

