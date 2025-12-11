/**
 * Admin Products API Route
 * GET /api/admin/products - List products (with filters)
 * POST /api/admin/products - Create new product
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { mapMongoProduct } from '@/lib/utils/productMapper';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Product schema for validation
const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  sku: z.string().optional(),
  minPrice: z.number().min(0),
  maxPrice: z.number().min(0).optional(),
  images: z.array(z.string()).default([]),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
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
  })).default([]),
  isHot: z.boolean().default(false),
  isActive: z.boolean().default(true),
  status: z.enum(['draft', 'publish']).default('draft'),
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
    giftWrapping: z.boolean().default(false),
    giftWrappingPrice: z.number().optional(),
    giftMessageEnabled: z.boolean().default(false),
    giftMessageMaxLength: z.number().optional(),
    giftCardEnabled: z.boolean().default(false),
    giftCardTypes: z.array(z.string()).optional(),
    giftDeliveryDateEnabled: z.boolean().default(false),
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
      quantity: z.number().min(1),
      discount: z.number().min(0).max(100).optional(),
    })).optional(),
    relatedProducts: z.array(z.string()).optional(),
    upsellProducts: z.array(z.string()).optional(),
    crossSellProducts: z.array(z.string()).optional(),
  }).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '10', 10);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    
    const { products } = await getCollections();
    
    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    // Fetch products
    const [productsList, total] = await Promise.all([
      products
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .toArray(),
      products.countDocuments(query),
    ]);
    
    const mappedProducts = productsList.map((product) => mapMongoProduct(product));
    const totalPages = Math.ceil(total / perPage);
    
    return NextResponse.json({
      products: mappedProducts,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        perPage,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error('[Admin Products API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch products',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate input
    const validatedData = productSchema.parse(body);
    
    const { products } = await getCollections();
    
    // Check if slug already exists
    const existingProduct = await products.findOne({ slug: validatedData.slug });
    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this slug already exists' },
        { status: 409 }
      );
    }
    
    // Calculate volumetric weight if dimensions provided
    let volumetricWeight = validatedData.volumetricWeight;
    if (!volumetricWeight && validatedData.length && validatedData.width && validatedData.height) {
      volumetricWeight = (validatedData.length * validatedData.width * validatedData.height) / 6000;
    }
    
    // Create product document
    const productDoc = {
      ...validatedData,
      volumetricWeight,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await products.insertOne(productDoc);
    
    // Fetch created product
    const createdProduct = await products.findOne({ _id: result.insertedId });
    
    if (!createdProduct) {
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }
    
    const mappedProduct = mapMongoProduct(createdProduct);
    
    return NextResponse.json(
      { product: mappedProduct },
      { status: 201 }
    );
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
    
    console.error('[Admin Products API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create product',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

