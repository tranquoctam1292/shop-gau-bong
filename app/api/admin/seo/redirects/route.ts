/**
 * SEO Redirects API
 *
 * GET /api/admin/seo/redirects - Get all redirects with pagination
 * POST /api/admin/seo/redirects - Create new redirect
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getRedirects, createRedirect } from '@/lib/repositories/seoRepository';
import { AdminRole } from '@/types/admin';
import { z } from 'zod';

// Validation schema for creating redirect
const CreateRedirectSchema = z.object({
  source: z.string().min(1).startsWith('/'),
  destination: z.string().min(1).refine(
    (val) => val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
    { message: 'Destination phải bắt đầu bằng / hoặc http:// hoặc https://' }
  ),
  type: z.union([z.literal(301), z.literal(302)]).default(301),
  enabled: z.boolean().default(true),
  note: z.string().optional(),
});

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

      // RBAC: Only SUPER_ADMIN can manage redirects
      if (req.adminUser.role !== AdminRole.SUPER_ADMIN) {
        return NextResponse.json(
          { error: 'Chỉ Super Admin mới có quyền quản lý redirects' },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(request.url);

      const page = parseInt(searchParams.get('page') || '1', 10);
      const perPage = parseInt(searchParams.get('per_page') || '20', 10);
      const search = searchParams.get('search') || undefined;
      const enabled = searchParams.get('enabled') === 'true'
        ? true
        : searchParams.get('enabled') === 'false'
        ? false
        : undefined;

      const result = await getRedirects({
        page,
        perPage,
        search,
        enabled,
      });

      return NextResponse.json({
        redirects: result.redirects,
        total: result.total,
        page,
        perPage,
        totalPages: Math.ceil(result.total / perPage),
      });
    } catch (error) {
      console.error('[SEO Redirects API] GET Error:', error);
      return NextResponse.json(
        { error: 'Lỗi khi lấy danh sách redirects' },
        { status: 500 }
      );
    }
  });
}

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

      // RBAC: Only SUPER_ADMIN can create redirects
      if (req.adminUser.role !== AdminRole.SUPER_ADMIN) {
        return NextResponse.json(
          { error: 'Chỉ Super Admin mới có quyền tạo redirects' },
          { status: 403 }
        );
      }

      const body = await request.json();

      // Validate request body
      const validation = CreateRedirectSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Dữ liệu không hợp lệ', details: validation.error.errors },
          { status: 400 }
        );
      }

      const data = validation.data;

      // Create redirect
      const redirect = await createRedirect(
        {
          source: data.source,
          destination: data.destination,
          type: data.type,
          enabled: data.enabled,
          note: data.note,
        },
        req.adminUser._id.toString()
      );

      return NextResponse.json({ redirect }, { status: 201 });
    } catch (error) {
      console.error('[SEO Redirects API] POST Error:', error);

      // Handle specific errors
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          return NextResponse.json(
            { error: 'Redirect với source này đã tồn tại' },
            { status: 409 }
          );
        }
        if (error.message.includes('loop detected')) {
          return NextResponse.json(
            { error: 'Phát hiện vòng lặp redirect' },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Lỗi khi tạo redirect' },
        { status: 500 }
      );
    }
  });
}
