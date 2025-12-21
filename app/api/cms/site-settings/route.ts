/**
 * Public Site Settings API
 * 
 * GET: Get public site settings (for frontend)
 * 
 * Cached with revalidate = 3600 (1 hour)
 */

import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/repositories/siteSettingsRepository';
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
 * GET /api/cms/site-settings
 * 
 * Get public site settings
 * 
 * Cache: 1 hour (3600 seconds)
 */
export async function GET() {
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
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      data: mapSiteSettings(settings),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[Public Site Settings GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Không thể lấy cấu hình site',
      },
      { status: 500 }
    );
  }
}

// Revalidate cache every hour
export const revalidate = 3600;

