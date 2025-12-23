/**
 * Media API Type Definitions
 * 
 * Types for Media Library API routes
 * 
 * @see app/api/admin/media/
 */

import { MediaType, MediaFilters, MediaSort } from '../media';

/**
 * Upload Media Request
 * 
 * POST /api/admin/media
 * Content-Type: multipart/form-data
 */
export interface UploadMediaRequest {
  file: File;
  name?: string;           // Optional: custom name
  altText?: string;         // Optional: alt text
  folder?: string;          // Optional: folder path
}

/**
 * Upload Media Response
 * 
 * Response after successful upload
 */
export interface UploadMediaResponse {
  success: true;
  data: {
    _id: string;
    name: string;
    filename: string;
    url: string;
    path: string;
    type: MediaType;
    mimeType: string;
    extension: string;
    size: number;
    width?: number;
    height?: number;
    folder?: string;
    altText?: string;
    caption?: string;
    description?: string;
    uploadedBy?: string;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Get Media List Request
 * 
 * GET /api/admin/media
 * Query params
 */
export interface GetMediaListRequest {
  page?: number;           // Default: 1
  limit?: number;          // Default: 20
  type?: MediaType;        // Filter by type
  search?: string;         // Text search
  sort?: MediaSort;        // Sort option
  folder?: string;         // Filter by folder
}

/**
 * Get Media List Response
 * 
 * Response for media list endpoint
 */
export interface GetMediaListResponse {
  success: true;
  data: Array<{
    _id: string;
    name: string;
    filename: string;
    url: string;
    path: string;
    type: MediaType;
    mimeType: string;
    extension: string;
    size: number;
    width?: number;
    height?: number;
    folder?: string;
    altText?: string;
    caption?: string;
    description?: string;
    uploadedBy?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Get Media Detail Request
 * 
 * GET /api/admin/media/[id]
 */
export interface GetMediaDetailRequest {
  id: string;
}

/**
 * Get Media Detail Response
 * 
 * Response for single media detail
 */
export interface GetMediaDetailResponse {
  success: true;
  data: {
    _id: string;
    name: string;
    filename: string;
    url: string;
    path: string;
    type: MediaType;
    mimeType: string;
    extension: string;
    size: number;
    width?: number;
    height?: number;
    folder?: string;
    altText?: string;
    caption?: string;
    description?: string;
    uploadedBy?: string;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Update Media Request
 * 
 * PUT /api/admin/media/[id]
 * Body: JSON
 */
export interface UpdateMediaRequest {
  name?: string;
  altText?: string;
  caption?: string;
  description?: string;
  folder?: string;
}

/**
 * Update Media Response
 * 
 * Response after successful update
 */
export interface UpdateMediaResponse {
  success: true;
  data: {
    _id: string;
    name: string;
    filename: string;
    url: string;
    path: string;
    type: MediaType;
    mimeType: string;
    extension: string;
    size: number;
    width?: number;
    height?: number;
    folder?: string;
    altText?: string;
    caption?: string;
    description?: string;
    uploadedBy?: string;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Delete Media Request
 * 
 * DELETE /api/admin/media/[id]
 */
export interface DeleteMediaRequest {
  id: string;
}

/**
 * Delete Media Response
 * 
 * Response after successful deletion
 */
export interface DeleteMediaResponse {
  success: true;
  message: string;
}

/**
 * API Error Response
 * 
 * Standard error response format
 */
export interface MediaApiErrorResponse {
  success: false;
  error: string;
  details?: Record<string, any>;
}
