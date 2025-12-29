'use server';

import { authenticatedApi } from './auth.server';
import { API_ENDPOINTS } from '../config/config';

// ===== QUEUE MANAGEMENT ACTIONS =====

/**
 * Get queue data
 */
export async function getQueue(filters?: {
  type?: string;
  status?: string;
  doctorId?: string;
  clinicId?: string;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }
  
  const endpoint = `${API_ENDPOINTS.QUEUE.GET}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.STATS);
  return data;
}

/**
 * Update queue status
 */
export async function updateQueueStatus(patientId: string, status: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.UPDATE_STATUS(patientId), {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return data;
}

/**
 * Call next patient in queue
 */
export async function callNextPatient(queueType: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.CALL_NEXT, {
    method: 'POST',
    body: JSON.stringify({ queueType }),
  });
  return data;
}

/**
 * Add patient to queue
 */
export async function addToQueue(queueData: {
  patientId: string;
  appointmentId?: string;
  queueType: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  estimatedDuration?: number;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.ADD, {
    method: 'POST',
    body: JSON.stringify(queueData),
  });
  return data;
}

/**
 * Remove patient from queue
 */
export async function removeFromQueue(queueId: string, reason?: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.REMOVE(queueId), {
    method: 'DELETE',
    ...(reason && { body: JSON.stringify({ reason }) }),
  });
  return data;
}

/**
 * Reorder queue
 */
export async function reorderQueue(queueType: string, patientIds: string[]) {
  const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.REORDER, {
    method: 'POST',
    body: JSON.stringify({ queueType, patientIds }),
  });
  return data;
}

/**
 * Get queue history
 */
export async function getQueueHistory(filters?: {
  startDate?: string;
  endDate?: string;
  patientId?: string;
  doctorId?: string;
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
  
  const endpoint = `${API_ENDPOINTS.QUEUE.HISTORY}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Get queue analytics
 */
export async function getQueueAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'day') {
  const { data } = await authenticatedApi(`${API_ENDPOINTS.QUEUE.ANALYTICS}?period=${period}`);
  return data;
}

/**
 * Update queue position
 */
export async function updateQueuePosition(queueId: string, newPosition: number) {
  const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.UPDATE_POSITION(queueId), {
    method: 'PATCH',
    body: JSON.stringify({ position: newPosition }),
  });
  return data;
}

/**
 * Pause queue
 */
export async function pauseQueue(queueType: string, reason?: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.PAUSE, {
    method: 'POST',
    body: JSON.stringify({ queueType, reason }),
  });
  return data;
}

/**
 * Resume queue
 */
export async function resumeQueue(queueType: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.RESUME, {
    method: 'POST',
    body: JSON.stringify({ queueType }),
  });
  return data;
}

/**
 * Get queue configuration
 */
export async function getQueueConfig() {
  const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.CONFIG);
  return data;
}

/**
 * Update queue configuration
 */
export async function updateQueueConfig(config: {
  maxWaitTime?: number;
  averageConsultationTime?: number;
  autoCallNext?: boolean;
  allowWalkIns?: boolean;
  priorityEnabled?: boolean;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.CONFIG, {
    method: 'PATCH',
    body: JSON.stringify(config),
  });
  return data;
}

/**
 * Get queue notifications
 */
export async function getQueueNotifications(userId?: string) {
  const params = userId ? `?userId=${userId}` : '';
  const { data } = await authenticatedApi(`${API_ENDPOINTS.QUEUE.NOTIFICATIONS.GET}${params}`);
  return data;
}

/**
 * Mark queue notification as read
 */
export async function markQueueNotificationAsRead(notificationId: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.NOTIFICATIONS.MARK_READ(notificationId), {
    method: 'PATCH',
  });
  return data;
}

/**
 * Send queue notification
 */
export async function sendQueueNotification(notificationData: {
  patientId: string;
  type: 'CALLED' | 'DELAYED' | 'CANCELLED' | 'REMINDER';
  message: string;
  channels?: ('sms' | 'email' | 'push')[];
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.NOTIFICATIONS.SEND, {
    method: 'POST',
    body: JSON.stringify(notificationData),
  });
  return data;
}

/**
 * Get queue wait times
 */
export async function getQueueWaitTimes(queueType?: string) {
  const params = queueType ? `?type=${queueType}` : '';
  const { data } = await authenticatedApi(`${API_ENDPOINTS.QUEUE.WAIT_TIMES}${params}`);
  return data;
}

/**
 * Estimate wait time for new patient
 */
export async function estimateWaitTime(queueType: string, priority?: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.ESTIMATE_WAIT_TIME, {
    method: 'POST',
    body: JSON.stringify({ queueType, priority }),
  });
  return data;
}

/**
 * Get queue capacity
 */
export async function getQueueCapacity(queueType: string) {
  const { data } = await authenticatedApi(`${API_ENDPOINTS.QUEUE.CAPACITY}?type=${queueType}`);
  return data;
}

/**
 * Update queue capacity
 */
export async function updateQueueCapacity(queueType: string, capacity: number) {
  const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.CAPACITY, {
    method: 'PATCH',
    body: JSON.stringify({ queueType, capacity }),
  });
  return data;
}

/**
 * Get queue performance metrics
 */
export async function getQueuePerformanceMetrics(filters?: {
  startDate?: string;
  endDate?: string;
  queueType?: string;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }
  
  const endpoint = `${API_ENDPOINTS.QUEUE.PERFORMANCE}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Export queue data
 */
export async function exportQueueData(filters: {
  startDate: string;
  endDate: string;
  format: 'csv' | 'excel' | 'pdf';
  queueType?: string;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.EXPORT, {
    method: 'POST',
    body: JSON.stringify(filters),
  });
  return data;
}

/**
 * Get queue alerts
 */
export async function getQueueAlerts() {
  const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.ALERTS.GET);
  return data;
}

/**
 * Create queue alert
 */
export async function createQueueAlert(alertData: {
  type: 'LONG_WAIT' | 'CAPACITY_FULL' | 'NO_SHOW' | 'DELAY';
  threshold: number;
  queueType?: string;
  enabled: boolean;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.ALERTS.CREATE, {
    method: 'POST',
    body: JSON.stringify(alertData),
  });
  return data;
}

/**
 * Update queue alert
 */
export async function updateQueueAlert(alertId: string, updates: {
  threshold?: number;
  enabled?: boolean;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.ALERTS.UPDATE(alertId), {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data;
}

/**
 * Delete queue alert
 */
export async function deleteQueueAlert(alertId: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.ALERTS.DELETE(alertId), {
    method: 'DELETE',
  });
  return data;
}
