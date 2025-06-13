import { cookies } from 'next/headers';
import { Role } from '@/types/auth.types';

export interface SessionData {
  access_token: string;
  session_id: string;
  user: {
    id: string;
    email: string;
    role: Role;
    firstName: string;
    lastName: string;
    isVerified: boolean;
    profilePicture?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    dateOfBirth?: string;
    age?: number;
    gender?: string;
    medicalConditions?: string[];
    createdAt: string;
    updatedAt: string;
    clinicToken?: string;
    clinic?: any;
  };
}

// Cookie options that are common to all cookies
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
  // In development, we don't require HTTPS
  // In production, we require HTTPS for security
  secure: process.env.NEXT_PUBLIC_USE_HTTPS === 'true' || process.env.NODE_ENV === 'production',
};

// Cookie options for client-side accessible cookies (non-httpOnly)
const clientCookieOptions = {
  ...cookieOptions,
  httpOnly: false, // Allow JavaScript access
};

export async function setSession(data: SessionData) {
  const cookieStore = await cookies();
  
  // Set access token
  cookieStore.set('access_token', data.access_token, cookieOptions);

  // Set session ID
  cookieStore.set('session_id', data.session_id, cookieOptions);

  // Set user role
  cookieStore.set('user_role', data.user.role, cookieOptions);

  // Set user data in a non-httpOnly cookie for client-side access
  cookieStore.set('user_data', JSON.stringify({
    id: data.user.id,
    email: data.user.email,
    role: data.user.role,
    firstName: data.user.firstName,
    lastName: data.user.lastName,
    isVerified: data.user.isVerified,
    profilePicture: data.user.profilePicture,
  }), clientCookieOptions);
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const sessionId = cookieStore.get('session_id')?.value;
  const userData = cookieStore.get('user_data')?.value;

  if (!accessToken || !sessionId || !userData) {
    return null;
  }

  try {
    return {
      access_token: accessToken,
      session_id: sessionId,
      user: JSON.parse(userData)
    };
  } catch (error) {
    console.error('Error parsing session data:', error);
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('access_token');
  cookieStore.delete('session_id');
  cookieStore.delete('user_role');
  cookieStore.delete('user_data');
}

export async function getAuthHeaders() {
  const session = await getSession();
  if (!session) {
    return {};
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    'X-Session-ID': session.session_id,
  };
} 