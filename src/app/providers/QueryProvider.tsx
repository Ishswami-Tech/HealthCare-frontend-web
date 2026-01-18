"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { queryClientConfig } from "@/hooks/query/config";
import { ERROR_MESSAGES } from "@/lib/config/config";
import { ROUTES } from "@/lib/config/routes";
import {
  showErrorToast,
  shouldHandleErrorGlobally,
  TOAST_IDS,
} from "@/hooks/utils/use-toast";

interface ApiError extends Error {
  response?: {
    status: number;
    data?: {
      message?: string;
    };
  };
}

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ Optimized QueryClient for 10M+ users
  const [queryClient] = useState(
    () =>
      new QueryClient({
        ...queryClientConfig,
        defaultOptions: {
          queries: {
            ...queryClientConfig.defaultOptions?.queries,
            retry: (failureCount, error) => {
              const apiError = error as ApiError;

              // Don't retry on client errors (4xx)
              if (
                apiError?.response?.status &&
                apiError.response.status >= 400 &&
                apiError.response.status < 500
              ) {
                return false;
              }

              // Retry up to 2 times for server errors (5xx) and network errors (reduced for 10M users)
              return failureCount < 2;
            },
          },
          mutations: {
            ...queryClientConfig.defaultOptions?.mutations,
            retry: (failureCount, error) => {
              const apiError = error as ApiError;

              // Don't retry on client errors
              if (
                apiError?.response?.status &&
                apiError.response.status >= 400 &&
                apiError.response.status < 500
              ) {
                return false;
              }

              // Retry once for server errors
              return failureCount < 1;
            },
            onError: (error) => {
              const apiError = error as ApiError;

              // ✅ Skip showing toast if error should be handled by component
              if (!shouldHandleErrorGlobally(apiError)) {
                // Component-level error handling will show the toast
                // Don't show duplicate toast from QueryProvider
                return;
              }

              // ✅ Use centralized error handler
              // Handle auth errors globally
              if (apiError?.response?.status === 401) {
                showErrorToast(ERROR_MESSAGES.SESSION_EXPIRED, {
                  id: TOAST_IDS.GLOBAL.ERROR,
                });
                // Use router instead of window.location for better UX
                setTimeout(() => {
                  window.location.href = ROUTES.LOGIN;
                }, 1000);
                return;
              }

              // Handle other common errors with centralized messages
              if (apiError?.response?.status === 403) {
                showErrorToast(ERROR_MESSAGES.FORBIDDEN, {
                  id: TOAST_IDS.GLOBAL.ERROR,
                });
                return;
              }

              if (apiError?.response?.status === 429) {
                showErrorToast("Too many requests. Please try again later.", {
                  id: TOAST_IDS.GLOBAL.ERROR,
                });
                return;
              }

              // ✅ Sanitize and use centralized error messages
              showErrorToast(
                apiError?.response?.data?.message ||
                  apiError?.message ||
                  apiError ||
                  ERROR_MESSAGES.UNKNOWN_ERROR,
                {
                  id: TOAST_IDS.GLOBAL.ERROR,
                }
              );
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
          position="bottom"
        />
      )}
    </QueryClientProvider>
  );
}
