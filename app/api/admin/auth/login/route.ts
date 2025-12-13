/**
 * Admin Auth API - Login
 * POST /api/admin/auth/login
 * 
 * Custom login endpoint with rate limiting and audit logging
 * Note: NextAuth handles actual authentication, this endpoint provides
 * additional features like rate limiting and activity logging
 * 
 * Rate Limit: 5 attempts per 15 minutes per IP:username
 */

import { NextRequest, NextResponse } from 'next/server';
import { signIn } from 'next-auth/react';
import { getCollections, ObjectId } from '@/lib/db';
import { comparePassword } from '@/lib/utils/passwordUtils';
import { checkRateLimit, getLoginRateLimitKey, resetRateLimit } from '@/lib/utils/rateLimiter';
import { logActivity } from '@/lib/utils/auditLogger';
import { AdminAction } from '@/types/admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  username: z.string().min(1, 'Tên đăng nhập không được để trống'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          code: 'VALIDATION_ERROR',
          message: validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ',
        },
        { status: 400 }
      );
    }

    const { username, password } = validation.data;
    const clientIP = getClientIP(request);

    // Rate limiting check (MongoDB-based for serverless compatibility)
    const rateLimitKey = getLoginRateLimitKey(clientIP, username);
    const isWithinLimit = await checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000); // 5 attempts / 15 min

    if (!isWithinLimit) {
      return NextResponse.json(
        {
          success: false,
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau 15 phút',
        },
        { status: 429 }
      );
    }

    // Authenticate user
    const { adminUsers } = await getCollections();
    const user = await adminUsers.findOne({ username });

    if (!user) {
      // Don't reveal if user exists (security best practice)
      // Rate limit still applies
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_CREDENTIALS',
          message: 'Tên đăng nhập hoặc mật khẩu không đúng',
        },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        {
          success: false,
          code: 'ACCOUNT_LOCKED',
          message: 'Tài khoản đã bị khóa',
        },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_CREDENTIALS',
          message: 'Tên đăng nhập hoặc mật khẩu không đúng',
        },
        { status: 401 }
      );
    }

    // Reset rate limit on successful login
    await resetRateLimit(rateLimitKey);

    // Update last_login
    await adminUsers.updateOne(
      { _id: user._id },
      { $set: { last_login: new Date() } }
    );

    // Log login activity
    await logActivity(
      AdminAction.LOGIN,
      user._id.toString(),
      undefined,
      request
    );

    // Return user info (without sensitive data)
    const publicUser = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      permissions: user.permissions || [],
      is_active: user.is_active,
      must_change_password: user.must_change_password,
      last_login: user.last_login,
    };

    return NextResponse.json({
      success: true,
      data: {
        user: publicUser,
        requireChangePassword: user.must_change_password === true,
      },
      message: 'Đăng nhập thành công',
    });

    // Note: Actual session creation is handled by NextAuth
    // Client should call signIn() from next-auth/react with these credentials
  } catch (error) {
    console.error('[Auth Login] Error:', error);
    return NextResponse.json(
      {
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Đã xảy ra lỗi khi đăng nhập',
      },
      { status: 500 }
    );
  }
}
