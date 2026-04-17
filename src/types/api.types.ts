/**
 * ✅ API Type Definitions
 * Centralized TypeScript interfaces for all API responses
 * Replaces `any` types throughout the codebase
 */

// Base API Response Structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
  meta?: PaginationMeta;
  requestId?: string;
}

// Pagination Metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Error Response
export interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  statusCode: number;
  requestId?: string;
  details?: Record<string, unknown>;
}

// ✅ Consolidated: Import Appointment from appointment.types.ts (single source of truth)
import type { Appointment } from './appointment.types';

// Appointment API Types
export interface AppointmentResponse extends ApiResponse<Appointment | Appointment[]> {
  data: Appointment | Appointment[];
}

// ✅ Consolidated: Import User and Clinic from their respective type files (single source of truth)
import type { User } from './auth.types';
import type { Clinic } from './clinic.types';

// User API Types
export interface UserResponse extends ApiResponse<User | User[]> {
  data: User | User[];
}

// Clinic API Types
export interface ClinicResponse extends ApiResponse<Clinic | Clinic[]> {
  data: Clinic | Clinic[];
}

// Queue API Types
export interface QueueStatsResponse extends ApiResponse<QueueStats> {
  data: QueueStats;
}

export interface QueueStats {
  totalInQueue: number;
  averageWaitTime: number;
  inProgress: number;
  completedToday: number;
  queueName?: string;
}

// Health API Types
export interface HealthStatusResponse extends ApiResponse<HealthStatus> {
  data: HealthStatus;
}

export interface HealthStatus {
  status: 'up' | 'down' | 'degraded';
  timestamp: string;
  services?: Record<string, ServiceHealth>;
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  error?: string;
}

// Generic API Error
export interface ApiErrorResponse {
  success: false;
  message: string;
  error: string;
  statusCode: number;
  code?: string;
  requestId?: string;
  details?: Record<string, unknown>;
}

// Mutation Response
export interface MutationResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  error?: string;
}

// WebSocket Event Data
export interface WebSocketEventData {
  event: string;
  data: unknown;
  timestamp: string;
  clinicId?: string;
  userId?: string;
}

