/**
 * Cron Job: Execute Scheduled Product Updates
 * POST /api/admin/cron/execute-scheduled-updates
 * 
 * This endpoint should be called by a cron job (Vercel Cron, external service, or GitHub Actions)
 * to execute scheduled product updates that are due.
 * 
 * Schedule: Every 5 minutes (recommended)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Allow both authenticated admin and cron job (with secret key)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Check if request is from cron job (with secret) or authenticated admin
  const isCronRequest = cronSecret && authHeader === `Bearer ${cronSecret}`;
  
  if (!isCronRequest) {
    // Fallback to admin authentication
    return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
      return executeScheduledUpdates();
    }, 'product:update');
  }
  
  // Execute for cron job
  return executeScheduledUpdates();
}

async function executeScheduledUpdates() {
  try {
    const { scheduledUpdates, products } = await getCollections();
    const now = new Date();
    
    // Find all pending scheduled updates that are due
    const dueUpdates = await scheduledUpdates
      ?.find({
        status: 'pending',
        scheduledAt: { $lte: now },
      })
      .sort({ scheduledAt: 1 })
      .toArray() || [];
    
    if (dueUpdates.length === 0) {
      return NextResponse.json({
        message: 'No scheduled updates to execute',
        executed: 0,
      });
    }
    
    const results = {
      executed: 0,
      failed: 0,
      errors: [] as Array<{ updateId: string; error: string }>,
    };
    
    // Execute each scheduled update
    for (const update of dueUpdates) {
      try {
        const productId = update.productId;
        const updateData = update.updateData;
        
        if (!ObjectId.isValid(productId)) {
          throw new Error('Invalid product ID');
        }
        
        // Get current product
        const product = await products?.findOne({ _id: new ObjectId(productId) });
        if (!product) {
          throw new Error('Product not found');
        }
        
        // Apply update data to product
        // Similar to quick-update logic but without version check (scheduled updates override)
        const updateFields: Record<string, unknown> = {
          updatedAt: new Date(),
        };
        
        // Map update data to MongoDB fields
        if (updateData.name !== undefined) updateFields.name = updateData.name;
        if (updateData.sku !== undefined) updateFields.sku = updateData.sku;
        if (updateData.status !== undefined) updateFields.status = updateData.status;
        if (updateData.regularPrice !== undefined) updateFields.regularPrice = updateData.regularPrice;
        if (updateData.salePrice !== undefined) updateFields.salePrice = updateData.salePrice;
        if (updateData.costPrice !== undefined) {
          if (!updateFields.productDataMetaBox) updateFields.productDataMetaBox = {};
          (updateFields.productDataMetaBox as Record<string, unknown>).costPrice = updateData.costPrice;
        }
        if (updateData.stockQuantity !== undefined) updateFields.stockQuantity = updateData.stockQuantity;
        if (updateData.stockStatus !== undefined) updateFields.stockStatus = updateData.stockStatus;
        if (updateData.manageStock !== undefined) {
          if (!updateFields.productDataMetaBox) updateFields.productDataMetaBox = {};
          (updateFields.productDataMetaBox as Record<string, unknown>).manageStock = updateData.manageStock;
        }
        if (updateData.weight !== undefined) {
          if (!updateFields.productDataMetaBox) updateFields.productDataMetaBox = {};
          (updateFields.productDataMetaBox as Record<string, unknown>).weight = updateData.weight;
        }
        if (updateData.length !== undefined) {
          if (!updateFields.productDataMetaBox) updateFields.productDataMetaBox = {};
          (updateFields.productDataMetaBox as Record<string, unknown>).length = updateData.length;
        }
        if (updateData.width !== undefined) {
          if (!updateFields.productDataMetaBox) updateFields.productDataMetaBox = {};
          (updateFields.productDataMetaBox as Record<string, unknown>).width = updateData.width;
        }
        if (updateData.height !== undefined) {
          if (!updateFields.productDataMetaBox) updateFields.productDataMetaBox = {};
          (updateFields.productDataMetaBox as Record<string, unknown>).height = updateData.height;
        }
        if (updateData.lowStockThreshold !== undefined) {
          if (!updateFields.productDataMetaBox) updateFields.productDataMetaBox = {};
          (updateFields.productDataMetaBox as Record<string, unknown>).lowStockThreshold = updateData.lowStockThreshold;
        }
        if (updateData.categories !== undefined) updateFields.categories = updateData.categories;
        if (updateData.tags !== undefined) updateFields.tags = updateData.tags;
        if (updateData._thumbnail_id !== undefined) updateFields._thumbnail_id = updateData._thumbnail_id;
        if (updateData._product_image_gallery !== undefined) updateFields._product_image_gallery = updateData._product_image_gallery;
        if (updateData.seoTitle !== undefined) {
          if (!updateFields.seo) updateFields.seo = {};
          (updateFields.seo as Record<string, unknown>).seoTitle = updateData.seoTitle;
        }
        if (updateData.seoDescription !== undefined) {
          if (!updateFields.seo) updateFields.seo = {};
          (updateFields.seo as Record<string, unknown>).seoDescription = updateData.seoDescription;
        }
        if (updateData.slug !== undefined) updateFields.slug = updateData.slug;
        if (updateData.productType !== undefined) {
          if (!updateFields.productDataMetaBox) updateFields.productDataMetaBox = {};
          (updateFields.productDataMetaBox as Record<string, unknown>).productType = updateData.productType;
        }
        if (updateData.visibility !== undefined) updateFields.visibility = updateData.visibility;
        if (updateData.shippingClass !== undefined) {
          if (!updateFields.productDataMetaBox) updateFields.productDataMetaBox = {};
          (updateFields.productDataMetaBox as Record<string, unknown>).shippingClass = updateData.shippingClass;
        }
        if (updateData.taxStatus !== undefined) {
          if (!updateFields.productDataMetaBox) updateFields.productDataMetaBox = {};
          (updateFields.productDataMetaBox as Record<string, unknown>).taxStatus = updateData.taxStatus;
        }
        if (updateData.taxClass !== undefined) {
          if (!updateFields.productDataMetaBox) updateFields.productDataMetaBox = {};
          (updateFields.productDataMetaBox as Record<string, unknown>).taxClass = updateData.taxClass;
        }
        if (updateData.barcode !== undefined) {
          if (!updateFields.productDataMetaBox) updateFields.productDataMetaBox = {};
          (updateFields.productDataMetaBox as Record<string, unknown>).barcode = updateData.barcode;
        }
        if (updateData.gtin !== undefined) {
          if (!updateFields.productDataMetaBox) updateFields.productDataMetaBox = {};
          (updateFields.productDataMetaBox as Record<string, unknown>).gtin = updateData.gtin;
        }
        if (updateData.ean !== undefined) {
          if (!updateFields.productDataMetaBox) updateFields.productDataMetaBox = {};
          (updateFields.productDataMetaBox as Record<string, unknown>).ean = updateData.ean;
        }
        if (updateData.soldIndividually !== undefined) {
          if (!updateFields.productDataMetaBox) updateFields.productDataMetaBox = {};
          (updateFields.productDataMetaBox as Record<string, unknown>).soldIndividually = updateData.soldIndividually;
        }
        if (updateData.backorders !== undefined) {
          if (!updateFields.productDataMetaBox) updateFields.productDataMetaBox = {};
          (updateFields.productDataMetaBox as Record<string, unknown>).backorders = updateData.backorders;
        }
        
        // Update variants if provided
        if (updateData.variants && Array.isArray(updateData.variants)) {
          if (!updateFields.productDataMetaBox) updateFields.productDataMetaBox = {};
          (updateFields.productDataMetaBox as Record<string, unknown>).variants = updateData.variants;
        }
        
        // Increment version for optimistic locking
        const currentVersion = (product.version as number) || 1;
        updateFields.version = currentVersion + 1;
        
        // Update product
        await products?.updateOne(
          { _id: new ObjectId(productId) },
          { $set: updateFields }
        );
        
        // Mark scheduled update as completed
        await scheduledUpdates?.updateOne(
          { _id: update._id },
          { 
            $set: { 
              status: 'completed',
              executedAt: new Date(),
              updatedAt: new Date(),
            } 
          }
        );
        
        results.executed++;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Execute Scheduled Update] Error for update ${update._id}:`, error);
        
        // Mark as failed
        await scheduledUpdates?.updateOne(
          { _id: update._id },
          { 
            $set: { 
              status: 'failed',
              error: errorMessage,
              executedAt: new Date(),
              updatedAt: new Date(),
            } 
          }
        );
        
        results.failed++;
        results.errors.push({
          updateId: update._id.toString(),
          error: errorMessage,
        });
      }
    }
    
    return NextResponse.json({
      message: `Executed ${results.executed} scheduled updates${results.failed > 0 ? `, ${results.failed} failed` : ''}`,
      ...results,
    });
  } catch (error: unknown) {
    console.error('[Execute Scheduled Updates Cron] Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to execute scheduled updates',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error instanceof Error ? error.stack : undefined }
          : undefined,
      },
      { status: 500 }
    );
  }
}

