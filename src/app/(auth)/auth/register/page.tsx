"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import Link from "next/link";
import { useAuth } from "@/hooks/auth/useAuth";
import { PasswordStrength } from "@/components/ui/password-strength";
import { Checkbox } from "@/components/ui/checkbox";
import { SocialLogin } from "@/components/auth/social-login";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  registerSchema,
  type RegisterFormData,
} from "@/lib/schema/login-schema";
import useZodForm from "@/hooks/utils/useZodForm";
import {
  Role,
  RegisterFormData as AuthRegisterFormData,
} from "@/types/auth.types";
import { useState } from "react";
import { ERROR_MESSAGES } from "@/lib/config/config";
import { Loader2 } from "lucide-react";
import { useAuthForm } from "@/hooks/auth/useAuth";
import { TOAST_IDS } from "@/hooks/utils/use-toast";
import { toast } from "sonner"; // For SocialLogin error handling
import { ROUTES } from "@/lib/config/routes";
export default function RegisterPage() {
  const { register: registerUser, isLoading } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSocialLoginLoading, setIsSocialLoginLoading] = useState(false);

  // Disable form inputs when social login is loading
  const isFormDisabled = isSocialLoginLoading;

  // ✅ Use unified auth form hook for consistent patterns
  const { executeAuthOperation } = useAuthForm({
    toastId: TOAST_IDS.AUTH.REGISTER,
    loadingMessage: "Creating account...",
    successMessage: "Account created successfully!",
    errorMessage: ERROR_MESSAGES.REGISTER_FAILED,
    redirectUrl: `${ROUTES.LOGIN}?registered=true`,
    redirectDelay: 2000,
    showToast: true,
    onError: (error) => {
      // Set form error for display
      setFormError(error.message);
    },
  });

  // ✅ Overlay clearing is handled by auth layout - no need to clear here
  // This prevents race conditions and ensures consistent behavior

  const form = useZodForm(
    registerSchema,
    async (values: RegisterFormData) => {
      setFormError(null);

      const formData = {
        ...values,
        role: Role.PATIENT, // Set default role
        gender: values.gender || "male",
        age: values.age || 18, // Ensure age has a default value
      };

      // ✅ Use unified pattern - consistent across all auth pages
      const result = await executeAuthOperation(async () => {
        return await registerUser(
          formData as AuthRegisterFormData & { clinicId?: string }
        );
      });

      // Only proceed if registration was successful
      if (result && "user" in result && result.user) {
        form.reset();
      }
    },
    {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
      gender: "male",
      role: Role.PATIENT,
      age: 18,
      terms: false,
    }
  );

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg px-4 sm:px-0">
      <CardHeader className="space-y-1 px-4 sm:px-6">
        <h2 className="text-xl sm:text-2xl font-bold text-center">
          Create an account
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 text-center">
          Enter your information to create an account
        </p>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <SocialLogin
          className="mb-6 w-full"
          onError={(error) => {
            setFormError(error.message);
            toast.error(error.message);
          }}
          onLoadingStateChange={setIsSocialLoginLoading}
        />

        {isSocialLoginLoading && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <p className="text-sm text-blue-600">Signing up with Google...</p>
            </div>
          </div>
        )}

        {formError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{formError}</p>
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async () => {
              try {
                await form.onFormSubmit();
              } catch {
                // Error is already handled in the mutation function
              }
            })}
            className="space-y-4 mt-6"
            noValidate
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="First name"
                        {...field}
                        disabled={isFormDisabled}
                        className={
                          isFormDisabled ? "opacity-50 cursor-not-allowed" : ""
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Last name"
                        {...field}
                        disabled={isFormDisabled}
                        className={
                          isFormDisabled ? "opacity-50 cursor-not-allowed" : ""
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Email address"
                      {...field}
                      disabled={isFormDisabled}
                      className={
                        isFormDisabled ? "opacity-50 cursor-not-allowed" : ""
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="Phone number"
                      {...field}
                      disabled={isFormDisabled}
                      className={
                        isFormDisabled ? "opacity-50 cursor-not-allowed" : ""
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Create password"
                      {...field}
                      disabled={isFormDisabled}
                      className={
                        isFormDisabled ? "opacity-50 cursor-not-allowed" : ""
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <PasswordStrength password={form.watch("password")} />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm password"
                      {...field}
                      disabled={isFormDisabled}
                      className={
                        isFormDisabled ? "opacity-50 cursor-not-allowed" : ""
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isFormDisabled}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isFormDisabled || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="text-xs sm:text-sm text-center">
          Already have an account?{" "}
          <Link
            href={ROUTES.LOGIN}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
