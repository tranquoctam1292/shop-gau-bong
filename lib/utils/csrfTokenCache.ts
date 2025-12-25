/**
 * CSRF Token Cache
 * 
 * Hybrid cache: In-memory + MongoDB fallback
 * - Primary: In-memory cache (fast, but reset on hot reload)
 * - Fallback: MongoDB user document (persistent, survives hot reload)
 * 
 * Maps user ID -> { token, hash, expiresAt }
 */

import { getCollections, ObjectId } from '@/lib/db';

interface CsrfTokenEntry {
  token: string;
  hash: string;
  expiresAt: number; // Timestamp
}

const CSRF_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const csrfTokenCache = new Map<string, CsrfTokenEntry>();

/**
 * Store CSRF token for a user
 * Uses hybrid approach: In-memory cache + MongoDB fallback
 */
export async function storeCsrfToken(userId: string, token: string, hash: string): Promise<void> {
  // Normalize userId to string for consistent storage
  const normalizedUserId = String(userId);
  const expiresAt = Date.now() + CSRF_TOKEN_TTL_MS;
  
  // Store in in-memory cache (primary, fast access)
  csrfTokenCache.set(normalizedUserId, {
    token,
    hash,
    expiresAt,
  });
  
  // Also store in MongoDB as fallback (survives hot reload)
  try {
    const { adminUsers } = await getCollections();
    await adminUsers.updateOne(
      { _id: new ObjectId(normalizedUserId) },
      { 
        $set: { 
          csrfTokenHash: hash,
          csrfTokenExpiresAt: new Date(expiresAt),
        } 
      }
    );
  } catch (error) {
    // Log error but don't fail - in-memory cache is still available
    console.error('[CSRF Token Cache] Failed to store token in MongoDB:', error);
  }
  
  // Log for debugging (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('[CSRF Token Cache] Stored token for userId:', normalizedUserId);
  }
}

/**
 * Get CSRF token hash for a user
 * Uses hybrid approach: Check in-memory cache first, fallback to MongoDB
 */
export async function getCsrfTokenHash(userId: string): Promise<string | null> {
  // Normalize userId to string for consistent lookup
  const normalizedUserId = String(userId);
  
  // Check in-memory cache first (fast path)
  const entry = csrfTokenCache.get(normalizedUserId);
  if (entry) {
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      csrfTokenCache.delete(normalizedUserId);
      return null;
    }
    return entry.hash;
  }
  
  // Cache miss - check MongoDB (fallback for hot reload scenarios)
  try {
    const { adminUsers } = await getCollections();
    const user = await adminUsers.findOne(
      { _id: new ObjectId(normalizedUserId) },
      { projection: { csrfTokenHash: 1, csrfTokenExpiresAt: 1 } }
    );
    
    if (user && (user as any).csrfTokenHash && (user as any).csrfTokenExpiresAt) {
      const expiresAt = new Date((user as any).csrfTokenExpiresAt).getTime();
      
      // Check if expired
      if (Date.now() > expiresAt) {
        // Clean up expired token
        await adminUsers.updateOne(
          { _id: new ObjectId(normalizedUserId) },
          { $unset: { csrfTokenHash: 1, csrfTokenExpiresAt: 1 } }
        );
        return null;
      }
      
      // Restore to in-memory cache for future requests
      csrfTokenCache.set(normalizedUserId, {
        token: '', // We don't store plain token in MongoDB for security
        hash: (user as any).csrfTokenHash,
        expiresAt,
      });
      
      return (user as any).csrfTokenHash;
    }
  } catch (error) {
    // Log error but return null (graceful degradation)
    console.error('[CSRF Token Cache] Failed to get token from MongoDB:', error);
  }
  
  return null;
}

/**
 * Verify CSRF token for a user
 * Uses async getCsrfTokenHash (supports MongoDB fallback)
 */
export async function verifyCsrfTokenForUser(userId: string, token: string, secret: string, hashCsrfTokenFn: (token: string, secret: string) => string): Promise<boolean> {
  // Normalize userId to string for consistent lookup
  const normalizedUserId = String(userId);
  const storedHash = await getCsrfTokenHash(normalizedUserId);
  if (!storedHash) {
    // Log for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.error('[CSRF Token Cache] No stored hash found for userId:', normalizedUserId);
      console.error('[CSRF Token Cache] Available userIds in cache:', Array.from(csrfTokenCache.keys()));
    }
    return false;
  }

  const tokenHash = hashCsrfTokenFn(token, secret);
  const isValid = storedHash === tokenHash;
  
  // Log for debugging (development only)
  if (process.env.NODE_ENV === 'development' && !isValid) {
    console.error('[CSRF Token Cache] Token hash mismatch for userId:', normalizedUserId);
    console.error('[CSRF Token Cache] Stored hash:', storedHash.substring(0, 20) + '...');
    console.error('[CSRF Token Cache] Computed hash:', tokenHash.substring(0, 20) + '...');
  }
  
  return isValid;
}

/**
 * Clear CSRF token for a user (e.g., on logout)
 * Clears both in-memory cache and MongoDB
 */
export async function clearCsrfToken(userId: string): Promise<void> {
  // Normalize userId to string for consistent deletion
  const normalizedUserId = String(userId);
  
  // Clear from in-memory cache
  csrfTokenCache.delete(normalizedUserId);
  
  // Also clear from MongoDB
  try {
    const { adminUsers } = await getCollections();
    await adminUsers.updateOne(
      { _id: new ObjectId(normalizedUserId) },
      { $unset: { csrfTokenHash: 1, csrfTokenExpiresAt: 1 } }
    );
  } catch (error) {
    // Log error but don't fail
    console.error('[CSRF Token Cache] Failed to clear token from MongoDB:', error);
  }
}

/**
 * Clear all expired tokens (cleanup)
 */
export function clearExpiredTokens(): void {
  const now = Date.now();
  for (const [userId, entry] of csrfTokenCache.entries()) {
    if (now > entry.expiresAt) {
      csrfTokenCache.delete(userId);
    }
  }
}

// Cleanup expired tokens every hour
if (typeof setInterval !== 'undefined') {
  setInterval(clearExpiredTokens, 60 * 60 * 1000); // 1 hour
}

