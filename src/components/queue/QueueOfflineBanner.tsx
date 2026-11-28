"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Note } from "@/components/tbd";

/**
 * AsOffline: shown while the browser has no network. The list on screen is the last one loaded;
 * new check-ins and the doctor's calls may be out of date until the connection returns.
 */
export function QueueOfflineBanner({ onRetry }: { onRetry?: () => void }) {
  return (
    <Note tone="amber" icon={WifiOff} className="[&>div]:flex-1">
      <div role="status" className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-bold">You are offline</span>
          <span>Showing the last list loaded. New check-ins and the doctor&apos;s calls appear when the connection is back.</span>
        </span>
        {onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            Retry now
          </Button>
        ) : null}
      </div>
    </Note>
  );
}
