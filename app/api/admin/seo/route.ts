/**
 * SEO Dashboard API
 *
 * GET /api/admin/seo - Get SEO dashboard statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getDashboardStats } from '@/lib/services/seoService';
import { AdminRole } from '@/types/admin';

export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Ensure adminUser is defined
      if (!req.adminUser) {
        return NextResponse.json(
          { error: 'Không được phép truy cập' },
          { status: 401 }
        );
      }

      // RBAC: Only SUPER_ADMIN and CONTENT_EDITOR can access SEO
      const allowedRoles = [AdminRole.SUPER_ADMIN, AdminRole.CONTENT_EDITOR];
      if (!allowedRoles.includes(req.adminUser.role as AdminRole)) {
        return NextResponse.json(
          { error: 'Không có quyền truy cập module SEO' },
          { status: 403 }
        );
      }

      const stats = await getDashboardStats();

      return NextResponse.json(stats);
    } catch (error) {
      console.error('[SEO Dashboard API] Error:', error);
      return NextResponse.json(
        { error: 'Lỗi khi lấy thống kê SEO' },
        { status: 500 }
      );
    }
  });
}
