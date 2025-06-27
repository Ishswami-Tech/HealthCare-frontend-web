"use client";

import React, { createContext, useContext, useState } from "react";

interface LoadingOverlayContextType {
  show: boolean;
  setShow: (v: boolean) => void;
}

const LoadingOverlayContext = createContext<LoadingOverlayContextType>({
  show: false,
  setShow: () => {},
});

export function LoadingOverlayProvider({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <LoadingOverlayContext.Provider value={{ show, setShow }}>
      {children}
      {show && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <span className="animate-spin w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full mb-4" />
          <span className="text-lg font-semibold text-red-700">Logging out...</span>
        </div>
      )}
    </LoadingOverlayContext.Provider>
  );
}

export function useLoadingOverlay() {
  return useContext(LoadingOverlayContext);
} 