import { useQueryData } from '../core/useQueryData';
import { useMutationData } from '../core/useMutationData';
import {
  sendUnifiedCommunication,
  sendAppointmentReminder,
  sendPrescriptionReady,
  sendPushNotification,
  sendMultiplePushNotifications,
  sendTopicPushNotification,
  subscribeToTopic,
  unsubscribeFromTopic,
  sendEmail,
  backupChat,
  getChatHistory,
  getChatStats,
  getCommunicationStats,
  getCommunicationHealth,
  testCommunication,
  submitContactForm,
  submitConsultationBooking,
} from '@/lib/actions/communication.server';
import {
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationSettings,
  updateNotificationSettings,
  sendBulkNotifications,
  sendSMS,
  sendWhatsAppMessage,
  getMessageTemplates,
  createMessageTemplate,
  updateMessageTemplate,
  deleteMessageTemplate,
  getMessageHistory,
  getMessagingStats,
  scheduleMessage,
  cancelScheduledMessage,
  getScheduledMessages,
} from '@/lib/actions/notifications.server';

// ===== UNIFIED COMMUNICATION HOOKS =====

/**
 * Hook to send unified communication
 */
export const useSendUnifiedCommunication = () => {
  return useMutationData(['sendUnifiedCommunication'], async (data: Parameters<typeof sendUnifiedCommunication>[0]) => {
    const result = await sendUnifiedCommunication(data);
    return { status: 200, data: result };
  }, ['communication']);
};

/**
 * Hook to send appointment reminder
 */
export const useSendAppointmentReminder = () => {
  return useMutationData(['sendAppointmentReminder'], async (data: Parameters<typeof sendAppointmentReminder>[0]) => {
    const result = await sendAppointmentReminder(data);
    return { status: 200, data: result };
  }, ['communication']);
};

/**
 * Hook to send prescription ready notification
 */
export const useSendPrescriptionReady = () => {
  return useMutationData(['sendPrescriptionReady'], async (data: Parameters<typeof sendPrescriptionReady>[0]) => {
    const result = await sendPrescriptionReady(data);
    return { status: 200, data: result };
  }, ['communication']);
};

// ===== PUSH NOTIFICATION HOOKS =====

/**
 * Hook to send push notification
 */
export const useSendPushNotification = () => {
  return useMutationData(['sendPushNotification'], async (data: Parameters<typeof sendPushNotification>[0]) => {
    const result = await sendPushNotification(data);
    return { status: 200, data: result };
  }, ['communication', 'push']);
};

/**
 * Hook to send multiple push notifications
 */
export const useSendMultiplePushNotifications = () => {
  return useMutationData(['sendMultiplePushNotifications'], async (data: Parameters<typeof sendMultiplePushNotifications>[0]) => {
    const result = await sendMultiplePushNotifications(data);
    return { status: 200, data: result };
  }, ['communication', 'push']);
};

/**
 * Hook to send topic-based push notification
 */
export const useSendTopicPushNotification = () => {
  return useMutationData(['sendTopicPushNotification'], async (data: Parameters<typeof sendTopicPushNotification>[0]) => {
    const result = await sendTopicPushNotification(data);
    return { status: 200, data: result };
  }, ['communication', 'push']);
};

/**
 * Hook to subscribe to topic
 */
export const useSubscribeToTopic = () => {
  return useMutationData(['subscribeToTopic'], async (data: Parameters<typeof subscribeToTopic>[0]) => {
    const result = await subscribeToTopic(data);
    return { status: 200, data: result };
  }, ['communication', 'push']);
};

/**
 * Hook to unsubscribe from topic
 */
export const useUnsubscribeFromTopic = () => {
  return useMutationData(['unsubscribeFromTopic'], async (data: Parameters<typeof unsubscribeFromTopic>[0]) => {
    const result = await unsubscribeFromTopic(data);
    return { status: 200, data: result };
  }, ['communication', 'push']);
};

// ===== EMAIL HOOKS =====

// ===== CHAT HOOKS =====

/**
 * Hook to backup chat messages
 */
export const useBackupChat = () => {
  return useMutationData(['backupChat'], async (data: Parameters<typeof backupChat>[0]) => {
    const result = await backupChat(data);
    return { status: 200, data: result };
  }, ['communication', 'chat']);
};

/**
 * Hook to get chat history
 */
export const useChatHistory = (userId: string, filters?: Parameters<typeof getChatHistory>[1]) => {
  return useQueryData(['communication', 'chat', 'history', userId, filters], async () => {
    return await getChatHistory(userId, filters);
  }, { enabled: !!userId });
};

/**
 * Hook to get chat statistics
 */
export const useChatStats = (filters?: Parameters<typeof getChatStats>[0]) => {
  return useQueryData(['communication', 'chat', 'stats', filters], async () => {
    return await getChatStats(filters);
  });
};

// ===== STATS & HEALTH HOOKS =====

/**
 * Hook to get communication statistics
 */
export const useCommunicationStats = (filters?: Parameters<typeof getCommunicationStats>[0]) => {
  return useQueryData(['communication', 'stats', filters], async () => {
    return await getCommunicationStats(filters);
  });
};

/**
 * Hook to get communication health status
 */
export const useCommunicationHealth = () => {
  return useQueryData(['communication', 'health'], async () => {
    return await getCommunicationHealth();
  });
};

/**
 * Hook to test communication service
 */
export const useTestCommunication = () => {
  return useMutationData(['testCommunication'], async (data: Parameters<typeof testCommunication>[0]) => {
    const result = await testCommunication(data);
    return { status: 200, data: result };
  }, ['communication']);
};

// ===== NOTIFICATION HOOKS =====

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

// ===== CONTACT FORM HOOKS =====

/**
 * Hook to submit contact form
 */
export const useSubmitContactForm = () => {
  return useMutationData(['submitContactForm'], async (data: Parameters<typeof submitContactForm>[0]) => {
    const result = await submitContactForm(data);
    return { status: 200, data: result };
  });
};

/**
 * Hook to submit consultation booking
 */
export const useSubmitConsultationBooking = () => {
  return useMutationData(['submitConsultationBooking'], async (data: Parameters<typeof submitConsultationBooking>[0]) => {
    const result = await submitConsultationBooking(data);
    return { status: 200, data: result };
  });
};
