"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { LIBRARY_FOCUS, LibraryCover } from "./LibraryBits";
import type { LibraryVideoSource } from "./library.logic";

/**
 * Plays a library video in the page:
 *  - a video file gets the browser's own player (`<video controls>`);
 *  - YouTube and Vimeo links get their embedded player, loaded only after the patient presses play;
 *  - any other link is not embedded.
 * If the browser cannot play it here (the file fails, or the site's content security policy
 * blocks the player), the picture stays and the video opens in a new tab instead.
 */
export function LibraryVideoPlayer({
  source,
  title,
  posterUrl,
  category,
}: {
  source: LibraryVideoSource;
  title: string;
  posterUrl: string | null;
  category: string;
}) {
  const [started, setStarted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const embedUrl = source.kind === "youtube" || source.kind === "vimeo" ? source.embedUrl : null;

  useEffect(() => {
    if (!embedUrl || !started) return undefined;
    const origin = new URL(embedUrl).origin;
    const onViolation = (event: SecurityPolicyViolationEvent) => {
      if (event.blockedURI && event.blockedURI.startsWith(origin)) setBlocked(true);
    };
    document.addEventListener("securitypolicyviolation", onViolation);
    return () => document.removeEventListener("securitypolicyviolation", onViolation);
  }, [embedUrl, started]);

  const inPage = !blocked && source.kind !== "link";
  const openLabel = source.kind === "youtube" ? "Watch on YouTube" : source.kind === "vimeo" ? "Watch on Vimeo" : "Open the video";

  return (
    <div className="flex flex-col">
      <div className="relative aspect-video w-full overflow-hidden bg-[#0f172a]">
        {inPage && source.kind === "file" ? (
          <video
            src={source.url}
            controls
            playsInline
            preload="metadata"
            {...(posterUrl ? { poster: posterUrl } : {})}
            onError={() => setBlocked(true)}
            className="absolute inset-0 size-full bg-black object-contain"
            aria-label={title}
          />
        ) : inPage && embedUrl && started ? (
          <iframe
            src={embedUrl}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <>
            <LibraryCover
              src={posterUrl}
              category={category}
              isVideo
              showPlay={false}
              eager
              className="absolute inset-0 size-full"
              iconClassName="hidden"
            />
            {inPage ? (
              <button
                type="button"
                onClick={() => setStarted(true)}
                aria-label={`Play video: ${title}`}
                className={cn("group absolute inset-0 flex items-center justify-center bg-[rgba(15,23,42,0.18)]", LIBRARY_FOCUS)}
              >
                <PlayBadge />
              </button>
            ) : (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${openLabel} (opens in a new tab): ${title}`}
                className={cn("group absolute inset-0 flex items-center justify-center bg-[rgba(15,23,42,0.18)]", LIBRARY_FOCUS)}
              >
                <PlayBadge />
              </a>
            )}
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-hair px-5 py-2.5 text-[13px] text-ink-muted sm:px-9">
        <span>{inPage ? "Having trouble playing it here?" : "This video opens in a new tab."}</span>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn("inline-flex items-center gap-1.5 rounded-md font-bold text-[#4f46e5] hover:underline dark:text-indigo-300", LIBRARY_FOCUS)}
        >
          {openLabel}
          <ExternalLink className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </div>
  );
}

function PlayBadge() {
  return (
    <span
      className="flex size-16 items-center justify-center rounded-full bg-[rgba(15,23,42,0.78)] text-white shadow-[0_10px_24px_rgba(15,23,42,0.35)] transition-transform group-hover:scale-105"
      aria-hidden="true"
    >
      <Play className="size-7 translate-x-0.5 fill-current" strokeWidth={2} />
    </span>
  );
}
