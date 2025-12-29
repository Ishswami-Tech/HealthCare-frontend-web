"use client";

import React, { createContext, useContext, useMemo } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAppStore, LoadingOverlayVariant } from "@/stores/app.store";

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

  const variantConfig: Record<
    LoadingOverlayVariant,
    { color: string; message: string }
  > = {
    default: { color: "text-blue-600 border-blue-600", message: "Loading..." },
    logout: { color: "text-red-600 border-red-600", message: "Logging out..." },
    login: {
      color: "text-green-600 border-green-600",
      message: "Logging in...",
    },
    register: {
      color: "text-purple-600 border-purple-600",
      message: "Registering...",
    },
  };
  const config = variantConfig[overlay.variant] || variantConfig.default;

  return (
    <LoadingOverlayContext.Provider value={contextValue}>
      {children}
      {overlay.show && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <LoadingSpinner color={config.color} size="h-12 w-12" />
          <span className={`text-lg font-semibold ${config.color}`}>
            {overlay.message || config.message}
          </span>
        </div>
      )}
    </LoadingOverlayContext.Provider>
  );
}

export function useLoadingOverlay() {
  return useContext(LoadingOverlayContext);
}
