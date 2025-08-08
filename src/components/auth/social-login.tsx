"use client";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Google client ID from environment variable
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Constants
const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";
const DEFAULT_REDIRECT_URL = "/patient/dashboard";

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

  // Memoized Google response handler
  const handleGoogleResponse = useCallback(
    async (response: { credential: string }) => {
      try {
        if (!response.credential) {
          throw new Error("No credential received from Google");
        }

        const toastId = toast.loading("Signing in with Google...");

        await googleLogin(response.credential);

        toast.dismiss(toastId);
        toast.success("Successfully signed in with Google!");

        // Handle redirection
        const searchParams = new URLSearchParams(window.location.search);
        const callbackUrl = searchParams.get("callbackUrl");
        const redirectUrl =
          callbackUrl && !callbackUrl.includes("/auth/")
            ? callbackUrl
            : DEFAULT_REDIRECT_URL;

        onSuccess?.();
        router.push(redirectUrl);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Google login failed";

        if (process.env.NODE_ENV === "development") {
          console.error("Google login error:", error);
        }

        onError?.(new Error(errorMessage));
        toast.error(errorMessage);
      }
    },
    [googleLogin, router, onSuccess, onError]
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      const error = new Error("Google Client ID is not configured");
      if (process.env.NODE_ENV === "development") {
        console.error(error.message);
      }
      onError?.(error);
      toast.error("Google login is not configured");
      return;
    }

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
            ux_mode: "popup", // TODO: change to "redirect"
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
          if (process.env.NODE_ENV === "development") {
            console.error("Failed to initialize Google OAuth:", error);
          }
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
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to load Google OAuth script");
      }
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
          if (process.env.NODE_ENV === "development") {
            console.error("Error during Google Sign-In cleanup:", error);
          }
        }
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [handleGoogleResponse, onError]);

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
