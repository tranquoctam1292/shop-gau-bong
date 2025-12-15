/**
 * Product Mapper Utility
 * 
 * Map WooCommerce REST API product format sang frontend format
 * để đảm bảo tương thích với components hiện tại
 * 
 * Note: This file still supports mapping from WooCommerce format for backward compatibility
 * during migration. New code should use mapMongoProduct() instead.
 */

import type { WooCommerceProduct } from '@/types/woocommerce';

/**
 * Helper function để extract ACF field value từ meta_data array
 * (Extracted from lib/api/woocommerce.ts for independence)
 * 
 * @param metaData - Array of meta_data objects
 * @param key - Key to extract
 * @returns Value hoặc undefined
 */
function getMetaValue(metaData: Array<{ key: string; value: any }>, key: string): any {
  const meta = metaData?.find(m => m.key === key);
  return meta?.value;
}

/**
 * Mapped Product Type - Format cho frontend components
 * Tương thích với GraphQL product format hiện tại
 */
export interface MappedProduct {
  id: string; // GraphQL ID format (hoặc databaseId)
  databaseId: number;
  name: string;
  slug: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  onSale: boolean;
  minPrice?: number; // Minimum price (for variable products)
  maxPrice?: number; // Maximum price (for variable products)
  image: {
    id?: string; // Attachment ID (new structure)
    sourceUrl: string;
    altText: string;
  } | null;
  galleryImages: Array<{
    id?: string; // Attachment ID (new structure)
    sourceUrl: string;
    altText: string;
  }>;
  description: string;
  shortDescription: string;
  sku: string;
  stockStatus: string;
  stockQuantity: number | null;
  weight: string | null;
  length: number | null;
  width: number | null;
  height: number | null;
  volumetricWeight: number | null;
  material: string | null;
  origin: string | null;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  // Product attributes for variants (Size, Color, etc.)
  attributes?: Array<{
    id: number;
    name: string;
    options: string[];
    position: number;
    visible: boolean;
    variation: boolean;
    globalAttributeId?: string; // Reference to global attribute ID (for Phase 6)
  }>;
  // Product type: simple, variable, grouped, external
  type?: 'simple' | 'variable' | 'grouped' | 'external';
  // Variation IDs (for variable products)
  variations?: number[];
  // Status field (draft, publish, trash)
  status?: 'draft' | 'publish' | 'trash';
  // isActive field (for backward compatibility)
  isActive?: boolean;
  // Optimistic locking version field
  version?: number;
}

/**
 * Map WooCommerce REST API product to frontend format
 * 
 * @param wcProduct - WooCommerce product từ REST API
 * @returns Mapped product cho frontend
 */
export function mapWooCommerceProduct(wcProduct: WooCommerceProduct): MappedProduct {
  // Extract ACF fields từ meta_data
  const length = getMetaValue(wcProduct.meta_data, 'length') as number | undefined;
  const width = getMetaValue(wcProduct.meta_data, 'width') as number | undefined;
  const height = getMetaValue(wcProduct.meta_data, 'height') as number | undefined;
  const volumetricWeight = getMetaValue(wcProduct.meta_data, 'volumetric_weight') as number | undefined;
  const material = getMetaValue(wcProduct.meta_data, 'material') as string | undefined;
  const origin = getMetaValue(wcProduct.meta_data, 'origin') as string | undefined;

  // Map dimensions từ WooCommerce dimensions object (nếu có)
  // Ưu tiên ACF fields, fallback về WooCommerce dimensions
  const finalLength = length || (wcProduct.dimensions?.length ? parseFloat(wcProduct.dimensions.length) : null);
  const finalWidth = width || (wcProduct.dimensions?.width ? parseFloat(wcProduct.dimensions.width) : null);
  const finalHeight = height || (wcProduct.dimensions?.height ? parseFloat(wcProduct.dimensions.height) : null);

  return {
    id: `gid://shop-gau-bong/Product/${wcProduct.id}`, // GraphQL ID format (tương thích)
    databaseId: wcProduct.id,
    name: wcProduct.name,
    slug: wcProduct.slug,
    price: wcProduct.price || '0',
    regularPrice: wcProduct.regular_price || wcProduct.price || '0',
    salePrice: wcProduct.sale_price || '',
    onSale: wcProduct.on_sale || false,
    image: wcProduct.images?.[0] ? {
      sourceUrl: wcProduct.images[0].src,
      altText: wcProduct.images[0].alt || wcProduct.name,
    } : null,
    galleryImages: wcProduct.images?.slice(1).map(img => ({
      sourceUrl: img.src,
      altText: img.alt || wcProduct.name,
    })) || [],
    description: wcProduct.description || '',
    shortDescription: wcProduct.short_description || '',
    sku: wcProduct.sku || '',
    stockStatus: wcProduct.stock_status || 'instock',
    stockQuantity: wcProduct.stock_quantity,
    weight: wcProduct.weight || null,
    length: finalLength,
    width: finalWidth,
    height: finalHeight,
    volumetricWeight: volumetricWeight || null,
    material: material || null,
    origin: origin || null,
    categories: wcProduct.categories || [],
    tags: wcProduct.tags || [],
    // Map attributes for variant selection
    attributes: wcProduct.attributes || [],
    // Product type
    type: wcProduct.type || 'simple',
    // Variation IDs (for variable products)
    variations: wcProduct.variations || [],
  };
}

