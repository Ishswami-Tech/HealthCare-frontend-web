"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { Role } from "@/types/auth.types";

interface LayoutState {
  // Global Shell State
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
  setDashboardMeta: (meta: {
    pageTitle?: string;
    displayUser?: LayoutState["displayUser"];
  }) => void;
  setPageTitle: (title: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDisplayUser: (user: LayoutState["displayUser"]) => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  pageTitle: "Dashboard",
  isSidebarCollapsed: false,
  displayUser: null,
};

export const useLayoutStore = create<LayoutState>()(
  devtools(
    immer((set) => ({
      ...initialState,

      setDashboardMeta: (meta) =>
        set((state) => {
          if (meta.pageTitle !== undefined) {
            state.pageTitle = meta.pageTitle;
          }
          if (meta.displayUser !== undefined) {
            state.displayUser = meta.displayUser;
          }
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

export const usePageTitle = () => useLayoutStore((state) => state.pageTitle);
export const useIsSidebarCollapsed = () => useLayoutStore((state) => state.isSidebarCollapsed);
export const useDisplayUser = () => useLayoutStore((state) => state.displayUser);
