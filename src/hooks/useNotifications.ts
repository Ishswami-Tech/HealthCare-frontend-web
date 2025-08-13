import { useQueryData } from './useQueryData';
import { useMutationData } from './useMutationData';
import {
  getUserNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationSettings,
  updateNotificationSettings,
  sendBulkNotifications,
  sendSMS,
  sendEmail,
  sendWhatsAppMessage,
  getMessageTemplates,
  createMessageTemplate,
  updateMessageTemplate,
  deleteMessageTemplate,
  getMessageHistory,
  getMessagingStats,
  scheduleMessage,
  cancelScheduledMessage,
  getScheduledMessages
} from '@/lib/actions/notifications.server';

// ===== NOTIFICATIONS HOOKS =====

/**
 * Hook to get user notifications
 */
export const useUserNotifications = (userId?: string, filters?: {
  type?: string;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}) => {
  return useQueryData(['notifications', userId, filters], async () => {
    return await getUserNotifications(userId, filters);
  });
};

/**
 * Hook to create notification
 */
export const useCreateNotification = () => {
  return useMutationData(['createNotification'], async (notificationData: {
    userId: string;
    type: 'APPOINTMENT' | 'PRESCRIPTION' | 'REMINDER' | 'SYSTEM' | 'MARKETING';
    title: string;
    message: string;
    data?: Record<string, any>;
    scheduledFor?: string;
  }) => {
    const result = await createNotification(notificationData);
    return { status: 200, data: result };
  }, 'notifications');
};

/**
 * Hook to mark notification as read
 */
export const useMarkNotificationAsRead = () => {
  return useMutationData(['markNotificationAsRead'], async (notificationId: string) => {
    const result = await markNotificationAsRead(notificationId);
    return { status: 200, data: result };
  }, 'notifications');
};

/**
 * Hook to mark all notifications as read
 */
export const useMarkAllNotificationsAsRead = () => {
  return useMutationData(['markAllNotificationsAsRead'], async (userId?: string) => {
    const result = await markAllNotificationsAsRead(userId);
    return { status: 200, data: result };
  }, 'notifications');
};

/**
 * Hook to delete notification
 */
export const useDeleteNotification = () => {
  return useMutationData(['deleteNotification'], async (notificationId: string) => {
    const result = await deleteNotification(notificationId);
    return { status: 200, data: result };
  }, 'notifications');
};

/**
 * Hook to get notification settings
 */
export const useNotificationSettings = (userId?: string) => {
  return useQueryData(['notificationSettings', userId], async () => {
    return await getNotificationSettings(userId);
  });
};

/**
 * Hook to update notification settings
 */
export const useUpdateNotificationSettings = () => {
  return useMutationData(['updateNotificationSettings'], async (settings: {
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
    return { status: 200, data: result };
  }, 'notificationSettings');
};

/**
 * Hook to send bulk notifications
 */
export const useSendBulkNotifications = () => {
  return useMutationData(['sendBulkNotifications'], async (notificationData: {
    userIds: string[];
    type: 'APPOINTMENT' | 'PRESCRIPTION' | 'REMINDER' | 'SYSTEM' | 'MARKETING';
    title: string;
    message: string;
    channels?: ('email' | 'sms' | 'push' | 'whatsapp')[];
    scheduledFor?: string;
  }) => {
    const result = await sendBulkNotifications(notificationData);
    return { status: 200, data: result };
  });
};

// ===== MESSAGING HOOKS =====

/**
 * Hook to send SMS
 */
export const useSendSMS = () => {
  return useMutationData(['sendSMS'], async (messageData: {
    to: string;
    message: string;
    templateId?: string;
    variables?: Record<string, string>;
  }) => {
    const result = await sendSMS(messageData);
    return { status: 200, data: result };
  });
};

/**
 * Hook to send email
 */
export const useSendEmail = () => {
  return useMutationData(['sendEmail'], async (emailData: {
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
  }) => {
    const result = await sendEmail(emailData);
    return { status: 200, data: result };
  });
};

/**
 * Hook to send WhatsApp message
 */
export const useSendWhatsAppMessage = () => {
  return useMutationData(['sendWhatsAppMessage'], async (messageData: {
    to: string;
    message: string;
    templateId?: string;
    variables?: Record<string, string>;
    mediaUrl?: string;
  }) => {
    const result = await sendWhatsAppMessage(messageData);
    return { status: 200, data: result };
  });
};

/**
 * Hook to get message templates
 */
export const useMessageTemplates = (type?: 'sms' | 'email' | 'whatsapp') => {
  return useQueryData(['messageTemplates', type], async () => {
    return await getMessageTemplates(type);
  });
};

/**
 * Hook to create message template
 */
export const useCreateMessageTemplate = () => {
  return useMutationData(['createMessageTemplate'], async (templateData: {
    name: string;
    type: 'sms' | 'email' | 'whatsapp';
    subject?: string;
    content: string;
    variables?: string[];
    category?: string;
  }) => {
    const result = await createMessageTemplate(templateData);
    return { status: 200, data: result };
  }, 'messageTemplates');
};

/**
 * Hook to update message template
 */
export const useUpdateMessageTemplate = () => {
  return useMutationData(['updateMessageTemplate'], async ({ templateId, updates }: {
    templateId: string;
    updates: {
      name?: string;
      subject?: string;
      content?: string;
      variables?: string[];
      category?: string;
      isActive?: boolean;
    };
  }) => {
    const result = await updateMessageTemplate(templateId, updates);
    return { status: 200, data: result };
  }, 'messageTemplates');
};

/**
 * Hook to delete message template
 */
export const useDeleteMessageTemplate = () => {
  return useMutationData(['deleteMessageTemplate'], async (templateId: string) => {
    const result = await deleteMessageTemplate(templateId);
    return { status: 200, data: result };
  }, 'messageTemplates');
};

/**
 * Hook to get message history
 */
export const useMessageHistory = (filters?: {
  userId?: string;
  type?: 'sms' | 'email' | 'whatsapp';
  status?: 'sent' | 'delivered' | 'failed';
  startDate?: string;
  endDate?: string;
  limit?: number;
}) => {
  return useQueryData(['messageHistory', filters], async () => {
    return await getMessageHistory(filters);
  });
};

/**
 * Hook to get messaging statistics
 */
export const useMessagingStats = (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
  return useQueryData(['messagingStats', period], async () => {
    return await getMessagingStats(period);
  });
};

/**
 * Hook to schedule message
 */
export const useScheduleMessage = () => {
  return useMutationData(['scheduleMessage'], async (messageData: {
    type: 'sms' | 'email' | 'whatsapp';
    to: string | string[];
    content: string;
    subject?: string;
    scheduledFor: string;
    templateId?: string;
    variables?: Record<string, string>;
  }) => {
    const result = await scheduleMessage(messageData);
    return { status: 200, data: result };
  }, 'scheduledMessages');
};

/**
 * Hook to cancel scheduled message
 */
export const useCancelScheduledMessage = () => {
  return useMutationData(['cancelScheduledMessage'], async (messageId: string) => {
    const result = await cancelScheduledMessage(messageId);
    return { status: 200, data: result };
  }, 'scheduledMessages');
};

/**
 * Hook to get scheduled messages
 */
export const useScheduledMessages = (filters?: {
  type?: 'sms' | 'email' | 'whatsapp';
  status?: 'pending' | 'sent' | 'cancelled';
}) => {
  return useQueryData(['scheduledMessages', filters], async () => {
    return await getScheduledMessages(filters);
  });
};
