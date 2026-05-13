"use client";

/**
 * ✅ App Provider
 * Root provider stack for the application
 * NO loading overlay - uses inline loading states
 */

import { ThemeProvider } from "next-themes";
import QueryProvider from "@/app/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import { ReactNode, Suspense } from "react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { LoadingSpinner } from "@/components/ui/loading";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageProvider } from "@/lib/i18n/context";
import { WebSocketProvider } from "@/app/providers/WebSocketProvider";
import { StoreProvider } from "@/stores";
import { PushNotificationProvider } from "@/app/providers/PushNotificationProvider";
import { HealthStatusProvider } from "@/app/providers/HealthStatusProvider";
import { ERROR_MESSAGES } from "@/lib/config/config";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error?: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 px-4 py-10">
      <div className="w-full max-w-md rounded-[1.75rem] border border-border/80 bg-card/95 p-6 text-center shadow-xl ring-1 ring-border/30 sm:p-8">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Application Error
        </h1>
        <p className="mb-6 text-muted-foreground">
          {error ? sanitizeErrorMessage(error) : ERROR_MESSAGES.UNKNOWN_ERROR}
        </p>
        <Button onClick={resetErrorBoundary} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 rounded-2xl border border-border/80 bg-muted/35 p-4 text-left">
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

function AppProviderFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 px-4">
      <LoadingSpinner size="lg" text="Initializing..." center />
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
      <Suspense fallback={<AppProviderFallback />}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <StoreProvider>
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
