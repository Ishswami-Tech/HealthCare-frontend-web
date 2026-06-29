"use client";

/**
 *… App Provider
 * Root provider stack for the application
 * NO loading overlay - uses inline loading states
 */

import { ThemeProvider } from "next-themes";
import QueryProvider from "@/app/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import { ReactNode, Suspense } from "react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageProvider } from "@/lib/i18n/context";
import { WebSocketProvider } from "@/app/providers/WebSocketProvider";
import { StoreProvider } from "@/stores";
import { PushNotificationProvider } from "@/app/providers/PushNotificationProvider";
import { HealthStatusProvider } from "@/app/providers/HealthStatusProvider";
import { useAuthRefreshScheduler } from "@/hooks/auth/useAuthRefreshScheduler";
import { ERROR_MESSAGES } from "@/lib/config/config";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";

/**
 * AuthRefreshSchedulerHost
 *
 * Mounts the proactive JWT refresh scheduler once at the very top of the
 * provider tree so it runs even before any dashboard mounts. Because the
 * scheduler reads from `useAuthStore`, it must be a child of `StoreProvider`.
 */
function AuthRefreshSchedulerHost(): null {
  useAuthRefreshScheduler();
  return null;
}

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error?: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-8 text-destructive" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          Application Error
        </h1>
        <p className="mb-6 text-muted-foreground">
          {error ? sanitizeErrorMessage(error) : ERROR_MESSAGES.UNKNOWN_ERROR}
        </p>
        <Button onClick={resetErrorBoundary} className="w-full">
          <RefreshCw className="size-4 mr-2" />
          Try Again
        </Button>
        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 rounded-lg border bg-muted p-4 text-left">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Error Details:
            </h3>
            <pre className="overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
              {error?.message || "Unknown error"}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error("App Provider Error:", error, errorInfo);
      }}
    >
      <Suspense fallback={null}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <StoreProvider>
              <AuthRefreshSchedulerHost />
              <QueryProvider>
                <WebSocketProvider
                  autoConnect={true}
                  enableRetry={true}
                  enableErrorBoundary={true}
                >
                  <PushNotificationProvider>
                    <HealthStatusProvider />
                    {children}
                    <Toaster
                      richColors
                      position="top-right"
                      expand={false}
                      visibleToasts={4}
                      closeButton
                      toastOptions={{
                        duration: 5000,
                        className: "text-sm",
                      }}
                    />
                  </PushNotificationProvider>
                </WebSocketProvider>
              </QueryProvider>
            </StoreProvider>
          </LanguageProvider>
        </ThemeProvider>
      </Suspense>
    </ErrorBoundary>
  );
}


