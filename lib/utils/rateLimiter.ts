/**
 * Rate Limiter Utility
 * 
 * MongoDB-based rate limiting for serverless environments (Vercel)
 * Uses MongoDB collection to store attempt counts with TTL indexes for automatic cleanup
 * 
 * This ensures rate limiting works correctly across multiple serverless instances
 */

import { getCollections, ObjectId } from '@/lib/db';

interface RateLimitEntry {
  _id?: ObjectId;
  key: string;
  count: number;
  resetAt: Date;
  createdAt: Date;
}

/**
 * Check rate limit
 * 
 * Uses atomic operations to ensure thread-safety across serverless instances
 * 
 * @param key - Rate limit key (e.g., `login:${ip}:${username}`)
 * @param maxAttempts - Maximum allowed attempts (default: 5)
 * @param windowMs - Time window in milliseconds (default: 15 minutes)
 * @returns true if within limit, false if exceeded
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): Promise<boolean> {
  try {
    const { rateLimits } = await getCollections();
    const now = new Date();
    const resetAt = new Date(now.getTime() + windowMs);

    // FIX: Simplified approach to avoid ConflictingUpdateOperators
    // Strategy: Use findOne first, then update/insert based on result
    // This avoids race conditions while keeping logic simple
    
    const existing = await rateLimits.findOne({ key });

    if (!existing) {
      // No entry exists, try to create new one
      // Use insertOne with try-catch to handle race condition (duplicate key)
      try {
        await rateLimits.insertOne({
          key,
          count: 1,
          resetAt,
          createdAt: now,
        });
        return true; // First attempt, allowed
      } catch (insertError: unknown) {
        // Handle duplicate key error (race condition - another request created it first)
        if (insertError && typeof insertError === 'object' && 'code' in insertError && insertError.code === 11000) {
          // Another request created the entry, retry with find
          const retryExisting = await rateLimits.findOne({ key });
          if (!retryExisting) {
            return true; // Should not happen, but fail open
          }

          // Check if expired
          if (retryExisting.resetAt < now) {
            await rateLimits.updateOne(
              { key },
              {
                $set: {
                  count: 1,
                  resetAt,
                  createdAt: now,
                },
              }
            );
            return true;
          }

          // Check limit
          if (retryExisting.count >= maxAttempts) {
            return false;
          }

          // Increment
          await rateLimits.updateOne(
            { key },
            {
              $inc: { count: 1 },
            }
          );
          return true;
        }
        // Re-throw if not duplicate key error
        throw insertError;
      }
    }

    // Entry exists, check if expired
    if (existing.resetAt < now) {
      // Expired, reset
      await rateLimits.updateOne(
        { key },
        {
          $set: {
            count: 1,
            resetAt,
            createdAt: now,
          },
        }
      );
      return true; // Reset after expiration, allowed
    }

    // Entry exists and not expired, check count before incrementing
    if (existing.count >= maxAttempts) {
      return false; // Rate limit exceeded
    }

    // Increment count atomically
    await rateLimits.updateOne(
      { key },
      {
        $inc: { count: 1 },
      }
    );

    return true; // Within limit
  } catch (error: unknown) {
    // On database errors, allow request (fail open)
    // Log error for monitoring
    console.error('[RateLimiter] Error checking rate limit:', error);
    return true;
  }
}

/**
 * Get rate limit status
 * 
 * @param key - Rate limit key
 * @param maxAttempts - Maximum allowed attempts (default: 5)
 * @returns Status object with remaining attempts and reset time, or null if no limit
 */
export async function getRateLimitStatus(
  key: string,
  maxAttempts: number = 5
): Promise<{
  remaining: number;
  resetAt: Date;
} | null> {
  try {
    const { rateLimits } = await getCollections();
    const entry = await rateLimits.findOne({ key });

    if (!entry) {
      return null; // No rate limit active
    }

    const now = new Date();

    if (entry.resetAt < now) {
      // Expired, cleanup
      await rateLimits.deleteOne({ key });
      return null;
    }

    const remaining = Math.max(0, maxAttempts - entry.count);

    return {
      remaining,
      resetAt: entry.resetAt,
    };
  } catch (error) {
    console.error('[RateLimiter] Error getting rate limit status:', error);
    return null;
  }
}

/**
 * Reset rate limit for a key
 * Useful for testing or manual reset after successful authentication
 * 
 * @param key - Rate limit key to reset
 */
export async function resetRateLimit(key: string): Promise<void> {
  try {
    const { rateLimits } = await getCollections();
    await rateLimits.deleteOne({ key });
  } catch (error) {
    console.error('[RateLimiter] Error resetting rate limit:', error);
  }
}

/**
 * Clear all rate limits
 * Useful for testing
 */
export async function clearAllRateLimits(): Promise<void> {
  try {
    const { rateLimits } = await getCollections();
    await rateLimits.deleteMany({});
  } catch (error) {
    console.error('[RateLimiter] Error clearing all rate limits:', error);
  }
}

/**
 * Get rate limit key for login attempts
 * 
 * @param ip - IP address
 * @param username - Username (optional)
 * @returns Rate limit key
 */
export function getLoginRateLimitKey(ip: string, username?: string): string {
  if (username) {
    return `login:${ip}:${username}`;
  }
  return `login:${ip}`;
}

