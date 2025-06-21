'use server';

import { cookies } from 'next/headers';

/**
 * Get profile completion status from cookies
 */
export async function getProfileCompletionFromCookies(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get('profile_complete')?.value === 'true';
} 