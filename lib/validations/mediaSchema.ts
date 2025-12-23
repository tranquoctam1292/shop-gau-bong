/**
 * Media Validation Schemas
 * 
 * Zod schemas for Media Library API routes
 * 
 * @see docs/MEDIA_LIBRARY_IMPLEMENTATION_PLAN.md
 */

import { z } from 'zod';

/**
 * Media Type enum
 */
export const mediaTypeSchema = z.enum(['image', 'video', 'document', 'other']);

/**
 * Media Sort enum
 */
export const mediaSortSchema = z.enum(['newest', 'oldest', 'name', 'size']);

/**
 * Upload Media Request Schema
 * 
 * For multipart/form-data upload
 * Note: File validation is done in API route, not in Zod schema
 */
export const uploadMediaSchema = z.object({
  name: z.string().min(1, 'Tên không được để trống').max(255, 'Tên không được vượt quá 255 ký tự').optional(),
  altText: z.string().max(500, 'Alt text không được vượt quá 500 ký tự').optional(),
  folder: z.string().max(255, 'Folder path không được vượt quá 255 ký tự').optional(),
});

/**
 * Update Media Request Schema
 * 
 * Only updatable fields
 * 
 * Note: When folder is updated, the physical file will be moved in storage
 * and path/url will be updated accordingly.
 */
export const updateMediaSchema = z.object({
  name: z.string().min(1, 'Tên không được để trống').max(255, 'Tên không được vượt quá 255 ký tự').optional(),
  altText: z.string().max(500, 'Alt text không được vượt quá 500 ký tự').optional(),
  caption: z.string().max(1000, 'Caption không được vượt quá 1000 ký tự').optional(),
  description: z.string().max(5000, 'Mô tả không được vượt quá 5000 ký tự').optional(),
  folder: z.string().max(255, 'Folder path không được vượt quá 255 ký tự').optional(), // ✅ UPDATABLE: File will be physically moved
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'Phải có ít nhất một trường để cập nhật',
  }
);

/**
 * Get Media List Query Schema
 * 
 * For GET /api/admin/media query params
 */
export const getMediaListSchema = z.object({
  page: z.coerce.number().int().min(1, 'Page phải lớn hơn 0').default(1).optional(),
  limit: z.coerce.number().int().min(1, 'Limit phải lớn hơn 0').max(100, 'Limit không được vượt quá 100').default(20).optional(),
  type: mediaTypeSchema.optional(),
  search: z.string().max(255, 'Search query không được vượt quá 255 ký tự').optional(),
  sort: mediaSortSchema.default('newest').optional(),
  folder: z.string().max(255, 'Folder path không được vượt quá 255 ký tự').optional(),
  uploadedBy: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format').optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  minSize: z.coerce.number().int().min(0, 'Min size không được âm').optional(),
  maxSize: z.coerce.number().int().min(0, 'Max size không được âm').optional(),
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return data.dateFrom <= data.dateTo;
    }
    return true;
  },
  {
    message: 'dateFrom phải nhỏ hơn hoặc bằng dateTo',
    path: ['dateFrom'],
  }
).refine(
  (data) => {
    if (data.minSize && data.maxSize) {
      return data.minSize <= data.maxSize;
    }
    return true;
  },
  {
    message: 'minSize phải nhỏ hơn hoặc bằng maxSize',
    path: ['minSize'],
  }
);

/**
 * Get Media Detail Params Schema
 * 
 * For GET /api/admin/media/[id]
 */
export const getMediaDetailSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format'),
});

/**
 * Update Media Params Schema
 * 
 * For PUT /api/admin/media/[id]
 */
export const updateMediaParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format'),
});

/**
 * Delete Media Params Schema
 * 
 * For DELETE /api/admin/media/[id]
 */
export const deleteMediaParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format'),
});

/**
 * File Upload Validation (for API route)
 * 
 * These are not Zod schemas but validation helpers
 */
export const FILE_UPLOAD_CONSTRAINTS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml', // SVG support for custom icons
  ],
  ALLOWED_VIDEO_TYPES: [
    'video/mp4',
    'video/webm',
    'video/ogg',
  ],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;

/**
 * Get allowed MIME types for a media type
 */
export function getAllowedMimeTypes(type: 'image' | 'video' | 'document'): string[] {
  switch (type) {
    case 'image':
      return [...FILE_UPLOAD_CONSTRAINTS.ALLOWED_IMAGE_TYPES];
    case 'video':
      return [...FILE_UPLOAD_CONSTRAINTS.ALLOWED_VIDEO_TYPES];
    case 'document':
      return [...FILE_UPLOAD_CONSTRAINTS.ALLOWED_DOCUMENT_TYPES];
    default:
      return [];
  }
}

/**
 * Validate file MIME type
 */
export function isValidMimeType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType);
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number, maxSize: number = FILE_UPLOAD_CONSTRAINTS.MAX_FILE_SIZE): boolean {
  return size > 0 && size <= maxSize;
}
