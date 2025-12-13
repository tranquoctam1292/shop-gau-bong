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
    let { id } = params;
    
    // Extract ObjectId from GraphQL format if needed (backward compatibility)
    // Format: gid://shop-gau-bong/Product/OBJECT_ID
    if (id.startsWith('gid://shop-gau-bong/Product/')) {
      id = id.replace('gid://shop-gau-bong/Product/', '');
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
    
    const mappedProduct = mapMongoProduct(product);
    
    // Include image IDs in response for frontend
    const response: any = {
      product: {
        ...mappedProduct,
        // Include raw IDs for frontend to use
        _thumbnail_id: product._thumbnail_id || undefined,
        _product_image_gallery: product._product_image_gallery || undefined,
        scheduledDate: product.scheduledDate || undefined,
        password: product.password || undefined,
        // Include status and visibility from raw MongoDB document
        status: product.status || 'draft',
        visibility: product.visibility || 'public',
        // Include productDataMetaBox from raw MongoDB document
        productDataMetaBox: product.productDataMetaBox || undefined,
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
    let { id } = params;
    const body = await request.json();
    
    // Extract ObjectId from GraphQL format if needed (backward compatibility)
    // Format: gid://shop-gau-bong/Product/OBJECT_ID
    if (id.startsWith('gid://shop-gau-bong/Product/')) {
      id = id.replace('gid://shop-gau-bong/Product/', '');
    }
    
    // Validate input - Use passthrough to keep unknown fields
    const validatedData = productUpdateSchema.passthrough().parse(body);
    
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
      // Validate dimensions are positive
      if (updateData.length > 0 && updateData.width > 0 && updateData.height > 0) {
        updateData.volumetricWeight = (updateData.length * updateData.width * updateData.height) / 6000;
      }
    }

    // Replace category string with categoryId
    if (categoryId) {
      updateData.categoryId = categoryId;
      delete updateData.category;
    }
    
    updateData.updatedAt = new Date();
    
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
    
    // Generate and update Product Schema (JSON-LD)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop-gaubong.com';
    // Merge updateData with existing product data for schema generation
    const productForSchema = { ...product, ...updateData };
    const productJsonLdSchema = generateProductSchemaFromData(productForSchema, siteUrl);
    if (productJsonLdSchema) {
      updateData._productSchema = productJsonLdSchema; // Update schema in database
    }
    
    // Prepare update operation
    const updateOperation: any = { $set: updateData };
    
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
    // Update product
    await products.updateOne(
      { _id: productId },
      updateOperation
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
    let { id } = params;
    
    // Extract ObjectId from GraphQL format if needed (backward compatibility)
    // Format: gid://shop-gau-bong/Product/OBJECT_ID
    if (id.startsWith('gid://shop-gau-bong/Product/')) {
      id = id.replace('gid://shop-gau-bong/Product/', '');
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
    const mappedProduct = updatedProduct ? mapMongoProduct(updatedProduct) : null;
    
    return NextResponse.json({
      success: true,
      message: 'Đã chuyển vào thùng rác',
      product: mappedProduct,
    });
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

