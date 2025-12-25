/**
 * Fetch with CSRF Token
 * 
 * Wrapper for fetch that automatically includes CSRF token in headers
 * for state-changing requests (POST, PUT, PATCH, DELETE)
 */

import { getCsrfTokenHeader } from './csrfClient';

const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Fetch with automatic CSRF token inclusion
 * 
 * Automatically includes X-CSRF-Token header for state-changing requests
 * 
 * @param url - Request URL
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers);

  // Include CSRF token for state-changing requests
  if (STATE_CHANGING_METHODS.includes(method)) {
    try {
      const csrfToken = await getCsrfTokenHeader();
      headers.set('X-CSRF-Token', csrfToken);
    } catch (error) {
      console.error('[fetchWithCsrf] Failed to get CSRF token:', error);
      // Continue without CSRF token - server will reject with 403
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

