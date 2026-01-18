"use client";

/**
 * ✅ Consolidated Notifications Hook
 * 
 * Single file for all notification operations:
 * - Reading notifications (React Query + Zustand)
 * - Actions (mark as read, delete) via useMutationOperation
 * - Sending notifications (admin/testing only)
 * - Notification settings
 * 
 * Architecture:
 * - Backend: Creates, delivers (Push/Email/SMS/WhatsApp), stores notifications
 * - Frontend: Reads, displays, and actions (mark as read, delete)
 * 
 * Uses:
 * - React Query (via core hooks) for fetching
 * - Zustand for client state
 * - Server actions for backend sync
 */

import { useEffect, useCallback, useRef } from "react";
import { useQueryData, useMutationOperation } from "@/hooks/core";
import { useAuth } from "../auth/useAuth";
import {
  useNotificationStore,
  Notification,
} from "@/stores/notifications.store";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationSettings,
  updateNotificationSettings,
} from "@/lib/actions/notifications.server";
import { TOAST_IDS } from "@/hooks/utils/use-toast";

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

// ===== READING NOTIFICATIONS =====

/**
 * Main hook for reading and managing notifications
 * Combines fetching, actions, and state management
 */
export function useNotifications() {
  const { session } = useAuth();
  const {
    notifications,
    unreadCount,
    setNotifications,
    markAsRead: markAsReadStore,
    markAllAsRead: markAllAsReadStore,
    removeNotification: removeNotificationStore,
  } = useNotificationStore();
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications from backend using React Query (via core hook)
  const {
    data,
    isPending,
    error,
    refetch,
  } = useQueryData(
    ["notifications", session?.user?.id],
    async () => {
      if (!session?.user?.id) return null;
      const result = await getUserNotifications(session.user.id, {
        limit: 100,
        offset: 0,
      });
      return result;
    },
    {
      // Only enable if user is authenticated AND has an access token
      // This prevents "No access token found" errors during login flow
      enabled: !!session?.user?.id && !!session?.access_token,
      refetchOnWindowFocus: true,
      refetchInterval: SYNC_INTERVAL,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  // Sync backend notifications to Zustand store
  useEffect(() => {
    if (!data) return;

    const backendNotifications = ((data as any)?.notifications || (data as any)?.data || []) as any[];
    if (
      !Array.isArray(backendNotifications) ||
      backendNotifications.length === 0
    ) {
      return;
    }

    // Transform backend notifications to store format
    const transformedNotifications: Notification[] =
      backendNotifications.map((n: any) => ({
        id: n.id || n.notificationId || `notif-${Date.now()}-${Math.random()}`,
        userId: n.userId || session?.user?.id || "",
        type: (n.type || n.category || "SYSTEM") as Notification["type"],
        title: n.title || n.subject || "Notification",
        message: n.message || n.body || n.content || "",
        data: n.data || n.metadata || {},
        isRead: n.isRead || n.read || false,
        createdAt: n.createdAt || n.created_at || new Date().toISOString(),
        scheduledFor: n.scheduledFor || n.scheduled_for,
      }));

    // Merge with existing notifications (avoid duplicates by ID)
    const existingIds = new Set(notifications.map((n) => n.id));
    const newNotifications = transformedNotifications.filter(
      (n) => !existingIds.has(n.id)
    );

    // Update store if there are new notifications or count changed
    if (
      newNotifications.length > 0 ||
      transformedNotifications.length !== notifications.length
    ) {
      setNotifications(transformedNotifications);
    }
  }, [data, session?.user?.id, setNotifications, notifications]);

  // Periodic sync
  useEffect(() => {
    if (session?.user?.id) {
      syncIntervalRef.current = setInterval(() => {
        refetch();
      }, SYNC_INTERVAL);

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
    return undefined;
  }, [session?.user?.id, refetch]);

  // ===== ACTIONS =====
  // Use useMutationOperation for consistent error handling

  /**
   * Mark notification as read
   * Optimistic update + backend sync
   */
  const markAsReadMutation = useMutationOperation(
    async (notificationId: string) => {
      // Optimistic update
      markAsReadStore(notificationId);
      // Sync to backend
      await markNotificationAsRead(notificationId);
      return { success: true };
    },
    {
      toastId: 'notification-mark-read',
      loadingMessage: "Marking as read...",
      successMessage: "Notification marked as read",
      showToast: false, // Don't show toast for read actions
      invalidateQueries: [["notifications"]],
    }
  );

  /**
   * Mark all notifications as read
   * Optimistic update + backend sync
   */
  const markAllAsReadMutation = useMutationOperation(
    async (_?: void) => {
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }
      // Optimistic update
      markAllAsReadStore();
      // Sync to backend
      await markAllNotificationsAsRead(session.user.id);
      return { success: true };
    },
    {
      toastId: 'notification-mark-all-read',
      loadingMessage: "Marking all as read...",
      successMessage: "All notifications marked as read",
      showToast: false, // Don't show toast for read actions
      invalidateQueries: [["notifications"]],
    }
  );

  /**
   * Delete notification
   * Optimistic update + backend sync
   */
  const deleteNotificationMutation = useMutationOperation(
    async (notificationId: string) => {
      // Optimistic update
      removeNotificationStore(notificationId);
      // Sync to backend
      await deleteNotification(notificationId);
      return { success: true };
    },
    {
      toastId: 'notification-delete',
      loadingMessage: "Deleting notification...",
      successMessage: "Notification deleted",
      showToast: false, // Don't show toast for delete actions
      invalidateQueries: [["notifications"]],
    }
  );

  // Wrapper functions for easier use
  const markAsRead = useCallback(
    async (notificationId: string) => {
      await markAsReadMutation.mutateAsync(notificationId);
    },
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(async () => {
    if (!session?.user?.id) return;
    await markAllAsReadMutation.mutateAsync(undefined);
  }, [markAllAsReadMutation, session?.user?.id]);

  const removeNotification = useCallback(
    async (notificationId: string) => {
      await deleteNotificationMutation.mutateAsync(notificationId);
    },
    [deleteNotificationMutation]
  );

  // Manual sync function
  const sync = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    // State (from Zustand store)
    notifications,
    unreadCount,

    // Loading & Error (from React Query)
    isPending,
    error,

    // Actions
    markAsRead,
    markAllAsRead,
    removeNotification,

    // Sync
    sync,
    refetch,
  };
}



// ===== NOTIFICATION SETTINGS HOOKS =====

/**
 * Hook to get notification settings
 */
export const useNotificationSettings = (userId?: string) => {
  return useQueryData(
    ['notificationSettings', userId],
    async () => {
      return await getNotificationSettings(userId);
    },
    { enabled: !!userId || userId === undefined }
  );
};

/**
 * Hook to update notification settings
 */
export const useUpdateNotificationSettings = () => {
  return useMutationOperation(
    async (settings: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
      whatsapp?: boolean;
      types?: {
        appointments?: boolean;
        prescriptions?: boolean;
        reminders?: boolean;
        marketing?: boolean;
      };
    }) => {
      const result = await updateNotificationSettings(settings);
      return result;
    },
    {
      toastId: TOAST_IDS.NOTIFICATION.PREFERENCE_UPDATE,
      loadingMessage: 'Updating settings...',
      successMessage: 'Notification settings updated successfully',
      invalidateQueries: [['notificationSettings']],
    }
  );
};
