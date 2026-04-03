"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { showSuccessToast, showErrorToast, showLoadingToast, dismissToast, TOAST_IDS } from "@/hooks/utils/use-toast";

// Google client ID from environment variable
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Constants
// ✅ Using actual URL (route groups don't appear in URLs)
const DEFAULT_REDIRECT_URL = "/patient/dashboard";
const GOOGLE_GSI_SCRIPT_ID = "google-gsi-client-script";

let googleScriptPromise: Promise<void> | null = null;

interface GoogleIdentityState {
  initialized: boolean;
  responseHandler: ((response: { credential: string }) => void) | null;
}

// Add type definitions for Google OAuth
declare global {
  interface Window {
    __googleIdentityState?: GoogleIdentityState;
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

function getGoogleIdentityState(): GoogleIdentityState {
  if (typeof window === "undefined") {
    return {
      initialized: false,
      responseHandler: null,
    };
  }

  window.__googleIdentityState ??= {
    initialized: false,
    responseHandler: null,
  };

  return window.__googleIdentityState;
}

function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_GSI_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Google Sign-In")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_GSI_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Sign-In"));
    document.head.appendChild(script);
  }).catch(error => {
    googleScriptPromise = null;
    throw error;
  });

  return googleScriptPromise;
}

function initializeGoogleIdentity(clientId: string): void {
  if (typeof window === "undefined" || !window.google?.accounts?.id) {
    return;
  }

  const googleIdentityState = getGoogleIdentityState();

  if (googleIdentityState.initialized) {
    return;
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: response => getGoogleIdentityState().responseHandler?.(response),
    auto_select: false,
    context: "signin",
    ux_mode: "popup",
    itp_support: true,
    allowed_parent_origin: window.location.origin,
  });

  googleIdentityState.initialized = true;
}

export function SocialLogin({
  onError,
  className,
  onSuccess,
  isLoading,
  onLoadingStateChange,
  showDivider = true,
}: SocialLoginProps & { showDivider?: boolean }) {
  const router = useRouter();
  const { googleLogin, isGoogleLoggingIn } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  // Use either the passed isLoading prop or the internal isGoogleLoggingIn state
  const isButtonDisabled = isLoading || isGoogleLoggingIn;

  // Notify parent component when loading state changes
  useEffect(() => {
    onLoadingStateChange?.(isGoogleLoggingIn);
  }, [isGoogleLoggingIn, onLoadingStateChange]);

  // Memoized Google response handler
  const handleGoogleResponse = useCallback(
    async (response: { credential: string }) => {
      const toastId = TOAST_IDS.AUTH.SOCIAL_LOGIN;
      try {
        if (!response.credential) {
          throw new Error("No credential received from Google");
        }

        showLoadingToast("Signing in with Google...", toastId);

        await googleLogin(response.credential);

        dismissToast(toastId);
        showSuccessToast("Successfully signed in with Google!", {
          id: toastId,
        });

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
        dismissToast(toastId);
        
        if (process.env.NODE_ENV === "development") {
          console.error("Google login error:", error);
        }

        onError?.(error instanceof Error ? error : new Error("Google login failed"));
        showErrorToast(error, {
          id: toastId,
        });
      }
    },
    [googleLogin, router, onSuccess, onError]
  );

  useEffect(() => {
    isMountedRef.current = true;

    if (!GOOGLE_CLIENT_ID) {
      const error = new Error("Google Client ID is not configured");
      if (process.env.NODE_ENV === "development") {
        console.error(error.message);
      }
      onError?.(error);
      showErrorToast("Google login is not configured", {
        id: TOAST_IDS.AUTH.SOCIAL_LOGIN,
      });
      return;
    }

    getGoogleIdentityState().responseHandler = handleGoogleResponse;

    void loadGoogleIdentityScript()
      .then(() => {
        if (!isMountedRef.current || !googleButtonRef.current || !window.google?.accounts?.id) {
          return;
        }

        initializeGoogleIdentity(GOOGLE_CLIENT_ID);

        googleButtonRef.current.innerHTML = "";

        const buttonWidth = Math.max(
          220,
          Math.min(360, (googleButtonRef.current.clientWidth || 280) - 8)
        );

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: buttonWidth,
        });
      })
      .catch(error => {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to initialize Google OAuth:", error);
        }
        const resolvedError =
          error instanceof Error ? error : new Error("Failed to initialize Google Sign-In");
        onError?.(resolvedError);
        showErrorToast(resolvedError.message, {
          id: TOAST_IDS.AUTH.SOCIAL_LOGIN,
        });
      });

    return () => {
      isMountedRef.current = false;

      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = "";
      }

      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, [handleGoogleResponse, onError]);

  return (
    <div className={cn("flex flex-col gap-4 w-full", className)}>
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2 shadow-sm transition-all duration-200",
          "hover:border-slate-300 hover:shadow-md",
          "dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-slate-600",
          isButtonDisabled && "opacity-60"
        )}
      >
        <div
          ref={googleButtonRef}
          className={cn(
            "flex items-center justify-center w-full min-h-[46px] rounded-xl",
            isButtonDisabled && "cursor-not-allowed"
          )}
          role="button"
          aria-label="Sign in with Google"
        />
      </div>
      {showDivider && (
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
      )}
    </div>
  );
}
