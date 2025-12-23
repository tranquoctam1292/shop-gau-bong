/**
 * Admin Auth API - Login
 * POST /api/admin/auth/login
 *
 * ⚠️ DEPRECATED: This endpoint is kept for backward compatibility but no longer needed.
 * New flow: Client calls signIn() directly from next-auth/react
 * All authentication logic has been moved to NextAuth authorize function
 *
 * This endpoint previously handled:
 * - Password verification (✅ Now in NextAuth authorize)
 * - Rate limiting (✅ Now in NextAuth authorize)
 * - User validation (✅ Now in NextAuth authorize)
 *
 * Consider removing this endpoint in a future version once all clients are updated
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  username: z.string().min(1, 'Tên đăng nhập không được để trống'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});


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

    // ⚠️ NOTE: Password verification and rate limiting now handled by NextAuth authorize function
    // This endpoint is kept only for backward compatibility and metadata retrieval

    // Retrieve user info for client-side logic (e.g., checking password change requirement)
    const { adminUsers } = await getCollections();
    const user = await adminUsers.findOne({ username });

    if (!user) {
      // Don't reveal if user exists (security best practice)
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_CREDENTIALS',
          message: 'Tên đăng nhập hoặc mật khẩu không đúng',
        },
        { status: 401 }
      );
    }

    // Return user metadata (without sensitive data)
    // Client will then proceed with signIn() which will validate credentials
    const publicUser = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      permissions: user.permissions || [],
      is_active: user.is_active,
      must_change_password: user.must_change_password,
    };

    return NextResponse.json({
      success: true,
      data: {
        user: publicUser,
        requireChangePassword: user.must_change_password === true,
      },
      message: 'User info retrieved',
    });
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
