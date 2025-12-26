'use server';

import { authenticatedApi } from './auth.server';
import { API_ENDPOINTS } from '../api/config';

// ===== VIDEO TOKEN MANAGEMENT =====

/**
 * Generate video meeting token
 */
export async function generateVideoToken(data: {
  appointmentId: string;
  userId: string;
  userRole: 'patient' | 'doctor' | 'receptionist' | 'clinic_admin';
  userInfo: {
    displayName: string;
    email: string;
    avatar?: string;
  };
}) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.VIDEO.TOKEN, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

// ===== CONSULTATION MANAGEMENT =====

/**
 * Start video consultation
 */
export async function startVideoConsultation(data: {
  appointmentId: string;
  userId: string;
  userRole: 'patient' | 'doctor';
}) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.VIDEO.CONSULTATION.START, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

/**
 * End video consultation
 */
export async function endVideoConsultation(data: {
  appointmentId: string;
  userId: string;
  userRole: 'patient' | 'doctor';
  endReason?: string;
}) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.VIDEO.CONSULTATION.END, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

/**
 * Get consultation status
 */
export async function getConsultationStatus(appointmentId: string) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.VIDEO.CONSULTATION.STATUS(appointmentId));
  return response;
}

/**
 * Report technical issue during consultation
 */
export async function reportConsultationIssue(appointmentId: string, data: {
  issueType: string;
  description: string;
  severity?: 'low' | 'medium' | 'high';
  timestamp?: string;
}) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.VIDEO.CONSULTATION.REPORT(appointmentId), {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

/**
 * Share medical image during consultation
 */
export async function shareMedicalImage(appointmentId: string, data: {
  imageUrl: string;
  imageType: string;
  description?: string;
  sharedWith: string[];
}) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.VIDEO.CONSULTATION.SHARE_IMAGE(appointmentId), {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

// ===== CONSULTATION HISTORY =====

/**
 * Get video consultation history
 */
export async function getVideoConsultationHistory(filters?: {
  userId?: string;
  appointmentId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  page?: number;
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
  
  const endpoint = `${API_ENDPOINTS.VIDEO.HISTORY}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data: response } = await authenticatedApi(endpoint);
  return response;
}

// ===== RECORDING MANAGEMENT =====

/**
 * Start recording
 */
export async function startRecording(data: {
  appointmentId: string;
  userId: string;
  recordingType?: 'audio' | 'video' | 'both';
}) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.VIDEO.RECORDING.START, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

/**
 * Stop recording
 */
export async function stopRecording(data: {
  appointmentId: string;
  userId: string;
}) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.VIDEO.RECORDING.STOP, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

/**
 * Get recording for appointment
 */
export async function getRecording(appointmentId: string) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.VIDEO.RECORDING.GET(appointmentId));
  return response;
}

// ===== PARTICIPANT MANAGEMENT =====

/**
 * Manage participant (mute, unmute, remove, etc.)
 */
export async function manageParticipant(data: {
  appointmentId: string;
  participantId: string;
  action: 'mute' | 'unmute' | 'remove' | 'promote' | 'demote';
  userId: string;
}) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.VIDEO.PARTICIPANTS.MANAGE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

/**
 * Get participants for appointment
 */
export async function getParticipants(appointmentId: string) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.VIDEO.PARTICIPANTS.GET(appointmentId));
  return response;
}

// ===== ANALYTICS =====

/**
 * Get consultation analytics
 */
export async function getConsultationAnalytics(appointmentId: string) {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.VIDEO.ANALYTICS(appointmentId));
  return response;
}

// ===== HEALTH CHECK =====

/**
 * Get video service health status
 */
export async function getVideoHealth() {
  const { data: response } = await authenticatedApi(API_ENDPOINTS.VIDEO.HEALTH);
  return response;
}
