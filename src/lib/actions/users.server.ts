'use server';

// User actions for frontend, matching backend endpoints
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function getAuthHeaders() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const sessionId = cookieStore.get('session_id')?.value;
  
  // Debug JWT token payload if available
  let userId = '';
  if (accessToken) {
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      userId = payload.sub || '';
      console.log('JWT Token payload:', {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        exp: new Date(payload.exp * 1000).toISOString(),
        iat: new Date(payload.iat * 1000).toISOString(),
      });
    } catch (e) {
      console.error('Error parsing JWT token:', e);
    }
  }
  
  console.log('getAuthHeaders - Retrieved from cookies:', {
    hasAccessToken: !!accessToken,
    accessToken: accessToken ? accessToken.substring(0, 15) + '...' : 'N/A',
    hasSessionId: !!sessionId,
    sessionId: sessionId,
  });
  
  if (!accessToken) {
    console.error("getAuthHeaders - NO ACCESS TOKEN FOUND IN COOKIES. This will cause a 401 error.");
  }

  if (!sessionId) {
    console.warn("getAuthHeaders - NO SESSION ID FOUND IN COOKIES. This may cause authentication issues.");
  }

  // Log all outgoing headers
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'X-Session-ID': sessionId || '',
    'X-User-ID': userId, // Add explicit user ID header
    'Content-Type': 'application/json',
  };
  console.log('getAuthHeaders - Outgoing headers:', headers);
  return headers;
}

// Special function for user profile updates to ensure proper authentication
async function getEnhancedAuthHeaders(userId: string) {
  const baseHeaders = await getAuthHeaders();
  
  // Add user ID in multiple formats to increase chances of successful auth
  return {
    ...baseHeaders,
    'X-User-ID': userId,
    'X-User-Sub': userId,
    // Add a custom header with user info that the backend might use
    'X-User-Info': JSON.stringify({
      id: userId,
      sub: userId,
      userId: userId
    })
  };
}

