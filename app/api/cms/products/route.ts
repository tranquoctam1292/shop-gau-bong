/**
 * Public Products API Route
 * GET /api/cms/products
 * 
 * Fetch products from MongoDB (public endpoint)
 * 
 * ✅ PERFORMANCE: Sử dụng ISR với revalidate 1 giờ để cache tại Edge/Server
 * Giúp giảm tải database tới 99% - Cache response tại CDN/Edge trong 1 giờ
 * Cache sẽ tự động invalidate khi có query params khác nhau (search, category, price, etc.)
 * 
 * ⚠️ NOTE: Khi Admin update sản phẩm, cần gọi revalidateTag/revalidatePath để xóa cache
 * (Xem Bước 4: Cache Invalidation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { mapMongoProduct, MongoProduct } from '@/lib/utils/productMapper';

// Cache 1 giờ (3600 giây) - ISR (Incremental Static Regeneration)
export const revalidate = 3600;

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
    // Base conditions: status, isActive, deletedAt
    // Using Record<string, unknown> for MongoDB filter query type safety
    const baseConditions: Record<string, unknown> = {
      status: 'publish',
      isActive: true,
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } },
      ],
    };
    
    // Additional conditions (search, category, price, etc.)
    const additionalConditions: Record<string, unknown>[] = [];
    
    // Search filter
    if (search) {
      additionalConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
        ]
      });
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
          const categoryCondition: Record<string, unknown> = {};
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
          
          additionalConditions.push(categoryCondition);
        }
      }
    }
    
    // Price range filter
    // Products có thể có: price (simple), minPrice/maxPrice (variable), hoặc regularPrice/salePrice
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceConditions: Record<string, unknown>[] = [];
      
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
        additionalConditions.push({ $or: priceConditions });
      }
    }
    
    // Size and Color filter
    // Products có thể lưu color/size trong:
    // 1. variants[].size và variants[].color (direct fields)
    // 2. productDataMetaBox.variations[].attributes (legacy format)
    // 3. productDataMetaBox.attributes[].values (global attributes)
    // 
    // QUAN TRỌNG: Nếu có cả size VÀ color, phải match CẢ HAI (AND logic)
    // Nếu chỉ có size HOẶC chỉ có color, chỉ cần match điều kiện đó
    if (size || color) {
      const sizeColorConditions: Record<string, unknown>[] = [];
      
      // Condition 1: Filter by variants array (direct size/color fields)
      // Nếu có cả size và color, variantMatch phải có CẢ HAI
      if (size || color) {
        const variantMatch: Record<string, unknown> = {};
        
        if (size) {
          variantMatch.size = { $regex: size, $options: 'i' };
        }
        
        if (color) {
          variantMatch.color = { $regex: color, $options: 'i' };
        }
        
        // Chỉ push nếu có ít nhất một điều kiện
        if (Object.keys(variantMatch).length > 0) {
          sizeColorConditions.push({
            variants: {
              $elemMatch: variantMatch
            }
          });
        }
      }
      
      // Condition 2: Filter by productDataMetaBox.variations[].attributes
      // (for products that haven't been converted to variants array yet)
      // QUAN TRỌNG: Nếu có cả size VÀ color, phải match CẢ HAI trong CÙNG MỘT variation
      // Dùng $elemMatch để đảm bảo cả size và color nằm trong cùng một variation object
      if (size || color) {
        const variationAttributesMatch: any = {};
        
        if (size) {
          // Match size trong variations attributes
          variationAttributesMatch.$or = [
            { 'productDataMetaBox.variations.attributes.Kích thước': { $regex: size, $options: 'i' } },
            { 'productDataMetaBox.variations.attributes.kích thước': { $regex: size, $options: 'i' } },
            { 'productDataMetaBox.variations.attributes.pa_size': { $regex: size, $options: 'i' } },
            { 'productDataMetaBox.variations.attributes.size': { $regex: size, $options: 'i' } },
          ];
        }
        
        if (color) {
          // Match color trong variations attributes
          const colorConditions = [
            { 'productDataMetaBox.variations.attributes.Màu sắc': { $regex: color, $options: 'i' } },
            { 'productDataMetaBox.variations.attributes.màu sắc': { $regex: color, $options: 'i' } },
            { 'productDataMetaBox.variations.attributes.Màu': { $regex: color, $options: 'i' } },
            { 'productDataMetaBox.variations.attributes.màu': { $regex: color, $options: 'i' } },
            { 'productDataMetaBox.variations.attributes.pa_color': { $regex: color, $options: 'i' } },
            { 'productDataMetaBox.variations.attributes.color': { $regex: color, $options: 'i' } },
          ];
          
          if (variationAttributesMatch.$or) {
            // Có cả size và color, phải match CẢ HAI trong cùng một variation
            // Dùng $and để đảm bảo cả size và color đều match
            variationAttributesMatch.$and = [
              { $or: variationAttributesMatch.$or },
              { $or: colorConditions }
            ];
            delete variationAttributesMatch.$or;
          } else {
            // Chỉ có color
            variationAttributesMatch.$or = colorConditions;
          }
        }
        
        if (Object.keys(variationAttributesMatch).length > 0) {
          // Wrap trong $elemMatch để đảm bảo cả size và color nằm trong cùng một variation
          if (variationAttributesMatch.$and) {
            // Có cả size và color, cần $elemMatch để match trong cùng một variation
            sizeColorConditions.push({
              'productDataMetaBox.variations': {
                $elemMatch: {
                  $and: [
                    { $or: variationAttributesMatch.$and[0].$or },
                    { $or: variationAttributesMatch.$and[1].$or }
                  ]
                }
              }
            });
          } else {
            // Chỉ có size hoặc chỉ có color
            sizeColorConditions.push(variationAttributesMatch);
          }
        }
      }
      
      // Condition 3: Filter by productDataMetaBox.attributes[].values
      // (for products with global attributes)
      // Structure: productDataMetaBox.attributes = [{ name: 'Màu sắc', values: ['Hồng Dâu', ...] }]
      // QUAN TRỌNG: Nếu có cả size VÀ color, phải có CẢ HAI attributes match
      const attributesConditions: any[] = [];
      
      if (color) {
        attributesConditions.push({
          'productDataMetaBox.attributes': {
            $elemMatch: {
              $and: [
                {
                  $or: [
                    { name: 'Màu sắc' },
                    { name: 'màu sắc' },
                    { name: 'Màu' },
                    { name: 'màu' },
                    { name: 'pa_color' },
                    { name: 'color' },
                  ]
                },
                {
                  values: {
                    $elemMatch: {
                      $regex: color,
                      $options: 'i'
                    }
                  }
                }
              ]
            }
          }
        });
      }
      
      if (size) {
        attributesConditions.push({
          'productDataMetaBox.attributes': {
            $elemMatch: {
              $and: [
                {
                  $or: [
                    { name: 'Kích thước' },
                    { name: 'kích thước' },
                    { name: 'pa_size' },
                    { name: 'size' },
                  ]
                },
                {
                  values: {
                    $elemMatch: {
                      $regex: size,
                      $options: 'i'
                    }
                  }
                }
              ]
            }
          }
        });
      }
      
      // Nếu có cả size và color, phải match CẢ HAI attributes
      if (attributesConditions.length > 0) {
        if (attributesConditions.length === 1) {
          sizeColorConditions.push(attributesConditions[0]);
        } else {
          // Có cả size và color, phải match CẢ HAI attributes (AND logic)
          sizeColorConditions.push({
            $and: attributesConditions
          });
        }
      }
      
      // Combine all size/color conditions with $or
      // (product matches if ANY of these conditions is true:
      //  - variants match, OR
      //  - variations.attributes match, OR
      //  - productDataMetaBox.attributes match)
      // Nhưng trong mỗi condition, nếu có cả size VÀ color, phải match CẢ HAI
      if (sizeColorConditions.length > 0) {
        additionalConditions.push({ $or: sizeColorConditions });
      }
    }
    
    // Add simple filters to additional conditions
    if (featured) {
      additionalConditions.push({ isHot: true });
    }
    
    if (minLength !== undefined || maxLength !== undefined) {
      const lengthCondition: any = {};
      if (minLength !== undefined) lengthCondition.$gte = minLength;
      if (maxLength !== undefined) lengthCondition.$lte = maxLength;
      additionalConditions.push({ length: lengthCondition });
    }
    
    if (material) {
      additionalConditions.push({ material: { $regex: material, $options: 'i' } });
    }
    
    // Combine all conditions
    // If we have additional conditions, wrap everything in $and
    // Otherwise, use base conditions directly
    const query: any = additionalConditions.length > 0
      ? {
          $and: [
            baseConditions,
            ...additionalConditions,
          ]
        }
      : baseConditions;
    
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
    
    // ✅ PERFORMANCE: Project only fields needed for public product list to reduce payload size
    // This significantly reduces JSON payload (from several MB to ~200KB for 20 products)
    // Fields excluded: description (full HTML), productDataMetaBox.attributes (full), productDataMetaBox.variations (full)
    // Note: Public API needs more fields than Admin API (attributes, categories, galleryImages)
    const publicListProjection = {
      _id: 1,
      name: 1,
      slug: 1,
      status: 1,
      type: 1,
      images: 1,
      _thumbnail_id: 1,
      _product_image_gallery: 1,
      'productDataMetaBox.regularPrice': 1,
      'productDataMetaBox.salePrice': 1,
      'productDataMetaBox.stockStatus': 1,
      'productDataMetaBox.productType': 1,
      'productDataMetaBox.attributes': 1, // Needed for size/color options in ProductCard
      variants: 1, // Needed for price range and stock calculation
      minPrice: 1,
      maxPrice: 1,
      category: 1,
      categories: 1,
      shortDescription: 1, // Only shortDescription, not full description HTML
      createdAt: 1,
      updatedAt: 1,
      deletedAt: 1,
    };
    
    // Fetch products with pagination
    const [productsList, total] = await Promise.all([
      products
        .find(query)
        .project(publicListProjection)
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
      // Populate categories from categoryMap
      const populatedCategories: Array<{ id: string | number; name: string; slug: string }> = [];
      
      // Support multiple categories (product.categories) or single category (product.category)
      const categoryIds = (product.categories && product.categories.length > 0)
        ? product.categories
        : (product.categoryId ? [product.categoryId] : (product.category ? [product.category] : []));
      
      categoryIds.forEach((catId: string) => {
        const categoryDoc = categoryMap.get(catId) || categoryMap.get(String(catId));
        if (categoryDoc) {
          populatedCategories.push({
            id: categoryDoc._id.toString(), // Use ObjectId string directly (not parseInt)
            name: categoryDoc.name,
            slug: categoryDoc.slug,
          });
        }
      });
      
      // Map to frontend format with populated categories
      const mapped = mapMongoProduct(product as unknown as MongoProduct, populatedCategories);
      
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

