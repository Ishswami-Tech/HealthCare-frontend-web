"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { Session } from "@/types/auth.types";

// Global App State Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'CLINIC_ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PHARMACIST' | 'PATIENT';
  clinicId?: string;
  avatarUrl?: string;
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  dashboard: {
    layout: 'default' | 'compact' | 'detailed';
    refreshInterval: number;
  };
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  settings: ClinicSettings;
}

export interface ClinicSettings {
  appointmentDuration: number;
  workingHours: {
    start: string;
    end: string;
    days: string[];
  };
  timeZone: string;
  features: {
    queue: boolean;
    notifications: boolean;
    telemedicine: boolean;
    pharmacy: boolean;
  };
}

// Loading Overlay Types
export type LoadingOverlayVariant = "default" | "logout" | "login" | "register";

export interface OverlayConfig {
  show: boolean;
  variant: LoadingOverlayVariant;
  message?: string;
}

const defaultOverlay: OverlayConfig = {
  show: false,
  variant: "default",
};

export interface AppState {
  // User Management
  user: User | null;
  isAuthenticated: boolean;
  
  // Clinic Management
  currentClinic: Clinic | null;
  clinics: Clinic[];
  
  // UI State
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  
  // Loading State (✅ Global loading state - for app-wide loading)
  isLoading: boolean;
  loadingMessage: string;
  
  // Loading Overlay (✅ For full-screen overlays during auth flows, etc.)
  overlay: OverlayConfig;
  
  // Session Management
  session: Session | null;
  
  // Notifications
  notifications: AppNotification[];
  unreadCount: number;
  
  // Error Handling
  error: string | null;
  errors: Record<string, string>;
  
  // Cache Control
  lastSync: Date | null;
  cacheInvalidation: Record<string, Date>;
  
  // Actions
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  setAuthenticated: (authenticated: boolean) => void;
  
  setCurrentClinic: (clinic: Clinic | null) => void;
  addClinic: (clinic: Clinic) => void;
  updateClinic: (id: string, updates: Partial<Clinic>) => void;
  removeClinic: (id: string) => void;
  
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
  setLoading: (loading: boolean, message?: string) => void;
  
  // Overlay Actions (✅ For full-screen overlays during auth flows, route transitions)
  setOverlay: (config: Partial<OverlayConfig>) => void;
  clearOverlay: () => void;
  
  // Session Actions
  setSession: (session: Session | null) => void;
  
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  
  setError: (error: string | null) => void;
  setFieldError: (field: string, error: string) => void;
  clearFieldError: (field: string) => void;
  clearAllErrors: () => void;
  
  invalidateCache: (key: string) => void;
  clearCache: () => void;
  updateLastSync: () => void;
  
  reset: () => void;
}

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  persistent?: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

// ============================================================================
// APP STATE INTERFACE
// ============================================================================