/**
 * Map array of WooCommerce products
 * 
 * @param wcProducts - Array of WooCommerce products
 * @returns Array of mapped products
 */
export function mapWooCommerceProducts(wcProducts: WooCommerceProduct[]): MappedProduct[] {
  return wcProducts.map(mapWooCommerceProduct);
}

/**
 * Map WooCommerce category to frontend format
 */
export interface MappedCategory {
  id: string; // MongoDB ObjectId as string
  databaseId: number | string; // For backward compatibility (can be ObjectId string or number)
  name: string;
  slug: string;
  count: number | null;
  parentId: string | null; // Parent category ID as string (ObjectId string), null = top-level
  image: {
    sourceUrl: string;
    altText: string;
  } | null;
  status?: 'active' | 'inactive'; // NEW
  metaTitle?: string; // NEW
  metaDesc?: string; // NEW
  deletedAt?: Date | null; // NEW
  position?: number; // NEW - for sorting
  featured?: boolean; // NEW - for homepage display (max 4)
  children?: MappedCategory[]; // NEW - for tree structure
  level?: number; // NEW - for tree indentation
}

/**
 * Map WooCommerce category
 * 
 * @param wcCategory - WooCommerce category từ REST API
 * @returns Mapped category cho frontend
 */
export function mapWooCommerceCategory(wcCategory: {
  id: number;
  name: string;
  slug: string;
  count: number;
  parent?: number; // Parent category ID (0 = top-level, undefined = not provided)
  image: {
    src: string;
    alt: string;
  } | null;
}): MappedCategory {
  return {
    id: `gid://shop-gau-bong/ProductCategory/${wcCategory.id}`, // GraphQL ID format
    databaseId: wcCategory.id,
    name: wcCategory.name,
    slug: wcCategory.slug,
    count: wcCategory.count || null,
    parentId: wcCategory.parent !== undefined && wcCategory.parent !== 0 ? String(wcCategory.parent) : null, // 0 = top-level, null = not provided
    image: wcCategory.image ? {
      sourceUrl: wcCategory.image.src,
      altText: wcCategory.image.alt || wcCategory.name,
    } : null,
  };
}

/**
 * Map array of WooCommerce categories
 * 
 * @param wcCategories - Array of WooCommerce categories
 * @returns Array of mapped categories
 */
export function mapWooCommerceCategories(
  wcCategories: Array<{
    id: number;
    name: string;
    slug: string;
    count: number;
    parent?: number; // Parent category ID
    image: {
      src: string;
      alt: string;
    } | null;
  }>
): MappedCategory[] {
  return wcCategories.map(mapWooCommerceCategory);
}

/**
 * MongoDB Product Type (from database)
 */
