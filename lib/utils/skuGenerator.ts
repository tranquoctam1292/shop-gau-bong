/**
 * Smart SKU Generator
 * 
 * Core logic for generating SKUs based on configurable patterns
 * 
 * Features:
 * - Pattern-based SKU generation with tokens
 * - Two-path approach: with/without {INCREMENT} token
 * - Atomic increment using skuCounters collection
 * - Abbreviation lookup and auto-generation
 * - Duplicate handling with retry limit
 * - SKU normalization for case-insensitive checking
 */

import { getCollections, ObjectId } from '@/lib/db';
import { generateSlug } from './slug';
import type { SkuCounter, SkuAbbreviation } from '@/types/mongodb';
import { TOKENS } from './skuTokens';

// Re-export TOKENS for backward compatibility
export { TOKENS };

/**
 * Dynamic attributes structure
 */
export interface AttributePair {
  key: string; // e.g., 'size', 'color', 'material', 'capacity'
  value: string; // e.g., 'L', 'Red', 'Cotton', '500GB'
}

/**
 * Context for SKU generation
 */
export interface SkuContext {
  categoryCode?: string; // Category code (e.g., "GAU-BONG")
  categoryId?: string; // Category ObjectId (for abbreviation lookup)
  brandCode?: string; // Optional, returns empty if not provided
  productName?: string;
  attributes?: AttributePair[]; // Dynamic attributes array
  year?: number;
}

/**
 * Normalize SKU for duplicate checking
 * - Uppercase
 * - Remove special characters
 * - Trim
 * 
 * @example
 * normalizeSku("AT-RED-L-001") // "ATREDL001"
 */
export function normalizeSku(sku: string): string {
  if (!sku || typeof sku !== 'string') {
    return '';
  }
  
  return sku
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') // Remove all non-alphanumeric
    .trim();
}

/**
 * Get abbreviation for a value
 * 
 * Logic:
 * 1. Check skuAbbreviations collection by type and originalValue
 * 2. If found → return shortCode
 * 3. If not found → auto-generate: slugify + uppercase + take first 3 chars
 * 
 * @param type - 'ATTRIBUTE' (Category codes are in categories.code)
 * @param originalValue - Original value (e.g., "Màu Đỏ", "Size L")
 * @param categoryId - Optional: category-specific mapping
 */
export async function getAbbreviation(
  type: 'ATTRIBUTE',
  originalValue: string,
  categoryId?: string
): Promise<string> {
  if (!originalValue || typeof originalValue !== 'string') {
    return '';
  }

  const collections = await getCollections();

  // Try to find in abbreviation dictionary
  const query: any = {
    type: type,
    originalValue: originalValue.trim(),
  };

  if (categoryId) {
    query.categoryId = categoryId;
  }

  const abbreviation = await collections.skuAbbreviations.findOne(query);

  if (abbreviation) {
    return abbreviation.shortCode.toUpperCase();
  }

  // Auto-generate: slugify + uppercase + take first 3 chars
  const slug = generateSlug(originalValue);
  const code = slug.toUpperCase().substring(0, 3);
  return code || 'XXX'; // Fallback
}

/**
 * Get category code from categories collection
 * 
 * @param categoryId - Category ObjectId
 * @returns Category code (required field)
 */
export async function getCategoryCode(categoryId: string): Promise<string> {
  if (!categoryId) {
    throw new Error('Category ID is required');
  }

  const collections = await getCollections();
  
  const category = await collections.categories.findOne({
    _id: new ObjectId(categoryId),
  });

  if (!category) {
    throw new Error(`Category not found: ${categoryId}`);
  }

  if (!category.code) {
    throw new Error(`Category ${categoryId} does not have code field. Please run migration script first.`);
  }

  return category.code;
}

/**
 * Get next increment number using atomic operation
 * 
 * Uses skuCounters collection for atomic increment
 * 
 * @param counterKey - Base SKU key (e.g., "CAT-AO-THUN")
 * @returns Next sequence number
 */
