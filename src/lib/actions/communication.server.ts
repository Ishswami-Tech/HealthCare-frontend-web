'use server';

import { authenticatedApi } from './auth.server';
import { API_ENDPOINTS } from '../config/config';

// ===== UNIFIED COMMUNICATION =====

/**
 * Send unified communication (automatically selects channel based on type)
 */
export async function sendUnifiedCommunication(data: {
  type: 'push' | 'email' | 'sms' | 'whatsapp' | 'socket' | 'both';
  recipientId?: string;
  recipientIds?: string[];
  topic?: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  category?: string;
  scheduledAt?: string;
}) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.SEND, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

// ===== APPOINTMENT REMINDER =====

/**
 * Send appointment reminder
 */
export async function sendAppointmentReminder(data: {
  appointmentId: string;
  reminderType?: 'push' | 'email' | 'sms' | 'whatsapp' | 'all';
  reminderTime?: string;
}) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.APPOINTMENT_REMINDER, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

// ===== PRESCRIPTION READY =====

/**
 * Send prescription ready notification
 */
export async function sendPrescriptionReady(data: {
  prescriptionId: string;
  patientId: string;
  notificationType?: 'push' | 'email' | 'sms' | 'whatsapp' | 'all';
}) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.PRESCRIPTION_READY, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

// ===== PUSH NOTIFICATIONS =====

/**
 * Send push notification
 */
export async function sendPushNotification(data: {
  recipientId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  sound?: string;
  badge?: number;
}) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.PUSH.SEND, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

/**
 * Send multiple push notifications
 */
export async function sendMultiplePushNotifications(data: {
  notifications: Array<{
    recipientId: string;
    title: string;
    body: string;
    data?: Record<string, any>;
  }>;
}) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.PUSH.SEND_MULTIPLE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

/**
 * Send topic-based push notification
 */
export async function sendTopicPushNotification(data: {
  topic: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.PUSH.SEND_TOPIC, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

/**
 * Subscribe to push notification topic
 */
export async function subscribeToTopic(data: {
  userId: string;
  topic: string;
  deviceToken?: string;
}) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.PUSH.SUBSCRIBE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

/**
 * Unsubscribe from push notification topic
 */
export async function unsubscribeFromTopic(data: {
  userId: string;
  topic: string;
  deviceToken?: string;
}) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.PUSH.UNSUBSCRIBE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

// ===== EMAIL =====

/**
 * Send email
 */
export async function sendEmail(data: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
  }>;
}) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.EMAIL.SEND, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

// ===== CHAT =====

/**
 * Backup chat messages
 */
export async function backupChat(data: {
  userId: string;
  messages: Array<{
    id: string;
    content: string;
    timestamp: string;
    senderId: string;
    receiverId: string;
  }>;
}) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.CHAT.BACKUP, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

/**
 * Get chat history
 */
export async function getChatHistory(userId: string, filters?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }
  
  const endpoint = `${API_ENDPOINTS.COMMUNICATION.CHAT.HISTORY(userId)}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data: response } = await authenticatedApi(endpoint);
  return response;
}

/**
 * Get chat statistics
 */
export async function getChatStats(filters?: {
  userId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }
  
  const endpoint = `${API_ENDPOINTS.COMMUNICATION.CHAT.STATS}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data: response } = await authenticatedApi(endpoint);
  return response;
}

// ===== STATS & HEALTH =====

/**
 * Get communication statistics
 */
export async function getCommunicationStats(filters?: {
  startDate?: string;
  endDate?: string;
  channel?: 'push' | 'email' | 'sms' | 'whatsapp';
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }
  
  const endpoint = `${API_ENDPOINTS.COMMUNICATION.STATS}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data: response } = await authenticatedApi(endpoint);
  return response;
}

/**
 * Get communication service health status
 */
export async function getCommunicationHealth() {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.HEALTH);
  return response;
}

/**
 * Test communication service
 */
export async function testCommunication(data: {
  channel: 'push' | 'email' | 'sms' | 'whatsapp';
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
}) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.TEST, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

// ===== CONTACT FORM =====

/**
 * Submit contact form
 */
export async function submitContactForm(data: {
  name: string;
  email: string;
  phone: string;
  condition?: string;
  message: string;
  type?: 'contact' | 'consultation';
}) {
  // Use unified communication to send contact form submission
  const { data: response } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.SEND, {
    method: 'POST',
    body: JSON.stringify({
      type: 'email',
      title: `Contact Form Submission - ${data.type === 'consultation' ? 'Consultation Request' : 'General Inquiry'}`,
      message: `
        Name: ${data.name}
        Email: ${data.email}
        Phone: ${data.phone}
        ${data.condition ? `Health Condition: ${data.condition}` : ''}
        
        Message:
        ${data.message}
      `,
      category: data.type === 'consultation' ? 'consultation_request' : 'contact_form',
      priority: 'normal',
    }),
  });
  return response;
}

/**
 * Submit consultation booking request
 */
export async function submitConsultationBooking(data: {
  name: string;
  phone: string;
  preferredDate?: string;
  preferredTime?: string;
  reason?: string;
}) {
  // Use unified communication to send consultation booking
  const { data: response } = await authenticatedApi(API_ENDPOINTS.COMMUNICATION.SEND, {
    method: 'POST',
    body: JSON.stringify({
      type: 'email',
      title: 'Consultation Booking Request',
      message: `
        Name: ${data.name}
        Phone: ${data.phone}
        ${data.preferredDate ? `Preferred Date: ${data.preferredDate}` : ''}
        ${data.preferredTime ? `Preferred Time: ${data.preferredTime}` : ''}
        ${data.reason ? `Reason: ${data.reason}` : ''}
      `,
      category: 'consultation_booking',
      priority: 'high',
    }),
  });
  return response;
}
