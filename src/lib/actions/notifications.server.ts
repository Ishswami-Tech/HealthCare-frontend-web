'use server';

import { authenticatedApi } from './auth.server';
import { API_ENDPOINTS } from '../config/config';

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
    // Non-blocking: Return empty array on error (session issues, endpoint not available, etc.)
    console.warn('Failed to fetch notifications:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

/**
 * Mark notification as read - Use COMMUNICATION endpoint
 */
export async function markNotificationAsRead(notificationId: string) {
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
  // Use communication endpoint for deletion
  const { data } = await authenticatedApi(`${API_ENDPOINTS.COMMUNICATION.BASE}/${notificationId}`, {
    method: 'DELETE',
  });
  return data;
}

/**
 * Get notification settings - Use NOTIFICATION_PREFERENCES endpoint
 */
export async function getNotificationSettings(userId?: string) {
  if (userId) {
    const { data } = await authenticatedApi(API_ENDPOINTS.NOTIFICATION_PREFERENCES.GET_BY_USER(userId));
    return data;
  }
  const { data } = await authenticatedApi(API_ENDPOINTS.NOTIFICATION_PREFERENCES.GET_MY);
  return data;
}

/**
 * Update notification settings - Use NOTIFICATION_PREFERENCES endpoint
 */
export async function updateNotificationSettings(settings: {
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
