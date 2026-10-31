"use client";

import { useEffect } from "react";

/**
 * Keeps `document.title` at `title` while the caller is mounted (null = leave it alone).
 *
 * Staff routes are client pages without segment metadata, so Next's root title would otherwise
 * stay on every tab. Next may rewrite the <title> after our effect (streamed metadata on a soft
 * navigation), so a head observer re-applies the title when it drifts.
 */
export function useDocumentTitle(title: string | null | undefined): void {
  useEffect(() => {
    if (!title || typeof document === "undefined") return;
    const apply = () => {
      if (document.title !== title) document.title = title;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [title]);
}
