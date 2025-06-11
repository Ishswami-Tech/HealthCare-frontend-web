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
import { AuthResponse, loginSchema, otpSchema } from "@/types/auth.types";
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

type SocialProvider = "google" | "apple";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"password" | "otp">("password");
  const [showOTPInput, setShowOTPInput] = useState(false);
  const router = useRouter();
  const {
    login,
    requestOTP,
    verifyOTP,
    socialLogin,
    isLoggingIn,
    isVerifyingOTP,
    isRequestingOTP,
    isSocialLoggingIn,
  } = useAuth();

  const handleSuccess = (response: AuthResponse | null) => {
    if (!response) return;

    const searchParams = new URLSearchParams(window.location.search);
    const redirectUrl = searchParams.get("redirect");

    const finalRedirectUrl =
      redirectUrl && !redirectUrl.includes("/auth/")
        ? redirectUrl
        : response.redirectUrl ||
          (response.user?.role
            ? getDashboardByRole(response.user.role)
            : "/dashboard");

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
      toast.error(error instanceof Error ? error.message : "Failed to sign in");
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
        error instanceof Error ? error.message : "Failed to verify OTP"
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

  const handleSocialLogin = (provider: SocialProvider) => {
    socialLogin(
      { provider, token: "" },
      {
        onSuccess: handleSuccess,
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Social login failed"
          );
        },
      }
    );
  };

  const isLoading =
    isLoggingIn || isVerifyingOTP || isRequestingOTP || isSocialLoggingIn;

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

        <div className="grid grid-cols-2 gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleSocialLogin("google")}
            disabled={isLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleSocialLogin("apple")}
            disabled={isLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z"
                fill="currentColor"
              />
            </svg>
            Apple
          </Button>
        </div>
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
