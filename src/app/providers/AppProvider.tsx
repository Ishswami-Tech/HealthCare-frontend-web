"use client";

import { ThemeProvider } from "next-themes";
import { LoadingOverlayProvider } from "@/app/providers/LoadingOverlayContext";
import { GlobalLoadingOverlayListener } from "@/app/providers/GlobalLoadingOverlayListener";
import QueryProvider from "@/app/providers/QueryProvider";
import { Toaster } from "sonner";
import { ReactNode, Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeContextProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/lib/i18n/context";
import { WebSocketProvider } from "@/components/websocket/WebSocketProvider";
import { StoreProvider } from "@/stores";
import { PushNotificationProvider } from "@/components/push-notifications/PushNotificationProvider";

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
          Something went wrong in the application. Please try refreshing the
          page.
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Initializing Application...
        </h2>
        <p className="text-gray-600">
          Please wait while we set up your experience
        </p>
      </div>
    </div>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={ErrorFallback}
      onError={(error, errorInfo) => {
        // Log error to monitoring service in production
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
          <ThemeContextProvider>
            <LanguageProvider>
              <StoreProvider>
                <LoadingOverlayProvider>
                  <QueryProvider>
                    <WebSocketProvider
                      autoConnect={true}
                      enableRetry={true}
                      enableErrorBoundary={true}
                    >
                      <PushNotificationProvider>
                        <GlobalLoadingOverlayListener />
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
                </LoadingOverlayProvider>
              </StoreProvider>
            </LanguageProvider>
          </ThemeContextProvider>
        </ThemeProvider>
      </Suspense>
    </ErrorBoundary>
  );
}
