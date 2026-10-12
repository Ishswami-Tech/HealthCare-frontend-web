'use server';

import { after } from 'next/server';
import { authenticatedApi, getServerSession } from './auth.server';
import { API_ENDPOINTS } from '../config/config';
import { logNotificationFetchWarning } from '@/lib/utils/notifications-logger';

// ===== NOTIFICATIONS MANAGEMENT =====

/**
 * Get user notifications (GET /communication/history/:userId -> { notifications }, not the chat history)
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

    const endpoint = `${API_ENDPOINTS.COMMUNICATION.INBOX.LIST(userId)}${params.toString() ? `?${params.toString()}` : ''}`;
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
 * Mark notification as read: PATCH /communication/history/:id/read (no body).
 */
export async function markNotificationAsRead(notificationId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  // Use communication history endpoint for marking as read
  const { data } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.INBOX.MARK_READ(notificationId), {
    method: 'PATCH',
  });
  return data;
}

/**
 * Mark all notifications as read: PATCH /communication/history/mark-all-read?userId=...
 * The backend filters by the `userId` query only, so it is always sent; without it the
 * update is not limited to one user. Defaults to the signed-in user.
 */
export async function markAllNotificationsAsRead(userId?: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const targetUserId = userId || session.user.id;
  const { data } = await authenticatedApi(
    `${API_ENDPOINTS.COMMUNICATION.INBOX.MARK_ALL_READ}?userId=${encodeURIComponent(targetUserId)}`,
    { method: 'PATCH' }
  );
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
  const { data } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.INBOX.DELETE(notificationId), {
    method: 'DELETE',
  });
  return data;
}
