/**
 * Scheduled SEO Audit Cron Job
 *
 * GET /api/cron/seo-audit - Run scheduled SEO audit for all products
 *
 * This endpoint is meant to be called by a cron scheduler (e.g., Vercel Cron)
 * Recommended schedule: Weekly (every Sunday at 3:00 AM)
 *
 * Security: Protected by CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from 'next/server';
import { auditAllProducts } from '@/lib/services/seoService';

// Route Segment Config (Next.js 14)
export const maxDuration = 300; // 5 minutes max
export const dynamic = 'force-dynamic';

// Verify cron secret
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // If no CRON_SECRET is set, allow in development only
  if (!cronSecret) {
    return process.env.NODE_ENV === 'development';
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    if (!verifyCronAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[SEO Audit Cron] Starting scheduled audit...');
    const startTime = Date.now();

    // Run audit on all products
    const auditResult = await auditAllProducts();

    const duration = Date.now() - startTime;

    console.log(
      `[SEO Audit Cron] Completed in ${duration}ms. ` +
      `Processed ${auditResult.processed} products. ` +
      `Average score: ${auditResult.averageScore.toFixed(1)}`
    );

    return NextResponse.json({
      success: true,
      message: 'SEO audit completed',
      timestamp: new Date().toISOString(),
      duration,
      processed: auditResult.processed,
      averageScore: auditResult.averageScore,
    });
  } catch (error) {
    console.error('[SEO Audit Cron] Error:', error);
    return NextResponse.json(
      { error: 'Failed to run SEO audit' },
      { status: 500 }
    );
  }
}
