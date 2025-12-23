/**
 * Client-side Site Settings Utilities
 * 
 * Helper functions for fetching site settings on client side
 */

import type { SiteSettings } from '@/types/siteSettings';

/**
 * Fetch site settings from public API
 * 
 * Used in Client Components
 * 
 * ✅ FIX: Add cache busting to ensure fresh data after admin updates
 * Client-side fetch doesn't support next.revalidate, so we use cache: 'no-store' for immediate updates
 */
export async function fetchSiteSettings(): Promise<SiteSettings | null> {
  try {
    // ✅ FIX: Use cache: 'no-store' to bypass browser cache and get fresh data
    // This ensures changes from admin panel appear immediately on frontend
    const response = await fetch('/api/cms/site-settings', {
      cache: 'no-store', // Don't cache - always fetch fresh data
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch site settings');
    }

    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('[fetchSiteSettings] Error:', error);
    return null;
  }
}

