/**
 * video.types.ts
 * Shared types for video consultation features.
 * Used by both server actions (`video.server.ts`) and client components.
 */

// ─── Session (Super Admin monitoring) ────────────────────────────────────────

export interface VideoSessionParticipant {
  userId: string;
  role: string;
  joinedAt?: string;
}

/** One active/historical video session as returned by the Admin API */
export interface VideoSession {
  id: string;
  appointmentId: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  participants: VideoSessionParticipant[];
  startTime?: string;
  provider: string;
  clinicId?: string;
}

export interface ListAllVideoSessionsResponse {
  sessions: VideoSession[];
  total: number;
}

// ─── Consultation recording ───────────────────────────────────────────────────

export interface VideoRecording {
  id: string;
  sessionId: string;
  url: string;
  duration?: number;
  createdAt: string;
}
