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
    <Card className="w-full max-w-md mx-auto shadow-lg px-4 sm:px-0">
      <CardHeader className="px-4 sm:px-6">
        <h2 className="text-xl sm:text-2xl font-bold text-center">
          Forgot Password
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 text-center mt-2">
          Enter your email to receive password reset instructions
        </p>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Form {...form}>
          <form onSubmit={form.onFormSubmit} className="space-y-4">
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
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isRequestingReset}
            >
              Send Instructions
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="w-full text-center text-xs sm:text-sm text-gray-600">
          Remember your password?{" "}
          <Link
            href={ROUTES.LOGIN}
            className="text-blue-600 hover:underline transition-colors"
          >
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