export async function getNextIncrement(counterKey: string): Promise<number> {
  if (!counterKey || typeof counterKey !== 'string') {
    throw new Error('Counter key is required');
  }

  const collections = await getCollections();

  // Try to get existing counter first
  const existing = await collections.skuCounters.findOne({ key: counterKey });

  if (existing) {
    // Update existing counter
    const result = await collections.skuCounters.findOneAndUpdate(
      { key: counterKey },
      {
        $inc: { sequence: 1 },
        $set: { updatedAt: new Date() },
      },
      {
        returnDocument: 'after',
      }
    );

    if (!result) {
      throw new Error('Failed to increment counter');
    }

    return result.sequence;
  } else {
    // Create new counter starting at 1
    const result = await collections.skuCounters.findOneAndUpdate(
      { key: counterKey },
      {
        $setOnInsert: {
          key: counterKey,
          sequence: 1,
          updatedAt: new Date(),
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
      }
    );

    if (!result) {
      throw new Error('Failed to create counter');
    }

    return result.sequence || 1;
  }
}

/**
 * Parse pattern and replace tokens
 * 
 * @param pattern - Pattern string (e.g., "{CATEGORY_CODE}-{PRODUCT_NAME}-{INCREMENT}")
 * @param context - Context values for tokens
 * @param separator - Separator character (default: "-")
 * @param caseType - Case type (default: "UPPER")
 * @param increment - Increment number (for {INCREMENT} token)
 */
export function parsePattern(
  pattern: string,
  context: SkuContext,
  separator: string = '-',
  caseType: 'UPPER' | 'LOWER' = 'UPPER',
  increment?: number
): string {
  if (!pattern || typeof pattern !== 'string') {
    return '';
  }

  let result = pattern;

  // Replace {CATEGORY_CODE}
  if (result.includes(TOKENS.CATEGORY_CODE)) {
    const categoryCode = context.categoryCode || '';
    result = result.replace(TOKENS.CATEGORY_CODE, categoryCode);
  }

  // Replace {BRAND_CODE}
  if (result.includes(TOKENS.BRAND_CODE)) {
    const brandCode = context.brandCode || '';
    result = result.replace(TOKENS.BRAND_CODE, brandCode);
  }

  // Replace {PRODUCT_NAME}
  if (result.includes(TOKENS.PRODUCT_NAME)) {
    let productName = context.productName || '';
    // Remove special characters and slugify
    productName = generateSlug(productName).toUpperCase();
    // Take first 10 chars
    productName = productName.substring(0, 10);
    // Replace all occurrences
    result = result.replace(new RegExp(TOKENS.PRODUCT_NAME.replace(/[{}]/g, '\\$&'), 'g'), productName);
  }

  // Replace {ATTRIBUTE_VALUE}
  // Note: Values should already be processed with abbreviations before calling parsePattern
  if (result.includes(TOKENS.ATTRIBUTE_VALUE)) {
    let attributeValue = '';
    if (context.attributes && context.attributes.length > 0) {
      // Combine all attribute values (should already be abbreviations)
      const values = context.attributes.map((attr) => attr.value);
      attributeValue = values.join(separator);
    }
    // Replace all occurrences
    result = result.replace(new RegExp(TOKENS.ATTRIBUTE_VALUE.replace(/[{}]/g, '\\$&'), 'g'), attributeValue);
  }

  // Replace {YEAR}
  if (result.includes(TOKENS.YEAR)) {
    const year = context.year || new Date().getFullYear();
    const yearShort = year.toString().substring(2); // 2025 -> 25
    result = result.replace(TOKENS.YEAR, yearShort);
  }

  // Replace {INCREMENT}
  if (result.includes(TOKENS.INCREMENT)) {
    const incrementStr = increment !== undefined 
      ? increment.toString().padStart(3, '0') // 001, 002, etc.
      : '###'; // Placeholder for preview
    result = result.replace(TOKENS.INCREMENT, incrementStr);
  }

  // Apply case type
  if (caseType === 'UPPER') {
    result = result.toUpperCase();
  } else if (caseType === 'LOWER') {
    result = result.toLowerCase();
  }

  // Clean up: remove multiple separators, trim
  result = result
    .replace(new RegExp(`\\${separator}+`, 'g'), separator) // Remove multiple separators
    .replace(new RegExp(`^\\${separator}|\\${separator}$`, 'g'), ''); // Remove leading/trailing separators

  return result;
}

/**
 * Check if SKU exists in database
 * 
 * @param skuNormalized - Normalized SKU
 * @param excludeProductId - Product ID to exclude (for update case)
 * @param isVariant - Whether checking variant SKU
 */
async function skuExists(
  skuNormalized: string,
  excludeProductId?: string,
  isVariant: boolean = false
): Promise<boolean> {
  if (!skuNormalized) {
    return false;
  }

  const collections = await getCollections();

  if (isVariant) {
    // Check in variants array
    const query: any = {
      'variants.sku_normalized': skuNormalized,
    };

    if (excludeProductId) {
      query._id = { $ne: new ObjectId(excludeProductId) };
    }

    const product = await collections.products.findOne(query);
    return !!product;
  } else {
    // Check product level SKU
    const query: any = {
      sku_normalized: skuNormalized,
    };

    if (excludeProductId) {
      query._id = { $ne: new ObjectId(excludeProductId) };
    }

    const product = await collections.products.findOne(query);
    return !!product;
  }
}

/**
 * Generate SKU with {INCREMENT} token (Path 1)
 * 
 * Logic:
 * 1. Parse static tokens → base SKU (without increment)
 * 2. Create counterKey from base SKU
 * 3. Atomic increment → get next sequence
 * 4. Combine → final SKU
 * 5. Optional: Final check for edge cases
 */
async function generateSkuWithIncrement(
  pattern: string,
  context: SkuContext,
  separator: string,
  caseType: 'UPPER' | 'LOWER',
  excludeProductId?: string,
  isVariant: boolean = false
): Promise<string> {
  // Step 1: Parse static tokens (without increment) → base SKU
  // Need to process attributes with abbreviations first
  let processedContext = { ...context };
  
  // Process attributes: replace values with abbreviations
  if (context.attributes && context.attributes.length > 0) {
    const processedAttributes: AttributePair[] = [];
    for (const attr of context.attributes) {
      // Use categoryId (ObjectId) for abbreviation lookup, not categoryCode
      const abbreviation = await getAbbreviation('ATTRIBUTE', attr.value, context.categoryId);
      processedAttributes.push({
        key: attr.key,
        value: abbreviation,
      });
    }
    processedContext.attributes = processedAttributes;
  }
  
  const baseSkuPattern = pattern.replace(TOKENS.INCREMENT, '').replace(/[-_\.]+$/, ''); // Remove INCREMENT token
  const baseSku = parsePattern(baseSkuPattern, processedContext, separator, caseType);
  
  // Step 2: Create counterKey (normalized base SKU)
  const counterKey = normalizeSku(baseSku) || baseSku;

  // Step 3: Atomic increment
  const increment = await getNextIncrement(counterKey);

  // Step 4: Generate final SKU with increment
  let finalSku = parsePattern(pattern, processedContext, separator, caseType, increment);
  let skuNormalized = normalizeSku(finalSku);

  // Step 5: Optional final check (catch edge cases like manual insert)
  const exists = await skuExists(skuNormalized, excludeProductId, isVariant);
  if (exists) {
    // Edge case: manual insert conflict
    // Try with incremented counter again
    const newIncrement = await getNextIncrement(counterKey);
    finalSku = parsePattern(pattern, processedContext, separator, caseType, newIncrement);
    skuNormalized = normalizeSku(finalSku);
  }

  return finalSku;
}

/**
 * Generate SKU without {INCREMENT} token (Path 2)
 * 
 * Logic:
 * 1. Parse pattern → base SKU (with abbreviations)
 * 2. Check DB for duplicates
 * 3. If NOT duplicate → return base SKU
 * 4. If duplicate → fallback: use counter with suffix
 */
async function generateSkuWithoutIncrement(
  pattern: string,
  context: SkuContext,
  separator: string,
  caseType: 'UPPER' | 'LOWER',
  excludeProductId?: string,
  isVariant: boolean = false,
  maxRetries: number = 5
): Promise<string> {
  // Step 1: Process attributes with abbreviations
  let processedContext = { ...context };
  
  if (context.attributes && context.attributes.length > 0) {
    const processedAttributes: AttributePair[] = [];
    for (const attr of context.attributes) {
      // Use categoryId (ObjectId) for abbreviation lookup, not categoryCode
      const abbreviation = await getAbbreviation('ATTRIBUTE', attr.value, context.categoryId);
      processedAttributes.push({
        key: attr.key,
        value: abbreviation,
      });
    }
    processedContext.attributes = processedAttributes;
  }
  
  // Parse pattern → base SKU
  let baseSku = parsePattern(pattern, processedContext, separator, caseType);
  let skuNormalized = normalizeSku(baseSku);

  // Step 2: Check DB
  const exists = await skuExists(skuNormalized, excludeProductId, isVariant);

  if (!exists) {
    // Step 3: Not duplicate → return base SKU
    return baseSku;
  }

  // Step 4: Duplicate → fallback with counter
  const counterKey = skuNormalized || baseSku;
  let attempts = 0;

  while (attempts < maxRetries) {
    const increment = await getNextIncrement(counterKey);
    const suffix = increment.toString().padStart(2, '0'); // 01, 02, etc.
    const fallbackSku = `${baseSku}${separator}${suffix}`;
    const fallbackNormalized = normalizeSku(fallbackSku);

    const fallbackExists = await skuExists(fallbackNormalized, excludeProductId, isVariant);
    if (!fallbackExists) {
      return fallbackSku;
    }

    attempts++;
  }

  // Max retries exceeded
  throw new Error(
    `Failed to generate unique SKU after ${maxRetries} attempts. Please check pattern configuration.`
  );
}

/**
 * Main SKU generation function
 * 
 * Uses two-path approach based on whether pattern contains {INCREMENT} token
 * 
 * @param pattern - SKU pattern
 * @param context - Context values
 * @param separator - Separator (default: "-")
 * @param caseType - Case type (default: "UPPER")
 * @param excludeProductId - Product ID to exclude (for update)
 * @param isVariant - Whether generating variant SKU
 * @param previewMode - If true, returns placeholder for {INCREMENT} (for UI preview)
 */
export async function generateSku(
  pattern: string,
  context: SkuContext,
  separator: string = '-',
  caseType: 'UPPER' | 'LOWER' = 'UPPER',
  excludeProductId?: string,
  isVariant: boolean = false,
  previewMode: boolean = false
): Promise<string> {
  if (!pattern || typeof pattern !== 'string') {
    throw new Error('Pattern is required');
  }

  const hasIncrement = pattern.includes(TOKENS.INCREMENT);

  if (previewMode && hasIncrement) {
    // Preview mode: return placeholder for {INCREMENT}
    return parsePattern(pattern, context, separator, caseType, undefined); // increment = undefined → shows ###
  }

  if (hasIncrement) {
    // Path 1: Pattern with {INCREMENT}
    return generateSkuWithIncrement(
      pattern,
      context,
      separator,
      caseType,
      excludeProductId,
      isVariant
    );
  } else {
    // Path 2: Pattern without {INCREMENT}
    return generateSkuWithoutIncrement(
      pattern,
      context,
      separator,
      caseType,
      excludeProductId,
      isVariant
    );
  }
}

/**
 * Re-export validateVariantUniqueness from skuValidator for backward compatibility
 * 
 * Note: This function is a pure function that doesn't depend on MongoDB.
 * Client components should import directly from '@/lib/utils/skuValidator' to avoid bundling MongoDB.
 */
export { validateVariantUniqueness } from './skuValidator';

/**
 * Get SKU pattern for category (category-specific or global)
 * 
 * @param categoryId - Category ID (optional, if null returns global pattern)
 * @returns SKU setting (pattern, separator, caseType) or default
 */
export async function getSkuPattern(categoryId?: string | null): Promise<{
  pattern: string;
  separator: string;
  caseType: 'UPPER' | 'LOWER';
}> {
  const collections = await getCollections();

  // Default pattern
  const defaultPattern = {
    pattern: '{CATEGORY_CODE}-{PRODUCT_NAME}-{INCREMENT}',
    separator: '-',
    caseType: 'UPPER' as const,
  };

  // Try to get category-specific pattern first
  if (categoryId) {
    const categorySetting = await collections.skuSettings.findOne({
      categoryId: categoryId,
    });

    if (categorySetting) {
      return {
        pattern: categorySetting.pattern || defaultPattern.pattern,
        separator: categorySetting.separator || defaultPattern.separator,
        caseType: categorySetting.caseType || defaultPattern.caseType,
      };
    }
  }

  // Fallback to global pattern
  const globalSetting = await collections.skuSettings.findOne({
    categoryId: null,
  });

  if (globalSetting) {
    return {
      pattern: globalSetting.pattern || defaultPattern.pattern,
      separator: globalSetting.separator || defaultPattern.separator,
      caseType: globalSetting.caseType || defaultPattern.caseType,
    };
  }

  // Return default if no settings found
  return defaultPattern;
}

/**
 * Log SKU change to history
 * 
 * @param productId - Product ObjectId
 * @param oldSku - Previous SKU
 * @param newSku - New SKU
 * @param reason - Reason for change
 * @param patternUsed - Pattern used to generate new SKU
 * @param variantId - Variant ID (if variant SKU)
 * @param changedBy - Admin user ID
 */
export async function logSkuChange(
  productId: string,
  oldSku: string,
  newSku: string,
  reason: 'regenerate' | 'manual' | 'bulk_import',
  patternUsed?: string,
  variantId?: string,
  changedBy?: string
): Promise<void> {
  if (!productId || !oldSku || !newSku) {
    return; // Skip logging if missing required fields
  }

  const collections = await getCollections();

  await collections.skuHistory.insertOne({
    productId: productId,
    variantId: variantId || undefined,
    oldSku: oldSku,
    newSku: newSku,
    patternUsed: patternUsed || undefined,
    reason: reason,
    changedBy: changedBy || undefined,
    changedAt: new Date(),
  });
}

