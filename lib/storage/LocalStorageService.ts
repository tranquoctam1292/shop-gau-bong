/**
 * Local Storage Service Implementation
 * 
 * Implements IStorageService for local file system storage
 * 
 * Used for development/testing. Files are stored in public/uploads/YYYY/MM/
 * 
 * @see docs/MEDIA_LIBRARY_IMPLEMENTATION_PLAN.md
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';
import { generateUniqueFilename } from './filenameUtils';
import type { IStorageService } from './StorageService';
import type { UploadOptions, StorageResult, StorageMetadata } from './types';

export class LocalStorageService implements IStorageService {
  private baseDir: string;
  private publicUrl: string;

  constructor() {
    // Store files in public/uploads/ for Next.js to serve them
    this.baseDir = join(process.cwd(), 'public', 'uploads');
    // Base URL for public access
    this.publicUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectory(dir: string): Promise<void> {
    if (!existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Generate storage path with date-based folder structure
   */
  private generatePath(filename: string, folder?: string): { fullPath: string; relativePath: string } {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    const baseFolder = folder || 'media';
    const dateFolder = `${year}/${month}`;
    const relativePath = `${baseFolder}/${dateFolder}/${filename}`;
    const fullPath = join(this.baseDir, relativePath);

    return { fullPath, relativePath };
  }

  /**
   * Upload a file to local storage
   */
  async upload(
    file: Buffer | File,
    filename: string,
    options: UploadOptions = {}
  ): Promise<StorageResult> {
    try {
      // Generate unique filename (timestamp + UUID) to prevent conflicts
      const uniqueFilename = generateUniqueFilename(filename);

      // Generate path
      const { fullPath, relativePath } = this.generatePath(uniqueFilename, options.folder);

      // Ensure directory exists
      await this.ensureDirectory(join(fullPath, '..'));

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

      // Write file
      await fs.writeFile(fullPath, buffer);

      // Generate public URL
      const url = `${this.publicUrl}/uploads/${relativePath}`;

      return {
        url,
        path: relativePath,
        size: buffer.length,
        contentType: contentType || 'application/octet-stream',
        uploadedAt: new Date(),
      };
    } catch (error) {
      console.error('LocalStorageService.upload error:', error);
      throw new Error('Failed to upload file to local storage');
    }
  }

  /**
   * Delete a file from local storage
   */
  async delete(path: string): Promise<boolean> {
    try {
      const fullPath = join(this.baseDir, path);
      
      if (!existsSync(fullPath)) {
        return false;
      }

      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      console.error('LocalStorageService.delete error:', error);
      return false;
    }
  }

  /**
   * Get public URL for a storage path
   */
  getUrl(path: string): string {
    return `${this.publicUrl}/uploads/${path}`;
  }

  /**
   * Get file metadata
   */
  async getMetadata(path: string): Promise<StorageMetadata | null> {
    try {
      const fullPath = join(this.baseDir, path);
      
      if (!existsSync(fullPath)) {
        return null;
      }

      const stats = await fs.stat(fullPath);
      const url = this.getUrl(path);

      // Try to infer content type from extension
      const ext = path.split('.').pop()?.toLowerCase();
      const contentTypeMap: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        mp4: 'video/mp4',
        pdf: 'application/pdf',
      };
      const contentType = ext ? contentTypeMap[ext] || 'application/octet-stream' : 'application/octet-stream';

      return {
        url,
        path,
        size: stats.size,
        contentType,
        uploadedAt: stats.birthtime,
        lastModified: stats.mtime,
      };
    } catch (error) {
      console.error('LocalStorageService.getMetadata error:', error);
      return null;
    }
  }

  /**
   * Check if a file exists
   */
  async exists(path: string): Promise<boolean> {
    const fullPath = join(this.baseDir, path);
    return existsSync(fullPath);
  }
}
