/**
 * Admin Site Settings API
 * 
 * GET: Get current site settings
 * POST/PUT: Update site settings
 * 
 * Requires: Admin authentication (SUPER_ADMIN or CONTENT_EDITOR)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getSiteSettings, updateSiteSettings } from '@/lib/repositories/siteSettingsRepository';
import { siteSettingsUpdateSchema } from '@/lib/validations/siteSettings';
import { handleValidationError } from '@/lib/utils/validation-errors';
import type { SiteSettings } from '@/types/siteSettings';

/**
 * Map MongoDB document to frontend format
 */
function mapSiteSettings(mongoSettings: any): SiteSettings {
  return {
    id: mongoSettings._id,
    header: {
      logo: mongoSettings.header?.logo
        ? {
            id: mongoSettings.header.logo._id,
            url: mongoSettings.header.logo.url,
            name: mongoSettings.header.logo.name,
            alt: mongoSettings.header.logo.alt,
          }
        : null,
      announcementBar: {
        enabled: mongoSettings.header?.announcementBar?.enabled ?? false,
        text: mongoSettings.header?.announcementBar?.text,
        link: mongoSettings.header?.announcementBar?.link,
        linkText: mongoSettings.header?.announcementBar?.linkText,
      },
    },
    footer: {
      copyright: mongoSettings.footer?.copyright,
      address: mongoSettings.footer?.address,
      email: mongoSettings.footer?.email,
      phone: mongoSettings.footer?.phone,
      socialLinks: mongoSettings.footer?.socialLinks ?? [],
    },
    scripts: {
      headerScripts: mongoSettings.scripts?.headerScripts,
      footerScripts: mongoSettings.scripts?.footerScripts,
    },
    createdAt: mongoSettings.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: mongoSettings.updatedAt?.toISOString() ?? new Date().toISOString(),
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
        
        if (!settings) {
          // Return default structure if not exists
          return NextResponse.json({
            success: true,
            data: {
              id: 'global_config',
              header: {
                logo: null,
                announcementBar: {
                  enabled: false,
                },
              },
              footer: {
                socialLinks: [],
              },
              scripts: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          });
        }
        
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
        
        const userId = (req.adminUser as any)?._id?.toString();
        
        // Update settings
        const updated = await updateSiteSettings(validation.data, userId);
        
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

