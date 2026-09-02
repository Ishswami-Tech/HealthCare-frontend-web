"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useCallback, useState } from "react";
import { InlineLoader } from "@/components/ui/loading";

// Google client ID from environment variable
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

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
  clinicId?: string | undefined;
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
  clinicId,
  showDivider = true,
}: SocialLoginProps & { showDivider?: boolean }) {
  const { googleLogin, isGoogleLoggingIn } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const clientConfigError = GOOGLE_CLIENT_ID ? null : "Google sign-in is not configured.";

  // Use either the passed isLoading prop or the internal isGoogleLoggingIn state
  const isButtonDisabled = isLoading || isGoogleLoggingIn;

  // Memoized Google response handler
  const handleGoogleResponse = useCallback(
    async (response: { credential: string }) => {
      try {
        if (!response.credential) {
          throw new Error("No credential received from Google");
        }
        await googleLogin(response.credential, clinicId);
        onSuccess?.();
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Google login error:", error);
        }

        onError?.(error instanceof Error ? error : new Error("Google login failed"));
      }
    },
    [clinicId, googleLogin, onSuccess, onError]
  );

  useEffect(() => {
    isMountedRef.current = true;

    if (!GOOGLE_CLIENT_ID) {
      if (process.env.NODE_ENV === "development") {
        console.error("Google Client ID is not configured");
      }
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
        setIdentityError(
          error instanceof Error ? error.message : "Failed to initialize Google Sign-In"
        );
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

  const displayError = identityError;

  const handleManualGoogleClick = () => {
    if (!GOOGLE_CLIENT_ID) {
      onError?.(new Error("Google sign-in is not configured for this environment."));
      return;
    }
  };

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {GOOGLE_CLIENT_ID ? (
        <div
          className={cn(
            "group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-2xs transition-all duration-200",
            "hover:border-slate-300 hover:shadow-xs",
            "dark:border-slate-700/80 dark:bg-slate-800/60 dark:hover:border-slate-600",
            isButtonDisabled && "opacity-60"
          )}
          aria-busy={isButtonDisabled}
        >
          <div
            ref={googleButtonRef}
            className={cn(
              "flex items-center justify-center w-full min-h-[44px] rounded-lg",
              isButtonDisabled && "pointer-events-none"
            )}
          />
          {isButtonDisabled && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/40 backdrop-blur-[1px]">
              <InlineLoader className="text-muted-foreground" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleManualGoogleClick}
          className={cn(
            "group relative flex h-[50px] w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-semibold text-slate-900 shadow-sm transition-all duration-200",
            "hover:border-slate-300 hover:bg-slate-50/80 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800 hover:shadow-xs",
            "active:scale-[0.99]",
            isButtonDisabled && "opacity-60 pointer-events-none"
          )}
        >
          <svg className="size-4.5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
      )}

      {displayError && (
        <p className="px-1 text-center text-xs text-destructive animate-in fade-in">{displayError}</p>
      )}

      {showDivider && (
        <div className="relative my-0.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200/80 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10.5px] uppercase font-bold tracking-wider">
            <span className="rounded-full border border-slate-200 bg-white px-3 text-[12px] font-medium tracking-normal text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              OR
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
