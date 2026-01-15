/**
 * ✅ Consolidated Loading Overlay Provider & Listener
 * Follows DRY, SOLID, KISS principles
 * Uses unified loading components from @/components/ui/loading
 *
 * Combines:
 * - LoadingOverlayProvider: Context and UI rendering
 * - GlobalLoadingOverlayListener: Automatic loading detection
 */

"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { LoadingOverlay } from "@/components/ui/loading";
import { useAppStore, LoadingOverlayVariant } from "@/stores";

interface LoadingOverlayContextType {
  overlay: {
    show: boolean;
    variant: LoadingOverlayVariant;
    message?: string;
  };
  setOverlay: (
    opts: Partial<{
      show: boolean;
      variant: LoadingOverlayVariant;
      message?: string;
    }>
  ) => void;
  clearOverlay: () => void;
}

const LoadingOverlayContext = createContext<LoadingOverlayContextType>({
  overlay: { show: false, variant: "default" },
  setOverlay: () => {},
  clearOverlay: () => {},
});

// ✅ Consolidated variant configuration
const VARIANT_CONFIG: Record<
  LoadingOverlayVariant,
  { color: "primary" | "secondary" | "muted" | string; message: string }
> = {
  default: { color: "primary", message: "Loading..." },
  logout: { color: "primary", message: "Logging out..." },
  login: { color: "primary", message: "Logging in..." },
  register: { color: "primary", message: "Registering..." },
} as const;

export function LoadingOverlayProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const overlay = useAppStore((s) => s.overlay);
  const setOverlay = useAppStore((s) => s.setOverlay);
  const clearOverlay = useAppStore((s) => s.clearOverlay);

  const contextValue = useMemo(
    () => ({ overlay, setOverlay, clearOverlay }),
    [overlay, setOverlay, clearOverlay]
  );

  const config = VARIANT_CONFIG[overlay.variant] || VARIANT_CONFIG.default;
  const displayMessage = overlay.message || config.message;

  return (
    <LoadingOverlayContext.Provider value={contextValue}>
      {children}
      {/* ✅ Use consolidated LoadingOverlay component */}
      <LoadingOverlay
        show={overlay.show}
        text={displayMessage}
        className="z-50"
      />
    </LoadingOverlayContext.Provider>
  );
}

export function useLoadingOverlay() {
  return useContext(LoadingOverlayContext);
}

// ============================================================================
// GLOBAL LOADING OVERLAY LISTENER
// ============================================================================

/**
 * ✅ Global Loading Overlay Listener
 * Simplified version that only handles browser back/forward navigation
 * Page-level components handle their own loading states
 */
export function GlobalLoadingOverlayListener() {
  const { clearOverlay } = useLoadingOverlay();

  // ✅ Use ref to avoid stale closures
  const clearOverlayRef = useRef(clearOverlay);

  // Update ref when function changes
  useEffect(() => {
    clearOverlayRef.current = clearOverlay;
  }, [clearOverlay]);

  // ✅ Hide overlay on mount and keep it hidden
  // Don't add any event listeners that could cause performance issues
  useEffect(() => {
    // Hide overlay immediately on mount
    clearOverlayRef.current();

    return () => {
      clearOverlayRef.current(); // Ensure overlay is hidden on unmount
    };
  }, []); // ✅ Empty deps - only run once on mount

  // ✅ Clear overlay on browser back/forward navigation only
  // NOTE: We do NOT override history.pushState as it interferes with Next.js App Router
  // Next.js App Router uses its own navigation APIs and handles route changes internally
  useEffect(() => {
    if (typeof window === "undefined") {
      return; // No cleanup needed if not in browser
    }

    const handlePopState = () => {
      clearOverlayRef.current();
    };

    // Only listen for browser back/forward buttons (popstate)
    // Do NOT override history.pushState - it breaks Next.js navigation
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return null;
}
