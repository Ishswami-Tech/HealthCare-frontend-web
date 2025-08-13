'use server';

import { authenticatedApi } from './auth.server';

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
  
  const endpoint = `/notifications${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Create notification
 */
export async function createNotification(notificationData: {
  userId: string;
  type: 'APPOINTMENT' | 'PRESCRIPTION' | 'REMINDER' | 'SYSTEM' | 'MARKETING';
  title: string;
  message: string;
  data?: Record<string, any>;
  scheduledFor?: string;
}) {
  const { data } = await authenticatedApi('/notifications', {
    method: 'POST',
    body: JSON.stringify(notificationData),
  });
  return data;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  const { data } = await authenticatedApi(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
  return data;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId?: string) {
  const body = userId ? JSON.stringify({ userId }) : undefined;
  const { data } = await authenticatedApi('/notifications/mark-all-read', {
    method: 'PATCH',
    body,
  });
  return data;
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string) {
  const { data } = await authenticatedApi(`/notifications/${notificationId}`, {
    method: 'DELETE',
  });
  return data;
}

/**
 * Get notification settings
 */
export async function getNotificationSettings(userId?: string) {
  const params = userId ? `?userId=${userId}` : '';
  const { data } = await authenticatedApi(`/notifications/settings${params}`);
  return data;
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(settings: {
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
  const { data } = await authenticatedApi('/notifications/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
  return data;
}

/**
 * Send bulk notifications
 */
export async function sendBulkNotifications(notificationData: {
  userIds: string[];
  type: 'APPOINTMENT' | 'PRESCRIPTION' | 'REMINDER' | 'SYSTEM' | 'MARKETING';
  title: string;
  message: string;
  channels?: ('email' | 'sms' | 'push' | 'whatsapp')[];
  scheduledFor?: string;
}) {
  const { data } = await authenticatedApi('/notifications/bulk', {
    method: 'POST',
    body: JSON.stringify(notificationData),
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
  const { data } = await authenticatedApi('/messaging/sms', {
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
  const { data } = await authenticatedApi('/messaging/email', {
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
  const { data } = await authenticatedApi('/messaging/whatsapp', {
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
  const { data } = await authenticatedApi(`/messaging/templates${params}`);
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
  const { data } = await authenticatedApi('/messaging/templates', {
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
  const { data } = await authenticatedApi(`/messaging/templates/${templateId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data;
}

/**
 * Delete message template
 */
export async function deleteMessageTemplate(templateId: string) {
  const { data } = await authenticatedApi(`/messaging/templates/${templateId}`, {
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
  
  const endpoint = `/messaging/history${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Get messaging statistics
 */
export async function getMessagingStats(period: 'day' | 'week' | 'month' | 'year' = 'month') {
  const { data } = await authenticatedApi(`/messaging/stats?period=${period}`);
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
  const { data } = await authenticatedApi('/messaging/schedule', {
    method: 'POST',
    body: JSON.stringify(messageData),
  });
  return data;
}

/**
 * Cancel scheduled message
 */
export async function cancelScheduledMessage(messageId: string) {
  const { data } = await authenticatedApi(`/messaging/schedule/${messageId}`, {
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
  
  const endpoint = `/messaging/schedule${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}
