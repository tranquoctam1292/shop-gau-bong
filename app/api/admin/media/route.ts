/**
 * Admin Media API Route
 * GET /api/admin/media - List media (with filters)
 * POST /api/admin/media - Upload new media
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getMediaList, createMedia } from '@/lib/repositories/mediaRepository';
import { getStorageServiceSingleton } from '@/lib/storage/storageFactory';
import { 
  processImage, 
  getImageMetadata, 
  isValidImage 
} from '@/lib/services/imageProcessingService';
import { 
  uploadMediaSchema, 
  getMediaListSchema,
  FILE_UPLOAD_CONSTRAINTS,
  getAllowedMimeTypes,
  isValidMimeType,
  isValidFileSize
} from '@/lib/validations/mediaSchema';
import { handleValidationError } from '@/lib/utils/validation-errors';
import { ObjectId } from '@/lib/db';
import type { MediaType } from '@/types/media';

export const dynamic = 'force-dynamic';

/**
 * Determine media type from MIME type
 */
function getMediaTypeFromMime(mimeType: string): MediaType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('application/pdf') || 
      mimeType.includes('document') || 
      mimeType.includes('word') || 
      mimeType.includes('excel')) return 'document';
  return 'other';
}

/**
 * GET /api/admin/media
 * List media with filters and pagination
 */
export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: media:read (checked by middleware)
      // Parse query params
      const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());

    // Validate query params
    const validationResult = getMediaListSchema.safeParse(params);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid query parameters',
          details: handleValidationError(validationResult.error)
        },
        { status: 400 }
      );
    }

    const { page, limit, type, search, sort, folder, uploadedBy, dateFrom, dateTo, minSize, maxSize } = validationResult.data;

    // Build filters
    const filters: any = {};
    if (type) filters.type = type;
    if (folder) filters.folder = folder;
    if (uploadedBy) filters.uploadedBy = new ObjectId(uploadedBy);
    if (dateFrom || dateTo) {
      filters.dateFrom = dateFrom;
      filters.dateTo = dateTo;
    }
    if (minSize || maxSize) {
      filters.minSize = minSize;
      filters.maxSize = maxSize;
    }
    if (search) filters.search = search;

    // Get media list
    const result = await getMediaList(filters, { 
      page: page || 1, 
      limit: limit || 20, 
      sort: sort || 'newest' 
    });

    // Transform to API response format
    const data = result.data.map((media) => ({
      _id: media._id.toString(),
      name: media.name,
      filename: media.filename,
      url: media.url,
      path: media.path,
      type: media.type,
      mimeType: media.mimeType,
      extension: media.extension,
      folder: media.folder,
      size: media.size,
      width: media.width,
      height: media.height,
      altText: media.altText,
      caption: media.caption,
      description: media.description,
      uploadedBy: media.uploadedBy?.toString(),
      createdAt: media.createdAt.toISOString(),
      updatedAt: media.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error getting media list:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to get media list' },
      { status: 500 }
    );
  }
  }, 'media:read');
}

/**
 * POST /api/admin/media
 * Upload new media file
 */
export async function POST(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: media:upload (checked by middleware)
      const userId = req.adminUser?._id;
      // Parse form data
      const formData = await req.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string | null;
    const altText = formData.get('altText') as string | null;
    const folder = formData.get('folder') as string | null;

    // Validate file
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (!isValidFileSize(file.size, FILE_UPLOAD_CONSTRAINTS.MAX_FILE_SIZE)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `File size exceeds maximum allowed size of ${FILE_UPLOAD_CONSTRAINTS.MAX_FILE_SIZE / 1024 / 1024}MB` 
        },
        { status: 400 }
      );
    }

    // Determine media type
    const mediaType = getMediaTypeFromMime(file.type);
    const allowedTypes = getAllowedMimeTypes(mediaType as 'image' | 'video' | 'document');

    // Validate MIME type
    if (!isValidMimeType(file.type, allowedTypes)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Validate optional fields
    // Convert null to undefined for Zod validation (Zod .optional() doesn't accept null)
    const optionalFields = { 
      name: name || undefined, 
      altText: altText || undefined, 
      folder: folder || undefined 
    };
    const validationResult = uploadMediaSchema.safeParse(optionalFields);
    if (!validationResult.success) {
      console.error('Upload validation error:', validationResult.error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid form data',
          details: handleValidationError(validationResult.error)
        },
        { status: 400 }
      );
    }

    // Get file buffer
    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    // Process image if it's an image
    let width: number | undefined;
    let height: number | undefined;
    
    if (mediaType === 'image') {
      // Validate it's a valid image
      const isValid = await isValidImage(buffer);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid image file' },
          { status: 400 }
        );
      }

      // Get metadata before processing
      const metadata = await getImageMetadata(buffer);
      width = metadata.width;
      height = metadata.height;

      // Process image (resize + optimize)
      buffer = Buffer.from(await processImage(buffer as Buffer, 2500, 2500, 85));
    }

    // Generate unique filename (auto-renaming to prevent conflicts)
    // Format: TIMESTAMP-UUID-originalname.ext
    // This ensures filename is always unique without requiring user to rename
    const originalName = file.name || `file.${file.type.split('/')[1] || 'bin'}`;
    
    // Extract extension from filename
    const lastDotIndex = originalName.lastIndexOf('.');
    const ext = lastDotIndex > 0 ? originalName.substring(lastDotIndex + 1).toLowerCase() : '';
    
    // Use original name as-is, StorageService will generate unique filename
    // This preserves original name for display while ensuring unique path/URL
    const filename = originalName;

    // Upload to storage
    const storageService = getStorageServiceSingleton();
    const storageResult = await storageService.upload(buffer as Buffer, filename, {
      access: 'public',
      contentType: file.type,
      cacheControlMaxAge: 31536000, // 1 year
      folder: folder || 'media',
    });

    // Create media document
    const mediaData = {
      name: name || originalName.replace(/\.[^/.]+$/, ''),
      filename,
      url: storageResult.url,
      path: storageResult.path,
      type: mediaType,
      mimeType: file.type,
      extension: ext,
      size: buffer.length,
      width,
      height,
      folder: folder || undefined,
      altText: altText || undefined,
      uploadedBy: userId,
    };

    const media = await createMedia(mediaData);

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        _id: media._id.toString(),
        name: media.name,
        filename: media.filename,
        url: media.url,
        path: media.path,
        type: media.type,
        mimeType: media.mimeType,
        extension: media.extension,
        folder: media.folder,
        size: media.size,
        width: media.width,
        height: media.height,
        altText: media.altText,
        caption: media.caption,
        description: media.description,
        uploadedBy: media.uploadedBy?.toString(),
        createdAt: media.createdAt.toISOString(),
        updatedAt: media.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to upload media file' },
      { status: 500 }
    );
    }
  }, 'media:upload');
}
