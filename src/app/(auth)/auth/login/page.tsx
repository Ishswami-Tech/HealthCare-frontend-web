"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { SocialLogin } from "@/components/auth/social-login";
import { Loader2, ArrowLeft, Lock, Smartphone, Mail, CheckCircle2 } from "lucide-react";
import { TOAST_IDS, showErrorToast } from "@/hooks/utils/use-toast";
import { useAuth } from "@/hooks/auth/useAuth";
import useZodForm from "@/hooks/utils/useZodForm";
import { loginSchema, otpSchema } from "@/lib/schema";
import { AuthResponse, OTPFormData } from "@/types/auth.types";
import { ROUTES } from "@/lib/config/routes";
import { cn } from "@/lib/utils";
import { z } from "zod";
import PhoneInput from "@/components/ui/phone-input";

type LoginMethod = "selection" | "password" | "otp";
type OtpMethod = "email" | "phone";

type SuccessPhase = "none" | "alert" | "redirecting";

export default function LoginPage() {
  const [view, setView] = useState<LoginMethod>("selection");
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [otpMethod, setOtpMethod] = useState<OtpMethod>("email");
  const [isSocialLoginLoading, setIsSocialLoginLoading] = useState(false);
  const [successPhase, setSuccessPhase] = useState<SuccessPhase>("none");

  // Shared email state to persist across views
  const [sharedIdentifier, setSharedIdentifier] = useState("");

  const otpInputRef = useRef<HTMLInputElement>(null);
  const { loginAsync, requestOTP, verifyOTP, isLoggingIn, isVerifyingOTP } = useAuth();
  
  const isFormDisabled = isSocialLoginLoading || successPhase !== "none";

  const triggerSuccessFlow = useCallback(() => {
    setSuccessPhase("alert");
    setTimeout(() => setSuccessPhase("redirecting"), 1500);
  }, []);

  useEffect(() => {
    if (showOTPInput && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [showOTPInput]);

  // Login Mutation
  const loginMutation = useCallback(
    async (data: z.infer<typeof loginSchema>): Promise<AuthResponse> => {
      const result = await loginAsync({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });
      triggerSuccessFlow();
      return result;
    },
    [loginAsync, triggerSuccessFlow]
  );

  // OTP Mutation
  const otpMutation = async (data: z.infer<typeof otpSchema>): Promise<AuthResponse> => {
    const result = await verifyOTP(data as OTPFormData);
    triggerSuccessFlow();
    return result;
  };

  const passwordForm = useZodForm(loginSchema, loginMutation, {
    email: sharedIdentifier,
    password: "",
    rememberMe: false,
  });

  const otpForm = useZodForm(otpSchema, otpMutation, {
    identifier: sharedIdentifier,
    otp: "",
    rememberMe: false,
  });

  const handleRequestOTP = async (identifier: string) => {
    try {
      await requestOTP({ identifier });
      setShowOTPInput(true);
    } catch (error) {
      // Handled by hook
    }
  };

  const handleBack = () => {
    setView("selection");
    setShowOTPInput(false);
  }

  // Render Selection View
  const renderSelectionView = () => (
    <div className="space-y-4">
      <SocialLogin
        showDivider={false}
        onLoadingStateChange={setIsSocialLoginLoading}
        onSuccess={triggerSuccessFlow}
        onError={(error) => {
          showErrorToast(error.message, { id: TOAST_IDS.AUTH.SOCIAL_LOGIN });
        }}
      />

       <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-4 text-muted-foreground text-gray-400 dark:text-gray-500 text-[10px]">OR</span>
        </div>
      </div>

      <div className="space-y-3">
        {/* OTP Option */}
        <button
          className={cn(
            "w-full flex items-center p-3 rounded-xl border transition-all duration-200 text-left hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 group",
            "border-slate-200 dark:border-slate-700"
          )}
          onClick={() => {
            setView("otp");
            setOtpMethod("email");
          }}
          disabled={isFormDisabled}
        >
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
            <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="ml-3 flex-1">
             <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Sign in with OTP</span>
              <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-[9px] font-bold text-white uppercase tracking-wider">
                Recommended
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Passwordless login</p>
          </div>
        </button>

        {/* Password Option */}
        <button
          className={cn(
            "w-full flex items-center p-3 rounded-xl border transition-all duration-200 text-left hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 group",
            "border-slate-200 dark:border-slate-700"
          )}
          onClick={() => {
             setView("password");
          }}
          disabled={isFormDisabled}
        >
          <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
            <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="ml-3">
            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">Sign in with Password</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Use your email and password</p>
          </div>
        </button>
      </div>
    </div>
  );

  const renderPasswordView = () => (
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
                    placeholder="Email address"
                    {...field}
                    value={field.value || sharedIdentifier} // synced
                    onChange={(e) => {
                      field.onChange(e);
                      setSharedIdentifier(e.target.value);
                    }}
                    disabled={isFormDisabled}
                    autoComplete="email"
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
                <PasswordInput
                    placeholder="Password"
                    {...field}
                    disabled={isFormDisabled}
                    autoComplete="current-password"
                />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />

        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <FormField
                    control={passwordForm.control}
                    name="rememberMe"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
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

                <Link
                    href={ROUTES.FORGOT_PASSWORD}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                Forgot?
                </Link>
            </div>
        </div>

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
  );

  const renderOtpView = () => (
       <Form {...otpForm}>
          <form onSubmit={otpForm.onFormSubmit} className="space-y-4">
             {!showOTPInput && (
              <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-lg mb-4">
                <button
                  type="button"
                  onClick={() => setOtpMethod("email")}
                  className={cn(
                    "flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all",
                    otpMethod === "email"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  )}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setOtpMethod("phone")}
                  className={cn(
                    "flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all",
                    otpMethod === "phone"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  )}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Phone
                </button>
              </div>
            )}

            <FormField
              control={otpForm.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    {otpMethod === "phone" ? (
                      <PhoneInput
                        {...field}
                        placeholder="Phone Number"
                        defaultCountry="IN"
                        disabled={isFormDisabled || showOTPInput}
                        value={field.value || sharedIdentifier}
                        onChange={(value: string | undefined) => {
                          field.onChange(value);
                          setSharedIdentifier(value || "");
                        }}
                      />
                    ) : (
                      <Input
                        type="email"
                        placeholder="Email Address"
                        {...field}
                        value={field.value || sharedIdentifier}
                        onChange={(e) => {
                          field.onChange(e);
                          setSharedIdentifier(e.target.value);
                        }}
                        disabled={isFormDisabled || showOTPInput}
                      />
                    )}
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
                        className="text-center tracking-widest text-lg"
                        maxLength={6}
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
                  const id = otpForm.getValues("identifier");
                  if (id) {
                    handleRequestOTP(id);
                  } else {
                    showErrorToast("Please enter your email or phone first", {
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
                <FormItem className="flex flex-row items-start space-x-2 space-y-0">
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
                  "Verify & Sign In"
                )}
              </Button>
            )}
          </form>
        </Form>
  );
  
  const getHeaderTitle = () => {
    if (view === "otp") return "Sign in with OTP";
    if (view === "password") return "Sign in with Password";
    return "Welcome Back";
  };
  
  const getHeaderSubtitle = () => {
      if (view === "otp") return "Enter your details to receive a code";
      if (view === "password") return "Enter your email and password";
      return "Choose your preferred sign in method";
  };

  // Redirecting overlay — replaces the whole card content
  if (successPhase === "redirecting") {
    return (
      <Card className="w-full max-w-[380px] mx-auto shadow-lg">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-5">
          <div className="relative flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <Loader2 className="absolute h-20 w-20 animate-spin text-green-500/40" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Successfully signed in!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to dashboard…</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-[380px] mx-auto shadow-lg">
      <CardHeader className={cn("space-y-1 px-4 sm:px-6 relative", view !== "selection" ? "pt-10" : "pt-2")}>
          {view !== "selection" && (
           <Button
               variant="ghost"
               size="sm"
               className="absolute left-4 top-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 p-0 hover:bg-transparent"
               onClick={handleBack}
           >
               <ArrowLeft className="h-4 w-4 mr-2" />
               Back
           </Button>
        )}
        <h2 className={cn("text-xl font-bold text-center", view !== "selection" ? "pt-6" : "")}>
          {getHeaderTitle()}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {getHeaderSubtitle()}
        </p>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {/* Success alert — shown briefly before the redirecting overlay */}
        {successPhase === "alert" && (
          <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">Sign in successful!</p>
              <p className="text-xs text-green-600 dark:text-green-400">Redirecting to your dashboard…</p>
            </div>
          </div>
        )}
        {view === "selection" && renderSelectionView()}
        {view === "password" && renderPasswordView()}
        {view === "otp" && renderOtpView()}
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="text-xs text-center">
            Don&apos;t have an account?{" "}
            <Link
              href={ROUTES.REGISTER}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Sign up
            </Link>
          </div>
      </CardFooter>
    </Card>
  );
}
