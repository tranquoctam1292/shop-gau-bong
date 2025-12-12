/**
 * Vercel Blob Storage Utility
 * 
 * Functions for uploading, deleting, and managing media files in Vercel Blob Storage
 */

import { put, del, list, head } from '@vercel/blob';

export interface BlobUploadOptions {
  access?: 'public' | 'private';
  addRandomSuffix?: boolean;
  contentType?: string;
  cacheControlMaxAge?: number;
}

export interface BlobFile {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
  contentType: string;
}

/**
 * Upload a file to Vercel Blob Storage
 * 
 * @param file - File or Buffer to upload
 * @param filename - Desired filename (will be prefixed with timestamp)
 * @param options - Upload options
 * @returns Blob file information
 */
export async function uploadToBlob(
  file: File | Buffer,
  filename: string,
  options: BlobUploadOptions = {}
): Promise<BlobFile> {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pathname = `media/${timestamp}-${sanitizedFilename}`;

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

    // Upload to Vercel Blob
    const blob = await put(pathname, buffer, {
      access: options.access || 'public',
      addRandomSuffix: options.addRandomSuffix ?? false,
      contentType: contentType,
      cacheControlMaxAge: options.cacheControlMaxAge,
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
      contentType: blob.contentType || contentType || 'application/octet-stream',
    };
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    throw new Error('Failed to upload file to Vercel Blob Storage');
  }
}

/**
 * Delete a file from Vercel Blob Storage
 * 
 * @param url - URL of the blob to delete
 */
export async function deleteFromBlob(url: string): Promise<void> {
  try {
    await del(url);
  } catch (error) {
    console.error('Error deleting from Vercel Blob:', error);
    throw new Error('Failed to delete file from Vercel Blob Storage');
  }
}

/**
 * List files in Vercel Blob Storage
 * 
 * @param prefix - Optional prefix to filter files (e.g., 'media/')
 * @param limit - Maximum number of files to return
 * @returns List of blob files
 */
export async function listBlobFiles(
  prefix?: string,
  limit: number = 1000
): Promise<BlobFile[]> {
  try {
    const { blobs } = await list({
      prefix: prefix || 'media/',
      limit,
    });

    return blobs.map((blob) => ({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
      contentType: blob.contentType || 'application/octet-stream',
    }));
  } catch (error) {
    console.error('Error listing Vercel Blob files:', error);
    throw new Error('Failed to list files from Vercel Blob Storage');
  }
}

/**
 * Get file metadata from Vercel Blob Storage
 * 
 * @param url - URL of the blob
 * @returns Blob file information
 */
export async function getBlobMetadata(url: string): Promise<BlobFile | null> {
  try {
    const blob = await head(url);
    if (!blob) return null;

    return {
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
      contentType: blob.contentType || 'application/octet-stream',
    };
  } catch (error) {
    console.error('Error getting blob metadata:', error);
    return null;
  }
}

/**
 * Check if a URL is a Vercel Blob URL
 */
export function isBlobUrl(url: string): boolean {
  return url.includes('blob.vercel-storage.com') || url.includes('public.blob.vercel-storage.com');
}

/**
 * Extract blob pathname from URL
 */
export function getBlobPathname(url: string): string | null {
  if (!isBlobUrl(url)) return null;
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    return null;
  }
}
