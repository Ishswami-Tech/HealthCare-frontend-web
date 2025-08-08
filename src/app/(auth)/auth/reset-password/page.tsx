"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { toast } from "sonner";
import { resetPasswordSchema } from "@/types/auth.types";
import type { ResetPasswordFormData } from "@/types/auth.types";
import useZodForm from "@/hooks/useZodForm";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { ERROR_MESSAGES } from "@/lib/constants/error-messages";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { resetPassword } = useAuth();

  const form = useZodForm(
    resetPasswordSchema,
    async (data: ResetPasswordFormData) => {
      if (!token) {
        toast.error("Invalid or missing reset token");
        return;
      }

      try {
        await resetPassword({
          token: data.token,
          newPassword: data.password,
        });
        toast.success("Password has been reset successfully.");
        router.push("/auth/login");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : ERROR_MESSAGES.RESET_PASSWORD_FAILED
        );
      }
    },
    {
      password: "",
      confirmPassword: "",
      token: token || "",
    }
  );

  const onSubmit = form.handleSubmit(async (data) => {
    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }

    try {
      await resetPassword({
        token: data.token,
        newPassword: data.password,
      });
      toast.success("Password has been reset successfully.");
      router.push("/auth/login");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : ERROR_MESSAGES.RESET_PASSWORD_FAILED
      );
    }
  });

  if (!token) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <h2 className="text-2xl font-bold text-center">Invalid Reset Link</h2>
          <p className="text-sm text-gray-600 text-center mt-2">
            The password reset link is invalid or has expired.
          </p>
        </CardHeader>
        <CardFooter>
          <div className="w-full text-center">
            <Link
              href="/auth/forgot-password"
              className="text-blue-600 hover:underline"
            >
              Request a new reset link
            </Link>
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <h2 className="text-2xl font-bold text-center">Reset Password</h2>
        <p className="text-sm text-gray-600 text-center mt-2">
          Enter your new password below
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
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

            <Button type="submit" className="w-full">
              Reset Password
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <div className="w-full text-center text-sm text-gray-600">
          Remember your password?{" "}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
