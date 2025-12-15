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
    const orderby = searchParams.get('orderby') || 'date';
    const order = searchParams.get('order') || 'desc';
    
    const { products, categories } = await getCollections();
    
    // Build MongoDB query
    // Only show published, active products that are not deleted
    const query: any = {
      status: 'publish',
      isActive: true,
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } },
      ],
    };
    
    // Search filter
    if (search) {
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { sku: { $regex: search, $options: 'i' } },
          ]
        }
      ];
    }
    
    // Category filter - hỗ trợ nhiều categories (comma-separated)
    if (category) {
      const categorySlugs = category.split(',').map(s => s.trim()).filter(Boolean);
      if (categorySlugs.length > 0) {
        const categoryDocs = await categories.find({
          slug: { $in: categorySlugs }
        }).toArray();
        
        if (categoryDocs.length > 0) {
          const categoryIds = categoryDocs.map(cat => cat._id.toString());
          // Hỗ trợ cả category (single) và categories (array)
          const categoryCondition: any = {};
          if (categoryIds.length === 1) {
            categoryCondition.$or = [
              { category: categoryIds[0] },
              { categories: categoryIds[0] },
            ];
          } else {
            categoryCondition.$or = [
              { category: { $in: categoryIds } },
              { categories: { $in: categoryIds } },
            ];
          }
          
          if (!query.$and) {
            query.$and = [];
          }
          query.$and.push(categoryCondition);
        }
      }
    }
    
    // Featured filter
    if (featured) {
      query.isHot = true;
    }
    
    // Price range filter
    // Products có thể có: price (simple), minPrice/maxPrice (variable), hoặc regularPrice/salePrice
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceConditions: any[] = [];
      
      // Simple products: filter by price field
      if (minPrice !== undefined && maxPrice !== undefined) {
        priceConditions.push({ price: { $gte: minPrice, $lte: maxPrice } });
      } else if (minPrice !== undefined) {
        priceConditions.push({ price: { $gte: minPrice } });
      } else if (maxPrice !== undefined) {
        priceConditions.push({ price: { $lte: maxPrice } });
      }
      
      // Variable products: filter by minPrice/maxPrice range overlap
      if (minPrice !== undefined && maxPrice !== undefined) {
        // Product price range overlaps with filter range
        priceConditions.push({
          $and: [
            { minPrice: { $lte: maxPrice } },
            { maxPrice: { $gte: minPrice } },
          ]
        });
      } else if (minPrice !== undefined) {
        priceConditions.push({ maxPrice: { $gte: minPrice } });
      } else if (maxPrice !== undefined) {
        priceConditions.push({ minPrice: { $lte: maxPrice } });
      }
      
      // Products with regularPrice/salePrice
      if (minPrice !== undefined && maxPrice !== undefined) {
        priceConditions.push({
          $or: [
            { regularPrice: { $gte: minPrice, $lte: maxPrice } },
            { salePrice: { $gte: minPrice, $lte: maxPrice } },
          ]
        });
      } else if (minPrice !== undefined) {
        priceConditions.push({
          $or: [
            { regularPrice: { $gte: minPrice } },
            { salePrice: { $gte: minPrice } },
          ]
        });
      } else if (maxPrice !== undefined) {
        priceConditions.push({
          $or: [
            { regularPrice: { $lte: maxPrice } },
            { salePrice: { $lte: maxPrice } },
          ]
        });
      }
      
      // Combine all price conditions with $or
      if (priceConditions.length > 0) {
        if (!query.$and) {
          query.$and = [];
        }
        query.$and.push({ $or: priceConditions });
      }
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
    
    // Size and Color filter (from variants) - dùng $elemMatch để match variant
    if (size || color) {
      const variantMatch: any = {};
      
      if (size) {
        variantMatch.size = { $regex: size, $options: 'i' };
      }
      
      if (color) {
        variantMatch.color = { $regex: color, $options: 'i' };
      }
      
      query.variants = {
        $elemMatch: variantMatch
      };
    }
    
    // Build sort object
    const sortObj: any = {};
    switch (orderby) {
      case 'price':
        sortObj.price = order === 'asc' ? 1 : -1;
        break;
      case 'title':
      case 'name':
        sortObj.name = order === 'asc' ? 1 : -1;
        break;
      case 'date':
      default:
        sortObj.createdAt = order === 'asc' ? 1 : -1;
        break;
    }
    
    // Fetch products with pagination
    const [productsList, total] = await Promise.all([
      products
        .find(query)
        .sort(sortObj)
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b261569c-76a6-4f8c-839c-264dc5457f92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:129',message:'API FULL PRODUCT DOCUMENT',data:{productId:product._id?.toString(),name:product.name,_thumbnail_id:product._thumbnail_id,_product_image_gallery:product._product_image_gallery,images:product.images,imagesLength:product.images?.length,hasVariants:!!product.variants?.length,variantsCount:product.variants?.length,variants:product.variants?.slice(0,2),hasProductDataMetaBox:!!product.productDataMetaBox,productDataMetaBoxAttributes:product.productDataMetaBox?.attributes,productDataMetaBoxVariations:product.productDataMetaBox?.variations,minPrice:product.minPrice,maxPrice:product.maxPrice,regularPrice:product.productDataMetaBox?.regularPrice,salePrice:product.productDataMetaBox?.salePrice},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H1,H2,H3,H4'})}).catch(()=>{});
      // #endregion
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

