import { useQueryData, useMutationOperation } from '../core';
import { TOAST_IDS } from '../utils/use-toast';
import { useAuth } from '../auth/useAuth';
import { setProfileComplete } from '@/lib/actions/auth.server';
import {
  getAllUsers,
  getUserProfile,
  getUserById,
  updateUserProfile,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  getUsersByRole,
  getUsersByClinic,
  searchUsers,
  getUserStats,
  bulkUpdateUsers,
  exportUsers,
  changeUserPassword,
  toggleUserVerification,
  getUserActivityLogs,
  getUserSessions,
  terminateUserSession,
} from '@/lib/actions/users.server';

// ===== USER PROFILE HOOKS =====

/**
 * Hook to get user profile
 */
export const useUserProfile = () => {
  return useQueryData(['userProfile'], async () => {
    return await getUserProfile();
  });
};

/**
 * Hook to update user profile
 */
export const useUpdateUserProfile = () => {
  return useMutationOperation(
    async (profileData) => {
      return await updateUserProfile(profileData as Record<string, unknown>);
    },
    {
      toastId: TOAST_IDS.PROFILE.UPDATE,
      loadingMessage: 'Updating user profile...',
      successMessage: 'User profile updated successfully',
      invalidateQueries: [['userProfile']],
    }
  );
};

// ===== USER MANAGEMENT HOOKS =====

/**
 * Hook to get user by ID
 */
export const useUser = (id: string) => {
  const { session } = useAuth();
  return useQueryData<Record<string, unknown>>(
    ['user', id],
    async () => (await getUserById(id)) as Record<string, unknown>,
    {
      enabled: !!id && !!session?.user,
    }
  );
};

/**
 * Hook to update user
 */
export const useUpdateUser = () => {
  return useMutationOperation<{ status: number; data: Record<string, unknown> }, { id: string; data: Record<string, unknown> }>(
    async ({ id, data }) => {
      return { status: 200, data: (await updateUser(id, data)) as Record<string, unknown> };
    },
    {
      toastId: TOAST_IDS.USER.UPDATE,
      loadingMessage: 'Updating user...',
      successMessage: 'User updated successfully',
      invalidateQueries: [['users']],
    }
  );
};

/**
 * Hook to delete user
 */
export const useDeleteUser = () => {
  return useMutationOperation<{ status: number; data: { message: string } }, string>(
    async (id) => {
      return { status: 200, data: { message: String((await deleteUser(id)) ?? 'User deleted successfully') } };
    },
    {
      toastId: TOAST_IDS.USER.DELETE,
      loadingMessage: 'Deleting user...',
      successMessage: 'User deleted successfully',
      invalidateQueries: [['users']],
    }
  );
};

/**
 * Hook to get all users
 */
export const useUsers = () => {
  const { session } = useAuth();
  return useQueryData<Record<string, unknown>[]>(
    ['users'],
    async () => (await getAllUsers()) as Record<string, unknown>[],
    {
      enabled: !!session?.user,
    }
  );
};

// ===== ROLE-BASED USER HOOKS =====

/**
 * Hook to get patients
 */
export const usePatients = () => {
  const { session } = useAuth();
  return useQueryData<Record<string, unknown>[]>(
    ['patients'],
    async () => (await getUsersByRole('PATIENT')) as Record<string, unknown>[],
    {
      enabled: !!session?.user,
    }
  );
};

/**
 * Hook to get doctors
 */
export const useDoctors = () => {
  const { session } = useAuth();
  return useQueryData<Record<string, unknown>[]>(
    ['doctors'],
    async () => (await getUsersByRole('DOCTOR')) as Record<string, unknown>[],
    {
      enabled: !!session?.user,
    }
  );
};

/**
 * Hook to get receptionists
 */
export const useReceptionists = () => {
  const { session } = useAuth();
  return useQueryData<Record<string, unknown>[]>(
    ['receptionists'],
    async () => (await getUsersByRole('RECEPTIONIST')) as Record<string, unknown>[],
    {
      enabled: !!session?.user,
    }
  );
};

/**
 * Hook to get clinic admins
 */
