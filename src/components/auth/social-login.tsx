"use client";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Google client ID from environment variable
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  console.error(
    "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not defined in environment variables"
  );
}

// Add type definitions for Google OAuth
declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            context?: string;
            ux_mode?: string;
            login_uri?: string;
            allowed_parent_origin?: string;
            itp_support?: boolean;
            native_callback?: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              type?: "standard" | "icon";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: number;
              text?: string;
            }
          ) => void;
          cancel: () => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface SocialLoginProps {
  onError?: (error: Error) => void;
  className?: string;
  onSuccess?: () => void;
  isLoading?: boolean;
  onLoadingStateChange?: (isLoading: boolean) => void;
}

export function SocialLogin({
  onError,
  className,
  onSuccess,
  isLoading,
  onLoadingStateChange,
}: SocialLoginProps) {
  const router = useRouter();
  const { googleLogin, isGoogleLoggingIn } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Use either the passed isLoading prop or the internal isGoogleLoggingIn state
  const isButtonDisabled = isLoading || isGoogleLoggingIn;

  // Notify parent component when loading state changes
  useEffect(() => {
    onLoadingStateChange?.(isGoogleLoggingIn);
  }, [isGoogleLoggingIn, onLoadingStateChange]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      const error = new Error("Google Client ID is not configured");
      console.error(error.message);
      onError?.(error);
      toast.error("Google login is not configured");
      return;
    }

    // Define handleGoogleResponse inside useEffect to avoid dependency issues
    const handleGoogleResponse = async (response: { credential: string }) => {
      try {
        if (!response.credential) {
          const error = new Error("No credential received from Google");
          console.error(error.message);
          onError?.(error);
          toast.error("Failed to get credentials from Google");
          return;
        }

        // Show loading toast
        toast.loading("Signing in with Google...", {
          id: "google-login",
        });

        await googleLogin(response.credential);

        // Dismiss loading toast and show success
        toast.dismiss("google-login");
        toast.success("Successfully signed in with Google!");

        // Handle redirection
        const searchParams = new URLSearchParams(window.location.search);
        const callbackUrl = searchParams.get("callbackUrl");

        // Get the redirect URL from the search params or use a default
        const redirectUrl =
          callbackUrl && !callbackUrl.includes("/auth/")
            ? callbackUrl
            : "/patient/dashboard"; // Default to patient dashboard

        onSuccess?.();
        router.push(redirectUrl);
      } catch (error) {
        // Dismiss loading toast and show error
        toast.dismiss("google-login");

        console.error("Google login error:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "string"
            ? error
            : "Google login failed";

        onError?.(new Error(errorMessage));
        toast.error(errorMessage);
      }
    };

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    let isScriptLoaded = false;

    script.onload = () => {
      isScriptLoaded = true;
      const currentOrigin = window.location.origin;

      if (window.google?.accounts?.id && googleButtonRef.current) {
        try {
          // Get the current URL parameters
          const searchParams = new URLSearchParams(window.location.search);
          const callbackUrl = searchParams.get("callbackUrl");

          // Construct the login_uri with the callbackUrl if present
          const loginUri = new URL("/auth/callback/google", currentOrigin);
          if (callbackUrl) {
            loginUri.searchParams.set("callbackUrl", callbackUrl);
          }

          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
            auto_select: false,
            context: "signin",
            ux_mode: "popup",  // TODO: change to "redirect"
            itp_support: true,
            login_uri: loginUri.toString(),
            allowed_parent_origin: currentOrigin,
            native_callback: handleGoogleResponse,
          });

          // Render the Google Sign In button
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: 250,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to initialize Google Sign-In";
          console.error("Failed to initialize Google OAuth:", error);
          onError?.(new Error(errorMessage));
          toast.error(errorMessage);
        }
      } else {
        const error = new Error("Google OAuth object not available");
        onError?.(error);
        toast.error("Google login is not available");
      }
    };

    script.onerror = () => {
      console.error("Failed to load Google OAuth script");
      const error = new Error("Failed to load Google Sign-In");
      onError?.(error);
      toast.error("Failed to load Google login");
    };

    document.head.appendChild(script);

    return () => {
      // Enhanced cleanup
      if (isScriptLoaded && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch (error) {
          console.error("Error during Google Sign-In cleanup:", error);
        }
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [onError, router, onSuccess, googleLogin]);

  return (
    <div className={cn("flex flex-col gap-4 w-full", className)}>
      <div
        ref={googleButtonRef}
        className={cn(
          "flex items-center justify-center w-full min-h-[40px]",
          isButtonDisabled && "opacity-50 cursor-not-allowed"
        )}
        role="button"
        aria-label="Sign in with Google"
      />
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
    </div>
  );
}
