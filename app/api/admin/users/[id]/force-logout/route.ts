/**
 * Admin Users API Route - Force Logout User
 * POST /api/admin/users/[id]/force-logout
 * 
 * V1.2: Force logout a specific user by incrementing their token_version
 * Requires: SUPER_ADMIN permission
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, requireSuperAdmin } from '@/lib/middleware/authMiddleware';
import { getCollections, ObjectId } from '@/lib/db';
import { incrementTokenVersion } from '@/lib/utils/tokenRevocation';
import { logActivity } from '@/lib/utils/auditLogger';
import { AdminAction } from '@/types/admin';

export const dynamic = 'force-dynamic';

export async function POST(
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
          message: 'Chỉ quản trị viên cấp cao mới có quyền thực hiện hành động này',
        },
        { status: 403 }
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

      // Increment token_version to force logout
      await incrementTokenVersion(id);

      // Log activity
      await logActivity(
        AdminAction.FORCE_LOGOUT_USER,
        req.adminUser._id.toString(),
        {
          target_collection: 'admin_users',
          target_id: id,
          metadata: {
            target_username: user.username,
          },
        },
        request
      );

      return NextResponse.json({
        success: true,
        message: `Đã đăng xuất người dùng ${user.username} khỏi tất cả thiết bị`,
      });
    } catch (error) {
      console.error('[Force Logout] Error:', error);
      return NextResponse.json(
        {
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'Đã xảy ra lỗi khi đăng xuất người dùng',
        },
        { status: 500 }
      );
    }
  }, 'admin:manage');
}
