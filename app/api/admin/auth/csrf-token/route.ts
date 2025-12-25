/**
 * CSRF Token API
 * GET /api/admin/auth/csrf-token
 * 
 * Returns CSRF token for authenticated users
 * Token is stored in JWT and retrieved from session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/authOptions';
import { generateCsrfToken, hashCsrfToken } from '@/lib/utils/csrf';
import { storeCsrfToken } from '@/lib/utils/csrfTokenCache';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/auth/csrf-token
 * 
 * Returns CSRF token for the authenticated user
 * 
 * Strategy:
 * - Generate new CSRF token
 * - Store token hash in in-memory cache (keyed by user ID)
 * - Return plain token to client
 * - Client caches token and sends it in X-CSRF-Token header
 * - Server validates by hashing client token and comparing with cache
 */
export async function GET(request: NextRequest) {
  try {
    // Get JWT token from request
    const token = await getToken({
      req: request as any,
      secret: authOptions.secret,
    });

    if (!token || !token.id) {
      return NextResponse.json(
        {
          success: false,
          code: 'AUTH_REQUIRED',
          message: 'Yêu cầu đăng nhập',
        },
        { status: 401 }
      );
    }

    const userId = String(token.id); // Ensure userId is string
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

    // Generate new CSRF token
    const csrfToken = generateCsrfToken();
    const csrfTokenHash = hashCsrfToken(csrfToken, secret);

    // Store hash in cache for validation (hybrid: in-memory + MongoDB)
    await storeCsrfToken(userId, csrfToken, csrfTokenHash);
    
    // PERFORMANCE OPTIMIZATION (1.1.0): Return expiresAt timestamp (24h from now)
    const CSRF_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
    const expiresAt = Date.now() + CSRF_TOKEN_TTL_MS;
    
    // Log for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('[CSRF Token API] Generated token for userId:', userId);
    }

    return NextResponse.json({
      success: true,
      data: {
        csrfToken,
        expiresAt, // PERFORMANCE OPTIMIZATION (1.1.0): Return expiry timestamp for client-side TTL check
      },
    });
  } catch (error) {
    console.error('[CSRF Token API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Đã xảy ra lỗi khi tạo CSRF token',
      },
      { status: 500 }
    );
  }
}

