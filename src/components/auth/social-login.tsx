"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

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
            ux_mode?: string;
            allowed_parent_origin?: string | string[];
            itp_support?: boolean;
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
          prompt: () => void;
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

  useEffect(() => {
    // Initialize Google OAuth
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    console.log("Setting up Google OAuth script...");

    script.onload = () => {
      console.log("Google OAuth script loaded");
      const currentOrigin = window.location.origin;
      console.log("Current origin:", currentOrigin);
      
      // Use environment variable for client ID
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID;
      console.log("Client ID being used:", clientId);

      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleResponse,
            auto_select: false,
            context: "signin",
            ux_mode: "popup",
            itp_support: true,
            allowed_parent_origin: [
              "http://localhost:3000",
              "https://ishswami.in",
              "https://www.ishswami.in"
            ]
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
    };
  }, []);

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

  const handleGoogleLogin = () => {
    try {
      console.log("Google login button clicked");

      if (!window.google?.accounts?.id) {
        console.error("Google OAuth not initialized");
        throw new Error("Google OAuth not initialized");
      }

      console.log("Prompting Google login...");
      window.google.accounts.id.prompt();
    } catch (error) {
      console.error("Google login prompt error:", error);
      onError?.(
        error instanceof Error
          ? error
          : new Error("Failed to initialize Google login")
      );
    }
  };

  const handleAppleLogin = async () => {
    try {
      // In a real implementation, you would get the token from Apple OAuth
      // For now, we'll pass a dummy token
      await appleLogin("dummy-apple-token");
      // The onSuccess callback will be handled by the useAuth hook
    } catch (error) {
      onError?.(
        error instanceof Error ? error : new Error("Apple login failed")
      );
    }
  };

  const isDisabled = isLoading || isGoogleLoggingIn || isAppleLoggingIn;

  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={isDisabled}
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
        onClick={handleAppleLogin}
        disabled={isDisabled}
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14.94 5.19A4.38 4.38 0 0 0 16 2.5a4.38 4.38 0 0 0-2.91 1.52 4.13 4.13 0 0 0-1.03 2.96c1.08 0 2.03-.38 2.88-1.79M17.46 12.63c.06 3.03 2.65 4.03 2.68 4.05a11.32 11.32 0 0 1-1.45 2.97c-.87 1.27-1.78 2.53-3.21 2.55-1.4.03-1.86-.83-3.46-.83-1.61 0-2.11.81-3.44.86-1.38.05-2.43-1.37-3.32-2.64-1.81-2.6-3.2-7.37-1.33-10.59a5.16 5.16 0 0 1 4.35-2.64c1.36-.03 2.64.91 3.47.91.83 0 2.38-1.13 4.02-.96.68.03 2.6.28 3.83 2.07-.1.06-2.29 1.34-2.26 4" />
        </svg>
        Apple
      </Button>
    </div>
  );
}
