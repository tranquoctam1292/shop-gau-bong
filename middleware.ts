import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Middleware for:
 * 1. Content Security Policy (CSP) - prevents XSS attacks
 * 2. Authentication - forced password change protection
 *
 * CSP helps prevent XSS attacks by controlling which resources can be loaded.
 * External services that may need to be whitelisted:
 * - Google Analytics: https://www.google-analytics.com, https://www.googletagmanager.com
 * - Payment gateways (MoMo, VietQR): Add domains when implemented
 * - CDN/Image hosting: Add domains when configured
 * - Sentry: https://*.sentry.io (if error tracking is added)
 */
export async function middleware(request: NextRequest) {
  // 🔒 SECURITY FIX: Check if user must change password
  const pathname = request.nextUrl.pathname;

  // Only check auth for /admin routes
  if (pathname.startsWith('/admin')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If user has mustChangePassword flag and is not on the change-password page, redirect them
    if (token && token.mustChangePassword && pathname !== '/admin/change-password') {
      const changePasswordUrl = new URL('/admin/change-password', request.url);
      changePasswordUrl.searchParams.set('required', 'true');
      return NextResponse.redirect(changePasswordUrl);
    }
  }

  // Generate nonce for each request (for inline scripts with nonce)
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // Build CSP directives
  // Note: 'unsafe-inline' is needed for Tailwind CSS (generated styles) and Next.js scripts
  // Removed 'strict-dynamic' to allow Next.js auto-injected scripts without nonce
  // Added 'unsafe-eval' for Next.js development mode and dynamic imports
  // Added 'https:' to script-src for Vercel CDN and external scripts
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;
    script-src-elem 'self' 'unsafe-inline' https:;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self' data: https:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  // Clone request headers
  const requestHeaders = new Headers(request.headers);

  // Set nonce header (can be used by client-side code if needed)
  requestHeaders.set('x-nonce', nonce);

  // Set Content-Security-Policy header
  requestHeaders.set('Content-Security-Policy', cspHeader);

  return NextResponse.next({
    headers: requestHeaders,
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * Middleware matcher configuration
 * 
 * Matches all routes except:
 * - /api/* (API routes - CSP not needed for API responses)
 * - /_next/static/* (Next.js static files)
 * - /_next/image/* (Next.js image optimization)
 * - /favicon.ico (Favicon)
 * - /robots.txt (Robots file)
 * - /sitemap.xml (Sitemap)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt, sitemap.xml (SEO files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
