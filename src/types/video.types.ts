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

// â”€â”€â”€ Virtual Background â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface VirtualBackgroundSettings {
  consultationId: string;
  userId: string;
  enabled: boolean;
  type: 'blur' | 'image' | 'video' | 'none';
  blurIntensity?: number;
  imageUrl?: string;
  videoUrl?: string;
  customBackgroundId?: string;
}

export interface BackgroundPreset {
  id: string;
  name: string;
  type: 'blur' | 'image';
  imageUrl?: string;
  blurIntensity?: number;
  isDefault: boolean;
}
