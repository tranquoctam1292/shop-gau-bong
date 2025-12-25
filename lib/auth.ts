/**
 * Auth utilities
 * 
 * Updated for RBAC system with admin_users collection
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getCollections, ObjectId } from '@/lib/db';
import { AdminUser, AdminRole } from '@/types/admin';
import { verifyTokenVersion } from '@/lib/utils/tokenRevocation';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Get current session (server-side)
 * In Next.js 14 App Router API routes, we need to pass request to read cookies
 */
export async function getSession(request?: NextRequest) {
  try {
    // In API routes (when request is provided), use getToken to read JWT from cookies
    if (request) {
      const token = await getToken({ 
        req: request as any,
        secret: authOptions.secret,
      });
      
      if (!token) {
        return null;
      }
      
      // Convert token to session-like object
      const expires = token.exp && typeof token.exp === 'number' 
        ? new Date(token.exp * 1000).toISOString() 
        : undefined;
      
      return {
        user: {
          id: token.id,
          role: token.role,
          permissions: token.permissions || [],
          tokenVersion: token.tokenVersion || 0,
        },
        expires,
      } as any;
    }
    
    // In Server Components, getServerSession can work without request
    return await getServerSession(authOptions);
  } catch (error) {
    console.error('[getSession] Error getting session:', error);
    return null;
  }
}

/**
 * Check if user is authenticated and is admin (legacy - use withAuthAdmin middleware instead)
 * @deprecated Use withAuthAdmin middleware from lib/middleware/authMiddleware instead
 */
export async function requireAdmin() {
  const session = await getSession();
  
  if (!session || (session.user as any)?.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  
  return session;
}

/**
 * Get admin user from session
 * 
 * @returns AdminUser object or null if not authenticated/not found
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const session = await getSession();
    
    if (!session || !session.user || !(session.user as any).id) {
      return null;
    }

    const userId = (session.user as any).id;
    const { adminUsers } = await getCollections();
    
    const user = await adminUsers.findOne({ _id: new ObjectId(userId) });
    
    if (!user || !user.is_active) {
      return null;
    }

    // V1.2: Check token version
    const tokenVersion = (session.user as any).tokenVersion ?? 0;
    if (user.token_version !== tokenVersion) {
      return null; // Token revoked
    }

    return user as AdminUser;
  } catch (error) {
    console.error('[getAdminUser] Error:', error);
    return null;
  }
}

/**
 * Require admin user with optional permission check
 * 
 * @param permission - Optional required permission
 * @returns AdminUser object
 * @throws Error if not authenticated or missing permission
 */
export async function requireAdminWithPermission(
  permission?: string
): Promise<AdminUser> {
  const user = await getAdminUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Check must_change_password
  if (user.must_change_password) {
    throw new Error('MUST_CHANGE_PASSWORD');
  }

  // Check permission if required
  if (permission) {
    const { hasPermission } = await import('@/lib/utils/permissions');
    const hasPerm = hasPermission(
      user.role,
      user.permissions,
      permission as any
    );

    if (!hasPerm) {
      throw new Error('PERMISSION_DENIED');
    }
  }

  return user;
}

