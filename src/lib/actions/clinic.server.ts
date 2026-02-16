// ✅ Clinic Server Actions - Backend Integration
// This file provides server actions that integrate with the backend clinic app

'use server';

import { revalidatePath } from 'next/cache';

import { authenticatedApi, getServerSession, getClientInfo, revalidateCache } from './auth.server';
import { auditLog } from '@/lib/utils/audit';
import { validateClinicAccess } from '@/lib/config/permissions';
import { logger } from '@/lib/utils/logger';
import { API_ENDPOINTS } from '@/lib/config/config';
import type { Clinic, ClinicLocation, CreateClinicData, UpdateClinicData } from '@/types/clinic.types';

// ✅ Input Validation Schemas
import { createClinicSchema, updateClinicSchema } from '@/lib/schema/clinic.schema';

// ✅ Clinic Management Server Actions

/**
 * Create a new clinic
 */
export async function createClinic(data: CreateClinicData): Promise<{ success: boolean; clinic?: Clinic; error?: string }> {
  try {
    const validatedData = createClinicSchema.parse(data);

    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };
    const { user, session_id: sessionId } = session;
    const userId = user.id;

    const hasAccess = await validateClinicAccess(userId, 'clinics.create');
    if (!hasAccess) {
      const { ipAddress, userAgent } = await getClientInfo();
      await auditLog({
        userId,
        action: 'CREATE_CLINIC_DENIED',
        resource: 'CLINIC',
        resourceId: 'new',
        result: 'FAILURE',
        riskLevel: 'MEDIUM',
        ipAddress,
        userAgent,
        sessionId
      });
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    const apiData = {
      ...validatedData,
      type: 'GENERAL',
      clinicAdminIdentifier: validatedData.clinicAdminIdentifier || '',
      logo: validatedData.logo || '',
      website: validatedData.website || '',
      description: validatedData.description || '',
      timezone: validatedData.timezone || 'UTC',
      currency: validatedData.currency || 'USD',
      language: validatedData.language || 'en',
    };

    const response = await authenticatedApi<Clinic>(API_ENDPOINTS.CLINICS.CREATE, {
      method: 'POST',
      body: JSON.stringify(apiData)
    });

    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId,
      action: 'CLINIC_CREATED',
      resource: 'CLINIC',
      resourceId: response.data.id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      sessionId,
      metadata: {
        clinicName: response.data.name,
        clinicSubdomain: response.data.subdomain
      }
    });

    revalidatePath('/dashboard/clinics');
    revalidateCache('clinics');
    
    return { success: true, clinic: response.data };
    
  } catch (error) {
    logger.error('Failed to create clinic', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
  }
}

/**
 * Get all clinics
 */
export async function getClinics(filters?: any) {
  try {
    const session = await getServerSession();
    if (!session?.user) return [];
    
    const queryParams = filters ? new URLSearchParams(filters).toString() : '';
    const endpoint = queryParams ? `${API_ENDPOINTS.CLINICS.GET_ALL}?${queryParams}` : API_ENDPOINTS.CLINICS.GET_ALL;
    
    const { data } = await authenticatedApi<Clinic[]>(endpoint, {});
    return data || [];
  } catch (error) {
    logger.error('Failed to get clinics', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

/**
 * Get clinic by ID
 */
export async function getClinicById(id: string) {
  try {
    const { data } = await authenticatedApi<Clinic>(API_ENDPOINTS.CLINICS.GET_BY_ID(id), {});
    return data;
  } catch (error) {
    logger.error('Failed to get clinic by ID', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Get clinic by app name
 */
export async function getClinicByAppName(appName: string) {
  try {
    const { data } = await authenticatedApi<Clinic>(API_ENDPOINTS.CLINICS.GET_BY_APP_NAME(appName), {});
    return data;
  } catch (error) {
    logger.error('Failed to get clinic by app name', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Update clinic
 */
export async function updateClinic(id: string, data: UpdateClinicData): Promise<{ success: boolean; clinic?: Clinic; error?: string }> {
  try {
    const validatedData = updateClinicSchema.parse(data);

    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };
    const { user, session_id: sessionId } = session;
    const userId = user.id;

    const hasAccess = await validateClinicAccess(userId, 'clinics.update');
    if (!hasAccess) {
      const { ipAddress, userAgent } = await getClientInfo();
      await auditLog({
        userId,
        action: 'UPDATE_CLINIC_DENIED',
        resource: 'CLINIC',
        resourceId: id,
        result: 'FAILURE',
        riskLevel: 'MEDIUM',
        ipAddress,
        userAgent,
        sessionId
      });
      return { success: false, error: 'Access denied' };
    }

    const response = await authenticatedApi<Clinic>(API_ENDPOINTS.CLINICS.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(validatedData)
    });

    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId,
      action: 'CLINIC_UPDATED',
      resource: 'CLINIC',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      sessionId,
      metadata: { updatedFields: Object.keys(validatedData) }
    });

    revalidatePath(`/dashboard/clinics/${id}`);
    revalidateCache('clinics');
    
    return { success: true, clinic: response.data };
  } catch (error) {
    logger.error('Failed to update clinic', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
  }
}

/**
 * Delete clinic
 */
export async function deleteClinic(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };
    const { user, session_id: sessionId } = session;
    const userId = user.id;

    const hasAccess = await validateClinicAccess(userId, 'clinics.delete');
    if (!hasAccess) return { success: false, error: 'Access denied' };

    await authenticatedApi(API_ENDPOINTS.CLINICS.DELETE(id), { method: 'DELETE' });

    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId,
      action: 'CLINIC_DELETED',
      resource: 'CLINIC',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'HIGH',
      ipAddress,
      userAgent,
      sessionId
    });

    revalidatePath('/dashboard/clinics');
    revalidateCache('clinics');
    
    return { success: true };
  } catch (error) {
    logger.error('Failed to delete clinic', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
  }
}

// ✅ Clinic Location Server Actions

/**
 * Create clinic location
 */
export async function createClinicLocation(clinicId: string, data: any): Promise<{ success: boolean; location?: ClinicLocation; error?: string }> {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };
    const { user, session_id: sessionId } = session;
    const userId = user.id;

    const response = await authenticatedApi<ClinicLocation>(API_ENDPOINTS.CLINIC_LOCATIONS.CREATE(clinicId), {
      method: 'POST',
      body: JSON.stringify(data)
    });

    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId,
      action: 'CLINIC_LOCATION_CREATED',
      resource: 'CLINIC_LOCATION',
      resourceId: response.data.id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      sessionId,
      metadata: { clinicId, locationName: response.data.name }
    });

    revalidateCache('clinic-locations');
    return { success: true, location: response.data };
  } catch (error) {
    logger.error('Failed to create clinic location', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
  }
}

