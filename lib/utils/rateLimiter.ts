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

    // Try to find existing entry
    const existing = await rateLimits.findOne({ key });

    if (!existing) {
      // No entry exists, create new one
      await rateLimits.insertOne({
        key,
        count: 1,
        resetAt,
        createdAt: now,
      });
      return true; // First attempt, allowed
    }

    // Check if entry is expired
    if (existing.resetAt < now) {
      // Expired, reset and create new entry
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

    // Entry exists and not expired, check count
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
  } catch (error) {
    // On database error, allow request (fail open)
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
