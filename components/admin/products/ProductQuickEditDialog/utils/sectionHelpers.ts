/**
 * Section Helper Functions for ProductQuickEditDialog
 * 
 * PHASE 5.3: Extract Section Helpers
 * 
 * Utilities for:
 * - Field to section mapping
 * - Section ID constants
 * - Section-related utilities
 */

/**
 * Map field names to their corresponding section IDs
 */
export const FIELD_TO_SECTION_MAP: Record<string, string> = {
  'name': 'section-basic-info',
  'sku': 'section-basic-info',
  'barcode': 'section-basic-info',
  'gtin': 'section-basic-info',
  'ean': 'section-basic-info',
  'status': 'section-pricing',
  'regularPrice': 'section-pricing',
  'salePrice': 'section-pricing',
  'costPrice': 'section-pricing',
  'stockQuantity': 'section-pricing',
  'stockStatus': 'section-pricing',
  'manageStock': 'section-pricing',
  'lowStockThreshold': 'section-pricing',
  'backorders': 'section-pricing',
  'soldIndividually': 'section-pricing',
  'productType': 'section-product-type',
  'visibility': 'section-product-type',
  'password': 'section-product-type',
  'shippingClass': 'section-shipping',
  'taxStatus': 'section-shipping',
  'taxClass': 'section-shipping',
  'weight': 'section-dimensions',
  'length': 'section-dimensions',
  'width': 'section-dimensions',
  'height': 'section-dimensions',
  'categories': 'section-categories',
  'tags': 'section-categories',
  'seoTitle': 'section-seo',
  'seoDescription': 'section-seo',
  'slug': 'section-seo',
};

/**
 * Get section ID for a field name
 */
export function getSectionIdForField(fieldName: string): string {
  // Handle nested fields (e.g., variants.0.price -> variants)
  const baseField = fieldName.split('.')[0];
  return FIELD_TO_SECTION_MAP[baseField] || 'section-basic-info';
}

/**
 * Section ID constants
 */
export const SECTION_IDS = {
  BASIC_INFO: 'section-basic-info',
  PRICING: 'section-pricing',
  PRODUCT_TYPE: 'section-product-type',
  SHIPPING: 'section-shipping',
  DIMENSIONS: 'section-dimensions',
  CATEGORIES: 'section-categories',
  IMAGES: 'section-images',
  SEO: 'section-seo',
} as const;

/**
 * Get section display name
 */
export function getSectionDisplayName(sectionId: string): string {
  const sectionNames: Record<string, string> = {
    'section-basic-info': 'Thông tin cơ bản',
    'section-pricing': 'Giá & Trạng thái',
    'section-product-type': 'Loại sản phẩm & Hiển thị',
    'section-shipping': 'Giao hàng & Thuế',
    'section-dimensions': 'Kích thước & Trọng lượng',
    'section-categories': 'Danh mục & Thẻ',
    'section-images': 'Hình ảnh sản phẩm',
    'section-seo': 'SEO & URL',
  };
  return sectionNames[sectionId] || sectionId;
}

/**
 * Get all section IDs in order
 */
export function getAllSectionIds(): string[] {
  return [
    SECTION_IDS.BASIC_INFO,
    SECTION_IDS.PRICING,
    SECTION_IDS.PRODUCT_TYPE,
    SECTION_IDS.SHIPPING,
    SECTION_IDS.DIMENSIONS,
    SECTION_IDS.CATEGORIES,
    SECTION_IDS.IMAGES,
    SECTION_IDS.SEO,
  ];
}