/**
 * Get clinic locations
 */
export async function getClinicLocations(clinicId: string) {
  try {
    const { data } = await authenticatedApi<ClinicLocation[]>(API_ENDPOINTS.CLINIC_LOCATIONS.GET_ALL(clinicId), {});
    return data || [];
  } catch (error) {
    logger.error('Failed to get clinic locations', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

/**
 * Update clinic location
 */
export async function updateClinicLocation(clinicId: string, locationId: string, data: Partial<ClinicLocation>) {
  try {
    const session = await getServerSession();
    if (!session?.user) return null;
    const { user, session_id: sessionId } = session;
    const userId = user.id;

    const response = await authenticatedApi<ClinicLocation>(API_ENDPOINTS.CLINIC_LOCATIONS.UPDATE(clinicId, locationId), {
      method: 'PATCH',
      body: JSON.stringify(data)
    });

    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId,
      action: 'CLINIC_LOCATION_UPDATED',
      resource: 'CLINIC_LOCATION',
      resourceId: locationId,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      sessionId,
      metadata: { clinicId, updatedFields: Object.keys(data) }
    });

    revalidateCache('clinic-locations');
    return response.data;
  } catch (error) {
    logger.error('Failed to update clinic location', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Delete clinic location
 */
export async function deleteClinicLocation(clinicId: string, locationId: string) {
  try {
    const session = await getServerSession();
    if (!session?.user) return false;
    const { user, session_id: sessionId } = session;
    const userId = user.id;

    await authenticatedApi(API_ENDPOINTS.CLINIC_LOCATIONS.DELETE(clinicId, locationId), { method: 'DELETE' });

    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId,
      action: 'CLINIC_LOCATION_DELETED',
      resource: 'CLINIC_LOCATION',
      resourceId: locationId,
      result: 'SUCCESS',
      riskLevel: 'MEDIUM',
      ipAddress,
      userAgent,
      sessionId,
      metadata: { clinicId }
    });

    revalidateCache('clinic-locations');
    return true;
  } catch (error) {
    logger.error('Failed to delete clinic location', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

// ✅ Health Check Server Actions

/**
 * Get health status
 */
export async function getHealthStatus() {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.HEALTH.STATUS, {});
    return data;
  } catch (error) {
    logger.error('Health check failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Get health ready status
 */
export async function getHealthReady() {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.HEALTH.READY, {});
    return data;
  } catch (error) {
    logger.error('Health ready check failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Get health live status
 */
export async function getHealthLive() {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.HEALTH.LIVE, {});
    return data;
  } catch (error) {
    logger.error('Health live check failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Assign Clinic Admin
 */
export async function assignClinicAdmin(data: { userId: string; clinicId: string }) {
  try {
    const { data: result } = await authenticatedApi('/clinics/admin', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return { success: true, data: result };
  } catch (error) {
    logger.error('Failed to assign clinic admin', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

/**
 * Get Clinic Doctors
 */
export async function getClinicDoctors(clinicId: string) {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.DOCTORS.GET_CLINIC_DOCTORS(clinicId), {});
    return { success: true, doctors: data };
  } catch (error) {
    logger.error('Failed to get clinic doctors', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Get Clinic Staff
 */
export async function getClinicStaff(clinicId: string) {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.USERS.GET_BY_CLINIC(clinicId), {});
    return { success: true, staff: data };
  } catch (error) {
    logger.error('Failed to get clinic staff', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Unexpected error' };
  }
}