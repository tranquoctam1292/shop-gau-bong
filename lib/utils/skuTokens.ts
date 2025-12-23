/**
 * SKU Pattern Tokens
 * 
 * Supported tokens for SKU patterns.
 * This file is client-safe (no MongoDB dependencies).
 */

/**
 * Supported tokens for SKU patterns
 */
export const TOKENS = {
  CATEGORY_CODE: '{CATEGORY_CODE}',
  BRAND_CODE: '{BRAND_CODE}',
  PRODUCT_NAME: '{PRODUCT_NAME}',
  ATTRIBUTE_VALUE: '{ATTRIBUTE_VALUE}',
  YEAR: '{YEAR}',
  INCREMENT: '{INCREMENT}',
} as const;

