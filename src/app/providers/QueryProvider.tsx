"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { toast } from "sonner";

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
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
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

              // Retry up to 3 times for server errors (5xx) and network errors
              return failureCount < 3;
            },
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
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

              // Handle auth errors globally
              if (apiError?.response?.status === 401) {
                toast.error("Session expired. Please login again.");
                // Use router instead of window.location for better UX
                setTimeout(() => {
                  window.location.href = "/auth/login";
                }, 1000);
                return;
              }

              // Handle other common errors
              if (apiError?.response?.status === 403) {
                toast.error(
                  "You don't have permission to perform this action."
                );
                return;
              }

              if (apiError?.response?.status === 429) {
                toast.error("Too many requests. Please try again later.");
                return;
              }

              // Generic error message
              const errorMessage =
                apiError?.response?.data?.message ||
                apiError?.message ||
                "An unexpected error occurred";
              toast.error(errorMessage);
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
