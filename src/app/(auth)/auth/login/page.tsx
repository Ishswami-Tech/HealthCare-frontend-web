"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  type OTPFormData,
} from "@/types/auth.types";
import { loginSchema, otpSchema } from "@/lib/schema";

import { ROUTES } from "@/lib/config/routes";
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
import { Loader2 } from "lucide-react";
import { TOAST_IDS, showErrorToast } from "@/hooks/utils/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"password" | "otp">("password");
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [isSocialLoginLoading, setIsSocialLoginLoading] = useState(false);
  const [sharedEmail, setSharedEmail] = useState("");
  const otpInputRef = useRef<HTMLInputElement>(null);
  const { loginAsync, requestOTP, verifyOTP, isLoggingIn, isVerifyingOTP } =
    useAuth();

  useEffect(() => {
    if (showOTPInput && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [showOTPInput]);

  // ✅ Use useAuth hook directly - it handles session updates, redirects, and errors
  const loginMutation = useCallback(
    async (data: z.infer<typeof loginSchema>): Promise<AuthResponse> => {
      try {
        // loginAsync handles everything: session update, redirect, error handling
        const result = await loginAsync({
          email: data.email,
          password: data.password,
          rememberMe: data.rememberMe,
        });
        return result;
      } catch (error) {
        // Error is already handled by useAuth hook
        throw error;
      }
    },
    [loginAsync]
  );

  // ✅ Use useAuth hook directly for OTP verification
  const otpMutation = async (
    data: z.infer<typeof otpSchema>
  ): Promise<AuthResponse> => {
    try {
      // verifyOTP from useAuth handles everything
      return await verifyOTP(data as OTPFormData);
    } catch (error) {
      // Error is already handled by useAuth hook
      throw error;
    }
  };

  const passwordForm = useZodForm(loginSchema, loginMutation, {
    email: sharedEmail,
    password: "",
    rememberMe: false,
  });

  const otpForm = useZodForm(otpSchema, otpMutation, {
    identifier: sharedEmail,
    otp: "",
    rememberMe: false,
  });

  const handleRequestOTP = async (identifier: string) => {
    // ✅ Use useAuth hook directly - it handles errors and toasts
    try {
      await requestOTP(identifier);
      setShowOTPInput(true);
    } catch (error) {
      // Error is already handled by useAuth hook
    }
  };

  // Disable form inputs when social login is loading
  const isFormDisabled = isSocialLoginLoading;

  const handleTabSwitch = (tab: "password" | "otp") => {
    setActiveTab(tab);
    setShowOTPInput(false);
    // Optionally reset OTP value
    otpForm.reset({ identifier: sharedEmail, otp: "", rememberMe: false });
    passwordForm.reset({ email: sharedEmail, password: "", rememberMe: false });
  };

  // ✅ Overlay clearing is handled by auth layout - no need to clear here
  // This prevents race conditions and ensures consistent behavior

  return (
    <div className="space-y-4 px-4 sm:px-6">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-center">
            Welcome back
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 text-center mt-2">
            Sign in to access your account
          </p>

          {/* Live status indicator in header */}
          <div className="flex justify-center mt-3"></div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <SocialLogin
            className="mb-6 w-full"
            onError={(error) => {
              showErrorToast(error.message, {
                id: TOAST_IDS.AUTH.SOCIAL_LOGIN,
              });
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
                    onSubmit={(e) => {
                      passwordForm.onFormSubmit(e).catch((error) => {
                        passwordForm.setError("root", {
                          message: error.message || "Invalid credentials. Please try again.",
                        });
                      });
                    }}
                    className="space-y-4"
                  >
                    {passwordForm.formState.errors.root && (
                      <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                        {passwordForm.formState.errors.root.message}
                      </div>
                    )}
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
                                otpForm.setValue("identifier", e.target.value);
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
                      name="identifier"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Email or Phone Number"
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
                            showErrorToast("Please enter your email first", {
                              id: TOAST_IDS.AUTH.OTP,
                            });
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
                        disabled={isFormDisabled || isVerifyingOTP}
                      >
                        {isVerifyingOTP ? (
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
              href={ROUTES.FORGOT_PASSWORD}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
          <div className="text-xs sm:text-sm text-center">
            Don&apos;t have an account?{" "}
            <Link
              href={ROUTES.REGISTER}
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
