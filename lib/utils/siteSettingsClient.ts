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
 */
export async function fetchSiteSettings(): Promise<SiteSettings | null> {
  try {
    const response = await fetch('/api/cms/site-settings', {
      next: { revalidate: 3600 }, // 1 hour
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

