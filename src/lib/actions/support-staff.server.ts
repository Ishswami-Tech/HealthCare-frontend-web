'use server';

import { authenticatedApi } from './auth.server';
import { formatISODateInIST, formatTimeInIST } from '@/lib/utils';
import type { SupportRequest } from '@/types/medical-records.types';

// ===== SUPPORT STAFF SERVER ACTIONS =====
// Support staff manage patient-facing requests (general inquiries, help tickets).
// The backend has no dedicated /support-staff endpoint.
// Requests are proxied through the appointments + queue system:
//   GET  /queue          → active queue entries treated as support requests
//   POST /appointments   → create a support/general appointment
// For full support ticketing, a backend endpoint needs to be added.

/**
 * Get support requests — proxied through GET /queue (clinic-scoped via header)
 */
export async function getSupportRequests(
  _staffId?: string,
  _filters?: {
    status?: string;
    priority?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ requests: SupportRequest[] }> {
  try {
    const { data } = await authenticatedApi<{ queue: SupportRequest[] } | SupportRequest[]>('/queue');

    const raw = Array.isArray(data)
      ? data
      : (data as any)?.queue || (data as any)?.data || [];

    // Normalize queue entries into SupportRequest shape
    const requests: SupportRequest[] = raw.map((entry: any) => ({
      id: entry.id,
      type: entry.type || 'General Support',
      status: entry.status || 'pending',
      priority: entry.priority || 'normal',
      requesterName: entry.patient?.name || entry.patientName || 'Unknown',
      patient: entry.patient,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));

    return { requests };
  } catch {
    // No backend support-staff endpoint — return empty gracefully
    return { requests: [] };
  }
}

/**
 * Create a support request — proxied through POST /appointments with type GENERAL
 */
export async function createSupportRequest(
  requestData: SupportRequest
): Promise<{ request: SupportRequest }> {
  const { data } = await authenticatedApi<SupportRequest>(
    '/appointments',
    {
      method: 'POST',
      body: JSON.stringify({
        patientId: requestData.patientId,
        type: 'GENERAL',
        notes: requestData.description || requestData.type,
        priority: requestData.priority,
        date: formatISODateInIST(new Date()),
        time: formatTimeInIST(new Date(), {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      }),
    }
  );
  return { request: (data as any)?.appointment || data as SupportRequest };
}

/**
 * Update a support request — proxied through PATCH /appointments/:id/status
 */
export async function updateSupportRequest(
  requestId: string,
  updates: Partial<SupportRequest>
): Promise<{ request: SupportRequest }> {
  const { data } = await authenticatedApi<SupportRequest>(
    `/appointments/${requestId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status: updates.status,
        notes: (updates as any).notes,
      }),
    }
  );
  return { request: data as SupportRequest };
}

/**
 * Delete a support request — proxied through PATCH /appointments/:id/status with CANCELLED
 */
export async function deleteSupportRequest(requestId: string): Promise<void> {
  await authenticatedApi(`/appointments/${requestId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'CANCELLED' }),
  });
}
