"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { Role } from "@/types/auth.types";

interface LayoutState {
  // Global Shell State
  isDashboardMounted: boolean;
  pageTitle: string;
  isSidebarCollapsed: boolean;
  
  // Current User Context (Calculated & Shared)
  displayUser: {
    name: string;
    initials: string;
    role: Role;
    avatar: string;
    email: string;
  } | null;
  
  // Actions
  setDashboardMounted: (mounted: boolean) => void;
  setPageTitle: (title: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDisplayUser: (user: LayoutState["displayUser"]) => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  isDashboardMounted: false,
  pageTitle: "Dashboard",
  isSidebarCollapsed: false,
  displayUser: null,
};

export const useLayoutStore = create<LayoutState>()(
  devtools(
    immer((set) => ({
      ...initialState,

      setDashboardMounted: (mounted) =>
        set((state) => {
          state.isDashboardMounted = mounted;
        }),

      setPageTitle: (title) =>
        set((state) => {
          state.pageTitle = title;
        }),

      setSidebarCollapsed: (collapsed) =>
        set((state) => {
          state.isSidebarCollapsed = collapsed;
        }),
        
      setDisplayUser: (user) =>
        set((state) => {
          state.displayUser = user;
        }),

      reset: () =>
        set(() => ({
          ...initialState,
        })),
    })),
    {
      name: "healthcare-layout-store",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);

// Convenient selectors
export const useIsDashboardMounted = () => useLayoutStore((state) => state.isDashboardMounted);
export const usePageTitle = () => useLayoutStore((state) => state.pageTitle);
export const useIsSidebarCollapsed = () => useLayoutStore((state) => state.isSidebarCollapsed);
export const useDisplayUser = () => useLayoutStore((state) => state.displayUser);
