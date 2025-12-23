/**
 * Admin Single Product API Route
 * GET /api/admin/products/[id] - Get single product
 * PUT /api/admin/products/[id] - Update product
 * DELETE /api/admin/products/[id] - Delete product
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCollections, ObjectId } from '@/lib/db';
import { mapMongoProduct, MongoProduct } from '@/lib/utils/productMapper';
import { generateProductSchema } from '@/lib/utils/schema';
import { normalizeSku } from '@/lib/utils/skuGenerator';
import { escapeRegExp } from '@/lib/utils/escapeRegExp';
import { cleanHtmlForStorage } from '@/lib/utils/sanitizeHtml';
import { z } from 'zod';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

/**
 * Auto-generate alt text for product images
 * Format: {originalAlt} - Shop Gấu Bông
 */
function generateImageAltText(originalAlt: string | undefined, productName: string, siteName: string = 'Shop Gấu Bông'): string {
  if (originalAlt && originalAlt.trim()) {
    // If alt text already contains site name, don't duplicate
    if (originalAlt.includes(siteName)) {
      return originalAlt;
    }
    return `${originalAlt} - ${siteName}`;
  }
  // Fallback to product name + site name
  return productName ? `${productName} - ${siteName}` : siteName;
}

/**
 * Generate Product Schema (JSON-LD) from product data
 */
function generateProductSchemaFromData(productDoc: any, siteUrl: string = 'https://shop-gaubong.com'): object | null {
  try {
    // Get price (prefer sale price, fallback to regular price)
    const price = productDoc.productDataMetaBox?.salePrice || 
                  productDoc.productDataMetaBox?.regularPrice || 
                  productDoc.minPrice || 
                  0;
    
    // Get stock status
    const stockStatus = productDoc.productDataMetaBox?.stockStatus || 
                       (productDoc.productDataMetaBox?.stockQuantity > 0 ? 'instock' : 'outofstock');
    
    // Get availability
    const availability = stockStatus === 'instock' ? 'InStock' : 
                        stockStatus === 'outofstock' ? 'OutOfStock' : 'PreOrder';
    
    // Get image URL (from _thumbnail_id or images array)
    let imageUrl: string | null = null;
    if (productDoc._thumbnail_id) {
      // TODO: Resolve thumbnail_id to URL when media API is available
      // For now, use first image from images array if available
      imageUrl = productDoc.images?.[0] || null;
    } else if (productDoc.images && productDoc.images.length > 0) {
      imageUrl = productDoc.images[0];
    }
    
    // Get category name
    const categoryName = productDoc.categoryId 
      ? 'Gấu bông' // TODO: Resolve categoryId to name
      : productDoc.category || 'Gấu bông';
    
    // Build URL
    const productUrl = `${siteUrl}/products/${productDoc.slug || productDoc._id.toString()}`;
    
    // Extract size from variations if available
    const additionalProperties: Array<{ name: string; value: string }> = [];
    if (productDoc.productDataMetaBox?.variations && productDoc.productDataMetaBox.variations.length > 0) {
      // Check if variations have Size attribute
      const sizeVariations = productDoc.productDataMetaBox.variations
        .map((v: any) => v.attributes?.Size || v.attributes?.size)
        .filter(Boolean);
      
      if (sizeVariations.length > 0) {
        // Get unique sizes
        const uniqueSizes = [...new Set(sizeVariations)];
        if (uniqueSizes.length === 1) {
          // Single size variant
          additionalProperties.push({ name: 'Size', value: String(uniqueSizes[0]) });
        } else if (uniqueSizes.length > 1) {
          // Multiple sizes - use first one or comma-separated
          additionalProperties.push({ name: 'Size', value: uniqueSizes.join(', ') });
        }
      }
    }
    
    // Generate schema
    const schema = generateProductSchema({
      name: productDoc.name,
      description: productDoc.seo?.seoDescription || productDoc.shortDescription || productDoc.description || null,
      image: imageUrl,
      price: price > 0 ? String(price) : null,
      currency: 'VND',
      sku: productDoc.productDataMetaBox?.sku || productDoc.sku || null,
      availability,
      brand: 'Shop Gấu Bông',
      category: categoryName,
      url: productUrl,
      additionalProperties: additionalProperties.length > 0 ? additionalProperties : undefined,
    });
    
    return schema;
  } catch (error) {
    console.error('Error generating product schema:', error);
    return null;
  }
}

