/**
 * ✅ Next.js Route Loading UI
 * Uses consolidated LoadingSpinner component
 * Follows DRY, SOLID, KISS principles
 */

import { LoadingSpinner } from "@/components/ui/loading";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/20 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" color="primary" text="Loading..." />
        <p className="text-sm text-muted-foreground mt-4">
          Please wait while we prepare your content
        </p>
      </div>
    </div>
  );
}