export const useClinicAdmins = () => {
  const { session } = useAuth();
  return useQueryData<Record<string, unknown>[]>(
    ['clinicAdmins'],
    async () => (await getUsersByRole('CLINIC_ADMIN')) as Record<string, unknown>[],
    {
      enabled: !!session?.user,
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
        initials = `${nameParts[0]?.charAt(0) || ''}${nameParts[1]?.charAt(0) || ''}`.toUpperCase();
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
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff&size=128&format=png`;
  };
};

// ===== ENHANCED USER MANAGEMENT HOOKS =====

/**
 * Hook to create a new user
 */
export const useCreateUser = () => {
  return useMutationOperation(
    async (userData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      role: string;
      clinicId?: string;
      gender?: string;
      dateOfBirth?: string;
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
    }) => {
      return await createUser(userData);
    },
    {
      toastId: TOAST_IDS.USER.CREATE,
      loadingMessage: 'Creating user...',
      successMessage: 'User created successfully',
      invalidateQueries: [['users'], ['patients'], ['doctors']],
    }
  );
};

/**
 * Hook to update user role
 */
export const useUpdateUserRole = () => {
  return useMutationOperation(
    async ({
      userId,
      role,
      clinicId,
      locationId,
      permissions,
    }: {
      userId: string;
      role: string;
      clinicId?: string;
      locationId?: string;
      permissions?: string[];
    }) => {
      const updatePayload: {
        clinicId?: string;
        locationId?: string;
        permissions?: string[];
      } = {};
      if (clinicId) updatePayload.clinicId = clinicId;
      if (locationId) updatePayload.locationId = locationId;
      if (permissions) updatePayload.permissions = permissions;

      return (await updateUserRole(userId, role, updatePayload)) as Record<string, unknown>;
    },
    {
      toastId: TOAST_IDS.USER.UPDATE,
      loadingMessage: 'Updating user role...',
      successMessage: 'User role updated successfully',
      invalidateQueries: [['users']],
    }
  );
};

export const useSetProfileComplete = () => {
  return useMutationOperation(
    async (complete: boolean) => {
      await setProfileComplete(complete);
      return { complete };
    },
    {
      toastId: TOAST_IDS.PROFILE.COMPLETE,
      loadingMessage: 'Finalizing profile...',
      successMessage: 'Profile finalized successfully',
      showToast: false,
    }
  );
};

/**
 * Hook to get users by role
 */
export const useUsersByRole = (role: string) => {
  return useQueryData(['users', 'role', role], async () => {
    return (await getUsersByRole(role)) as Record<string, unknown>[];
  }, {
    enabled: !!role,
  });
};

/**
 * Hook to get users by clinic
 */
export const useUsersByClinic = (clinicId: string) => {
  return useQueryData(['users', 'clinic', clinicId], async () => {
    return (await getUsersByClinic(clinicId)) as Record<string, unknown>[];
  }, {
    enabled: !!clinicId,
  });
};

/**
 * Hook to search users
 */
export const useSearchUsers = () => {
  return useMutationOperation(
    async ({ query, filters }: {
      query: string;
      filters?: {
        role?: string;
        clinicId?: string;
        isVerified?: boolean;
      };
    }) => {
      return (await searchUsers(query, filters)) as Record<string, unknown>[];
    },
    {
      toastId: TOAST_IDS.USER.UPDATE,
      loadingMessage: 'Searching users...',
      successMessage: 'Search completed',
      showToast: false,
    }
  );
};

/**
 * Hook to get user statistics
 */
export const useUserStats = () => {
  return useQueryData(['userStats'], async () => {
    return (await getUserStats()) as Record<string, unknown>;
  });
};

/**
 * Hook to bulk update users
 */
export const useBulkUpdateUsers = () => {
  return useMutationOperation(
    async ({ userIds, updates }: {
      userIds: string[];
      updates: Record<string, any>;
    }) => {
      return (await bulkUpdateUsers(userIds, updates)) as Record<string, unknown>;
    },
    {
      toastId: TOAST_IDS.USER.UPDATE,
      loadingMessage: 'Updating users...',
      successMessage: 'Users updated successfully',
      invalidateQueries: [['users']],
    }
  );
};

/**
 * Hook to export users
 */
export const useExportUsers = () => {
  return useMutationOperation(
    async ({ format, filters }: {
      format?: 'csv' | 'excel';
      filters?: Record<string, any>;
    }) => {
      return (await exportUsers(format, filters)) as Record<string, unknown>;
    },
    {
      toastId: TOAST_IDS.ANALYTICS.REPORT_DOWNLOAD,
      loadingMessage: 'Exporting users...',
      successMessage: 'Users exported successfully',
    }
  );
};

/**
 * Hook to change user password
 */
export const useChangeUserPassword = () => {
  return useMutationOperation(
    async ({ userId, newPassword }: {
      userId: string;
      newPassword: string;
    }) => {
      return (await changeUserPassword(userId, newPassword)) as Record<string, unknown>;
    },
    {
      toastId: TOAST_IDS.USER.UPDATE,
      loadingMessage: 'Changing password...',
      successMessage: 'Password changed successfully',
    }
  );
};

/**
 * Hook to toggle user verification
 */
export const useToggleUserVerification = () => {
  return useMutationOperation(
    async ({ userId, isVerified }: {
      userId: string;
      isVerified: boolean;
    }) => {
      return (await toggleUserVerification(userId, isVerified)) as Record<string, unknown>;
    },
    {
      toastId: TOAST_IDS.USER.UPDATE,
      loadingMessage: 'Updating user verification...',
      successMessage: 'User verification updated successfully',
      invalidateQueries: [['users']],
    }
  );
};

/**
 * Hook to get user activity logs
 */
export const useUserActivityLogs = (userId: string, limit: number = 50) => {
  return useQueryData(['userActivityLogs', userId], async () => {
    return (await getUserActivityLogs(userId, limit)) as Record<string, unknown>[];
  }, {
    enabled: !!userId,
  });
};

/**
 * Hook to get user sessions
 */
export const useUserSessions = (userId: string) => {
  return useQueryData(['userSessions', userId], async () => {
    return (await getUserSessions(userId)) as Record<string, unknown>[];
  }, {
    enabled: !!userId,
  });
};

/**
 * Hook to terminate user session
 */
export const useTerminateUserSession = () => {
  return useMutationOperation(
    async ({ userId, sessionId }: {
      userId: string;
      sessionId: string;
    }) => {
      return (await terminateUserSession(userId, sessionId)) as Record<string, unknown>;
    },
    {
      toastId: TOAST_IDS.SESSION.TERMINATE,
      loadingMessage: 'Terminating user session...',
      successMessage: 'User session terminated successfully',
      invalidateQueries: [['userSessions']],
    }
  );
};
