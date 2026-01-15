/**
 * ✅ Consolidated Notification Store
 * Follows DRY, SOLID, KISS principles
 * Single source of truth for notification state management
 * Uses types from @/types (if available) or defines locally
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ✅ Note: Notification types may need to be defined in @/types/notifications.types.ts
// For now, keeping local definitions until notification types are consolidated
export interface Notification {
  id: string;
  userId: string;
  type: 'APPOINTMENT' | 'PRESCRIPTION' | 'REMINDER' | 'SYSTEM' | 'MARKETING';
  title: string;
  message: string;
  data?: {
    appointmentId?: string;
    prescriptionId?: string;
    patientId?: string;
    doctorId?: string;
    clinicId?: string;
    url?: string;
    [key: string]: string | number | boolean | undefined;
  };
  isRead: boolean;
  createdAt: string;
  scheduledFor?: string;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  whatsapp: boolean;
  types: {
    appointments: boolean;
    prescriptions: boolean;
    reminders: boolean;
    marketing: boolean;
  };
}

interface NotificationState {
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Settings
  settings: NotificationSettings;
  
  // UI State
  isNotificationPanelOpen: boolean;
  selectedNotification: Notification | null;
  
  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  
  // Settings actions
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  
  // UI actions
  toggleNotificationPanel: () => void;
  setNotificationPanelOpen: (open: boolean) => void;
  selectNotification: (notification: Notification | null) => void;
  
  // Utility actions
  getUnreadNotifications: () => Notification[];
  getNotificationsByType: (type: Notification['type']) => Notification[];
  updateUnreadCount: () => void;
}

const defaultSettings: NotificationSettings = {
  email: true,
  sms: true,
  push: true,
  whatsapp: false,
  types: {
    appointments: true,
    prescriptions: true,
    reminders: true,
    marketing: false,
  },
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      settings: defaultSettings,
      isNotificationPanelOpen: false,
      selectedNotification: null,
      
      // Notification actions
      setNotifications: (notifications) => {
        set({ notifications });
        get().updateUnreadCount();
      },
      
      addNotification: (notification) => {
        const notifications = [notification, ...get().notifications];
        set({ notifications });
        get().updateUnreadCount();
      },
      
      markAsRead: (notificationId) => {
        const notifications = get().notifications.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        );
        set({ notifications });
        get().updateUnreadCount();
      },
      
      markAllAsRead: () => {
        const notifications = get().notifications.map(n => ({ ...n, isRead: true }));
        set({ notifications, unreadCount: 0 });
      },
      
      removeNotification: (notificationId) => {
        const notifications = get().notifications.filter(n => n.id !== notificationId);
        set({ notifications });
        get().updateUnreadCount();
      },
      
      clearAllNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },
      
      // Settings actions
      updateSettings: (newSettings) => {
        const settings = { ...get().settings, ...newSettings };
        set({ settings });
      },
      
      // UI actions
      toggleNotificationPanel: () => {
        set({ isNotificationPanelOpen: !get().isNotificationPanelOpen });
      },
      
      setNotificationPanelOpen: (open) => {
        set({ isNotificationPanelOpen: open });
      },
      
      selectNotification: (notification) => {
        set({ selectedNotification: notification });
      },
      
      // Utility actions
      getUnreadNotifications: () => {
        return get().notifications.filter(n => !n.isRead);
      },
      
      getNotificationsByType: (type) => {
        return get().notifications.filter(n => n.type === type);
      },
      
      updateUnreadCount: () => {
        const unreadCount = get().notifications.filter(n => !n.isRead).length;
        set({ unreadCount });
      },
    }),
    {
      name: "notification-storage",
      partialize: (state) => ({
        settings: state.settings,
        notifications: state.notifications.slice(0, 50), // Keep only last 50 notifications
      }),
    }
  )
);

// Selectors for better performance
export const useNotificationSelectors = () => {
  const store = useNotificationStore();
  
  return {
    // Memoized selectors
    unreadNotifications: store.getUnreadNotifications(),
    appointmentNotifications: store.getNotificationsByType('APPOINTMENT'),
    prescriptionNotifications: store.getNotificationsByType('PRESCRIPTION'),
    reminderNotifications: store.getNotificationsByType('REMINDER'),
    systemNotifications: store.getNotificationsByType('SYSTEM'),
    marketingNotifications: store.getNotificationsByType('MARKETING'),
    
    // Recent notifications (last 10)
    recentNotifications: store.notifications.slice(0, 10),
    
    // Today's notifications
    todayNotifications: store.notifications.filter(n => {
      const today = new Date().toDateString();
      const notificationDate = new Date(n.createdAt).toDateString();
      return today === notificationDate;
    }),
  };
};

// Helper hooks for common operations
export const useNotificationActions = () => {
  const store = useNotificationStore();
  
  return {
    addNotification: store.addNotification,
    markAsRead: store.markAsRead,
    markAllAsRead: store.markAllAsRead,
    removeNotification: store.removeNotification,
    clearAllNotifications: store.clearAllNotifications,
    updateSettings: store.updateSettings,
    togglePanel: store.toggleNotificationPanel,
    selectNotification: store.selectNotification,
  };
};

// Hook for notification panel state
export const useNotificationPanel = () => {
  const isOpen = useNotificationStore(state => state.isNotificationPanelOpen);
  const selectedNotification = useNotificationStore(state => state.selectedNotification);
  const togglePanel = useNotificationStore(state => state.toggleNotificationPanel);
  const setOpen = useNotificationStore(state => state.setNotificationPanelOpen);
  const selectNotification = useNotificationStore(state => state.selectNotification);
  
  return {
    isOpen,
    selectedNotification,
    togglePanel,
    setOpen,
    selectNotification,
  };
};

// Hook for notification settings
export const useNotificationSettings = () => {
  const settings = useNotificationStore(state => state.settings);
  const updateSettings = useNotificationStore(state => state.updateSettings);
  
  return {
    settings,
    updateSettings,
  };
};
