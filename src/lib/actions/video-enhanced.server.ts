'use server';

import { authenticatedApi, getServerSession } from './auth.server';
import { API_ENDPOINTS } from '../config/config';

// Helper to get consultationId from appointmentId
async function getConsultationId(appointmentId: string): Promise<string> {
  try {
    const { data: response } = await authenticatedApi(API_ENDPOINTS.VIDEO.CONSULTATION.STATUS(appointmentId));
    // The status response should contain the consultation/session ID
    if (response && typeof response === 'object' && 'id' in response) {
      return response.id as string;
    }
    // Fallback: use appointmentId as consultationId (if they're the same)
    return appointmentId;
  } catch {
    // Fallback: use appointmentId as consultationId
    return appointmentId;
  }
}

// ===== PHASE 1: IN-CALL CHAT =====

export interface ChatMessage {
  id: string;
  consultationId: string;
  userId: string;
  message: string;
  messageType?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'PRESCRIPTION' | 'FILE';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  isEdited: boolean;
  isDeleted: boolean;
  replyToId?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

/**
 * Send chat message during video consultation
 */
export async function sendChatMessage(
  appointmentId: string,
  data: {
    message: string;
    messageType?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'PRESCRIPTION' | 'FILE';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    replyToId?: string;
  }
) {
  const consultationId = await getConsultationId(appointmentId);
  const session = await getServerSession();
  const userId = session?.user?.id || '';
  
  if (!userId) {
    // ✅ Use centralized error messages
    const { ERROR_MESSAGES } = await import('@/lib/config/config');
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  }
  
  const { data: response } = await authenticatedApi(
    API_ENDPOINTS.VIDEO.CHAT.SEND,
    {
      method: 'POST',
      body: JSON.stringify({
        consultationId,
        userId, // Extract from session
        ...data,
      }),
    }
  );
  return response as ChatMessage;
}

/**
 * Get chat messages for consultation
 */
export async function getChatMessages(
  appointmentId: string,
  filters?: {
    limit?: number;
    before?: string;
  }
) {
  const consultationId = await getConsultationId(appointmentId);
  const params = new URLSearchParams();
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.before) params.append('before', filters.before);

