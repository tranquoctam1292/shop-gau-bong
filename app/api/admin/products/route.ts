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
import { generateProductSchema } from '@/lib/utils/schema';
import { z } from 'zod';

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
          additionalProperties.push({ name: 'Size', value: uniqueSizes[0] });
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

// Product schema for validation
const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  sku: z.string().optional(),
  minPrice: z.number().min(0),
  maxPrice: z.number().min(0).optional(),
  // Image fields (new structure)
  _thumbnail_id: z.string().optional(), // Attachment ID for featured image
  _product_image_gallery: z.string().optional(), // Comma-separated attachment IDs for gallery
  // Keep images for backward compatibility (will be removed later)
  images: z.array(z.string()).optional(),
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
  })).default([]),
  isHot: z.boolean().default(false),
  isActive: z.boolean().default(true),
  status: z.enum(['draft', 'publish', 'trash']).default('draft'),
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
    stockQuantity: z.number().optional(),
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
      stockQuantity: z.number().optional(),
      image: z.string().optional(),
      attributes: z.record(z.string(), z.string()),
    }).passthrough()).optional(),
    purchaseNote: z.string().optional(),
    menuOrder: z.number().optional(),
    enableReviews: z.boolean().optional(),
  }).passthrough().optional(),
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
    const trashed = searchParams.get('trashed') === 'true';
    const stockStatus = searchParams.get('stock_status');
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const priceMin = searchParams.get('price_min');
    const priceMax = searchParams.get('price_max');
    
    const { products } = await getCollections();
    
    // Build query
    const query: any = {};
    
    // Soft Delete Logic: Handle trashed and status params
    if (trashed || status === 'trash') {
      // Show only trashed products (deletedAt IS NOT NULL)
      query.deletedAt = { $ne: null };
    } else {
      // Default: Show only non-trashed products (deletedAt IS NULL or not exists)
      query.$or = [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ];
    }
    
    // Status filter (active, draft, etc.)
    if (status && status !== 'trash') {
      query.status = status;
    }
    
    // Search: name, SKU, barcode
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          // Search in productDataMetaBox.sku if exists
          { 'productDataMetaBox.sku': { $regex: search, $options: 'i' } },
        ],
      });
    }
    
    // Category filter
    if (category) {
      try {
        const categoryId = new ObjectId(category);
        query.$or = query.$or || [];
        query.$or.push(
          { category: category },
          { categoryId: category },
          { category: categoryId },
          { categoryId: categoryId.toString() }
        );
      } catch {
        // If category is not a valid ObjectId, search by name
        query.category = { $regex: category, $options: 'i' };
      }
    }
    
    // Brand filter (if brand field exists)
    if (brand) {
      query.brand = brand;
    }
    
    // Price range filter
    if (priceMin || priceMax) {
      const priceQuery: any = {};
      if (priceMin) {
        priceQuery.$gte = parseFloat(priceMin);
      }
      if (priceMax) {
        priceQuery.$lte = parseFloat(priceMax);
      }
      if (Object.keys(priceQuery).length > 0) {
        query.$or = query.$or || [];
        query.$or.push(
          { price: priceQuery },
          { minPrice: priceQuery },
          { 'productDataMetaBox.regularPrice': priceQuery },
          { 'productDataMetaBox.salePrice': priceQuery }
        );
      }
    }
    
    // Stock status filter
    if (stockStatus) {
      query.$or = query.$or || [];
      query.$or.push(
        { stockStatus: stockStatus },
        { 'productDataMetaBox.stockStatus': stockStatus }
      );
    }
    
    // Fix $or array if it exists and has only one condition
    if (query.$or && Array.isArray(query.$or) && query.$or.length === 1) {
      Object.assign(query, query.$or[0]);
      delete query.$or;
    }
    
    // Fetch products
    const [productsList, total, trashCount] = await Promise.all([
      products
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .toArray(),
      products.countDocuments(query),
      // Count trashed products for trash tab badge
      products.countDocuments({ deletedAt: { $ne: null } }),
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
      filters: {
        trashCount,
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
    
    // Validate input - Use passthrough to keep unknown fields
    const validatedData = productSchema.passthrough().parse(body);
    
    const { products, categories } = await getCollections();
    
    // Check if slug already exists (prevent duplicate products)
    const existingProduct = await products.findOne({ slug: validatedData.slug });
    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this slug already exists' },
        { status: 409 }
      );
    }

    // Additional check: prevent duplicate by name (in case of race condition)
    // Only check if name is provided and not empty
    // This helps catch race conditions where two requests create products with same name simultaneously
    if (validatedData.name && validatedData.name.trim()) {
      const existingByName = await products.findOne({ 
        name: validatedData.name.trim()
      });
      if (existingByName) {
        // Check if it was created very recently (within last 10 seconds) - likely a race condition
        const timeDiff = Date.now() - existingByName.createdAt.getTime();
        if (timeDiff < 10000) {
          return NextResponse.json(
            { error: 'Product with this name was just created. Please refresh the page.' },
            { status: 409 }
          );
        }
        // Otherwise, it's a legitimate duplicate
        return NextResponse.json(
          { error: 'Product with this name already exists.' },
          { status: 409 }
        );
      }
    }

    // Map category to categoryId if category is provided as string
    let categoryId: string | undefined = undefined;
    if (validatedData.category) {
      // Try to find category by ID or name
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
    
    // Calculate minPrice if not provided and variants exist
    let minPrice = validatedData.minPrice;
    if (!minPrice && validatedData.variants && validatedData.variants.length > 0) {
      const prices = validatedData.variants
        .map((v) => v.price)
        .filter((p) => !isNaN(p) && p >= 0);
      if (prices.length > 0) {
        minPrice = Math.min(...prices);
      }
    }
    if (!minPrice || minPrice < 0) {
      minPrice = 0; // Default to 0 if no price provided
    }

    // Calculate volumetric weight if dimensions provided
    let volumetricWeight = validatedData.volumetricWeight;
    if (!volumetricWeight && validatedData.length && validatedData.width && validatedData.height) {
      // Validate dimensions are positive
      if (validatedData.length > 0 && validatedData.width > 0 && validatedData.height > 0) {
        volumetricWeight = (validatedData.length * validatedData.width * validatedData.height) / 6000;
      }
    }
    
    // Create product document
    const productDoc: any = {
      ...validatedData,
      minPrice,
      volumetricWeight,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Handle scheduledDate - convert ISO string to Date if provided
    if (validatedData.scheduledDate) {
      productDoc.scheduledDate = new Date(validatedData.scheduledDate);
    }
    
    // Handle password - only save if visibility is password
    if (validatedData.visibility === 'password' && validatedData.password) {
      productDoc.password = validatedData.password;
    }

    // Replace category string with categoryId
    if (categoryId) {
      productDoc.categoryId = categoryId;
      delete productDoc.category;
    }
    
    // Convert productDataMetaBox.variations → variants array if variations exist
    if (productDoc.productDataMetaBox?.variations && productDoc.productDataMetaBox.variations.length > 0) {
      const convertedVariants = productDoc.productDataMetaBox.variations.map((variation: any) => {
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
      productDoc.variants = convertedVariants;
      // Also keep productDataMetaBox.variations for admin editing
      // (don't delete it, keep both formats)
    }
    
    // Auto-generate alt text for images (Auto-Alt Text feature)
    const siteName = 'Shop Gấu Bông';
    if (!productDoc.mediaExtended) {
      productDoc.mediaExtended = {};
    }
    if (!productDoc.mediaExtended.imageAltTexts) {
      productDoc.mediaExtended.imageAltTexts = {};
    }
    
    // Generate alt text for featured image
    if (productDoc._thumbnail_id) {
      const featuredAlt = generateImageAltText(
        productDoc.mediaExtended.imageAltTexts[productDoc._thumbnail_id],
        validatedData.name,
        siteName
      );
      productDoc.mediaExtended.imageAltTexts[productDoc._thumbnail_id] = featuredAlt;
    }
    
    // Generate alt text for gallery images
    if (productDoc._product_image_gallery) {
      const galleryIds = productDoc._product_image_gallery.split(',').filter(Boolean);
      galleryIds.forEach((imageId: string) => {
        const trimmedId = imageId.trim();
        if (trimmedId && !productDoc.mediaExtended.imageAltTexts[trimmedId]) {
          const galleryAlt = generateImageAltText(
            undefined,
            validatedData.name,
            siteName
          );
          productDoc.mediaExtended.imageAltTexts[trimmedId] = galleryAlt;
        }
      });
    }
    
    // Populate images array for backward compatibility and frontend display
    // Priority: Use images from payload (already URLs), then try to resolve from _thumbnail_id/_product_image_gallery
    if (!productDoc.images || productDoc.images.length === 0) {
      productDoc.images = [];
      
      // Priority 1: Use images from payload if provided (these are already URLs)
      if (validatedData.images && Array.isArray(validatedData.images) && validatedData.images.length > 0) {
        productDoc.images = validatedData.images.filter((url: string) => 
          typeof url === 'string' && url.length > 0
        );
      } else {
        // Priority 2: Try to resolve from _thumbnail_id
        if (productDoc._thumbnail_id) {
          // If _thumbnail_id is already a URL, use it directly
          if (productDoc._thumbnail_id.startsWith('http://') || productDoc._thumbnail_id.startsWith('https://')) {
            productDoc.images.push(productDoc._thumbnail_id);
          }
          // If it's a pathname, we'll try to resolve it in the mapper using images array
        }
        
        // Priority 3: Add gallery image URLs if _product_image_gallery exists
        if (productDoc._product_image_gallery) {
          const galleryIds = productDoc._product_image_gallery.split(',').filter(Boolean);
          galleryIds.forEach((imageId: string) => {
            const trimmedId = imageId.trim();
            // If imageId is already a URL, add it
            if (trimmedId.startsWith('http://') || trimmedId.startsWith('https://')) {
              productDoc.images.push(trimmedId);
            }
          });
        }
      }
    }
    
    // Generate and save Product Schema (JSON-LD)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop-gaubong.com';
    const productJsonLdSchema = generateProductSchemaFromData(productDoc, siteUrl);
    if (productJsonLdSchema) {
      productDoc._productSchema = productJsonLdSchema; // Save schema to database
    }
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

