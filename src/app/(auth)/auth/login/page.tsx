"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Loader2 } from "lucide-react";
import { useLoadingOverlay } from "@/app/providers/LoadingOverlayContext";
import { motion, AnimatePresence } from "framer-motion";
import { BackendStatusWidget, DetailedBackendStatus } from "@/components/common/BackendStatusIndicator";
import { SystemStatusBar } from "@/components/common/StatusIndicator";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"password" | "otp">("password");
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [isSocialLoginLoading, setIsSocialLoginLoading] = useState(false);
  const [sharedEmail, setSharedEmail] = useState("");
  const otpInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { login, requestOTP, verifyOTP, isLoggingIn, isVerifyingEmail } =
    useAuth();
  const { setOverlay } = useLoadingOverlay();

  useEffect(() => {
    setOverlay({ show: false });
  }, [setOverlay]);

  useEffect(() => {
    if (showOTPInput && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [showOTPInput]);

  const handleSuccess = useCallback((response: AuthResponse | null) => {
    if (!response || !response.user) {
      toast.error(ERROR_MESSAGES.LOGIN_FAILED);
      return;
    }

    // If profile is not complete, redirect to the completion page
    if (response.user.profileComplete === false) {
      toast.info("Please complete your profile to continue");
      router.push("/profile-completion");
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
  }, [router]);

  const loginMutation = useCallback(async (
    data: z.infer<typeof loginSchema>
  ): Promise<AuthResponse> => {
    try {
      setOverlay({ show: true, variant: "login" });
      const toastId = toast.loading("Signing in...");
      
      const response = await login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });
      const authResponse = response as unknown as AuthResponse;
      
      toast.dismiss(toastId);
      toast.success("Successfully signed in!");
      setOverlay({ show: false });
      handleSuccess(authResponse);
      return authResponse;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : ERROR_MESSAGES.LOGIN_FAILED
      );
      setOverlay({ show: false });
      throw error;
    }
  }, [login, handleSuccess, setOverlay]);

  const otpMutation = async (
    data: z.infer<typeof otpSchema>
  ): Promise<AuthResponse> => {
    try {
      // Show loading toast
      toast.loading("Verifying OTP...", {
        id: "otp-verify",
      });

      const response = await verifyOTP(data);
      const authResponse = response as unknown as AuthResponse;

      // Dismiss loading toast and show success
      toast.dismiss("otp-verify");
      toast.success("OTP verified successfully!");

      handleSuccess(authResponse);
      return authResponse;
    } catch (error) {
      // Dismiss loading toast and show error
      toast.dismiss("otp-verify");
      toast.error(
        error instanceof Error ? error.message : ERROR_MESSAGES.OTP_FAILED
      );
      throw error;
    }
  };

  const passwordForm = useZodForm(loginSchema, loginMutation, {
    email: sharedEmail,
    password: "",
    rememberMe: false,
  });

  const otpForm = useZodForm(otpSchema, otpMutation, {
    email: sharedEmail,
    otp: "",
    rememberMe: false,
  });

  const handleRequestOTP = async (email: string) => {
    try {
      // Show loading toast
      toast.loading("Sending OTP...", {
        id: "otp-request",
      });

      await requestOTP(email);

      // Dismiss loading toast and show success
      toast.dismiss("otp-request");
      toast.success("OTP sent successfully!");

      setShowOTPInput(true);
    } catch (error) {
      // Dismiss loading toast and show error
      toast.dismiss("otp-request");
      toast.error(
        error instanceof Error ? error.message : "Failed to send OTP"
      );
    }
  };

  // Disable form inputs when social login is loading
  const isFormDisabled = isSocialLoginLoading;

  const handleTabSwitch = (tab: "password" | "otp") => {
    setActiveTab(tab);
    setShowOTPInput(false);
    // Optionally reset OTP value
    otpForm.reset({ email: sharedEmail, otp: "", rememberMe: false });
    passwordForm.reset({ email: sharedEmail, password: "", rememberMe: false });
  };

  return (
    <div className="space-y-4">
      {/* Backend Status Indicators */}
      <div className="w-full max-w-md mx-auto space-y-3">
        <SystemStatusBar className="justify-center" />
        <DetailedBackendStatus />
      </div>

      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <h2 className="text-2xl font-bold text-center">Welcome back</h2>
          <p className="text-sm text-gray-600 text-center mt-2">
            Sign in to access your account
          </p>
          
          {/* Live status indicator in header */}
          <div className="flex justify-center mt-3">
            <BackendStatusWidget />
          </div>
        </CardHeader>
      <CardContent>
        <SocialLogin
          className="mb-6 w-full"
          onError={(error) => {
            toast.error(error.message);
          }}
          onLoadingStateChange={setIsSocialLoginLoading}
        />

        <div className="flex space-x-2 mb-6">
          <Button
            type="button"
            variant={activeTab === "password" ? "default" : "outline"}
            className="flex-1"
            onClick={() => handleTabSwitch("password")}
            disabled={isFormDisabled}
          >
            Password
          </Button>
          <Button
            type="button"
            variant={activeTab === "otp" ? "default" : "outline"}
            className="flex-1"
            onClick={() => handleTabSwitch("otp")}
            disabled={isFormDisabled}
          >
            OTP
          </Button>
        </div>

        {isSocialLoginLoading && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <p className="text-sm text-blue-600">Signing in with Google...</p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === "password" ? (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.3 }}
            >
              <Form {...passwordForm}>
                <form
                  onSubmit={passwordForm.onFormSubmit}
                  className="space-y-4"
                >
                  <FormField
                    control={passwordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Email"
                            {...field}
                            value={sharedEmail}
                            onChange={(e) => {
                              setSharedEmail(e.target.value);
                              field.onChange(e);
                              otpForm.setValue("email", e.target.value);
                            }}
                            disabled={isFormDisabled}
                            className={
                              isFormDisabled
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }
                          />
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
                            disabled={isFormDisabled}
                            className={
                              isFormDisabled
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="rememberMe"
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
                            htmlFor="rememberMe"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Remember me
                          </label>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isFormDisabled || isLoggingIn}
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </form>
              </Form>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <Form {...otpForm}>
                <form onSubmit={otpForm.onFormSubmit} className="space-y-4">
                  <FormField
                    control={otpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Email"
                            {...field}
                            value={sharedEmail}
                            onChange={(e) => {
                              setSharedEmail(e.target.value);
                              field.onChange(e);
                              passwordForm.setValue("email", e.target.value);
                            }}
                            disabled={isFormDisabled}
                            className={
                              isFormDisabled
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {showOTPInput ? (
                    <FormField
                      control={otpForm.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Enter OTP"
                              {...field}
                              ref={otpInputRef}
                              disabled={isFormDisabled}
                              className={
                                isFormDisabled
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        if (sharedEmail) {
                          handleRequestOTP(sharedEmail);
                        } else {
                          toast.error("Please enter your email first");
                        }
                      }}
                      disabled={isFormDisabled}
                    >
                      Request OTP
                    </Button>
                  )}

                  <FormField
                    control={otpForm.control}
                    name="rememberMe"
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
                            htmlFor="rememberMe"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Remember me
                          </label>
                        </div>
                      </FormItem>
                    )}
                  />

                  {showOTPInput && (
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isFormDisabled || isVerifyingEmail}
                    >
                      {isVerifyingEmail ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify OTP"
                      )}
                    </Button>
                  )}
                </form>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-center">
          <Link
            href="/auth/forgot-password"
            className="text-blue-600 hover:text-blue-800"
          >
            Forgot your password?
          </Link>
        </div>
        <div className="text-sm text-center">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="text-blue-600 hover:text-blue-800"
          >
            Sign up
          </Link>
        </div>
      </CardFooter>
      </Card>
    </div>
  );
}