  const endpoint = `${API_ENDPOINTS.VIDEO.CHAT.GET(consultationId)}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data: response } = await authenticatedApi(endpoint);
  // Backend returns ChatMessage[] directly, wrap for consistency
  const messages = Array.isArray(response) ? response as ChatMessage[] : (response as { messages?: ChatMessage[] })?.messages || [];
  return { messages };
}

/**
 * Update typing indicator
 */
export async function updateTypingIndicator(
  appointmentId: string,
  isTyping: boolean
) {
  const consultationId = await getConsultationId(appointmentId);
  const session = await getServerSession();
  const userId = session?.user?.id || '';
  
  if (!userId) {
    // ✅ Use centralized error messages
    const { ERROR_MESSAGES } = await import('@/lib/config/config');
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  }
  
  const { data: response } = await authenticatedApi(
    API_ENDPOINTS.VIDEO.CHAT.TYPING,
    {
      method: 'POST',
      body: JSON.stringify({
        consultationId,
        userId, // Backend DTO requires userId
        isTyping,
      }),
    }
  );
  return response as { success: boolean };
}

// ===== PHASE 1: WAITING ROOM =====

export interface WaitingRoomParticipant {
  userId: string;
  userName: string;
  userRole: string;
  joinedAt: string;
  position?: number;
  estimatedWaitTime?: number;
}

/**
 * Join waiting room
 */
export async function joinWaitingRoom(appointmentId: string) {
  const consultationId = await getConsultationId(appointmentId);
  const session = await getServerSession();
  const userId = session?.user?.id || '';
  
  if (!userId) {
    // ✅ Use centralized error messages
    const { ERROR_MESSAGES } = await import('@/lib/config/config');
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  }
  
  const { data: response } = await authenticatedApi(
    API_ENDPOINTS.VIDEO.WAITING_ROOM.JOIN,
    {
      method: 'POST',
      body: JSON.stringify({
        consultationId,
        userId, // Backend DTO requires userId
      }),
    }
  );
  return response as {
    id: string;
    consultationId: string;
    userId: string;
    status: string;
    position: number;
    estimatedWaitTime?: number;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Leave waiting room
 */
export async function leaveWaitingRoom(appointmentId: string) {
  const consultationId = await getConsultationId(appointmentId);
  const { data: response } = await authenticatedApi(
    API_ENDPOINTS.VIDEO.WAITING_ROOM.JOIN, // Backend might not have separate leave endpoint
    {
      method: 'POST',
      body: JSON.stringify({
        consultationId,
        userId: '', // Will be set by auth middleware
        action: 'leave',
      }),
    }
  );
  return response as { success: boolean };
}

/**
 * Get waiting room queue (doctor only)
 */
export async function getWaitingRoomQueue(appointmentId: string) {
  const consultationId = await getConsultationId(appointmentId);
  const { data: response } = await authenticatedApi(
    API_ENDPOINTS.VIDEO.WAITING_ROOM.GET_QUEUE(consultationId)
  );
  return response as {
    queue: WaitingRoomParticipant[];
    totalWaiting: number;
  };
}

/**
 * Admit participant from waiting room (doctor only)
 */
export async function admitFromWaitingRoom(
  appointmentId: string,
  userId: string
) {
  const consultationId = await getConsultationId(appointmentId);
  const session = await getServerSession();
  const doctorId = session?.user?.id || '';
  
  if (!doctorId) {
    // ✅ Use centralized error messages
    const { ERROR_MESSAGES } = await import('@/lib/config/config');
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  }
  
  const { data: response } = await authenticatedApi(
    API_ENDPOINTS.VIDEO.WAITING_ROOM.ADMIT,
    {
      method: 'POST',
      body: JSON.stringify({
        consultationId,
        userId, // Patient to admit
        doctorId, // Backend DTO requires doctorId
      }),
    }
  );
  return response as {
    id: string;
    consultationId: string;
    userId: string;
    status: string;
    position?: number;
    estimatedWaitTime?: number;
    admittedAt?: string;
    createdAt: string;
    updatedAt: string;
  };
}

// ===== PHASE 1: MEDICAL NOTES =====

export interface MedicalNote {
  id: string;
  consultationId: string;
  userId: string;
  noteType: 'GENERAL' | 'SYMPTOM' | 'DIAGNOSIS' | 'PRESCRIPTION' | 'TREATMENT';
  title?: string;
  content: string;
  prescription?: unknown;
  symptoms?: unknown[];
  treatmentPlan?: unknown;
  isAutoSaved: boolean;
  savedToEHR: boolean;
  ehrRecordId?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Create medical note during consultation
 */
export async function createMedicalNote(
  appointmentId: string,
  data: {
    content: string;
    noteType: 'GENERAL' | 'SYMPTOM' | 'DIAGNOSIS' | 'PRESCRIPTION' | 'TREATMENT';
    title?: string;
    prescription?: unknown;
    symptoms?: unknown[];
    treatmentPlan?: unknown;
  }
) {
  const consultationId = await getConsultationId(appointmentId);
  const session = await getServerSession();
  const userId = session?.user?.id || '';
  
  if (!userId) {
    // ✅ Use centralized error messages
    const { ERROR_MESSAGES } = await import('@/lib/config/config');
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  }
  
  const { data: response } = await authenticatedApi(
    API_ENDPOINTS.VIDEO.NOTES.CREATE,
    {
      method: 'POST',
      body: JSON.stringify({
        consultationId,
        userId, // Extract from session
        ...data,
      }),
    }
  );
  return response as MedicalNote;
}

/**
 * Update medical note
 * Note: Backend doesn't have UPDATE endpoint, only DELETE
 * This function is kept for future compatibility
 */
export async function updateMedicalNote(
  _appointmentId: string,
  _noteId: string,
  _data: {
    content?: string;
    noteType?: 'GENERAL' | 'SYMPTOM' | 'DIAGNOSIS' | 'PRESCRIPTION' | 'TREATMENT';
    title?: string;
  }
) {
  // Backend doesn't have update endpoint, so we'll need to delete and recreate
  // For now, return error or implement workaround
  // ✅ Use centralized error messages
  const { ERROR_MESSAGES } = await import('@/lib/config/config');
  throw new Error(ERROR_MESSAGES.TRY_AGAIN);
}

/**
 * Get medical notes for consultation
 */
export async function getMedicalNotes(
  appointmentId: string,
  filters?: {
    noteType?: string;
    limit?: number;
  }
) {
  const consultationId = await getConsultationId(appointmentId);
  const params = new URLSearchParams();
  if (filters?.noteType) params.append('noteType', filters.noteType);
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const endpoint = `${API_ENDPOINTS.VIDEO.NOTES.GET(consultationId)}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data: response } = await authenticatedApi(endpoint);
  // Backend returns MedicalNote[] directly, wrap for consistency
  const notes = Array.isArray(response) ? response as MedicalNote[] : (response as { notes?: MedicalNote[] })?.notes || [];
  return { notes };
}

