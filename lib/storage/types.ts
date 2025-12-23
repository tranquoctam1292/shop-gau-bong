/**
 * Storage Service Types
 * 
 * Types for Storage Service implementations
 * 
 * @see docs/MEDIA_LIBRARY_IMPLEMENTATION_PLAN.md
 */

/**
 * Upload Options
 * 
 * Options for file upload operations
 */
export interface UploadOptions {
  /**
   * Access level: 'public' or 'private'
   * Default: 'public'
   */
  access?: 'public' | 'private';
  
  /**
   * Content type (MIME type)
   * If not provided, will be inferred from file
   */
  contentType?: string;
  
  /**
   * Cache control max age in seconds
   * Default: 31536000 (1 year)
   */
  cacheControlMaxAge?: number;
  
  /**
   * Add random suffix to filename
   * Default: false
   */
  addRandomSuffix?: boolean;
  
  /**
   * Custom folder/path prefix
   * Default: 'media/'
   */
  folder?: string;
}

/**
 * Storage Result
 * 
 * Result from upload operation
 */
export interface StorageResult {
  /**
   * Public URL to access the file
   */
  url: string;
  
  /**
   * Storage path/key (for deletion)
   */
  path: string;
  
  /**
   * File size in bytes
   */
  size: number;
  
  /**
   * Content type (MIME type)
   */
  contentType: string;
  
  /**
   * Upload timestamp
   */
  uploadedAt?: Date;
}

/**
 * Storage Metadata
 * 
 * Metadata about a stored file
 */
export interface StorageMetadata {
  url: string;
  path: string;
  size: number;
  contentType: string;
  uploadedAt?: Date;
  lastModified?: Date;
}
