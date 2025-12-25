/**
 * CSRF Protection Utilities
 * 
 * Generates and validates CSRF tokens for API route protection
 * Tokens are stored in JWT session token and validated on state-changing requests
 */

import { randomBytes, createHmac } from 'crypto';

/**
 * Generate a secure CSRF token
 * Uses cryptographically secure random bytes
 * 
 * @returns CSRF token (hex string)
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a CSRF token hash for storage
 * Combines token with secret for verification
 * 
 * @param token - CSRF token
 * @param secret - Secret key (NEXTAUTH_SECRET)
 * @returns Hashed token
 */
export function hashCsrfToken(token: string, secret: string): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(token);
  return hmac.digest('hex');
}

/**
 * Verify a CSRF token against stored hash
 * 
 * @param token - CSRF token to verify
 * @param hash - Stored hash
 * @param secret - Secret key (NEXTAUTH_SECRET)
 * @returns true if token is valid
 */
export function verifyCsrfToken(token: string, hash: string, secret: string): boolean {
  const expectedHash = hashCsrfToken(token, secret);
  // Use timing-safe comparison to prevent timing attacks
  return timingSafeEqual(expectedHash, hash);
}

/**
 * Timing-safe string comparison
 * Prevents timing attacks by comparing strings in constant time
 * 
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Extract CSRF token from request headers
 * Checks both 'X-CSRF-Token' and 'x-csrf-token' headers (case-insensitive)
 * 
 * @param headers - Request headers
 * @returns CSRF token or null
 */
export function extractCsrfTokenFromHeaders(headers: Headers): string | null {
  const token = headers.get('X-CSRF-Token') || headers.get('x-csrf-token');
  return token || null;
}

/**
 * Validate Origin header to prevent cross-origin requests
 * 
 * @param origin - Origin header from request
 * @param allowedOrigins - List of allowed origins (default: same origin only)
 * @param requestUrl - Request URL to compare against (for same-origin check)
 * @returns true if origin is valid
 */
export function validateOrigin(origin: string | null, allowedOrigins?: string[], requestUrl?: string): boolean {
  // If no origin header, allow (same-origin requests don't always send Origin header)
  // This is safe because same-origin requests cannot be CSRF attacks
  if (!origin) {
    return true;
  }

  // If allowed origins list is provided, check against it
  if (allowedOrigins && allowedOrigins.length > 0) {
    return allowedOrigins.includes(origin);
  }

  // If requestUrl is provided, check if origin matches the request URL's origin (same-origin)
  if (requestUrl) {
    try {
      const requestOrigin = new URL(requestUrl).origin;
      // Allow if origin matches request URL's origin (same-origin request)
      if (origin === requestOrigin) {
        return true;
      }
    } catch (error) {
      // Invalid URL, fall through to default behavior
    }
  }

  // Default: reject all cross-origin requests
  // In production, you might want to allow specific origins (e.g., your frontend domain)
  return false;
}

/**
 * Get allowed origins from environment variable
 * Format: comma-separated list of origins
 * Example: ALLOWED_ORIGINS=https://example.com,https://www.example.com
 * 
 * @returns Array of allowed origins
 */
export function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (!envOrigins) {
    return [];
  }
  return envOrigins.split(',').map(origin => origin.trim()).filter(Boolean);
}

