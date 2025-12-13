/**
 * React Query hooks for Admin Users
 * 
 * Hooks for fetching and managing admin users
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminUserPublic, AdminRole } from '@/types/admin';

interface AdminUsersResponse {
  success: boolean;
  data: {
    users: AdminUserPublic[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface AdminUserResponse {
  success: boolean;
  data: AdminUserPublic;
}

interface AdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: AdminRole;
  is_active?: boolean;
}

/**
 * Fetch admin users list
 */
async function fetchAdminUsers(params: AdminUsersParams = {}): Promise<AdminUsersResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.role) searchParams.set('role', params.role);
  if (params.is_active !== undefined) searchParams.set('is_active', params.is_active.toString());

  const response = await fetch(`/api/admin/users?${searchParams.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch users');
  }

  return response.json();
}

/**
 * Fetch single admin user
 */
async function fetchAdminUser(userId: string): Promise<AdminUserResponse> {
  const response = await fetch(`/api/admin/users/${userId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch user');
  }

  return response.json();
}

/**
 * Hook to fetch admin users list
 */
export function useAdminUsers(params: AdminUsersParams = {}) {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => fetchAdminUsers(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch single admin user
 */
export function useAdminUser(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => fetchAdminUser(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get current user info
 */
export function useCurrentAdminUser() {
  return useQuery({
    queryKey: ['current-admin-user'],
    queryFn: async () => {
      const response = await fetch('/api/admin/auth/me', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch current user');
      }

      const data = await response.json();
      return data.data as AdminUserPublic;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create admin user
 */
export function useCreateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: {
      username: string;
      email: string;
      password: string;
      full_name: string;
      role: AdminRole;
      permissions?: string[];
      is_active?: boolean;
    }) => {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

/**
 * Hook to update admin user
 */
export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<AdminUserPublic> }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user', variables.userId] });
    },
  });
}

/**
 * Hook to delete admin user (soft delete)
 */
export function useDeleteAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}
