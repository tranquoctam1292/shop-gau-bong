/**
 * Inventory Cache Utilities
 *
 * In-memory caching for inventory data to reduce database load
 * Uses TTL-based invalidation with automatic cleanup
 */

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}

// Cache configuration
const CACHE_CONFIG = {
  // Low stock: Short TTL since it's critical data
  lowStock: {
    ttlMs: 30 * 1000, // 30 seconds
    maxEntries: 10,
  },
  // Stock forecast: Longer TTL since calculation is expensive
  forecast: {
    ttlMs: 5 * 60 * 1000, // 5 minutes
    maxEntries: 20,
  },
  // Stock history: Medium TTL
  history: {
    ttlMs: 2 * 60 * 1000, // 2 minutes
    maxEntries: 50,
  },
  // Dashboard stats: Short TTL for real-time feel
  dashboard: {
    ttlMs: 30 * 1000, // 30 seconds
    maxEntries: 5,
  },
} as const;

type CacheType = keyof typeof CACHE_CONFIG;

// Separate cache maps for each type
const caches: Record<CacheType, Map<string, CacheEntry<unknown>>> = {
  lowStock: new Map(),
  forecast: new Map(),
  history: new Map(),
  dashboard: new Map(),
};

// Track last cleanup time
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute

/**
 * Generate cache key from parameters
 */
function generateKey(params: Record<string, unknown>): string {
  return JSON.stringify(params, Object.keys(params).sort());
}

/**
 * Cleanup expired entries (runs periodically)
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();

  // Only cleanup once per minute
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }

  lastCleanup = now;

  for (const cacheType of Object.keys(caches) as CacheType[]) {
    const cache = caches[cacheType];
    for (const [key, entry] of cache.entries()) {
      if (now > entry.expiresAt) {
        cache.delete(key);
      }
    }
  }
}

/**
 * Enforce max entries limit (LRU-like: remove oldest entries)
 */
function enforceMaxEntries(cacheType: CacheType): void {
  const cache = caches[cacheType];
  const maxEntries = CACHE_CONFIG[cacheType].maxEntries;

  if (cache.size > maxEntries) {
    // Sort by cachedAt and remove oldest
    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].cachedAt - b[1].cachedAt);

    const toRemove = entries.slice(0, entries.length - maxEntries);
    for (const [key] of toRemove) {
      cache.delete(key);
    }
  }
}

/**
 * Get cached data if valid
 */
export function getCached<T>(
  cacheType: CacheType,
  params: Record<string, unknown>
): T | null {
  cleanupExpiredEntries();

  const key = generateKey(params);
  const cache = caches[cacheType];
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  const now = Date.now();
  if (now > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Set cache data
 */
export function setCache<T>(
  cacheType: CacheType,
  params: Record<string, unknown>,
  data: T
): void {
  const key = generateKey(params);
  const cache = caches[cacheType];
  const config = CACHE_CONFIG[cacheType];
  const now = Date.now();

  cache.set(key, {
    data,
    cachedAt: now,
    expiresAt: now + config.ttlMs,
  });

  enforceMaxEntries(cacheType);
}

/**
 * Invalidate cache entries by type
 */
export function invalidateCache(cacheType: CacheType): void {
  caches[cacheType].clear();
}

/**
 * Invalidate cache entries matching a product ID
 */
export function invalidateCacheByProduct(productId: string): void {
  const now = Date.now();

  for (const cacheType of Object.keys(caches) as CacheType[]) {
    const cache = caches[cacheType];

    for (const [key] of cache.entries()) {
      // If key contains the productId, invalidate it
      if (key.includes(productId)) {
        cache.delete(key);
      }
    }
  }

  // Also clear dashboard and lowStock caches since they aggregate data
  caches.dashboard.clear();
  caches.lowStock.clear();
}

/**
 * Invalidate all inventory caches
 */
export function invalidateAllInventoryCache(): void {
  for (const cacheType of Object.keys(caches) as CacheType[]) {
    caches[cacheType].clear();
  }
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats(): Record<CacheType, { size: number; maxEntries: number; ttlMs: number }> {
  return {
    lowStock: {
      size: caches.lowStock.size,
      maxEntries: CACHE_CONFIG.lowStock.maxEntries,
      ttlMs: CACHE_CONFIG.lowStock.ttlMs,
    },
    forecast: {
      size: caches.forecast.size,
      maxEntries: CACHE_CONFIG.forecast.maxEntries,
      ttlMs: CACHE_CONFIG.forecast.ttlMs,
    },
    history: {
      size: caches.history.size,
      maxEntries: CACHE_CONFIG.history.maxEntries,
      ttlMs: CACHE_CONFIG.history.ttlMs,
    },
    dashboard: {
      size: caches.dashboard.size,
      maxEntries: CACHE_CONFIG.dashboard.maxEntries,
      ttlMs: CACHE_CONFIG.dashboard.ttlMs,
    },
  };
}

/**
 * Wrapper function for cached data fetching
 *
 * Usage:
 * const data = await withCache('forecast', { limit: 10 }, async () => {
 *   return await expensiveDatabaseQuery();
 * });
 */
export async function withCache<T>(
  cacheType: CacheType,
  params: Record<string, unknown>,
  fetcher: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = getCached<T>(cacheType, params);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Store in cache
  setCache(cacheType, params, data);

  return data;
}
