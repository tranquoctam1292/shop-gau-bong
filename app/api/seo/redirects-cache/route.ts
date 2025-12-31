/**
 * SEO Redirects Cache API (Public - for middleware consumption)
 *
 * GET /api/seo/redirects-cache - Get all enabled redirects for middleware cache
 *
 * Note: This is intentionally unauthenticated because:
 * 1. It's called by middleware which runs before auth
 * 2. It only exposes redirect mappings, not sensitive data
 * 3. Redirect rules are public information (users see them in browser)
 */

import { NextResponse } from 'next/server';
import { getEnabledRedirects } from '@/lib/repositories/seoRepository';

/**
 * Get all enabled redirects for caching
 * This endpoint is optimized for middleware consumption
 */
export async function GET() {
  try {
    const redirects = await getEnabledRedirects();

    // Transform to simple map format for middleware
    const redirectsMap: Record<string, { destination: string; type: 301 | 302 }> = {};

    for (const redirect of redirects) {
      redirectsMap[redirect.source] = {
        destination: redirect.destination,
        type: redirect.type,
      };
    }

    // Add cache headers to reduce load
    const response = NextResponse.json({
      redirects: redirectsMap,
      count: Object.keys(redirectsMap).length,
      timestamp: Date.now(),
    });

    // Cache for 30 seconds at edge
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

    return response;
  } catch (error) {
    console.error('[Redirects Cache API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch redirects', redirects: {} },
      { status: 500 }
    );
  }
}
