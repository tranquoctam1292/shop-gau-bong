/**
 * Product Mapper Utility
 * 
 * Map WooCommerce REST API product format sang frontend format
 * để đảm bảo tương thích với components hiện tại
 */

import type { WooCommerceProduct } from '@/types/woocommerce';
import { getMetaValue } from '@/lib/api/woocommerce';

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
  image: {
    sourceUrl: string;
    altText: string;
  } | null;
  galleryImages: Array<{
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
  }>;
  // Product type: simple, variable, grouped, external
  type?: 'simple' | 'variable' | 'grouped' | 'external';
  // Variation IDs (for variable products)
  variations?: number[];
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
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  count: number | null;
  parentId: number | null; // Parent category ID (0 = top-level)
  image: {
    sourceUrl: string;
    altText: string;
  } | null;
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
    parentId: wcCategory.parent !== undefined ? wcCategory.parent : null, // 0 = top-level, null = not provided
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
  images: string[]; // Array of image URLs
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
  
  // Calculate price from variants or use minPrice
  const price = mongoProduct.variants && mongoProduct.variants.length > 0
    ? String(Math.min(...mongoProduct.variants.map(v => v.price)))
    : String(mongoProduct.minPrice || 0);
  
  const maxPrice = mongoProduct.maxPrice || mongoProduct.minPrice;
  const regularPrice = String(maxPrice || mongoProduct.minPrice || 0);
  
  // Extract attributes from variants
  const sizeOptions = mongoProduct.variants
    ? [...new Set(mongoProduct.variants.map(v => v.size).filter(Boolean))]
    : [];
  const colorOptions = mongoProduct.variants
    ? [...new Set(mongoProduct.variants.map(v => v.color).filter(Boolean))]
    : [];
  
  // Build attributes array
  const attributes: Array<{
    id: number;
    name: string;
    options: string[];
    position: number;
    visible: boolean;
    variation: boolean;
  }> = [];
  
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
  
  // Determine product type
  const type: 'simple' | 'variable' = mongoProduct.variants && mongoProduct.variants.length > 0
    ? 'variable'
    : 'simple';
  
  return {
    id: `gid://shop-gau-bong/Product/${productId}`,
    databaseId: parseInt(productId, 16) || 0, // Fallback ID
    name: mongoProduct.name,
    slug: mongoProduct.slug,
    price,
    regularPrice,
    salePrice: '', // TODO: Add sale price support
    onSale: false, // TODO: Add sale price support
    image: mongoProduct.images?.[0] ? {
      sourceUrl: mongoProduct.images[0],
      altText: mongoProduct.name,
    } : null,
    galleryImages: mongoProduct.images?.slice(1).map(img => ({
      sourceUrl: img,
      altText: mongoProduct.name,
    })) || [],
    description: mongoProduct.description || '',
    shortDescription: mongoProduct.shortDescription || '',
    sku: mongoProduct.sku || '',
    stockStatus: mongoProduct.variants && mongoProduct.variants.length > 0
      ? mongoProduct.variants.some(v => (v.stock || 0) > 0) ? 'instock' : 'outofstock'
      : 'instock',
    stockQuantity: mongoProduct.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || null,
    weight: mongoProduct.weight ? String(mongoProduct.weight) : null,
    length: mongoProduct.length || null,
    width: mongoProduct.width || null,
    height: mongoProduct.height || null,
    volumetricWeight: mongoProduct.volumetricWeight || null,
    material: mongoProduct.material || null,
    origin: mongoProduct.origin || null,
    categories: [], // TODO: Populate from category reference
    tags: (mongoProduct.tags || []).map((tag, idx) => ({
      id: idx + 1,
      name: tag,
      slug: tag.toLowerCase().replace(/\s+/g, '-'),
    })),
    attributes: attributes.length > 0 ? attributes : undefined,
    type,
    variations: mongoProduct.variants?.map((_, idx) => idx + 1) || [],
  };
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
  
  return {
    id: `gid://shop-gau-bong/ProductCategory/${categoryId}`,
    databaseId: parseInt(categoryId, 16) || 0, // Fallback ID
    name: mongoCategory.name,
    slug: mongoCategory.slug,
    count: mongoCategory.count || null,
    parentId: mongoCategory.parentId ? parseInt(mongoCategory.parentId, 16) || 0 : null,
    image: mongoCategory.imageUrl ? {
      sourceUrl: mongoCategory.imageUrl,
      altText: mongoCategory.name,
    } : null,
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

