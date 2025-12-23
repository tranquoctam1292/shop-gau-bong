/**
 * Admin Media Search API Route
 * GET /api/admin/media/search - Advanced search with multiple filters
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { searchMedia } from '@/lib/repositories/mediaRepository';
import { getMediaListSchema } from '@/lib/validations/mediaSchema';
import { handleValidationError } from '@/lib/utils/validation-errors';
import { ObjectId } from '@/lib/db';
import { safeToISOString } from '@/lib/utils/dateUtils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/media/search
 * Advanced search with multiple filters
 */
export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: media:read (checked by middleware)
      // Parse query params
      const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());

    // Validate query params (reuse getMediaListSchema)
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

    const { 
      page, 
      limit, 
      type, 
      search, 
      sort, 
      folder, 
      uploadedBy, 
      dateFrom, 
      dateTo, 
      minSize, 
      maxSize 
    } = validationResult.data;

    // Build filters (exclude search from filters, pass it separately)
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

    // Use searchMedia if search query provided, otherwise use getMediaList
    let result;
    if (search && search.trim()) {
      result = await searchMedia(search.trim(), filters, { 
        page: page || 1, 
        limit: limit || 20, 
        sort: sort || 'newest' 
      });
    } else {
      // If no search query, use regular getMediaList
      const { getMediaList } = await import('@/lib/repositories/mediaRepository');
      result = await getMediaList(filters, { 
        page: page || 1, 
        limit: limit || 20, 
        sort: sort || 'newest' 
      });
    }

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
      createdAt: safeToISOString(media.createdAt) ?? new Date().toISOString(),
      updatedAt: safeToISOString(media.updatedAt) ?? new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: result.pagination,
      query: {
        search: search || null,
        filters: {
          type: type || null,
          folder: folder || null,
          uploadedBy: uploadedBy || null,
          dateFrom: safeToISOString(dateFrom, null) || null,
          dateTo: safeToISOString(dateTo, null) || null,
          minSize: minSize || null,
          maxSize: maxSize || null,
        },
        sort: sort || 'newest',
      },
    });
  } catch (error) {
    console.error('Error searching media:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to search media' },
      { status: 500 }
    );
    }
  }, 'media:read');
}
