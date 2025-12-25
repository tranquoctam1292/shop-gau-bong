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
import { checkRateLimit } from '@/lib/utils/rateLimiter';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/authOptions';
import { extractCsrfTokenFromHeaders, hashCsrfToken, validateOrigin, getAllowedOrigins } from '@/lib/utils/csrf';
import { verifyCsrfTokenForUser } from '@/lib/utils/csrfTokenCache';

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
 * 4. Rate limit (prevent DoS and brute force - GET: 60/min, Others: 20/min)
 * 5. User must change password (if required, return 403)
 * 6. User has required permission (if specified)
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
    // Pass request to getSession so it can read cookies from the request using getToken
    const session = await getSession(request);

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

    // 5. Check Rate Limit (prevent DoS and brute force attacks)
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method.toUpperCase();

    // PHASE 3: Rate Limiting Granularity (7.12.9) - Get granular rate limit config
    const { getRateLimitConfig, checkRateLimitWithBurst } = await import('@/lib/utils/rateLimiter');
    const rateLimitConfig = getRateLimitConfig(pathname, method, user.role);
    
    const rateLimitKey = `admin_limit:${userId}:${method}:${pathname}`;
    const withinLimit = await checkRateLimitWithBurst(rateLimitKey, rateLimitConfig);

    if (!withinLimit) {
      return NextResponse.json(
        {
          success: false,
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút',
        },
        { status: 429 }
      );
    }

    // 6. Check must_change_password
    // CRITICAL FIX: Allow bypass for change-password and logout routes to prevent deadlock
    const isChangePasswordRoute = pathname === '/api/admin/auth/change-password';
    const isLogoutRoute = pathname === '/api/admin/auth/logout';

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

    // 7. Check permission (if required)
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

    // 8. PHASE 1: CSRF Protection (7.12.2) - Validate CSRF token for state-changing requests
    const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (stateChangingMethods.includes(method)) {
      // Skip CSRF validation for certain endpoints (e.g., login, logout, change-password)
      // These endpoints handle authentication and don't need CSRF protection
      const skipCsrfRoutes = [
        '/api/admin/auth/login',
        '/api/admin/auth/logout',
        '/api/admin/auth/csrf-token',
        '/api/admin/auth/change-password',
      ];
      
      const shouldSkipCsrf = skipCsrfRoutes.some(route => pathname === route);
      
      if (!shouldSkipCsrf) {
        // Validate Origin header
        const origin = request.headers.get('Origin');
        const allowedOrigins = getAllowedOrigins();
        const requestUrl = request.url;
        
        // Allow same-origin requests (origin matches request URL's origin)
        // This handles cases where browser sends Origin header even for same-origin requests
        if (!validateOrigin(origin, allowedOrigins, requestUrl)) {
          // Only reject if origin is explicitly provided and doesn't match
          // If no origin header, it's safe (same-origin requests sometimes don't send Origin)
          if (origin) {
            return NextResponse.json(
              {
                success: false,
                code: 'CSRF_ORIGIN_INVALID',
                message: 'Yêu cầu không hợp lệ',
              },
              { status: 403 }
            );
          }
        }

        // Extract and validate CSRF token
        const csrfToken = extractCsrfTokenFromHeaders(request.headers);
        if (!csrfToken) {
          return NextResponse.json(
            {
              success: false,
              code: 'CSRF_TOKEN_MISSING',
              message: 'CSRF token không được tìm thấy',
            },
            { status: 403 }
          );
        }

        // Verify CSRF token using cache
        const secret = authOptions.secret;
        if (!secret) {
          return NextResponse.json(
            {
              success: false,
              code: 'INTERNAL_ERROR',
              message: 'Server configuration error',
            },
            { status: 500 }
          );
        }
        
        // CRITICAL FIX: Ensure userId is string for CSRF token verification
        // userId from session is already string, but ensure type safety
        const userIdString = String(userId);
        
        // Log for debugging (development only)
        if (process.env.NODE_ENV === 'development') {
          console.log('[CSRF Validation] Verifying token for userId:', userIdString);
          console.log('[CSRF Validation] Token length:', csrfToken?.length || 0);
        }
        
        const isValid = await verifyCsrfTokenForUser(userIdString, csrfToken, secret, hashCsrfToken);
        if (!isValid) {
          // Log error for debugging (only in development)
          if (process.env.NODE_ENV === 'development') {
            console.error('[CSRF Validation Failed]', {
              userId: userIdString,
              tokenLength: csrfToken?.length || 0,
              pathname,
              origin: request.headers.get('Origin'),
            });
          }
          return NextResponse.json(
            {
              success: false,
              code: 'CSRF_TOKEN_INVALID',
              message: 'CSRF token không hợp lệ. Vui lòng tải lại trang',
            },
            { status: 403 }
          );
        }
        
        // Log success (development only)
        if (process.env.NODE_ENV === 'development') {
          console.log('[CSRF Validation] Token verified successfully for userId:', userIdString);
        }
      }
    }

    // 9. Attach adminUser to request and call handler
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