// Product update schema (all fields optional except validation)
const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  sku: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  // Image fields (new structure)
  _thumbnail_id: z.string().optional(), // Attachment ID for featured image
  _product_image_gallery: z.string().optional(), // Comma-separated attachment IDs for gallery
  // Keep images for backward compatibility (will be removed later)
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
  })).optional(),
  isHot: z.boolean().optional(),
  isActive: z.boolean().optional(),
  status: z.enum(['draft', 'publish', 'trash']).optional(),
  visibility: z.enum(['public', 'private', 'password']).optional(),
  password: z.string().optional(),
  scheduledDate: z.string().optional(), // ISO date string
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  weight: z.number().optional(),
  volumetricWeight: z.number().optional(),
  // Phase 1: SEO Meta Box fields
  seo: z.object({
    focusKeyword: z.string().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    slug: z.string().optional(),
    canonicalUrl: z.string().optional(),
    robotsMeta: z.string().optional(),
    ogImage: z.string().optional(),
    ogImageId: z.string().optional(),
    socialDescription: z.string().optional(),
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
  // Product Data Meta Box fields - Use passthrough to keep all fields
  productDataMetaBox: z.object({
    productType: z.enum(['simple', 'variable', 'grouped', 'external']).optional(),
    isVirtual: z.boolean().optional(),
    isDownloadable: z.boolean().optional(),
    costPrice: z.number().optional(),
    regularPrice: z.number().optional(),
    salePrice: z.number().optional(),
    salePriceStartDate: z.string().optional(),
    salePriceEndDate: z.string().optional(),
    downloadableFiles: z.array(z.object({
      id: z.string(),
      name: z.string(),
      url: z.string(),
      downloadLimit: z.number().optional(),
      downloadExpiry: z.string().optional(),
    })).optional(),
    sku: z.string().optional(),
    manageStock: z.boolean().optional(),
    stockQuantity: z.number().int().nonnegative().optional(), // ✅ Validate: integer and >= 0
    stockStatus: z.enum(['instock', 'outofstock', 'onbackorder']).optional(),
    lowStockThreshold: z.number().optional(),
    backorders: z.enum(['no', 'notify', 'yes']).optional(),
    soldIndividually: z.boolean().optional(),
    weight: z.number().optional(),
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    shippingClass: z.string().optional(),
    attributes: z.array(z.object({
      id: z.string(),
      name: z.string(),
      isGlobal: z.boolean().optional(),
      globalAttributeId: z.string().optional(),
      values: z.array(z.string()),
      usedForVariations: z.boolean().optional(),
      colorCodes: z.record(z.string(), z.string()).optional(),
    }).passthrough()).optional(),
    variations: z.array(z.object({
      id: z.string(),
      name: z.string(),
      sku: z.string().optional(),
      costPrice: z.number().optional(),
      regularPrice: z.number().optional(),
      salePrice: z.number().optional(),
      stockQuantity: z.number().int().nonnegative().optional(), // ✅ Validate: integer and >= 0
      image: z.string().optional(),
      attributes: z.record(z.string(), z.string()),
    }).passthrough()).optional(),
    purchaseNote: z.string().optional(),
    menuOrder: z.number().optional(),
    enableReviews: z.boolean().optional(),
  }).passthrough().optional(),
}).passthrough()
  // Validate: regularPrice is required for simple products
  .refine((data) => {
    const productType = data.productDataMetaBox?.productType || 'simple';
    const isSimpleProduct = productType === 'simple';
    const hasVariations = data.productDataMetaBox?.variations && data.productDataMetaBox.variations.length > 0;
    
    // Simple products must have regularPrice (unless they have variations with prices)
    if (isSimpleProduct && !hasVariations) {
      if (data.productDataMetaBox?.regularPrice === undefined || data.productDataMetaBox.regularPrice === null) {
        return false;
      }
      if (data.productDataMetaBox.regularPrice <= 0) {
        return false;
      }
    }
    return true;
  }, {
    message: "Giá bán thường là bắt buộc cho sản phẩm đơn giản",
    path: ["productDataMetaBox", "regularPrice"],
  })
  // Validate: If salePrice exists, regularPrice must exist
  .refine((data) => {
    if (data.productDataMetaBox?.salePrice !== undefined && data.productDataMetaBox.salePrice > 0) {
      if (data.productDataMetaBox?.regularPrice === undefined || data.productDataMetaBox.regularPrice === null) {
        return false;
      }
    }
    return true;
  }, {
    message: "Phải có giá bán thường khi đặt giá khuyến mãi",
    path: ["productDataMetaBox", "salePrice"],
  })
  // Validate: salePrice must be less than regularPrice if both exist
  .refine((data) => {
  if (data.productDataMetaBox?.salePrice !== undefined && 
      data.productDataMetaBox?.regularPrice !== undefined) {
    if (data.productDataMetaBox.salePrice >= data.productDataMetaBox.regularPrice) {
      return false;
    }
  }
  return true;
}, {
    message: "Giá khuyến mãi phải nhỏ hơn giá bán thường",
  path: ["productDataMetaBox", "salePrice"],
  })
  // Validate: variations salePrice must be less than regularPrice
  .refine((data) => {
  if (data.productDataMetaBox?.variations) {
    for (const variation of data.productDataMetaBox.variations) {
        // If variation has salePrice, it must have regularPrice
        if (variation.salePrice !== undefined && variation.salePrice > 0) {
          if (variation.regularPrice === undefined || variation.regularPrice === null) {
            return false;
          }
        }
        // Validate salePrice < regularPrice
      if (variation.salePrice !== undefined && variation.regularPrice !== undefined) {
        if (variation.salePrice >= variation.regularPrice) {
          return false;
        }
      }
    }
  }
  return true;
}, {
    message: "Giá khuyến mãi của biến thể phải nhỏ hơn giá bán thường",
  path: ["productDataMetaBox", "variations"],
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: product:read (checked by middleware)
      const { products, categories } = await getCollections();
      
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
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
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
    // Priority 2: Convert from productDataMetaBox.variations
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
          // Debug: Log variation attributes structure in development
          if (process.env.NODE_ENV === 'development' && variation.attributes) {
            console.log('[DEBUG] Variation attributes:', JSON.stringify(variation.attributes));
            console.log('[DEBUG] Size attribute name:', sizeAttributeName);
            console.log('[DEBUG] Color attribute name:', colorAttributeName);
            console.log('[DEBUG] Color codes map:', JSON.stringify(colorCodesMap));
          }
          
          Object.entries(variation.attributes).forEach(([attrName, value]) => {
            const attrNameLower = attrName.toLowerCase().trim();
            const valueStr = String(value).trim();
            
            // Normalize attribute names for comparison (remove accents, lowercase)
            const normalizeString = (str: string) => {
              return str.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remove accents
                .trim();
            };
            
            const normalizedAttrName = normalizeString(attrName);
            const normalizedSizeAttrName = sizeAttributeName ? normalizeString(sizeAttributeName) : '';
            const normalizedColorAttrName = colorAttributeName ? normalizeString(colorAttributeName) : '';
            
            // Match by attribute name (exact match or contains)
            // Try exact match first, then contains check
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
              // Lookup colorCode from colorCodes mapping (try multiple formats)
              colorCode = colorCodesMap[valueStr] || 
                         colorCodesMap[valueStr.toLowerCase()] || 
                         colorCodesMap[valueStr.toUpperCase()] ||
                         colorCodesMap[valueStr.trim()] ||
                         '';
              
              // Debug: Log color extraction in development
              if (process.env.NODE_ENV === 'development') {
                console.log(`[DEBUG] Extracted color: "${color}" from attribute "${attrName}", colorCode: "${colorCode}"`);
              }
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
        categories: populatedCategories, // Already populated in mappedProduct, but include here for backward compatibility
        // Include raw IDs for frontend to use
        _thumbnail_id: product._thumbnail_id || undefined,
        _product_image_gallery: product._product_image_gallery || undefined,
        scheduledDate: product.scheduledDate || undefined,
        password: product.password || undefined,
        // Include status and visibility from raw MongoDB document
        status: product.status || 'draft',
        visibility: product.visibility || 'public',
        // Include version for optimistic locking (from mappedProduct or raw document)
        version: mappedProduct.version !== undefined ? mappedProduct.version : (product.version || 0),
        // Include productDataMetaBox from raw MongoDB document
        productDataMetaBox: product.productDataMetaBox || undefined,
        // Include variants array (converted from productDataMetaBox.variations or from product.variants)
        variants: variants || undefined,
        // TODO: Expand IDs to full URLs when media API is available
        // For now, include IDs and let frontend handle display
        thumbnail: product._thumbnail_id ? {
          id: product._thumbnail_id,
          url: mappedProduct.image?.sourceUrl,
          thumbnail_url: mappedProduct.image?.sourceUrl,
        } : undefined,
        gallery: product._product_image_gallery ? 
          product._product_image_gallery.split(',').map((id: string, idx: number) => ({
            id: id.trim(),
            url: mappedProduct.galleryImages[idx]?.sourceUrl,
            thumbnail_url: mappedProduct.galleryImages[idx]?.sourceUrl,
          })) : undefined,
      },
    };
    
    return NextResponse.json(response);
    } catch (error: unknown) {
      // ✅ FIX: Improved error handling to always return JSON
      console.error('[Admin Product API] GET Error:', error);
      
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
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: product:update (checked by middleware)
      const { products, categories } = await getCollections();
      
      // ✅ FIX: Ensure params.id exists and is a string
      if (!params || !params.id || typeof params.id !== 'string') {
        return NextResponse.json(
          { error: 'Product ID is required' },
          { status: 400 }
        );
      }
      
      let { id } = params;
    const body = await request.json();
    
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
    
    // Validate input - Schema already has passthrough
    const validatedData = productUpdateSchema.parse(body);
    
    // BUSINESS LOGIC FIX: Giới hạn số lượng biến thể để tránh overload database và treo trình duyệt
    const variationsCount = validatedData.productDataMetaBox?.variations?.length || validatedData.variants?.length || 0;
    if (variationsCount > 100) {
      return NextResponse.json(
        { error: 'Số lượng biến thể không được vượt quá 100. Vui lòng giảm số lượng biến thể.' },
        { status: 400 }
      );
    }
    
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
    
    // Optimistic Locking: Check version if provided
    const currentVersion = product.version || 0;
    const requestVersion = validatedData.version;
    
    if (requestVersion !== undefined && requestVersion !== currentVersion) {
      return NextResponse.json(
        { 
          error: 'Product has been modified by another user. Please refresh and try again.',
          code: 'VERSION_MISMATCH',
          currentVersion,
        },
        { status: 409 }
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
      // Validate dimensions are positive
      if (updateData.length > 0 && updateData.width > 0 && updateData.height > 0) {
        updateData.volumetricWeight = (updateData.length * updateData.width * updateData.height) / 6000;
      }
    }

    // ✅ PERFORMANCE: Clean HTML for description and shortDescription to reduce data bloat
    // Remove unnecessary attributes, empty classes, and redundant styles before saving
    if (updateData.description && typeof updateData.description === 'string') {
      updateData.description = cleanHtmlForStorage(updateData.description);
    }
    if (updateData.shortDescription && typeof updateData.shortDescription === 'string') {
      updateData.shortDescription = cleanHtmlForStorage(updateData.shortDescription);
    }

    // Replace category string with categoryId
    if (categoryId) {
      updateData.categoryId = categoryId;
      delete updateData.category;
    }
    
    updateData.updatedAt = new Date();
    // BUSINESS LOGIC FIX: Auto Version Increment - Sử dụng $inc thay vì $set để đảm bảo atomicity
    // Version sẽ được increment trong updateOperation.$inc, không set trong updateData
    
    // Handle scheduledDate - convert ISO string to Date if provided
    if (validatedData.scheduledDate) {
      updateData.scheduledDate = new Date(validatedData.scheduledDate);
    }
    
    // Handle password - only save if visibility is password
    if (validatedData.visibility === 'password' && validatedData.password) {
      updateData.password = validatedData.password;
    }
    
    // Convert productDataMetaBox.variations → variants array if variations exist
    // Merge with existing productDataMetaBox if it exists
    const mergedProductDataMetaBox = {
      ...product.productDataMetaBox,
      ...updateData.productDataMetaBox,
    };
    
    if (mergedProductDataMetaBox?.variations && mergedProductDataMetaBox.variations.length > 0) {
      const convertedVariants = mergedProductDataMetaBox.variations.map((variation: any) => {
        // Extract size and color from attributes
        let size = '';
        let color = '';
        let colorCode = '';
        
        if (variation.attributes) {
          Object.entries(variation.attributes).forEach(([attrName, value]) => {
            const attrNameLower = attrName.toLowerCase();
            if (attrNameLower.includes('size') || attrNameLower === 'pa_size' || attrNameLower === 'kích thước') {
              size = String(value);
            } else if (attrNameLower.includes('color') || attrNameLower === 'pa_color' || attrNameLower === 'màu') {
              color = String(value);
            }
          });
        }
        
        // Use salePrice if available and valid, otherwise use regularPrice
        const price = variation.salePrice && variation.regularPrice && variation.salePrice < variation.regularPrice
          ? variation.salePrice
          : variation.regularPrice || 0;
        
        return {
          id: variation.id || `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          size,
          color: color || undefined,
          colorCode: colorCode || undefined,
          price,
          stock: variation.stockQuantity || 0,
          image: variation.image || undefined,
          sku: variation.sku || undefined,
        };
      });
      
      // Set variants array (will be used by frontend)
      updateData.variants = convertedVariants;
    } else if (updateData.productDataMetaBox && !updateData.productDataMetaBox.variations) {
      // If productDataMetaBox is being updated but variations is empty/undefined, clear variants
      updateData.variants = [];
    }
    
    // IMPORTANT: Set mergedProductDataMetaBox back to updateData to ensure it's saved to database
    if (mergedProductDataMetaBox && Object.keys(mergedProductDataMetaBox).length > 0) {
      updateData.productDataMetaBox = mergedProductDataMetaBox;
    }
    
    // BUSINESS LOGIC FIX: Ghost Data Cleanup - Xóa variants khi chuyển từ variable sang simple
    const currentProductType = product.productDataMetaBox?.productType || 'simple';
    const newProductType = mergedProductDataMetaBox?.productType || currentProductType;
    
    if (currentProductType === 'variable' && newProductType === 'simple') {
      // Chuyển từ variable sang simple - xóa sạch variants và variations
      updateData.variants = [];
      if (updateData.productDataMetaBox) {
        updateData.productDataMetaBox.variations = [];
        // Cũng xóa attributes nếu không còn cần thiết
        // (giữ lại attributes nếu có thể dùng lại sau này)
      }
    }
    
    // BUSINESS LOGIC FIX: Price Range Re-calculation - Tính lại minPrice/maxPrice từ variants cho variable products
    if (newProductType === 'variable' && updateData.variants && updateData.variants.length > 0) {
      // Tính toán lại minPrice và maxPrice từ variants
      const variantPrices = updateData.variants
        .map((v: any) => {
          // Ưu tiên price, fallback về regularPrice hoặc salePrice
          return v.price || v.regularPrice || v.salePrice || 0;
        })
        .filter((price: number) => price > 0 && !isNaN(price));
      
      if (variantPrices.length > 0) {
        updateData.minPrice = Math.min(...variantPrices);
        updateData.maxPrice = Math.max(...variantPrices);
      } else {
        // Nếu không có giá hợp lệ, set về 0
        updateData.minPrice = 0;
        updateData.maxPrice = undefined;
      }
      
      // BUSINESS LOGIC FIX: Stock Integrity - Tự động tính lại tổng tồn kho từ variants
      // Đảm bảo stockQuantity cha = tổng stockQuantity các biến thể con
      const totalStockFromVariants = updateData.variants.reduce((sum: number, v: any) => {
        const variantStock = v.stock || v.stockQuantity || 0;
        return sum + (variantStock || 0);
      }, 0);
      
      // Cập nhật stockQuantity của product cha
      if (updateData.productDataMetaBox) {
        updateData.productDataMetaBox.stockQuantity = totalStockFromVariants;
      }
      // Cũng cập nhật ở top-level nếu có
      updateData.stockQuantity = totalStockFromVariants;
    } else if (newProductType === 'simple' && mergedProductDataMetaBox?.regularPrice !== undefined) {
      // Simple product: minPrice = maxPrice = regularPrice
      const regularPrice = mergedProductDataMetaBox.regularPrice;
      updateData.minPrice = regularPrice;
      updateData.maxPrice = regularPrice;
    }
    
    // Auto-generate alt text for images (Auto-Alt Text feature)
    const siteName = 'Shop Gấu Bông';
    const productName = validatedData.name || product.name;
    
    // Initialize mediaExtended if not exists
    if (!updateData.mediaExtended) {
      updateData.mediaExtended = product.mediaExtended || {};
    }
    if (!updateData.mediaExtended.imageAltTexts) {
      updateData.mediaExtended.imageAltTexts = product.mediaExtended?.imageAltTexts || {};
    }
    
    // Generate alt text for featured image if _thumbnail_id is updated
    if (validatedData._thumbnail_id && validatedData._thumbnail_id !== product._thumbnail_id) {
      const featuredAlt = generateImageAltText(
        updateData.mediaExtended.imageAltTexts[validatedData._thumbnail_id],
        productName,
        siteName
      );
      updateData.mediaExtended.imageAltTexts[validatedData._thumbnail_id] = featuredAlt;
    }
    
    // Generate alt text for gallery images if _product_image_gallery is updated
    if (validatedData._product_image_gallery && validatedData._product_image_gallery !== product._product_image_gallery) {
      const galleryIds = validatedData._product_image_gallery.split(',').filter(Boolean);
      galleryIds.forEach((imageId: string) => {
        const trimmedId = imageId.trim();
        if (trimmedId && !updateData.mediaExtended.imageAltTexts[trimmedId]) {
          const galleryAlt = generateImageAltText(
            undefined,
            productName,
            siteName
          );
          updateData.mediaExtended.imageAltTexts[trimmedId] = galleryAlt;
        }
      });
    }
    
    // Populate images array for backward compatibility and frontend display
    // Priority: Use images from payload (already URLs), then try to resolve from _thumbnail_id/_product_image_gallery
    if (validatedData.images && Array.isArray(validatedData.images) && validatedData.images.length > 0) {
      // Priority 1: Use images from payload (these are already URLs)
      updateData.images = validatedData.images.filter((url: string) => 
        typeof url === 'string' && url.length > 0
      );
    } else if (validatedData._thumbnail_id || validatedData._product_image_gallery) {
      // Priority 2: Try to resolve from _thumbnail_id/_product_image_gallery
      const imagesArray: string[] = [];
      
      // Add featured image URL if _thumbnail_id exists
      const thumbnailId = validatedData._thumbnail_id || product._thumbnail_id;
      if (thumbnailId) {
        // If _thumbnail_id is already a URL, use it directly
        if (thumbnailId.startsWith('http://') || thumbnailId.startsWith('https://')) {
          imagesArray.push(thumbnailId);
        } else if (product.images && product.images.length > 0) {
          // Keep existing featured image URL if available
          imagesArray.push(product.images[0]);
        }
      }
      
      // Add gallery image URLs if _product_image_gallery exists
      const galleryIds = (validatedData._product_image_gallery || product._product_image_gallery || '')
        .split(',')
        .filter(Boolean);
      
      galleryIds.forEach((imageId: string, idx: number) => {
        const trimmedId = imageId.trim();
        // If imageId is already a URL, add it
        if (trimmedId.startsWith('http://') || trimmedId.startsWith('https://')) {
          imagesArray.push(trimmedId);
        } else if (product.images && product.images.length > idx + 1) {
          // Keep existing gallery image URLs if available
          imagesArray.push(product.images[idx + 1]);
        }
      });
      
      // Only update images array if we have URLs
      if (imagesArray.length > 0) {
        updateData.images = imagesArray;
      }
    }
    
    // CRITICAL: Prepare $unset operation for sku_normalized when SKU is cleared
    // Sparse unique index doesn't allow multiple null values, so we must $unset the field instead
    let unsetSkuNormalized = false;
    
    // BUSINESS LOGIC FIX: SKU Protection - Chặn đổi SKU khi có đơn hàng đang chờ xử lý
    const oldSku = product.productDataMetaBox?.sku || product.sku;
    const newSku = updateData.productDataMetaBox?.sku ?? updateData.sku;
    
    // Kiểm tra nếu SKU đang được thay đổi
    if (oldSku && newSku && oldSku !== newSku) {
      const { orders } = await getCollections();
      
      // Tìm đơn hàng có SKU này ở trạng thái đang chờ xử lý
      const pendingOrders = await orders.countDocuments({
        status: { $in: ['pending', 'awaiting_payment', 'confirmed'] },
        'items.sku': oldSku, // Check trong items array
      });
      
      if (pendingOrders > 0) {
        return NextResponse.json(
          { 
            error: 'Không thể đổi SKU khi có đơn hàng đang chờ xử lý. Vui lòng hoàn tất hoặc hủy các đơn hàng liên quan trước.',
            pendingOrdersCount: pendingOrders,
          },
          { status: 400 }
        );
      }
    }
    
    // Normalize SKU for duplicate checking (according to SMART_SKU_IMPLEMENTATION_PLAN.md)
    // Only normalize if SKU is actually being updated
    // Priority: productDataMetaBox.sku > top-level sku
    // BUSINESS LOGIC FIX: Empty SKU Handling - sku_normalized phải là undefined (không phải null hoặc "")
    // để tận dụng cơ chế sparse index của MongoDB
    if ('sku' in updateData || (updateData.productDataMetaBox && 'sku' in updateData.productDataMetaBox)) {
      const skuToNormalize = updateData.productDataMetaBox?.sku ?? updateData.sku;
      if (skuToNormalize && typeof skuToNormalize === 'string' && skuToNormalize.trim()) {
        updateData.sku_normalized = normalizeSku(skuToNormalize.trim());
      } else if (skuToNormalize === null || skuToNormalize === '' || skuToNormalize === undefined) {
        // CRITICAL: Don't set sku_normalized: null - use $unset instead
        // Sparse unique index doesn't allow multiple documents with null value
        // Removing the field allows sparse index to ignore the document
        delete updateData.sku_normalized; // Remove from $set
        unsetSkuNormalized = true;
      }
    }
    
    // Normalize variant SKUs if variants are being updated
    // BUSINESS LOGIC FIX: SKU Protection - Chặn đổi Variation ID/SKU khi có đơn hàng đang chờ
    if ('variants' in updateData && updateData.variants && Array.isArray(updateData.variants)) {
      const { orders } = await getCollections();
      
      // Kiểm tra từng variant có thay đổi ID hoặc SKU không
      for (const newVariant of updateData.variants) {
        if (!newVariant.id) continue;
        
        // Tìm variant cũ trong product hiện tại
        const oldVariant = product.variants?.find((v: any) => v.id === newVariant.id);
        
        if (oldVariant) {
          // Kiểm tra SKU có thay đổi không
          const oldVariantSku = oldVariant.sku;
          const newVariantSku = newVariant.sku;
          
          if (oldVariantSku && newVariantSku && oldVariantSku !== newVariantSku) {
            // SKU đang được thay đổi - kiểm tra đơn hàng
            const pendingOrders = await orders.countDocuments({
              status: { $in: ['pending', 'awaiting_payment', 'confirmed'] },
              'items.variationId': newVariant.id, // Check variationId trong items
              'items.sku': oldVariantSku,
            });
            
            if (pendingOrders > 0) {
              return NextResponse.json(
                { 
                  error: `Không thể đổi SKU của biến thể "${newVariant.id}" khi có đơn hàng đang chờ xử lý. Vui lòng hoàn tất hoặc hủy các đơn hàng liên quan trước.`,
                  pendingOrdersCount: pendingOrders,
                  variantId: newVariant.id,
                },
                { status: 400 }
              );
            }
          }
        }
      }
      
      // Normalize SKUs sau khi đã kiểm tra
      updateData.variants = updateData.variants.map((variant: any) => {
        if (variant.sku && typeof variant.sku === 'string' && variant.sku.trim()) {
          variant.sku_normalized = normalizeSku(variant.sku.trim());
        } else if (variant.sku === null || variant.sku === '' || variant.sku === undefined) {
          // Remove sku_normalized from variant when SKU is cleared
          delete variant.sku_normalized;
        }
        return variant;
      });
    }
    
    // Also normalize SKUs in productDataMetaBox.variations if being updated
    if (updateData.productDataMetaBox && 'variations' in updateData.productDataMetaBox && 
        updateData.productDataMetaBox.variations && Array.isArray(updateData.productDataMetaBox.variations)) {
      updateData.productDataMetaBox.variations = updateData.productDataMetaBox.variations.map((variation: any) => {
        if (variation.sku && typeof variation.sku === 'string' && variation.sku.trim()) {
          variation.sku_normalized = normalizeSku(variation.sku.trim());
        } else if (variation.sku === null || variation.sku === '' || variation.sku === undefined) {
          // Remove sku_normalized from variation when SKU is cleared
          delete variation.sku_normalized;
        }
        return variation;
      });
    }
    
    // Generate and update Product Schema (JSON-LD)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop-gaubong.com';
    // Merge updateData with existing product data for schema generation
    const productForSchema = { ...product, ...updateData };
    const productJsonLdSchema = generateProductSchemaFromData(productForSchema, siteUrl);
    if (productJsonLdSchema) {
      updateData._productSchema = productJsonLdSchema; // Update schema in database
    }
    
    // ✅ CRITICAL FIX: Remove version from updateData to prevent MongoDB conflict
    // Version will be incremented using $inc, not $set
    // If version exists in updateData, it will conflict with $inc operation
    delete updateData.version;
    
    // Prepare update operation
    const updateOperation: any = { $set: updateData };
    
    // BUSINESS LOGIC FIX: Auto Version Increment - Sử dụng $inc để tăng version atomically
    updateOperation.$inc = { version: 1 };
    
    // CRITICAL: Handle removal of sku_normalized when SKU is cleared
    // Use $unset instead of setting to null to avoid duplicate key error with sparse unique index
    if (unsetSkuNormalized) {
      if (!updateOperation.$unset) updateOperation.$unset = {};
      updateOperation.$unset.sku_normalized = '';
    }
    
    // Handle removal of scheduledDate and password if needed
    if (validatedData.scheduledDate === null || validatedData.scheduledDate === undefined) {
      if (!updateOperation.$unset) updateOperation.$unset = {};
      updateOperation.$unset.scheduledDate = '';
    }
    
    if (validatedData.visibility !== 'password' && product.password) {
      // Remove password if visibility changed from password to something else
      if (!updateOperation.$unset) updateOperation.$unset = {};
      updateOperation.$unset.password = '';
    }
    
    // BUSINESS LOGIC FIX: Optimistic Locking - Thêm version vào filter để đảm bảo không bị Lost Update
    // Nếu version không khớp, modifiedCount sẽ = 0 và trả về lỗi 409
    const updateFilter: any = { 
      _id: productId,
    };
    
    // Chỉ thêm version vào filter nếu request có gửi version
    if (requestVersion !== undefined) {
      updateFilter.version = requestVersion;
    }
    
    // BUSINESS LOGIC FIX: Xử lý Duplicate Key Error với message cụ thể
    try {
      const updateResult = await products.updateOne(
        updateFilter,
        updateOperation
      );
      
      // BUSINESS LOGIC FIX: Kiểm tra modifiedCount để phát hiện version conflict
      if (updateResult.modifiedCount === 0) {
        // Không có document nào được update - có thể do version mismatch hoặc document không tồn tại
        // Fetch lại để kiểm tra version hiện tại
        const currentProduct = await products.findOne({ _id: productId });
        if (!currentProduct) {
          return NextResponse.json(
            { error: 'Sản phẩm không tồn tại' },
            { status: 404 }
          );
        }
        
        // Kiểm tra version conflict
        if (requestVersion !== undefined && currentProduct.version !== requestVersion) {
          return NextResponse.json(
            { 
              error: 'Dữ liệu đã được cập nhật bởi một Admin khác, vui lòng tải lại trang',
              code: 'VERSION_MISMATCH',
              currentVersion: currentProduct.version || 0,
            },
            { status: 409 }
          );
        }
        
        // Nếu không phải version conflict, có thể là không có thay đổi nào
        // (tất cả fields đều giống nhau) - vẫn trả về success nhưng không update
      }
    } catch (error: any) {
      // MongoDB duplicate key error (code 11000)
      if (error.code === 11000) {
        // Parse error.keyPattern để xác định field bị trùng
        const keyPattern = error.keyPattern || {};
        let errorMessage = 'Dữ liệu đã tồn tại';
        
        if (keyPattern.sku_normalized) {
          errorMessage = 'Mã SKU này đã tồn tại. Vui lòng sử dụng SKU khác.';
        } else if (keyPattern.slug) {
          errorMessage = 'Slug này đã bị trùng. Vui lòng sử dụng slug khác.';
        } else if (keyPattern['variants.sku_normalized']) {
          errorMessage = 'Mã SKU của biến thể này đã tồn tại. Vui lòng kiểm tra lại.';
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: 409 }
        );
      }
      // Re-throw other errors
      throw error;
    }
    
    // Fetch updated product
    const updatedProduct = await products.findOne({ _id: productId });
    
    if (!updatedProduct) {
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }
    
    // ✅ PERFORMANCE: Cache Invalidation (Bước 4)
    // Revalidate public API routes để đảm bảo dữ liệu cập nhật ngay lập tức
    try {
      // Revalidate products list API
      revalidatePath('/api/cms/products');
      
      // Revalidate product detail API (nếu có slug)
      if (updatedProduct.slug) {
        revalidatePath(`/api/cms/products/${updatedProduct.slug}`);
        // Also revalidate by ObjectId format
        revalidatePath(`/api/cms/products/${updatedProduct._id.toString()}`);
      }
      
      // Revalidate categories API nếu category thay đổi
      const categoryChanged = validatedData.category !== undefined || 
                              validatedData.categoryId !== undefined ||
                              (updateData.categories && Array.isArray(updateData.categories));
      if (categoryChanged) {
        revalidatePath('/api/cms/categories');
      }
    } catch (revalidateError) {
      // Log error nhưng không fail request nếu revalidation fails
      console.warn('[Cache Invalidation] Failed to revalidate paths:', revalidateError);
    }
    
    // FIX: Populate categories before mapping
    let populatedCategories: Array<{ id: string | number; name: string; slug: string }> = [];
    if (updatedProduct.category || updatedProduct.categoryId || (updatedProduct.categories && updatedProduct.categories.length > 0)) {
      const { categories } = await getCollections();
      const categoryIds = updatedProduct.categories && updatedProduct.categories.length > 0 
        ? updatedProduct.categories 
        : (updatedProduct.categoryId ? [updatedProduct.categoryId] : (updatedProduct.category ? [updatedProduct.category] : []));
      
      // Fetch all category documents
      const categoryDocs = await categories.find({
        $or: [
          { _id: { $in: categoryIds.filter((id: string) => ObjectId.isValid(id)).map((id: string) => new ObjectId(id)) } },
          { slug: { $in: categoryIds.filter((id: string) => !ObjectId.isValid(id)) } },
        ],
      }).toArray();
      
      // Map to frontend format (use string ID instead of parseInt)
      populatedCategories = categoryDocs.map((cat: any) => ({
        id: cat._id.toString(), // Use ObjectId string directly
        name: cat.name,
        slug: cat.slug,
      }));
    }
    
    const mappedProduct = mapMongoProduct(updatedProduct as unknown as MongoProduct, populatedCategories);
    
    return NextResponse.json({ product: mappedProduct });
    } catch (error: unknown) {
      // ✅ FIX: Improved error handling to always return JSON
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Validation error',
            details: error.errors,
          },
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
      
      console.error('[Admin Product API] PUT Error:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to update product';
      
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
  }, 'product:update');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: product:delete (checked by middleware)
      const { products } = await getCollections();
      
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
    
    // Soft Delete: Set deletedAt = new Date() and status = 'trash'
    const now = new Date();
    await products.updateOne(
      { _id: productId },
      {
        $set: {
          deletedAt: now,
          status: 'trash',
          updatedAt: now,
        },
      }
    );
    
    // Fetch updated product
    const updatedProduct = await products.findOne({ _id: productId });
    
    // ✅ PERFORMANCE: Cache Invalidation (Bước 4)
    // Revalidate public API routes khi product bị xóa
    try {
      revalidatePath('/api/cms/products');
      if (product.slug) {
        revalidatePath(`/api/cms/products/${product.slug}`);
        revalidatePath(`/api/cms/products/${product._id.toString()}`);
      }
    } catch (revalidateError) {
      console.warn('[Cache Invalidation] Failed to revalidate paths:', revalidateError);
    }
    
    // FIX: Populate categories before mapping
    let populatedCategories: Array<{ id: string | number; name: string; slug: string }> = [];
    if (updatedProduct && (updatedProduct.category || updatedProduct.categoryId || (updatedProduct.categories && updatedProduct.categories.length > 0))) {
      const { categories } = await getCollections();
      const categoryIds = updatedProduct.categories && updatedProduct.categories.length > 0 
        ? updatedProduct.categories 
        : (updatedProduct.categoryId ? [updatedProduct.categoryId] : (updatedProduct.category ? [updatedProduct.category] : []));
      
      // Fetch all category documents
      const categoryDocs = await categories.find({
        $or: [
          { _id: { $in: categoryIds.filter((id: string) => ObjectId.isValid(id)).map((id: string) => new ObjectId(id)) } },
          { slug: { $in: categoryIds.filter((id: string) => !ObjectId.isValid(id)) } },
        ],
      }).toArray();
      
      // Map to frontend format (use string ID instead of parseInt)
      populatedCategories = categoryDocs.map((cat: any) => ({
        id: cat._id.toString(), // Use ObjectId string directly
        name: cat.name,
        slug: cat.slug,
      }));
    }
    
    const mappedProduct = updatedProduct ? mapMongoProduct(updatedProduct as unknown as MongoProduct, populatedCategories) : null;
    
    return NextResponse.json({
      success: true,
      message: 'Đã chuyển vào thùng rác',
      product: mappedProduct,
    });
    } catch (error: unknown) {
      // ✅ FIX: Improved error handling to always return JSON
      console.error('[Admin Product API] DELETE Error:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to delete product';
      
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
  }, 'product:delete');
}

