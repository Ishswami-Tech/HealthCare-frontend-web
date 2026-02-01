"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SocialLogin } from "@/components/auth/social-login";
import { PasswordStrength } from "@/components/ui/password-strength";
import { registerSchema } from "@/lib/schema";
import { Role, type RegisterData } from "@/types/auth.types";
import { useAuth, useAuthForm } from "@/hooks/auth/useAuth";
import useZodForm from "@/hooks/utils/useZodForm";
import { ERROR_MESSAGES } from "@/lib/config/config";
import { TOAST_IDS, showErrorToast, showSuccessToast } from "@/hooks/utils/use-toast";
import { ROUTES } from "@/lib/config/routes";
import { EmailOtpRegisterForm } from "@/components/auth/email-otp-register-form";
import { PhoneOtpRegisterForm } from "@/components/auth/phone-otp-register-form";
import PhoneInput from "@/components/ui/phone-input";
import { 
  Loader2, 
  CheckCircle2, 
  Mail, 
  Lock, 
  ArrowLeft, 
  Smartphone 
} from "lucide-react";
import { cn } from "@/lib/utils";

type RegistrationMethod = "selection" | "otp" | "password";
type OtpMethod = "email" | "phone";

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isPending } = useAuth();
  
  // State for view navigation
  const [view, setView] = useState<RegistrationMethod>("selection");
  const [otpMethod, setOtpMethod] = useState<OtpMethod>("email");
  
  const [formError, setFormError] = useState<string | null>(null);
  const [isSocialLoginLoading, setIsSocialLoginLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const isFormDisabled = isSocialLoginLoading || isSuccess;

  // Unified auth form hook
  const { executeAuthOperation } = useAuthForm({
    toastId: TOAST_IDS.AUTH.REGISTER,
    loadingMessage: "Creating account...",
    successMessage: "Account created successfully!",
    errorMessage: ERROR_MESSAGES.REGISTER_FAILED,
    showToast: true,
    onError: (error: Error) => {
      if (
        error.message.toLowerCase().includes("already exists") ||
        error.message.toLowerCase().includes("please login")
      ) {
        showErrorToast(
          "An account with this email address already exists. Please login.",
          { id: TOAST_IDS.AUTH.REGISTER }
        );
        setFormError("An account with this email address already exists. Please login.");
        setTimeout(() => router.push(ROUTES.LOGIN), 3000);
        return;
      }
      setFormError(error.message);
    },
  });


  // Handle success redirect countdown
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
    return undefined; // Explicit return for TypeScript
  }, [isSuccess, router]);

  // Password Registration Form
  const passwordForm = useZodForm(
    registerSchema,
    async (values: any) => {
      setFormError(null);
      const formData = { ...values, role: Role.PATIENT };
      
      const result = await executeAuthOperation(async () => {
        return await registerUser(formData as RegisterData);
      });

      if (result) {
        if (result.requiresVerification && result.user?.email) {
          showSuccessToast("Verification code sent to your email.", {
              id: TOAST_IDS.AUTH.REGISTER,
          });
          setTimeout(() => {
             router.push(`${ROUTES.VERIFY_OTP}?email=${encodeURIComponent(result.user.email)}`);
          }, 1000);
          return;
        }

        if ("user" in result && result.user) {
          setIsSuccess(true);
          passwordForm.reset();
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

  const handleBack = () => {
    setFormError(null);
    setView("selection");
  };

  // Render Functions
  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center space-y-4 py-8 animate-in fade-in zoom-in duration-300">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Welcome Aboard!</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
          You can now log in to your account. Redirecting you in{" "}
          <span className="font-bold text-blue-600 dark:text-blue-400">{countdown}</span> seconds...
        </p>
      </div>
      <Button onClick={() => router.push(ROUTES.LOGIN)} className="mt-4" variant="outline">
        Go to Login Now
      </Button>
    </div>
  );

  // Icons
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

  const renderSelectionView = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        {/* OTP Option */}
        <button
          className={cn(
            "w-full flex items-center p-3 rounded-xl border transition-all duration-200 text-left hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 group",
            view === "otp" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30" : "border-slate-200 dark:border-slate-700"
          )}
          onClick={() => {
            setView("otp");
            setOtpMethod("email"); // Default to email OTP
          }}
          disabled={isFormDisabled}
        >
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="ml-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Continue with OTP</span>
              <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-[9px] font-bold text-white uppercase tracking-wider">
                Recommended
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Email or Phone verification</p>
          </div>
        </button>

        {/* Password Option */}
        <button
          className={cn(
            "w-full flex items-center p-3 rounded-xl border transition-all duration-200 text-left hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 group",
            view === "password" ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30" : "border-slate-200 dark:border-slate-700"
          )}
          onClick={() => setView("password")}
          disabled={isFormDisabled}
        >
          <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
            <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="ml-3">
            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">Create with Password</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Traditional signup</p>
          </div>
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
        {/* Custom Google Button */}
        <button
          type="button"
          className="w-full flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          onClick={() => {
            // Trigger generic Google login if available, or visual fallback
            document.querySelector<HTMLElement>('[aria-label="Sign in with Google"]')?.click();
          }}
          disabled={isFormDisabled}
        >
          <GoogleIcon />
          <span className="font-medium text-sm text-gray-700 dark:text-gray-200">Sign up with Google</span>
        </button>
      </div>

      {/* Hidden SocialLogin component to handle logic */}
      <div className="hidden">
           <SocialLogin
            onLoadingStateChange={setIsSocialLoginLoading}
            onError={(error) => {
                 showErrorToast(error.message, { id: TOAST_IDS.AUTH.SOCIAL_LOGIN });
            }}
           />
      </div>

      <div className="text-center px-4">
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
             By signing up, you agree to our{" "}
             <Link href="/terms" className="text-blue-600 hover:underline">
                 Terms of Service
             </Link>{" "}
             and{" "}
             <Link href="/privacy" className="text-blue-600 hover:underline">
                 Privacy Policy
             </Link>
          </p>
      </div>
    </div>
  );

  const renderOtpView = () => (
    <div className="space-y-6">
      <div className="flex justify-center mb-6">
         <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            {otpMethod === "email" ? (
                <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            ) : (
                <Smartphone className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            )}
         </div>
      </div>

      <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-lg">
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

      <div className="mt-6">
        {otpMethod === "email" && <EmailOtpRegisterForm />}
        {otpMethod === "phone" && <PhoneOtpRegisterForm />}
      </div>
    </div>
  );

  const renderPasswordView = () => (
    <div className="space-y-4">
      {formError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{formError}</p>
        </div>
      )}

      <Form {...passwordForm}>
        <form
          onSubmit={passwordForm.handleSubmit(async () => {
            try {
              await passwordForm.onFormSubmit();
            } catch {
              // Error handled in hook
            }
          })}
          className="space-y-4"
          noValidate
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={passwordForm.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="First name"
                      {...field}
                      disabled={isFormDisabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Last name"
                      {...field}
                      disabled={isFormDisabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
                    disabled={isFormDisabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={passwordForm.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <PhoneInput
                    {...field}
                    placeholder="Phone number"
                    defaultCountry="IN"
                    disabled={isFormDisabled}
                    onChange={(value: string | undefined) => field.onChange(value)} 
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
                    placeholder="Create password"
                    {...field}
                    disabled={isFormDisabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <PasswordStrength password={passwordForm.watch("password")} />

          <FormField
            control={passwordForm.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    {...field}
                    disabled={isFormDisabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={passwordForm.control}
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
                    <Link href="/terms" className="text-blue-600 hover:text-blue-800">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-800">
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
    </div>
  );

  const getHeaderTitle = () => {
    if (isSuccess) return "Account Created!";
    if (view === "otp") return "Sign up with OTP";
    if (view === "password") return "Create Account";
    return "Create Account";
  };

  const getHeaderSubtitle = () => {
      if (isSuccess) return "Your account has been successfully created.";
      if (view === "otp") return "Choose your verification method";
      if (view === "password") return "Enter your details below";
      return "Choose how you'd like to sign up";
  };

  return (
    <Card className="w-full max-w-[380px] mx-auto shadow-lg">
      <CardHeader className="space-y-1 px-4 sm:px-6 relative">
        {view !== "selection" && !isSuccess && (
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
        <h2 className="text-xl font-bold text-center pt-12">
          {getHeaderTitle()}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {getHeaderSubtitle()}
        </p>
      </CardHeader>
      
      <CardContent className="px-4 sm:px-6">
        {isSuccess ? (
            renderSuccess()
        ) : (
            <>
                {view === "selection" && renderSelectionView()}
                {view === "otp" && renderOtpView()}
                {view === "password" && renderPasswordView()}
            </>
        )}
      </CardContent>

      {!isSuccess && (
        <CardFooter className="flex flex-col space-y-2 px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="text-xs text-center">
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