export async function getUserProfile() {
  try {
    // First get the current user's ID from the session
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    
    if (!accessToken) {
      throw new Error('No access token available');
    }

    // Extract user ID from JWT token
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const userId = payload.sub;

    if (!userId) {
      throw new Error('No user ID found in token');
    }

    // Use the correct API endpoint: /user/{id}
    const url = `${API_URL}/user/${userId}`;
    const headers = await getAuthHeaders();
    console.log('getUserProfile - Fetching profile with:', { url, headers });
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.error('Failed to fetch user profile:', response.status, response.statusText);
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('User profile data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

export async function updateUserProfile(profileData: Record<string, unknown>) {
  try {
    // First get the current user's ID from the session
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    
    if (!accessToken) {
      throw new Error('No access token available');
    }

    // Extract user ID from JWT token
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const userId = payload.sub;

    if (!userId) {
      throw new Error('No user ID found in token');
    }

    console.log('Updating profile for user:', userId);
    console.log('Profile data:', JSON.stringify(profileData, null, 2));
    console.log('JWT payload:', {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    });

    // The user ID should only be sent in the URL, not in the body.
    // The backend's validation pipe will reject the request if IDs are in the body.
    const cleanData = { ...profileData };
    delete (cleanData as Record<string, unknown>).id;
    delete (cleanData as Record<string, unknown>).userId;
    delete (cleanData as Record<string, unknown>).user_id;
    delete (cleanData as Record<string, unknown>).sub;

    // Use the correct API endpoint: PATCH /user/{id}
    const response = await fetch(`${API_URL}/user/${userId}`, {
      method: 'PATCH',
      headers: {
        ...(await getEnhancedAuthHeaders(userId)),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cleanData),
    });

    let responseData: Record<string, unknown> = {};
    try {
      responseData = await response.json();
    } catch {
      responseData = {};
    }

    if (!response.ok) {
      console.error('Failed to update user profile:', response.status, responseData);
      // Special handling for authentication errors
      if (response.status === 401) {
        const errorMessage = typeof responseData === 'object' && responseData && 'message' in responseData
          ? String((responseData as { message?: string }).message)
          : '';
        console.warn(`Authentication error: ${errorMessage}`);
        // Handle both device validation and session errors
        if (errorMessage.includes('Invalid device') || errorMessage.includes('Invalid session')) {
          console.warn('Attempting to refresh the session...');
          // Try to refresh the session
          try {
            const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
              method: 'POST',
              headers: await getEnhancedAuthHeaders(userId),
            });
            let refreshData: Record<string, unknown> = {};
            try {
              refreshData = await refreshResponse.json();
            } catch {
              refreshData = {};
            }
            if (refreshResponse.ok) {
              console.log('Session refreshed successfully, retrying profile update');
              // Update cookies with new tokens if provided
              if (typeof refreshData === 'object' && refreshData && 'access_token' in refreshData) {
                cookieStore.set('access_token', String((refreshData as { access_token?: string }).access_token), {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'strict',
                  path: '/',
                  maxAge: 60 * 15, // 15 minutes
                });
              }
              if (typeof refreshData === 'object' && refreshData && 'session_id' in refreshData) {
                cookieStore.set('session_id', String((refreshData as { session_id?: string }).session_id), {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'strict',
                  path: '/',
                  maxAge: 60 * 60 * 24 * 7, // 7 days
                });
              }
              // Retry the update with fresh tokens
              const retryResponse = await fetch(`${API_URL}/user/${userId}`, {
                method: 'PATCH',
                headers: {
                  ...(await getEnhancedAuthHeaders(userId)),
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(cleanData),
              });
              let retryData: Record<string, unknown> = {};
              try {
                retryData = await retryResponse.json();
              } catch {
                retryData = {};
              }
              if (retryResponse.ok) {
                console.log('Profile update result (after retry):', JSON.stringify(retryData, null, 2));
                return { status: 200, data: retryData };
              } else {
                throw new Error(`Failed to update profile after refresh: ${retryResponse.status}`);
              }
            } else {
              throw new Error('Failed to refresh session');
            }
          } catch (refreshError) {
            console.error('Error refreshing session:', refreshError);
            throw new Error('Session validation failed. Please log out and log in again.');
          }
        }
      } else if (response.status === 403) {
        // Handle permission errors with more specific messaging
        console.error('Permission error when updating profile:', responseData);
        throw new Error('You do not have permission to update this profile. This may be due to an authentication issue. Please try logging out and logging back in.');
      } else if (response.status === 500) {
        // Handle server errors
        console.error('Server error when updating profile:', responseData);
        throw new Error('The server encountered an error. Please try again later.');
      } else {
        // Handle other errors
        const errorMessage = typeof responseData === 'object' && responseData && 'message' in responseData
          ? String((responseData as { message?: string }).message)
          : `Error ${response.status}`;
        throw new Error(`Failed to update profile: ${errorMessage}`);
      }
    }
    // Process successful response
    console.log('Profile update result:', JSON.stringify(responseData, null, 2));
    return { status: 200, data: responseData };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function getUserById(id: string) {
  try {
    const response = await fetch(`${API_URL}/user/${id}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Failed to fetch user: ${response.status}`);
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function updateUser(id: string, data: Record<string, unknown>) {
  try {
    const response = await fetch(`${API_URL}/user/${id}`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to update user: ${response.status}`);
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function deleteUser(id: string) {
  try {
    const response = await fetch(`${API_URL}/user/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Failed to delete user: ${response.status}`);
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function getAllUsers() {
  try {
    const response = await fetch(`${API_URL}/user/all`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Failed to fetch users: ${response.status}`);
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function getPatients() {
  try {
    const response = await fetch(`${API_URL}/user/role/patient`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Failed to fetch patients: ${response.status}`);
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function getDoctors() {
  try {
    const response = await fetch(`${API_URL}/user/role/doctors`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Failed to fetch doctors: ${response.status}`);
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function getReceptionists() {
  try {
    const response = await fetch(`${API_URL}/user/role/receptionists`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Failed to fetch receptionists: ${response.status}`);
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function getClinicAdmins() {
  try {
    const response = await fetch(`${API_URL}/user/role/clinic-admins`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Failed to fetch clinic admins: ${response.status}`);
    return await response.json();
  } catch (error) {
    throw error;
  }
} 