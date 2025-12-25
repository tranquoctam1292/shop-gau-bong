/**
 * Admin Lightweight Product API Route for Quick Edit
 * GET /api/admin/products/[id]/quick-edit - Get lightweight product data for Quick Edit dialog
 * 
 * PERFORMANCE OPTIMIZATION (2.1.2): Lightweight endpoint that only returns fields needed for Quick Edit
 * This reduces data transfer and improves performance compared to the full product endpoint
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { mapMongoProduct, MongoProduct } from '@/lib/utils/productMapper';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

/**
 * Lightweight projection for Quick Edit - only includes fields used in Quick Edit form
 * 
 * Fields INCLUDED:
 * - Basic: _id, name, sku, slug, status, visibility, password, version
 * - Pricing: minPrice, maxPrice, productDataMetaBox (regularPrice, salePrice, costPrice)
 * - Stock: productDataMetaBox (stockQuantity, stockStatus, manageStock, lowStockThreshold, backorders, soldIndividually)
 * - Dimensions: weight, length, width, height, volumetricWeight
 * - Categories & Tags: categories, categoryId, category, tags
 * - Images: _thumbnail_id, _product_image_gallery, images (for backward compatibility)
 * - SEO: seo (seoTitle, seoDescription only)
 * - Product Type: productDataMetaBox (productType)
 * - Shipping & Tax: productDataMetaBox (shippingClass, taxStatus, taxClass)
 * - Barcode: productDataMetaBox (barcode, gtin, ean)
 * - Variants: variants array, productDataMetaBox.variations (for conversion)
 * - Timestamps: createdAt, updatedAt, deletedAt
 * 
 * Fields EXCLUDED (not needed for Quick Edit):
 * - Full description (large HTML content)
 * - Short description (not editable in Quick Edit)
 * - Related products
 * - Reviews
 * - Analytics data
 * - Full SEO data (only seoTitle, seoDescription needed)
 * - Gift features (not in Quick Edit form)
 * - Media extended (videos, 360 images - not in Quick Edit form)
 * - Product schema JSON-LD
 * - Other metadata not used in Quick Edit
 */
const QUICK_EDIT_PROJECTION: Record<string, 1> = {
  _id: 1,
  name: 1,
  sku: 1,
  slug: 1,
  status: 1,
  visibility: 1,
  password: 1,
  version: 1,
  minPrice: 1,
  maxPrice: 1,
  weight: 1,
  length: 1,
  width: 1,
  height: 1,
  volumetricWeight: 1,
  category: 1,
  categoryId: 1,
  categories: 1,
  tags: 1,
  images: 1,
  _thumbnail_id: 1,
  _product_image_gallery: 1,
  seo: 1,
  productDataMetaBox: 1, // Includes: pricing, stock, variants, productType, shipping, tax, barcode
  variants: 1,
  createdAt: 1,
  updatedAt: 1,
  deletedAt: 1,
};

