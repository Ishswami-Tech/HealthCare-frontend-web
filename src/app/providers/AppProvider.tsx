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
import { NotificationInitializer } from "@/components/notifications/NotificationInitializer";
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Application Error
        </h1>
        <p className="text-gray-600 mb-6">
          {error ? sanitizeErrorMessage(error) : ERROR_MESSAGES.UNKNOWN_ERROR}
        </p>
        <Button onClick={resetErrorBoundary} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
            <h3 className="font-semibold text-sm text-gray-900 mb-2">
              Error Details:
            </h3>
            <pre className="text-xs text-gray-600 overflow-auto whitespace-pre-wrap">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/20 flex items-center justify-center">
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
                    <NotificationInitializer />
                    {children}
                    <Toaster
                      richColors
                      position="top-right"
                      expand={false}
                      visibleToasts={4}
                      closeButton
                      toastOptions={{
                        duration: 4000,
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
