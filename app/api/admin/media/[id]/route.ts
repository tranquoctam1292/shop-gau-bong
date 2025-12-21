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
import { getCollections } from '@/lib/db';
import { 
  getMediaById, 
  updateMedia, 
  deleteMedia 
} from '@/lib/repositories/mediaRepository';
import { getStorageServiceSingleton } from '@/lib/storage/storageFactory';
import { safeToISOString } from '@/lib/utils/dateUtils';
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
        createdAt: safeToISOString(media.createdAt) ?? new Date().toISOString(),
        updatedAt: safeToISOString(media.updatedAt) ?? new Date().toISOString(),
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
        createdAt: safeToISOString(updated.createdAt) ?? new Date().toISOString(),
        updatedAt: safeToISOString(updated.updatedAt) ?? new Date().toISOString(),
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

    // BUSINESS LOGIC FIX: Referential Integrity - Xóa imageId khỏi tất cả products trước khi xóa media
    const { products } = await getCollections();
    const mediaId = id;
    const mediaUrl = media.url; // Cũng cần check URL nếu media ID được lưu dưới dạng URL
    
    // Tìm tất cả products có reference đến media này
    // Sử dụng exact match cho _thumbnail_id và array fields
    // Với _product_image_gallery (comma-separated), cần tìm products có chứa mediaId trong string
    const productsWithMedia = await products.find({
      $or: [
        { _thumbnail_id: mediaId },
        { _thumbnail_id: mediaUrl },
        // Tìm trong _product_image_gallery (comma-separated string)
        // Sử dụng $regex với word boundary để tránh match partial IDs
        { _product_image_gallery: { $regex: `(^|,)${mediaId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(,|$)` } },
        { _product_image_gallery: { $regex: `(^|,)${mediaUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(,|$)` } },
        { 'productDataMetaBox.variations.image': mediaId },
        { 'productDataMetaBox.variations.image': mediaUrl },
        { 'variants.image': mediaId },
        { 'variants.image': mediaUrl },
      ],
    }).toArray();
    
    // Cập nhật từng product để xóa reference
    if (productsWithMedia.length > 0) {
      const bulkOps: any[] = [];
      
      for (const product of productsWithMedia) {
        const updateOps: any = {};
        let needsUpdate = false;
        
        // Xóa _thumbnail_id nếu trùng
        if (product._thumbnail_id === mediaId || product._thumbnail_id === mediaUrl) {
          updateOps.$unset = { _thumbnail_id: '' };
          needsUpdate = true;
        }
        
        // Xóa khỏi _product_image_gallery (comma-separated string)
        if (product._product_image_gallery) {
          const galleryIds = product._product_image_gallery.split(',').map((id: string) => id.trim());
          const filteredIds = galleryIds.filter((galleryId: string) => 
            galleryId !== mediaId && galleryId !== mediaUrl
          );
          
          if (filteredIds.length !== galleryIds.length) {
            if (!updateOps.$set) updateOps.$set = {};
            updateOps.$set._product_image_gallery = filteredIds.length > 0 ? filteredIds.join(',') : null;
            needsUpdate = true;
          }
        }
        
        // Xóa khỏi variants.image
        if (product.variants && Array.isArray(product.variants)) {
          const updatedVariants = product.variants.map((variant: any) => {
            if (variant.image === mediaId || variant.image === mediaUrl) {
              const { image, ...rest } = variant;
              return rest;
            }
            return variant;
          });
          
          // Chỉ update nếu có thay đổi
          if (updatedVariants.some((v: any, idx: number) => 
            !product.variants[idx] || v.image !== product.variants[idx].image
          )) {
            if (!updateOps.$set) updateOps.$set = {};
            updateOps.$set.variants = updatedVariants;
            needsUpdate = true;
          }
        }
        
        // Xóa khỏi productDataMetaBox.variations.image
        if (product.productDataMetaBox?.variations && Array.isArray(product.productDataMetaBox.variations)) {
          const updatedVariations = product.productDataMetaBox.variations.map((variation: any) => {
            if (variation.image === mediaId || variation.image === mediaUrl) {
              const { image, ...rest } = variation;
              return rest;
            }
            return variation;
          });
          
          // Chỉ update nếu có thay đổi
          if (updatedVariations.some((v: any, idx: number) => 
            !product.productDataMetaBox.variations[idx] || v.image !== product.productDataMetaBox.variations[idx].image
          )) {
            if (!updateOps.$set) updateOps.$set = {};
            if (!updateOps.$set.productDataMetaBox) updateOps.$set.productDataMetaBox = { ...product.productDataMetaBox };
            updateOps.$set.productDataMetaBox.variations = updatedVariations;
            needsUpdate = true;
          }
        }
        
        // Thêm vào bulk operations nếu có thay đổi
        if (needsUpdate) {
          bulkOps.push({
            updateOne: {
              filter: { _id: product._id },
              update: updateOps,
            },
          });
        }
      }
      
      // Execute bulk update nếu có operations
      if (bulkOps.length > 0) {
        await products.bulkWrite(bulkOps);
      }
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
      affectedProducts: productsWithMedia.length,
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
