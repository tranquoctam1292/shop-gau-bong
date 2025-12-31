/**
 * SEO Audit API
 *
 * POST /api/admin/seo/audit - Run SEO audit on product(s)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { auditProduct, auditAllProducts } from '@/lib/services/seoService';
import { AdminRole } from '@/types/admin';
import { z } from 'zod';

// Validation schema
const AuditRequestSchema = z.union([
  z.object({
    productId: z.string().min(1),
    all: z.undefined(),
  }),
  z.object({
    all: z.literal(true),
    productId: z.undefined(),
  }),
]);

export async function POST(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Ensure adminUser is defined
      if (!req.adminUser) {
        return NextResponse.json(
          { error: 'Không được phép truy cập' },
          { status: 401 }
        );
      }

      // RBAC: Only SUPER_ADMIN and CONTENT_EDITOR can run audit
      const allowedRoles = [AdminRole.SUPER_ADMIN, AdminRole.CONTENT_EDITOR];
      if (!allowedRoles.includes(req.adminUser.role as AdminRole)) {
        return NextResponse.json(
          { error: 'Không có quyền chạy SEO audit' },
          { status: 403 }
        );
      }

      const body = await request.json();

      // Validate request body
      const validation = AuditRequestSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Dữ liệu không hợp lệ. Cần productId hoặc all: true', details: validation.error.errors },
          { status: 400 }
        );
      }

      const data = validation.data;

      // Run audit on single product
      if ('productId' in data && data.productId) {
        const audit = await auditProduct(data.productId);

        if (!audit) {
          return NextResponse.json(
            { error: 'Không tìm thấy sản phẩm' },
            { status: 404 }
          );
        }

        return NextResponse.json({ audit });
      }

      // Run audit on all products
      if ('all' in data && data.all) {
        const result = await auditAllProducts();

        return NextResponse.json(result);
      }

      return NextResponse.json(
        { error: 'Cần productId hoặc all: true' },
        { status: 400 }
      );
    } catch (error) {
      console.error('[SEO Audit API] Error:', error);
      return NextResponse.json(
        { error: 'Lỗi khi chạy SEO audit' },
        { status: 500 }
      );
    }
  });
}
