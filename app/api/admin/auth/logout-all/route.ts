/**
 * Admin Auth API - Force Logout All Devices
 * POST /api/admin/auth/logout-all
 * 
 * V1.2: Forces logout from all devices by incrementing token_version
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin } from '@/lib/middleware/authMiddleware';
import { incrementTokenVersion } from '@/lib/utils/tokenRevocation';
import { logActivity } from '@/lib/utils/auditLogger';
import { AdminAction } from '@/types/admin';

export const dynamic = 'force-dynamic';

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
      const userId = req.adminUser._id.toString();

      // Increment token_version to revoke all tokens
      await incrementTokenVersion(userId);

      // Log activity
      await logActivity(
        AdminAction.LOGOUT_ALL_DEVICES,
        userId,
        undefined,
        request
      );

      return NextResponse.json({
        success: true,
        message: 'Đã đăng xuất khỏi tất cả thiết bị. Vui lòng đăng nhập lại',
      });
    } catch (error) {
      console.error('[Logout All] Error:', error);
      return NextResponse.json(
        {
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'Đã xảy ra lỗi khi đăng xuất',
        },
        { status: 500 }
      );
    }
  });
}
