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

// Appointment API Types
export interface AppointmentResponse extends ApiResponse<Appointment | Appointment[]> {
  data: Appointment | Appointment[];
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  symptoms?: string[];
  diagnosis?: string;
  prescription?: string;
  createdAt: string;
  updatedAt: string;
}

// User API Types
export interface UserResponse extends ApiResponse<User | User[]> {
  data: User | User[];
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  clinicId?: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

// Clinic API Types
export interface ClinicResponse extends ApiResponse<Clinic | Clinic[]> {
  data: Clinic | Clinic[];
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  subdomain: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

