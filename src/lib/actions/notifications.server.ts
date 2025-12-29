'use server';

import { authenticatedApi } from './auth.server';
import { API_ENDPOINTS } from '../config/config';

// ===== NOTIFICATIONS MANAGEMENT =====

/**
 * Get user notifications
 */
export async function getUserNotifications(userId?: string, filters?: {
  type?: string;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }
  
  // Use COMMUNICATION endpoint instead of deprecated NOTIFICATIONS
  const endpoint = `${API_ENDPOINTS.COMMUNICATION.BASE}/history${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Create notification - Use COMMUNICATION endpoint
 */
export async function createNotification(notificationData: {
  userId: string;
  type: 'APPOINTMENT' | 'PRESCRIPTION' | 'REMINDER' | 'SYSTEM' | 'MARKETING';
  title: string;
  message: string;
  data?: Record<string, string | number | boolean>;
  scheduledFor?: string;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.SEND, {
    method: 'POST',
    body: JSON.stringify({
      category: notificationData.type,
      recipients: [{ userId: notificationData.userId }],
      content: {
        title: notificationData.title,
        message: notificationData.message,
        ...notificationData.data,
      },
      scheduledFor: notificationData.scheduledFor,
    }),
  });
  return data;
}

/**
 * Mark notification as read - Use NOTIFICATION_PREFERENCES endpoint
 */
export async function markNotificationAsRead(notificationId: string) {
  // Use notification preferences endpoint for marking as read
  const { data } = await authenticatedApi(`${API_ENDPOINTS.NOTIFICATION_PREFERENCES.BASE}/${notificationId}/read`, {
    method: 'PATCH',
  });
  return data;
}

/**
 * Mark all notifications as read - Use NOTIFICATION_PREFERENCES endpoint
 */
export async function markAllNotificationsAsRead(userId?: string) {
  // Use notification preferences endpoint
  const params = userId ? `?userId=${userId}` : '';
  const { data } = await authenticatedApi(`${API_ENDPOINTS.NOTIFICATION_PREFERENCES.BASE}/mark-all-read${params}`, {
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

/**
 * Send bulk notifications - Use COMMUNICATION endpoint
 */
export async function sendBulkNotifications(notificationData: {
  userIds: string[];
  type: 'APPOINTMENT' | 'PRESCRIPTION' | 'REMINDER' | 'SYSTEM' | 'MARKETING';
  title: string;
  message: string;
  channels?: ('email' | 'sms' | 'push' | 'whatsapp')[];
  scheduledFor?: string;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.PUSH.SEND_MULTIPLE, {
    method: 'POST',
    body: JSON.stringify({
      category: notificationData.type,
      recipients: notificationData.userIds.map(userId => ({ userId })),
      content: {
        title: notificationData.title,
        message: notificationData.message,
      },
      channels: notificationData.channels || ['push'],
      scheduledFor: notificationData.scheduledFor,
    }),
  });
  return data;
}

// ===== MESSAGING MANAGEMENT =====

/**
 * Send SMS
 */
export async function sendSMS(messageData: {
  to: string;
  message: string;
  templateId?: string;
  variables?: Record<string, string>;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.MESSAGING.SMS, {
    method: 'POST',
    body: JSON.stringify(messageData),
  });
  return data;
}

/**
 * Send Email
 */
export async function sendEmail(emailData: {
  to: string | string[];
  subject: string;
  content: string;
  templateId?: string;
  variables?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.MESSAGING.EMAIL, {
    method: 'POST',
    body: JSON.stringify(emailData),
  });
  return data;
}

/**
 * Send WhatsApp message
 */
export async function sendWhatsAppMessage(messageData: {
  to: string;
  message: string;
  templateId?: string;
  variables?: Record<string, string>;
  mediaUrl?: string;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.MESSAGING.WHATSAPP, {
    method: 'POST',
    body: JSON.stringify(messageData),
  });
  return data;
}

/**
 * Get message templates
 */
export async function getMessageTemplates(type?: 'sms' | 'email' | 'whatsapp') {
  const params = type ? `?type=${type}` : '';
  const { data } = await authenticatedApi(`${API_ENDPOINTS.COMMUNICATION.MESSAGING.TEMPLATES.BASE}${params}`);
  return data;
}

/**
 * Create message template
 */
export async function createMessageTemplate(templateData: {
  name: string;
  type: 'sms' | 'email' | 'whatsapp';
  subject?: string;
  content: string;
  variables?: string[];
  category?: string;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.MESSAGING.TEMPLATES.CREATE, {
    method: 'POST',
    body: JSON.stringify(templateData),
  });
  return data;
}

/**
 * Update message template
 */
export async function updateMessageTemplate(templateId: string, updates: {
  name?: string;
  subject?: string;
  content?: string;
  variables?: string[];
  category?: string;
  isActive?: boolean;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.MESSAGING.TEMPLATES.UPDATE(templateId), {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data;
}

/**
 * Delete message template
 */
export async function deleteMessageTemplate(templateId: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.MESSAGING.TEMPLATES.DELETE(templateId), {
    method: 'DELETE',
  });
  return data;
}

/**
 * Get message history
 */
export async function getMessageHistory(filters?: {
  userId?: string;
  type?: 'sms' | 'email' | 'whatsapp';
  status?: 'sent' | 'delivered' | 'failed';
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }
  
  const endpoint = `${API_ENDPOINTS.COMMUNICATION.MESSAGING.HISTORY}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Get messaging statistics
 */
export async function getMessagingStats(period: 'day' | 'week' | 'month' | 'year' = 'month') {
  const { data } = await authenticatedApi(`${API_ENDPOINTS.COMMUNICATION.MESSAGING.STATS}?period=${period}`);
  return data;
}

/**
 * Schedule message
 */
export async function scheduleMessage(messageData: {
  type: 'sms' | 'email' | 'whatsapp';
  to: string | string[];
  content: string;
  subject?: string;
  scheduledFor: string;
  templateId?: string;
  variables?: Record<string, string>;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.MESSAGING.SCHEDULE.CREATE, {
    method: 'POST',
    body: JSON.stringify(messageData),
  });
  return data;
}

/**
 * Cancel scheduled message
 */
export async function cancelScheduledMessage(messageId: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.MESSAGING.SCHEDULE.DELETE(messageId), {
    method: 'DELETE',
  });
  return data;
}

/**
 * Get scheduled messages
 */
export async function getScheduledMessages(filters?: {
  type?: 'sms' | 'email' | 'whatsapp';
  status?: 'pending' | 'sent' | 'cancelled';
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }
  
  const endpoint = `${API_ENDPOINTS.COMMUNICATION.MESSAGING.SCHEDULE.BASE}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}
