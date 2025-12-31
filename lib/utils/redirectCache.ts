/**
 * SEO Redirects Cache
 *
 * In-memory cache for redirects to optimize middleware performance.
 * Cache is refreshed periodically and on-demand via API call.
 */

import type { SEORedirect } from '@/types/seo';

interface RedirectCacheEntry {
  destination: string;
  type: 301 | 302;
}

// In-memory cache
let redirectsMap: Map<string, RedirectCacheEntry> = new Map();
let lastFetch = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Get cached redirect for a source path
 */
export function getCachedRedirect(source: string): RedirectCacheEntry | null {
  return redirectsMap.get(source) || null;
}

/**
 * Check if cache needs refresh
 */
export function isCacheStale(): boolean {
  return Date.now() - lastFetch > CACHE_TTL;
}

/**
 * Update cache with new redirects
 */
export function updateRedirectsCache(redirects: SEORedirect[]): void {
  const newMap = new Map<string, RedirectCacheEntry>();

  for (const redirect of redirects) {
    if (redirect.enabled) {
      newMap.set(redirect.source, {
        destination: redirect.destination,
        type: redirect.type,
      });
    }
  }

  redirectsMap = newMap;
  lastFetch = Date.now();
}

/**
 * Clear cache (call when redirects are updated via admin)
 */
export function clearRedirectsCache(): void {
  redirectsMap.clear();
  lastFetch = 0;
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats(): { size: number; lastFetch: number; isStale: boolean } {
  return {
    size: redirectsMap.size,
    lastFetch,
    isStale: isCacheStale(),
  };
}
