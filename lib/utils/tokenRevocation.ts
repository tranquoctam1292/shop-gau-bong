/**
 * Token Revocation Utilities
 * 
 * V1.2: Support for revoking all tokens by incrementing token_version
 * When token_version changes, all existing tokens become invalid
 */

import { getCollections, ObjectId } from '@/lib/db';
import { invalidateUserStatusCache } from '@/lib/authOptions';

/**
 * Increment token_version for a user
 * This will invalidate all existing tokens (force logout all devices)
 * 
 * @param userId - Admin user ID (string or ObjectId)
 * @returns The new token_version value
 */
export async function incrementTokenVersion(userId: string | ObjectId): Promise<number> {
  const { adminUsers } = await getCollections();
  
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  const result = await adminUsers.findOneAndUpdate(
    { _id: userIdObj },
    { $inc: { token_version: 1 } },
    { returnDocument: 'after' }
  );
  
  if (!result || !result.token_version) {
    throw new Error('Failed to increment token version');
  }
  
  // ✅ PERFORMANCE: Invalidate cache when token_version changes
  // This ensures JWT callback will fetch fresh data on next request
  const userIdString = userIdObj.toString();
  invalidateUserStatusCache(userIdString);
  
  return result.token_version;
}

/**
 * Get current token_version for a user
 * 
 * @param userId - Admin user ID (string or ObjectId)
 * @returns Current token_version or 0 if not found
 */
export async function getTokenVersion(userId: string | ObjectId): Promise<number> {
  const { adminUsers } = await getCollections();
  
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  const user = await adminUsers.findOne(
    { _id: userIdObj },
    { projection: { token_version: 1 } }
  );
  
  return user?.token_version ?? 0;
}

/**
 * Verify token version matches user's current token_version
 * Used to check if token has been revoked
 * 
 * @param userId - Admin user ID (string or ObjectId)
 * @param tokenVersion - Token version from JWT
 * @returns true if token is still valid, false if revoked
 */
export async function verifyTokenVersion(
  userId: string | ObjectId,
  tokenVersion: number
): Promise<boolean> {
  const currentVersion = await getTokenVersion(userId);
  return tokenVersion === currentVersion;
}
