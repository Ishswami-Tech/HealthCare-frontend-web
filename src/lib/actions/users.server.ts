'use server';

// User actions for frontend, matching backend endpoints
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function getAuthHeaders() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const sessionId = cookieStore.get('session_id')?.value;
  console.log('getAuthHeaders - Retrieved from cookies:', {
    hasAccessToken: !!accessToken,
    accessToken: accessToken ? accessToken.substring(0, 15) + '...' : 'N/A',
    hasSessionId: !!sessionId,
    sessionId: sessionId,
  });
  if (!accessToken) {
    console.error("getAuthHeaders - NO ACCESS TOKEN FOUND IN COOKIES. This will cause a 401 error.");
  }

  return {
    'Authorization': `Bearer ${accessToken}`,
    'x-session-id': sessionId || '',
    'Content-Type': 'application/json',
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

    // Use the correct API endpoint: PATCH /user/{id}
    const response = await fetch(`${API_URL}/user/${userId}`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to update user profile:', response.status, errorData);
      
      // Special handling for device validation errors
      if (response.status === 401 && errorData.message?.includes('Invalid device')) {
        console.warn('Device validation failed. Attempting to refresh the session...');
        
        // Try to refresh the session
        try {
          const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: await getAuthHeaders(),
          });
          
          if (refreshResponse.ok) {
            console.log('Session refreshed successfully, retrying profile update');
            // Retry the update with fresh tokens
            const retryResponse = await fetch(`${API_URL}/user/${userId}`, {
              method: 'PATCH',
              headers: await getAuthHeaders(),
              body: JSON.stringify(data),
            });
            
            if (retryResponse.ok) {
              const result = await retryResponse.json();
              console.log('Profile update result (after retry):', JSON.stringify(result, null, 2));
              return result;
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
      
      throw new Error(`Failed to update profile: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Profile update result:', JSON.stringify(result, null, 2));
    return result;
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