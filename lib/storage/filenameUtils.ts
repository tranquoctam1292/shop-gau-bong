/**
 * Filename Utilities
 * 
 * Helper functions for generating unique filenames
 * 
 * Ensures filenames are always unique to prevent conflicts
 */

import { randomUUID } from 'crypto';

/**
 * Generate a unique filename with timestamp and UUID
 * 
 * Format: TIMESTAMP-UUID-originalname.ext
 * 
 * This ensures:
 * - Timestamp provides chronological ordering
 * - UUID ensures uniqueness even if multiple uploads happen at the same millisecond
 * - Original name is preserved for readability
 * 
 * @param originalFilename - Original filename from user
 * @returns Unique filename
 * 
 * @example
 * generateUniqueFilename('image.jpg') 
 * // Returns: '1735123456789-550e8400-e29b-41d4-a716-446655440000-image.jpg'
 */
export function generateUniqueFilename(originalFilename: string): string {
  // Extract extension
  const lastDotIndex = originalFilename.lastIndexOf('.');
  const nameWithoutExt = lastDotIndex > 0 
    ? originalFilename.substring(0, lastDotIndex)
    : originalFilename;
  const extension = lastDotIndex > 0 
    ? originalFilename.substring(lastDotIndex)
    : '';

  // Sanitize filename (remove special characters)
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9.-]/g, '_');

  // Generate unique identifier: timestamp + UUID
  const timestamp = Date.now();
  const uuid = randomUUID().replace(/-/g, ''); // Remove dashes for shorter filename

  // Combine: timestamp-uuid-sanitizedname.ext
  return `${timestamp}-${uuid}-${sanitizedName}${extension}`;
}

/**
 * Generate a shorter unique filename (timestamp only)
 * 
 * Format: TIMESTAMP-originalname.ext
 * 
 * Use this if you want shorter filenames (less unique but still very unlikely to conflict)
 * 
 * @param originalFilename - Original filename from user
 * @returns Unique filename with timestamp
 */
export function generateTimestampFilename(originalFilename: string): string {
  const lastDotIndex = originalFilename.lastIndexOf('.');
  const nameWithoutExt = lastDotIndex > 0 
    ? originalFilename.substring(0, lastDotIndex)
    : originalFilename;
  const extension = lastDotIndex > 0 
    ? originalFilename.substring(lastDotIndex)
    : '';

  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();

  return `${timestamp}-${sanitizedName}${extension}`;
}
