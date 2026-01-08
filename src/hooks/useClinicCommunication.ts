/**
 * Clinic Communication Hooks
 * Handles clinic-specific communication settings
 */

import { useQueryData } from './useQueryData';
import { useMutationData } from './useMutationData';
import type { ClinicCommunicationConfig } from '@/lib/actions/clinic-communication.server';
import {
  getClinicCommunicationConfig,
  createClinicCommunicationConfig,
  updateClinicCommunicationConfig,
  deleteClinicCommunicationConfig,
  testClinicCommunication,
} from '@/lib/actions/clinic-communication.server';

/**
 * Hook to get clinic communication configuration
 */
export const useClinicCommunicationConfig = (clinicId: string) => {
  return useQueryData(
    ['clinicCommunication', clinicId],
    async () => {
      return await getClinicCommunicationConfig(clinicId);
    },
    { enabled: !!clinicId }
  );
};

/**
 * Hook to create clinic communication configuration
 */
export const useCreateClinicCommunicationConfig = () => {
  return useMutationData(
    ['createClinicCommunication'],
    async (data: { clinicId: string; config: ClinicCommunicationConfig }) => {
      return await createClinicCommunicationConfig(data.clinicId, data.config);
    },
    ['clinicCommunication']
  );
};

/**
 * Hook to update clinic communication configuration
 */
export const useUpdateClinicCommunicationConfig = () => {
  return useMutationData(
    ['updateClinicCommunication'],
    async (data: {
      clinicId: string;
      id: string;
      config: Partial<ClinicCommunicationConfig>;
    }) => {
      return await updateClinicCommunicationConfig(data.clinicId, data.id, data.config);
    },
    ['clinicCommunication']
  );
};

/**
 * Hook to delete clinic communication configuration
 */
export const useDeleteClinicCommunicationConfig = () => {
  return useMutationData(
    ['deleteClinicCommunication'],
    async (data: { clinicId: string; id: string }) => {
      return await deleteClinicCommunicationConfig(data.clinicId, data.id);
    },
    ['clinicCommunication']
  );
};

/**
 * Hook to test clinic communication
 */
export const useTestClinicCommunication = () => {
  return useMutationData(
    ['testClinicCommunication'],
    async (data: {
      clinicId: string;
      type: 'email' | 'sms' | 'whatsapp';
      to: string;
      message?: string;
    }) => {
      return await testClinicCommunication(data.clinicId, {
        type: data.type,
        to: data.to,
        message: data.message,
      });
    }
  );
};



