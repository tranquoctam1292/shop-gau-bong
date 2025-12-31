/**
 * SEO Single Redirect API
 *
 * GET /api/admin/seo/redirects/[id] - Get redirect by ID
 * PUT /api/admin/seo/redirects/[id] - Update redirect
 * DELETE /api/admin/seo/redirects/[id] - Delete redirect
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getRedirectById, updateRedirect, deleteRedirect } from '@/lib/repositories/seoRepository';
import { AdminRole } from '@/types/admin';
import { z } from 'zod';

// Validation schema for updating redirect
const UpdateRedirectSchema = z.object({
  source: z.string().min(1).startsWith('/').optional(),
  destination: z.string().min(1).refine(
    (val) => val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
    { message: 'Destination phải bắt đầu bằng / hoặc http:// hoặc https://' }
  ).optional(),
  type: z.union([z.literal(301), z.literal(302)]).optional(),
  enabled: z.boolean().optional(),
  note: z.string().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Ensure adminUser is defined
      if (!req.adminUser) {
        return NextResponse.json(
          { error: 'Không được phép truy cập' },
          { status: 401 }
        );
      }

      // RBAC: Only SUPER_ADMIN can view redirects
      if (req.adminUser.role !== AdminRole.SUPER_ADMIN) {
        return NextResponse.json(
          { error: 'Chỉ Super Admin mới có quyền xem redirects' },
          { status: 403 }
        );
      }

      const { id } = await context.params;

      const redirect = await getRedirectById(id);

      if (!redirect) {
        return NextResponse.json(
          { error: 'Không tìm thấy redirect' },
          { status: 404 }
        );
      }

      return NextResponse.json({ redirect });
    } catch (error) {
      console.error('[SEO Redirect API] GET Error:', error);
      return NextResponse.json(
        { error: 'Lỗi khi lấy redirect' },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Ensure adminUser is defined
      if (!req.adminUser) {
        return NextResponse.json(
          { error: 'Không được phép truy cập' },
          { status: 401 }
        );
      }

      // RBAC: Only SUPER_ADMIN can update redirects
      if (req.adminUser.role !== AdminRole.SUPER_ADMIN) {
        return NextResponse.json(
          { error: 'Chỉ Super Admin mới có quyền cập nhật redirects' },
          { status: 403 }
        );
      }

      const { id } = await context.params;
      const body = await request.json();

      // Validate request body
      const validation = UpdateRedirectSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Dữ liệu không hợp lệ', details: validation.error.errors },
          { status: 400 }
        );
      }

      const redirect = await updateRedirect(id, validation.data);

      if (!redirect) {
        return NextResponse.json(
          { error: 'Không tìm thấy redirect' },
          { status: 404 }
        );
      }

      return NextResponse.json({ redirect });
    } catch (error) {
      console.error('[SEO Redirect API] PUT Error:', error);

      // Handle specific errors
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          return NextResponse.json(
            { error: 'Redirect với source này đã tồn tại' },
            { status: 409 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Lỗi khi cập nhật redirect' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Ensure adminUser is defined
      if (!req.adminUser) {
        return NextResponse.json(
          { error: 'Không được phép truy cập' },
          { status: 401 }
        );
      }

      // RBAC: Only SUPER_ADMIN can delete redirects
      if (req.adminUser.role !== AdminRole.SUPER_ADMIN) {
        return NextResponse.json(
          { error: 'Chỉ Super Admin mới có quyền xóa redirects' },
          { status: 403 }
        );
      }

      const { id } = await context.params;

      const deleted = await deleteRedirect(id);

      if (!deleted) {
        return NextResponse.json(
          { error: 'Không tìm thấy redirect' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('[SEO Redirect API] DELETE Error:', error);
      return NextResponse.json(
        { error: 'Lỗi khi xóa redirect' },
        { status: 500 }
      );
    }
  });
}
