/**
 * Authentication Middleware for API Routes
 * 
 * Provides withAuthAdmin wrapper to protect API routes
 * Checks authentication, token version, active status, and permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getCollections, ObjectId } from '@/lib/db';
import { AdminUser, Permission } from '@/types/admin';
import { hasPermission } from '@/lib/utils/permissions';
import { AdminRole } from '@/types/admin';

/**
 * Request with authenticated admin user attached
 */
export interface AuthenticatedRequest extends NextRequest {
  adminUser?: AdminUser;
}

/**
 * Middleware wrapper for admin API routes
 * 
 * Checks:
 * 1. User is authenticated (has valid session)
 * 2. User exists in database and is active
 * 3. Token version matches (V1.2: token revocation check)
 * 4. User must change password (if required, return 403)
 * 5. User has required permission (if specified)
 * 
 * Usage:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   return withAuthAdmin(request, async (req) => {
 *     // req.adminUser is guaranteed to be available here
 *     return NextResponse.json({ data: ... });
 *   });
 * }
 * ```
 * 
 * With permission check:
 * ```typescript
 * return withAuthAdmin(request, async (req) => {
 *   // handler
 * }, 'product:create');
 * ```
 * 
 * @param request - NextRequest object
 * @param handler - Route handler function
 * @param requiredPermission - Optional required permission
 * @returns NextResponse from handler or error response
 */
export async function withAuthAdmin(
  request: NextRequest,
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  requiredPermission?: Permission
): Promise<NextResponse> {
  try {
    // 1. Check authentication (session)
    const session = await getSession();

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json(
        {
          success: false,
          code: 'AUTH_REQUIRED',
          message: 'Yêu cầu đăng nhập',
        },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const tokenVersion = (session.user as any).tokenVersion ?? 0;

    // 2. Get user from database
    const { adminUsers } = await getCollections();
    const user = await adminUsers.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          code: 'USER_NOT_FOUND',
          message: 'Người dùng không tồn tại',
        },
        { status: 401 }
      );
    }

    // 3. Check if user is active
    if (user.is_active === false) {
      return NextResponse.json(
        {
          success: false,
          code: 'USER_LOCKED',
          message: 'Tài khoản đã bị khóa',
        },
        { status: 403 }
      );
    }

    // 4. V1.2: Check token version (token revocation)
    if (user.token_version !== tokenVersion) {
      return NextResponse.json(
        {
          success: false,
          code: 'TOKEN_REVOKED',
          message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại',
        },
        { status: 401 }
      );
    }

    // 5. Check must_change_password
    // CRITICAL FIX: Allow bypass for change-password and logout routes to prevent deadlock
    const url = new URL(request.url);
    const isChangePasswordRoute = url.pathname === '/api/admin/auth/change-password';
    const isLogoutRoute = url.pathname === '/api/admin/auth/logout';
    
    if (user.must_change_password === true && !isChangePasswordRoute && !isLogoutRoute) {
      return NextResponse.json(
        {
          success: false,
          code: 'MUST_CHANGE_PASSWORD',
          message: 'Vui lòng đổi mật khẩu trước khi tiếp tục',
        },
        { status: 403 }
      );
    }

    // 6. Check permission (if required)
    if (requiredPermission) {
      const hasPerm = hasPermission(
        user.role,
        user.permissions,
        requiredPermission
      );

      if (!hasPerm) {
        return NextResponse.json(
          {
            success: false,
            code: 'PERMISSION_DENIED',
            message: 'Bạn không có quyền thực hiện hành động này',
          },
          { status: 403 }
        );
      }
    }

    // 7. Attach adminUser to request and call handler
    (request as AuthenticatedRequest).adminUser = user as AdminUser;
    return await handler(request as AuthenticatedRequest);
  } catch (error) {
    console.error('[authMiddleware] Error:', error);
    return NextResponse.json(
      {
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Đã xảy ra lỗi. Vui lòng thử lại',
      },
      { status: 500 }
    );
  }
}

/**
 * Check if user is SUPER_ADMIN
 * Helper function for routes that require SUPER_ADMIN only
 */
export function requireSuperAdmin(user: AdminUser): boolean {
  return user.role === AdminRole.SUPER_ADMIN;
}
