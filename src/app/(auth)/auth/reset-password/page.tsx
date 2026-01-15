"use client";

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
import { resetPasswordSchema } from "@/types/auth.types";
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

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
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

  if (!token) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg px-4 sm:px-0">
        <CardHeader className="px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-center">
            Invalid Reset Link
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 text-center mt-2">
            The password reset link is invalid or has expired.
          </p>
        </CardHeader>
        <CardFooter className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="w-full text-center">
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              className="text-blue-600 hover:underline transition-colors text-xs sm:text-sm"
            >
              Request a new reset link
            </Link>
          </div>
        </CardFooter>
      </Card>
    );
  }

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
      token: token || "",
    }
  );

  // ✅ Overlay clearing is handled by auth layout - no need to clear here
  // This prevents race conditions and ensures consistent behavior

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg px-4 sm:px-0">
      <CardHeader className="px-4 sm:px-6">
        <h2 className="text-xl sm:text-2xl font-bold text-center">
          Reset Password
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 text-center mt-2">
          Enter your new password below
        </p>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Form {...form}>
          <form onSubmit={form.onFormSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="New Password"
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
              disabled={isResettingPassword}
            >
              {isResettingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
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
