/**
 * Vercel Blob Storage Service Implementation
 * 
 * Implements IStorageService for Vercel Blob Storage
 * 
 * Wraps existing vercelBlob utility functions
 * 
 * @see lib/utils/vercelBlob.ts
 */

import { uploadToBlob, deleteFromBlob, getBlobMetadata, getBlobPathname, isBlobUrl } from '@/lib/utils/vercelBlob';
import { generateUniqueFilename } from './filenameUtils';
import type { IStorageService } from './StorageService';
import type { UploadOptions, StorageResult, StorageMetadata } from './types';

export class VercelBlobStorageService implements IStorageService {
  /**
   * Upload a file to Vercel Blob Storage
   */
  async upload(
    file: Buffer | File,
    filename: string,
    options: UploadOptions = {}
  ): Promise<StorageResult> {
    try {
      // Generate unique filename (timestamp + UUID) to prevent conflicts
      const uniqueFilename = generateUniqueFilename(filename);
      
      // Generate path with folder prefix
      const folder = options.folder || 'media';
      const pathname = `${folder}/${uniqueFilename}`;

      // Convert File to Buffer if needed
      let buffer: Buffer;
      let contentType = options.contentType;

      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        contentType = contentType || file.type;
      } else {
        buffer = file;
      }

      // Upload using existing utility
      const blobFile = await uploadToBlob(buffer, pathname, {
        access: options.access || 'public',
        addRandomSuffix: options.addRandomSuffix ?? false,
        contentType: contentType,
        cacheControlMaxAge: options.cacheControlMaxAge || 31536000, // 1 year default
      });

      return {
        url: blobFile.url,
        path: blobFile.pathname,
        size: blobFile.size,
        contentType: blobFile.contentType,
        uploadedAt: blobFile.uploadedAt,
      };
    } catch (error) {
      console.error('VercelBlobStorageService.upload error:', error);
      throw new Error('Failed to upload file to Vercel Blob Storage');
    }
  }

  /**
   * Delete a file from Vercel Blob Storage
   * 
   * @param path - Storage pathname or URL
   * Note: Vercel Blob delete requires URL. If path is a pathname, 
   * use deleteByUrl() method instead with the full URL.
   */
  async delete(path: string): Promise<boolean> {
    try {
      // If path is already a URL, use it directly
      if (isBlobUrl(path)) {
        await deleteFromBlob(path);
        return true;
      }
      
      // If path is a pathname, we can't delete without URL
      // This is expected - media documents should store URL, not just pathname
      // Return false (file not found) instead of throwing
      console.warn('VercelBlobStorageService.delete: Path is not a URL. Use deleteByUrl() with full URL instead.');
      return false;
    } catch (error) {
      console.error('VercelBlobStorageService.delete error:', error);
      // If file not found, return false instead of throwing
      if (error instanceof Error && (error.message.includes('not found') || error.message.includes('404'))) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get public URL for a storage path
   * 
   * Note: Vercel Blob URLs are already public URLs
   * If path is a pathname, we can't construct URL without domain
   * This is a limitation - we should store full URL in database
   */
  getUrl(path: string): string {
    // If already a URL, return as-is
    if (isBlobUrl(path)) {
      return path;
    }
    
    // If path is a pathname, we can't construct full URL
    // This is a limitation - should store URL in database
    // For now, return path as-is (may not work for direct access)
    console.warn('VercelBlobStorageService.getUrl: Path is not a full URL. Store URL in database instead of pathname.');
    return path;
  }

  /**
   * Get file metadata
   */
  async getMetadata(path: string): Promise<StorageMetadata | null> {
    try {
      // getBlobMetadata requires URL
      let url: string;
      if (isBlobUrl(path)) {
        url = path;
      } else {
        // Can't get metadata from pathname alone
        return null;
      }

      const metadata = await getBlobMetadata(url);
      if (!metadata) {
        return null;
      }

      return {
        url: metadata.url,
        path: metadata.pathname,
        size: metadata.size,
        contentType: metadata.contentType,
        uploadedAt: metadata.uploadedAt,
      };
    } catch (error) {
      console.error('VercelBlobStorageService.getMetadata error:', error);
      return null;
    }
  }

  /**
   * Check if a file exists
   */
  async exists(path: string): Promise<boolean> {
    const metadata = await this.getMetadata(path);
    return metadata !== null;
  }

  /**
   * Delete by URL (helper method)
   * 
   * This is the recommended way to delete files
   * since Vercel Blob requires URL for deletion
   */
  async deleteByUrl(url: string): Promise<boolean> {
    try {
      await deleteFromBlob(url);
      return true;
    } catch (error) {
      console.error('VercelBlobStorageService.deleteByUrl error:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Extract pathname from URL (helper method)
   */
  getPathname(url: string): string | null {
    return getBlobPathname(url);
  }

  /**
   * Move a file from one path to another
   * 
   * Note: Vercel Blob doesn't support move/rename directly.
   * This implementation downloads the file and re-uploads it to the new path,
   * then deletes the old file.
   * 
   * @param fromPath - Current storage path or URL
   * @param toPath - New storage path (e.g., "new-folder/filename.jpg")
   * @returns Storage result with new URL and path, or null if failed
   */
  async move(fromPath: string, toPath: string): Promise<StorageResult | null> {
    try {
      // Get file URL (if fromPath is already a URL, use it; otherwise construct from path)
      let sourceUrl: string;
      if (isBlobUrl(fromPath)) {
        sourceUrl = fromPath;
      } else {
        // Can't move without URL - this is a limitation
        console.error('VercelBlobStorageService.move: Cannot move file without URL. fromPath must be a full URL.');
        return null;
      }

      // Download file from source URL
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        console.error(`VercelBlobStorageService.move: Failed to download file from ${sourceUrl}`);
        return null;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      // Upload to new path
      const blobFile = await uploadToBlob(buffer, toPath, {
        access: 'public',
        addRandomSuffix: false,
        contentType,
        cacheControlMaxAge: 31536000, // 1 year
      });

      // Delete old file
      try {
        await deleteFromBlob(sourceUrl);
      } catch (deleteError) {
        // Log but don't fail - file is already in new location
        console.warn(`VercelBlobStorageService.move: Failed to delete old file ${sourceUrl}:`, deleteError);
      }

      return {
        url: blobFile.url,
        path: blobFile.pathname,
        size: blobFile.size,
        contentType: blobFile.contentType,
        uploadedAt: blobFile.uploadedAt,
      };
    } catch (error) {
      console.error('VercelBlobStorageService.move error:', error);
      return null;
    }
  }
}
