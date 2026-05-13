"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { ERROR_MESSAGES } from "@/lib/config/config";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 px-4 py-10">
      <div className="w-full max-w-md rounded-[1.75rem] border border-border/80 bg-card/95 p-6 text-center shadow-xl ring-1 ring-border/30 sm:p-8">
        <div className="mb-8">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="mb-8 text-muted-foreground">
            {sanitizeErrorMessage(error) || ERROR_MESSAGES.UNKNOWN_ERROR}
          </p>
        </div>

        <div className="space-y-4">
          <Button onClick={reset} className="w-full" asChild={false}>
            <span className="flex items-center justify-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </span>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/" className="flex items-center justify-center">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 rounded-2xl border border-border/80 bg-muted/35 p-4 text-left">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Error Details (Development Only):
            </h3>
            <pre className="overflow-auto text-xs text-muted-foreground">
              {error.message}
            </pre>
            {error.digest && (
              <p className="mt-2 text-xs text-muted-foreground">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="mt-10 text-sm text-muted-foreground">
          <p>
            Need help? Contact our{" "}
            <Link href="/contact" className="text-primary hover:underline">
              support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
