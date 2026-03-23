'use server';

import { HealthcareErrorsService } from '@/lib/config/config';
import type { SupportRequest } from '@/types/medical-records.types';
import { clinicApiClient as api } from '@/lib/api/client';

/**
 * Get all support requests
 */
export async function getSupportRequests(
  staffId?: string,
  filters?: {
    status?: string;
    priority?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ requests: SupportRequest[] }> {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    // Using hypothetical standardized endpoint
    const response = await api.get<{ requests: SupportRequest[] }>(
      `/support-staff/requests?${params.toString()}`
    );

    if (response.error) {
      throw new Error(response.error || 'Failed to fetch support requests');
    }

    return response.data || { requests: [] };
  } catch (error) {
    HealthcareErrorsService.logError('fetch support requests', error);
    throw error;
  }
}

/**
 * Create a new support request
 */
export async function createSupportRequest(
  requestData: SupportRequest
): Promise<{ request: SupportRequest }> {
  try {
    const response = await api.post<{ request: SupportRequest }>(
      '/support-staff/requests',
      requestData
    );

    if (response.error) {
      throw new Error(response.error || 'Failed to create support request');
    }

    return response.data!;
  } catch (error) {
    HealthcareErrorsService.logError('create support request', error);
    throw error;
  }
}

/**
 * Update a support request
 */
export async function updateSupportRequest(
  requestId: string,
  updates: Partial<SupportRequest>
): Promise<{ request: SupportRequest }> {
  try {
    const response = await api.patch<{ request: SupportRequest }>(
      `/support-staff/requests/${requestId}`,
      updates
    );

    if (response.error) {
      throw new Error(response.error || 'Failed to update support request');
    }

    return response.data!;
  } catch (error) {
    HealthcareErrorsService.logError('update support request', error);
    throw error;
  }
}

/**
 * Delete a support request
 */
export async function deleteSupportRequest(requestId: string): Promise<void> {
  try {
    const response = await api.delete(
      `/support-staff/requests/${requestId}`
    );

    if (response.error) {
      throw new Error(response.error || 'Failed to delete support request');
    }
  } catch (error) {
    HealthcareErrorsService.logError('delete support request', error);
    throw error;
  }
}
