/**
 * SKU Validator - Pure Functions for Client-Side Use
 * 
 * This module contains pure validation functions that don't depend on MongoDB or server-side code.
 * These functions can be safely imported into client components.
 */

/**
 * Validate variant uniqueness
 * 
 * Prevents duplicate variants with identical attributes
 * 
 * Supports both:
 * - Legacy format: { size: string, color?: string }
 * - Dynamic attributes format: { attributes: Record<string, string> }
 * 
 * @param variants - Array of variants
 * @returns Validation result
 */
export function validateVariantUniqueness(
  variants: Array<{
    size?: string;
    color?: string;
    attributes?: Record<string, string>;
    [key: string]: any;
  }>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const seen = new Map<string, number>(); // Map<attributeKey, variantIndex>

  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    
    // Build unique key from attributes
    let attributeKey: string;
    
    if (variant.attributes && Object.keys(variant.attributes).length > 0) {
      // Dynamic attributes format
      const sortedEntries = Object.entries(variant.attributes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${value}`)
        .join('|');
      attributeKey = sortedEntries.toLowerCase();
    } else {
      // Legacy format (size, color)
      attributeKey = `${variant.size || ''}-${variant.color || ''}`.toLowerCase();
    }

    if (seen.has(attributeKey)) {
      const duplicateIndex = seen.get(attributeKey)!;
      const attrDescription = variant.attributes
        ? Object.entries(variant.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')
        : `Size: ${variant.size || 'N/A'}, Màu: ${variant.color || 'N/A'}`;
      
      errors.push(
        `Biến thể ${i + 1} trùng lặp với biến thể ${duplicateIndex + 1} (${attrDescription})`
      );
    } else {
      seen.set(attributeKey, i);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

