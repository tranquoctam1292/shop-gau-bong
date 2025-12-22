/**
 * Clear Rate Limit API (Development Only)
 * 
 * ⚠️ WARNING: This endpoint should be disabled in production
 * Only use for development/testing purposes
 * 
 * Clears rate limit cache for login attempts
 * 
 * Usage:
 * POST /api/admin/auth/clear-rate-limit
 * Body: { "ip": "127.0.0.1", "username": "admin" } (optional)
 * Or: {} to clear all rate limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { clearAllRateLimits, resetRateLimit, getLoginRateLimitKey } from '@/lib/utils/rateLimiter';

export async function POST(request: NextRequest) {
  // ⚠️ SECURITY: Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { ip, username } = body;

    if (ip) {
      // Clear rate limit for specific IP
      const key = username 
        ? getLoginRateLimitKey(ip, username)
        : getLoginRateLimitKey(ip);
      await resetRateLimit(key);
      return NextResponse.json({
        success: true,
        message: `Rate limit cleared for ${username ? `IP ${ip} and username ${username}` : `IP ${ip}`}`,
      });
    } else {
      // Clear all rate limits
      await clearAllRateLimits();
      return NextResponse.json({
        success: true,
        message: 'All rate limits cleared',
      });
    }
  } catch (error) {
    console.error('[Clear Rate Limit] Error:', error);
    return NextResponse.json(
      { error: 'Failed to clear rate limit' },
      { status: 500 }
    );
  }
}

// Also support GET for easy browser access
export async function GET(request: NextRequest) {
  // ⚠️ SECURITY: Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    );
  }

  try {
    // Clear all rate limits
    await clearAllRateLimits();
    return NextResponse.json({
      success: true,
      message: 'All rate limits cleared',
    });
  } catch (error) {
    console.error('[Clear Rate Limit] Error:', error);
    return NextResponse.json(
      { error: 'Failed to clear rate limit' },
      { status: 500 }
    );
  }
}

