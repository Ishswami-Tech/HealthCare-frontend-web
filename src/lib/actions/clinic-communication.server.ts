/**
 * Clinic Communication Server Actions
 * Handles clinic-specific communication settings and configuration
 */

import { authenticatedApi } from './auth.server';
import { API_ENDPOINTS } from '@/lib/config/config';
import { logger } from '@/lib/utils/logger';

export interface ProviderConfig {
  provider: string;
  enabled: boolean;
  credentials: Record<string, string> | { encrypted: string };
  settings?: Record<string, unknown>;
  priority?: number;
}

export interface ClinicCommunicationConfig {
  clinicId: string;
  email: {
    primary?: ProviderConfig;
    fallback?: ProviderConfig[];
    defaultFrom?: string;
    defaultFromName?: string;
  };
  whatsapp: {
    primary?: ProviderConfig;
    fallback?: ProviderConfig[];
    defaultNumber?: string;
  };
  sms: {
    primary?: ProviderConfig;
    fallback?: ProviderConfig[];
    defaultNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type UpdateClinicCommunicationConfig = Partial<
  Pick<ClinicCommunicationConfig, 'email' | 'whatsapp' | 'sms'>
>;

export interface UpdateSesConfig {
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  fromEmail?: string;
  fromName?: string;
  enabled?: boolean;
}

/**
 * Get clinic communication configuration
 */
export async function getClinicCommunicationConfig(clinicId: string) {
  try {
    const { data } = await authenticatedApi<ClinicCommunicationConfig | null>(
      API_ENDPOINTS.CLINIC_COMMUNICATION.GET(clinicId),
      { method: 'GET' }
    );
    return data;
  } catch (error) {
    logger.error('Failed to get clinic communication config', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Create or update the clinic's communication configuration.
 * The backend exposes a single upsert endpoint (PUT .../communication/config) —
 * there is no separate create endpoint.
 */
export async function updateClinicCommunicationConfig(
  clinicId: string,
  config: UpdateClinicCommunicationConfig
) {
  try {
    const { data } = await authenticatedApi<ClinicCommunicationConfig>(
      API_ENDPOINTS.CLINIC_COMMUNICATION.UPDATE(clinicId),
      {
        method: 'PUT',
        body: JSON.stringify(config),
      }
    );
    return data;
  } catch (error) {
    logger.error('Failed to update clinic communication config', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Update just the clinic's SES email configuration (simplified setup path).
 */
export async function updateClinicSesConfig(clinicId: string, config: UpdateSesConfig) {
  try {
    const { data } = await authenticatedApi<{ success: boolean; message: string }>(
      API_ENDPOINTS.CLINIC_COMMUNICATION.UPDATE_SES(clinicId),
      {
        method: 'PUT',
        body: JSON.stringify(config),
      }
    );
    return data;
  } catch (error) {
    logger.error('Failed to update clinic SES config', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Send a test email using the clinic's configured email provider.
 */
export async function testClinicEmailConfig(clinicId: string, testEmail: string) {
  try {
    const { data } = await authenticatedApi<{ success: boolean; message: string; error?: string }>(
      API_ENDPOINTS.CLINIC_COMMUNICATION.TEST_EMAIL(clinicId),
      {
        method: 'POST',
        body: JSON.stringify({ testEmail }),
      }
    );
    return data;
  } catch (error) {
    logger.error('Failed to test clinic email config', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Send a test WhatsApp message using the clinic's configured WhatsApp provider.
 */
export async function testClinicWhatsAppConfig(clinicId: string, phoneNumber: string) {
  try {
    const { data } = await authenticatedApi<{ success: boolean; message: string; error?: string }>(
      API_ENDPOINTS.CLINIC_COMMUNICATION.TEST_WHATSAPP(clinicId),
      {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
      }
    );
    return data;
  } catch (error) {
    logger.error('Failed to test clinic WhatsApp config', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Send a test SMS using the clinic's configured SMS provider.
 */
export async function testClinicSmsConfig(clinicId: string, phoneNumber: string) {
  try {
    const { data } = await authenticatedApi<{ success: boolean; message: string; error?: string }>(
      API_ENDPOINTS.CLINIC_COMMUNICATION.TEST_SMS(clinicId),
      {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
      }
    );
    return data;
  } catch (error) {
    logger.error('Failed to test clinic SMS config', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}
