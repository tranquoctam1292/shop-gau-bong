/**
 * Admin Quick Update Product API Route
 * PATCH /api/admin/products/[id]/quick-update - Quick update product (price, stock, status)
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { mapMongoProduct, MongoProduct } from '@/lib/utils/productMapper';
import { z } from 'zod';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

// Quick update schema - Extended for full Quick Edit feature
const quickUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().optional(),
  status: z.enum(['draft', 'publish', 'trash']).optional(),
  manageStock: z.boolean().optional(),
  regularPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).nullable().optional(), // Fix #18: Allow null to clear salePrice
  stockQuantity: z.number().min(0).optional(),
  stockStatus: z.enum(['instock', 'outofstock', 'onbackorder']).optional(),
  version: z.number().optional(), // For optimistic locking
  // Variant updates (for variable products)
  // NOTE: Variants don't have stockStatus field - they inherit from parent product
  variants: z.array(z.object({
    id: z.string(),
    sku: z.string().optional(),
    price: z.number().min(0).optional(),
    stock: z.number().min(0).optional(),
    // stockStatus removed - variants don't have this field in MongoDB
  })).optional(),
  // Backward compatibility: support old price field
  price: z.number().min(0).optional(),
}).refine(
  (data) => {
    // At least one field must be provided
    return Object.keys(data).length > 0;
  },
  { message: 'At least one field must be provided' }
).refine(
  (data) => {
    // Validate salePrice < regularPrice if both provided (skip if salePrice is null)
    if (data.salePrice !== undefined && data.salePrice !== null && data.regularPrice !== undefined) {
      return data.salePrice < data.regularPrice;
    }
    return true;
  },
  { message: 'Sale price must be less than regular price', path: ['salePrice'] }
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { products } = await getCollections();
    let { id } = params;
    const body = await request.json();
    
    // Extract ObjectId from GraphQL format if needed (backward compatibility)
    if (id.startsWith('gid://shop-gau-bong/Product/')) {
      id = id.replace('gid://shop-gau-bong/Product/', '');
    }
    
    // Validate input
    const validatedData = quickUpdateSchema.parse(body);
    
    // Find product
    let productId: ObjectId | null = null;
    let product = null;
    
    if (ObjectId.isValid(id)) {
      productId = new ObjectId(id);
      product = await products.findOne({ _id: productId });
    } else {
      product = await products.findOne({ slug: id });
      if (product) {
        productId = product._id;
      }
    }
    
    if (!productId || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Build update data structure
    // Use separate objects for $set, $unset, and $inc operations
    const updateData: any = {
      updatedAt: new Date(),
    };
    const unsetFields: Record<string, number> = {};
    const incFields: Record<string, number> = {};
    
    // CRITICAL: Validate version for optimistic locking
    if (validatedData.version !== undefined) {
      if (product.version !== validatedData.version) {
        return NextResponse.json(
          { 
            error: 'VERSION_MISMATCH',
            message: 'Product has been modified by another user. Please refresh and try again.',
            currentVersion: product.version,
            providedVersion: validatedData.version,
          },
          { status: 409 }
        );
      }
    }
    
    // Update name
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    
    // Update sku
    if (validatedData.sku !== undefined) {
      updateData.sku = validatedData.sku;
    }
    
    // Update status
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
    }
    
    // Handle manageStock
    if (validatedData.manageStock !== undefined) {
      if (!updateData.productDataMetaBox) {
        updateData.productDataMetaBox = { ...product.productDataMetaBox || {} };
      }
      updateData.productDataMetaBox.manageStock = validatedData.manageStock;
      
      // If disabling manage stock, clear stock quantity
      if (!validatedData.manageStock) {
        updateData.productDataMetaBox.stockQuantity = 0;
        updateData.stockQuantity = 0;
      }
    }
    
    // Update regularPrice in productDataMetaBox
    if (validatedData.regularPrice !== undefined) {
      if (!updateData.productDataMetaBox) {
        updateData.productDataMetaBox = { ...product.productDataMetaBox || {} };
      }
      updateData.productDataMetaBox.regularPrice = validatedData.regularPrice;
    }
    
    // Update salePrice in productDataMetaBox and cleanup sale dates
    // Fix #18: Handle salePrice = null to clear field
    if (validatedData.salePrice !== undefined) {
      if (validatedData.salePrice === null) {
        // User wants to clear salePrice - use $unset
        unsetFields['productDataMetaBox.salePrice'] = 1;
        unsetFields['productDataMetaBox.salePriceStartDate'] = 1;
        unsetFields['productDataMetaBox.salePriceEndDate'] = 1;
      } else {
        // Set salePrice value
        if (!updateData.productDataMetaBox) {
          updateData.productDataMetaBox = { ...product.productDataMetaBox || {} };
        }
        updateData.productDataMetaBox.salePrice = validatedData.salePrice;
        // CRITICAL: Use 1 (or true) for $unset values, not empty string
        unsetFields['productDataMetaBox.salePriceStartDate'] = 1;
        unsetFields['productDataMetaBox.salePriceEndDate'] = 1;
      }
    }
    
    // Backward compatibility: support old price field
    if (validatedData.price !== undefined) {
      updateData.price = validatedData.price;
      if (!updateData.productDataMetaBox) {
        updateData.productDataMetaBox = { ...product.productDataMetaBox || {} };
      }
      updateData.productDataMetaBox.regularPrice = validatedData.price;
    }
    
    // Update stockQuantity with auto-sync (respect onbackorder AND manual override)
    if (validatedData.stockQuantity !== undefined) {
      updateData.stockQuantity = validatedData.stockQuantity;
      if (product.productDataMetaBox) {
        if (!updateData.productDataMetaBox) {
          updateData.productDataMetaBox = { ...product.productDataMetaBox };
        }
        updateData.productDataMetaBox.stockQuantity = validatedData.stockQuantity;
      }
      
      // CRITICAL: Only auto-sync if stockStatus is NOT explicitly provided
      // This prevents auto-sync from overriding user's manual choice
      if (validatedData.stockStatus === undefined) {
        const currentStatus = product.productDataMetaBox?.stockStatus || 
                             product.stockStatus || 
                             'instock';
        
        // Only auto-sync if current status is NOT onbackorder
        if (currentStatus !== 'onbackorder') {
          // Auto-sync: Qty > 0 -> instock, Qty <= 0 -> outofstock
          if (validatedData.stockQuantity > 0) {
            updateData.stockStatus = 'instock';
            if (!updateData.productDataMetaBox) {
              updateData.productDataMetaBox = { ...product.productDataMetaBox || {} };
            }
            updateData.productDataMetaBox.stockStatus = 'instock';
          } else {
            updateData.stockStatus = 'outofstock';
            if (!updateData.productDataMetaBox) {
              updateData.productDataMetaBox = { ...product.productDataMetaBox || {} };
            }
            updateData.productDataMetaBox.stockStatus = 'outofstock';
          }
        }
      }
      // If stockStatus is explicitly provided OR current status is onbackorder, 
      // respect user's manual choice (don't auto-sync)
    }
    
    // Manual stockStatus update (takes precedence over auto-sync)
    if (validatedData.stockStatus !== undefined) {
      updateData.stockStatus = validatedData.stockStatus;
      if (product.productDataMetaBox) {
        if (!updateData.productDataMetaBox) {
          updateData.productDataMetaBox = { ...product.productDataMetaBox || {} };
        }
        updateData.productDataMetaBox.stockStatus = validatedData.stockStatus;
      }
    }
    
    // Handle variant updates (for variable products)
    if (validatedData.variants && Array.isArray(validatedData.variants)) {
      const currentVariants = product.variants || [];
      const currentVariantIds = new Set(
        currentVariants.map((v: any) => v.id).filter(Boolean)
      );
      
      // CRITICAL: Validate all variant IDs exist before updating
      const variantsToUpdate = validatedData.variants;
      const invalidIds = variantsToUpdate
        .filter((v: any) => v.id && !currentVariantIds.has(v.id))
        .map((v: any) => v.id);
      
      if (invalidIds.length > 0) {
        return NextResponse.json(
          { 
            error: 'Invalid variant IDs',
            details: `Variant IDs not found: ${invalidIds.join(', ')}`
          },
          { status: 400 }
        );
      }
      
      // Update variants (only fields that exist in MongoDB schema)
      const updatedVariants = currentVariants.map((variant: any) => {
        const updateVariant = variantsToUpdate.find((v: any) => v.id === variant.id);
        if (updateVariant) {
          return {
            ...variant,
            ...(updateVariant.sku !== undefined && { sku: updateVariant.sku }),
            ...(updateVariant.price !== undefined && { price: updateVariant.price }),
            ...(updateVariant.stock !== undefined && { stock: updateVariant.stock }),
            // NOTE: stockStatus removed - variants don't have this field
            // Variants inherit stockStatus from parent product
          };
        }
        return variant;
      });
      updateData.variants = updatedVariants;
    }
    
    // Increment version for optimistic locking
    incFields.version = 1;
    
    // Build final update operation combining $set, $unset, and $inc
    const finalUpdateOperation: Record<string, unknown> = {};
    
    // Add $set operations (all fields in updateData)
    if (Object.keys(updateData).length > 0) {
      finalUpdateOperation.$set = updateData;
    }
    
    // Add $unset operations (sale dates cleanup)
    if (Object.keys(unsetFields).length > 0) {
      finalUpdateOperation.$unset = unsetFields;
    }
    
    // Add $inc operations (version increment)
    if (Object.keys(incFields).length > 0) {
      finalUpdateOperation.$inc = incFields;
    }
    
    // Execute update
    await products.updateOne(
      { _id: productId },
      finalUpdateOperation
    );
    
    // After successful update, create audit log using existing adminActivityLogs collection
    const { createAuditLog } = await import('@/lib/utils/auditLogger');
    
    // Fix: Use proper AdminUser type - _id is ObjectId, convert to string
    const adminId = req.adminUser?._id?.toString() || '';
    
    // Fix: Convert Date to string for audit log (sale dates)
    const salePriceStartDate = product.productDataMetaBox?.salePriceStartDate
      ? (product.productDataMetaBox.salePriceStartDate instanceof Date
          ? product.productDataMetaBox.salePriceStartDate.toISOString()
          : String(product.productDataMetaBox.salePriceStartDate))
      : undefined;
    const salePriceEndDate = product.productDataMetaBox?.salePriceEndDate
      ? (product.productDataMetaBox.salePriceEndDate instanceof Date
          ? product.productDataMetaBox.salePriceEndDate.toISOString()
          : String(product.productDataMetaBox.salePriceEndDate))
      : undefined;
    
    await createAuditLog({
      admin_id: adminId,
      action: 'PRODUCT_QUICK_UPDATE',
      target_collection: 'products',
      target_id: productId.toString(),
      details: {
        oldValues: {
          // Optional: Snapshot of key fields before update (dates converted to ISO strings)
          name: product.name,
          sku: product.sku,
          status: product.status,
          regularPrice: product.productDataMetaBox?.regularPrice,
          salePrice: product.productDataMetaBox?.salePrice,
          salePriceStartDate, // ISO string
          salePriceEndDate,     // ISO string
          stockQuantity: product.productDataMetaBox?.stockQuantity,
          stockStatus: product.productDataMetaBox?.stockStatus,
        },
        changes: validatedData,
      },
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      user_agent: req.headers.get('user-agent') || undefined,
    });
    
    // Recalculate minPrice, maxPrice, totalStock after update
    const recalculatedProduct = await products.findOne({ _id: productId });
    if (recalculatedProduct) {
      // Recalculate minPrice/maxPrice from variants or regularPrice
      let minPrice = recalculatedProduct.productDataMetaBox?.regularPrice || recalculatedProduct.price || 0;
      let maxPrice = minPrice;
      let totalStock = recalculatedProduct.productDataMetaBox?.stockQuantity || 0;
      
      if (recalculatedProduct.variants && recalculatedProduct.variants.length > 0) {
        // Filter out invalid prices and handle edge cases
        const variantPrices = recalculatedProduct.variants
          .map((v: any) => Number(v.price) || 0)
          .filter((price: number) => price > 0); // Filter out invalid prices
        
        if (variantPrices.length > 0) {
          minPrice = Math.min(...variantPrices);
          maxPrice = Math.max(...variantPrices);
        }
        
        // Calculate total stock with safe number conversion
        totalStock = recalculatedProduct.variants.reduce(
          (sum: number, v: any) => sum + (Number(v.stock) || 0), 
          0
        );
      }
      
      // Only update if values are valid
      if (minPrice >= 0 && maxPrice >= 0 && totalStock >= 0) {
        await products.updateOne(
          { _id: productId },
          { $set: { minPrice, maxPrice, totalStock } }
        );
      }
    }
    
    // Fetch updated product
    const updatedProduct = await products.findOne({ _id: productId });
    
    if (!updatedProduct) {
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }
    
    const mappedProduct = mapMongoProduct(updatedProduct as unknown as MongoProduct);
    
    return NextResponse.json({
      success: true,
      product: mappedProduct,
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
    
    console.error('[Admin Product Quick Update API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to quick update product',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'product:update');
}

