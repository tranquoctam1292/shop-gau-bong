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

