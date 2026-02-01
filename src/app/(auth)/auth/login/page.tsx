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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { SocialLogin } from "@/components/auth/social-login";
import { Loader2, ArrowLeft, Lock, Smartphone, Mail } from "lucide-react";
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

export default function LoginPage() {
  const [view, setView] = useState<LoginMethod>("selection");
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [otpMethod, setOtpMethod] = useState<OtpMethod>("email");
  const [isSocialLoginLoading, setIsSocialLoginLoading] = useState(false);
  
  // Shared email state to persist across views
  const [sharedIdentifier, setSharedIdentifier] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const otpInputRef = useRef<HTMLInputElement>(null);
  const { loginAsync, requestOTP, verifyOTP, isLoggingIn, isVerifyingOTP } = useAuth();
  
  const isFormDisabled = isSocialLoginLoading;

  useEffect(() => {
    if (showOTPInput && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [showOTPInput]);

  // Login Mutation
  const loginMutation = useCallback(
    async (data: z.infer<typeof loginSchema>): Promise<AuthResponse> => {
       return await loginAsync({
          email: data.email,
          password: data.password,
          rememberMe: data.rememberMe,
        });
    },
    [loginAsync]
  );

  // OTP Mutation
  const otpMutation = async (data: z.infer<typeof otpSchema>): Promise<AuthResponse> => {
      return await verifyOTP(data as OTPFormData);
  };

  const passwordForm = useZodForm(loginSchema, loginMutation, {
    email: sharedIdentifier,
    password: "",
    rememberMe: false,
    terms: false,
  });

  const otpForm = useZodForm(otpSchema, otpMutation, {
    identifier: sharedIdentifier,
    otp: "",
    rememberMe: false,
    terms: false,
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

  // Google Icon
  const GoogleIcon = () => (
    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
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
  );

  // Render Selection View
  const renderSelectionView = () => (
    <div className="space-y-4">
       <div className="space-y-3">
         {/* Custom Google Button - MOVED TO TOP */}
        <button
          type="button"
          className="w-full flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          onClick={() => {
            if (!termsAccepted) {
              showErrorToast("Please accept the terms and conditions to continue");
              return;
            }
            document.querySelector<HTMLElement>('[aria-label="Sign in with Google"]')?.click();
          }}
          disabled={isFormDisabled}
        >
          <GoogleIcon />
          <span className="font-medium text-sm text-gray-700 dark:text-gray-200">Sign in with Google</span>
        </button>
      </div>

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
            // Sync local terms state to form state if possible, or just default
            otpForm.setValue("terms", termsAccepted);
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
             passwordForm.setValue("terms", termsAccepted);
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

       <div className="flex items-start space-x-2 pt-2">
            <Checkbox
              id="terms-selection"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
              disabled={isFormDisabled}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms-selection"
                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-600 dark:text-gray-400"
              >
                I agree to the{" "}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
          </div>

      {/* Hidden SocialLogin */}
       <div className="hidden">
           <SocialLogin
            onLoadingStateChange={setIsSocialLoginLoading}
            onError={(error) => {
                 showErrorToast(error.message, { id: TOAST_IDS.AUTH.SOCIAL_LOGIN });
            }}
           />
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
                <Input
                    type="password"
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
            
            <FormField
              control={passwordForm.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isFormDisabled}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none pt-0.5">
                    <label
                      htmlFor="terms-password"
                      className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-600 dark:text-gray-400"
                    >
                       I accept the{" "}
                      <Link href="/terms" className="text-blue-600 hover:underline">
                        Terms
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </FormItem>
              )}
            />
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

             <FormField
              control={otpForm.control}
              name="terms"
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
                      htmlFor="terms-otp"
                      className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-600 dark:text-gray-400"
                    >
                       I accept the{" "}
                      <Link href="/terms" className="text-blue-600 hover:underline">
                        Terms
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </Link>
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

  return (
    <Card className="w-full max-w-[380px] mx-auto shadow-lg">
      <CardHeader className="space-y-1 px-4 sm:px-6 relative">
          {view !== "selection" && (
           <Button
               variant="ghost"
               size="sm"
               className="absolute left-4 top-4 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 p-0 hover:bg-transparent"
               onClick={handleBack}
           >
               <ArrowLeft className="h-4 w-4 mr-2" />
               Back
           </Button>
        )}
        <h2 className="text-xl font-bold text-center pt-4">
          {getHeaderTitle()}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {getHeaderSubtitle()}
        </p>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
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
