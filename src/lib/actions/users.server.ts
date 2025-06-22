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

  // Make sure to use the correct header name format (X-Session-ID) as expected by the backend
  // Also include the user ID in multiple formats to ensure compatibility with the backend
  return {
    'Authorization': `Bearer ${accessToken}`,
    'X-Session-ID': sessionId || '',
    'X-User-ID': userId, // Add explicit user ID header
    'Content-Type': 'application/json',
  };
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
    const response = await fetch(`${API_URL}/user/${userId}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
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

export async function updateUserProfile(data: Record<string, unknown>) {
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
    console.log('Profile data:', JSON.stringify(data, null, 2));
    console.log('JWT payload:', {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    });

    // Add the user ID to the data to help with backend permission checks
    // This is a workaround for the backend expecting the ID in a specific format
    const enhancedData = {
      ...data,
      // Include the ID in multiple formats to increase chances of matching backend expectations
      id: userId,
      userId: userId,
      user_id: userId,
      sub: userId // Add the sub field which is used by the JWT auth guard
    };

    // Use the correct API endpoint: PATCH /user/{id}
    const response = await fetch(`${API_URL}/user/${userId}`, {
      method: 'PATCH',
      headers: {
        ...await getEnhancedAuthHeaders(userId),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(enhancedData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to update user profile:', response.status, errorData);
      
      // Special handling for authentication errors
      if (response.status === 401) {
        const errorMessage = errorData.message || '';
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
            
            if (refreshResponse.ok) {
              console.log('Session refreshed successfully, retrying profile update');
              
              // Get the refreshed tokens from the response
              const refreshData = await refreshResponse.json();
              
              // Update cookies with new tokens if provided
              if (refreshData.access_token) {
                cookieStore.set('access_token', refreshData.access_token, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'strict',
                  path: '/',
                  maxAge: 60 * 15, // 15 minutes
                });
              }
              
              if (refreshData.session_id) {
                cookieStore.set('session_id', refreshData.session_id, {
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
                  ...await getEnhancedAuthHeaders(userId),
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(enhancedData),
              });
              
              if (retryResponse.ok) {
                const result = await retryResponse.json();
                console.log('Profile update result (after retry):', JSON.stringify(result, null, 2));
                return { status: 200, data: result };
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
        console.error('Permission error when updating profile:', errorData);
        throw new Error('You do not have permission to update this profile. This may be due to an authentication issue. Please try logging out and logging back in.');
      } else if (response.status === 500) {
        // Handle server errors
        console.error('Server error when updating profile:', errorData);
        throw new Error('The server encountered an error. Please try again later.');
      } else {
        // Handle other errors
        const errorMessage = errorData.message || `Error ${response.status}`;
        throw new Error(`Failed to update profile: ${errorMessage}`);
      }
    }
    
    // Process successful response
    const result = await response.json();
    console.log('Profile update result:', JSON.stringify(result, null, 2));
    return { status: 200, data: result };
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