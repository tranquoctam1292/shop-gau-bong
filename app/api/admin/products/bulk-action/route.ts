/**
 * Admin Bulk Actions API Route
 * POST /api/admin/products/bulk-action - Perform bulk actions on products
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

// Bulk action schema
const bulkActionSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one product ID is required').max(50, 'Tối đa 50 sản phẩm có thể được cập nhật cùng lúc'), // PHASE 2: Bulk Edit Performance (7.2.4) - Limit to 50 products
  action: z.enum([
    'soft_delete',
    'force_delete',
    'restore',
    'update_status',
    'update_price',
    'update_stock',
    'quick_update', // PHASE 2: Bulk Quick Edit (4.2.5)
  ]),
  value: z.union([
    z.string(), // For status updates
    z.number(), // For price/stock updates
    z.record(z.unknown()), // For quick_update (object with update fields)
  ]).optional(),
});

export async function POST(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await request.json();
    
    // Validate input
    const validatedData = bulkActionSchema.parse(body);
    
    const { products } = await getCollections();
    const now = new Date();
    
    // Convert string IDs to ObjectIds
    const productIds = validatedData.ids
      .map((id) => {
        try {
          return new ObjectId(id);
        } catch {
          return null;
        }
      })
      .filter((id): id is ObjectId => id !== null);
    
    if (productIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid product IDs provided' },
        { status: 400 }
      );
    }
    
    let updated = 0;
    let failed = 0;
    const errors: string[] = [];
    
    // Process each action
    switch (validatedData.action) {
      case 'soft_delete': {
        // Soft delete: Set deletedAt = new Date() and status = 'trash'
        const result = await products.updateMany(
          { _id: { $in: productIds } },
          {
            $set: {
              deletedAt: now,
              status: 'trash',
              updatedAt: now,
            },
          }
        );
        updated = result.modifiedCount;
        break;
      }
      
      case 'force_delete': {
        // Clean up menu items that reference these products (prevent ghost links)
        const { menuItems } = await getCollections();
        await menuItems.deleteMany({
          type: 'product',
          referenceId: { $in: productIds },
        });
        
        // Force delete: Permanently delete from database
        const result = await products.deleteMany({ _id: { $in: productIds } });
        updated = result.deletedCount;
        break;
      }
      
      case 'restore': {
        // Restore: Set deletedAt = null and status = 'draft'
        const result = await products.updateMany(
          {
            _id: { $in: productIds },
            deletedAt: { $ne: null }, // Only restore products that are in trash
          },
          {
            $set: {
              deletedAt: null,
              status: 'draft',
              updatedAt: now,
            },
          }
        );
        updated = result.modifiedCount;
        break;
      }
      
      case 'update_status': {
        // Update status
        if (!validatedData.value || typeof validatedData.value !== 'string') {
          return NextResponse.json(
            { error: 'Status value is required for update_status action' },
            { status: 400 }
          );
        }
        
        const status = validatedData.value as 'draft' | 'publish' | 'trash';
        const result = await products.updateMany(
          { _id: { $in: productIds } },
          {
            $set: {
              status,
              updatedAt: now,
            },
          }
        );
        updated = result.modifiedCount;
        break;
      }
      
      case 'update_price': {
        // Update price
        if (validatedData.value === undefined || typeof validatedData.value !== 'number') {
          return NextResponse.json(
            { error: 'Price value is required for update_price action' },
            { status: 400 }
          );
        }
        
        const price = validatedData.value;
        const result = await products.updateMany(
          { _id: { $in: productIds } },
          {
            $set: {
              price,
              minPrice: price,
              updatedAt: now,
            },
          }
        );
        updated = result.modifiedCount;
        break;
      }
      
      case 'update_stock': {
        // Update stock quantity
        if (validatedData.value === undefined || typeof validatedData.value !== 'number') {
          return NextResponse.json(
            { error: 'Stock value is required for update_stock action' },
            { status: 400 }
          );
        }
        
        const stockQuantity = validatedData.value;
        const stockStatus = stockQuantity > 0 ? 'instock' : 'outofstock';
        
        // Update both direct fields and productDataMetaBox
        const result = await products.updateMany(
          { _id: { $in: productIds } },
          {
            $set: {
              stockQuantity,
              stockStatus,
              updatedAt: now,
            },
          }
        );
        updated = result.modifiedCount;
        break;
      }
      
      case 'quick_update': {
        // PHASE 2: Bulk Quick Edit (4.2.5) + PHASE 2: Bulk Edit Performance (7.2.4)
        // Optimized batch update using updateMany for simple fields
        
        if (!validatedData.value || typeof validatedData.value !== 'object') {
          return NextResponse.json(
            { error: 'Update data is required for quick_update action' },
            { status: 400 }
          );
        }
        
        const updateData = validatedData.value as Record<string, unknown>;
        
        // PHASE 2: Bulk Edit Performance (7.2.4) - Check for complex fields that require individual updates
        const hasComplexFields = 
          updateData._thumbnail_id !== undefined ||
          updateData._product_image_gallery !== undefined ||
          updateData.variants !== undefined ||
          updateData.slug !== undefined ||
          updateData.seoTitle !== undefined ||
          updateData.seoDescription !== undefined ||
          updateData.weight !== undefined ||
          updateData.length !== undefined ||
          updateData.width !== undefined ||
          updateData.height !== undefined ||
          updateData.lowStockThreshold !== undefined ||
          updateData.costPrice !== undefined ||
          updateData.productType !== undefined ||
          updateData.visibility !== undefined ||
          updateData.shippingClass !== undefined ||
          updateData.taxStatus !== undefined ||
          updateData.taxClass !== undefined;
        
        // If only simple fields, use batch updateMany
        if (!hasComplexFields) {
          // Build batch update object
          const batchUpdateObj: any = {
            updatedAt: now,
          };
          const batchUnsetObj: any = {};
          
          // Apply simple field updates
          if (updateData.status) batchUpdateObj.status = updateData.status;
          
          // Handle productDataMetaBox fields
          const metaBoxUpdates: any = {};
          if (updateData.regularPrice !== undefined) {
            batchUpdateObj.minPrice = updateData.regularPrice;
            metaBoxUpdates['productDataMetaBox.regularPrice'] = updateData.regularPrice;
          }
          if (updateData.salePrice !== undefined) {
            if (updateData.salePrice === null) {
              batchUnsetObj['productDataMetaBox.salePrice'] = 1;
            } else {
              metaBoxUpdates['productDataMetaBox.salePrice'] = updateData.salePrice;
            }
          }
          if (updateData.stockQuantity !== undefined) {
            batchUpdateObj.stockQuantity = updateData.stockQuantity;
            metaBoxUpdates['productDataMetaBox.stockQuantity'] = updateData.stockQuantity;
          }
          if (updateData.stockStatus) {
            metaBoxUpdates['productDataMetaBox.stockStatus'] = updateData.stockStatus;
          }
          
          // Merge metaBox updates into batchUpdateObj
          Object.assign(batchUpdateObj, metaBoxUpdates);
          
          // Handle categories and tags (arrays)
          if (updateData.categories) batchUpdateObj.categories = updateData.categories;
          if (updateData.tags) batchUpdateObj.tags = updateData.tags;
          
          // Build update operation
          const updateOperation: any = {
            $set: batchUpdateObj,
            $inc: { version: 1 },
          };
          if (Object.keys(batchUnsetObj).length > 0) {
            updateOperation.$unset = batchUnsetObj;
          }
          
          // Execute batch update
          const result = await products.updateMany(
            { _id: { $in: productIds } },
            updateOperation
          );
          
          updated = result.modifiedCount;
          failed = productIds.length - updated;
        } else {
          // PHASE 2: Bulk Edit Performance (7.2.4) - Complex fields require individual updates
          // Process each product individually for complex fields
          for (const productId of productIds) {
            try {
              const product = await products.findOne({ _id: productId });
              if (!product) {
                failed++;
                errors.push(`Product ${productId.toString()} not found`);
                continue;
              }
              
              // Build update object similar to quick-update route
              const updateObj: any = {
                updatedAt: now,
              };
              
              // Apply updates (simplified - only common fields)
              if (updateData.status) updateObj.status = updateData.status;
              if (updateData.regularPrice !== undefined) {
                updateObj.minPrice = updateData.regularPrice;
                if (!updateObj.productDataMetaBox) updateObj.productDataMetaBox = {};
                updateObj.productDataMetaBox.regularPrice = updateData.regularPrice;
              }
              if (updateData.salePrice !== undefined) {
                if (!updateObj.productDataMetaBox) updateObj.productDataMetaBox = {};
                updateObj.productDataMetaBox.salePrice = updateData.salePrice === null ? undefined : updateData.salePrice;
              }
              if (updateData.stockQuantity !== undefined) {
                updateObj.stockQuantity = updateData.stockQuantity;
                if (!updateObj.productDataMetaBox) updateObj.productDataMetaBox = {};
                updateObj.productDataMetaBox.stockQuantity = updateData.stockQuantity;
              }
              if (updateData.stockStatus) {
                if (!updateObj.productDataMetaBox) updateObj.productDataMetaBox = {};
                updateObj.productDataMetaBox.stockStatus = updateData.stockStatus;
              }
              if (updateData.categories) updateObj.categories = updateData.categories;
              if (updateData.tags) updateObj.tags = updateData.tags;
              
              // Increment version (use $inc operator)
              await products.updateOne(
                { _id: productId },
                { 
                  $set: updateObj,
                  $inc: { version: 1 }
                }
              );
              updated++;
            } catch (error: any) {
              failed++;
              errors.push(`Failed to update product ${productId.toString()}: ${error.message}`);
            }
          }
        }
        break;
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    failed = productIds.length - updated;
    
    return NextResponse.json({
      success: true,
      updated,
      failed,
      message: `Đã cập nhật ${updated} sản phẩm${failed > 0 ? `, ${failed} sản phẩm thất bại` : ''}`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    console.error('[Admin Products Bulk Action API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to perform bulk action',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'product:update'); // Bulk actions can be update or delete depending on action, using update as default
}

