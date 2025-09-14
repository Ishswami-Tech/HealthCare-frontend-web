// ✅ Clinic Server Actions - Backend Integration
// This file provides server actions that integrate with the backend clinic app

'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { clinicApiClient } from '@/lib/api/client';
import { auditLog } from '@/lib/audit';
import { validateClinicAccess } from '@/lib/auth/permissions';
import type { Clinic, ClinicLocation, CreateClinicData, UpdateClinicData } from '@/types/clinic.types';

// ✅ Input Validation Schemas
const createClinicSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().min(5).max(200),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
  email: z.string().email(),
  subdomain: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  mainLocation: z.object({
    name: z.string().min(2).max(100),
    address: z.string().min(5).max(200),
    city: z.string().min(2).max(50),
    state: z.string().min(2).max(50),
    country: z.string().min(2).max(50),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
    phone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
    email: z.string().email(),
    timezone: z.string(),
  }),
  clinicAdminIdentifier: z.string().email().optional(),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  description: z.string().max(500).optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  language: z.string().optional(),
});

const updateClinicSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  address: z.string().min(5).max(200).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/).optional(),
  email: z.string().email().optional(),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  description: z.string().max(500).optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  language: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ✅ Helper Functions
async function getSessionData() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  const userId = cookieStore.get('user_id')?.value;
  const clinicId = cookieStore.get('clinic_id')?.value;

  if (!sessionId || !userId) {
    throw new Error('Unauthorized: Please log in again');
  }

  return { sessionId, userId, clinicId };
}

async function getClientIP(): Promise<string> {
  const { headers } = await import('next/headers');
  const headersList = await headers();
  return headersList.get('x-forwarded-for') || 
         headersList.get('x-real-ip') || 
         'unknown';
}

async function getUserAgent(): Promise<string> {
  const { headers } = await import('next/headers');
  const headersList = await headers();
  return headersList.get('user-agent') || 'unknown';
}

// ✅ Clinic Management Server Actions

/**
 * Create a new clinic
 */
