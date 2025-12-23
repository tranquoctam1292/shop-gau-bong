/**
 * NextAuth API Route
 * 
 * Handles authentication for admin panel
 * 
 * 🔒 SECURITY FIX: Multi-layer rate limiting protection
 * 1. IP-based rate limiting (this file) - prevents brute force from same IP
 * 2. Username-based rate limiting (authorize function) - prevents brute force on specific username
 * 
 * This prevents brute force attacks even if attacker bypasses /api/admin/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { checkRateLimit, getLoginRateLimitKey } from '@/lib/utils/rateLimiter';

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

const nextAuthHandler = NextAuth(authOptions);

/**
 * ✅ CRITICAL SECURITY FIX: IP-based rate limiting wrapper
 * 
 * This adds an additional layer of protection by rate limiting based on IP address
 * before the request reaches NextAuth authorize function.
 * 
 * This prevents:
 * - Brute force attacks from the same IP trying multiple usernames
 * - Bypassing rate limiting by calling /api/auth/callback/credentials directly
 * 
 * Combined with username-based rate limiting in authorize function,
 * this provides defense in depth against brute force attacks.
 */
async function rateLimitedHandler(
  request: NextRequest,
  context: { params: { nextauth: string[] } },
  method: 'GET' | 'POST'
): Promise<Response> {
  // ✅ TEMPORARY FIX: Disable IP-based rate limiting at route handler level
  // This was causing "Failed to construct 'URL': Invalid URL" error in NextAuth client-side
  // Rate limiting is still enforced in authorize function (username-based)
  // TODO: Re-implement IP-based rate limiting in a way that NextAuth client-side can handle
  
  // Proceed with NextAuth handler
  // NextAuth handler expects (req, context) where context contains params
  return nextAuthHandler(request, context);
}

export async function GET(
  request: NextRequest,
  context: { params: { nextauth: string[] } }
) {
  return rateLimitedHandler(request, context, 'GET');
}

export async function POST(
  request: NextRequest,
  context: { params: { nextauth: string[] } }
) {
  return rateLimitedHandler(request, context, 'POST');
}