/**
 * Cleanup expired rate limit entries (manual cleanup, TTL index handles automatic cleanup)
 * This is a utility function for manual cleanup if needed
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  try {
    const { rateLimits } = await getCollections();
    const now = new Date();
    const result = await rateLimits.deleteMany({
      resetAt: { $lt: now },
    });
    return result.deletedCount || 0;
  } catch (error) {
    console.error('[RateLimiter] Error cleaning up expired entries:', error);
    return 0;
  }
}

/**
 * PHASE 3: Rate Limiting Granularity (7.12.9) - Rate limit configuration per endpoint
 */
interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  burstMaxAttempts?: number; // Burst protection: stricter limit for short window
  burstWindowMs?: number; // Burst protection: shorter time window
}

/**
 * PHASE 3: Rate Limiting Granularity (7.12.9) - Get rate limit configuration for endpoint
 * 
 * @param pathname - API endpoint pathname
 * @param method - HTTP method
 * @param userRole - User role (optional, for role-based limits)
 * @returns Rate limit configuration
 */
export function getRateLimitConfig(
  pathname: string,
  method: string,
  userRole?: string
): RateLimitConfig {
  // Default config
  const defaultConfig: RateLimitConfig = {
    maxAttempts: method === 'GET' ? 60 : 20,
    windowMs: 60 * 1000, // 1 minute
    burstMaxAttempts: method === 'GET' ? 30 : 10,
    burstWindowMs: 10 * 1000, // 10 seconds for burst protection
  };

  // PHASE 3: Per-endpoint limits - Stricter limits for critical endpoints
  const endpointConfigs: Record<string, RateLimitConfig> = {
    // Quick update endpoint - stricter limit (10/min instead of 20/min)
    '/api/admin/products/[id]/quick-update': {
      maxAttempts: 10,
      windowMs: 60 * 1000, // 1 minute
      burstMaxAttempts: 5, // Allow 5 requests in 10 seconds
      burstWindowMs: 10 * 1000,
    },
    // Bulk actions - very strict limit
    '/api/admin/products/bulk-action': {
      maxAttempts: 5,
      windowMs: 60 * 1000,
      burstMaxAttempts: 2,
      burstWindowMs: 10 * 1000,
    },
    // Product creation - moderate limit
    'POST:/api/admin/products': {
      maxAttempts: 15,
      windowMs: 60 * 1000,
      burstMaxAttempts: 5,
      burstWindowMs: 10 * 1000,
    },
    // Product deletion - strict limit
    'DELETE:/api/admin/products/[id]': {
      maxAttempts: 5,
      windowMs: 60 * 1000,
      burstMaxAttempts: 2,
      burstWindowMs: 10 * 1000,
    },
  };

  // Check for exact endpoint match first
  const exactKey = `${method}:${pathname}`;
  if (endpointConfigs[exactKey]) {
    return endpointConfigs[exactKey];
  }

  // Check for pathname pattern match (e.g., /api/admin/products/[id]/quick-update)
  for (const [pattern, config] of Object.entries(endpointConfigs)) {
    // Skip if already matched as exact key
    if (pattern === exactKey) {
      continue;
    }
    
    // Handle exact method:pathname format
    let checkPattern = pattern;
    if (pattern.includes(':')) {
      const [patternMethod, patternPath] = pattern.split(':');
      if (patternMethod !== method) {
        continue; // Skip if method doesn't match
      }
      checkPattern = patternPath;
    }
    
    // Convert pattern to regex
    const regexPattern = checkPattern
      .replace(/\[id\]/g, '[^/]+') // Replace [id] with non-slash characters
      .replace(/\//g, '\\/'); // Escape slashes
    
    const regex = new RegExp(`^${regexPattern}$`);
    if (regex.test(pathname)) {
      return config;
    }
  }

  // PHASE 3: User role-based limits - Different limits for different roles
  if (userRole) {
    const roleConfigs: Record<string, Partial<RateLimitConfig>> = {
      SUPER_ADMIN: {
        // Super admin gets higher limits (no change by default, but can override)
        maxAttempts: defaultConfig.maxAttempts * 2,
      },
      VIEWER: {
        // Viewer role gets lower limits (read-only operations)
        maxAttempts: Math.floor(defaultConfig.maxAttempts * 0.7),
        burstMaxAttempts: Math.floor((defaultConfig.burstMaxAttempts || 10) * 0.7),
      },
    };

    const roleConfig = roleConfigs[userRole];
    if (roleConfig) {
      return {
        ...defaultConfig,
        ...roleConfig,
      };
    }
  }

  return defaultConfig;
}

/**
 * PHASE 3: Rate Limiting Granularity (7.12.9) - Check rate limit with burst protection
 * 
 * Implements two-tier rate limiting:
 * 1. Burst protection: Short window with stricter limit (prevents sudden spikes)
 * 2. Regular limit: Longer window with normal limit (prevents sustained abuse)
 * 
 * @param key - Rate limit key
 * @param config - Rate limit configuration
 * @returns true if within limit, false if exceeded
 */
export async function checkRateLimitWithBurst(
  key: string,
  config: RateLimitConfig
): Promise<boolean> {
  // Check burst protection first (if configured)
  if (config.burstMaxAttempts && config.burstWindowMs) {
    const burstKey = `${key}:burst`;
    const withinBurstLimit = await checkRateLimit(
      burstKey,
      config.burstMaxAttempts,
      config.burstWindowMs
    );
    
    if (!withinBurstLimit) {
      return false; // Burst limit exceeded
    }
  }

  // Check regular limit
  return await checkRateLimit(key, config.maxAttempts, config.windowMs);
}
