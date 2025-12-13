/**
 * Permission Guard Component
 * 
 * Conditionally renders children based on user permissions
 * Only SUPER_ADMIN can manage other admins
 */

'use client';

'use client';

import { useSession } from 'next-auth/react';
import { AdminRole, Permission } from '@/types/admin';
import { hasPermission } from '@/lib/utils/permissions';

interface PermissionGuardProps {
  permission?: Permission;
  role?: AdminRole;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Permission Guard Component
 * 
 * Renders children only if user has required permission or role
 * 
 * @param permission - Required permission (e.g., 'admin:manage')
 * @param role - Required role (e.g., AdminRole.SUPER_ADMIN)
 * @param fallback - Optional fallback component to render if permission denied
 * @param children - Content to render if permission granted
 */
export function PermissionGuard({
  permission,
  role,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { data: session } = useSession();

  if (!session?.user) {
    return <>{fallback}</>;
  }

  const userRole = (session.user as any).role as AdminRole | undefined;
  const userPermissions = (session.user as any).permissions as Permission[] | undefined;

  if (!userRole) {
    return <>{fallback}</>;
  }

  // Check role requirement
  if (role && userRole !== role) {
    return <>{fallback}</>;
  }

  // Check permission requirement
  if (permission && !hasPermission(userRole, userPermissions, permission)) {
    return <>{fallback}</>;
  }

  // Permission granted
  return <>{children}</>;
}
