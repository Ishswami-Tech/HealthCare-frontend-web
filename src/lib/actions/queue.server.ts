'use server';

import { authenticatedApi, revalidateCache } from './auth.server';
import { API_ENDPOINTS } from '@/lib/config/config';
import { logger } from '@/lib/utils/logger';

// ===== QUEUE MANAGEMENT ACTIONS =====

/**
 * Get queue data
 */
export async function getQueue(filters?: {
  type?: string;
  status?: string;
  doctorId?: string;
  clinicId?: string;
  date?: string;
}) {
  try {
    const query = new URLSearchParams();
    if (filters?.type) query.set('type', filters.type);
    if (filters?.status) query.set('status', filters.status);
    if (filters?.doctorId) query.set('doctorId', filters.doctorId);
    if (filters?.clinicId) query.set('clinicId', filters.clinicId);
    if (filters?.date) query.set('date', filters.date);
    const endpoint = query.toString()
      ? `${API_ENDPOINTS.QUEUE.GET}?${query.toString()}`
      : API_ENDPOINTS.QUEUE.GET;
    const { data } = await authenticatedApi(endpoint, {});
    return data;
  } catch (error) {
    logger.error('getQueue failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(locationId: string) {
  try {
    if (!locationId) {
      logger.error('getQueueStats: locationId is required', new Error('Missing locationId'));
      return null;
    }
    const { data } = await authenticatedApi(`${API_ENDPOINTS.QUEUE.STATS}?locationId=${locationId}`, {});
    return data;
  } catch (error) {
    logger.error('getQueueStats failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Update queue status
 */
export async function updateQueueStatus(patientId: string, status: string) {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.UPDATE_STATUS(patientId), {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    revalidateCache('queue');
    revalidateCache('appointments');
    return data;
  } catch (error) {
    logger.error('updateQueueStatus failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Call next patient in queue
 */
export async function callNextPatient(doctorId: string, appointmentId: string) {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.CALL_NEXT, {
      method: 'POST',
      body: JSON.stringify({ doctorId, appointmentId })
    });
    revalidateCache('queue');
    revalidateCache('appointments');
    return data;
  } catch (error) {
    logger.error('callNextPatient failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Add patient to queue
 */
export async function addToQueue(queueData: {
  patientId: string;
  appointmentId?: string;
  queueType: string;
}) {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.ADD, {
      method: 'POST',
      body: JSON.stringify(queueData)
    });
    revalidateCache('queue');
    revalidateCache('appointments');
    return data;
  } catch (error) {
    logger.error('addToQueue failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Remove patient from queue
 */
export async function removeFromQueue(queueId: string, reason?: string) {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.REMOVE(queueId), {
      method: 'DELETE',
      body: reason ? JSON.stringify({ reason }) : null
    });
    revalidateCache('queue');
    revalidateCache('appointments');
    return data;
  } catch (error) {
    logger.error('removeFromQueue failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Reorder queue
 */
export async function reorderQueue(doctorId: string, date: string, newOrder: string[]) {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.REORDER, {
      method: 'POST',
      body: JSON.stringify({ doctorId, date, newOrder })
    });
    revalidateCache('queue');
    revalidateCache('appointments');
    return data;
  } catch (error) {
    logger.error('reorderQueue failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Get queue history
 */
export async function getQueueHistory(filters?: Record<string, any>) {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `${API_ENDPOINTS.QUEUE.HISTORY}?${queryParams}` : API_ENDPOINTS.QUEUE.HISTORY;
    const { data } = await authenticatedApi(endpoint, {});
    return data;
  } catch (error) {
    logger.error('getQueueHistory failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Get queue analytics
 */
export async function getQueueAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'day') {
  try {
    const { data } = await authenticatedApi(`${API_ENDPOINTS.QUEUE.ANALYTICS}?period=${period}`, {});
    return data;
  } catch (error) {
    logger.error('getQueueAnalytics failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Update queue position
 */
export async function updateQueuePosition(queueId: string, newPosition: number) {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.UPDATE_POSITION(queueId), {
      method: 'PATCH',
      body: JSON.stringify({ position: newPosition })
    });
    revalidateCache('queue');
    return data;
  } catch (error) {
    logger.error('updateQueuePosition failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Pause queue
 */
export async function pauseQueue(doctorId: string) {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.PAUSE, {
      method: 'POST',
      body: JSON.stringify({ doctorId })
    });
    revalidateCache('queue');
    revalidateCache('appointments');
    return data;
  } catch (error) {
    logger.error('pauseQueue failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Resume queue
 */
export async function resumeQueue(doctorId: string) {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.RESUME, {
      method: 'POST',
      body: JSON.stringify({ doctorId })
    });
    revalidateCache('queue');
    revalidateCache('appointments');
    return data;
  } catch (error) {
    logger.error('resumeQueue failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Get queue configuration
 */
export async function getQueueConfig() {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.CONFIG, {});
    return data;
  } catch (error) {
    logger.error('getQueueConfig failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Update queue configuration
 */
export async function updateQueueConfig(config: any) {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.CONFIG, {
      method: 'PATCH',
      body: JSON.stringify(config)
    });
    return data;
  } catch (error) {
    logger.error('updateQueueConfig failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Get queue notifications
 */
export async function getQueueNotifications(userId?: string) {
  try {
    const endpoint = userId ? `${API_ENDPOINTS.QUEUE.NOTIFICATIONS.GET}?userId=${userId}` : API_ENDPOINTS.QUEUE.NOTIFICATIONS.GET;
    const { data } = await authenticatedApi(endpoint, {});
    return data;
  } catch (error) {
    logger.error('getQueueNotifications failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Mark queue notification as read
 */
export async function markQueueNotificationAsRead(notificationId: string) {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.NOTIFICATIONS.MARK_READ(notificationId), {
      method: 'PATCH'
    });
    return data;
  } catch (error) {
    logger.error('markQueueNotificationAsRead failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Send queue notification
 */
export async function sendQueueNotification(notificationData: any) {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.NOTIFICATIONS.SEND, {
      method: 'POST',
      body: JSON.stringify(notificationData)
    });
    return data;
  } catch (error) {
    logger.error('sendQueueNotification failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Get queue wait times
 */
export async function getQueueWaitTimes(queueType?: string) {
  try {
    const endpoint = queueType ? `${API_ENDPOINTS.QUEUE.WAIT_TIMES}?type=${queueType}` : API_ENDPOINTS.QUEUE.WAIT_TIMES;
    const { data } = await authenticatedApi(endpoint, {});
    return data;
  } catch (error) {
    logger.error('getQueueWaitTimes failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Estimate wait time for new patient
 */
export async function estimateWaitTime(queueType: string, priority?: string) {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.ESTIMATE_WAIT_TIME, {
      method: 'POST',
      body: JSON.stringify({ queueType, priority })
    });
    return data;
  } catch (error) {
    logger.error('estimateWaitTime failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Get queue capacity
 */
export async function getQueueCapacity(queueType: string) {
  try {
    const { data } = await authenticatedApi(`${API_ENDPOINTS.QUEUE.CAPACITY}?type=${queueType}`, {});
    return data;
  } catch (error) {
    logger.error('getQueueCapacity failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Update queue capacity
 */
export async function updateQueueCapacity(queueType: string, capacity: number) {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.CAPACITY, {
      method: 'PATCH',
      body: JSON.stringify({ queueType, capacity })
    });
    return data;
  } catch (error) {
    logger.error('updateQueueCapacity failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Get queue performance metrics
 */
export async function getQueuePerformanceMetrics(filters?: Record<string, any>) {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `${API_ENDPOINTS.QUEUE.PERFORMANCE}?${queryParams}` : API_ENDPOINTS.QUEUE.PERFORMANCE;
    const { data } = await authenticatedApi(endpoint, {});
    return data;
  } catch (error) {
    logger.error('getQueuePerformanceMetrics failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
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
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.EXPORT, {
      method: 'POST',
      body: JSON.stringify(filters)
    });
    return data;
  } catch (error) {
    logger.error('exportQueueData failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Get queue alerts
 */
export async function getQueueAlerts() {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.ALERTS.GET, {});
    return data;
  } catch (error) {
    logger.error('getQueueAlerts failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
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
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.ALERTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(alertData)
    });
    return data;
  } catch (error) {
    logger.error('createQueueAlert failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Update queue alert
 */
export async function updateQueueAlert(alertId: string, updates: {
  threshold?: number;
  enabled?: boolean;
}) {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.ALERTS.UPDATE(alertId), {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    return data;
  } catch (error) {
    logger.error('updateQueueAlert failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Delete queue alert
 */
export async function deleteQueueAlert(alertId: string) {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.QUEUE.ALERTS.DELETE(alertId), {
      method: 'DELETE'
    });
    return data;
  } catch (error) {
    logger.error('deleteQueueAlert failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}
