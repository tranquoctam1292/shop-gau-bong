/**
 * Admin Users API Route - Reset Password
 * PUT /api/admin/users/[id]/reset-password
 * 
 * Reset password for a user (SUPER_ADMIN only)
 * V1.2: Increments token_version to force logout user
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, requireSuperAdmin } from '@/lib/middleware/authMiddleware';
import { getCollections, ObjectId } from '@/lib/db';
import { hashPassword, validatePasswordStrength } from '@/lib/utils/passwordUtils';
import { incrementTokenVersion } from '@/lib/utils/tokenRevocation';
import { logActivity } from '@/lib/utils/auditLogger';
import { checkRateLimit } from '@/lib/utils/rateLimiter';
import { AdminAction } from '@/types/admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const resetPasswordSchema = z.object({
  new_password: z.string().min(1, 'Mật khẩu mới không được để trống'),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check SUPER_ADMIN permission
    if (!requireSuperAdmin(req.adminUser)) {
      return NextResponse.json(
        {
          success: false,
          code: 'PERMISSION_DENIED',
          message: 'Chỉ quản trị viên cấp cao mới có quyền reset mật khẩu',
        },
        { status: 403 }
      );
    }

    // V1.3: Rate limit for sensitive operation - 3 attempts per 15 minutes
    const rateLimitKey = `admin_sensitive:reset_password:${req.adminUser._id}`;
    const withinLimit = await checkRateLimit(rateLimitKey, 3, 15 * 60 * 1000); // 3 attempts per 15 minutes

    if (!withinLimit) {
      return NextResponse.json(
        {
          success: false,
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Quá nhiều lần reset mật khẩu. Vui lòng thử lại sau 15 phút',
        },
        { status: 429 }
      );
    }

    try {
      const { id } = params;
      
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          {
            success: false,
            code: 'INVALID_ID',
            message: 'ID không hợp lệ',
          },
          { status: 400 }
        );
      }

      const body = await request.json();
      const validation = resetPasswordSchema.safeParse(body);

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

      const { new_password } = validation.data;

      // Validate password strength
      const strengthCheck = validatePasswordStrength(new_password);
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

      const { adminUsers } = await getCollections();
      const userId = new ObjectId(id);

      // Check if user exists
      const user = await adminUsers.findOne({ _id: userId });
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

      // Hash new password
      const passwordHash = await hashPassword(new_password);

      // V1.2: Increment token_version to force logout user
      await incrementTokenVersion(id);

      // Update password and set must_change_password = true
      await adminUsers.updateOne(
        { _id: userId },
        {
          $set: {
            password_hash: passwordHash,
            must_change_password: true,
            updatedAt: new Date(),
          },
        }
      );

      // Log activity
      await logActivity(
        AdminAction.RESET_PASSWORD,
        req.adminUser._id.toString(),
        {
          target_collection: 'admin_users',
          target_id: id,
        },
        request
      );

      return NextResponse.json({
        success: true,
        message: 'Đã reset mật khẩu thành công. Người dùng sẽ phải đổi mật khẩu khi đăng nhập',
      });
    } catch (error) {
      console.error('[Reset Password] Error:', error);
      return NextResponse.json(
        {
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'Đã xảy ra lỗi khi reset mật khẩu',
        },
        { status: 500 }
      );
    }
  }, 'admin:manage');
}
