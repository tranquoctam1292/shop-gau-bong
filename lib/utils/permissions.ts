/**
 * Permission Check Utilities
 * 
 * Provides functions to check if a user has required permissions
 * Supports both role-based and custom permissions
 */

import { AdminRole, Permission } from '@/types/admin';
import { getRolePermissions, roleHasPermission } from '@/lib/constants/adminRoles';

/**
 * Check if user has a specific permission
 * 
 * Checks in order:
 * 1. Custom permissions (if provided)
 * 2. Role permissions
 * 3. SUPER_ADMIN always has all permissions (*)
 * 
 * @param userRole - User's role
 * @param userPermissions - User's custom permissions (optional, override role)
 * @param requiredPermission - Required permission to check
 * @returns true if user has permission
 */
export function hasPermission(
  userRole: AdminRole,
  userPermissions: Permission[] | undefined,
  requiredPermission: Permission
): boolean {
  // SUPER_ADMIN với '*' có tất cả quyền
  if (userRole === AdminRole.SUPER_ADMIN) {
    return true;
  }

  // Check custom permissions first (override role)
  if (userPermissions && userPermissions.length > 0) {
    // If custom permissions include '*', user has all permissions
    if (userPermissions.includes('*')) {
      return true;
    }
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }
  }

  // Check role permissions
  return roleHasPermission(userRole, requiredPermission);
}

/**
 * Check if user has any of the required permissions
 * 
 * @param userRole - User's role
 * @param userPermissions - User's custom permissions (optional)
 * @param requiredPermissions - Array of required permissions (any match is sufficient)
 * @returns true if user has at least one of the required permissions
 */
export function hasAnyPermission(
  userRole: AdminRole,
  userPermissions: Permission[] | undefined,
  requiredPermissions: Permission[]
): boolean {
  // SUPER_ADMIN với '*' có tất cả quyền
  if (userRole === AdminRole.SUPER_ADMIN) {
    return true;
  }

  // Check if user has any of the required permissions
  return requiredPermissions.some((perm) =>
    hasPermission(userRole, userPermissions, perm)
  );
}

/**
 * Check if user has all of the required permissions
 * 
 * @param userRole - User's role
 * @param userPermissions - User's custom permissions (optional)
 * @param requiredPermissions - Array of required permissions (all must match)
 * @returns true if user has all required permissions
 */
export function hasAllPermissions(
  userRole: AdminRole,
  userPermissions: Permission[] | undefined,
  requiredPermissions: Permission[]
): boolean {
  // SUPER_ADMIN với '*' có tất cả quyền
  if (userRole === AdminRole.SUPER_ADMIN) {
    return true;
  }

  // Check if user has all of the required permissions
  return requiredPermissions.every((perm) =>
    hasPermission(userRole, userPermissions, perm)
  );
}

/**
 * Check if user can access a resource with a specific action
 * 
 * Converts resource:action format to Permission format
 * Example: canAccessResource(role, perms, 'product', 'create') 
 *          checks for 'product:create' permission
 * 
 * @param userRole - User's role
 * @param userPermissions - User's custom permissions (optional)
 * @param resource - Resource name (e.g., 'product', 'order')
 * @param action - Action name (e.g., 'create', 'read', 'update', 'delete')
 * @returns true if user has permission for the resource:action
 */
export function canAccessResource(
  userRole: AdminRole,
  userPermissions: Permission[] | undefined,
  resource: string,
  action: string
): boolean {
  // SUPER_ADMIN với '*' có tất cả quyền
  if (userRole === AdminRole.SUPER_ADMIN) {
    return true;
  }

  // Build permission string (resource:action)
  const permission = `${resource}:${action}` as Permission;

  // Check permission
  return hasPermission(userRole, userPermissions, permission);
}

/**
 * Get all permissions for a user (role + custom)
 * 
 * @param userRole - User's role
 * @param userPermissions - User's custom permissions (optional)
 * @returns Array of all permissions the user has
 */
export function getUserPermissions(
  userRole: AdminRole,
  userPermissions?: Permission[]
): Permission[] {
  // Get role permissions
  const rolePerms = getRolePermissions(userRole);

  // If user has custom permissions, merge them
  if (userPermissions && userPermissions.length > 0) {
    const allPerms = new Set<Permission>([...rolePerms, ...userPermissions]);
    return Array.from(allPerms);
  }

  return rolePerms;
}
