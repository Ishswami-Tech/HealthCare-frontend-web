"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** "14:05:09" in India time; "" before the first answer. */
export function freshnessTimeLabel(updatedAt: number): string {
  if (!updatedAt || !Number.isFinite(updatedAt)) return "";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  }).format(new Date(updatedAt));
}

interface FreshnessProps {
  /** When the list last arrived from the server (ms since epoch; 0 = not yet). */
  updatedAt: number;
  /** A refresh is running (first load or background). */
  refreshing?: boolean;
  onRefresh: () => void;
  className?: string;
}

/**
 * "Updated 14:05:09 · Refresh" for a live board, so a stale page never looks settled: the
 * pharmacist sees when the list last came from the server and can pull it again.
 */
export function Freshness({ updatedAt, refreshing = false, onRefresh, className }: FreshnessProps) {
  const time = freshnessTimeLabel(updatedAt);
  return (
    <span className={cn("inline-flex items-center gap-2 text-xs font-semibold text-ink-muted", className)}>
      <span role="status" aria-live="polite">
        {time ? `Updated ${time}` : refreshing ? "Updating…" : "Not loaded yet"}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 px-2.5 text-xs font-bold has-[>svg]:px-2.5"
        onClick={onRefresh}
        disabled={refreshing}
        aria-label="Refresh the list now"
      >
        <RefreshCw className={cn("size-[13px]", refreshing && "animate-spin")} aria-hidden="true" />
        Refresh
      </Button>
    </span>
  );
}
