/**
 * Public Products API Route
 * GET /api/cms/products
 * 
 * Fetch products from MongoDB (public endpoint)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { mapMongoProduct } from '@/lib/utils/productMapper';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '10', 10);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured') === 'true';
    const minPrice = searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : undefined;
    const maxPrice = searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : undefined;
    const minLength = searchParams.get('min_length') ? parseFloat(searchParams.get('min_length')!) : undefined;
    const maxLength = searchParams.get('max_length') ? parseFloat(searchParams.get('max_length')!) : undefined;
    const material = searchParams.get('material');
    const size = searchParams.get('size');
    const color = searchParams.get('color');
    
    const { products, categories } = await getCollections();
    
    // Build MongoDB query
    const query: any = {
      status: 'publish',
      isActive: true,
    };
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Category filter
    if (category) {
      const categoryDoc = await categories.findOne({ slug: category });
      if (categoryDoc) {
        query.category = categoryDoc._id.toString();
      }
    }
    
    // Featured filter
    if (featured) {
      query.isHot = true;
    }
    
    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.minPrice = {};
      if (minPrice !== undefined) query.minPrice.$gte = minPrice;
      if (maxPrice !== undefined) query.minPrice.$lte = maxPrice;
    }
    
    // Length filter (for size filtering)
    if (minLength !== undefined || maxLength !== undefined) {
      query.length = {};
      if (minLength !== undefined) query.length.$gte = minLength;
      if (maxLength !== undefined) query.length.$lte = maxLength;
    }
    
    // Material filter
    if (material) {
      query.material = { $regex: material, $options: 'i' };
    }
    
    // Size filter (from variants)
    if (size) {
      query['variants.size'] = { $regex: size, $options: 'i' };
    }
    
    // Color filter (from variants)
    if (color) {
      query['variants.color'] = { $regex: color, $options: 'i' };
    }
    
    // Fetch products with pagination
    const [productsList, total] = await Promise.all([
      products
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .toArray(),
      products.countDocuments(query),
    ]);
    
    // Fetch categories for mapping
    const categoryIds = productsList
      .map(p => p.category)
      .filter(Boolean)
      .filter((id, index, self) => self.indexOf(id) === index); // Unique IDs
    
    const categoryDocs = categoryIds.length > 0
      ? await categories.find({
          $or: [
            ...(categoryIds.filter(id => ObjectId.isValid(String(id))).length > 0
              ? [{ _id: { $in: categoryIds.filter(id => ObjectId.isValid(String(id))).map(id => new ObjectId(String(id))) } }]
              : []),
            ...(categoryIds.filter(id => !ObjectId.isValid(String(id))).length > 0
              ? [{ slug: { $in: categoryIds.filter(id => !ObjectId.isValid(String(id))) } }]
              : []),
          ],
        }).toArray()
      : [];
    
    const categoryMap = new Map<string, any>();
    categoryDocs.forEach(cat => {
      const catId = cat._id.toString();
      categoryMap.set(catId, cat);
      categoryMap.set(cat.slug, cat);
    });
    
    // Map products to frontend format with categories
    const mappedProducts = productsList.map((product) => {
      const mapped = mapMongoProduct(product);
      
      // Populate categories
      if (product.category) {
        const categoryDoc = categoryMap.get(product.category) || 
                           categoryMap.get(String(product.category));
        if (categoryDoc) {
          mapped.categories = [{
            id: parseInt(categoryDoc._id.toString(), 16) || 0,
            name: categoryDoc.name,
            slug: categoryDoc.slug,
          }];
        }
      }
      
      return mapped;
    });
    
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
    console.error('[Products API] Error:', error);
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

