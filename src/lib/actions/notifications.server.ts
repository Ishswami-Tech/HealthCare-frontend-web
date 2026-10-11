'use server';

import { after } from 'next/server';
import { authenticatedApi, getServerSession } from './auth.server';
import { API_ENDPOINTS } from '../config/config';
import { logNotificationFetchWarning } from '@/lib/utils/notifications-logger';

// ===== NOTIFICATIONS MANAGEMENT =====

type NotificationPreferenceInput = {
  userId?: string;
  // Web-side names
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
  // Backend DTO names (Create/UpdateNotificationPreferenceDto)
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  pushEnabled?: boolean;
  socketEnabled?: boolean;
  whatsappEnabled?: boolean;
  appointmentEnabled?: boolean;
  ehrEnabled?: boolean;
  billingEnabled?: boolean;
  systemEnabled?: boolean;
  quietHours?: { start?: string; end?: string; timezone?: string };
  categoryPreferences?: {
    appointment?: string[];
    ehr?: string[];
    billing?: string[];
    system?: string[];
  };
};

/**
 * Builds the body the backend accepts. The DTO only knows the `*Enabled` switches,
 * `quietHours` and `categoryPreferences`; any other property (`userId`, `email`,
 * `types`, ...) makes the request fail validation, so the web-side names are translated
 * and nothing else is sent. `types.prescriptions / reminders / marketing` have no
 * counterpart in the backend and are dropped.
 */
function toNotificationPreferenceBody(settings: NotificationPreferenceInput): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  const setFlag = (key: string, ...candidates: Array<boolean | undefined>) => {
    const value = candidates.find((candidate) => typeof candidate === 'boolean');
    if (value !== undefined) body[key] = value;
  };

  setFlag('emailEnabled', settings.emailEnabled, settings.email);
  setFlag('smsEnabled', settings.smsEnabled, settings.sms);
  setFlag('pushEnabled', settings.pushEnabled, settings.push);
  setFlag('socketEnabled', settings.socketEnabled);
  setFlag('whatsappEnabled', settings.whatsappEnabled, settings.whatsapp);
  setFlag('appointmentEnabled', settings.appointmentEnabled, settings.types?.appointments);
  setFlag('ehrEnabled', settings.ehrEnabled);
  setFlag('billingEnabled', settings.billingEnabled);
  setFlag('systemEnabled', settings.systemEnabled);
  if (settings.quietHours) body.quietHours = settings.quietHours;
  if (settings.categoryPreferences) body.categoryPreferences = settings.categoryPreferences;
  return body;
}

/**
 * Get user notifications: GET /communication/history/:userId (the notification inbox;
 * roles PATIENT, DOCTOR, ASSISTANT_DOCTOR, CLINIC_ADMIN; query type, isRead, limit up to
 * 100, offset). Answers `{ notifications: [...] }`.
 * `/communication/chat/history/:userId`, used here before, is the chat-message history
 * and never contains notifications.
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

    const endpoint = `${API_ENDPOINTS.COMMUNICATION.NOTIFICATIONS.HISTORY(userId)}${params.toString() ? `?${params.toString()}` : ''}`;
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

  const { data } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.NOTIFICATIONS.MARK_READ(notificationId), {
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
    `${API_ENDPOINTS.COMMUNICATION.NOTIFICATIONS.MARK_ALL_READ}?userId=${encodeURIComponent(targetUserId)}`,
    {
      method: 'PATCH',
    }
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

  const { data } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.NOTIFICATIONS.DELETE(notificationId), {
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

  // GET /notification-preferences/:userId is for SUPER_ADMIN / CLINIC_ADMIN only; a
  // user's own preferences are read from /me.
  if (userId && userId !== session.user.id) {
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
 * Create notification preferences: POST /notification-preferences (always for the
 * signed-in user; the backend takes the user from the token).
 */
export async function createNotificationPreferences(settings: NotificationPreferenceInput) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.NOTIFICATION_PREFERENCES.CREATE, {
    method: 'POST',
    body: JSON.stringify(toNotificationPreferenceBody(settings)),
  });
  return data;
}

/**
 * Update notification preferences. The backend has no PATCH route:
 * - own preferences: PUT /notification-preferences/me
 * - another user's (SUPER_ADMIN / CLINIC_ADMIN only): PUT /notification-preferences/:userId
 * `settings.userId` is optional and defaults to the signed-in user.
 */
export async function updateNotificationPreferences(settings: NotificationPreferenceInput) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const userId = settings.userId;
  const endpoint =
    userId && userId !== session.user.id
      ? API_ENDPOINTS.NOTIFICATION_PREFERENCES.UPDATE(userId)
      : API_ENDPOINTS.NOTIFICATION_PREFERENCES.UPDATE_MY;
  const { data } = await authenticatedApi(endpoint, {
    method: 'PUT',
    body: JSON.stringify(toNotificationPreferenceBody(settings)),
  });
  return data;
}

/**
 * Delete notification preferences - resets to defaults.
 * DELETE /notification-preferences/me, or /:userId for SUPER_ADMIN / CLINIC_ADMIN.
 */
export async function deleteNotificationPreferences(userId?: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const endpoint =
    userId && userId !== session.user.id
      ? API_ENDPOINTS.NOTIFICATION_PREFERENCES.DELETE(userId)
      : API_ENDPOINTS.NOTIFICATION_PREFERENCES.DELETE_MY;

  const { data } = await authenticatedApi(endpoint, {
    method: 'DELETE',
  });
  return data;
}