// ✅ FIX: Helper function to ensure JSON response even for initialization errors
async function safeHandler(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error: unknown) {
    console.error('[Admin Product Quick Edit API] Handler initialization error:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Internal server error';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        code: 'HANDLER_INIT_ERROR',
        details: process.env.NODE_ENV === 'development' && error instanceof Error
          ? { 
              stack: error.stack,
              name: error.name,
            }
          : undefined,
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return safeHandler(async () => {
    return await withAuthAdmin(request, async (req: AuthenticatedRequest) => {
      try {
        // Permission: product:read (checked by middleware)
        // ✅ FIX: Wrap getCollections in try-catch to handle MongoDB connection errors
        let products, categories;
        try {
          const collections = await getCollections();
          products = collections.products;
          categories = collections.categories;
        } catch (dbError) {
          console.error('[Admin Product Quick Edit API] MongoDB connection error:', dbError);
          return NextResponse.json(
            { 
              error: 'Database connection failed',
              code: 'DB_CONNECTION_ERROR',
              details: process.env.NODE_ENV === 'development' && dbError instanceof Error
                ? { message: dbError.message }
                : undefined,
            },
            { 
              status: 500,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
        }
        
        // ✅ FIX: Ensure params.id exists and is a string
        if (!params || !params.id || typeof params.id !== 'string') {
          return NextResponse.json(
            { error: 'Product ID is required' },
            { status: 400 }
          );
        }
        
        let { id } = params;
      
        // Extract ObjectId from GraphQL format if needed (backward compatibility)
        // Format: gid://shop-gau-bong/Product/OBJECT_ID
        if (id.startsWith('gid://shop-gau-bong/Product/')) {
          id = id.replace('gid://shop-gau-bong/Product/', '');
        }
        
        // BUSINESS LOGIC FIX: ID Validation (Security) - Ngăn chặn NoSQL Injection
        // Nếu id không phải ObjectId hợp lệ và không phải slug, trả về lỗi 400 ngay lập tức
        if (!ObjectId.isValid(id) && !id.match(/^[a-z0-9-]+$/)) {
          return NextResponse.json(
            { error: 'ID sản phẩm không hợp lệ' },
            { status: 400 }
          );
        }
        
        // Find by ObjectId or slug with lightweight projection
        let product = null;
        
        if (ObjectId.isValid(id)) {
          product = await products.findOne({ _id: new ObjectId(id) }, { projection: QUICK_EDIT_PROJECTION });
        }
        
        if (!product) {
          product = await products.findOne({ slug: id }, { projection: QUICK_EDIT_PROJECTION });
        }
        
        if (!product) {
          return NextResponse.json(
            { error: 'Product not found' },
            { status: 404 }
          );
        }
        
        // Populate categories before mapping
        const categoryIds: string[] = [];
        
        // Get category IDs from product
        if (product.categories && Array.isArray(product.categories) && product.categories.length > 0) {
          // Multiple categories (new structure)
          categoryIds.push(...product.categories.filter((id: any) => id));
        } else if (product.categoryId) {
          // Single category ID
          categoryIds.push(product.categoryId);
        } else if (product.category) {
          // Legacy: single category (could be ID or slug)
          categoryIds.push(product.category);
        }
        
        // Fetch category documents
        const categoryDocs = categoryIds.length > 0
          ? await categories.find({
              $or: [
                { _id: { $in: categoryIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id)) } },
                { slug: { $in: categoryIds.filter((id) => !ObjectId.isValid(id)) } },
              ],
            }).toArray()
          : [];
        
        // Map categories to frontend format (use string ID instead of parseInt)
        const populatedCategories = categoryDocs.map((cat: any) => ({
          id: cat._id.toString(), // Use ObjectId string directly
          name: cat.name,
          slug: cat.slug,
        }));
        
        // Map to frontend format with populated categories
        const mappedProduct = mapMongoProduct(product as unknown as MongoProduct, populatedCategories);
        
        // Convert productDataMetaBox.variations → variants array if variations exist
        // This is needed for Quick Edit dialog and other frontend components
        let variants: Array<{
          id: string;
          size: string;
          color?: string;
          colorCode?: string;
          price: number;
          stock: number;
          image?: string;
          sku?: string;
        }> | undefined = undefined;
        
        // Priority 1: Use variants array from MongoDB (if exists)
        // BUT: If variants don't have color field, enrich from productDataMetaBox.variations
        if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
          // Check if variants have color field
          const hasColorInVariants = product.variants.some((v: any) => v.color);
          
          // If variants don't have color, try to enrich from productDataMetaBox.variations
          if (!hasColorInVariants && product.productDataMetaBox?.variations && product.productDataMetaBox.variations.length > 0) {
            // Find color attribute in productDataMetaBox.attributes to get colorCodes mapping
            const colorAttribute = product.productDataMetaBox?.attributes?.find((attr: any) => {
              const attrNameLower = (attr.name || '').toLowerCase();
              return attrNameLower.includes('color') || 
                     attrNameLower === 'pa_color' || 
                     attrNameLower === 'màu' ||
                     attrNameLower === 'màu sắc';
            });
            const colorCodesMap = colorAttribute?.colorCodes || {};
            const colorAttributeName = colorAttribute?.name || '';
            
            // Create a map of variations by variation ID for quick lookup
            const variationMap = new Map<string, any>();
            product.productDataMetaBox.variations.forEach((variation: any) => {
              if (variation.id) {
                variationMap.set(variation.id, variation);
              }
            });
            
            // Enrich variants with color from productDataMetaBox.variations
            variants = product.variants.map((v: any) => {
              const variation = variationMap.get(v.id);
              let color: string | undefined = v.color || undefined;
              let colorCode: string | undefined = v.colorCode || undefined;
              
              // If variation found, extract color and colorCode
              if (variation) {
                // Priority 1: Use direct colorCode field if available
                if (!colorCode && variation.colorCode) {
                  colorCode = variation.colorCode;
                }
                
                // Extract color from variation attributes if not in variant
                const variationAttributes = variation.attributes;
                if (!color && variationAttributes && typeof variationAttributes === 'object') {
                  Object.entries(variationAttributes).forEach(([attrName, value]) => {
                    const attrNameLower = attrName.toLowerCase().trim();
                    const valueStr = String(value).trim();
                    
                    // Normalize attribute names for comparison
                    const normalizeString = (str: string) => {
                      return str.toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '') // Remove accents
                        .trim();
                    };
                    
                    const normalizedAttrName = normalizeString(attrName);
                    const normalizedColorAttrName = colorAttributeName ? normalizeString(colorAttributeName) : '';
                    
                    // Check if this is a color attribute
                    const isColorAttr = colorAttributeName ? (
                      attrName === colorAttributeName ||
                      normalizedAttrName === normalizedColorAttrName ||
                      normalizedAttrName.includes('color') || 
                      normalizedAttrName === 'pa_color' || 
                      normalizedAttrName === 'mau' ||
                      normalizedAttrName === 'mau sac' ||
                      normalizedAttrName.includes('mau')
                    ) : (
                      normalizedAttrName.includes('color') || 
                      normalizedAttrName === 'pa_color' || 
                      normalizedAttrName === 'mau' ||
                      normalizedAttrName === 'mau sac' ||
                      normalizedAttrName.includes('mau')
                    );
                    
                    if (isColorAttr && !color) {
                      color = valueStr;
                      // Lookup colorCode from colorCodes mapping if not already found
                      if (!colorCode) {
                        colorCode = colorCodesMap[valueStr] || 
                                   colorCodesMap[valueStr.toLowerCase()] || 
                                   colorCodesMap[valueStr.toUpperCase()] ||
                                   colorCodesMap[valueStr.trim()] ||
                                   undefined;
                      }
                    }
                  });
                }
              }
              
              return {
                id: v.id || '',
                size: v.size || '',
                color: color || undefined,
                colorCode: colorCode || undefined,
                price: v.price || 0,
                stock: v.stock || v.stockQuantity || 0,
                image: v.image || undefined,
                sku: v.sku || undefined,
              };
            });
          } else {
            // Variants already have color or no productDataMetaBox.variations - use as is
            variants = product.variants.map((v: any) => ({
              id: v.id || '',
              size: v.size || '',
              color: v.color || undefined,
              colorCode: v.colorCode || undefined,
              price: v.price || 0,
              stock: v.stock || v.stockQuantity || 0,
              image: v.image || undefined,
              sku: v.sku || undefined,
            }));
          }
        }
        // Priority 2: Convert from productDataMetaBox.variations (if variants array doesn't exist)
        else if (product.productDataMetaBox?.variations && product.productDataMetaBox.variations.length > 0) {
          // Find color attribute in productDataMetaBox.attributes to get colorCodes mapping
          const colorAttribute = product.productDataMetaBox?.attributes?.find((attr: any) => {
            const attrNameLower = (attr.name || '').toLowerCase();
            return attrNameLower.includes('color') || 
                   attrNameLower === 'pa_color' || 
                   attrNameLower === 'màu' ||
                   attrNameLower === 'màu sắc';
          });
          const colorCodesMap = colorAttribute?.colorCodes || {};
          
          // Find size attribute name for matching
          const sizeAttribute = product.productDataMetaBox?.attributes?.find((attr: any) => {
            const attrNameLower = (attr.name || '').toLowerCase();
            return attrNameLower.includes('size') || 
                   attrNameLower === 'pa_size' || 
                   attrNameLower === 'kích thước';
          });
          const sizeAttributeName = sizeAttribute?.name || '';
          const colorAttributeName = colorAttribute?.name || '';
          
          variants = product.productDataMetaBox.variations.map((variation: any) => {
            // Extract size and color from attributes
            let size = '';
            let color = '';
            let colorCode = '';
            
            if (variation.attributes && typeof variation.attributes === 'object') {
              Object.entries(variation.attributes).forEach(([attrName, value]) => {
                const attrNameLower = attrName.toLowerCase().trim();
                const valueStr = String(value).trim();
                
                // Normalize attribute names for comparison
                const normalizeString = (str: string) => {
                  return str.toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '') // Remove accents
                    .trim();
                };
                
                const normalizedAttrName = normalizeString(attrName);
                const normalizedSizeAttrName = sizeAttributeName ? normalizeString(sizeAttributeName) : '';
                const normalizedColorAttrName = colorAttributeName ? normalizeString(colorAttributeName) : '';
                
                // Match by attribute name
                const isSizeAttr = sizeAttributeName ? (
                  attrName === sizeAttributeName ||
                  normalizedAttrName === normalizedSizeAttrName ||
                  normalizedAttrName.includes('size') || 
                  normalizedAttrName === 'pa_size' || 
                  normalizedAttrName === 'kich thuoc' ||
                  normalizedAttrName.includes('kich thuoc')
                ) : (
                  normalizedAttrName.includes('size') || 
                  normalizedAttrName === 'pa_size' || 
                  normalizedAttrName === 'kich thuoc' ||
                  normalizedAttrName.includes('kich thuoc')
                );
                
                const isColorAttr = colorAttributeName ? (
                  attrName === colorAttributeName ||
                  normalizedAttrName === normalizedColorAttrName ||
                  normalizedAttrName.includes('color') || 
                  normalizedAttrName === 'pa_color' || 
                  normalizedAttrName === 'mau' ||
                  normalizedAttrName === 'mau sac' ||
                  normalizedAttrName.includes('mau')
                ) : (
                  normalizedAttrName.includes('color') || 
                  normalizedAttrName === 'pa_color' || 
                  normalizedAttrName === 'mau' ||
                  normalizedAttrName === 'mau sac' ||
                  normalizedAttrName.includes('mau')
                );
                
                if (isSizeAttr && !size) {
                  size = valueStr;
                } else if (isColorAttr && !color) {
                  color = valueStr;
                  // Lookup colorCode from colorCodes mapping
                  colorCode = colorCodesMap[valueStr] || 
                             colorCodesMap[valueStr.toLowerCase()] || 
                             colorCodesMap[valueStr.toUpperCase()] ||
                             colorCodesMap[valueStr.trim()] ||
                             '';
                }
              });
            }
            
            // Use salePrice if available and valid, otherwise use regularPrice
            const price = variation.salePrice && variation.regularPrice && variation.salePrice < variation.regularPrice
              ? variation.salePrice
              : variation.regularPrice || 0;
            
            return {
              id: variation.id || '',
              size,
              color: color || undefined,
              colorCode: colorCode || undefined,
              price,
              stock: variation.stockQuantity || 0,
              image: variation.image || undefined,
              sku: variation.sku || undefined,
            };
          });
        }
        
        // Include image IDs in response for frontend
        const response: any = {
          product: {
            ...mappedProduct,
            // Override categories with populated data
            categories: populatedCategories,
            // Include raw IDs for frontend to use
            _thumbnail_id: product._thumbnail_id || undefined,
            _product_image_gallery: product._product_image_gallery || undefined,
            scheduledDate: product.scheduledDate || undefined,
            password: product.password || undefined,
            // Include status and visibility from raw MongoDB document
            status: product.status || 'draft',
            visibility: product.visibility || 'public',
            // Include version for optimistic locking
            version: mappedProduct.version !== undefined ? mappedProduct.version : (product.version || 0),
            // Include productDataMetaBox from raw MongoDB document
            productDataMetaBox: product.productDataMetaBox || undefined,
            // Include variants array (converted from productDataMetaBox.variations or from product.variants)
            variants: variants || undefined,
          },
        };
        
        return NextResponse.json(response);
      } catch (error: unknown) {
        // ✅ FIX: Improved error handling to always return JSON
        console.error('[Admin Product Quick Edit API] GET Error:', error);
        
        // Ensure we always return JSON, not HTML error page
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Failed to fetch product';
        
        const errorDetails = process.env.NODE_ENV === 'development' && error instanceof Error
          ? { 
              stack: error.stack,
              name: error.name,
            }
          : undefined;
        
        return NextResponse.json(
          { 
            error: errorMessage,
            details: errorDetails,
          },
          { 
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }, 'product:read');
  });
}

