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
import { loginSchema, otpSchema } from "@/types/auth.types";
import useZodForm from "@/hooks/useZodForm";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardByRole } from "@/config/routes";
import { Role, LoginFormData, OTPFormData } from "@/types/auth.types";
import { Checkbox } from "@/components/ui/checkbox";

type SocialProvider = "google" | "apple";
type AuthResponse = {
  user?: { role?: Role };
  redirectUrl?: string;
};

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"password" | "otp">("password");
  const [message, setMessage] = useState("");
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

  const handleSuccess = (response: AuthResponse) => {
    console.log("Login success:", response);
    const searchParams = new URLSearchParams(window.location.search);
    const redirectUrl = searchParams.get("redirect");

    const finalRedirectUrl =
      redirectUrl && !redirectUrl.includes("/auth/")
        ? redirectUrl
        : response.redirectUrl ||
          (response.user?.role
            ? getDashboardByRole(response.user.role)
            : "/dashboard");

    router.push(finalRedirectUrl);
  };

  const handleError = (error: unknown) => {
    console.error("Login error:", error);
    setMessage(error instanceof Error ? error.message : "An error occurred");
  };

  const handlePasswordSubmit = async (data: LoginFormData) => {
    console.log("Submitting password form with data:", data);
    try {
      if (!data.password) {
        throw new Error("Password is required");
      }
      await login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });
    } catch (error) {
      handleError(error);
    }
  };

  const handleOTPSubmit = async (data: OTPFormData) => {
    console.log("Submitting OTP form with data:", data);
    try {
      await verifyOTP(data);
    } catch (error) {
      handleError(error);
    }
  };

  const passwordForm = useZodForm<typeof loginSchema>(
    loginSchema,
    handlePasswordSubmit
  );

  const otpForm = useZodForm<typeof otpSchema>(otpSchema, handleOTPSubmit);

  const handleRequestOTP = async (email: string) => {
    console.log("Requesting OTP for email:", email);
    try {
      await requestOTP(email);
      setShowOTPInput(true);
      setMessage("OTP sent successfully!");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to send OTP");
    }
  };

  const handleSocialLogin = (provider: SocialProvider) => {
    console.log("Attempting social login with provider:", provider);
    socialLogin(
      { provider, token: "" },
      {
        onSuccess: handleSuccess,
        onError: handleError,
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
              setMessage("");
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
              setMessage("");
              setShowOTPInput(false);
            }}
          >
            OTP
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === "password" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              console.log("Password form submitted");
              const formData = passwordForm.getValues();
              console.log("Form data:", formData);
              handlePasswordSubmit(formData);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                {...passwordForm.register("email")}
              />
              {passwordForm.errors.email && (
                <p className="text-sm text-red-500">
                  {passwordForm.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                {...passwordForm.register("password")}
              />
              {passwordForm.errors.password && (
                <p className="text-sm text-red-500">
                  {passwordForm.errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  {...passwordForm.register("rememberMe")}
                />
                <label
                  htmlFor="rememberMe"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </label>
              </div>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              onClick={() => console.log("Sign in button clicked")}
            >
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
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              console.log("OTP form submitted");
              const formData = otpForm.getValues();
              console.log("Form data:", formData);
              handleOTPSubmit(formData);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                {...otpForm.register("email")}
              />
              {otpForm.errors.email && (
                <p className="text-sm text-red-500">
                  {otpForm.errors.email.message}
                </p>
              )}
            </div>

            {!showOTPInput ? (
              <Button
                type="button"
                className="w-full"
                disabled={isLoading}
                onClick={() => {
                  const email = otpForm.watch("email");
                  if (email) {
                    handleRequestOTP(email);
                  } else {
                    setMessage("Please enter your email address");
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
                <Input
                  type="text"
                  placeholder="Enter OTP"
                  maxLength={6}
                  {...otpForm.register("otp")}
                />
                {otpForm.errors.otp && (
                  <p className="text-sm text-red-500">
                    {otpForm.errors.otp.message}
                  </p>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMeOTP"
                    {...otpForm.register("rememberMe")}
                  />
                  <label
                    htmlFor="rememberMeOTP"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remember me
                  </label>
                </div>

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
                    const email = otpForm.watch("email");
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
        )}

        {message && (
          <div
            className={`mt-4 p-3 rounded-md ${
              message.toLowerCase().includes("success")
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">
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
                d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
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
