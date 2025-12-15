/**
 * Admin Quick Update Product API Route
 * PATCH /api/admin/products/[id]/quick-update - Quick update product (price, stock, status)
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { mapMongoProduct } from '@/lib/utils/productMapper';
import { z } from 'zod';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

// Quick update schema
const quickUpdateSchema = z.object({
  price: z.number().min(0).optional(),
  stockQuantity: z.number().min(0).optional(),
  status: z.enum(['draft', 'publish', 'trash']).optional(),
  // Support productDataMetaBox fields
  regularPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  stockStatus: z.enum(['instock', 'outofstock', 'onbackorder']).optional(),
}).refine(
  (data) => {
    // At least one field must be provided
    return data.price !== undefined || 
           data.stockQuantity !== undefined || 
           data.status !== undefined ||
           data.regularPrice !== undefined ||
           data.salePrice !== undefined ||
           data.stockStatus !== undefined;
  },
  {
    message: 'At least one field must be provided for update',
  }
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
    
    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    // Update price (support both direct price and productDataMetaBox)
    if (validatedData.price !== undefined) {
      updateData.price = validatedData.price;
      updateData.minPrice = validatedData.price;
      // Also update productDataMetaBox if it exists
      if (product.productDataMetaBox) {
        if (!updateData.productDataMetaBox) {
          updateData.productDataMetaBox = { ...product.productDataMetaBox };
        }
        updateData.productDataMetaBox.regularPrice = validatedData.price;
      }
    }
    
    // Update regularPrice in productDataMetaBox
    if (validatedData.regularPrice !== undefined) {
      if (!updateData.productDataMetaBox) {
        updateData.productDataMetaBox = { ...product.productDataMetaBox || {} };
      }
      updateData.productDataMetaBox.regularPrice = validatedData.regularPrice;
      // Update minPrice if this is the lowest price
      if (!updateData.minPrice || validatedData.regularPrice < updateData.minPrice) {
        updateData.minPrice = validatedData.regularPrice;
      }
    }
    
    // Update salePrice in productDataMetaBox
    if (validatedData.salePrice !== undefined) {
      if (!updateData.productDataMetaBox) {
        updateData.productDataMetaBox = { ...product.productDataMetaBox || {} };
      }
      updateData.productDataMetaBox.salePrice = validatedData.salePrice;
      // Update minPrice if sale price is lower
      if (!updateData.minPrice || validatedData.salePrice < updateData.minPrice) {
        updateData.minPrice = validatedData.salePrice;
      }
    }
    
    // Update stockQuantity
    if (validatedData.stockQuantity !== undefined) {
      updateData.stockQuantity = validatedData.stockQuantity;
      // Also update productDataMetaBox if it exists
      if (product.productDataMetaBox) {
        if (!updateData.productDataMetaBox) {
          updateData.productDataMetaBox = { ...product.productDataMetaBox };
        }
        updateData.productDataMetaBox.stockQuantity = validatedData.stockQuantity;
        // Auto-update stockStatus based on quantity
        if (validatedData.stockQuantity > 0) {
          updateData.productDataMetaBox.stockStatus = 'instock';
          updateData.stockStatus = 'instock';
        } else {
          updateData.productDataMetaBox.stockStatus = 'outofstock';
          updateData.stockStatus = 'outofstock';
        }
      } else {
        // Update stockStatus directly if productDataMetaBox doesn't exist
        if (validatedData.stockQuantity > 0) {
          updateData.stockStatus = 'instock';
        } else {
          updateData.stockStatus = 'outofstock';
        }
      }
    }
    
    // Update stockStatus
    if (validatedData.stockStatus !== undefined) {
      updateData.stockStatus = validatedData.stockStatus;
      if (product.productDataMetaBox) {
        if (!updateData.productDataMetaBox) {
          updateData.productDataMetaBox = { ...product.productDataMetaBox };
        }
        updateData.productDataMetaBox.stockStatus = validatedData.stockStatus;
      }
    }
    
    // Update status
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
    }
    
    // Update product
    await products.updateOne(
      { _id: productId },
      { $set: updateData }
    );
    
    // Fetch updated product
    const updatedProduct = await products.findOne({ _id: productId });
    
    if (!updatedProduct) {
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }
    
    const mappedProduct = mapMongoProduct(updatedProduct);
    
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

