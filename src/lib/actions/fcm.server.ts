'use server';

import { authenticatedApi } from './auth.server';
import { API_ENDPOINTS } from '../config/config';

/**
 * Register FCM device token with backend
 */
export async function registerFCMToken(data: {
  token: string;
  platform: string;
  userId: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
}) {
  const { data: result } = await authenticatedApi(
    API_ENDPOINTS.COMMUNICATION.PUSH.REGISTER_DEVICE_TOKEN,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
  return result;
}
