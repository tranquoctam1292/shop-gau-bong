/**
 * Bulk SEO Update API
 *
 * PATCH /api/admin/seo/products/bulk - Bulk update products SEO
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { bulkUpdateSEO } from '@/lib/services/seoService';
import { AdminRole } from '@/types/admin';
import { z } from 'zod';

// Validation schema
const BulkUpdateSchema = z.object({
  updates: z.array(
    z.object({
      productId: z.string().min(1),
      seo: z.object({
        focusKeyword: z.string().optional(),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        slug: z.string().optional(),
        canonicalUrl: z.string().optional(),
        robotsMeta: z.string().optional(),
        ogImage: z.string().optional(),
        ogImageId: z.string().optional(),
        socialDescription: z.string().optional(),
      }),
    })
  ).min(1).max(100), // Limit to 100 products per request
});

export async function PATCH(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Ensure adminUser is defined
      if (!req.adminUser) {
        return NextResponse.json(
          { error: 'Không được phép truy cập' },
          { status: 401 }
        );
      }

      // RBAC: Only SUPER_ADMIN and CONTENT_EDITOR can update SEO
      const allowedRoles = [AdminRole.SUPER_ADMIN, AdminRole.CONTENT_EDITOR];
      if (!allowedRoles.includes(req.adminUser.role as AdminRole)) {
        return NextResponse.json(
          { error: 'Không có quyền cập nhật SEO' },
          { status: 403 }
        );
      }

      const body = await request.json();

      // Validate request body
      const validation = BulkUpdateSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Dữ liệu không hợp lệ', details: validation.error.errors },
          { status: 400 }
        );
      }

      const { updates } = validation.data;

      // Perform bulk update with audit
      const result = await bulkUpdateSEO(updates, true);

      return NextResponse.json(result);
    } catch (error) {
      console.error('[Bulk SEO Update API] Error:', error);
      return NextResponse.json(
        { error: 'Lỗi khi cập nhật SEO hàng loạt' },
        { status: 500 }
      );
    }
  });
}
