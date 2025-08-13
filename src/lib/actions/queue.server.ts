'use server';

import { authenticatedApi } from './auth.server';

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
  
  const endpoint = `/queue${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const { data } = await authenticatedApi('/queue/stats');
  return data;
}

/**
 * Update queue status
 */
export async function updateQueueStatus(patientId: string, status: string) {
  const { data } = await authenticatedApi(`/queue/${patientId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return data;
}

/**
 * Call next patient in queue
 */
export async function callNextPatient(queueType: string) {
  const { data } = await authenticatedApi('/queue/call-next', {
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
  const { data } = await authenticatedApi('/queue', {
    method: 'POST',
    body: JSON.stringify(queueData),
  });
  return data;
}

/**
 * Remove patient from queue
 */
export async function removeFromQueue(queueId: string, reason?: string) {
  const { data } = await authenticatedApi(`/queue/${queueId}`, {
    method: 'DELETE',
    body: reason ? JSON.stringify({ reason }) : undefined,
  });
  return data;
}

/**
 * Reorder queue
 */
export async function reorderQueue(queueType: string, patientIds: string[]) {
  const { data } = await authenticatedApi('/queue/reorder', {
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
  
  const endpoint = `/queue/history${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Get queue analytics
 */
export async function getQueueAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'day') {
  const { data } = await authenticatedApi(`/queue/analytics?period=${period}`);
  return data;
}

/**
 * Update queue position
 */
export async function updateQueuePosition(queueId: string, newPosition: number) {
  const { data } = await authenticatedApi(`/queue/${queueId}/position`, {
    method: 'PATCH',
    body: JSON.stringify({ position: newPosition }),
  });
  return data;
}

/**
 * Pause queue
 */
export async function pauseQueue(queueType: string, reason?: string) {
  const { data } = await authenticatedApi('/queue/pause', {
    method: 'POST',
    body: JSON.stringify({ queueType, reason }),
  });
  return data;
}

/**
 * Resume queue
 */
export async function resumeQueue(queueType: string) {
  const { data } = await authenticatedApi('/queue/resume', {
    method: 'POST',
    body: JSON.stringify({ queueType }),
  });
  return data;
}

/**
 * Get queue configuration
 */
export async function getQueueConfig() {
  const { data } = await authenticatedApi('/queue/config');
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
  const { data } = await authenticatedApi('/queue/config', {
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
  const { data } = await authenticatedApi(`/queue/notifications${params}`);
  return data;
}

/**
 * Mark queue notification as read
 */
export async function markQueueNotificationAsRead(notificationId: string) {
  const { data } = await authenticatedApi(`/queue/notifications/${notificationId}/read`, {
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
  const { data } = await authenticatedApi('/queue/notifications', {
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
  const { data } = await authenticatedApi(`/queue/wait-times${params}`);
  return data;
}

/**
 * Estimate wait time for new patient
 */
export async function estimateWaitTime(queueType: string, priority?: string) {
  const { data } = await authenticatedApi('/queue/estimate-wait-time', {
    method: 'POST',
    body: JSON.stringify({ queueType, priority }),
  });
  return data;
}

/**
 * Get queue capacity
 */
export async function getQueueCapacity(queueType: string) {
  const { data } = await authenticatedApi(`/queue/capacity?type=${queueType}`);
  return data;
}

/**
 * Update queue capacity
 */
export async function updateQueueCapacity(queueType: string, capacity: number) {
  const { data } = await authenticatedApi('/queue/capacity', {
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
  
  const endpoint = `/queue/performance${params.toString() ? `?${params.toString()}` : ''}`;
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
  const { data } = await authenticatedApi('/queue/export', {
    method: 'POST',
    body: JSON.stringify(filters),
  });
  return data;
}

/**
 * Get queue alerts
 */
export async function getQueueAlerts() {
  const { data } = await authenticatedApi('/queue/alerts');
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
  const { data } = await authenticatedApi('/queue/alerts', {
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
  const { data } = await authenticatedApi(`/queue/alerts/${alertId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data;
}

/**
 * Delete queue alert
 */
export async function deleteQueueAlert(alertId: string) {
  const { data } = await authenticatedApi(`/queue/alerts/${alertId}`, {
    method: 'DELETE',
  });
  return data;
}
