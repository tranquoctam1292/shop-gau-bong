/**
 * Field State Helper Functions for ProductQuickEditDialog
 * 
 * PHASE 5.2: Extract Field State Helpers
 * 
 * Utilities for:
 * - Field state management
 * - Field ID generation
 * - Field validation utilities
 */

/**
 * Generate field ID from field name
 * Used for form field IDs and error linking
 */
export function getFieldId(fieldName: string): string {
  // Handle nested fields (e.g., variants.0.price -> quick-edit-variants-0-price)
  const normalizedField = fieldName.replace(/\./g, '-').replace(/\[|\]/g, '-');
  return `quick-edit-${normalizedField}`;
}

/**
 * Extract base field name from nested field path
 * Example: "variants.0.price" -> "variants"
 */
export function getBaseFieldName(fieldName: string): string {
  return fieldName.split('.')[0];
}

/**
 * Check if field is a variant field
 */
export function isVariantField(fieldName: string): boolean {
  return fieldName.startsWith('variants.');
}

/**
 * Extract variant index from field name
 * Example: "variants.0.price" -> 0
 */
export function getVariantIndex(fieldName: string): number | null {
  const match = fieldName.match(/variants\.(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Extract variant field name from nested path
 * Example: "variants.0.price" -> "price"
 */
export function getVariantFieldName(fieldName: string): string | null {
  const match = fieldName.match(/variants\.\d+\.(.+)/);
  return match ? match[1] : null;
}

