/**
 * SEO Settings API
 *
 * GET /api/admin/seo/settings - Get global SEO settings
 * PUT /api/admin/seo/settings - Update global SEO settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getGlobalSEOSettings, updateGlobalSEOSettings } from '@/lib/services/seoService';
import { AdminRole } from '@/types/admin';
import { z } from 'zod';

// Validation schema for settings update
const SettingsUpdateSchema = z.object({
  titleTemplate: z.string().optional(),
  productTitleTemplate: z.string().optional(),
  googleVerification: z.string().optional(),
  bingVerification: z.string().optional(),
  defaultOgImage: z.string().optional(),
  organization: z
    .object({
      name: z.string().min(1),
      logo: z.string().optional(),
      url: z.string().url(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      address: z
        .object({
          streetAddress: z.string().optional(),
          addressLocality: z.string().optional(),
          addressRegion: z.string().optional(),
          addressCountry: z.string().min(1),
        })
        .optional(),
      socialProfiles: z.array(z.string().url()).optional(),
    })
    .optional(),
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

      // RBAC: Only SUPER_ADMIN can access settings
      if (req.adminUser.role !== AdminRole.SUPER_ADMIN) {
        return NextResponse.json(
          { error: 'Chỉ Super Admin mới có quyền xem cài đặt SEO' },
          { status: 403 }
        );
      }

      const settings = await getGlobalSEOSettings();

      // Return default settings if none exist
      if (!settings) {
        return NextResponse.json({
          settings: {
            titleTemplate: '%title% | Shop Gấu Bông',
            productTitleTemplate: 'Mua %title% - %price% | Shop Gấu Bông',
            organization: {
              name: 'Shop Gấu Bông',
              url: process.env.NEXT_PUBLIC_SITE_URL || 'https://shop-gaubong.com',
              addressCountry: 'VN',
            },
          },
        });
      }

      return NextResponse.json({ settings });
    } catch (error) {
      console.error('[SEO Settings API] GET Error:', error);
      return NextResponse.json(
        { error: 'Lỗi khi lấy cài đặt SEO' },
        { status: 500 }
      );
    }
  });
}

export async function PUT(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Ensure adminUser is defined
      if (!req.adminUser) {
        return NextResponse.json(
          { error: 'Không được phép truy cập' },
          { status: 401 }
        );
      }

      // RBAC: Only SUPER_ADMIN can update settings
      if (req.adminUser.role !== AdminRole.SUPER_ADMIN) {
        return NextResponse.json(
          { error: 'Chỉ Super Admin mới có quyền cập nhật cài đặt SEO' },
          { status: 403 }
        );
      }

      const body = await request.json();

      // Validate request body
      const validation = SettingsUpdateSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Dữ liệu không hợp lệ', details: validation.error.errors },
          { status: 400 }
        );
      }

      const settings = await updateGlobalSEOSettings(
        validation.data,
        req.adminUser._id.toString()
      );

      return NextResponse.json({ settings });
    } catch (error) {
      console.error('[SEO Settings API] PUT Error:', error);
      return NextResponse.json(
        { error: 'Lỗi khi cập nhật cài đặt SEO' },
        { status: 500 }
      );
    }
  });
}
