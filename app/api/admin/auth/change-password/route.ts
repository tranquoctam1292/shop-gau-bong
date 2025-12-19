/**
 * Admin Auth API - Change Password
 * POST /api/admin/auth/change-password
 * 
 * Changes password for current authenticated user
 * V1.2: Increments token_version to force logout all devices
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin } from '@/lib/middleware/authMiddleware';
import { getCollections, ObjectId } from '@/lib/db';
import { comparePassword, hashPassword, validatePasswordStrength } from '@/lib/utils/passwordUtils';
import { incrementTokenVersion } from '@/lib/utils/tokenRevocation';
import { logActivity } from '@/lib/utils/auditLogger';
import { checkRateLimit } from '@/lib/utils/rateLimiter';
import { AdminAction } from '@/types/admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mật khẩu hiện tại không được để trống'),
  newPassword: z.string().min(1, 'Mật khẩu mới không được để trống'),
});

export async function POST(request: NextRequest) {
  return withAuthAdmin(request, async (req) => {
    if (!req.adminUser) {
      return NextResponse.json(
        {
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    try {
      // V1.3: Rate limit for password changes - 5 attempts per hour
      const rateLimitKey = `admin_sensitive:change_password:${req.adminUser._id}`;
      const withinLimit = await checkRateLimit(rateLimitKey, 5, 60 * 60 * 1000); // 5 attempts per hour

      if (!withinLimit) {
        return NextResponse.json(
          {
            success: false,
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Quá nhiều lần thay đổi mật khẩu. Vui lòng thử lại sau 1 giờ',
          },
          { status: 429 }
        );
      }

      const body = await request.json();

      // Validate input
      const validation = changePasswordSchema.safeParse(body);
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

      const { currentPassword, newPassword } = validation.data;

      // Validate new password strength
      const strengthCheck = validatePasswordStrength(newPassword);
      if (!strengthCheck.valid) {
        return NextResponse.json(
          {
            success: false,
            code: 'WEAK_PASSWORD',
            message: 'Mật khẩu không đủ mạnh',
            errors: strengthCheck.errors,
          },
          { status: 400 }
        );
      }

      // Get user from database to verify current password
      const { adminUsers } = await getCollections();
      const user = await adminUsers.findOne({
        _id: new ObjectId(req.adminUser._id),
      });

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            code: 'USER_NOT_FOUND',
            message: 'Người dùng không tồn tại',
          },
          { status: 404 }
        );
      }

      // Verify current password
      const isValidPassword = await comparePassword(
        currentPassword,
        user.password_hash
      );

      if (!isValidPassword) {
        return NextResponse.json(
          {
            success: false,
            code: 'INVALID_PASSWORD',
            message: 'Mật khẩu hiện tại không đúng',
          },
          { status: 400 }
        );
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // V1.2: Increment token_version to force logout all devices
      await incrementTokenVersion(user._id.toString());

      // Update password and reset must_change_password flag
      await adminUsers.updateOne(
        { _id: user._id },
        {
          $set: {
            password_hash: newPasswordHash,
            must_change_password: false,
            updatedAt: new Date(),
          },
        }
      );

      // Log activity
      await logActivity(
        AdminAction.CHANGE_PASSWORD,
        user._id.toString(),
        undefined,
        request
      );

      return NextResponse.json({
        success: true,
        message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại',
      });
    } catch (error) {
      console.error('[Change Password] Error:', error);
      return NextResponse.json(
        {
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'Đã xảy ra lỗi khi đổi mật khẩu',
        },
        { status: 500 }
      );
    }
  });
}
