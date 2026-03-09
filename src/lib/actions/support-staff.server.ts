'use server';

import { HealthcareErrorsService } from '@/lib/config/config';
import type { SupportRequest } from '@/types/medical-records.types';

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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await fetch(`${baseUrl}/support-staff/${staffId}/requests?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch support requests');
    }

    const data = await response.json();
    return data;
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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/support-staff/${requestData.supportStaffId}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create support request');
    }

    const data = await response.json();
    return data;
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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/support-staff/requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update support request');
    }

    const data = await response.json();
    return data;
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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/support-staff/requests/${requestId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete support request');
    }

    await response.json();
  } catch (error) {
    HealthcareErrorsService.logError('delete support request', error);
    throw error;
  }
}
