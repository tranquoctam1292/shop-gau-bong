/**
 * Admin Auth API - Logout
 * POST /api/admin/auth/logout
 * 
 * Logs out current user and logs activity
 * Note: Actual session clearing is handled by NextAuth client-side
 * This endpoint is for audit logging only
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin } from '@/lib/middleware/authMiddleware';
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
      // Log logout activity
      await logActivity(
        AdminAction.LOGOUT,
        req.adminUser._id.toString(),
        undefined,
        request
      );

      // Note: Actual session clearing must be done client-side with signOut() from next-auth/react
      return NextResponse.json({
        success: true,
        message: 'Đăng xuất thành công',
      });
    } catch (error) {
      console.error('[Auth Logout] Error:', error);
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
