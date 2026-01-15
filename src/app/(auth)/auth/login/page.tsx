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
import { useAuth } from "@/hooks/auth/useAuth";
import useZodForm from "@/hooks/utils/useZodForm";
import {
  AuthResponse,
  loginSchema,
  otpSchema,
  OTPFormData,
  Role,
} from "@/types/auth.types";
import { getDashboardByRole } from "@/lib/config/routes";
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
import { ERROR_MESSAGES } from "@/lib/config/config";
import { Loader2 } from "lucide-react";
import { useAuthForm } from "@/hooks/auth/useAuth";
import { TOAST_IDS } from "@/hooks/utils/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  BackendStatusWidget,
  DetailedBackendStatus,
} from "@/components/common/BackendStatusIndicator";
import { SystemStatusBar } from "@/components/common/StatusIndicator";
import { GlobalHealthStatusButton } from "@/components/common/GlobalHealthStatusButton";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"password" | "otp">("password");
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [isSocialLoginLoading, setIsSocialLoginLoading] = useState(false);
  const [sharedEmail, setSharedEmail] = useState("");
  const otpInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { login, requestOTP, verifyOTP, isLoggingIn, isVerifyingEmail } =
    useAuth();

  useEffect(() => {
    if (showOTPInput && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [showOTPInput]);

  const handleSuccess = useCallback(
    (response: AuthResponse | null) => {
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
    },
    [router]
  );

  // ✅ Use unified auth form hook for consistent patterns - Login
  const { executeAuthOperation: executeLogin } = useAuthForm({
    toastId: TOAST_IDS.AUTH.LOGIN,
    overlayVariant: "login",
    loadingMessage: "Signing in...",
    successMessage: "Successfully signed in!",
    errorMessage: ERROR_MESSAGES.LOGIN_FAILED,
    showOverlay: true,
    showToast: true,
    onSuccess: (result) => {
      // Handle success redirect logic
      if (result) {
        handleSuccess(result as AuthResponse);
      }
    },
  });

  // ✅ Use unified auth form hook for consistent patterns - OTP Verification
  const { executeAuthOperation: executeOTP } = useAuthForm({
    toastId: TOAST_IDS.AUTH.OTP,
    overlayVariant: "default",
    loadingMessage: "Verifying OTP...",
    successMessage: "OTP verified successfully!",
    errorMessage: "OTP verification failed. Please try again.",
    showOverlay: true,
    showToast: true,
    onSuccess: (result) => {
      // Handle success redirect logic
      if (result) {
        handleSuccess(result as AuthResponse);
      }
    },
  });

  // ✅ Use unified auth form hook for consistent patterns - OTP Request
  const { executeAuthOperation: executeOTPRequest } = useAuthForm({
    toastId: TOAST_IDS.AUTH.OTP,
    overlayVariant: "default",
    loadingMessage: "Sending OTP...",
    successMessage: "OTP sent successfully!",
    errorMessage: "Failed to send OTP. Please try again.",
    showOverlay: false, // Don't show overlay for OTP request
    showToast: true,
    onSuccess: () => {
      setShowOTPInput(true);
    },
  });

  const loginMutation = useCallback(
    async (data: z.infer<typeof loginSchema>): Promise<AuthResponse> => {
      const response = await executeLogin(async () => {
        return await login({
          email: data.email,
          password: data.password,
          rememberMe: data.rememberMe,
        });
      });

      return (response as unknown as AuthResponse) || ({} as AuthResponse);
    },
    [login, executeLogin]
  );

  const otpMutation = async (
    data: z.infer<typeof otpSchema>
  ): Promise<AuthResponse> => {
    const response = await executeOTP(async () => {
      return await verifyOTP(data as OTPFormData);
    });

    return (response as unknown as AuthResponse) || ({} as AuthResponse);
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
    // ✅ Use unified pattern - consistent across all auth pages
    await executeOTPRequest(async () => {
      return await requestOTP(email);
    });
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

  // ✅ Overlay clearing is handled by auth layout - no need to clear here
  // This prevents race conditions and ensures consistent behavior

  return (
    <div className="space-y-4 px-4 sm:px-6">
      {/* Global Health Status Button - Floating */}
      <GlobalHealthStatusButton variant="floating" position="bottom-right" />

      {/* Backend Status Indicators */}
      <div className="w-full max-w-md mx-auto space-y-3">
        <SystemStatusBar className="justify-center" />
        <DetailedBackendStatus />
      </div>

      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-center">
            Welcome back
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 text-center mt-2">
            Sign in to access your account
          </p>

          {/* Live status indicator in header */}
          <div className="flex justify-center mt-3">
            <BackendStatusWidget />
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
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
              className="flex-1 text-sm sm:text-base"
              onClick={() => handleTabSwitch("password")}
              disabled={isFormDisabled}
            >
              Password
            </Button>
            <Button
              type="button"
              variant={activeTab === "otp" ? "default" : "outline"}
              className="flex-1 text-sm sm:text-base"
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
                <p className="text-sm text-blue-600">
                  Signing in with Google...
                </p>
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
        <CardFooter className="flex flex-col space-y-2 px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="text-xs sm:text-sm text-center">
            <Link
              href="/auth/forgot-password"
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
          <div className="text-xs sm:text-sm text-center">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="text-blue-600 hover:text-blue-800 underline transition-colors"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