export interface MongoProduct {
  _id: any; // ObjectId
  id?: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  minPrice: number;
  maxPrice?: number;
  // Image fields (new structure)
  _thumbnail_id?: string; // Attachment ID for featured image
  _product_image_gallery?: string; // Comma-separated attachment IDs for gallery
  images?: string[]; // Array of image URLs (backward compatibility)
  category?: string; // Category ID or slug
  tags?: string[];
  variants?: Array<{
    id: string;
    size: string;
    color?: string;
    colorCode?: string;
    price: number;
    stock: number;
    image?: string;
    sku?: string;
  }>;
  isHot?: boolean;
  isActive: boolean;
  status: 'draft' | 'publish';
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  volumetricWeight?: number;
  material?: string;
  origin?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MongoDB Document type (with _id)
 */
type MongoDocument = MongoProduct & { _id: any };

/**
 * Map MongoDB product to frontend format
 * 
 * @param mongoProduct - MongoDB product document
 * @returns Mapped product cho frontend
 */
export function mapMongoProduct(mongoProduct: MongoProduct | MongoDocument | any): MappedProduct {
  const productId = mongoProduct._id.toString();
  
  // Determine product type first
  const hasVariants = (mongoProduct.variants && mongoProduct.variants.length > 0) ||
                      (mongoProduct.productDataMetaBox?.variations && mongoProduct.productDataMetaBox.variations.length > 0);
  const isVariableProduct = mongoProduct.productDataMetaBox?.productType === 'variable' || hasVariants;
  
  // Priority 1: Use productDataMetaBox prices if available
  // Priority 2: For variable products, DO NOT auto-calculate from variants (let frontend handle price range)
  // Priority 3: For simple products, calculate from variants or use minPrice/maxPrice
  const regularPrice = mongoProduct.productDataMetaBox?.regularPrice !== undefined
    ? String(mongoProduct.productDataMetaBox.regularPrice)
    : isVariableProduct
    ? '0' // Variable products should not have regularPrice auto-filled from variations
    : mongoProduct.variants && mongoProduct.variants.length > 0
    ? String(Math.max(...mongoProduct.variants.map((v: any) => v.price || v.regularPrice || 0)))
    : String(mongoProduct.maxPrice || mongoProduct.minPrice || 0);
  
  const salePrice = mongoProduct.productDataMetaBox?.salePrice !== undefined
    ? String(mongoProduct.productDataMetaBox.salePrice)
    : '';
  
  const onSale = Boolean(salePrice && parseFloat(salePrice) > 0 && parseFloat(salePrice) < parseFloat(regularPrice));
  
  // Use salePrice if on sale, otherwise use regularPrice
  // If price is 0 or invalid, it will be handled by formatPrice to show "Liên hệ"
  const price = onSale ? salePrice : regularPrice;
  
  // Extract attributes from variants (priority: variants > productDataMetaBox.variations)
  // Priority 1: Use variants array (converted from productDataMetaBox.variations)
  // Priority 2: Extract from productDataMetaBox.variations if variants not available (backward compatibility)
  let sizeOptions: string[] = [];
  let colorOptions: string[] = [];
  
  if (mongoProduct.variants && mongoProduct.variants.length > 0) {
    // Use variants array (new format)
    // Filter out empty/null/undefined values
    const allSizes = mongoProduct.variants.map((v: any) => v.size).filter(Boolean);
    const allColors = mongoProduct.variants.map((v: any) => v.color).filter(Boolean);
    
    sizeOptions = [...new Set(allSizes
      .filter((size: any) => size && String(size).trim().length > 0)
      .map((size: any) => String(size).trim()))] as string[];
    colorOptions = [...new Set(allColors
      .filter((color: any) => color && String(color).trim().length > 0)
      .map((color: any) => String(color).trim()))] as string[];
    
    // Debug logging
    if (process.env.NODE_ENV === 'development' && (sizeOptions.length === 0 && colorOptions.length === 0)) {
      console.log('[mapMongoProduct] No size/color extracted from variants:', {
        productName: mongoProduct.name,
        variantsCount: mongoProduct.variants.length,
        firstVariant: mongoProduct.variants[0],
        allSizes,
        allColors,
      });
    }
  } else if (mongoProduct.productDataMetaBox?.variations && mongoProduct.productDataMetaBox.variations.length > 0) {
    // Fallback: Extract from productDataMetaBox.variations (backward compatibility)
    mongoProduct.productDataMetaBox.variations.forEach((variation: any) => {
      if (variation.attributes) {
        Object.entries(variation.attributes).forEach(([attrName, value]) => {
          const attrNameLower = attrName.toLowerCase();
          if (attrNameLower.includes('size') || attrNameLower === 'pa_size' || attrNameLower === 'kích thước') {
            const size = String(value).trim();
            if (size && size.length > 0 && !sizeOptions.includes(size)) {
              sizeOptions.push(size);
            }
          } else if (attrNameLower.includes('color') || attrNameLower === 'pa_color' || attrNameLower === 'màu') {
            const color = String(value).trim();
            if (color && color.length > 0 && !colorOptions.includes(color)) {
              colorOptions.push(color);
            }
          }
        });
      }
    });
  }
  
  // Build attributes array
  // Priority: Use productDataMetaBox.attributes if available (includes globalAttributeId)
  // Fallback: Build from variants/extracted options
  const attributes: Array<{
    id: number;
    name: string;
    options: string[];
    position: number;
    visible: boolean;
    variation: boolean;
    globalAttributeId?: string;
  }> = [];
  
  // Check if productDataMetaBox.attributes exists (new format with globalAttributeId)
  if (mongoProduct.productDataMetaBox?.attributes && mongoProduct.productDataMetaBox.attributes.length > 0) {
    // Map from productDataMetaBox.attributes (includes globalAttributeId)
    mongoProduct.productDataMetaBox.attributes.forEach((attr: any, index: number) => {
      if (attr.values && attr.values.length > 0) {
        attributes.push({
          id: index + 1,
          name: attr.name,
          options: attr.values,
          position: index,
          visible: true,
          variation: attr.usedForVariations || false,
          globalAttributeId: attr.globalAttributeId, // Include globalAttributeId
        });
      }
    });
  } else {
    // Fallback: Build from extracted options (backward compatibility)
    if (sizeOptions.length > 0) {
      attributes.push({
        id: 1,
        name: 'pa_size',
        options: sizeOptions,
        position: 0,
        visible: true,
        variation: true,
      });
    }
    
    if (colorOptions.length > 0) {
      attributes.push({
        id: 2,
        name: 'pa_color',
        options: colorOptions,
        position: 1,
        visible: true,
        variation: true,
      });
    }
    
    // Debug logging nếu không có attributes được tạo
    if (process.env.NODE_ENV === 'development' && attributes.length === 0) {
      console.log('[mapMongoProduct] No attributes created:', {
        productName: mongoProduct.name,
        hasProductDataMetaBoxAttributes: !!mongoProduct.productDataMetaBox?.attributes,
        productDataMetaBoxAttributesLength: mongoProduct.productDataMetaBox?.attributes?.length || 0,
        sizeOptionsLength: sizeOptions.length,
        colorOptionsLength: colorOptions.length,
        hasVariants: !!mongoProduct.variants,
        variantsLength: mongoProduct.variants?.length || 0,
      });
    }
  }
  
  // Determine product type (use already calculated isVariableProduct)
  const type: 'simple' | 'variable' = isVariableProduct ? 'variable' : 'simple';
  
  // Stock calculation logic:
  // For variable products: Always calculate from variants (ignore productDataMetaBox.stockQuantity)
  // For simple products: Use productDataMetaBox.stockQuantity if available
  let stockQuantity: number | null = null;
  let stockStatus: string = 'instock';
  
  if (hasVariants) {
    // Variable product: Calculate sum from variants
    // Priority 1: Sum from variants array (new format)
    if (mongoProduct.variants && mongoProduct.variants.length > 0) {
      stockQuantity = mongoProduct.variants.reduce((sum: number, v: any) => {
        // Support both 'stock' and 'stockQuantity' fields in variants
        const variantStock = v.stockQuantity !== undefined ? v.stockQuantity : (v.stock || 0);
        return sum + (variantStock || 0);
      }, 0);
      
      // Check if any variant has stock for stockStatus
      const hasStock = mongoProduct.variants.some((v: any) => {
        const variantStock = v.stockQuantity !== undefined ? v.stockQuantity : (v.stock || 0);
        return (variantStock || 0) > 0;
      });
      stockStatus = hasStock ? 'instock' : 'outofstock';
    } else if (mongoProduct.productDataMetaBox?.variations && mongoProduct.productDataMetaBox.variations.length > 0) {
      // Priority 2: Sum from productDataMetaBox.variations (backward compatibility)
      stockQuantity = mongoProduct.productDataMetaBox.variations.reduce((sum: number, v: any) => {
        const variantStock = v.stockQuantity !== undefined ? v.stockQuantity : 0;
        return sum + (variantStock || 0);
      }, 0);
      
      // Check if any variation has stock
      const hasStock = mongoProduct.productDataMetaBox.variations.some((v: any) => (v.stockQuantity || 0) > 0);
      stockStatus = hasStock ? 'instock' : 'outofstock';
    } else {
      // No variants found, use productDataMetaBox values or default
      stockQuantity = mongoProduct.productDataMetaBox?.stockQuantity !== undefined
        ? mongoProduct.productDataMetaBox.stockQuantity
        : null;
      stockStatus = mongoProduct.productDataMetaBox?.stockStatus || 'instock';
    }
    // If sum is 0, set to null
    if (stockQuantity === 0) {
      stockQuantity = null;
    }
  } else {
    // Simple product: Use productDataMetaBox.stockQuantity if available
    stockQuantity = mongoProduct.productDataMetaBox?.stockQuantity !== undefined
      ? mongoProduct.productDataMetaBox.stockQuantity
      : null;
    // Stock status: Use productDataMetaBox.stockStatus or calculate from stockQuantity
    stockStatus = mongoProduct.productDataMetaBox?.stockStatus !== undefined
      ? mongoProduct.productDataMetaBox.stockStatus
      : (stockQuantity !== null && stockQuantity > 0) ? 'instock' : 'outofstock';
  }
  
  const mappedResult = {
    id: productId, // Use MongoDB ObjectId directly (not GraphQL format)
    databaseId: productId, // Use ObjectId string as databaseId for compatibility
    name: mongoProduct.name,
    slug: mongoProduct.slug,
    price,
    regularPrice,
    salePrice,
    onSale,
    minPrice: mongoProduct.minPrice,
    maxPrice: mongoProduct.maxPrice,
    // Map images - try new structure first, fallback to old structure
    image: (() => {
      // Priority 1: Use images array if available (these are already URLs from payload)
      if (mongoProduct.images && Array.isArray(mongoProduct.images) && mongoProduct.images.length > 0) {
        const firstImageUrl = mongoProduct.images[0];
        if (firstImageUrl && typeof firstImageUrl === 'string' && firstImageUrl.length > 0) {
          return {
            id: mongoProduct._thumbnail_id || firstImageUrl,
            sourceUrl: firstImageUrl,
            altText: mongoProduct.name,
          } as any;
        }
      }
      
      // Priority 2: Use _thumbnail_id (can be URL or pathname)
      if (mongoProduct._thumbnail_id) {
        // Check if _thumbnail_id is already a full URL
        if (mongoProduct._thumbnail_id.startsWith('http://') || mongoProduct._thumbnail_id.startsWith('https://')) {
          return {
            id: mongoProduct._thumbnail_id,
            sourceUrl: mongoProduct._thumbnail_id,
            altText: mongoProduct.name,
          } as any;
        }
        // If _thumbnail_id is pathname and images array is empty, we can't resolve it
        // This should not happen if POST handler populates images array correctly
      }
      
      // No image available
      return null;
    })(),
    galleryImages: (() => {
      // Priority 1: Use _product_image_gallery (comma-separated IDs)
      if (mongoProduct._product_image_gallery) {
        const galleryIds = mongoProduct._product_image_gallery.split(',').filter(Boolean);
        const imageUrls = mongoProduct.images || [];
        
        // Map gallery IDs to image URLs
        // Try to match IDs with URLs in images array, or use images array as fallback
        return galleryIds.map((id: string, idx: number) => {
          const trimmedId = id.trim();
          let imageUrl = '';
          
          // Check if ID is already a full URL
          if (trimmedId.startsWith('http://') || trimmedId.startsWith('https://')) {
            imageUrl = trimmedId;
          } else if (imageUrls.length > idx + 1) {
            // Use corresponding image from array (skip first image which is featured)
            imageUrl = imageUrls[idx + 1];
          } else if (imageUrls.length > 0) {
            // Fallback: use any available image
            imageUrl = imageUrls[idx % imageUrls.length];
          }
          
          return {
            id: trimmedId,
            sourceUrl: imageUrl,
            altText: mongoProduct.name,
          };
        }).filter((img: { sourceUrl: string }) => img.sourceUrl) as any; // Filter out images without URL
      }
      
      // Priority 2: Use images array (old structure) - skip first image (featured)
      if (mongoProduct.images && mongoProduct.images.length > 1) {
        return mongoProduct.images.slice(1).map((img: any) => ({
          sourceUrl: img,
          altText: mongoProduct.name,
        })) as any;
      }
      
      // No gallery images
      return [];
    })(),
    description: mongoProduct.description || '',
    shortDescription: mongoProduct.shortDescription || '',
    sku: mongoProduct.productDataMetaBox?.sku || mongoProduct.sku || '',
    // Use calculated stockQuantity and stockStatus
    stockStatus,
    stockQuantity,
    weight: mongoProduct.weight ? String(mongoProduct.weight) : null,
    length: mongoProduct.length || null,
    width: mongoProduct.width || null,
    height: mongoProduct.height || null,
    volumetricWeight: mongoProduct.volumetricWeight || null,
    material: mongoProduct.material || null,
    origin: mongoProduct.origin || null,
    categories: [], // TODO: Populate from category reference
    tags: (mongoProduct.tags || []).map((tag: any, idx: number) => ({
      id: idx + 1,
      name: tag,
      slug: tag.toLowerCase().replace(/\s+/g, '-'),
    })),
    attributes: attributes.length > 0 ? attributes : undefined,
    type,
    variations: (mongoProduct.variants?.map((_: any, idx: number) => idx + 1) || 
                 mongoProduct.productDataMetaBox?.variations?.map((_: any, idx: number) => idx + 1) || []),
    status: mongoProduct.status || 'draft',
    isActive: mongoProduct.isActive !== undefined ? mongoProduct.isActive : (mongoProduct.status === 'publish'),
    // Include version for optimistic locking
    version: mongoProduct.version || 0,
  };
  
  return mappedResult;
}

/**
 * Map array of MongoDB products
 * 
 * @param mongoProducts - Array of MongoDB products
 * @returns Array of mapped products
 */
export function mapMongoProducts(mongoProducts: MongoProduct[]): MappedProduct[] {
  return mongoProducts.map(mapMongoProduct);
}

/**
 * MongoDB Category Type (from database)
 */
export interface MongoCategory {
  _id: any; // ObjectId
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null; // ObjectId as string or null
  imageUrl?: string;
  position?: number;
  count?: number;
  status?: 'active' | 'inactive'; // NEW: Default 'active'
  metaTitle?: string; // NEW: SEO title
  metaDesc?: string; // NEW: SEO description (max 500 chars)
  featured?: boolean; // NEW: Featured category for homepage (max 4)
  deletedAt?: Date | null; // NEW: Soft delete (null = not deleted)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Map MongoDB category to frontend format
 * 
 * @param mongoCategory - MongoDB category document
 * @returns Mapped category cho frontend
 */
export function mapMongoCategory(mongoCategory: MongoCategory | any): MappedCategory {
  const categoryId = mongoCategory._id.toString();
  
  // Convert parentId from ObjectId string to string (keep as string for compatibility)
  let parentId: string | null = null;
  if (mongoCategory.parentId) {
    parentId = typeof mongoCategory.parentId === 'string' 
      ? mongoCategory.parentId 
      : mongoCategory.parentId.toString();
  }
  
  return {
    id: categoryId, // Use MongoDB ObjectId directly as string
    databaseId: parseInt(categoryId, 16) || 0, // Fallback ID for backward compatibility
    name: mongoCategory.name,
    slug: mongoCategory.slug,
    count: mongoCategory.count || null,
    parentId: parentId, // Keep as string (ObjectId string)
    image: mongoCategory.imageUrl ? {
      sourceUrl: mongoCategory.imageUrl,
      altText: mongoCategory.name,
    } : null,
    status: mongoCategory.status || 'active', // Default to 'active'
    metaTitle: mongoCategory.metaTitle,
    metaDesc: mongoCategory.metaDesc,
    featured: mongoCategory.featured || false, // Default to false
    deletedAt: mongoCategory.deletedAt || null,
  };
}

/**
 * Map array of MongoDB categories
 * 
 * @param mongoCategories - Array of MongoDB categories
 * @returns Array of mapped categories
 */
export function mapMongoCategories(mongoCategories: MongoCategory[]): MappedCategory[] {
  return mongoCategories.map(mapMongoCategory);
}