export async function createClinic(data: CreateClinicData): Promise<{ success: boolean; clinic?: Clinic; error?: string }> {
  try {
    // Validate input
    const validatedData = createClinicSchema.parse(data);

    // Get session data
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'clinics.create');
    if (!hasAccess) {
      await auditLog({
        userId,
        action: 'CREATE_CLINIC_DENIED',
        resource: 'CLINIC',
        resourceId: 'new',
        result: 'FAILURE',
        riskLevel: 'MEDIUM',
        ipAddress: await getClientIP(),
        userAgent: await getUserAgent(),
        sessionId
      });
      
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Create clinic via API - match the expected API client signature
    const apiData = {
      name: validatedData.name,
      address: validatedData.address,
      phone: validatedData.phone,
      email: validatedData.email,
      subdomain: validatedData.subdomain,
      mainLocation: validatedData.mainLocation,
      clinicAdminIdentifier: validatedData.clinicAdminIdentifier || '',
      logo: validatedData.logo || '',
      website: validatedData.website || '',
      description: validatedData.description || '',
      timezone: validatedData.timezone || 'UTC',
      currency: validatedData.currency || 'USD',
      language: validatedData.language || 'en',
    };

    const response = await clinicApiClient.createClinic(apiData);

    if (!response.success || !response.data) {
      return { success: false, error: 'Failed to create clinic' };
    }

    // Audit log successful creation
    await auditLog({
      userId,
      action: 'CLINIC_CREATED',
      resource: 'CLINIC',
      resourceId: (response.data as any).id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      sessionId,
      metadata: {
        clinicName: (response.data as any).name,
        clinicSubdomain: (response.data as any).subdomain
      }
    });

    // Revalidate cache
    revalidatePath('/dashboard/clinics');
    revalidateTag('clinics');
    
    return { success: true, clinic: response.data as Clinic };
    
  } catch (error) {
    console.error('Failed to create clinic:', error);
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation error: ${error.errors[0]?.message}` 
      };
    }
    
    return { 
      success: false, 
      error: 'An unexpected error occurred while creating the clinic' 
    };
  }
}

/**
 * Get all clinics (with pagination)
 */
export async function getClinics(filters?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ success: boolean; clinics?: Clinic[]; meta?: any; error?: string }> {
  try {
    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'clinics.read');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Get clinics via API
    const response = await clinicApiClient.getClinics(filters);

    if (!response.success) {
      return { success: false, error: 'Failed to fetch clinics' };
    }

    return { 
      success: true, 
      clinics: response.data as Clinic[] || [], 
      meta: response.meta 
    };
    
  } catch (error) {
    console.error('Failed to get clinics:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while fetching clinics' 
    };
  }
}

/**
 * Get clinic by ID
 */
export async function getClinicById(id: string): Promise<{ success: boolean; clinic?: Clinic; error?: string }> {
  try {
    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'clinics.read');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Get clinic via API
    const response = await clinicApiClient.getClinicById(id);

    if (!response.success || !response.data) {
      return { success: false, error: 'Clinic not found' };
    }

    return { success: true, clinic: response.data as Clinic };
    
  } catch (error) {
    console.error('Failed to get clinic:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while fetching the clinic' 
    };
  }
}

/**
 * Get clinic by app name (subdomain)
 */
export async function getClinicByAppName(appName: string): Promise<{ success: boolean; clinic?: Clinic; error?: string }> {
  try {
    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'clinics.read');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Get clinic via API
    const response = await clinicApiClient.getClinicByAppName(appName);

    if (!response.success || !response.data) {
      return { success: false, error: 'Clinic not found' };
    }

    return { success: true, clinic: response.data as Clinic };
    
  } catch (error) {
    console.error('Failed to get clinic by app name:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while fetching the clinic' 
    };
  }
}

/**
 * Update clinic
 */
export async function updateClinic(id: string, data: UpdateClinicData): Promise<{ success: boolean; clinic?: Clinic; error?: string }> {
  try {
    // Validate input
    const validatedData = updateClinicSchema.parse(data);

    // Get session data
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'clinics.update');
    if (!hasAccess) {
      await auditLog({
        userId,
        action: 'UPDATE_CLINIC_DENIED',
        resource: 'CLINIC',
        resourceId: id,
        result: 'FAILURE',
        riskLevel: 'MEDIUM',
        ipAddress: await getClientIP(),
        userAgent: await getUserAgent(),
        sessionId
      });
      
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Convert validated data to match API client signature
    const apiData: any = {
      name: validatedData.name || '',
      address: validatedData.address || '',
      phone: validatedData.phone || '',
      email: validatedData.email || '',
      logo: validatedData.logo || '',
      website: validatedData.website || '',
      description: validatedData.description || '',
      timezone: validatedData.timezone || '',
      currency: validatedData.currency || '',
      language: validatedData.language || '',
    };

    // Only add isActive if it's defined
    if (validatedData.isActive !== undefined) {
      apiData.isActive = validatedData.isActive;
    }

    // Update clinic via API
    const response = await clinicApiClient.updateClinic(id, apiData);

    if (!response.success || !response.data) {
      return { success: false, error: 'Failed to update clinic' };
    }

    // Audit log successful update
    await auditLog({
      userId,
      action: 'CLINIC_UPDATED',
      resource: 'CLINIC',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      sessionId,
      metadata: {
        updatedFields: Object.keys(validatedData)
      }
    });

    // Revalidate cache
    revalidatePath('/dashboard/clinics');
    revalidatePath(`/dashboard/clinics/${id}`);
    revalidateTag('clinics');
    
    return { success: true, clinic: response.data as Clinic };
    
  } catch (error) {
    console.error('Failed to update clinic:', error);
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation error: ${error.errors[0]?.message}` 
      };
    }
    
    return { 
      success: false, 
      error: 'An unexpected error occurred while updating the clinic' 
    };
  }
}

/**
 * Delete clinic
 */
export async function deleteClinic(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get session data
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'clinics.delete');
    if (!hasAccess) {
      await auditLog({
        userId,
        action: 'DELETE_CLINIC_DENIED',
        resource: 'CLINIC',
        resourceId: id,
        result: 'FAILURE',
        riskLevel: 'HIGH',
        ipAddress: await getClientIP(),
        userAgent: await getUserAgent(),
        sessionId
      });
      
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Delete clinic via API
    const response = await clinicApiClient.deleteClinic(id);

    if (!response.success) {
      return { success: false, error: 'Failed to delete clinic' };
    }

    // Audit log successful deletion
    await auditLog({
      userId,
      action: 'CLINIC_DELETED',
      resource: 'CLINIC',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'HIGH',
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      sessionId
    });

    // Revalidate cache
    revalidatePath('/dashboard/clinics');
    revalidateTag('clinics');
    
    return { success: true };
    
  } catch (error) {
    console.error('Failed to delete clinic:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while deleting the clinic' 
    };
  }
}

// ✅ Clinic Location Server Actions

/**
 * Create clinic location
 */
export async function createClinicLocation(clinicId: string, data: {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string;
  email: string;
  timezone: string;
  isActive?: boolean;
}): Promise<{ success: boolean; location?: ClinicLocation; error?: string }> {
  try {
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'clinics.update');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Create location via API
    const response = await clinicApiClient.post(`/clinics/${clinicId}/locations`, data);

    if (!response.success || !response.data) {
      return { success: false, error: 'Failed to create clinic location' };
    }

    // Audit log
    await auditLog({
      userId,
      action: 'CLINIC_LOCATION_CREATED',
      resource: 'CLINIC_LOCATION',
      resourceId: (response.data as any).id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      sessionId,
      metadata: {
        clinicId,
        locationName: (response.data as any).name
      }
    });

    // Revalidate cache
    revalidatePath(`/dashboard/clinics/${clinicId}/locations`);
    revalidateTag('clinic-locations');
    
    return { success: true, location: response.data as ClinicLocation };
    
  } catch (error) {
    console.error('Failed to create clinic location:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while creating the clinic location' 
    };
  }
}

