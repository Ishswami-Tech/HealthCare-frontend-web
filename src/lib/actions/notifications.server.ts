'use server';

import { after } from 'next/server';
import { authenticatedApi, getServerSession } from './auth.server';
import { API_ENDPOINTS } from '../config/config';
import { logNotificationFetchWarning } from '@/lib/utils/notifications-logger';

// ===== NOTIFICATIONS MANAGEMENT =====

/**
 * Get user notifications (chat history)
 * Non-blocking - returns empty array on error to prevent page crashes
 */
export async function getUserNotifications(userId?: string, filters?: {
  type?: string;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      throw new Error('Unauthorized: Authentication required');
    }

    if (!userId) {
      return [];
    }

    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    // Use correct CHAT.HISTORY endpoint
    const endpoint = `${API_ENDPOINTS.COMMUNICATION.CHAT.HISTORY(userId)}${params.toString() ? `?${params.toString()}` : ''}`;
    const { data } = await authenticatedApi(endpoint);
    return data;
  } catch (error) {
    // Non-blocking: Log after response using `after()` so it doesn't delay the user-visible response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    after(() => {
      logNotificationFetchWarning(errorMessage);
    });
    return [];
  }
}

/**
 * Mark notification as read - Use COMMUNICATION endpoint
 */
export async function markNotificationAsRead(notificationId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  // Use communication history endpoint for marking as read
  const { data } = await authenticatedApi(`${API_ENDPOINTS.COMMUNICATION.BASE}/history/${notificationId}/read`, {
    method: 'PATCH',
  });
  return data;
}

/**
 * Mark all notifications as read - Use COMMUNICATION endpoint
 */
export async function markAllNotificationsAsRead(userId?: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  // Use communication history endpoint
  const params = userId ? `?userId=${userId}` : '';
  const { data } = await authenticatedApi(`${API_ENDPOINTS.COMMUNICATION.BASE}/history/mark-all-read${params}`, {
    method: 'PATCH',
  });
  return data;
}

/**
 * Delete notification - Use COMMUNICATION endpoint
 */
export async function deleteNotification(notificationId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  // Use communication endpoint for deletion
  const { data } = await authenticatedApi(`${API_ENDPOINTS.COMMUNICATION.BASE}/${notificationId}`, {
    method: 'DELETE',
  });
  return data;
}

/**
 * Get notification settings - Use NOTIFICATION_PREFERENCES endpoint
 */
export async function getMyNotificationPreferences(userId?: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  if (userId) {
    const { data } = await authenticatedApi(API_ENDPOINTS.NOTIFICATION_PREFERENCES.GET_BY_USER(userId));
    return data;
  }
  const { data } = await authenticatedApi(API_ENDPOINTS.NOTIFICATION_PREFERENCES.GET_MY);
  return data;
}

/**
 * Get notification preferences for a specific user
 */
export async function getUserNotificationPreferences(userId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.NOTIFICATION_PREFERENCES.GET_BY_USER(userId));
  return data;
}

/**
 * Create notification preferences - Use NOTIFICATION_PREFERENCES endpoint
 */
export async function createNotificationPreferences(settings: {
  userId?: string;
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
}) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.NOTIFICATION_PREFERENCES.CREATE, {
    method: 'POST',
    body: JSON.stringify(settings),
  });
  return data;
}

/**
 * Update notification preferences - Use NOTIFICATION_PREFERENCES endpoint
 */
export async function updateNotificationPreferences(settings: {
  userId?: string;
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
}) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const userId = settings.userId;
  if (!userId) {
    throw new Error('UserId is required to update notification settings');
  }
  const { data } = await authenticatedApi(API_ENDPOINTS.NOTIFICATION_PREFERENCES.UPDATE(userId), {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
  return data;
}

/**
 * Delete notification preferences - resets to defaults
 */
export async function deleteNotificationPreferences(userId?: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const endpoint = userId
    ? API_ENDPOINTS.NOTIFICATION_PREFERENCES.DELETE(userId)
    : API_ENDPOINTS.NOTIFICATION_PREFERENCES.DELETE('me');

  const { data } = await authenticatedApi(endpoint, {
    method: 'DELETE',
  });
  return data;
}
