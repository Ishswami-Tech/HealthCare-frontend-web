"use client";

import { useEffect, useState } from "react";
import { LoadErrorAlert } from "@/components/patient/LoadErrorAlert";

/** How long a skeleton may show before the screen says it is still loading (UD-05). */
export const SLOW_LOAD_NOTICE_DELAY_MS = 8_000;

interface SlowLoadNoticeProps {
  /** True while the content is still loading; the timer restarts when it turns true again. */
  loading: boolean;
  /** Retry the load. Defaults to reloading the page. */
  onRetry?: () => void;
  retrying?: boolean;
  delayMs?: number;
  className?: string;
}

/**
 * Shown under a skeleton that has been on screen for `delayMs`: says the screen is still
 * loading and offers Retry, so a busy desk is not left guessing (WCAG 4.1.3). Renders nothing
 * before the delay or once loading ends.
 */
export function SlowLoadNotice({
  loading,
  onRetry,
  retrying = false,
  delayMs = SLOW_LOAD_NOTICE_DELAY_MS,
  className,
}: SlowLoadNoticeProps) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!loading) {
      setSlow(false);
      return;
    }
    const timer = window.setTimeout(() => setSlow(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [loading, delayMs]);

  if (!loading || !slow) return null;

  return (
    <LoadErrorAlert
      title="Still loading…"
      detail="This is taking longer than usual. You can keep waiting or retry."
      onRetry={onRetry ?? (() => window.location.reload())}
      retrying={retrying}
      {...(className ? { className } : {})}
    />
  );
}
