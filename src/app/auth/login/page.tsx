"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import useZodForm from "@/hooks/useZodForm";
import { AuthResponse, loginSchema, otpSchema, Role } from "@/types/auth.types";
import { getDashboardByRole } from "@/config/routes";
import { toast } from "sonner";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { SocialLogin } from "@/components/auth/social-login";
import { ERROR_MESSAGES } from "@/lib/constants/error-messages";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"password" | "otp">("password");
  const [showOTPInput, setShowOTPInput] = useState(false);
  const router = useRouter();
  const {
    login,
    requestOTP,
    verifyOTP,
    isLoggingIn,
    isVerifyingEmail,
    isGoogleLoggingIn,
    isAppleLoggingIn,
    isFacebookLoggingIn,
  } = useAuth();

  const handleSuccess = (response: AuthResponse | null) => {
    if (!response || !response.user) {
      toast.error(ERROR_MESSAGES.LOGIN_FAILED);
      return;
    }

    // If profile is not complete, redirect to the completion page
    if (response.user.profileComplete === false) {
      router.push('/profile-completion');
      return;
    }

    // If profile is complete, continue with the original redirect logic
    const searchParams = new URLSearchParams(window.location.search);
    const redirectUrl = searchParams.get("redirect");

    const finalRedirectUrl =
      redirectUrl && !redirectUrl.includes("/auth/")
        ? redirectUrl
        : response.redirectUrl ||
          getDashboardByRole(response.user.role as Role);

    router.push(finalRedirectUrl || "/dashboard");
  };

  const loginMutation = async (
    data: z.infer<typeof loginSchema>
  ): Promise<AuthResponse> => {
    try {
      const response = await login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });
      const authResponse = response as unknown as AuthResponse;
      handleSuccess(authResponse);
      return authResponse;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : ERROR_MESSAGES.LOGIN_FAILED);
      throw error;
    }
  };

  const otpMutation = async (
    data: z.infer<typeof otpSchema>
  ): Promise<AuthResponse> => {
    try {
      const response = await verifyOTP(data);
      const authResponse = response as unknown as AuthResponse;
      handleSuccess(authResponse);
      return authResponse;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : ERROR_MESSAGES.OTP_FAILED
      );
      throw error;
    }
  };

  const passwordForm = useZodForm(loginSchema, loginMutation, {
    email: "",
    password: "",
    rememberMe: false,
  });

  const otpForm = useZodForm(otpSchema, otpMutation, {
    email: "",
    otp: "",
    rememberMe: false,
  });

  const handleRequestOTP = async (email: string) => {
    try {
      await requestOTP(email);
      setShowOTPInput(true);
      toast.success("OTP sent successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send OTP"
      );
    }
  };

  const isLoading =
    isLoggingIn ||
    isVerifyingEmail ||
    isGoogleLoggingIn ||
    isAppleLoggingIn ||
    isFacebookLoggingIn;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <h2 className="text-2xl font-bold text-center">Welcome back</h2>
        <p className="text-sm text-gray-600 text-center mt-2">
          Sign in to access your account
        </p>
        <div className="flex space-x-2 mt-6">
          <Button
            type="button"
            variant={activeTab === "password" ? "default" : "outline"}
            className="flex-1"
            onClick={() => {
              setActiveTab("password");
              setShowOTPInput(false);
            }}
          >
            Password
          </Button>
          <Button
            type="button"
            variant={activeTab === "otp" ? "default" : "outline"}
            className="flex-1"
            onClick={() => {
              setActiveTab("otp");
              setShowOTPInput(false);
            }}
          >
            OTP
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === "password" ? (
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.onFormSubmit} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <FormField
                  control={passwordForm.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <label
                        htmlFor="rememberMe"
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        Remember me
                      </label>
                    </FormItem>
                  )}
                />
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2" />
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...otpForm}>
            <form onSubmit={otpForm.onFormSubmit} className="space-y-4">
              <FormField
                control={otpForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!showOTPInput ? (
                <Button
                  type="button"
                  className="w-full"
                  disabled={isLoading}
                  onClick={() => {
                    const email = otpForm.getValues("email");
                    if (email) {
                      handleRequestOTP(email);
                    } else {
                      toast.error("Please enter your email address");
                    }
                  }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2" />
                      Sending OTP...
                    </div>
                  ) : (
                    "Get OTP"
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  <FormField
                    control={otpForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Enter OTP"
                            maxLength={6}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={otpForm.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <label
                          htmlFor="rememberMeOTP"
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          Remember me
                        </label>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2" />
                        Verifying...
                      </div>
                    ) : (
                      "Verify OTP"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const email = otpForm.getValues("email");
                      if (email) {
                        handleRequestOTP(email);
                      }
                    }}
                    disabled={isLoading}
                  >
                    Resend OTP
                  </Button>
                </div>
              )}
            </form>
          </Form>
        )}

        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        <SocialLogin
          onError={(error) => {
            toast.error(error.message || "Social login failed");
          }}
          className="mt-6"
          isLoading={isLoading}
        />
      </CardContent>
      <CardFooter>
        <div className="w-full text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
