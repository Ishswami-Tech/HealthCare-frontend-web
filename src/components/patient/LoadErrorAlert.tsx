"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LoadErrorAlertProps {
  /** Plain-words headline, for example "We could not refresh your visits." */
  title: string;
  /** Optional detail line (the sanitized error). */
  detail?: string | null | undefined;
  onRetry: () => void;
  retrying?: boolean;
  className?: string;
}

/**
 * Inline `role="alert"` banner with a Retry button, the same pattern as the Billing screen.
 * Shown when a patient screen's API call fails so stale data is never presented as current.
 */
export function LoadErrorAlert({ title, detail, onRetry, retrying = false, className }: LoadErrorAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-2xl border border-dashed border-[#fcd34d] bg-[#fffbeb] px-4 py-3.5 text-[13px] text-[#92400e] dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200",
        className,
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <AlertCircle className="size-[22px] shrink-0 text-[#d97706] dark:text-amber-300" strokeWidth={2} aria-hidden="true" />
        <span className="flex min-w-0 flex-col">
          <strong className="text-sm font-bold">{title}</strong>
          {detail ? <span className="break-words">{detail}</span> : null}
        </span>
      </span>
      <Button variant="outline" size="md" onClick={onRetry} disabled={retrying}>
        {retrying ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        Retry
      </Button>
    </div>
  );
}
