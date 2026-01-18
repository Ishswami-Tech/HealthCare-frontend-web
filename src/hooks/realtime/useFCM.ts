/**
 * Firebase Cloud Messaging (FCM) Hook
 * 
 * Manages FCM token registration and notification handling
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/useAuth';
import {
  initializeFirebase,
  requestNotificationPermission,
  getFCMToken,
  onForegroundMessage,
  isFirebaseConfigured,
} from '@/lib/config/firebase';
import { showErrorToast, showInfoToast, TOAST_IDS } from '@/hooks/utils/use-toast';
import { useNotificationStore, type Notification } from '@/stores/notifications.store';
import { registerFCMToken } from '@/lib/actions/communication.server';

interface UseFCMReturn {
  token: string | null;
  isSupported: boolean;
  permission: NotificationPermission | null;
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
  registerToken: () => Promise<void>;
  unregisterToken: () => Promise<void>;
}

/**
 * Hook for managing FCM tokens and push notifications
 */
export function useFCM(): UseFCMReturn {
  const { session } = useAuth();
  const { addNotification } = useNotificationStore();
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = typeof window !== 'undefined' && 'Notification' in window && isFirebaseConfigured();

  // Check notification permission status
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Initialize Firebase on mount
  useEffect(() => {
    if (!isSupported) {
      return;
    }

    try {
      initializeFirebase();
    } catch (err) {
      console.error('Failed to initialize Firebase:', err);
      setError('Failed to initialize Firebase');
    }
  }, [isSupported]);

  // Set up foreground message handler
  useEffect(() => {
    if (!isSupported || !token) {
      return;
    }

    const unsubscribe = onForegroundMessage((payload) => {
      // Backend handles push notification delivery (FCM, email, SMS, WhatsApp)
      // Frontend only shows in-app notification and toast for reading
      if (!session?.user?.id || !payload.notification) return;

      const notification: Notification = {
        id: payload.data?.id || payload.messageId || `fcm-${Date.now()}-${Math.random()}`,
        userId: session.user.id,
        type: (payload.data?.type || payload.data?.category || 'SYSTEM') as Notification['type'],
        title: payload.notification.title || 'New Notification',
        message: payload.notification.body || payload.data?.message || '',
        data: {
          ...payload.data,
          url: payload.data?.url || payload.data?.link,
        },
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      // Show toast
      showInfoToast(notification.title, {
        id: TOAST_IDS.NOTIFICATION.NEW,
        description: notification.message,
        duration: 5000,
      });

      // Add to notification store for reading
      addNotification(notification);

      // Navigation handled by NotificationItem component on click
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isSupported, token, session?.user?.id, addNotification]);

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const permissionResult = await requestNotificationPermission();
      setPermission(permissionResult);

      if (permissionResult === 'granted') {
        // Get FCM token after permission is granted
        const fcmToken = await getFCMToken();
        if (fcmToken) {
          setToken(fcmToken);
        }
      } else if (permissionResult === 'denied') {
        setError('Notification permission was denied');
        showErrorToast('Notification permission denied. Please enable it in your browser settings.', {
          id: TOAST_IDS.NOTIFICATION.PERMISSION_DENIED,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request permission';
      setError(errorMessage);
      console.error('Error requesting notification permission:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  /**
   * Register FCM token with backend
   */
  const registerToken = useCallback(async () => {
    if (!token) {
      setError('No FCM token available');
      return;
    }

    if (!session?.user?.id) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const deviceInfo = {
        deviceModel: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                     navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                     navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown',
        osVersion: navigator.platform || 'Unknown',
        appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      };

      const result = await registerFCMToken({
        token,
        platform: 'web',
        userId: session.user.id,
        ...deviceInfo,
      }) as { success: boolean; error?: string };

      if (!result.success) {
        throw new Error(result.error || 'Failed to register device token');
      }

      setIsRegistered(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register token';
      setError(errorMessage);
      showErrorToast('Failed to register push notification token', {
        id: TOAST_IDS.NOTIFICATION.FCM_ERROR,
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, session]);

  /**
   * Unregister FCM token
   */
  const unregisterToken = useCallback(async () => {
    if (!token || !isRegistered) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // You can implement token deletion on backend if needed
      setToken(null);
      setIsRegistered(false);
      console.log('Device token unregistered');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unregister token';
      setError(errorMessage);
      console.error('Error unregistering device token:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, isRegistered]);

  // Auto-register token when available and user is authenticated
  useEffect(() => {
    if (token && session?.user?.id && !isRegistered && !isLoading && permission === 'granted') {
      registerToken();
    }
  }, [token, session?.user?.id, isRegistered, isLoading, permission, registerToken]);

  return {
    token,
    isSupported,
    permission,
    isRegistered,
    isLoading,
    error,
    requestPermission,
    registerToken,
    unregisterToken,
  };
}













