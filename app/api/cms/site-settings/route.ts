/**
 * Public Site Settings API
 * 
 * GET: Get public site settings (for frontend)
 * 
 * Cached with revalidate = 3600 (1 hour)
 */

import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getSiteSettings } from '@/lib/repositories/siteSettingsRepository';
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
            id: mongoSettings.header.logo._id,
            url: mongoSettings.header.logo.url,
            name: mongoSettings.header.logo.name,
            alt: mongoSettings.header.logo.alt,
          }
        : null,
      siteTitle: mongoSettings.header?.siteTitle, // ✅ FIX: Map siteTitle to frontend
      announcementBar: {
        enabled: mongoSettings.header?.announcementBar?.enabled ?? false,
        text: mongoSettings.header?.announcementBar?.text,
        link: mongoSettings.header?.announcementBar?.link,
        linkText: mongoSettings.header?.announcementBar?.linkText,
      },
    },
    footer: {
      copyright: mongoSettings.footer?.copyright,
      description: mongoSettings.footer?.description, // ✅ FIX: Map description to frontend
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
 * Cached function to get site settings
 * 
 * ✅ FIX: Use unstable_cache with tags for better cache invalidation control
 * Tag 'site-settings' allows instant invalidation via revalidateTag()
 */
const getCachedSiteSettings = unstable_cache(
  async () => {
    return await getSiteSettings();
  },
  ['site-settings'], // Cache key
  {
    tags: ['site-settings'], // ✅ FIX: Tag for revalidateTag() invalidation
    revalidate: 3600, // Cache for 1 hour
  }
);

/**
 * GET /api/cms/site-settings
 * 
 * Get public site settings
 * 
 * ✅ FIX: Cache with tag 'site-settings' for instant invalidation when admin updates
 * Cache: 1 hour (3600 seconds), but can be invalidated immediately via revalidateTag('site-settings')
 */
export async function GET() {
  try {
    // ✅ FIX: Use cached function with tag for better cache control
    const settings = await getCachedSiteSettings();
    
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

