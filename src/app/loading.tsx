/**
 * ✅ Next.js Route Loading UI
 * Uses shadcn Spinner - single source of truth
 * Shows during page transitions (Suspense boundary)
 */

import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Spinner className="size-10 text-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}
