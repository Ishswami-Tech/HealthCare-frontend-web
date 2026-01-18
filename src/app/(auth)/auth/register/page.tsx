"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import PhoneInput from "@/components/ui/phone-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SocialLogin } from "@/components/auth/social-login";
import { PasswordStrength } from "@/components/ui/password-strength";
import { registerSchema } from "@/lib/schema";
import { Role, type RegisterData } from "@/types/auth.types";
import { useAuth } from "@/hooks/auth/useAuth";
import useZodForm from "@/hooks/utils/useZodForm";
import { ERROR_MESSAGES } from "@/lib/config/config";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useAuthForm } from "@/hooks/auth/useAuth";
import { TOAST_IDS, showErrorToast } from "@/hooks/utils/use-toast";
import { ROUTES } from "@/lib/config/routes";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isPending } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSocialLoginLoading, setIsSocialLoginLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const isFormDisabled = isSocialLoginLoading || isSuccess;

  // ✅ Use unified auth form hook for consistent patterns
  const { executeAuthOperation } = useAuthForm({
    toastId: TOAST_IDS.AUTH.REGISTER,
    loadingMessage: "Creating account...",
    successMessage: "Account created successfully!",
    errorMessage: ERROR_MESSAGES.REGISTER_FAILED,
    // ✅ Disable auto-redirect to show success UI - removed redirectUrl property
    showToast: true,
    onError: (error: Error) => {
      // Check if user already exists
      if (
        error.message.toLowerCase().includes("already exists") ||
        error.message.toLowerCase().includes("please login")
      ) {
        showErrorToast(
          "An account with this email address already exists. Please login.",
          {
            id: TOAST_IDS.AUTH.REGISTER,
          }
        );
        setTimeout(() => {
          router.push(ROUTES.LOGIN);
        }, 1500);
        return;
      }
      
      // Set form error for display
      setFormError(error.message);
    },
  });

  useEffect(() => {
    if (isSuccess) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push(ROUTES.LOGIN);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [isSuccess, router]);

  const form = useZodForm(
    registerSchema,
    async (values: any) => {
      setFormError(null);

      const formData = {
        ...values,
        role: Role.PATIENT, // Set default role
      };

      // ✅ Use unified pattern - consistent across all auth pages
      const result = await executeAuthOperation(async () => {
        return await registerUser(formData as RegisterData);
      });

      // Only proceed if registration was successful
      if (result) {
        // Handle OTP Verification Redirect
        if (result.requiresVerification && result.user?.email) {
          showErrorToast("Verification code sent to your email.", {
              id: TOAST_IDS.AUTH.REGISTER,
              variableOptions: { type: "success" } // Hack to show success toast using error toast fn if needed, or better use a success toast
          });
          // Small delay for toast visibility
          setTimeout(() => {
             router.push(`${ROUTES.VERIFY_OTP}?email=${encodeURIComponent(result.user.email)}`);
          }, 1000);
          return;
        }

        // Standard Auto-Login Success
        if ("user" in result && result.user) {
          setIsSuccess(true);
          form.reset();
        }
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
      role: Role.PATIENT as any,
      age: 18,
      terms: false,
    }
  );

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg px-4 sm:px-0">
      <CardHeader className="space-y-1 px-4 sm:px-6">
        <h2 className="text-xl sm:text-2xl font-bold text-center">
          {isSuccess ? "Account Created!" : "Create an account"}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 text-center">
          {isSuccess
            ? "Your account has been successfully created."
            : "Enter your information to create an account"}
        </p>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {isSuccess ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-8 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Welcome Aboard!
                </h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                  You can now log in to your account. Redirecting you in{" "}
                  <span className="font-bold text-blue-600">{countdown}</span>{" "}
                  seconds...
                </p>
              </div>
              <Button
                onClick={() => router.push(ROUTES.LOGIN)}
                className="mt-4"
                variant="outline"
              >
                Go to Login Now
              </Button>
            </div>
        ) : (
          <>
            <SocialLogin
              className="mb-6 w-full"
              onError={(error) => {
                setFormError(error.message);
                showErrorToast(error.message, {
                  id: TOAST_IDS.AUTH.SOCIAL_LOGIN,
                });
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
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
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
                          <PhoneInput
                            placeholder="Phone number"
                            {...field}
                            disabled={isFormDisabled}
                            className={
                              isFormDisabled ? "opacity-50 cursor-not-allowed" : ""
                            }
                            defaultCountry="US"
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
                  disabled={isFormDisabled || isPending}
                >
                  {isPending ? (
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
          </>
        )}
      </CardContent>
      {!isSuccess && (
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
      )}
    </Card>
  );
}
