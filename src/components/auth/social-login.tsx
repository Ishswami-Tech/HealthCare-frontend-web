"use client";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

// Add Google client ID as a constant
const GOOGLE_CLIENT_ID =
  "616510725595-icnj6ql0qie97dp4voi3u9uafbnmhend.apps.googleusercontent.com";

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
        };
      };
    };
  }
}

interface SocialLoginProps {
  onError?: (error: Error) => void;
  isLoading?: boolean;
  className?: string;
}

export function SocialLogin({
  onError,
  isLoading,
  className,
}: SocialLoginProps) {
  const { googleLogin, appleLogin, isGoogleLoggingIn, isAppleLoggingIn } =
    useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    console.log("Setting up Google OAuth script...");

    script.onload = () => {
      console.log("Google OAuth script loaded");
      const currentOrigin = window.location.origin;
      console.log("Current origin:", currentOrigin);
      
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID;
      console.log("Client ID being used:", clientId);

      if (window.google?.accounts?.id && googleButtonRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleResponse,
            auto_select: false,
            context: "signin"
          });

          // Render the Google Sign In button
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: 200
          });

          console.log("Google OAuth initialized successfully");
        } catch (error) {
          console.error("Failed to initialize Google OAuth:", error);
          onError?.(new Error("Failed to initialize Google Sign-In"));
        }
      } else {
        console.error("Google OAuth object not available");
      }
    };

    script.onerror = () => {
      console.error("Failed to load Google OAuth script");
      onError?.(new Error("Failed to load Google Sign-In"));
    };

    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
      // Cleanup Google Sign-In
      window.google?.accounts?.id?.cancel?.();
    };
  }, [onError]);

  const handleGoogleResponse = async (response: { credential: string }) => {
    try {
      console.log("Received Google response");

      if (!response.credential) {
        console.error("No credential received from Google");
        throw new Error("No credential received from Google");
      }

      console.log("Attempting Google login...");
      await googleLogin(response.credential);
      console.log("Google login successful");
    } catch (error) {
      console.error("Google login error:", error);
      onError?.(
        error instanceof Error ? error : new Error("Google login failed")
      );
    }
  };

  const handleAppleLogin = async () => {
    try {
      await appleLogin("dummy-apple-token");
    } catch (error) {
      onError?.(
        error instanceof Error ? error : new Error("Apple login failed")
      );
    }
  };

  const isDisabled = isLoading || isGoogleLoggingIn || isAppleLoggingIn;

  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      <div ref={googleButtonRef} className="flex items-center justify-center" />
      <button
        type="button"
        className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleAppleLogin}
        disabled={isDisabled}
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14.94 5.19A4.38 4.38 0 0 0 16 2.5a4.38 4.38 0 0 0-2.91 1.52 4.13 4.13 0 0 0-1.03 2.96c1.08 0 2.03-.38 2.88-1.79M17.46 12.63c.06 3.03 2.65 4.03 2.68 4.05a11.32 11.32 0 0 1-1.45 2.97c-.87 1.27-1.78 2.53-3.21 2.55-1.4.03-1.86-.83-3.46-.83-1.61 0-2.11.81-3.44.86-1.38.05-2.43-1.37-3.32-2.64-1.81-2.6-3.2-7.37-1.33-10.59a5.16 5.16 0 0 1 4.35-2.64c1.36-.03 2.64.91 3.47.91.83 0 2.38-1.13 4.02-.96.68.03 2.6.28 3.83 2.07-.1.06-2.29 1.34-2.26 4" />
        </svg>
        Sign in with Apple
      </button>
    </div>
  );
}