/**
 * Get clinic locations
 */
export async function getClinicLocations(clinicId: string): Promise<{ success: boolean; locations?: ClinicLocation[]; error?: string }> {
  try {
    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'clinics.read');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Get locations via API
    const response = await clinicApiClient.get(`/clinics/${clinicId}/locations`);

    if (!response.success) {
      return { success: false, error: 'Failed to fetch clinic locations' };
    }

    return { success: true, locations: response.data as ClinicLocation[] || [] };
    
  } catch (error) {
    console.error('Failed to get clinic locations:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while fetching clinic locations' 
    };
  }
}

/**
 * Update clinic location
 */
export async function updateClinicLocation(clinicId: string, locationId: string, data: Partial<ClinicLocation>): Promise<{ success: boolean; location?: ClinicLocation; error?: string }> {
  try {
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'clinics.update');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Update location via API
    const response = await clinicApiClient.put(`/clinics/${clinicId}/locations/${locationId}`, data);

    if (!response.success || !response.data) {
      return { success: false, error: 'Failed to update clinic location' };
    }

    // Audit log
    await auditLog({
      userId,
      action: 'CLINIC_LOCATION_UPDATED',
      resource: 'CLINIC_LOCATION',
      resourceId: locationId,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      sessionId,
      metadata: {
        clinicId,
        updatedFields: Object.keys(data)
      }
    });

    // Revalidate cache
    revalidatePath(`/dashboard/clinics/${clinicId}/locations`);
    revalidateTag('clinic-locations');
    
    return { success: true, location: response.data as ClinicLocation };
    
  } catch (error) {
    console.error('Failed to update clinic location:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while updating the clinic location' 
    };
  }
}

/**
 * Delete clinic location
 */
export async function deleteClinicLocation(clinicId: string, locationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'clinics.delete');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Delete location via API
    const response = await clinicApiClient.delete(`/clinics/${clinicId}/locations/${locationId}`);

    if (!response.success) {
      return { success: false, error: 'Failed to delete clinic location' };
    }

    // Audit log
    await auditLog({
      userId,
      action: 'CLINIC_LOCATION_DELETED',
      resource: 'CLINIC_LOCATION',
      resourceId: locationId,
      result: 'SUCCESS',
      riskLevel: 'MEDIUM',
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      sessionId,
      metadata: {
        clinicId
      }
    });

    // Revalidate cache
    revalidatePath(`/dashboard/clinics/${clinicId}/locations`);
    revalidateTag('clinic-locations');
    
    return { success: true };
    
  } catch (error) {
    console.error('Failed to delete clinic location:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while deleting the clinic location' 
    };
  }
}

// ✅ Health Check Server Actions

/**
 * Get health status
 */
export async function getHealthStatus(): Promise<{ success: boolean; status?: any; error?: string }> {
  try {
    const response = await clinicApiClient.getHealthStatus();

    if (!response.success) {
      return { success: false, error: 'Health check failed' };
    }

    return { success: true, status: response.data };
    
  } catch (error) {
    console.error('Health check failed:', error);
    return { 
      success: false, 
      error: 'Health check failed' 
    };
  }
}

/**
 * Get health ready status
 */
export async function getHealthReady(): Promise<{ success: boolean; status?: any; error?: string }> {
  try {
    // Mock health ready check - implement actual API call when available
    const response = { success: true, status: 'ready' };

    if (!response.success) {
      return { success: false, error: 'Health ready check failed' };
    }

    return { success: true, status: response.status };
    
  } catch (error) {
    console.error('Health ready check failed:', error);
    return { 
      success: false, 
      error: 'Health ready check failed' 
    };
  }
}

/**
 * Get health live status
 */
export async function getHealthLive(): Promise<{ success: boolean; status?: unknown; error?: string }> {
  try {
    const response = await clinicApiClient.getApiStatus();

    if (!response.success) {
      return { success: false, error: 'Health live check failed' };
    }

    return { success: true, status: response.data };
    
  } catch (error) {
    console.error('Health live check failed:', error);
    return { 
      success: false, 
      error: 'Health live check failed' 
    };
  }
}

/**
 * Get all clinics (missing function)
 */
export async function getAllClinics(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ 
  success: boolean; 
  clinics?: Clinic[]; 
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error?: string;
}> {
  try {
    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'clinics.read');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Get all clinics via API client
    const response = await clinicApiClient.getClinics(params);

    if (!response.success) {
      return { success: false, error: 'Failed to fetch clinics' };
    }

    return { 
      success: true, 
      clinics: (response.data as Clinic[]) || [], 
      meta: response.meta 
    };
    
  } catch (error) {
    console.error('Failed to get all clinics:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while fetching clinics' 
    };
  }
}