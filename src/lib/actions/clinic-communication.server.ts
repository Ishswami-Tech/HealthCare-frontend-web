/**
 * Clinic Communication Server Actions
 * Handles clinic-specific communication settings and configuration
 */

import { authenticatedApi } from './auth.server';
import { API_ENDPOINTS } from '@/lib/config/config';
import { logger } from '@/lib/utils/logger';

export interface ClinicCommunicationConfig {
  email?: {
    provider: string;
    credentials?: Record<string, any>;
    enabled: boolean;
  };
  sms?: {
    provider: string;
    credentials?: Record<string, any>;
    enabled: boolean;
  };
  whatsapp?: {
    provider: string;
    credentials?: Record<string, any>;
    enabled: boolean;
  };
  push?: {
    enabled: boolean;
  };
}

/**
 * Get clinic communication configuration
 */
export async function getClinicCommunicationConfig(clinicId: string) {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.CLINIC_COMMUNICATION.GET(clinicId), {
      method: 'GET',
    });
    return data;
  } catch (error) {
    logger.error('Failed to get clinic communication config', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Create clinic communication configuration
 */
export async function createClinicCommunicationConfig(clinicId: string, config: ClinicCommunicationConfig) {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.CLINIC_COMMUNICATION.CREATE(clinicId), {
      method: 'POST',
      body: JSON.stringify(config),
    });
    return data;
  } catch (error) {
    logger.error('Failed to create clinic communication config', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Update clinic communication configuration
 */
export async function updateClinicCommunicationConfig(
  clinicId: string,
  id: string,
  config: Partial<ClinicCommunicationConfig>
) {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.CLINIC_COMMUNICATION.UPDATE(clinicId, id), {
      method: 'PUT',
      body: JSON.stringify(config),
    });
    return data;
  } catch (error) {
    logger.error('Failed to update clinic communication config', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Delete clinic communication configuration
 */
export async function deleteClinicCommunicationConfig(clinicId: string, id: string) {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.CLINIC_COMMUNICATION.DELETE(clinicId, id), {
      method: 'DELETE',
    });
    return data;
  } catch (error) {
    logger.error('Failed to delete clinic communication config', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Test clinic communication configuration
 */
export async function testClinicCommunication(clinicId: string, data: {
  type: 'email' | 'sms' | 'whatsapp';
  to: string;
  message?: string;
}) {
  try {
    const { data: response } = await authenticatedApi(API_ENDPOINTS.CLINIC_COMMUNICATION.TEST(clinicId), {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  } catch (error) {
    logger.error('Failed to test clinic communication', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}



