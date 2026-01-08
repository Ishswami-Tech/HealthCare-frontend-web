"use client";

import { useRouter } from "next/navigation";
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
import { forgotPasswordSchema } from "@/lib/schema/login-schema";
import type { ForgotPasswordFormData } from "@/types/auth.types";
import useZodForm from "@/hooks/useZodForm";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { ERROR_MESSAGES } from "@/lib/config/config";
import { useLoadingOverlay } from "@/app/providers/LoadingOverlayContext";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword, isRequestingReset } = useAuth();
  const { setOverlay } = useLoadingOverlay();

  const form = useZodForm(
    forgotPasswordSchema,
    async (data: ForgotPasswordFormData) => {
      try {
        setOverlay({ show: true, variant: "default", message: "Sending instructions..." });
        await forgotPassword(data.email);
        toast.success(
          "Password reset instructions have been sent to your email."
        );
        router.push("/auth/login");
        setOverlay({ show: false });
      } catch (error) {
        setOverlay({ show: false });
        toast.error(
          error instanceof Error
            ? error.message
            : ERROR_MESSAGES.FORGOT_PASSWORD_FAILED
        );
      }
    },
    {
      email: "",
    }
  );

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <h2 className="text-2xl font-bold text-center">Forgot Password</h2>
        <p className="text-sm text-gray-600 text-center mt-2">
          Enter your email to receive password reset instructions
        </p>
      </CardHeader>
      <CardContent>
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