const initialState = {
  user: null,
  isAuthenticated: false,
  currentClinic: null,
  clinics: [],
  sidebarOpen: false,
  theme: 'system' as const,
  language: 'en',
  isLoading: false,
  loadingMessage: '',
  overlay: defaultOverlay,
  session: null,
  notifications: [],
  unreadCount: 0,
  error: null,
  errors: {},
  lastSync: null,
  cacheInvalidation: {},
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,

        // User Actions
        setUser: (user) =>
          set((state) => {
            state.user = user;
            state.isAuthenticated = !!user;
          }),

        updateUser: (updates) =>
          set((state) => {
            if (state.user) {
              Object.assign(state.user, updates);
            }
          }),

        setAuthenticated: (authenticated) =>
          set((state) => {
            state.isAuthenticated = authenticated;
            if (!authenticated) {
              state.user = null;
              state.currentClinic = null;
            }
          }),

        // Clinic Actions
        setCurrentClinic: (clinic) =>
          set((state) => {
            state.currentClinic = clinic;
          }),

        addClinic: (clinic) =>
          set((state) => {
            state.clinics.push(clinic);
          }),

        updateClinic: (id, updates) =>
          set((state) => {
            const index = state.clinics.findIndex(c => c.id === id);
            if (index !== -1 && state.clinics[index]) {
              const clinic = state.clinics[index];
              Object.assign(clinic, updates);
            }
            if (state.currentClinic?.id === id && state.currentClinic) {
              Object.assign(state.currentClinic, updates);
            }
          }),

        removeClinic: (id) =>
          set((state) => {
            state.clinics = state.clinics.filter(c => c.id !== id);
            if (state.currentClinic?.id === id) {
              state.currentClinic = null;
            }
          }),

        // UI Actions
        setSidebarOpen: (open) =>
          set((state) => {
            state.sidebarOpen = open;
          }),

        setTheme: (theme) =>
          set((state) => {
            state.theme = theme;
          }),

        setLanguage: (language) =>
          set((state) => {
            state.language = language;
          }),

        setLoading: (loading, message = '') =>
          set((state) => {
            state.isLoading = loading;
            state.loadingMessage = message;
          }),

        // Overlay Actions (✅ For full-screen overlays during auth flows, route transitions)
        setOverlay: (config) =>
          set((state) => {
            state.overlay = { ...state.overlay, ...config };
          }),

        clearOverlay: () =>
          set((state) => {
            state.overlay = defaultOverlay;
          }),

        // Session Actions
        setSession: (session) =>
          set((state) => {
            state.session = session;
          }),

        // Notification Actions
        addNotification: (notificationData) =>
          set((state) => {
            const notification: AppNotification = {
              ...notificationData,
              id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              timestamp: new Date(),
              read: false,
            };
            state.notifications.unshift(notification);
            state.unreadCount += 1;
          }),

        removeNotification: (id) =>
          set((state) => {
            const index = state.notifications.findIndex(n => n.id === id);
            if (index !== -1) {
              const notification = state.notifications[index];
              if (notification && !notification.read) {
                if (state.unreadCount > 0) {
                  state.unreadCount -= 1;
                }
              }
              state.notifications.splice(index, 1);
            }
          }),

        markNotificationRead: (id) =>
          set((state) => {
            const notification = state.notifications.find(n => n.id === id);
            if (notification && !notification.read) {
              notification.read = true;
              if (state.unreadCount > 0) {
                state.unreadCount -= 1;
              }
            }
          }),

        clearNotifications: () =>
          set((state) => {
            state.notifications = [];
            state.unreadCount = 0;
          }),

        // Error Actions
        setError: (error) =>
          set((state) => {
            state.error = error;
          }),

        setFieldError: (field, error) =>
          set((state) => {
            state.errors[field] = error;
          }),

        clearFieldError: (field) =>
          set((state) => {
            delete state.errors[field];
          }),

        clearAllErrors: () =>
          set((state) => {
            state.error = null;
            state.errors = {};
          }),

        // Cache Actions
        invalidateCache: (key) =>
          set((state) => {
            state.cacheInvalidation[key] = new Date();
          }),

        clearCache: () =>
          set((state) => {
            state.cacheInvalidation = {};
          }),

        updateLastSync: () =>
          set((state) => {
            state.lastSync = new Date();
          }),

        // Reset
        reset: () =>
          set(() => ({
            ...initialState,
          })),
      })),
      {
        name: 'healthcare-app-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          currentClinic: state.currentClinic,
          clinics: state.clinics,
          theme: state.theme,
          language: state.language,
          sidebarOpen: state.sidebarOpen,
        }),
      }
    ),
    {
      name: 'healthcare-app-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Selectors for better performance
export const useUser = () => useAppStore(state => state.user);
export const useIsAuthenticated = () => useAppStore(state => state.isAuthenticated);
export const useCurrentClinic = () => useAppStore(state => state.currentClinic);
export const useClinics = () => useAppStore(state => state.clinics);
export const useTheme = () => useAppStore(state => state.theme);
export const useLanguage = () => useAppStore(state => state.language);
export const useSidebarOpen = () => useAppStore(state => state.sidebarOpen);
export const useNotifications = () => useAppStore(state => ({ 
  notifications: state.notifications,
  unreadCount: state.unreadCount 
}));
export const useErrors = () => useAppStore(state => ({
  error: state.error,
  errors: state.errors
}));

// ✅ Loading selector (for global app loading state)
// For component-level loading, use useLoadingState hook from @/hooks/useLoadingState
export const useLoading = () => useAppStore(state => ({
  isLoading: state.isLoading,
  loadingMessage: state.loadingMessage
}));

// Type exports (already exported above, no need to re-export)
// Types are exported inline: User, Clinic, AppNotification