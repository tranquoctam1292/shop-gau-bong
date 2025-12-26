/**
 * Form Helper Functions for ProductQuickEditDialog
 * 
 * PHASE 5.1: Extract Form Helpers
 * 
 * Pure utility functions for:
 * - Value formatting for display
 * - Form state snapshot creation
 * - Field comparison utilities
 */

import type { QuickEditFormData } from '../types';

/**
 * Format a value for display in UI
 * Handles null, undefined, boolean, number, array, object types
 */
export function formatValueForDisplay(value: unknown): string {
  if (value === null || value === undefined) return '(trống)';
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  if (typeof value === 'number') {
    if (value === 0) return '0';
    return value.toLocaleString('vi-VN');
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '(trống)';
    return value.map((v: unknown) => {
      if (typeof v === 'object' && v !== null && 'name' in v) {
        return String((v as { name: string }).name);
      }
      return String(v);
    }).join(', ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Format price value for display
 */
export function formatPriceValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '(trống)';
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(numValue)) return '(trống)';
  return `${numValue.toLocaleString('vi-VN')} đ`;
}

/**
 * Create a snapshot of form state for comparison/undo-redo
 */
export function createFormStateSnapshot(
  getValues: () => QuickEditFormData,
  watchedValues: {
    selectedCategories?: string[];
    selectedTags?: string[];
    featuredImageId?: string;
    galleryImageIds?: string;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    lowStockThreshold?: number;
  }
): QuickEditFormData {
  const values = getValues();
  return {
    ...values,
    // Include watched values that might not be in getValues()
    categories: watchedValues.selectedCategories || [],
    tags: watchedValues.selectedTags || [],
    _thumbnail_id: watchedValues.featuredImageId,
    _product_image_gallery: watchedValues.galleryImageIds,
    weight: watchedValues.weight,
    length: watchedValues.length,
    width: watchedValues.width,
    height: watchedValues.height,
    lowStockThreshold: watchedValues.lowStockThreshold,
  };
}

/**
 * Field definitions for comparison
 */
export interface ComparisonField {
  key: keyof QuickEditFormData | string;
  label: string;
  format?: (value: unknown) => string;
}

/**
 * Get all fields to compare in version comparison
 */
export function getComparisonFields(): ComparisonField[] {
  return [
    { key: 'name', label: 'Tên sản phẩm' },
    { key: 'sku', label: 'SKU' },
    { key: 'status', label: 'Trạng thái' },
    { key: 'regularPrice', label: 'Giá gốc', format: formatPriceValue },
    { key: 'salePrice', label: 'Giá khuyến mãi', format: formatPriceValue },
    { key: 'costPrice', label: 'Giá vốn', format: formatPriceValue },
    { key: 'stockQuantity', label: 'Số lượng tồn kho' },
    { key: 'stockStatus', label: 'Trạng thái kho' },
    { key: 'manageStock', label: 'Quản lý kho' },
    { key: 'weight', label: 'Trọng lượng (kg)' },
    { key: 'length', label: 'Chiều dài (cm)' },
    { key: 'width', label: 'Chiều rộng (cm)' },
    { key: 'height', label: 'Chiều cao (cm)' },
    { key: 'lowStockThreshold', label: 'Ngưỡng tồn kho thấp' },
    { key: 'categories', label: 'Danh mục' },
    { key: 'tags', label: 'Thẻ' },
    { key: 'seoTitle', label: 'SEO Title' },
    { key: 'seoDescription', label: 'SEO Description' },
    { key: 'slug', label: 'URL Slug' },
    { key: 'productType', label: 'Loại sản phẩm' },
    { key: 'visibility', label: 'Hiển thị' },
    { key: 'shippingClass', label: 'Hạng vận chuyển' },
    { key: 'taxStatus', label: 'Trạng thái thuế' },
    { key: 'taxClass', label: 'Hạng thuế' },
    { key: 'barcode', label: 'Barcode' },
    { key: 'gtin', label: 'GTIN' },
    { key: 'ean', label: 'EAN' },
    { key: 'soldIndividually', label: 'Bán riêng lẻ' },
    { key: 'backorders', label: 'Cho phép đặt hàng khi hết' },
  ];
}

/**
 * Check if a field value has changed between two form states
 */
export function hasFieldChanged(
  fieldKey: string,
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
  normalizeValue: (value: unknown) => unknown
): boolean {
  const oldVal = oldData[fieldKey];
  const newVal = newData[fieldKey];
  
  if (Array.isArray(oldVal) && Array.isArray(newVal)) {
    return JSON.stringify(oldVal) !== JSON.stringify(newVal);
  }
  
  const normalizedOld = normalizeValue(oldVal);
  const normalizedNew = normalizeValue(newVal);
  return normalizedOld !== normalizedNew;
}

