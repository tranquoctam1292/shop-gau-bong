/**
 * CSRF Token Client Utility
 * 
 * Utility functions for client-side CSRF token management
 * Fetches and caches CSRF token for use in API requests
 * 
 * PERFORMANCE OPTIMIZATION (1.1.0): Added TTL check to prevent stale token usage
 * PERFORMANCE OPTIMIZATION (1.1.2): Migrated to sessionStorage for persistence across page refreshes
 */

interface CsrfTokenCacheEntry {
  token: string;
  expiresAt: number; // Timestamp in milliseconds
}

const CSRF_TOKEN_STORAGE_KEY = 'csrf_token_cache';
const CSRF_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

let csrfTokenPromise: Promise<string> | null = null;
let prefetchTokenPromise: Promise<string | null> | null = null;

/**
 * Get cached token from sessionStorage
 * 
 * PERFORMANCE OPTIMIZATION (1.1.2): Load from sessionStorage instead of in-memory
 */
function getCachedToken(): CsrfTokenCacheEntry | null {
  if (typeof window === 'undefined') {
    return null; // Server-side: no sessionStorage
  }

  try {
    const cached = sessionStorage.getItem(CSRF_TOKEN_STORAGE_KEY);
    if (!cached) {
      return null;
    }

    const entry: CsrfTokenCacheEntry = JSON.parse(cached);
    
    // Check expiry
    const now = Date.now();
    if (now >= entry.expiresAt) {
      // Token expired, remove from storage
      sessionStorage.removeItem(CSRF_TOKEN_STORAGE_KEY);
      return null;
    }

    return entry;
  } catch (error) {
    // Invalid cache data, clear it
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(CSRF_TOKEN_STORAGE_KEY);
    }
    return null;
  }
}

/**
 * Save token to sessionStorage
 * 
 * PERFORMANCE OPTIMIZATION (1.1.2): Save to sessionStorage instead of in-memory
 */
function setCachedToken(entry: CsrfTokenCacheEntry): void {
  if (typeof window === 'undefined') {
    return; // Server-side: no sessionStorage
  }

  try {
    sessionStorage.setItem(CSRF_TOKEN_STORAGE_KEY, JSON.stringify(entry));
  } catch (error) {
    // Storage quota exceeded or other error - silently fail
    if (process.env.NODE_ENV === 'development') {
      console.warn('[setCachedToken] Failed to save to sessionStorage:', error);
    }
  }
}

/**
 * Get CSRF token (fetch if not cached or expired)
 * 
 * PERFORMANCE OPTIMIZATION (1.1.0): Checks token expiry before returning cached token
 * 
 * @returns Promise<string> - CSRF token
 * @throws Error if token cannot be fetched
 */
export async function getCsrfToken(): Promise<string> {
  // PERFORMANCE OPTIMIZATION (1.1.2): Load from sessionStorage
  const cached = getCachedToken();
  if (cached) {
    // Token is still valid, return cached token
    return cached.token;
  }

  // If already fetching, return existing promise
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  // Fetch new token
  csrfTokenPromise = (async () => {
    try {
      const response = await fetch('/api/admin/auth/csrf-token', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      if (!data.success || !data.data?.csrfToken) {
        throw new Error('Invalid CSRF token response');
      }

      const token = data.data.csrfToken as string;
      if (!token) {
        throw new Error('CSRF token is empty');
      }

      // PERFORMANCE OPTIMIZATION (1.1.2): Cache token to sessionStorage with expiry timestamp
      const expiresAt = data.data.expiresAt as number | undefined;
      const cacheEntry: CsrfTokenCacheEntry = {
        token,
        expiresAt: expiresAt || (Date.now() + CSRF_TOKEN_TTL_MS),
      };
      setCachedToken(cacheEntry);

      csrfTokenPromise = null; // Reset promise after successful fetch
      return token;
    } catch (error) {
      console.error('[getCsrfToken] Error:', error);
      csrfTokenPromise = null; // Reset promise on error
      throw error;
    }
  })();

  return csrfTokenPromise;
}

/**
 * Clear cached CSRF token
 * Call this when user logs out or token becomes invalid
 */
/**
 * Clear cached CSRF token
 * Call this when user logs out or token becomes invalid
 * 
 * PERFORMANCE OPTIMIZATION (1.1.2): Clear from sessionStorage
 */
export function clearCsrfTokenCache(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(CSRF_TOKEN_STORAGE_KEY);
  }
  csrfTokenPromise = null;
}

/**
 * Get CSRF token header value
 * 
 * @returns Promise<string> - CSRF token for X-CSRF-Token header
 */
export async function getCsrfTokenHeader(): Promise<string> {
  return await getCsrfToken();
}

/**
 * Pre-fetch CSRF token (non-blocking)
 * 
 * PERFORMANCE OPTIMIZATION (1.1.1): Pre-fetch token when user hovers over Quick Edit button
 * This function will fetch token in background if not already cached or expired
 * 
 * @returns Promise<string | null> - CSRF token if successfully fetched, null if failed (non-blocking)
 */
export async function prefetchCsrfToken(): Promise<string | null> {
  try {
    // PERFORMANCE OPTIMIZATION (1.1.2): Check sessionStorage for cached token
    const cached = getCachedToken();
    if (cached) {
      // Token is still valid, return cached token
      return cached.token;
    }

    // If already fetching (either prefetch or normal), return existing promise
    if (csrfTokenPromise) {
      const result = await csrfTokenPromise;
      return result;
    }
    if (prefetchTokenPromise) {
      return await prefetchTokenPromise;
    }

    // Start fetching in background (non-blocking)
    prefetchTokenPromise = (async () => {
      try {
        const response = await fetch('/api/admin/auth/csrf-token', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch CSRF token');
        }

        const data = await response.json();
        if (!data.success || !data.data?.csrfToken) {
          throw new Error('Invalid CSRF token response');
        }

        const token = data.data.csrfToken as string;
        if (!token) {
          throw new Error('CSRF token is empty');
        }

        // PERFORMANCE OPTIMIZATION (1.1.2): Cache token to sessionStorage
        const expiresAt = data.data.expiresAt as number | undefined;
        const cacheEntry: CsrfTokenCacheEntry = {
          token,
          expiresAt: expiresAt || (Date.now() + CSRF_TOKEN_TTL_MS),
        };
        setCachedToken(cacheEntry);

        prefetchTokenPromise = null; // Reset promise after successful fetch
        return token;
      } catch (error) {
        // Silent fail for pre-fetch - don't interrupt user
        if (process.env.NODE_ENV === 'development') {
          console.warn('[prefetchCsrfToken] Pre-fetch failed (non-blocking):', error);
        }
        prefetchTokenPromise = null; // Reset promise on error
        return null;
      }
    })();

    return await prefetchTokenPromise;
  } catch (error) {
    // Silent fail for pre-fetch
    return null;
  }
}

