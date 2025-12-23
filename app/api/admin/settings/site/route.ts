/**
 * Admin Site Settings API
 * 
 * GET: Get current site settings
 * POST/PUT: Update site settings
 * 
 * Requires: Admin authentication (SUPER_ADMIN or CONTENT_EDITOR)
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getSiteSettings, updateSiteSettings } from '@/lib/repositories/siteSettingsRepository';
import { siteSettingsUpdateSchema } from '@/lib/validations/siteSettings';
import { handleValidationError } from '@/lib/utils/validation-errors';
import { AdminRole } from '@/types/admin';
import type { SiteSettings } from '@/types/siteSettings';
import { safeToISOString } from '@/lib/utils/dateUtils';

/**
 * Map MongoDB document to frontend format
 */
function mapSiteSettings(mongoSettings: any): SiteSettings {
  return {
    id: mongoSettings._id,
    header: {
      logo: mongoSettings.header?.logo
        ? {
            id: mongoSettings.header.logo._id, // ✅ ID SYNC: Map _id from MongoDB to id for frontend
            url: mongoSettings.header.logo.url,
            name: mongoSettings.header.logo.name,
            alt: mongoSettings.header.logo.alt || mongoSettings.header.logo.name, // ✅ FALLBACK: Use name if alt is missing
          }
        : null,
      siteTitle: mongoSettings.header?.siteTitle, // ✅ BRANDING: Custom site title
      announcementBar: {
        enabled: mongoSettings.header?.announcementBar?.enabled ?? false,
        text: mongoSettings.header?.announcementBar?.text,
        link: mongoSettings.header?.announcementBar?.link,
        linkText: mongoSettings.header?.announcementBar?.linkText,
      },
    },
    footer: {
      copyright: mongoSettings.footer?.copyright,
      description: mongoSettings.footer?.description, // Brand description
      address: mongoSettings.footer?.address,
      email: mongoSettings.footer?.email,
      phone: mongoSettings.footer?.phone,
      socialLinks: mongoSettings.footer?.socialLinks ?? [],
    },
    scripts: {
      headerScripts: mongoSettings.scripts?.headerScripts,
      footerScripts: mongoSettings.scripts?.footerScripts,
    },
    createdAt: safeToISOString(mongoSettings.createdAt) ?? new Date().toISOString(),
    updatedAt: safeToISOString(mongoSettings.updatedAt) ?? new Date().toISOString(),
  };
}

/**
 * GET /api/admin/settings/site
 * 
 * Get current site settings
 */
export async function GET(request: NextRequest) {
  return withAuthAdmin(
    request,
    async (req: AuthenticatedRequest) => {
      try {
        const settings = await getSiteSettings();
        
        // getSiteSettings() now returns DEFAULT_SETTINGS instead of null
        // So settings will always be available
        
        return NextResponse.json({
          success: true,
          data: mapSiteSettings(settings),
        });
      } catch (error) {
        console.error('[Admin Site Settings GET] Error:', error);
        return NextResponse.json(
          {
            success: false,
            error: 'Không thể lấy cấu hình site',
          },
          { status: 500 }
        );
      }
    },
    'page:manage' // Require page management permission
  );
}

/**
 * POST /api/admin/settings/site
 * PUT /api/admin/settings/site
 * 
 * Update site settings
 */
export async function POST(request: NextRequest) {
  return withAuthAdmin(
    request,
    async (req: AuthenticatedRequest) => {
      try {
        const body = await request.json();
        
        // 🔒 SECURITY: Check if user is trying to update scripts
        // Only SUPER_ADMIN can update scripts (XSS protection)
        if (body.scripts && (body.scripts.headerScripts || body.scripts.footerScripts)) {
          const userRole = req.adminUser?.role;
          if (userRole !== AdminRole.SUPER_ADMIN) {
            return NextResponse.json(
              {
                success: false,
                error: 'Chỉ SUPER_ADMIN mới được cập nhật scripts',
                code: 'PERMISSION_DENIED',
              },
              { status: 403 }
            );
          }
        }
        
        // Validate input
        const validation = siteSettingsUpdateSchema.safeParse(body);
        if (!validation.success) {
          return handleValidationError(validation.error) ?? NextResponse.json(
            {
              success: false,
              error: 'Dữ liệu không hợp lệ',
            },
            { status: 400 }
          );
        }
        
        const userId = req.adminUser?._id?.toString();
        
        // Update settings
        const updated = await updateSiteSettings(validation.data, userId);
        
        // ✅ CACHE INVALIDATION: Revalidate layout, homepage, and API cache
        // This ensures Logo, SiteTitle, and Footer changes appear immediately on frontend
        try {
          // Revalidate pages
          revalidatePath('/', 'layout'); // Revalidate layout (includes Header/Footer components)
          revalidatePath('/'); // Revalidate homepage specifically
          
          // ✅ FIX: Use revalidateTag to invalidate Route Handler cache with revalidate = 3600
          // This is more reliable than revalidatePath for Route Handlers
          revalidateTag('site-settings'); // Invalidate all cached responses with this tag
          
          // Also revalidate path as fallback
          revalidatePath('/api/cms/site-settings', 'page');
        } catch (revalidateError) {
          // Log error but don't fail request if revalidation fails
          console.warn('[Cache Invalidation] Failed to revalidate:', revalidateError);
        }
        
        return NextResponse.json({
          success: true,
          data: mapSiteSettings(updated),
          message: 'Cập nhật cấu hình thành công',
        });
      } catch (error) {
        console.error('[Admin Site Settings POST] Error:', error);
        return NextResponse.json(
          {
            success: false,
            error: 'Không thể cập nhật cấu hình site',
          },
          { status: 500 }
        );
      }
    },
    'page:manage' // Require page management permission
  );
}

/**
 * PUT /api/admin/settings/site
 * 
 * Alias for POST (same handler)
 */
export async function PUT(request: NextRequest) {
  return POST(request);
}

