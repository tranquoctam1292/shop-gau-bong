/**
 * Admin Product Import API Route
 * POST /api/admin/products/import - Import products from CSV/Excel/JSON
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Product import schema
const productImportSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().min(0),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(['draft', 'publish']).default('draft'),
  isActive: z.boolean().default(true),
  stockQuantity: z.number().default(0),
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  weight: z.number().optional(),
});

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
    const { products, data, format } = body;
    
    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: 'Invalid products data' },
        { status: 400 }
      );
    }
    
    const { products: productsCollection, categories } = await getCollections();
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string }>,
    };
    
    // Process each product
    for (let i = 0; i < products.length; i++) {
      try {
        const productData = products[i];
        
        // Validate product data
        const validatedData = productImportSchema.parse(productData);
        
        // Generate slug if not provided
        let slug = validatedData.slug || validatedData.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        // Check if slug exists
        const existingProduct = await productsCollection.findOne({ slug });
        if (existingProduct) {
          slug = `${slug}-${Date.now()}-${i}`;
        }
        
        // Handle category
        let categoryId = null;
        if (validatedData.category) {
          const category = await categories.findOne({
            $or: [
              { name: validatedData.category },
              { slug: validatedData.category },
            ],
          });
          if (category) {
            categoryId = category._id.toString();
          }
        }
        
        // Calculate volumetric weight if dimensions provided
        let volumetricWeight: number | undefined;
        if (validatedData.length && validatedData.width && validatedData.height) {
          volumetricWeight = (validatedData.length * validatedData.width * validatedData.height) / 6000;
        }
        
        // Create product document
        const productDoc = {
          ...validatedData,
          slug,
          categoryId: categoryId || undefined,
          volumetricWeight,
          variants: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await productsCollection.insertOne(productDoc);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          error: error.message || 'Unknown error',
        });
      }
    }
    
    return NextResponse.json({
      message: `Import completed: ${results.success} succeeded, ${results.failed} failed`,
      results,
    });
  } catch (error: any) {
    console.error('[Admin Product Import API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to import products',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

