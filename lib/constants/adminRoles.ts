/**
 * Admin Roles and Permissions Constants
 * 
 * Defines roles and their associated permissions for RBAC system
 */

import { AdminRole, Permission } from '@/types/admin';

/**
 * Role display names (Vietnamese)
 */
export const ROLE_DISPLAY_NAMES: Record<AdminRole, string> = {
  [AdminRole.SUPER_ADMIN]: 'Quản trị cấp cao',
  [AdminRole.PRODUCT_MANAGER]: 'Quản lý sản phẩm',
  [AdminRole.ORDER_MANAGER]: 'Quản lý đơn hàng',
  [AdminRole.CONTENT_EDITOR]: 'Biên tập nội dung',
  [AdminRole.VIEWER]: 'Người xem',
};

/**
 * Permissions mapping for each role
 * SUPER_ADMIN has '*' (all permissions)
 */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  [AdminRole.SUPER_ADMIN]: ['*'], // All permissions
  [AdminRole.PRODUCT_MANAGER]: [
    'product:create',
    'product:read',
    'product:update',
    'product:delete',
    'category:read',
    'category:manage',
  ],
  [AdminRole.ORDER_MANAGER]: [
    'order:read',
    'order:update',
    'customer:read',
  ],
  [AdminRole.CONTENT_EDITOR]: [
    'blog:read',
    'blog:manage',
    'page:manage',
    'media:read',
    'media:upload',
  ],
  [AdminRole.VIEWER]: [
    // Read-only permissions
    'product:read',
    'category:read',
    'order:read',
    'customer:read',
    'blog:read',
    'media:read',
  ],
};

/**
 * Get permissions for a specific role
 * 
 * @param role - Admin role
 * @returns Array of permissions for the role
 */
export function getRolePermissions(role: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role has a specific permission
 * 
 * @param role - Admin role
 * @param permission - Permission to check
 * @returns true if role has permission (including SUPER_ADMIN with '*')
 */
export function roleHasPermission(role: AdminRole, permission: Permission): boolean {
  const rolePerms = getRolePermissions(role);
  
  // SUPER_ADMIN với '*' có tất cả quyền
  if (rolePerms.includes('*')) {
    return true;
  }
  
  return rolePerms.includes(permission);
}

/**
 * Get all available permissions (for UI dropdowns, etc.)
 */
export function getAllPermissions(): Permission[] {
  const allPerms = new Set<Permission>();
  
  Object.values(ROLE_PERMISSIONS).forEach((perms) => {
    perms.forEach((perm) => {
      if (perm !== '*') {
        allPerms.add(perm);
      }
    });
  });
  
  return Array.from(allPerms).sort();
}

/**
 * Check if permission is valid
 */
export function isValidPermission(permission: string): permission is Permission {
  const allPerms = getAllPermissions();
  return permission === '*' || allPerms.includes(permission as Permission);
}
