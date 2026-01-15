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
import { APP_CONFIG, API_ENDPOINTS } from '@/lib/config/config';
import { toast } from 'sonner';

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
      console.log('Foreground message received:', payload);
      
      // Show notification using toast
      if (payload.notification) {
        toast.info(payload.notification.title || 'New Notification', {
          description: payload.notification.body,
          duration: 5000,
        });
      }

      // Handle notification click
      if (payload.data) {
        // You can navigate to specific routes based on notification data
        // Example: router.push(payload.data.link);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isSupported, token]);

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
        toast.error('Notification permission denied. Please enable it in your browser settings.');
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
        appVersion: APP_CONFIG.APP.VERSION,
      };

      // ✅ PERFORMANCE: Use fetch with AbortController
      const { fetchWithAbort } = await import('@/lib/utils/fetch-with-abort');
      const response = await fetchWithAbort(
        `${APP_CONFIG.API.BASE_URL}${API_ENDPOINTS.COMMUNICATION.PUSH.REGISTER_DEVICE_TOKEN}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token && {
              Authorization: `Bearer ${session.access_token}`,
            }),
          },
          timeout: 10000,
          body: JSON.stringify({
            token,
            platform: 'web',
            userId: session.user.id,
            ...deviceInfo,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // ✅ Use centralized error handler
        const { handleApiError } = await import('@/lib/utils/error-handler');
        const errorMessage = await handleApiError(response, errorData);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        setIsRegistered(true);
        console.log('Device token registered successfully');
      } else {
        throw new Error(result.error || 'Failed to register device token');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register token';
      setError(errorMessage);
      console.error('Error registering device token:', err);
      toast.error('Failed to register push notification token');
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













