import { useQueryData } from './useQueryData';
import { useMutationData } from './useMutationData';
import { useAuth } from './useAuth';

// API URL configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088';

/**
 * Helper to get auth headers
 */
function getAuthHeaders(token?: string, sessionId?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (sessionId) headers['Session-ID'] = sessionId;
  return headers;
}

/**
 * Base API call function for client-side
 */
async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ status: number; data: T }> {
  const url = `${API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return { status: response.status, data };
}

// ===== USER PROFILE HOOKS =====

/**
 * Hook to get user profile
 */
export const useUserProfile = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<Record<string, unknown>>(
    ['userProfile'],
    async () => {
      // Extract user ID from JWT token
      if (!token) {
        throw new Error('No access token available');
      }
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub;
      
      if (!userId) {
        throw new Error('No user ID found in token');
      }
      
      const response = await apiCall<Record<string, unknown>>(`/user/${userId}`, {
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
      return response.data;
    },
    {
      enabled: !!token,
    }
  );
};

/**
 * Hook to update user profile
 */
export const useUpdateUserProfile = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationData<Record<string, unknown>, Record<string, unknown>>(
    ['updateUserProfile'],
    async (profileData) => {
      // Extract user ID from JWT token
      if (!token) {
        throw new Error('No access token available');
      }
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub;
      
      if (!userId) {
        throw new Error('No user ID found in token');
      }
      
      // Clean the data to remove ID fields
      const cleanData = { ...profileData };
      delete (cleanData as Record<string, unknown>).id;
      delete (cleanData as Record<string, unknown>).userId;
      delete (cleanData as Record<string, unknown>).user_id;
      delete (cleanData as Record<string, unknown>).sub;
      
      return apiCall<Record<string, unknown>>(`/user/${userId}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
        body: JSON.stringify(cleanData),
      });
    },
    'userProfile'
  );
};

// ===== USER MANAGEMENT HOOKS =====

/**
 * Hook to get user by ID
 */
export const useUser = (id: string) => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<Record<string, unknown>>(
    ['user', id],
    async () => {
      const response = await apiCall<Record<string, unknown>>(`/user/${id}`, {
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
      return response.data;
    },
    {
      enabled: !!id && !!token,
    }
  );
};

/**
 * Hook to update user
 */
export const useUpdateUser = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationData<Record<string, unknown>, { id: string; data: Record<string, unknown> }>(
    ['updateUser'],
    async ({ id, data }) => {
      return apiCall<Record<string, unknown>>(`/user/${id}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
        body: JSON.stringify(data),
      });
    },
    'users'
  );
};

/**
 * Hook to delete user
 */
export const useDeleteUser = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useMutationData<{ message: string }, string>(
    ['deleteUser'],
    async (id) => {
      return apiCall<{ message: string }>(`/user/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
    },
    'users'
  );
};

/**
 * Hook to get all users
 */
export const useUsers = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<Record<string, unknown>[]>(
    ['users'],
    async () => {
      const response = await apiCall<Record<string, unknown>[]>('/users', {
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
      return response.data;
    },
    {
      enabled: !!token,
    }
  );
};

// ===== ROLE-BASED USER HOOKS =====

/**
 * Hook to get patients
 */
export const usePatients = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<Record<string, unknown>[]>(
    ['patients'],
    async () => {
      const response = await apiCall<Record<string, unknown>[]>('/users/patients', {
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
      return response.data;
    },
    {
      enabled: !!token,
    }
  );
};

/**
 * Hook to get doctors
 */
export const useDoctors = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<Record<string, unknown>[]>(
    ['doctors'],
    async () => {
      const response = await apiCall<Record<string, unknown>[]>('/users/doctors', {
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
      return response.data;
    },
    {
      enabled: !!token,
    }
  );
};

/**
 * Hook to get receptionists
 */
export const useReceptionists = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<Record<string, unknown>[]>(
    ['receptionists'],
    async () => {
      const response = await apiCall<Record<string, unknown>[]>('/users/receptionists', {
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
      return response.data;
    },
    {
      enabled: !!token,
    }
  );
};

/**
 * Hook to get clinic admins
 */
export const useClinicAdmins = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  const sessionId = session?.session_id;
  
  return useQueryData<Record<string, unknown>[]>(
    ['clinicAdmins'],
    async () => {
      const response = await apiCall<Record<string, unknown>[]>('/users/clinic-admins', {
        headers: {
          ...getAuthHeaders(token, sessionId),
        },
      });
      return response.data;
    },
    {
      enabled: !!token,
    }
  );
};

// ===== UTILITY FUNCTIONS =====

/**
 * Hook to format user name
 */
export const useFormatUserName = () => {
  return (user: Record<string, unknown> | null): string => {
    if (!user) return '';
    
    const firstName = user.firstName as string || '';
    const lastName = user.lastName as string || '';
    const name = user.name as string || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    if (name) {
      return name;
    }
    
    if (firstName) {
      return firstName;
    }
    
    if (lastName) {
      return lastName;
    }
    
    return user.email as string || 'Unknown User';
  };
};

/**
 * Hook to get user role display name
 */
export const useUserRoleDisplayName = () => {
  return (role: string): string => {
    const roleMap: Record<string, string> = {
      'super_admin': 'Super Admin',
      'clinic_admin': 'Clinic Admin',
      'doctor': 'Doctor',
      'receptionist': 'Receptionist',
      'patient': 'Patient',
    };
    
    return roleMap[role.toLowerCase()] || role;
  };
};

/**
 * Hook to get user status color
 */
export const useUserStatusColor = () => {
  return (isActive: boolean): string => {
    return isActive ? 'text-green-600' : 'text-red-600';
  };
};

/**
 * Hook to check if user profile is complete
 */
export const useIsProfileComplete = () => {
  return (user: Record<string, unknown> | null): boolean => {
    if (!user) return false;
    
    const requiredFields = [
      'firstName',
      'lastName', 
      'phone',
      'dateOfBirth',
      'gender',
      'address'
    ];
    
    const missingFields = requiredFields.filter(field => {
      const value = user[field];
      return !value || (typeof value === 'string' && value.trim() === '');
    });
    
    return missingFields.length === 0;
  };
};

/**
 * Hook to get user avatar
 */
export const useUserAvatar = () => {
  return (user: Record<string, unknown> | null): string => {
    if (!user) return '';
    
    // If user has a custom avatar, use it
    if (user.avatar) {
      return user.avatar as string;
    }
    
    // If user has a profile picture, use it
    if (user.profilePicture) {
      return user.profilePicture as string;
    }
    
    // Generate initials from name
    const firstName = user.firstName as string || '';
    const lastName = user.lastName as string || '';
    const name = user.name as string || '';
    
    let initials = '';
    if (firstName && lastName) {
      initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (name) {
      const nameParts = name.split(' ');
      if (nameParts.length >= 2) {
        initials = `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
      } else {
        initials = name.charAt(0).toUpperCase();
      }
    } else if (firstName) {
      initials = firstName.charAt(0).toUpperCase();
    } else if (lastName) {
      initials = lastName.charAt(0).toUpperCase();
    } else {
      initials = 'U';
    }
    
    // Return a placeholder avatar with initials
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff&size=128`;
  };
}; 