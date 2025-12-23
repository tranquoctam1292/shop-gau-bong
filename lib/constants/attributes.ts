/**
 * Product Attribute Constants
 * 
 * Centralized constants for product attribute detection.
 * Used to identify size and color attributes from product data.
 * 
 * ⚠️ IMPORTANT: These constants are for Product.attributes (from API),
 * NOT for Variation matching. MongoDB Variants match directly via
 * variation.size and variation.color fields.
 * 
 * @see components/product/ProductInfo.tsx
 * @see components/product/ProductCard.tsx
 */

/**
 * Attribute name keywords for detection
 * Supports both English and Vietnamese terms
 */
export const ATTRIBUTE_NAMES = {
  SIZE: {
    EN: ['size', 'sizes'],
    VI: ['kích thước', 'kich thuoc', 'size'],
    // WooCommerce attribute slugs
    SLUGS: ['pa_size', 'pa_kich-thuoc', 'pa_kich_thuoc'],
  },
  COLOR: {
    EN: ['color', 'colour', 'colors', 'colours'],
    VI: ['màu', 'màu sắc', 'mau', 'mau sac'],
    // WooCommerce attribute slugs
    SLUGS: ['pa_color', 'pa_mau', 'pa_colour'],
  },
} as const;

/**
 * Check if an attribute name represents a size attribute
 * 
 * ⚠️ NOTE: This is for Product.attributes detection only.
 * For Variation matching, use variation.size directly.
 * 
 * @param attrName - Attribute name to check (e.g., "Kích thước", "Size", "pa_size")
 * @returns true if the attribute is a size attribute
 * 
 * @example
 * isAttributeSize('Kích thước') // true
 * isAttributeSize('Size') // true
 * isAttributeSize('pa_size') // true
 * isAttributeSize('Màu sắc') // false
 */
export function isAttributeSize(attrName: string): boolean {
  const normalized = attrName.toLowerCase().trim();
  
  // Check against all size keywords
  const allSizeKeywords = [
    ...ATTRIBUTE_NAMES.SIZE.EN,
    ...ATTRIBUTE_NAMES.SIZE.VI,
    ...ATTRIBUTE_NAMES.SIZE.SLUGS,
  ];
  
  return allSizeKeywords.some(keyword => 
    normalized.includes(keyword.toLowerCase())
  );
}

/**
 * Check if an attribute name represents a color attribute
 * 
 * ⚠️ NOTE: This is for Product.attributes detection only.
 * For Variation matching, use variation.color directly.
 * 
 * @param attrName - Attribute name to check (e.g., "Màu sắc", "Color", "pa_color")
 * @returns true if the attribute is a color attribute
 * 
 * @example
 * isAttributeColor('Màu sắc') // true
 * isAttributeColor('Color') // true
 * isAttributeColor('pa_color') // true
 * isAttributeColor('Kích thước') // false
 */
export function isAttributeColor(attrName: string): boolean {
  const normalized = attrName.toLowerCase().trim();
  
  // Check against all color keywords
  const allColorKeywords = [
    ...ATTRIBUTE_NAMES.COLOR.EN,
    ...ATTRIBUTE_NAMES.COLOR.VI,
    ...ATTRIBUTE_NAMES.COLOR.SLUGS,
  ];
  
  return allColorKeywords.some(keyword => 
    normalized.includes(keyword.toLowerCase())
  );
}

/**
 * Get attribute type from attribute name
 * 
 * @param attrName - Attribute name to check
 * @returns 'size' | 'color' | 'other'
 * 
 * @example
 * getAttributeType('Kích thước') // 'size'
 * getAttributeType('Màu sắc') // 'color'
 * getAttributeType('Material') // 'other'
 */
export function getAttributeType(attrName: string): 'size' | 'color' | 'other' {
  if (isAttributeSize(attrName)) return 'size';
  if (isAttributeColor(attrName)) return 'color';
  return 'other';
}

/**
 * Example usage in components:
 * 
 * ```typescript
 * import { isAttributeSize, isAttributeColor } from '@/lib/constants/attributes';
 * 
 * // Find size attribute from product.attributes
 * const sizeAttribute = product.attributes?.find(attr => isAttributeSize(attr.name));
 * 
 * // Find color attribute from product.attributes
 * const colorAttribute = product.attributes?.find(attr => isAttributeColor(attr.name));
 * 
 * // Get available sizes
 * const availableSizes = sizeAttribute?.options || [];
 * 
 * // Get available colors
 * const availableColors = colorAttribute?.options || [];
 * ```
 * 
 * ⚠️ CRITICAL: For MongoDB Variation matching, DO NOT use attributes:
 * 
 * ```typescript
 * // ✅ CORRECT - Match MongoDB Variants directly
 * const matched = variations.find(v => v.size === selectedSize);
 * 
 * // ❌ WRONG - MongoDB Variants don't have attributes object
 * const matched = variations.find(v => 
 *   v.attributes.find(a => a.name === 'size')?.value === selectedSize
 * );
 * ```
 */
