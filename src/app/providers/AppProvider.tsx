"use client";

import { ThemeProvider } from "next-themes";
import { LoadingOverlayProvider } from "@/app/providers/LoadingOverlayContext";
import { GlobalLoadingOverlayListener } from "@/app/providers/GlobalLoadingOverlayListener";
import QueryProvider from "@/app/providers/QueryProvider";
import { Toaster } from "sonner";
import { ReactNode } from "react";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <LoadingOverlayProvider>
        <QueryProvider>
          <GlobalLoadingOverlayListener />
          {children}
          <Toaster richColors />
        </QueryProvider>
      </LoadingOverlayProvider>
    </ThemeProvider>
  );
}
