/**
 * Variant ID Validator & Sanitizer
 * 
 * PHASE 2: NoSQL Injection Fix (7.12.3)
 * 
 * Helper functions để validate và sanitize variant IDs để prevent NoSQL injection attacks
 */

import { ObjectId } from '@/lib/db';

/**
 * Validate variant ID format
 * 
 * @param id - Variant ID to validate
 * @returns true nếu ID có format hợp lệ
 * 
 * Valid formats:
 * - MongoDB ObjectId (24 hex characters)
 * - Safe alphanumeric strings (letters, numbers, hyphens, underscores)
 * 
 * @example
 * isValidVariantIdFormat('507f1f77bcf86cd799439011') // true (ObjectId)
 * isValidVariantIdFormat('var-123-abc') // true (safe string)
 * isValidVariantIdFormat('var_123_abc') // true (safe string)
 * isValidVariantIdFormat('var 123') // false (contains space)
 * isValidVariantIdFormat('var$123') // false (contains special char)
 */
export function isValidVariantIdFormat(id: unknown): boolean {
  // Type check: must be string
  if (typeof id !== 'string') {
    return false;
  }
  
  // Empty string is invalid
  if (id.trim() === '') {
    return false;
  }
  
  // Check if it's a valid MongoDB ObjectId
  if (ObjectId.isValid(id)) {
    return true;
  }
  
  // Check if it's a safe alphanumeric string (letters, numbers, hyphens, underscores only)
  // Pattern: ^[a-zA-Z0-9\-_]+$
  const safeStringPattern = /^[a-zA-Z0-9\-_]+$/;
  if (safeStringPattern.test(id)) {
    return true;
  }
  
  return false;
}

/**
 * Sanitize variant ID by removing special characters
 * 
 * @param id - Variant ID to sanitize
 * @returns Sanitized ID (only alphanumeric, hyphens, underscores)
 * 
 * @example
 * sanitizeVariantId('var-123_abc') // 'var-123_abc'
 * sanitizeVariantId('var 123') // 'var123'
 * sanitizeVariantId('var$123') // 'var123'
 */
export function sanitizeVariantId(id: string): string {
  // Remove all characters except alphanumeric, hyphens, and underscores
  return id.replace(/[^a-zA-Z0-9\-_]/g, '');
}

/**
 * Validate variant ID with strict checking
 * 
 * @param id - Variant ID to validate
 * @param allowedIds - Set of allowed variant IDs (whitelist approach)
 * @returns Validation result với error message nếu invalid
 * 
 * @example
 * const allowedIds = new Set(['var-1', 'var-2']);
 * validateVariantId('var-1', allowedIds) // { valid: true }
 * validateVariantId('var-3', allowedIds) // { valid: false, error: 'Variant ID not found in product' }
 * validateVariantId('var$123', allowedIds) // { valid: false, error: 'Invalid variant ID format' }
 */
export function validateVariantId(
  id: unknown,
  allowedIds?: Set<string>
): { valid: boolean; error?: string } {
  // Type check: must be string
  if (typeof id !== 'string') {
    return {
      valid: false,
      error: 'Variant ID must be a string',
    };
  }
  
  // Format validation
  if (!isValidVariantIdFormat(id)) {
    return {
      valid: false,
      error: 'Invalid variant ID format. Must be ObjectId or alphanumeric string (letters, numbers, hyphens, underscores only)',
    };
  }
  
  // Whitelist validation (if provided)
  if (allowedIds && !allowedIds.has(id)) {
    return {
      valid: false,
      error: 'Variant ID not found in product variants',
    };
  }
  
  return { valid: true };
}

/**
 * Validate array of variant IDs
 * 
 * @param variantIds - Array of variant IDs to validate
 * @param allowedIds - Set of allowed variant IDs (whitelist approach)
 * @returns Validation result với list of invalid IDs nếu có
 * 
 * @example
 * const allowedIds = new Set(['var-1', 'var-2']);
 * validateVariantIds(['var-1', 'var-2', 'var-3'], allowedIds)
 * // { valid: false, invalidIds: ['var-3'], errors: [...] }
 */
export function validateVariantIds(
  variantIds: unknown[],
  allowedIds?: Set<string>
): { valid: boolean; invalidIds: string[]; errors: string[] } {
  const invalidIds: string[] = [];
  const errors: string[] = [];
  
  for (const id of variantIds) {
    const result = validateVariantId(id, allowedIds);
    if (!result.valid) {
      const idStr = typeof id === 'string' ? id : String(id);
      invalidIds.push(idStr);
      errors.push(`${idStr}: ${result.error}`);
    }
  }
  
  return {
    valid: invalidIds.length === 0,
    invalidIds,
    errors,
  };
}

/**
 * Extract and validate variant IDs from variant objects
 * 
 * @param variants - Array of variant objects with id field
 * @param allowedIds - Set of allowed variant IDs (whitelist approach)
 * @returns Validation result với list of invalid variant objects
 * 
 * @example
 * const variants = [{ id: 'var-1', price: 100 }, { id: 'var$123', price: 200 }];
 * const allowedIds = new Set(['var-1', 'var-2']);
 * validateVariantObjects(variants, allowedIds)
 * // { valid: false, invalidVariants: [{ id: 'var$123', price: 200 }], errors: [...] }
 */
export function validateVariantObjects(
  variants: Array<{ id: unknown; [key: string]: unknown }>,
  allowedIds?: Set<string>
): { valid: boolean; invalidVariants: Array<{ id: string; [key: string]: unknown }>; errors: string[] } {
  const invalidVariants: Array<{ id: string; [key: string]: unknown }> = [];
  const errors: string[] = [];
  
  for (const variant of variants) {
    const result = validateVariantId(variant.id, allowedIds);
    if (!result.valid) {
      const idStr = typeof variant.id === 'string' ? variant.id : String(variant.id);
      invalidVariants.push({ ...variant, id: idStr });
      errors.push(`Variant ${idStr}: ${result.error}`);
    }
  }
  
  return {
    valid: invalidVariants.length === 0,
    invalidVariants,
    errors,
  };
}

