/**
 * Admin Media Detail API Route
 * GET /api/admin/media/[id] - Get media detail
 * PUT /api/admin/media/[id] - Update media metadata
 * DELETE /api/admin/media/[id] - Delete media
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { 
  getMediaById, 
  updateMedia, 
  deleteMedia 
} from '@/lib/repositories/mediaRepository';
import { getStorageServiceSingleton } from '@/lib/storage/storageFactory';
import { 
  getMediaDetailSchema,
  updateMediaParamsSchema,
  updateMediaSchema,
  deleteMediaParamsSchema
} from '@/lib/validations/mediaSchema';
import { handleValidationError } from '@/lib/utils/validation-errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/media/[id]
 * Get single media detail
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: media:read (checked by middleware)

    // Validate params
    const validationResult = getMediaDetailSchema.safeParse({ id: params.id });
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid media ID',
          details: handleValidationError(validationResult.error)
        },
        { status: 400 }
      );
    }

    const { id } = validationResult.data;

    // Get media
    const media = await getMediaById(id);
    if (!media) {
      return NextResponse.json(
        { success: false, error: 'Media not found' },
        { status: 404 }
      );
    }

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
    console.error('Error getting media detail:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to get media detail' },
      { status: 500 }
    );
    }
  }, 'media:read');
}

/**
 * PUT /api/admin/media/[id]
 * Update media metadata
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: media:upload (checked by middleware)

    // Validate params
    const paramsValidation = updateMediaParamsSchema.safeParse({ id: params.id });
    if (!paramsValidation.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid media ID',
          details: handleValidationError(paramsValidation.error)
        },
        { status: 400 }
      );
    }

    // Parse body
    const body = await req.json();

    // Validate body
    const bodyValidation = updateMediaSchema.safeParse(body);
    if (!bodyValidation.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid update data',
          details: handleValidationError(bodyValidation.error)
        },
        { status: 400 }
      );
    }

    const { id } = paramsValidation.data;
    const updates = bodyValidation.data;

    // Check if media exists
    const existing = await getMediaById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Media not found' },
        { status: 404 }
      );
    }

    // Update media
    const updated = await updateMedia(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to update media' },
        { status: 500 }
      );
    }

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        _id: updated._id.toString(),
        name: updated.name,
        filename: updated.filename,
        url: updated.url,
        path: updated.path,
        type: updated.type,
        mimeType: updated.mimeType,
        extension: updated.extension,
        folder: updated.folder,
        size: updated.size,
        width: updated.width,
        height: updated.height,
        altText: updated.altText,
        caption: updated.caption,
        description: updated.description,
        uploadedBy: updated.uploadedBy?.toString(),
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating media:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update media' },
      { status: 500 }
    );
    }
  }, 'media:upload');
}

/**
 * DELETE /api/admin/media/[id]
 * Delete media file and document
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: media:upload (checked by middleware)

    // Validate params
    const validationResult = deleteMediaParamsSchema.safeParse({ id: params.id });
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid media ID',
          details: handleValidationError(validationResult.error)
        },
        { status: 400 }
      );
    }

    const { id } = validationResult.data;

    // Get media to get storage path/URL
    const media = await getMediaById(id);
    if (!media) {
      return NextResponse.json(
        { success: false, error: 'Media not found' },
        { status: 404 }
      );
    }

    // Delete from storage
    const storageService = getStorageServiceSingleton();
    try {
      // Try to delete by URL first (Vercel Blob requires URL)
      if (media.url) {
        // For Vercel Blob, we need to use deleteByUrl if available
        if ('deleteByUrl' in storageService && typeof storageService.deleteByUrl === 'function') {
          await (storageService as any).deleteByUrl(media.url);
        } else {
          // Fallback: try to delete by path
          await storageService.delete(media.path);
        }
      } else {
        // Fallback: delete by path
        await storageService.delete(media.path);
      }
    } catch (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue with DB deletion even if storage deletion fails
      // (orphaned file in storage is better than orphaned DB record)
    }

    // Delete from database
    const deleted = await deleteMedia(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete media' },
        { status: 500 }
      );
    }

    // Return response
    return NextResponse.json({
      success: true,
      message: 'Media deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete media' },
      { status: 500 }
    );
    }
  }, 'media:upload');
}
