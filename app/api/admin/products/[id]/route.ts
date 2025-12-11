/**
 * Admin Single Product API Route
 * GET /api/admin/products/[id] - Get single product
 * PUT /api/admin/products/[id] - Update product
 * DELETE /api/admin/products/[id] - Delete product
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { mapMongoProduct } from '@/lib/utils/productMapper';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Product update schema (all fields optional except validation)
const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  sku: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  images: z.array(z.string()).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  variants: z.array(z.object({
    id: z.string(),
    size: z.string(),
    color: z.string().optional(),
    colorCode: z.string().optional(),
    price: z.number().min(0),
    stock: z.number().min(0),
    image: z.string().optional(),
    sku: z.string().optional(),
    stockAlertThreshold: z.number().optional(),
    pricingRule: z.object({
      type: z.enum(['fixed', 'percentage', 'formula']),
      value: z.number(),
    }).optional(),
  })).optional(),
  isHot: z.boolean().optional(),
  isActive: z.boolean().optional(),
  status: z.enum(['draft', 'publish']).optional(),
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  weight: z.number().optional(),
  volumetricWeight: z.number().optional(),
  material: z.string().optional(),
  origin: z.string().optional(),
  // Phase 1: New fields
  productDetails: z.object({
    ageRecommendation: z.string().optional(),
    careInstructions: z.string().optional(),
    safetyInformation: z.string().optional(),
    productSpecifications: z.string().optional(),
    sizeGuide: z.string().optional(),
    materialDetails: z.string().optional(),
    warrantyInformation: z.string().optional(),
  }).optional(),
  seo: z.object({
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
    canonicalUrl: z.string().optional(),
    robotsMeta: z.string().optional(),
  }).optional(),
  // Phase 2: Gift & Media fields
  giftFeatures: z.object({
    giftWrapping: z.boolean().optional(),
    giftWrappingPrice: z.number().optional(),
    giftMessageEnabled: z.boolean().optional(),
    giftMessageMaxLength: z.number().optional(),
    giftCardEnabled: z.boolean().optional(),
    giftCardTypes: z.array(z.string()).optional(),
    giftDeliveryDateEnabled: z.boolean().optional(),
    giftCategories: z.array(z.string()).optional(),
    giftSuggestions: z.array(z.string()).optional(),
  }).optional(),
  mediaExtended: z.object({
    videos: z.array(z.object({
      url: z.string(),
      type: z.enum(['youtube', 'vimeo', 'upload']),
      thumbnail: z.string().optional(),
    })).optional(),
    view360Images: z.array(z.string()).optional(),
    imageAltTexts: z.record(z.string(), z.string()).optional(),
  }).optional(),
  // Phase 3: Collections & Relations
  collectionCombo: z.object({
    collections: z.array(z.string()).optional(),
    comboProducts: z.array(z.string()).optional(),
    bundleProducts: z.array(z.object({
      productId: z.string(),
      quantity: z.number().min(1).optional(),
      discount: z.number().min(0).max(100).optional(),
    })).optional(),
    relatedProducts: z.array(z.string()).optional(),
    upsellProducts: z.array(z.string()).optional(),
    crossSellProducts: z.array(z.string()).optional(),
  }).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { products } = await getCollections();
    const { id } = params;
    
    // Find by ObjectId or slug
    let product = null;
    
    if (ObjectId.isValid(id)) {
      product = await products.findOne({ _id: new ObjectId(id) });
    }
    
    if (!product) {
      product = await products.findOne({ slug: id });
    }
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    const mappedProduct = mapMongoProduct(product);
    
    return NextResponse.json({ product: mappedProduct });
  } catch (error: any) {
    console.error('[Admin Product API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch product',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { products, categories } = await getCollections();
    const { id } = params;
    const body = await request.json();
    
    // Validate input
    const validatedData = productUpdateSchema.parse(body);
    
    // Map category to categoryId if category is provided
    let categoryId: string | undefined = undefined;
    if (validatedData.category) {
      const category = await categories.findOne({
        $or: [
          { _id: new ObjectId(validatedData.category) },
          { name: validatedData.category },
          { slug: validatedData.category },
        ],
      });
      if (category) {
        categoryId = category._id.toString();
      }
    }
    
    // Find product
    let product = null;
    let productId: ObjectId | null = null;
    
    if (ObjectId.isValid(id)) {
      productId = new ObjectId(id);
      product = await products.findOne({ _id: productId });
    }
    
    if (!product) {
      product = await products.findOne({ slug: id });
      if (product) {
        productId = product._id;
      }
    }
    
    if (!product || !productId) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check slug uniqueness if slug is being updated
    if (validatedData.slug && validatedData.slug !== product.slug) {
      const existingProduct = await products.findOne({ 
        slug: validatedData.slug,
        _id: { $ne: productId },
      });
      if (existingProduct) {
        return NextResponse.json(
          { error: 'Product with this slug already exists' },
          { status: 409 }
        );
      }
    }
    
    // Calculate volumetric weight if dimensions provided
    const updateData: any = { ...validatedData };
    if (updateData.length && updateData.width && updateData.height && !updateData.volumetricWeight) {
      updateData.volumetricWeight = (updateData.length * updateData.width * updateData.height) / 6000;
    }

    // Replace category string with categoryId
    if (categoryId) {
      updateData.categoryId = categoryId;
      delete updateData.category;
    }
    
    updateData.updatedAt = new Date();
    
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
    
    return NextResponse.json({ product: mappedProduct });
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
    
    console.error('[Admin Product API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update product',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { products } = await getCollections();
    const { id } = params;
    
    // Find product
    let productId: ObjectId | null = null;
    
    if (ObjectId.isValid(id)) {
      productId = new ObjectId(id);
    } else {
      const product = await products.findOne({ slug: id });
      if (product) {
        productId = product._id;
      }
    }
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Delete product
    await products.deleteOne({ _id: productId });
    
    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Admin Product API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to delete product',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

