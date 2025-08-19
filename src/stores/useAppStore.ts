import { create } from "zustand";
import { persist } from "zustand/middleware";
// import { Theme } from "next-themes/dist/types"; // Remove this import
import { Session } from "@/types/auth.types";
import { QueryClient } from "@tanstack/react-query";

// Define Theme type as string union
export type Theme = "light" | "dark" | "system";
export type LoadingOverlayVariant = "default" | "logout" | "login" | "register";

interface OverlayConfig {
  show: boolean;
  variant: LoadingOverlayVariant;
  message?: string;
}

interface AppState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  session: Session | null;
  setSession: (session: Session | null) => void;
  queryClient?: QueryClient;
  setQueryClient: (client: QueryClient) => void;
  lastServerActionResult?: unknown;
  setServerActionResult: (result: unknown) => void;
  overlay: OverlayConfig;
  setOverlay: (config: Partial<OverlayConfig>) => void;
  clearOverlay: () => void;
}

const defaultOverlay: OverlayConfig = {
  show: false,
  variant: "default",
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: "light",
      setTheme: (theme) => set({ theme }),
      session: null,
      setSession: (session) => set({ session }),
      queryClient: null as any,
      setQueryClient: (client) => set({ queryClient: client }),
      lastServerActionResult: undefined,
      setServerActionResult: (result) => set({ lastServerActionResult: result }),
      overlay: defaultOverlay,
      setOverlay: (config) => set({ overlay: { ...get().overlay, ...config } }),
      clearOverlay: () => set({ overlay: defaultOverlay }),
    }),
    {
      name: "app-storage", // localStorage key
      partialize: (state) => ({ theme: state.theme, session: state.session }),
    }
  )
); 