/**
 * Delete medical note
 */
export async function deleteMedicalNote(_appointmentId: string, noteId: string) {
  const { data: response } = await authenticatedApi(
    API_ENDPOINTS.VIDEO.NOTES.DELETE(noteId),
    {
      method: 'DELETE',
      body: JSON.stringify({}),
    }
  );
  return response as { success: boolean };
}

/**
 * Save note to EHR
 */
export async function saveNoteToEHR(_appointmentId: string, noteId: string) {
  const session = await getServerSession();
  const userId = session?.user?.id || '';
  
  if (!userId) {
    // ✅ Use centralized error messages
    const { ERROR_MESSAGES } = await import('@/lib/config/config');
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  }
  
  const { data: response } = await authenticatedApi(
    API_ENDPOINTS.VIDEO.NOTES.SAVE_TO_EHR(noteId),
    {
      method: 'POST',
      body: JSON.stringify({
        userId, // Backend DTO requires userId
      }),
    }
  );
  return response as { ehrRecordId: string };
}

// ===== PHASE 1: CALL QUALITY INDICATORS =====

export interface CallQualityMetrics {
  consultationId: string;
  userId: string;
  timestamp: string;
  network: {
    latency: number; // ms
    jitter: number; // ms
    packetLoss: number; // percentage
    bandwidth: number; // kbps
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  };
  audio: {
    bitrate: number; // kbps
    codec: string;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
  };
  video: {
    bitrate: number; // kbps
    resolution: string;
    framerate: number; // fps
    codec: string;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

/**
 * Update quality metrics
 */
export async function updateQualityMetrics(
  appointmentId: string,
  metrics: Partial<CallQualityMetrics>
) {
  const consultationId = await getConsultationId(appointmentId);
  const session = await getServerSession();
  const userId = session?.user?.id || '';
  
  if (!userId) {
    // ✅ Use centralized error messages
    const { ERROR_MESSAGES } = await import('@/lib/config/config');
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  }
  
  const { data: response } = await authenticatedApi(
    API_ENDPOINTS.VIDEO.QUALITY.UPDATE,
    {
      method: 'POST',
      body: JSON.stringify({
        consultationId,
        userId, // Extract from session
        ...metrics,
      }),
    }
  );
  return response as CallQualityMetrics;
}

/**
 * Get call quality metrics
 */
export async function getCallQuality(appointmentId: string, userId?: string) {
  const consultationId = await getConsultationId(appointmentId);
  // Use provided userId or empty string (backend will get from auth token)
  const userIdParam = userId || '';
  const { data: response } = await authenticatedApi(
    API_ENDPOINTS.VIDEO.QUALITY.GET(consultationId, userIdParam)
  );
  return response as CallQualityMetrics;
}

// ===== PHASE 2: SCREEN ANNOTATION =====

export interface Annotation {
  id: string;
  consultationId: string;
  userId: string;
  annotationType: 'DRAWING' | 'TEXT' | 'ARROW' | 'HIGHLIGHT' | 'SHAPE';
  data: Record<string, unknown>;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  color?: string;
  thickness?: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create screen annotation
 */
export async function createAnnotation(
  appointmentId: string,
  data: {
    annotationType: 'DRAWING' | 'TEXT' | 'ARROW' | 'HIGHLIGHT' | 'SHAPE';
    data: Record<string, unknown>;
    position?: Annotation['position'];
    color?: string;
    thickness?: number;
  }
) {
  const consultationId = await getConsultationId(appointmentId);
  const session = await getServerSession();
  const userId = session?.user?.id || '';
  
  if (!userId) {
    // ✅ Use centralized error messages
    const { ERROR_MESSAGES } = await import('@/lib/config/config');
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  }
  
  const { data: response } = await authenticatedApi(
    API_ENDPOINTS.VIDEO.ANNOTATION.CREATE,
    {
      method: 'POST',
      body: JSON.stringify({
        consultationId,
        userId, // Extract from session
        ...data,
      }),
    }
  );
  return response as Annotation;
}

/**
 * Get annotations for consultation
 */
export async function getAnnotations(appointmentId: string) {
  const consultationId = await getConsultationId(appointmentId);
  const { data: response } = await authenticatedApi(
    API_ENDPOINTS.VIDEO.ANNOTATION.GET(consultationId)
  );
  // Backend returns Annotation[] directly, wrap for consistency
  const annotations = Array.isArray(response) ? response as Annotation[] : (response as { annotations?: Annotation[] })?.annotations || [];
  return { annotations };
}

/**
 * Delete annotation
 */
export async function deleteAnnotation(_appointmentId: string, annotationId: string) {
  const session = await getServerSession();
  const userId = session?.user?.id || '';
  
  if (!userId) {
    // ✅ Use centralized error messages
    const { ERROR_MESSAGES } = await import('@/lib/config/config');
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  }
  
  const { data: response } = await authenticatedApi(
    API_ENDPOINTS.VIDEO.ANNOTATION.DELETE(annotationId),
    {
      method: 'DELETE',
      body: JSON.stringify({
        userId, // Extract from session
      }),
    }
  );
  return response as { success: boolean };
}

// ===== PHASE 2: CALL TRANSCRIPTION =====

export interface TranscriptionSegment {
  id: string;
  consultationId: string;
  speaker: string;
  speakerRole: string;
  text: string;
  startTime: number; // seconds
  endTime: number; // seconds
  confidence: number; // 0-1
  timestamp: string;
}

/**
 * Create transcription segment
 */
export async function createTranscription(
  appointmentId: string,
  data: {
    speaker: string;
    speakerRole: string;
    text: string;
    startTime: number;
    endTime: number;
    confidence?: number;
  }
) {
  const consultationId = await getConsultationId(appointmentId);
  // Backend expects transcript (string), not speaker/speakerRole/text separately
  // Combine text into transcript string
  const transcript = `${data.speaker} (${data.speakerRole}): ${data.text}`;
  
  const { data: response } = await authenticatedApi(
    API_ENDPOINTS.VIDEO.TRANSCRIPTION.CREATE,
    {
      method: 'POST',
      body: JSON.stringify({
        consultationId,
        transcript, // Backend DTO expects 'transcript' field
        language: 'en',
        confidence: data.confidence,
        speakerId: data.speaker,
        startTime: data.startTime,
        endTime: data.endTime,
      }),
    }
  );
  // Map backend response to TranscriptionSegment
  const backendResponse = response as {
    id: string;
    consultationId: string;
    transcript: string;
    language: string;
    confidence?: number;
    speakerId?: string;
    startTime?: number;
    endTime?: number;
    createdAt: string;
    updatedAt: string;
  };
  return {
    id: backendResponse.id,
    consultationId: backendResponse.consultationId,
    speaker: backendResponse.speakerId || data.speaker,
    speakerRole: data.speakerRole,
    text: backendResponse.transcript,
    startTime: backendResponse.startTime || data.startTime,
    endTime: backendResponse.endTime || data.endTime,
    confidence: backendResponse.confidence || data.confidence || 0.9,
    timestamp: backendResponse.createdAt,
  } as TranscriptionSegment;
}

/**
 * Get transcription for consultation
 */
export async function getTranscription(
  appointmentId: string,
  filters?: {
    query?: string;
  }
) {
  const consultationId = await getConsultationId(appointmentId);
  if (filters?.query) {
    // Use search endpoint
    const params = new URLSearchParams({ q: filters.query });
    const endpoint = `${API_ENDPOINTS.VIDEO.TRANSCRIPTION.SEARCH(consultationId)}?${params.toString()}`;
    const { data: response } = await authenticatedApi(endpoint);
    return response as {
      segments: TranscriptionSegment[];
      matches: number;
    };
  } else {
    // Use get endpoint
    const { data: response } = await authenticatedApi(
      API_ENDPOINTS.VIDEO.TRANSCRIPTION.GET(consultationId)
    );
    // Backend returns Transcription[] directly, need to map to segments
    if (Array.isArray(response)) {
      const transcriptions = response as Array<{
        id: string;
        consultationId: string;
        transcript: string;
        language: string;
        confidence?: number;
        speakerId?: string;
        startTime?: number;
        endTime?: number;
        createdAt: string;
        updatedAt: string;
      }>;
      return {
        segments: transcriptions.map((t) => ({
          id: t.id,
          consultationId: t.consultationId,
          speaker: t.speakerId || 'unknown',
          speakerRole: 'unknown',
          text: t.transcript,
          startTime: t.startTime || 0,
          endTime: t.endTime || 0,
          confidence: t.confidence || 0.9,
          timestamp: t.createdAt,
        })),
        fullText: transcriptions.map(t => t.transcript).join(' '),
      };
    }
    // Fallback to expected structure
    return response as {
      segments: TranscriptionSegment[];
      fullText: string;
    };
  }
}

/**
 * Save transcript to EHR
 */
export async function saveTranscriptToEHR(appointmentId: string) {
  const consultationId = await getConsultationId(appointmentId);
  const session = await getServerSession();
  const userId = session?.user?.id || '';
  
  if (!userId) {
    // ✅ Use centralized error messages
    const { ERROR_MESSAGES } = await import('@/lib/config/config');
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  }
  
  const { data: response } = await authenticatedApi(
    API_ENDPOINTS.VIDEO.TRANSCRIPTION.SAVE_TO_EHR(consultationId),
    {
      method: 'POST',
      body: JSON.stringify({
        userId, // Backend DTO requires userId
      }),
    }
  );
  return response as { ehrRecordId: string };
}

// ===== PHASE 2: ENHANCED RECORDING CONTROLS =====
// Note: Recording endpoints still use appointmentId

/**
 * Pause recording
 */
export async function pauseRecording(appointmentId: string) {
  const { data: response } = await authenticatedApi(
    API_ENDPOINTS.VIDEO.RECORDING_ENHANCED.PAUSE(appointmentId),
    {
      method: 'POST',
    }
  );
  return response as { success: boolean };
}

/**
 * Resume recording
 */
export async function resumeRecording(appointmentId: string) {
  const { data: response } = await authenticatedApi(
    API_ENDPOINTS.VIDEO.RECORDING_ENHANCED.RESUME(appointmentId),
    {
      method: 'POST',
    }
  );
  return response as { success: boolean };
}

/**
 * Set recording quality
 */
export async function setRecordingQuality(
  appointmentId: string,
  quality: 'low' | 'medium' | 'high' | 'ultra'
) {
  const { data: response } = await authenticatedApi(
    API_ENDPOINTS.VIDEO.RECORDING_ENHANCED.SET_QUALITY(appointmentId),
    {
      method: 'POST',
      body: JSON.stringify({ quality }),
    }
  );
  return response as { success: boolean };
}

// ===== PHASE 2: ENHANCED PARTICIPANT CONTROLS =====
// Note: Participant management still uses appointmentId

/**
 * Enhanced participant management
 */
export async function manageParticipantEnhanced(
  appointmentId: string,
  data: {
    participantId: string;
    action: 'mute' | 'unmute' | 'remove' | 'promote' | 'demote' | 'disable_video' | 'enable_video' | 'grant_screen_share' | 'revoke_screen_share';
    reason?: string;
  }
) {
  const { data: response } = await authenticatedApi(
    API_ENDPOINTS.VIDEO.PARTICIPANTS.MANAGE,
    {
      method: 'POST',
      body: JSON.stringify({
        appointmentId,
        ...data,
      }),
    }
  );
  return response as { success: boolean };
}
