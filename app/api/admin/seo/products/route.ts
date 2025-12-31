/**
 * Products SEO API
 *
 * GET /api/admin/seo/products - Get products with SEO data for bulk editor
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { listProductsSEO } from '@/lib/services/seoService';
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

      const { searchParams } = new URL(request.url);

      const page = parseInt(searchParams.get('page') || '1', 10);
      const perPage = parseInt(searchParams.get('per_page') || '20', 10);
      const search = searchParams.get('search') || undefined;
      const scoreMin = searchParams.get('score_min')
        ? parseInt(searchParams.get('score_min')!, 10)
        : undefined;
      const scoreMax = searchParams.get('score_max')
        ? parseInt(searchParams.get('score_max')!, 10)
        : undefined;
      const hasIssues = searchParams.get('has_issues') === 'true'
        ? true
        : searchParams.get('has_issues') === 'false'
        ? false
        : undefined;
      const sortBy = (searchParams.get('sort_by') as 'score' | 'name' | 'updatedAt') || 'updatedAt';
      const sortOrder = (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc';

      const result = await listProductsSEO({
        page,
        perPage,
        search,
        scoreMin,
        scoreMax,
        hasIssues,
        sortBy,
        sortOrder,
      });

      return NextResponse.json(result);
    } catch (error) {
      console.error('[Products SEO API] Error:', error);
      return NextResponse.json(
        { error: 'Lỗi khi lấy danh sách SEO sản phẩm' },
        { status: 500 }
      );
    }
  });
}
