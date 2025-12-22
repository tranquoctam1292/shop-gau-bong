/**
 * Storage Service Interface
 * 
 * Adapter pattern for storage implementations
 * 
 * Allows switching between different storage providers (Vercel Blob, S3, Local, etc.)
 * without changing business logic.
 * 
 * @see docs/MEDIA_LIBRARY_IMPLEMENTATION_PLAN.md
 */

import type { UploadOptions, StorageResult, StorageMetadata } from './types';

/**
 * Storage Service Interface
 * 
 * All storage implementations must implement this interface
 */
export interface IStorageService {
  /**
   * Upload a file to storage
   * 
   * @param file - File buffer or File object
   * @param filename - Desired filename
   * @param options - Upload options
   * @returns Storage result with URL and path
   */
  upload(
    file: Buffer | File,
    filename: string,
    options?: UploadOptions
  ): Promise<StorageResult>;

  /**
   * Delete a file from storage
   * 
   * @param path - Storage path/key (not URL)
   * @returns true if deleted, false if not found
   */
  delete(path: string): Promise<boolean>;

  /**
   * Get public URL for a storage path
   * 
   * @param path - Storage path/key
   * @returns Public URL
   */
  getUrl(path: string): string;

  /**
   * Get file metadata
   * 
   * @param path - Storage path/key
   * @returns Metadata or null if not found
   */
  getMetadata(path: string): Promise<StorageMetadata | null>;

  /**
   * Check if a file exists
   * 
   * @param path - Storage path/key
   * @returns true if exists, false otherwise
   */
  exists(path: string): Promise<boolean>;

  /**
   * Move a file from one path to another
   * 
   * @param fromPath - Current storage path/key
   * @param toPath - New storage path/key
   * @returns Storage result with new URL and path, or null if failed
   */
  move(fromPath: string, toPath: string): Promise<StorageResult | null>;
}
