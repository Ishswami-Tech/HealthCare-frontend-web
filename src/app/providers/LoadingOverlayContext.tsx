"use client";

import React, { createContext, useContext, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

export type LoadingOverlayVariant = "default" | "logout" | "login" | "register";

interface LoadingOverlayContextType {
  show: boolean;
  variant: LoadingOverlayVariant;
  message?: string;
  setOverlay: (opts: { show: boolean; variant?: LoadingOverlayVariant; message?: string }) => void;
}

const variantConfig: Record<LoadingOverlayVariant, { color: string; message: string }> = {
  default: { color: "text-blue-600 border-blue-600", message: "Loading..." },
  logout: { color: "text-red-600 border-red-600", message: "Logging out..." },
  login: { color: "text-green-600 border-green-600", message: "Logging in..." },
  register: { color: "text-purple-600 border-purple-600", message: "Registering..." },
};

const LoadingOverlayContext = createContext<LoadingOverlayContextType>({
  show: false,
  variant: "default",
  message: undefined,
  setOverlay: () => {},
});

export function LoadingOverlayProvider({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [variant, setVariant] = useState<LoadingOverlayVariant>("default");
  const [message, setMessage] = useState<string | undefined>(undefined);

  const setOverlay = ({ show, variant, message }: { show: boolean; variant?: LoadingOverlayVariant; message?: string }) => {
    setShow(show);
    if (variant) setVariant(variant);
    if (message !== undefined) setMessage(message);
    else if (variant) setMessage(variantConfig[variant].message);
  };

  const config = variantConfig[variant] || variantConfig.default;

  return (
    <LoadingOverlayContext.Provider value={{ show, variant, message, setOverlay }}>
      {children}
      {show && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <LoadingSpinner color={config.color} size="h-12 w-12" />
          <span className={`text-lg font-semibold ${config.color}`}>{message || config.message}</span>
        </div>
      )}
    </LoadingOverlayContext.Provider>
  );
}

export function useLoadingOverlay() {
  return useContext(LoadingOverlayContext);
} 